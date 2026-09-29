import { describe, expect, it } from 'vitest'
import { categoryGrowth, unusualTransactions } from '../anomalies'
import { budgetStatus } from '../budgets'
import { forecastMonth, savingCapacity } from '../forecast'
import { goalStatus } from '../goals'
import { keywordGroup, normalizeMerchant, parseInstallment } from '../merchant'
import { microSpending } from '../micro'
import { detectRecurring } from '../recurring'
import { simulate } from '../simulator'
import { categoryBreakdown, compareSummary, summarize } from '../summary'
import { periodRange } from '../dates'
import { demoFixture, txn } from './fixtures'

const TODAY = '2026-09-29'
const { cats, txns, data } = demoFixture(TODAY)

describe('merchant', () => {
  it('normaliza descripciones del mismo comercio', () => {
    expect(normalizeMerchant('PedidosYa *Mostaza 1234')).toBe(normalizeMerchant('PEDIDOSYA *Mostaza'))
    expect(normalizeMerchant('Netflix.com')).toBe('netflix')
  })
  it('detecta cuotas', () => {
    expect(parseInstallment('Samsung Galaxy cuota 4/12')).toEqual({ current: 4, total: 12 })
    expect(parseInstallment('Heladera cuota 3 de 9')).toEqual({ current: 3, total: 9 })
    expect(parseInstallment('Café')).toBeNull()
  })
  it('agrupa por palabra clave', () => {
    expect(keywordGroup('Rappi *Sushi')).toBe('delivery')
    expect(keywordGroup('Uber Eats')).toBe('delivery')
    expect(keywordGroup('Uber')).toBe('rides')
    expect(keywordGroup('Maxikiosco')).toBe('coffee')
  })
})

describe('resumen', () => {
  it('ingresos, gastos y tasa de ahorro', () => {
    const s = summarize(
      [txn({ type: 'income', amountCents: 100_00, date: '2026-09-01', description: 'x' }), txn({ amountCents: 40_00, date: '2026-09-02', description: 'y' })],
      periodRange('month', TODAY),
    )
    expect(s).toMatchObject({ incomeCents: 100_00, expenseCents: 40_00, netCents: 60_00, savingsRate: 0.6 })
  })
  it('compara contra el mismo tramo del mes anterior', () => {
    const c = compareSummary(txns, 'month', periodRange('month', TODAY), TODAY)
    expect(c.previousRange).toEqual({ start: '2026-08-01', end: '2026-08-29' })
    expect(c.incomeCents).toBeGreaterThan(0)
  })
  it('las subcategorías suman en la categoría padre', () => {
    const b = categoryBreakdown(txns, cats, periodRange('month', TODAY))
    const hogar = b.find((s) => s.categoryId === 'hogar')
    expect(hogar?.cents).toBeGreaterThan(520_000_00)
    expect(b.every((s) => s.categoryId !== 'alquiler')).toBe(true)
    expect(b.reduce((a, s) => a + s.pct, 0)).toBeCloseTo(1, 5)
  })
})

describe('microgastos', () => {
  const m = microSpending(txns, cats, { thresholdCents: 5_000_00, today: TODAY, monthlyIncomeCents: 1_970_000_00 })
  it('suma lo que está bajo el umbral este mes', () => {
    expect(m.thisMonth.count).toBeGreaterThan(15)
    expect(m.thisMonth.totalCents).toBeGreaterThan(50_000_00)
  })
  it('encuentra delivery y cafés como patrones', () => {
    const labels = m.patterns.map((p) => p.group)
    expect(labels).toContain('delivery')
    expect(labels).toContain('coffee')
    const delivery = m.patterns.find((p) => p.group === 'delivery')!
    expect(delivery.annualCents).toBe(delivery.monthlyCents * 12)
    expect(delivery.save30Cents).toBe(Math.round(delivery.monthlyCents * 0.3))
    expect(delivery.pctOfIncome).toBeGreaterThan(0)
  })
  it('no mete supermercado ni suscripciones', () => {
    expect(m.patterns.some((p) => p.group === 'groceries' || p.group === 'subscriptions')).toBe(false)
  })
})

