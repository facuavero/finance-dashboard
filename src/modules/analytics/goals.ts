import { type ISODate, daysBetween } from './dates'

export type GoalInput = { id: string; name: string; kind: string; targetCents: number; savedCents: number; targetDate: ISODate; startDate: ISODate }
export type GoalState = 'done' | 'on_track' | 'behind' | 'overdue'

export type GoalStatus = GoalInput & {
  pct: number
  remainingCents: number
  monthsLeft: number
  recommendedMonthlyCents: number
  expectedByNowCents: number
  gapCents: number
  state: GoalState
}

export function goalStatus(g: GoalInput, today: ISODate): GoalStatus {
  const pct = g.targetCents > 0 ? Math.min(1, g.savedCents / g.targetCents) : 0
  const remaining = Math.max(0, g.targetCents - g.savedCents)
  const monthsLeft = Math.max(0, daysBetween(today, g.targetDate) / 30.44)
  const total = Math.max(1, daysBetween(g.startDate, g.targetDate))
  const elapsed = Math.min(total, Math.max(0, daysBetween(g.startDate, today)))
  const expected = Math.round((g.targetCents * elapsed) / total)

  let state: GoalState = 'on_track'
  if (g.savedCents >= g.targetCents) state = 'done'
  else if (today > g.targetDate) state = 'overdue'
  else if (elapsed / total > 0.1 && g.savedCents < expected * 0.85) state = 'behind'

  return {
    ...g,
    pct,
    remainingCents: remaining,
    monthsLeft,
    recommendedMonthlyCents: remaining === 0 ? 0 : Math.ceil(remaining / Math.max(1, monthsLeft)),
    expectedByNowCents: expected,
    gapCents: Math.max(0, expected - g.savedCents),
    state,
  }
}
