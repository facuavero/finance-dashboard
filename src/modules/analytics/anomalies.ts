import { type ISODate, addDays, addMonths, dayOfMonth, daysInMonth, inRange, startOfMonth } from './dates'
import { merchantLabel, normalizeMerchant } from './merchant'
import { type Cat, type Txn, indexCats, mean, median, rootCat, sum } from './types'

export type CategoryAnomaly = {
  kind: 'category_growth'
  key: string
  categoryId: string
  name: string
  currentCents: number
  baselineCents: number // promedio de los 3 meses anteriores al mismo día del mes
  changePct: number
  extraCents: number
  months: number
}

export type TxnAnomaly = {
  kind: 'unusual_txn'
  key: string
  txnId: string
  label: string
  categoryName: string
  amountCents: number
  typicalCents: number
  ratio: number
  date: ISODate
  isNewMerchant: boolean
}

export type Anomaly = CategoryAnomaly | TxnAnomaly

/**
 * compara el mes en curso (hasta hoy) contra el promedio de los 3 meses anteriores cortados al mismo día.
 * así el día 15 no se compara medio mes contra meses completos.
 */
export function categoryGrowth(txns: Txn[], cats: Cat[], today: ISODate, opts: { minPct?: number; minExtraCents?: number } = {}): CategoryAnomaly[] {
  const minPct = opts.minPct ?? 0.25
  const minExtra = opts.minExtraCents ?? 1_000_000 // $10.000
  const idx = indexCats(cats)
  const dom = dayOfMonth(today)
  const cur = { start: startOfMonth(today), end: today }
  const prevRanges = [1, 2, 3].map((i) => {
    const start = addMonths(startOfMonth(today), -i)
    const end = addDays(start, Math.min(dom, daysInMonth(start)) - 1)
    return { start, end }
  })

  const byCat = new Map<string, { cur: number; prev: number[] }>()
  for (const t of txns) {
    if (t.type !== 'expense') continue
    const root = rootCat(idx, t.categoryId)
    if (!root) continue
    const e = byCat.get(root.id) ?? { cur: 0, prev: [0, 0, 0] }
    if (inRange(t.date, cur)) e.cur += t.amountCents
    prevRanges.forEach((r, i) => {
      if (inRange(t.date, r)) e.prev[i] += t.amountCents
    })
    byCat.set(root.id, e)
  }

  const out: CategoryAnomaly[] = []
  for (const [id, e] of byCat) {
    const active = e.prev.filter((v) => v > 0)
    if (active.length < 2) continue // sin historia suficiente no se juzga
    const base = mean(e.prev)
    if (base <= 0) continue
    const change = (e.cur - base) / base
    const extra = e.cur - base
    // fuera del comportamiento habitual: arriba del promedio y también arriba del máximo reciente
    const outOfRange = e.cur > Math.max(...e.prev) * 1.1
    if (change >= minPct && extra >= minExtra && outOfRange) {
      out.push({
        kind: 'category_growth',
        key: `growth:${id}:${today.slice(0, 7)}`,
        categoryId: id,
        name: idx.get(id)?.name ?? 'Categoría',
        currentCents: e.cur,
        baselineCents: Math.round(base),
        changePct: change,
        extraCents: Math.round(extra),
        months: 3,
      })
    }
  }
  return out.sort((a, b) => b.extraCents - a.extraCents)
}

/** movimientos de los últimos 30 días muy por encima de lo habitual en su categoría */
export function unusualTransactions(txns: Txn[], cats: Cat[], today: ISODate): TxnAnomaly[] {
  const idx = indexCats(cats)
  const recentStart = addDays(today, -29)
  const history = txns.filter((t) => t.type === 'expense' && t.date < recentStart && t.date >= addMonths(today, -12))
  const seenMerchants = new Set(history.map((t) => normalizeMerchant(t.description)))

  const out: TxnAnomaly[] = []
  for (const t of txns) {
    if (t.type !== 'expense' || t.date < recentStart || t.date > today || t.recurrence !== 'none') continue
    const root = rootCat(idx, t.categoryId)
    const peers = history.filter((h) => rootCat(idx, h.categoryId)?.id === root?.id).map((h) => h.amountCents)
    if (peers.length < 5) continue
    const typical = median(peers)
    const p90 = [...peers].sort((a, b) => a - b)[Math.floor(peers.length * 0.9)]
    const ratio = typical > 0 ? t.amountCents / typical : 0
    if (ratio >= 3 && t.amountCents > p90 * 1.5) {
      out.push({
        kind: 'unusual_txn',
        key: `txn:${t.id}`,
        txnId: t.id,
        label: merchantLabel(t.description),
        categoryName: root?.name ?? 'Sin categoría',
        amountCents: t.amountCents,
        typicalCents: Math.round(typical),
        ratio,
        date: t.date,
        isNewMerchant: !seenMerchants.has(normalizeMerchant(t.description)),
      })
    }
  }
  return out.sort((a, b) => b.amountCents - a.amountCents).slice(0, 5)
}

export function detectAnomalies(txns: Txn[], cats: Cat[], today: ISODate): Anomaly[] {
  return [...categoryGrowth(txns, cats, today), ...unusualTransactions(txns, cats, today)]
}

export const anomaliesTotalExtra = (xs: Anomaly[]) =>
  sum(xs.map((a) => (a.kind === 'category_growth' ? a.extraCents : a.amountCents - a.typicalCents)))
