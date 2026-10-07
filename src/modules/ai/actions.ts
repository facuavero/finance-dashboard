'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { getAppData } from '@/modules/app/data'
import { rateLimit } from '@/modules/auth/rate-limit'
import { answerQuestion, generateReport, type AskTopic } from './service'
import { proposeTxn } from './txn-service'
import { planSchema, proposePlan, type Plan } from './assistant'
import { createTransaction, upsertBudget, upsertGoal } from '@/modules/finance/repo'
import type { ParsedTxn } from './parse-txn'

const TOPICS = ['general', 'movimientos', 'presupuestos', 'objetivos', 'estadisticas', 'fugas', 'proyeccion', 'calendario', 'alertas'] as const satisfies readonly AskTopic[]

/** `topic`: la pantalla desde la que se pregunta; la IA prioriza esos datos */
export async function askAction(question: string, topic: AskTopic = 'general'): Promise<{ ok: true; answer: string; engine: string } | { ok: false; error: string }> {
  const q = z.string().trim().min(3, 'Escribí una pregunta').max(500).safeParse(question)
  if (!q.success) return { ok: false, error: q.error.issues[0].message }
  const { user, ctx, recommendations, combined } = await getAppData()
  const limit = rateLimit(`ask:${user.id}`, 20, 60 * 60_000)
  if (!limit.ok) return { ok: false, error: 'Llegaste al límite de preguntas por hora. Probá más tarde.' }
  const res = await answerQuestion(user, ctx, recommendations, combined, q.data, (TOPICS as readonly string[]).includes(topic) ? topic : 'general')
  return { ok: true, ...res }
}

export async function regenerateAction() {
  const { db, user, ctx, recommendations, combined } = await getAppData()
  const limit = rateLimit(`regen:${user.id}`, 6, 60 * 60_000)
  if (!limit.ok) return { ok: false as const, error: 'Ya regeneraste varias veces esta hora.' }
  await generateReport(db, user, ctx, recommendations, combined, { force: true })
  revalidatePath('/ia')
  revalidatePath('/inicio')
  return { ok: true as const }
}

const draftSchema = z.object({
  type: z.enum(['expense', 'income']),
  amountCents: z.number().int().positive().nullable(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  description: z.string().max(140),
  categoryId: z.string().nullable(),
  subcategoryId: z.string().nullable(),
  paymentMethod: z.enum(['debito', 'credito', 'efectivo', 'transferencia', 'billetera']),
  recurrence: z.enum(['none', 'weekly', 'monthly', 'yearly']),
})

/** "pedidosya 4500 ayer" → borrador para confirmar. con `previous` + `instruction` corrige el borrador anterior. */
export async function parseTxnAction(input: { text: string; previous?: ParsedTxn; instruction?: string }): Promise<{ ok: true; draft: ParsedTxn; engine: string; external: boolean } | { ok: false; error: string }> {
  const text = z.string().trim().min(2, 'Escribí qué pasó').max(300).safeParse(input.text)
  if (!text.success) return { ok: false, error: text.error.issues[0].message }
  const previous = input.previous ? draftSchema.safeParse(input.previous) : null
  if (previous && !previous.success) return { ok: false, error: 'Borrador inválido' }
  const instruction = input.instruction ? z.string().trim().min(1).max(300).safeParse(input.instruction) : null
  if (instruction && !instruction.success) return { ok: false, error: 'Escribí qué querés cambiar' }
  const { user, finance, today } = await getAppData()
  if (!rateLimit(`parse:${user.id}`, 60, 60 * 60_000).ok) return { ok: false, error: 'Llegaste al límite de cargas con IA por hora. Cargalo a mano.' }
  const res = await proposeTxn({
    text: text.data,
    cats: finance.cats.map((c) => ({ id: c.id, name: c.name, kind: c.kind, parentId: c.parentId })),
    today,
    allowExternal: user.aiExternalEnabled,
    previous: previous?.data,
    instruction: instruction?.data,
  })
  return { ok: true, ...res }
}

/** texto libre o contenido de un archivo → plan para confirmar. no guarda nada. */
export async function assistantPlanAction(text: string): Promise<{ ok: true; plan: Plan; engine: string; external: boolean } | { ok: false; error: string }> {
  const t = z.string().trim().min(3, 'Escribí qué querés cargar').max(30_000, 'El texto es muy largo: probá con un archivo más chico').safeParse(text)
  if (!t.success) return { ok: false, error: t.error.issues[0].message }
  const { user, finance, today } = await getAppData()
  if (!rateLimit(`plan:${user.id}`, 30, 60 * 60_000).ok) return { ok: false, error: 'Llegaste al límite del asistente por hora. Probá más tarde.' }
  const res = await proposePlan({ text: t.data, cats: finance.cats.map((c) => ({ id: c.id, name: c.name, kind: c.kind, parentId: c.parentId })), today, allowExternal: user.aiExternalEnabled })
  if (!res.plan.transactions.length && !res.plan.budgets.length && !res.plan.goals.length) return { ok: false, error: 'No encontré nada para cargar. Probá con montos: "pedidosya 4500 ayer", "presupuesto de delivery 50000".' }
  return { ok: true, ...res }
}

/** guarda lo que la persona confirmó. se vuelve a validar todo: el plan viaja por el cliente. */
export async function applyPlanAction(input: Plan): Promise<{ ok: true; created: { transactions: number; budgets: number; goals: number }; skipped: number } | { ok: false; error: string }> {
  const parsed = planSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: 'El plan tiene datos inválidos' }
  const { user, db, today } = await getAppData()
  const created = { transactions: 0, budgets: 0, goals: 0 }
  let skipped = 0
  try {
    for (const t of parsed.data.transactions) {
      if (!t.amountCents || !t.categoryId) {
        skipped++
        continue
      }
      await createTransaction(db, user.id, { type: t.type, amountCents: t.amountCents, date: t.date, description: t.description, categoryId: t.categoryId, subcategoryId: t.subcategoryId, paymentMethod: t.paymentMethod, recurrence: t.recurrence, tags: [] })
      created.transactions++
    }
    for (const b of parsed.data.budgets) {
      await upsertBudget(db, user.id, { name: b.name, categoryId: b.categoryId, goalId: null, period: b.period, amountCents: b.amountCents })
      created.budgets++
    }
    for (const g of parsed.data.goals) {
      if (g.targetDate <= today) {
        skipped++
        continue
      }
      await upsertGoal(db, user.id, { name: g.name, kind: g.kind, targetCents: g.targetCents, savedCents: g.savedCents, targetDate: g.targetDate }, today)
      created.goals++
    }
  } catch (e) {
    revalidatePath('/', 'layout')
    return { ok: false, error: e instanceof Error ? e.message : 'No se pudo guardar todo' }
  }
  revalidatePath('/', 'layout')
  return { ok: true, created, skipped }
}
