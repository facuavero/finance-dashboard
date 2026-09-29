import { detectAnomalies, type Anomaly } from './anomalies'
import { budgetStatus, type BudgetInput, type BudgetStatus } from './budgets'
import { type ISODate, periodRange, previousFullMonths } from './dates'
import { forecastMonth, savingCapacity, type MonthForecast, type SavingCapacity } from './forecast'
import { goalStatus, type GoalInput, type GoalStatus } from './goals'
import { microSpending, type MicroReport } from './micro'
import { detectRecurring, recurringTotals, type RecurringItem } from './recurring'
import { balanceAt, categoryBreakdown, compareSummary, summarize, type CategorySlice, type ComparedSummary } from './summary'
import { type Cat, type Txn, mean } from './types'

export type FinancialContext = {
  today: ISODate
  hasData: boolean
  txnCount: number
  balanceCents: number
  month: ComparedSummary
  monthlyIncomeCents: number // ingreso típico (promedio 3 meses completos, o el mes actual si no hay historia)
  monthlyExpenseCents: number
  categories: CategorySlice[]
  micro: MicroReport
  recurring: RecurringItem[]
  recurringTotals: ReturnType<typeof recurringTotals>
  anomalies: Anomaly[]
  budgets: BudgetStatus[]
  goals: GoalStatus[]
  forecast: MonthForecast
  capacity: SavingCapacity
}

export function buildContext(input: {
  txns: Txn[]
  cats: Cat[]
  budgets: BudgetInput[]
  goals: GoalInput[]
  initialBalanceCents: number
  microThresholdCents: number
  today: ISODate
}): FinancialContext {
  const { txns, cats, today } = input
  const month = periodRange('month', today)
  const full = previousFullMonths(today, 3).map((r) => summarize(txns, r)).filter((s) => s.count > 0)
  const cur = summarize(txns, { start: month.start, end: today })
  const monthlyIncome = full.length ? mean(full.map((s) => s.incomeCents)) : cur.incomeCents
  const monthlyExpense = full.length ? mean(full.map((s) => s.expenseCents)) : cur.expenseCents
  const recurring = detectRecurring(txns, cats, today)

  return {
    today,
    hasData: txns.length > 0,
    txnCount: txns.length,
    balanceCents: balanceAt(txns, input.initialBalanceCents, today),
    month: compareSummary(txns, 'month', month, today),
    monthlyIncomeCents: Math.round(monthlyIncome),
    monthlyExpenseCents: Math.round(monthlyExpense),
    categories: categoryBreakdown(txns, cats, { start: month.start, end: today }),
    micro: microSpending(txns, cats, { thresholdCents: input.microThresholdCents, today, monthlyIncomeCents: monthlyIncome }),
    recurring,
    recurringTotals: recurringTotals(recurring),
    anomalies: detectAnomalies(txns, cats, today),
    budgets: input.budgets.map((b) => budgetStatus(b, txns, cats, today)),
    goals: input.goals.map((g) => goalStatus(g, today)),
    forecast: forecastMonth(txns, recurring, input.initialBalanceCents, today),
    capacity: savingCapacity(txns, recurring, today),
  }
}
