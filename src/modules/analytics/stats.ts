import { type Granularity, type ISODate, type Range, addDays, periodRange, previousComparableRange, previousRange, inRange } from './dates'
import { normalizeMerchant } from './merchant'
import type { RecurringItem } from './recurring'
import { balanceAt, categoryBreakdown, summarize, type CategorySlice } from './summary'
import { type Cat, type Txn, indexCats, rootCat, sum } from './types'

const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
const COUNT: Record<Granularity, number> = { week: 12, month: 12, quarter: 8, year: 5 }

export function periodLabel(g: Granularity, r: Range): string {
  const m = (d: ISODate) => MONTHS[Number(d.slice(5, 7)) - 1]
  switch (g) {
    case 'week':
      return `${Number(r.start.slice(8))} ${m(r.start)}`
    case 'month':
      return `${m(r.start)} ${r.start.slice(2, 4)}`
    case 'quarter':
      return `T${Math.floor((Number(r.start.slice(5, 7)) - 1) / 3) + 1} ${r.start.slice(2, 4)}`
    case 'year':
      return r.start.slice(0, 4)
  }
}

export function periodTitle(g: Granularity, r: Range): string {
  const m = (d: ISODate) => MONTHS[Number(d.slice(5, 7)) - 1]
  switch (g) {
    case 'week':
      return `Semana del ${Number(r.start.slice(8))} ${m(r.start)} al ${Number(r.end.slice(8))} ${m(r.end)}`
    case 'month':
      return `${['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'][Number(r.start.slice(5, 7)) - 1]} ${r.start.slice(0, 4)}`
    case 'quarter':
      return `${periodLabel(g, r).replace(/ \d+$/, '')} de ${r.start.slice(0, 4)}`
    case 'year':
      return `Año ${r.start.slice(0, 4)}`
  }
}

export type PeriodPoint = {
  key: string
  label: string
  range: Range
  incomeCents: number
  expenseCents: number
  netCents: number
  savingsRate: number | null
  balanceCents: number
  microCents: number
  recurringCents: number
  variableCents: number
  partial: boolean
}

export type CategoryCompare = CategorySlice & { previousCents: number; changePct: number | null }

export function buildStats(input: { txns: Txn[]; cats: Cat[]; recurring: RecurringItem[]; initialCents: number; g: Granularity; anchor: ISODate; today: ISODate; microThresholdCents: number }) {
  const { txns, cats, g, anchor, today } = input
  const idx = indexCats(cats)
  const recKeys = new Set(input.recurring.map((r) => r.key))
  const isRecurring = (t: Txn) => t.recurrence !== 'none' || recKeys.has(`${t.type}:${normalizeMerchant(t.description)}`)

  // últimos N períodos terminando en el período del ancla
  const ranges: Range[] = []
  let r = periodRange(g, anchor)
  for (let i = 0; i < COUNT[g]; i++) {
    ranges.unshift(r)
    r = previousRange(g, r)
  }
  const firstTxn = txns.reduce<ISODate | null>((a, t) => (!a || t.date < a ? t.date : a), null)
  const series: PeriodPoint[] = ranges
    .filter((x) => x.start <= today && (!firstTxn || x.end >= firstTxn))
    .map((x) => {
      const end = x.end > today ? today : x.end
      const clipped = { start: x.start, end }
      const s = summarize(txns, clipped)
      const exp = txns.filter((t) => t.type === 'expense' && inRange(t.date, clipped))
      const rec = sum(exp.filter(isRecurring).map((t) => t.amountCents))
      return {
        key: x.start,
        label: periodLabel(g, x),
        range: x,
        incomeCents: s.incomeCents,
        expenseCents: s.expenseCents,
        netCents: s.netCents,
        savingsRate: s.savingsRate,
        balanceCents: balanceAt(txns, input.initialCents, end),
        microCents: sum(exp.filter((t) => t.amountCents < input.microThresholdCents && !isRecurring(t)).map((t) => t.amountCents)),
        recurringCents: rec,
        variableCents: s.expenseCents - rec,
        partial: x.end > today,
      }
    })

  const current = periodRange(g, anchor)
  const previous = previousRange(g, current)
  const curClip = { start: current.start, end: current.end > today ? today : current.end }
  const cur = categoryBreakdown(txns, cats, curClip)
  // si el período está en curso se compara contra el mismo tramo del anterior
  const prevComparable = current.end > today ? previousComparableRange(g, current, today) : previous
  const prev = categoryBreakdown(txns, cats, prevComparable)
  const prevMap = new Map(prev.map((p) => [p.categoryId, p.cents]))
  const categories: CategoryCompare[] = cur.map((c) => {
    const p = prevMap.get(c.categoryId) ?? 0
    return { ...c, previousCents: p, changePct: p > 0 ? (c.cents - p) / p : null }
  })
  // categorías que existían antes y ahora no aparecen
  for (const p of prev) if (!cur.some((c) => c.categoryId === p.categoryId)) categories.push({ ...p, cents: 0, pct: 0, count: 0, previousCents: p.cents, changePct: -1 })

  // evolución de las 4 categorías con más gasto en toda la ventana (color fijo por categoría)
  const windowRange = { start: series[0]?.range.start ?? current.start, end: today }
  const top = categoryBreakdown(txns, cats, windowRange).filter((c) => c.colorSlot).slice(0, 4)
  const categorySeries = series.map((p) => {
    const row: Record<string, number | string> = { label: p.label }
    for (const c of top) {
      row[c.categoryId ?? 'none'] = sum(txns.filter((t) => t.type === 'expense' && inRange(t.date, { start: p.range.start, end: p.range.end > today ? today : p.range.end }) && rootCat(idx, t.categoryId)?.id === c.categoryId).map((t) => t.amountCents))
    }
    return row
  })

  return {
    g,
    current,
    previous,
    isCurrentPeriod: current.end >= today && current.start <= today,
    title: periodTitle(g, current),
    summary: summarize(txns, curClip),
    previousSummary: summarize(txns, prevComparable),
    series,
    categories,
    topCategories: top.map((c) => ({ key: c.categoryId ?? 'none', name: c.name, slot: c.colorSlot })),
    categorySeries,
    nextAnchor: current.end < today ? addDays(current.end, 1) : null,
    prevAnchor: previous.start,
  }
}
