import 'server-only'
import { cache } from 'react'
import { cookies } from 'next/headers'
import { eq } from 'drizzle-orm'
import { getDb, schema } from '@/db/client'
import { requireUser } from '@/modules/auth/session'
import { buildContext } from '@/modules/analytics/context'
import { todayISO } from '@/modules/analytics/dates'
import { loadFinance, loadSignals } from '@/modules/finance/repo'
import { combineSignals } from '@/modules/insights/combined'
import { buildRecommendations } from '@/modules/ai/rules'
import { applyStates, buildAlerts } from '@/modules/alerts/engine'
import { setRequestFormat } from '@/lib/format'
import { PREFS_COOKIE, parsePrefs, toCurrency } from '@/modules/settings/prefs'

/** todo lo que necesitan las pantallas privadas, calculado una sola vez por request */
export const getAppData = cache(async () => {
  const user = await requireUser()
  const db = await getDb()
  const today = todayISO()
  const prefs = parsePrefs((await cookies()).get(PREFS_COOKIE)?.value)
  const currency = toCurrency(user.currency)
  setRequestFormat({ currency, decimals: prefs.decimals })
  const [finance, signals, states, integrations] = await Promise.all([
    loadFinance(db, user.id),
    loadSignals(db, user.id),
    db.select().from(schema.alertStates).where(eq(schema.alertStates.userId, user.id)),
    db.select({ provider: schema.integrations.provider, isDemo: schema.integrations.isDemo, lastSyncedAt: schema.integrations.lastSyncedAt, status: schema.integrations.status }).from(schema.integrations).where(eq(schema.integrations.userId, user.id)),
  ])

  const ctx = buildContext({
    txns: finance.txns,
    cats: finance.cats,
    budgets: finance.budgets,
    goals: finance.goals,
    initialBalanceCents: user.initialBalanceCents,
    microThresholdCents: user.microThresholdCents,
    today,
  })
  const recommendations = buildRecommendations(ctx)
  const combined = combineSignals({
    signals,
    txns: finance.txns,
    cats: finance.cats,
    recurring: ctx.recurring,
    today,
    dailyVariableCents: ctx.forecast.dailyVariableCents,
    goalsBehind: ctx.goals.filter((g) => g.state === 'behind').map((g) => ({ name: g.name, gapCents: g.gapCents })),
  })
  const allAlerts = buildAlerts(ctx, { combined, recommendations })
  const { active: alerts, hidden: hiddenAlerts } = applyStates(allAlerts, states)

  return { user, db, today, prefs, currency, finance, signals, ctx, recommendations, combined, alerts, hiddenAlerts, alertStates: states, integrations }
})

export type AppData = Awaited<ReturnType<typeof getAppData>>
