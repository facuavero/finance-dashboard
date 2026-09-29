export type SimInput = {
  initialCents: number // capital inicial invertido (rinde a la tasa)
  monthlySavingCents: number
  monthlyInvestCents: number
  annualRatePct: number // rendimiento anual estimado (real, descontada la inflación)
  expenseReductionCents: number // lo que deja de gastar por mes y pasa a ahorro
}

export type SimPoint = { month: number; savedCents: number; investedCents: number; contributedCents: number; totalCents: number }
export type Milestone = { years: number; totalCents: number; contributedCents: number; returnCents: number; lowCents: number; highCents: number }

function run(input: SimInput, ratePct: number, months: number): SimPoint[] {
  const r = Math.max(-0.99, ratePct / 100) / 12
  let saved = 0
  let invested = input.initialCents
  let contributed = input.initialCents
  const out: SimPoint[] = [{ month: 0, savedCents: 0, investedCents: invested, contributedCents: contributed, totalCents: invested }]
  for (let m = 1; m <= months; m++) {
    saved += input.monthlySavingCents + input.expenseReductionCents
    invested = invested * (1 + r) + input.monthlyInvestCents
    contributed += input.monthlySavingCents + input.expenseReductionCents + input.monthlyInvestCents
    out.push({ month: m, savedCents: Math.round(saved), investedCents: Math.round(invested), contributedCents: Math.round(contributed), totalCents: Math.round(saved + invested) })
  }
  return out
}

export const MILESTONES = [1, 3, 5, 10] as const

/** escenario base + pesimista/optimista (±3 puntos de rendimiento). nada de esto es una garantía. */
export function simulate(input: SimInput, years = 10) {
  const months = years * 12
  const base = run(input, input.annualRatePct, months)
  const low = run(input, Math.max(0, input.annualRatePct - 3), months)
  const high = run(input, input.annualRatePct + 3, months)
  const milestones: Milestone[] = MILESTONES.filter((y) => y <= years).map((y) => {
    const p = base[y * 12]
    return { years: y, totalCents: p.totalCents, contributedCents: p.contributedCents, returnCents: p.totalCents - p.contributedCents, lowCents: low[y * 12].totalCents, highCents: high[y * 12].totalCents }
  })
  return { series: base.filter((p) => p.month % 12 === 0), low, high, milestones }
}
