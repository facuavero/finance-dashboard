import { type ISODate, type Range, addDays, daysBetween, periodRange } from './dates'
import { type Cat, type Txn, indexCats, rootCat } from './types'

export type BudgetInput = { id: string; name: string; categoryId: string | null; period: 'weekly' | 'monthly' | 'yearly'; amountCents: number }
export type BudgetState = 'ok' | 'near' | 'over'

export type BudgetStatus = BudgetInput & {
  range: Range
  spentCents: number
  remainingCents: number
  pct: number
  elapsedPct: number
  daysLeft: number
  projectedCents: number
  projectedOverOn: ISODate | null
  state: BudgetState
}

const G = { weekly: 'week', monthly: 'month', yearly: 'year' } as const

export function budgetStatus(b: BudgetInput, txns: Txn[], cats: Cat[], today: ISODate): BudgetStatus {
  const idx = indexCats(cats)
  const range = periodRange(G[b.period], today)
  let spent = 0
  for (const t of txns) {
    if (t.type !== 'expense' || t.date < range.start || t.date > today) continue
    if (b.categoryId && rootCat(idx, t.categoryId)?.id !== b.categoryId) continue
    spent += t.amountCents
  }
  const totalDays = daysBetween(range.start, range.end) + 1
  const elapsedDays = daysBetween(range.start, today) + 1
  const elapsedPct = elapsedDays / totalDays
  const projected = elapsedPct > 0 ? spent / elapsedPct : spent
  const pct = b.amountCents > 0 ? spent / b.amountCents : 0

  let projectedOverOn: ISODate | null = null
  if (spent > 0 && spent < b.amountCents) {
    const perDay = spent / elapsedDays
    const day = Math.ceil(b.amountCents / perDay)
    if (day <= totalDays) projectedOverOn = addDays(range.start, day - 1)
  }

  let state: BudgetState = 'ok'
  if (pct >= 1) state = 'over'
  else if (pct >= 0.8 || (elapsedPct >= 0.25 && projected > b.amountCents * 1.05)) state = 'near'

  return { ...b, range, spentCents: spent, remainingCents: b.amountCents - spent, pct, elapsedPct, daysLeft: totalDays - elapsedDays, projectedCents: Math.round(projected), projectedOverOn, state }
}
