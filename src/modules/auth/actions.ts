'use server'

import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { and, eq, gt, isNull } from 'drizzle-orm'
import { randomBytes } from 'node:crypto'
import { getDb, schema } from '@/db/client'
import { newId } from '@/lib/ids'
import { todayISO } from '@/modules/analytics/dates'
import { seedDemoFinance, connectDemoIntegration } from '@/modules/demo/seed'
import { DEMO_EMAIL } from '@/modules/demo/constants'
import { sendPasswordReset } from '@/modules/email/send'
import { hashPassword, verifyPassword } from './password'
import { rateLimit } from './rate-limit'
import { createSession, destroyAllSessions, destroySession, sha256 } from './session'
import { createUser, findUserByEmail } from './users'
import { type FieldErrors, flattenErrors, forgotSchema, loginSchema, registerSchema, resetSchema } from './validation'

export type FormState = { ok?: boolean; message?: string; errors?: FieldErrors; values?: Record<string, string>; devLink?: string }

async function clientKey() {
  const h = await headers()
  return h.get('x-forwarded-for')?.split(',')[0]?.trim() || h.get('x-real-ip') || 'local'
}

const safeNext = (v: FormDataEntryValue | null) => {
  const s = typeof v === 'string' ? v : ''
  return s.startsWith('/') && !s.startsWith('//') ? s : '/inicio'
}

export async function registerAction(_: FormState, form: FormData): Promise<FormState> {
  const raw = { name: String(form.get('name') ?? ''), email: String(form.get('email') ?? ''), password: String(form.get('password') ?? '') }
  const values = { name: raw.name, email: raw.email }
  const parsed = registerSchema.safeParse(raw)
  if (!parsed.success) return { errors: flattenErrors(parsed.error), values }

  const limit = rateLimit(`register:${await clientKey()}`, 5, 60 * 60_000)
  if (!limit.ok) return { message: `Demasiados intentos. Probá de nuevo en ${Math.ceil(limit.retryInSec / 60)} minutos.`, values }

  const db = await getDb()
  if (await findUserByEmail(db, parsed.data.email)) {
    return { errors: { email: 'Ya existe una cuenta con este email. ¿Querés iniciar sesión?' }, values }
  }
  const userId = await createUser(db, parsed.data)
  await createSession(userId, true)
  redirect('/inicio?bienvenida=1')
}

export async function loginAction(_: FormState, form: FormData): Promise<FormState> {
  const raw = { email: String(form.get('email') ?? ''), password: String(form.get('password') ?? ''), remember: form.get('remember') === 'on' }
  const values = { email: raw.email }
  const parsed = loginSchema.safeParse(raw)
  if (!parsed.success) return { errors: flattenErrors(parsed.error), values }

  const key = `login:${await clientKey()}:${parsed.data.email}`
  const limit = rateLimit(key, 8, 15 * 60_000)
  if (!limit.ok) return { message: `Demasiados intentos. Esperá ${Math.ceil(limit.retryInSec / 60)} minutos o recuperá tu contraseña.`, values }

  const db = await getDb()
  const user = await findUserByEmail(db, parsed.data.email)
  // mismo mensaje para email inexistente o clave incorrecta: no revela qué cuentas existen
  const ok = user ? await verifyPassword(parsed.data.password, user.passwordHash) : (await hashPassword('x'), false)
  if (!user || !ok) return { message: 'Email o contraseña incorrectos.', values }

  await createSession(user.id, parsed.data.remember)
  redirect(safeNext(form.get('next')))
}

export async function logoutAction() {
  await destroySession()
  redirect('/login?salida=1')
}

export async function forgotPasswordAction(_: FormState, form: FormData): Promise<FormState> {
  const raw = { email: String(form.get('email') ?? '') }
  const parsed = forgotSchema.safeParse(raw)
  if (!parsed.success) return { errors: flattenErrors(parsed.error), values: raw }

  const limit = rateLimit(`forgot:${await clientKey()}`, 5, 15 * 60_000)
  if (!limit.ok) return { message: 'Demasiados pedidos seguidos. Esperá unos minutos.', values: raw }

  const db = await getDb()
  const user = await findUserByEmail(db, parsed.data.email)
  let devLink: string | undefined
  if (user) {
    const token = randomBytes(32).toString('base64url')
    await db.insert(schema.passwordResets).values({ id: newId(), userId: user.id, tokenHash: sha256(token), expiresAt: new Date(Date.now() + 60 * 60_000) })
    const base = process.env.APP_URL || 'http://localhost:3000'
    const result = await sendPasswordReset(user.email, user.name, `${base}/restablecer?token=${token}`)
    devLink = result.devPreviewUrl
  }
  // siempre la misma respuesta, exista o no la cuenta
  return { ok: true, message: `Si hay una cuenta con ${parsed.data.email}, te mandamos un link para crear una contraseña nueva. Vence en 1 hora.`, devLink }
}

export async function resetPasswordAction(_: FormState, form: FormData): Promise<FormState> {
  const raw = { token: String(form.get('token') ?? ''), password: String(form.get('password') ?? ''), confirm: String(form.get('confirm') ?? '') }
  const parsed = resetSchema.safeParse(raw)
  if (!parsed.success) return { errors: flattenErrors(parsed.error) }

  const db = await getDb()
  const rows = await db
    .select()
    .from(schema.passwordResets)
    .where(and(eq(schema.passwordResets.tokenHash, sha256(parsed.data.token)), isNull(schema.passwordResets.usedAt), gt(schema.passwordResets.expiresAt, new Date())))
    .limit(1)
  const reset = rows[0]
  if (!reset) return { message: 'El link venció o ya se usó. Pedí uno nuevo.' }

  await db.update(schema.users).set({ passwordHash: await hashPassword(parsed.data.password) }).where(eq(schema.users.id, reset.userId))
  await db.update(schema.passwordResets).set({ usedAt: new Date() }).where(eq(schema.passwordResets.id, reset.id))
  // cambiar la contraseña cierra todas las sesiones abiertas
  await destroyAllSessions(reset.userId)
  redirect('/login?restablecida=1')
}

/** cuenta demo: se crea con datos de ejemplo la primera vez */
export async function demoLoginAction() {
  if (process.env.DEMO_MODE === 'false') redirect('/login')
  const db = await getDb()
  const email = DEMO_EMAIL
  let user = await findUserByEmail(db, email)
  const stale = user && (!user.onboardedAt || Date.now() - user.onboardedAt.getTime() > 2 * 86_400_000)
  if (!user || stale) {
    // los datos demo son relativos a "hoy": si quedaron viejos se regeneran
    if (user) await db.delete(schema.users).where(eq(schema.users.id, user.id))
    const id = await createUser(db, { name: 'Sam', email, password: randomBytes(24).toString('base64url') })
    const today = todayISO()
    await seedDemoFinance(db, id, today)
    await connectDemoIntegration(db, id, 'gmail', today)
    await connectDemoIntegration(db, id, 'gcal', today)
    user = await findUserByEmail(db, email)
  }
  await createSession(user!.id, true)
  redirect('/inicio')
}
