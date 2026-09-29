import { and, eq } from 'drizzle-orm'
import { type DB, schema } from '@/db/client'
import { newId } from '@/lib/ids'
import { DEFAULT_CATEGORIES } from '@/modules/finance/categories'
import { generateDemoData } from './generate'
import { demoEmails, demoEvents } from './signals'
import { parseEmail, parseEvent } from '@/modules/integrations/parse'

/** mapa key → id de las categorías por defecto del usuario (por nombre) */
async function categoryKeyMap(db: DB, userId: string) {
  const rows = await db.select().from(schema.categories).where(eq(schema.categories.userId, userId))
  const byName = new Map(rows.map((r) => [r.name, r.id]))
  const map: Record<string, string | undefined> = {}
  for (const c of DEFAULT_CATEGORIES) {
    map[c.key] = byName.get(c.name)
    for (const s of c.subs ?? []) map[s.key] = byName.get(s.name)
  }
  return map
}

/** carga 6 meses de movimientos, presupuestos y objetivos de ejemplo. marca todo con source=demo para poder borrarlo. */
export async function seedDemoFinance(db: DB, userId: string, today: string) {
  const data = generateDemoData(today)
  const ids = await categoryKeyMap(db, userId)
  const otros = ids['otros'] ?? null
  const txRows = data.transactions.map((t) => ({
    id: newId(),
    userId,
    type: t.type,
    amountCents: t.amountCents,
    date: t.date,
    description: t.description,
    categoryId: ids[t.cat] ?? otros,
    subcategoryId: t.sub ? (ids[t.sub] ?? null) : null,
    paymentMethod: t.paymentMethod,
    recurrence: t.recurrence,
    tags: t.tags,
    source: 'demo' as const,
  }))
  for (let i = 0; i < txRows.length; i += 200) await db.insert(schema.transactions).values(txRows.slice(i, i + 200))

  const goalIds: Record<string, string> = {}
  for (const g of data.goals) {
    const id = newId()
    goalIds[g.key] = id
    await db.insert(schema.goals).values({ id, userId, name: g.name, kind: g.kind, targetCents: g.targetCents, savedCents: g.savedCents, startDate: g.startDate, targetDate: g.targetDate })
  }
  for (const b of data.budgets) {
    await db.insert(schema.budgets).values({ id: newId(), userId, name: b.name, categoryId: b.cat ? (ids[b.cat] ?? null) : null, goalId: b.goal ? goalIds[b.goal] : null, period: b.period, amountCents: b.amountCents })
  }
  await db.update(schema.users).set({ initialBalanceCents: data.initialBalanceCents, onboardedAt: new Date() }).where(eq(schema.users.id, userId))
}

/** conecta gmail o calendar con correos/eventos de ejemplo. pasan por el mismo parser que los reales. */
export async function connectDemoIntegration(db: DB, userId: string, provider: 'gmail' | 'gcal', today: string) {
  await db.delete(schema.integrations).where(and(eq(schema.integrations.userId, userId), eq(schema.integrations.provider, provider)))
  const integrationId = newId()
  await db.insert(schema.integrations).values({
    id: integrationId,
    userId,
    provider,
    isDemo: true,
    scopes: provider === 'gmail' ? 'https://www.googleapis.com/auth/gmail.readonly' : 'https://www.googleapis.com/auth/calendar.readonly',
    accountEmail: 'demo@ejemplo.com',
    lastSyncedAt: new Date(),
  })
  const parsed = provider === 'gmail' ? demoEmails(today).map(parseEmail).filter((p) => p !== null) : demoEvents(today).map(parseEvent)
  if (parsed.length) {
    await db.insert(schema.integrationItems).values(
      parsed.map((p) => ({ id: newId(), userId, integrationId, provider, externalId: p!.externalId, kind: p!.kind, title: p!.title, merchant: p!.merchant, amountCents: p!.amountCents, currency: p!.currency, occursOn: p!.occursOn, endsOn: p!.endsOn, confidence: p!.confidence, evidence: p!.evidence })),
    )
  }
}