describe('recurrentes', () => {
  const items = detectRecurring(txns, cats, TODAY)
  const byLabel = (s: string) => items.find((i) => i.label.toLowerCase().includes(s))
  it('detecta suscripciones sin que estén marcadas', () => {
    expect(byLabel('netflix')?.kind).toBe('subscription')
    expect(byLabel('spotify')?.frequency).toBe('monthly')
  })
  it('detecta la suba de precio', () => {
    expect(byLabel('netflix')?.priceChangePct).toBeGreaterThan(0.1)
    expect(byLabel('netflix')?.reviewHint).toMatch(/Subió/)
  })
  it('cuotas con las que faltan', () => {
    const cuota = byLabel('samsung')
    expect(cuota?.kind).toBe('installment')
    expect(cuota?.installment?.total).toBe(12)
    expect(cuota?.installment?.remaining).toBeGreaterThanOrEqual(0)
  })
  it('sueldo como ingreso recurrente', () => {
    expect(items.find((i) => i.type === 'income' && i.label.includes('Sueldo'))).toBeTruthy()
  })
  it('próxima fecha en el futuro', () => {
    for (const i of items) expect(i.nextDate >= '2026-09-24').toBe(true)
  })
  it('no confunde cafés con recurrentes', () => {
    expect(items.some((i) => /martinez|havanna/i.test(i.label))).toBe(false)
  })
})

describe('anomalías', () => {
  it('restaurantes crecieron contra los últimos 3 meses', () => {
    const a = categoryGrowth(txns, cats, TODAY)
    const resto = a.find((x) => x.categoryId === 'resto')
    expect(resto).toBeTruthy()
    expect(resto!.changePct).toBeGreaterThan(0.25)
  })
  it('detecta la compra fuera de lo normal', () => {
    const u = unusualTransactions(txns, cats, TODAY)
    expect(u.some((x) => x.label.includes('Auriculares'))).toBe(true)
  })
  it('una categoría estable no dispara nada', () => {
    const flat = [1, 2, 3, 4].flatMap((m) => [txn({ amountCents: 100_00, date: `2026-0${5 + m}-10`, description: 'x', categoryId: 'super' })])
    expect(categoryGrowth(flat, cats, '2026-09-29')).toHaveLength(0)
  })
})

describe('predicción', () => {
  const items = detectRecurring(txns, cats, TODAY)
  it('saldo a fin de mes = hoy + ingresos previstos − fijos − variable', () => {
    const f = forecastMonth(txns, items, data.initialBalanceCents, TODAY)
    expect(f.endOfMonthBalanceCents).toBe(f.balanceNowCents + f.expectedIncomeCents - f.expectedFixedCents - f.expectedVariableCents)
    expect(f.remainingDays).toBe(1)
    expect(f.series.at(-1)?.estimatedCents).not.toBeNull()
    expect(f.series[0].realCents).not.toBeNull()
  })
  it('capacidad de ahorro positiva con el perfil demo', () => {
    const c = savingCapacity(txns, items, TODAY)
    expect(c.typicalIncomeCents).toBeGreaterThan(c.fixedCents)
    expect(c.months).toBe(3)
  })
})

describe('simulador', () => {
  it('sin rendimiento suma los aportes', () => {
    const s = simulate({ initialCents: 0, monthlySavingCents: 100_00, monthlyInvestCents: 0, annualRatePct: 0, expenseReductionCents: 50_00 })
    expect(s.milestones[0]).toMatchObject({ years: 1, totalCents: 1800_00, returnCents: 0 })
  })
  it('con rendimiento compone', () => {
    const s = simulate({ initialCents: 0, monthlySavingCents: 0, monthlyInvestCents: 100_00, annualRatePct: 12, expenseReductionCents: 0 })
    const y10 = s.milestones.find((m) => m.years === 10)!
    expect(y10.totalCents).toBeGreaterThan(y10.contributedCents)
    expect(y10.lowCents).toBeLessThan(y10.totalCents)
    expect(y10.highCents).toBeGreaterThan(y10.totalCents)
  })
})

describe('presupuestos y objetivos', () => {
  it('estado del presupuesto', () => {
    const b = budgetStatus({ id: 'b', name: 'Delivery', categoryId: 'delivery', period: 'monthly', amountCents: 50_000_00 }, txns, cats, TODAY)
    expect(b.state).toBe('over')
    expect(b.remainingCents).toBeLessThan(0)
  })
  it('objetivo atrasado y aporte recomendado', () => {
    const g = goalStatus({ id: 'g', name: 'Viaje', kind: 'travel', targetCents: 1_200_000_00, savedCents: 380_000_00, startDate: '2026-05-01', targetDate: '2026-10-07' }, TODAY)
    expect(g.state).toBe('behind')
    expect(g.recommendedMonthlyCents).toBe(g.remainingCents)
  })
  it('objetivo en fecha', () => {
    const g = goalStatus({ id: 'g', name: 'Fondo', kind: 'emergency', targetCents: 1200_00, savedCents: 600_00, startDate: '2026-01-01', targetDate: '2026-12-31' }, '2026-06-01')
    expect(g.state).toBe('on_track')
  })
})
