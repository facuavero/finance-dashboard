import {
  type Granularity,
  type ISODate,
  type Range,
  addDays,
  eachMonth,
  endOfMonth,
  inRange,
  monthKey,
  previousComparableRange,
  startOfWeek,
  toDate,
} from './dates'
import { type Cat, type Txn, indexCats, rootCat, sum } from './types'

export type PeriodSummary = {
  incomeCents: number
  expenseCents: number
  netCents: number
  savingsRate: number | null // null si no hubo ingresos
  count: number
}

export function summarize(txns: Txn[], r: Range): PeriodSummary {
  let income = 0
  let expense = 0
  let count = 0
  for (const t of txns) {
    if (!inRange(t.date, r)) continue
    count++
    if (t.type === 'income') income += t.amountCents
    else expense += t.amountCents
  }
  return {
    incomeCents: income,
    expenseCents: expense,
    netCents: income - expense,
    savingsRate: income > 0 ? (income - expense) / income : null,
    count,
  }
}

export type Delta = { cents: number; pct: number | null }
const delta = (cur: number, prev: number): Delta => ({ cents: cur - prev, pct: prev > 0 ? (cur - prev) / prev : null })

export type ComparedSummary = PeriodSummary & {
  previous: PeriodSummary
  previousRange: Range
  deltas: { income: Delta; expense: Delta; net: Delta; savingsRatePts: number | null }
}

/** compara contra el mismo tramo del período anterior (si el período está en curso) */
export function compareSummary(txns: Txn[], g: Granularity, r: Range, today: ISODate): ComparedSummary {
  const cur = summarize(txns, r.end > today ? { start: r.start, end: today } : r)
  const prevRange = previousComparableRange(g, r, today)
  const prev = summarize(txns, prevRange)
  return {
    ...cur,
    previous: prev,
    previousRange: prevRange,
    deltas: {
      income: delta(cur.incomeCents, prev.incomeCents),
      expense: delta(cur.expenseCents, prev.expenseCents),
      net: { cents: cur.netCents - prev.netCents, pct: prev.netCents !== 0 ? (cur.netCents - prev.netCents) / Math.abs(prev.netCents) : null },
      savingsRatePts: cur.savingsRate !== null && prev.savingsRate !== null ? cur.savingsRate - prev.savingsRate : null,
    },
  }
}

export type CategorySlice = {
  categoryId: string | null
  name: string
  icon: string
  group: string | null
  colorSlot: number | null
  cents: number
  pct: number
  count: number
}

/** gasto por categoría raíz (las subcategorías suman en su padre) */
export function categoryBreakdown(txns: Txn[], cats: Cat[], r: Range, type: 'expense' | 'income' = 'expense'): CategorySlice[] {
  const idx = indexCats(cats)
  const acc = new Map<string, CategorySlice>()
  let total = 0
  for (const t of txns) {
    if (t.type !== type || !inRange(t.date, r)) continue
    const root = rootCat(idx, t.categoryId)
    const key = root?.id ?? 'none'
    const cur = acc.get(key) ?? {
      categoryId: root?.id ?? null,
      name: root?.name ?? 'Sin categoría',
      icon: root?.icon ?? 'circle-dashed',
      group: root?.group ?? null,
      colorSlot: root?.colorSlot ?? null,
      cents: 0,
      pct: 0,
      count: 0,
    }
    cur.cents += t.amountCents
    cur.count++
    total += t.amountCents
    acc.set(key, cur)
  }
  return [...acc.values()]
    .map((s) => ({ ...s, pct: total ? s.cents / total : 0 }))
    .sort((a, b) => b.cents - a.cents)
}

/** capital acumulado: saldo inicial + todo lo registrado hasta cada fecha */
export function balanceAt(txns: Txn[], initialCents: number, date: ISODate): number {
  return initialCents + sum(txns.filter((t) => t.date <= date).map((t) => (t.type === 'income' ? t.amountCents : -t.amountCents)))
}

export type Bucket = { key: string; label: string; start: ISODate; end: ISODate }

const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

/** baldes para gráficos según la granularidad elegida */
export function buckets(g: Granularity, r: Range): Bucket[] {
  const out: Bucket[] = []
  if (g === 'week' || g === 'month') {
    // días (semana) o días agrupados (mes)
    let cur = r.start
    while (cur <= r.end) {
      const d = toDate(cur)
      out.push({ key: cur, label: g === 'week' ? ['lun', 'mar', 'mié', 'jue', 'vie', 'sáb', 'dom'][(d.getUTCDay() + 6) % 7] : String(d.getUTCDate()), start: cur, end: cur })
      cur = addDays(cur, 1)
    }
    return out
  }
  if (g === 'quarter') {
    let cur = startOfWeek(r.start)
    while (cur <= r.end) {
      const end = addDays(cur, 6)
      const d = toDate(cur < r.start ? r.start : cur)
      out.push({ key: cur, label: `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`, start: cur < r.start ? r.start : cur, end: end > r.end ? r.end : end })
      cur = addDays(cur, 7)
    }
    return out
  }
  for (const m of eachMonth(r.start, r.end)) {
    out.push({ key: monthKey(m), label: MONTHS[Number(m.slice(5, 7)) - 1], start: m, end: endOfMonth(m) })
  }
  return out
}

export function monthLabel(d: ISODate, withYear = false) {
  const m = MONTHS[Number(d.slice(5, 7)) - 1]
  return withYear ? `${m} ${d.slice(2, 4)}` : m
}

export type FlowPoint = { key: string; label: string; incomeCents: number; expenseCents: number; netCents: number }

export function cashflowSeries(txns: Txn[], bs: Bucket[]): FlowPoint[] {
  return bs.map((b) => {
    const s = summarize(txns, b)
    return { key: b.key, label: b.label, incomeCents: s.incomeCents, expenseCents: s.expenseCents, netCents: s.netCents }
  })
}

export type BalancePoint = { key: string; label: string; date: ISODate; balanceCents: number }

export function balanceSeries(txns: Txn[], initialCents: number, bs: Bucket[], today: ISODate): BalancePoint[] {
  return bs
    .filter((b) => b.start <= today)
    .map((b) => {
      const date = b.end > today ? today : b.end
      return { key: b.key, label: b.label, date, balanceCents: balanceAt(txns, initialCents, date) }
    })
}
