import { and, asc, desc, eq, inArray } from 'drizzle-orm'
import { type DB, schema } from '@/db/client'
import { newId } from '@/lib/ids'
import type { Cat, Txn } from '@/modules/analytics/types'
import type { BudgetInput } from '@/modules/analytics/budgets'
import type { GoalInput } from '@/modules/analytics/goals'
import type { Signal } from '@/modules/insights/combined'

// capa de datos financieros. todas las funciones filtran por userId: nunca se lee ni escribe fuera del usuario.

export async function loadFinance(db: DB, userId: string) {
  const [txRows, catRows, budgetRows, goalRows] = await Promise.all([
    db.select().from(schema.transactions).where(eq(schema.transactions.userId, userId)).orderBy(desc(schema.transactions.date), desc(schema.transactions.createdAt)),
    db.select().from(schema.categories).where(eq(schema.categories.userId, userId)).orderBy(asc(schema.categories.sortOrder)),
    db.select().from(schema.budgets).where(eq(schema.budgets.userId, userId)).orderBy(asc(schema.budgets.createdAt)),
    db.select().from(schema.goals).where(eq(schema.goals.userId, userId)).orderBy(asc(schema.goals.targetDate)),
  ])
  const txns: Txn[] = txRows.map((t) => ({
    id: t.id,
    type: t.type,
    amountCents: t.amountCents,
    date: t.date,
    description: t.description,
    categoryId: t.categoryId,
    subcategoryId: t.subcategoryId,
    paymentMethod: t.paymentMethod,
    recurrence: t.recurrence,
    tags: t.tags,
  }))
  const cats: Cat[] = catRows.map((c) => ({ id: c.id, name: c.name, kind: c.kind, parentId: c.parentId, group: c.group, icon: c.icon, colorSlot: c.colorSlot }))
  const budgets: (BudgetInput & { goalId: string | null })[] = budgetRows.map((b) => ({ id: b.id, name: b.name, categoryId: b.categoryId, period: b.period, amountCents: b.amountCents, goalId: b.goalId }))
  const goals: GoalInput[] = goalRows.map((g) => ({ id: g.id, name: g.name, kind: g.kind, targetCents: g.targetCents, savedCents: g.savedCents, targetDate: g.targetDate, startDate: g.startDate }))
  return { txns, cats, budgets, goals }
}

export async function loadSignals(db: DB, userId: string): Promise<(Signal & { isDemo: boolean; evidence: string })[]> {
  const rows = await db
    .select({ item: schema.integrationItems, isDemo: schema.integrations.isDemo })
    .from(schema.integrationItems)
    .innerJoin(schema.integrations, eq(schema.integrations.id, schema.integrationItems.integrationId))
    .where(and(eq(schema.integrationItems.userId, userId), eq(schema.integrationItems.dismissed, false)))
  return rows.map(({ item, isDemo }) => ({
    id: item.id,
    provider: item.provider,
    kind: item.kind,
    title: item.title,
    merchant: item.merchant,
    amountCents: item.amountCents,
    occursOn: item.occursOn,
    endsOn: item.endsOn,
    confidence: item.confidence,
    evidence: item.evidence,
    isDemo,
  }))
}

export type TxnInput = {
  type: 'expense' | 'income'
  amountCents: number
  date: string
  description: string
  categoryId: string | null
  subcategoryId: string | null
  paymentMethod: string
  recurrence: 'none' | 'weekly' | 'monthly' | 'yearly'
  tags: string[]
}

async function assertOwnCategories(db: DB, userId: string, ids: (string | null)[]) {
  const wanted = ids.filter((x): x is string => !!x)
  if (!wanted.length) return
  const rows = await db.select({ id: schema.categories.id }).from(schema.categories).where(and(eq(schema.categories.userId, userId), inArray(schema.categories.id, wanted)))
  if (rows.length !== new Set(wanted).size) throw new Error('Categoría inválida')
}

export async function createTransaction(db: DB, userId: string, input: TxnInput, source: 'manual' | 'import' | 'demo' = 'manual') {
  await assertOwnCategories(db, userId, [input.categoryId, input.subcategoryId])
  const id = newId()
  await db.insert(schema.transactions).values({ id, userId, source, ...input })
  return id
}

export async function updateTransaction(db: DB, userId: string, id: string, input: TxnInput) {
  await assertOwnCategories(db, userId, [input.categoryId, input.subcategoryId])
  await db
    .update(schema.transactions)
    .set({ ...input, updatedAt: new Date() })
    .where(and(eq(schema.transactions.id, id), eq(schema.transactions.userId, userId)))
}

export async function deleteTransactions(db: DB, userId: string, ids: string[]) {
  if (!ids.length) return
  await db.delete(schema.transactions).where(and(eq(schema.transactions.userId, userId), inArray(schema.transactions.id, ids)))
}

export async function getTransaction(db: DB, userId: string, id: string) {
  const rows = await db.select().from(schema.transactions).where(and(eq(schema.transactions.id, id), eq(schema.transactions.userId, userId))).limit(1)
  return rows[0] ?? null
}

// presupuestos

export type BudgetUpsert = { name: string; categoryId: string | null; goalId: string | null; period: 'weekly' | 'monthly' | 'yearly'; amountCents: number }

export async function upsertBudget(db: DB, userId: string, input: BudgetUpsert, id?: string) {
  await assertOwnCategories(db, userId, [input.categoryId])
  if (id) {
    await db.update(schema.budgets).set(input).where(and(eq(schema.budgets.id, id), eq(schema.budgets.userId, userId)))
    return id
  }
  const nid = newId()
  await db.insert(schema.budgets).values({ id: nid, userId, ...input })
  return nid
}

export async function deleteBudget(db: DB, userId: string, id: string) {
  await db.delete(schema.budgets).where(and(eq(schema.budgets.id, id), eq(schema.budgets.userId, userId)))
}

// objetivos

export type GoalUpsert = { name: string; kind: 'purchase' | 'travel' | 'emergency' | 'savings' | 'investment'; targetCents: number; savedCents: number; targetDate: string }

export async function upsertGoal(db: DB, userId: string, input: GoalUpsert, today: string, id?: string) {
  if (id) {
    await db.update(schema.goals).set(input).where(and(eq(schema.goals.id, id), eq(schema.goals.userId, userId)))
    return id
  }
  const nid = newId()
  await db.insert(schema.goals).values({ id: nid, userId, startDate: today, ...input })
  return nid
}

export async function contributeToGoal(db: DB, userId: string, id: string, cents: number) {
  const rows = await db.select().from(schema.goals).where(and(eq(schema.goals.id, id), eq(schema.goals.userId, userId))).limit(1)
  const g = rows[0]
  if (!g) throw new Error('Objetivo inexistente')
  const saved = Math.max(0, g.savedCents + cents)
  await db.update(schema.goals).set({ savedCents: saved }).where(eq(schema.goals.id, id))
  return saved
}

export async function deleteGoal(db: DB, userId: string, id: string) {
  await db.delete(schema.goals).where(and(eq(schema.goals.id, id), eq(schema.goals.userId, userId)))
}
