import { type ISODate, addDays, addMonths, daysBetween, endOfMonth, inRange, previousFullMonths, startOfMonth } from './dates'
import { normalizeMerchant } from './merchant'
import type { RecurringItem } from './recurring'
import { balanceAt, summarize } from './summary'
import { type Txn, mean, stdev, sum } from './types'

export type PendingItem = { label: string; date: ISODate; cents: number; type: 'expense' | 'income'; kind: string }

export type MonthForecast = {
  balanceNowCents: number
  endOfMonthBalanceCents: number
  expectedIncomeCents: number
  expectedFixedCents: number
  expectedVariableCents: number
  dailyVariableCents: number
  remainingDays: number
  pending: PendingItem[]
  /** saldo diario del mes: real hasta hoy, estimado después */
  series: { date: ISODate; label: string; realCents: number | null; estimatedCents: number | null }[]
}

const recurringKeys = (items: RecurringItem[]) => new Set(items.map((i) => i.key))
const keyOf = (t: Txn) => `${t.type}:${normalizeMerchant(t.description)}`

/** gasto variable diario típico: últimos 90 días sin recurrentes y recortando el 5% más alto */
export function dailyVariableSpend(txns: Txn[], recurring: RecurringItem[], today: ISODate): number {
  const keys = recurringKeys(recurring)
  const from = addDays(today, -89)
  const vals = txns
    .filter((t) => t.type === 'expense' && t.date >= from && t.date <= today && t.recurrence === 'none' && !keys.has(keyOf(t)))
    .map((t) => t.amountCents)
    .sort((a, b) => a - b)
  if (!vals.length) return 0
  const cut = vals[Math.floor(vals.length * 0.95)] ?? Infinity
  const trimmed = vals.map((v) => Math.min(v, cut))
  const firstDate = txns.reduce((a, t) => (t.date < a ? t.date : a), today)
  const days = Math.max(14, Math.min(90, daysBetween(firstDate, today) + 1))
  return sum(trimmed) / days
}

/** ocurrencias de un recurrente entre (after, until] */
function occurrences(item: RecurringItem, after: ISODate, until: ISODate): ISODate[] {
  const out: ISODate[] = []
  let d = item.nextDate
  let guard = 0
  while (d <= until && guard++ < 60) {
    if (d > after) out.push(d)
    d = item.frequency === 'weekly' ? addDays(d, 7) : item.frequency === 'monthly' ? addMonths(d, 1) : addMonths(d, 12)
  }
  if (item.installment) return out.slice(0, item.installment.remaining)
  return out
}

export function pendingUntil(recurring: RecurringItem[], today: ISODate, until: ISODate): PendingItem[] {
  const out: PendingItem[] = []
  for (const r of recurring) {
    for (const date of occurrences(r, addDays(today, -1), until)) {
      // el de hoy cuenta como pendiente solo si todavía no se registró
      if (date === today && r.lastDate === today) continue
      out.push({ label: r.label, date, cents: r.lastCents, type: r.type, kind: r.kind })
    }
  }
  return out.sort((a, b) => a.date.localeCompare(b.date))
}

export function forecastMonth(txns: Txn[], recurring: RecurringItem[], initialCents: number, today: ISODate): MonthForecast {
  const monthStart = startOfMonth(today)
  const monthEnd = endOfMonth(today)
  const balanceNow = balanceAt(txns, initialCents, today)
  const pending = pendingUntil(recurring, today, monthEnd)
  const expectedIncome = sum(pending.filter((p) => p.type === 'income').map((p) => p.cents))
  const expectedFixed = sum(pending.filter((p) => p.type === 'expense').map((p) => p.cents))
  const daily = dailyVariableSpend(txns, recurring, today)
  const remainingDays = daysBetween(today, monthEnd)
  const expectedVariable = Math.round(daily * remainingDays)

  const series: MonthForecast['series'] = []
  let d = monthStart
  let est = balanceNow
  while (d <= monthEnd) {
    const label = String(Number(d.slice(8)))
    if (d <= today) {
      const real = balanceAt(txns, initialCents, d)
      series.push({ date: d, label, realCents: real, estimatedCents: d === today ? real : null })
    } else {
      est -= daily
      for (const p of pending.filter((x) => x.date === d)) est += p.type === 'income' ? p.cents : -p.cents
      series.push({ date: d, label, realCents: null, estimatedCents: Math.round(est) })
    }
    d = addDays(d, 1)
  }

  return {
    balanceNowCents: balanceNow,
    endOfMonthBalanceCents: Math.round(balanceNow + expectedIncome - expectedFixed - expectedVariable),
    expectedIncomeCents: expectedIncome,
    expectedFixedCents: expectedFixed,
    expectedVariableCents: expectedVariable,
    dailyVariableCents: Math.round(daily),
    remainingDays,
    pending,
    series,
  }
}

export type SavingCapacity = {
  typicalIncomeCents: number
  fixedCents: number
  variableCents: number
  capacityCents: number
  months: number
}

/** cuánto puede ahorrar por mes con el comportamiento actual (promedio de los últimos 3 meses completos) */
export function savingCapacity(txns: Txn[], recurring: RecurringItem[], today: ISODate): SavingCapacity {
  const months = previousFullMonths(today, 3).filter((r) => txns.some((t) => inRange(t.date, r)))
  const income = mean(months.map((r) => summarize(txns, r).incomeCents))
  const fixed = sum(recurring.filter((r) => r.type === 'expense').map((r) => r.monthlyCents))
  const keys = recurringKeys(recurring)
  const variable = mean(
    months.map((r) => sum(txns.filter((t) => t.type === 'expense' && inRange(t.date, r) && !keys.has(keyOf(t)) && t.recurrence === 'none').map((t) => t.amountCents))),
  )
  return {
    typicalIncomeCents: Math.round(income),
    fixedCents: Math.round(fixed),
    variableCents: Math.round(variable),
    capacityCents: Math.round(income - fixed - variable),
    months: months.length,
  }
}

export type CapitalProjection = { month: ISODate; label: string; realCents: number | null; estimatedCents: number | null; lowCents: number | null; highCents: number | null }[]

/** capital de los últimos 6 meses (real) y de los próximos N (estimado, con banda de ±1 desvío) */
export function projectCapital(txns: Txn[], initialCents: number, today: ISODate, ahead = 6): CapitalProjection {
  const past = previousFullMonths(today, 6)
  const nets = previousFullMonths(today, 3).map((r) => summarize(txns, r).netCents)
  const avgNet = mean(nets)
  const sd = stdev(nets)
  const out: CapitalProjection = past.map((r) => ({ month: r.start, label: r.start, realCents: balanceAt(txns, initialCents, r.end), estimatedCents: null, lowCents: null, highCents: null }))
  const now = balanceAt(txns, initialCents, today)
  out.push({ month: startOfMonth(today), label: startOfMonth(today), realCents: now, estimatedCents: now, lowCents: now, highCents: now })
  for (let i = 1; i <= ahead; i++) {
    const m = addMonths(startOfMonth(today), i)
    const est = now + avgNet * i
    const band = sd * Math.sqrt(i)
    out.push({ month: m, label: m, realCents: null, estimatedCents: Math.round(est), lowCents: Math.round(est - band), highCents: Math.round(est + band) })
  }
  return out
}
