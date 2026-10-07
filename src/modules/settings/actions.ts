'use server'

import { revalidatePath } from 'next/cache'
import { and, eq, ne } from 'drizzle-orm'
import { cookies } from 'next/headers'
import { z } from 'zod'
import { getDb, schema } from '@/db/client'
import { newId } from '@/lib/ids'
import { SESSION_COOKIE, requireUser, sha256 } from '@/modules/auth/session'
import { hashPassword, verifyPassword } from '@/modules/auth/password'
import { PASSWORD_RULES } from '@/modules/auth/validation'
import { CURRENCIES, type Currency } from '@/lib/format'
import { PREFS_COOKIE, type Prefs } from './prefs'

type R = { ok: true; message?: string } | { ok: false; error: string }
const done = () => revalidatePath('/', 'layout')

export async function updateProfileAction(name: string): Promise<R> {
  const user = await requireUser()
  const n = z.string().trim().min(2).max(60).safeParse(name)
  if (!n.success) return { ok: false, error: 'El nombre tiene que tener entre 2 y 60 caracteres' }
  await (await getDb()).update(schema.users).set({ name: n.data }).where(eq(schema.users.id, user.id))
  done()
  return { ok: true }
}

export async function updateNumbersAction(input: { initialBalanceCents?: number; microThresholdCents?: number }): Promise<R> {
  const user = await requireUser()
  const p = z.object({ initialBalanceCents: z.number().int().min(-1e13).max(1e13).optional(), microThresholdCents: z.number().int().min(100_00).max(1_000_000_00).optional() }).safeParse(input)
  if (!p.success) return { ok: false, error: 'Valor fuera de rango' }
  await (await getDb()).update(schema.users).set(p.data).where(eq(schema.users.id, user.id))
  done()
  return { ok: true }
}

const prefsSchema = z.object({
  currency: z.enum(Object.keys(CURRENCIES) as [Currency, ...Currency[]]),
  theme: z.enum(['dark', 'light', 'system']),
  hideAmounts: z.boolean(),
  decimals: z.boolean(),
  tips: z.boolean(),
  language: z.literal('es-AR'),
})

/** moneda en el usuario (viaja con la cuenta); el resto en una cookie por dispositivo */
export async function updatePreferencesAction(input: Prefs & { currency: Currency }): Promise<R> {
  const user = await requireUser()
  const p = prefsSchema.safeParse(input)
  if (!p.success) return { ok: false, error: 'Preferencias inválidas' }
  const { currency, ...prefs } = p.data
  if (currency !== user.currency) await (await getDb()).update(schema.users).set({ currency }).where(eq(schema.users.id, user.id))
  ;(await cookies()).set(PREFS_COOKIE, JSON.stringify(prefs), { path: '/', maxAge: 60 * 60 * 24 * 365, sameSite: 'lax', httpOnly: false })
  done()
  return { ok: true }
}

export async function changePasswordAction(current: string, next: string): Promise<R> {
  const user = await requireUser()
  if (!(await verifyPassword(current, user.passwordHash))) return { ok: false, error: 'La contraseña actual no es correcta' }
  const failed = PASSWORD_RULES.filter((r) => !r.test(next))
  if (failed.length) return { ok: false, error: 'La contraseña nueva no cumple los requisitos' }
  const db = await getDb()
  await db.update(schema.users).set({ passwordHash: await hashPassword(next) }).where(eq(schema.users.id, user.id))
  // cierra las otras sesiones, mantiene esta
  const token = (await cookies()).get(SESSION_COOKIE)?.value
  if (token) await db.delete(schema.sessions).where(and(eq(schema.sessions.userId, user.id), ne(schema.sessions.id, sha256(token))))
  return { ok: true, message: 'Contraseña actualizada. Cerramos tus otras sesiones.' }
}

export async function closeOtherSessionsAction(): Promise<R> {
  const user = await requireUser()
  const token = (await cookies()).get(SESSION_COOKIE)?.value
  if (!token) return { ok: false, error: 'Sin sesión' }
  await (await getDb()).delete(schema.sessions).where(and(eq(schema.sessions.userId, user.id), ne(schema.sessions.id, sha256(token))))
  done()
  return { ok: true, message: 'Cerramos las demás sesiones.' }
}

const catSchema = z.object({ name: z.string().trim().min(2).max(40), kind: z.enum(['expense', 'income']), icon: z.string().max(40), parentId: z.string().nullable() })

export async function saveCategoryAction(input: z.input<typeof catSchema>, id?: string): Promise<R> {
  const user = await requireUser()
  const p = catSchema.safeParse(input)
  if (!p.success) return { ok: false, error: 'Nombre inválido (2 a 40 caracteres)' }
  const db = await getDb()
  if (id) {
    await db.update(schema.categories).set({ name: p.data.name, icon: p.data.icon }).where(and(eq(schema.categories.id, id), eq(schema.categories.userId, user.id)))
  } else {
    if (p.data.parentId) {
      const parent = await db.select().from(schema.categories).where(and(eq(schema.categories.id, p.data.parentId), eq(schema.categories.userId, user.id))).limit(1)
      if (!parent[0]) return { ok: false, error: 'Categoría padre inválida' }
    }
    await db.insert(schema.categories).values({ id: newId(), userId: user.id, name: p.data.name, kind: p.data.kind, icon: p.data.icon, parentId: p.data.parentId, sortOrder: 999 })
  }
  done()
  return { ok: true }
}

export async function listSessionsCount() {
  const user = await requireUser()
  const rows = await (await getDb()).select({ id: schema.sessions.id }).from(schema.sessions).where(eq(schema.sessions.userId, user.id))
  return rows.length
}
