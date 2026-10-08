'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { and, eq } from 'drizzle-orm'
import { getDb, schema } from '@/db/client'
import { requireUser } from '@/modules/auth/session'
import { todayISO } from '@/modules/analytics/dates'
import { MAX_AMOUNT_CENTS } from '@/lib/format'
import { seedDemoFinance } from '@/modules/demo/seed'
import { contributeToGoal, createTransaction, deleteBudget, deleteGoal, deleteTransactions, updateTransaction, upsertBudget, upsertGoal } from './repo'

export type ActionResult<T = undefined> = { ok: true; data?: T; message?: string } | { ok: false; error: string; fieldErrors?: Record<string, string> }

const refresh = () => revalidatePath('/', 'layout')

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida')
const cents = z.number().int().positive('El monto tiene que ser mayor a 0').max(MAX_AMOUNT_CENTS, 'Monto demasiado grande')

const txnSchema = z.object({
  type: z.enum(['expense', 'income']),
  amountCents: cents,
  date: isoDate,
  description: z.string().trim().max(140).default(''),
  categoryId: z.string().nullable(),
  subcategoryId: z.string().nullable(),
  paymentMethod: z.enum(['efectivo', 'debito', 'credito', 'transferencia', 'billetera']),
  recurrence: z.enum(['none', 'weekly', 'monthly', 'yearly']),
  tags: z.array(z.string().trim().min(1).max(24)).max(8),
})

export type TxnPayload = z.input<typeof txnSchema>

function fieldErrors(err: z.ZodError) {
  const out: Record<string, string> = {}
  for (const i of err.issues) out[String(i.path[0])] ??= i.message
  return out
}

export async function saveTransactionAction(payload: TxnPayload, id?: string): Promise<ActionResult<{ id: string }>> {
  const user = await requireUser()
  const parsed = txnSchema.safeParse(payload)
  if (!parsed.success) return { ok: false, error: 'Revisá los datos marcados', fieldErrors: fieldErrors(parsed.error) }
  const db = await getDb()
  try {
    const data = { ...parsed.data, description: parsed.data.description ?? '' }
    const txnId = id ? (await updateTransaction(db, user.id, id, data), id) : await createTransaction(db, user.id, data)
    refresh()
    return { ok: true, data: { id: txnId } }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'No se pudo guardar' }
  }
}

export async function deleteTransactionsAction(ids: string[]): Promise<ActionResult> {
  const user = await requireUser()
  const db = await getDb()
  await deleteTransactions(db, user.id, z.array(z.string()).max(500).parse(ids))
  refresh()
  return { ok: true }
}

const importRow = z.object({ date: isoDate, description: z.string().max(140), amountCents: z.number().int(), categoryId: z.string().nullable() })

/** importación csv: montos negativos = gastos, positivos = ingresos */
export async function importTransactionsAction(rows: z.input<typeof importRow>[]): Promise<ActionResult<{ count: number }>> {
  const user = await requireUser()
  const parsed = z.array(importRow).max(5000).safeParse(rows)
  if (!parsed.success) return { ok: false, error: 'El archivo tiene filas inválidas' }
  const db = await getDb()
  let count = 0
  for (const r of parsed.data) {
    if (r.amountCents === 0) continue
    await createTransaction(db, user.id, { type: r.amountCents < 0 ? 'expense' : 'income', amountCents: Math.abs(r.amountCents), date: r.date, description: r.description, categoryId: r.categoryId, subcategoryId: null, paymentMethod: 'debito', recurrence: 'none', tags: ['importado'] }, 'import')
    count++
  }
  refresh()
  return { ok: true, data: { count } }
}

const budgetSchema = z.object({
  name: z.string().trim().min(2, 'Poné un nombre').max(60),
  categoryId: z.string().nullable(),
  goalId: z.string().nullable(),
  period: z.enum(['weekly', 'monthly', 'yearly']),
  amountCents: cents,
})

export async function saveBudgetAction(payload: z.input<typeof budgetSchema>, id?: string): Promise<ActionResult> {
  const user = await requireUser()
  const parsed = budgetSchema.safeParse(payload)
  if (!parsed.success) return { ok: false, error: 'Revisá los datos', fieldErrors: fieldErrors(parsed.error) }
  const db = await getDb()
  await upsertBudget(db, user.id, parsed.data, id)
  refresh()
  return { ok: true }
}

export async function deleteBudgetAction(id: string): Promise<ActionResult> {
  const user = await requireUser()
  await deleteBudget(await getDb(), user.id, id)
  refresh()
  return { ok: true }
}

const goalSchema = z.object({
  name: z.string().trim().min(2, 'Poné un nombre').max(60),
  kind: z.enum(['purchase', 'travel', 'emergency', 'savings', 'investment']),
  targetCents: cents,
  savedCents: z.number().int().min(0),
  targetDate: isoDate,
})

export async function saveGoalAction(payload: z.input<typeof goalSchema>, id?: string): Promise<ActionResult> {
  const user = await requireUser()
  const parsed = goalSchema.safeParse(payload)
  if (!parsed.success) return { ok: false, error: 'Revisá los datos', fieldErrors: fieldErrors(parsed.error) }
  if (parsed.data.targetDate <= todayISO()) return { ok: false, error: 'La fecha objetivo tiene que ser futura', fieldErrors: { targetDate: 'Elegí una fecha futura' } }
  await upsertGoal(await getDb(), user.id, parsed.data, todayISO(), id)
  refresh()
  return { ok: true }
}

export async function contributeGoalAction(id: string, amountCents: number): Promise<ActionResult<{ savedCents: number }>> {
  const user = await requireUser()
  const amount = z.number().int().refine((v) => v !== 0).safeParse(amountCents)
  if (!amount.success) return { ok: false, error: 'Monto inválido' }
  const saved = await contributeToGoal(await getDb(), user.id, id, amount.data)
  refresh()
  return { ok: true, data: { savedCents: saved } }
}

export async function deleteGoalAction(id: string): Promise<ActionResult> {
  const user = await requireUser()
  await deleteGoal(await getDb(), user.id, id)
  refresh()
  return { ok: true }
}

export async function loadDemoDataAction(): Promise<ActionResult> {
  const user = await requireUser()
  const db = await getDb()
  const existing = await db.select({ id: schema.transactions.id }).from(schema.transactions).where(eq(schema.transactions.userId, user.id)).limit(1)
  if (existing.length) return { ok: false, error: 'Ya tenés movimientos. Los datos de ejemplo solo se cargan en cuentas vacías.' }
  await seedDemoFinance(db, user.id, todayISO())
  refresh()
  return { ok: true }
}

export async function clearDemoDataAction(): Promise<ActionResult> {
  const user = await requireUser()
  const db = await getDb()
  await db.delete(schema.transactions).where(and(eq(schema.transactions.userId, user.id), eq(schema.transactions.source, 'demo')))
  refresh()
  return { ok: true, message: 'Borramos los movimientos de ejemplo. Tus movimientos cargados a mano siguen intactos.' }
}
