import { type ISODate, addDays, daysBetween, inRange, periodRange, previousFullMonths } from './dates'
import { keywordGroup, merchantLabel, normalizeMerchant } from './merchant'
import { type Cat, type Txn, indexCats, mean, sum, txnGroup } from './types'

export type MicroPattern = {
  key: string
  label: string
  group: string | null
  monthlyCents: number // promedio mensual (últimos 90 días)
  annualCents: number
  countPerMonth: number
  perWeek: number
  avgTicketCents: number
  pctOfIncome: number | null
  thisMonthCents: number
  thisMonthCount: number
  save30Cents: number // ahorro mensual si reduce 30%
  save50Cents: number
  merchants: string[]
}

export type MicroReport = {
  thresholdCents: number
  thisMonth: { totalCents: number; count: number }
  monthlyAvgCents: number
  annualEstimateCents: number
  pctOfIncome: number | null
  patterns: MicroPattern[]
}

const GROUP_LABEL: Record<string, string> = {
  delivery: 'Delivery',
  coffee: 'Cafés, kiosco y snacks',
  rides: 'Viajes en apps',
  subscriptions: 'Suscripciones chicas',
  shopping: 'Compras chicas',
  dining: 'Salidas a comer',
  leisure: 'Ocio',
}

// grupos donde tiene sentido agrupar por rubro y no por comercio
const GROUPED = new Set(['delivery', 'coffee', 'rides', 'dining'])
const FREQUENT = new Set(['delivery', 'coffee', 'rides'])

/**
 * microgastos: movimientos por debajo del umbral. individualmente no pesan, sumados sí.
 * se agrupan por rubro (delivery, café...) o por comercio. ventana: últimos 90 días.
 */
export function microSpending(txns: Txn[], cats: Cat[], opts: { thresholdCents: number; today: ISODate; monthlyIncomeCents: number }): MicroReport {
  const { thresholdCents, today, monthlyIncomeCents } = opts
  const idx = indexCats(cats)
  const window = { start: addDays(today, -89), end: today }
  const month = periodRange('month', today)
  const monthsInWindow = 90 / 30.4

  const groupOf = (t: Txn) => keywordGroup(t.description) ?? txnGroup(idx, t)
  const eligible = (t: Txn) => t.type === 'expense' && t.recurrence === 'none' && !['groceries', 'subscriptions', 'housing', 'utilities', 'installments'].includes(groupOf(t) ?? '')
  // estrictamente chicos: los que individualmente parecen insignificantes
  const small = txns.filter((t) => eligible(t) && t.amountCents < thresholdCents)
  // frecuentes: delivery, cafés y viajes en app cuentan aunque el ticket supere el umbral (hasta 4 veces)
  const frequent = txns.filter((t) => eligible(t) && t.amountCents < thresholdCents * 4 && FREQUENT.has(groupOf(t) ?? ''))
  const candidates = [...new Map([...small, ...frequent].map((t) => [t.id, t])).values()]
  const inWindow = candidates.filter((t) => inRange(t.date, window))
  const inMonth = small.filter((t) => inRange(t.date, { start: month.start, end: today }))

  const groups = new Map<string, Txn[]>()
  for (const t of inWindow) {
    const g = groupOf(t)
    const key = g && GROUPED.has(g) ? `group:${g}` : `m:${normalizeMerchant(t.description)}`
    groups.set(key, [...(groups.get(key) ?? []), t])
  }

  const patterns: MicroPattern[] = []
  for (const [key, list] of groups) {
    if (list.length < 3) continue // un patrón necesita repetirse
    const total = sum(list.map((t) => t.amountCents))
    const monthly = Math.round(total / monthsInWindow)
    const group = key.startsWith('group:') ? key.slice(6) : groupOf(list[0])
    const days = Math.max(7, daysBetween(list.reduce((a, t) => (t.date < a ? t.date : a), today), today) + 1)
    const monthList = list.filter((t) => inRange(t.date, { start: month.start, end: today }))
    patterns.push({
      key,
      label: key.startsWith('group:') ? (GROUP_LABEL[group ?? ''] ?? group ?? 'Otros') : merchantLabel(list[0].description),
      group,
      monthlyCents: monthly,
      annualCents: monthly * 12,
      countPerMonth: list.length / monthsInWindow,
      perWeek: (list.length / days) * 7,
      avgTicketCents: Math.round(mean(list.map((t) => t.amountCents))),
      pctOfIncome: monthlyIncomeCents > 0 ? monthly / monthlyIncomeCents : null,
      thisMonthCents: sum(monthList.map((t) => t.amountCents)),
      thisMonthCount: monthList.length,
      save30Cents: Math.round(monthly * 0.3),
      save50Cents: Math.round(monthly * 0.5),
      merchants: [...new Set(list.map((t) => merchantLabel(t.description)))].slice(0, 4),
    })
  }
  patterns.sort((a, b) => b.monthlyCents - a.monthlyCents)

  // promedio mensual de los gastos bajo el umbral en los últimos 3 meses completos (más estable que la ventana)
  const full = previousFullMonths(today, 3).map((r) => sum(small.filter((t) => inRange(t.date, r)).map((t) => t.amountCents)))
  const monthlyAvgRaw = full.some((v) => v > 0) ? mean(full) : sum(small.filter((t) => inRange(t.date, window)).map((t) => t.amountCents)) / monthsInWindow

  const monthlyAvg = Math.round(monthlyAvgRaw)
  return {
    thresholdCents,
    thisMonth: { totalCents: sum(inMonth.map((t) => t.amountCents)), count: inMonth.length },
    monthlyAvgCents: monthlyAvg,
    annualEstimateCents: monthlyAvg * 12,
    pctOfIncome: monthlyIncomeCents > 0 ? monthlyAvg / monthlyIncomeCents : null,
    patterns,
  }
}
