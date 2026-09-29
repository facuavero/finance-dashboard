'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { getDb, schema } from '@/db/client'
import { requireUser, destroySession } from '@/modules/auth/session'
import { disconnect } from '@/modules/integrations/google'

export async function setAiExternalAction(enabled: boolean) {
  const user = await requireUser()
  await (await getDb()).update(schema.users).set({ aiExternalEnabled: z.boolean().parse(enabled) }).where(eq(schema.users.id, user.id))
  revalidatePath('/', 'layout')
  return { ok: true as const }
}

/** exportación completa en json: todo lo que Caudal guarda de vos (sin hash de contraseña ni tokens) */
export async function exportDataAction() {
  const user = await requireUser()
  const db = await getDb()
  const byUser = <T extends { userId: unknown }>(t: T) => eq(t.userId as never, user.id)
  const [transactions, categories, budgets, goals, integrations, items] = await Promise.all([
    db.select().from(schema.transactions).where(byUser(schema.transactions)),
    db.select().from(schema.categories).where(byUser(schema.categories)),
    db.select().from(schema.budgets).where(byUser(schema.budgets)),
    db.select().from(schema.goals).where(byUser(schema.goals)),
    db.select({ provider: schema.integrations.provider, isDemo: schema.integrations.isDemo, scopes: schema.integrations.scopes, accountEmail: schema.integrations.accountEmail, lastSyncedAt: schema.integrations.lastSyncedAt }).from(schema.integrations).where(byUser(schema.integrations)),
    db.select().from(schema.integrationItems).where(byUser(schema.integrationItems)),
  ])
  return {
    exportedAt: new Date().toISOString(),
    account: { name: user.name, email: user.email, currency: user.currency, initialBalanceCents: user.initialBalanceCents, microThresholdCents: user.microThresholdCents, aiExternalEnabled: user.aiExternalEnabled, createdAt: user.createdAt },
    transactions,
    categories,
    budgets,
    goals,
    integrations,
    integrationItems: items,
  }
}

export async function deleteFinancialDataAction() {
  const user = await requireUser()
  const db = await getDb()
  for (const p of ['gmail', 'gcal'] as const) await disconnect(db, user.id, p)
  await db.delete(schema.transactions).where(eq(schema.transactions.userId, user.id))
  await db.delete(schema.budgets).where(eq(schema.budgets.userId, user.id))
  await db.delete(schema.goals).where(eq(schema.goals.userId, user.id))
  await db.delete(schema.aiReports).where(eq(schema.aiReports.userId, user.id))
  await db.delete(schema.alertStates).where(eq(schema.alertStates.userId, user.id))
  await db.update(schema.users).set({ initialBalanceCents: 0 }).where(eq(schema.users.id, user.id))
  revalidatePath('/', 'layout')
  return { ok: true as const }
}

export async function deleteAccountAction(confirmEmail: string) {
  const user = await requireUser()
  if (confirmEmail.trim().toLowerCase() !== user.email) return { ok: false as const, error: 'El email no coincide.' }
  const db = await getDb()
  for (const p of ['gmail', 'gcal'] as const) await disconnect(db, user.id, p)
  await destroySession()
  await db.delete(schema.users).where(eq(schema.users.id, user.id)) // cascade: sesiones, datos, integraciones
  redirect('/login?eliminada=1')
}
