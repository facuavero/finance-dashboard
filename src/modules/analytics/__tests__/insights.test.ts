import { describe, expect, it } from 'vitest'
import { parseEmail, parseEvent, extractAmount } from '@/modules/integrations/parse'
import { demoEmails, demoEvents } from '@/modules/demo/signals'
import { combineSignals, type Signal } from '@/modules/insights/combined'
import { buildContext } from '../context'
import { buildRecommendations, ruleSummary } from '@/modules/ai/rules'
import { buildAlerts, applyStates } from '@/modules/alerts/engine'
import { demoFixture } from './fixtures'

const TODAY = '2026-09-29'
const { cats, txns, data } = demoFixture(TODAY)
const ctx = buildContext({
  txns,
  cats,
  budgets: data.budgets.map((b, i) => ({ id: `b${i}`, name: b.name, categoryId: b.cat, period: b.period, amountCents: b.amountCents })),
  goals: data.goals.map((g) => ({ id: g.key, name: g.name, kind: g.kind, targetCents: g.targetCents, savedCents: g.savedCents, targetDate: g.targetDate, startDate: g.startDate })),
  initialBalanceCents: data.initialBalanceCents,
  microThresholdCents: 5_000_00,
  today: TODAY,
})

const signals: Signal[] = [
  ...demoEmails(TODAY).map(parseEmail).filter((x) => x !== null).map((p) => ({ ...p!, id: p!.externalId, provider: 'gmail' as const })),
  ...demoEvents(TODAY).map(parseEvent).map((p) => ({ ...p, id: p.externalId, provider: 'gcal' as const })),
]

describe('parser de correos', () => {
  it('extrae montos en formato argentino', () => {
    expect(extractAmount('Total $ 312.000 a pagar')).toEqual({ cents: 312_000_00, currency: 'ARS' })
    expect(extractAmount('Importe $1.234,50')).toEqual({ cents: 1_234_50, currency: 'ARS' })
  })
  it('descarta promociones y correos sin contexto', () => {
    const parsed = demoEmails(TODAY).map(parseEmail)
    expect(parsed.find((p) => p?.externalId === 'demo-mail-6')).toBeUndefined()
    expect(parsed.find((p) => p?.externalId === 'demo-mail-8')).toBeUndefined()
  })
  it('clasifica reserva, vuelo, suscripción, factura e ingreso', () => {
    const kinds = Object.fromEntries(demoEmails(TODAY).map(parseEmail).filter(Boolean).map((p) => [p!.externalId, p!.kind]))
    expect(kinds['demo-mail-1']).toBe('booking')
    expect(kinds['demo-mail-2']).toBe('flight')
    expect(kinds['demo-mail-3']).toBe('subscription')
    expect(kinds['demo-mail-4']).toBe('invoice')
    expect(kinds['demo-mail-5']).toBe('income')
  })
  it('eventos', () => {
    expect(parseEvent({ id: 'x', summary: 'Cumple de Juan', start: TODAY, end: null }).kind).toBe('birthday')
    expect(parseEvent({ id: 'x', summary: 'Daily standup', start: TODAY, end: null }).kind).toBe('meeting')
  })
})

describe('análisis combinado', () => {
  const r = combineSignals({ signals, txns, cats, recurring: ctx.recurring, today: TODAY, dailyVariableCents: ctx.forecast.dailyVariableCents })
  it('reserva sin registrar = impacto negativo', () => {
    const f = r.findings.find((x) => x.key.startsWith('booking:'))
    expect(f?.impact).toBe('negative')
    expect(f?.title).toMatch(/todavía no registraste/)
  })
  it('vuelo ya pagado = sin impacto nuevo', () => {
    const f = r.findings.find((x) => x.key.startsWith('trip-flight:'))
    expect(f?.impact).toBe('none')
    expect(f?.title).toMatch(/Gmail tiene la confirmación del vuelo/)
  })
  it('renovación con aumento', () => {
    const f = r.findings.find((x) => x.key.startsWith('sub:'))
    expect(f?.impact).toBe('negative')
    expect(f?.title).toMatch(/aumentará/)
  })
  it('ingreso positivo y reunión sin impacto', () => {
    expect(r.findings.some((x) => x.impact === 'positive')).toBe(true)
    expect(r.findings.some((x) => x.impact === 'none' && x.title.includes('Reunión'))).toBe(true)
  })
  it('resumen con conteos y total estimado', () => {
    expect(r.summary).toMatch(/^Durante las próximas dos semanas tenés un viaje/)
    expect(r.summary).toMatch(/gastos potenciales/)
    expect(r.potentialExpenseCents).toBeGreaterThan(0)
  })
})

describe('recomendaciones y alertas', () => {
  const recs = buildRecommendations(ctx)
  it('cada recomendación trae problema, explicación, acción y prioridad', () => {
    expect(recs.length).toBeGreaterThan(4)
    for (const r of recs) {
      expect(r.problem.length).toBeGreaterThan(10)
      expect(r.explanation.length).toBeGreaterThan(10)
      expect(r.action.length).toBeGreaterThan(10)
      expect(['alta', 'media', 'baja']).toContain(r.priority)
    }
  })
  it('usa datos reales (montos concretos, no genéricos)', () => {
    const delivery = recs.find((r) => r.id === 'micro:group:delivery')!
    expect(delivery.problem).toMatch(/Detectamos \$[\d.]+ mensuales en delivery/)
    expect(delivery.impactAnnualCents).toBe(delivery.impactMonthlyCents! * 12)
  })
  it('las suscripciones sugieren revisar, nunca cancelar', () => {
    for (const r of recs.filter((x) => x.area === 'recurrentes')) expect(`${r.action}`).not.toMatch(/cancel/i)
  })
  it('resumen sin ia', () => {
    expect(ruleSummary(ctx)).toMatch(/En lo que va del mes/)
  })
  it('alertas priorizadas, sin duplicados y respetando descartes', () => {
    const alerts = buildAlerts(ctx, { recommendations: recs })
    const keys = alerts.map((a) => a.key)
    expect(new Set(keys).size).toBe(keys.length)
    expect(alerts[0].score).toBeGreaterThanOrEqual(alerts.at(-1)!.score)
    const { active } = applyStates(alerts, [{ alertKey: alerts[0].key, status: 'dismissed', until: null }])
    expect(active.some((a) => a.key === alerts[0].key)).toBe(false)
  })
})

import { currencyAsk, explicitCurrency, ruleNotes, ruleParseTxn, toArs, type CurrencyRates } from '@/modules/ai/parse-txn'
import { rulePlan } from '@/modules/ai/assistant'

describe('moneda en la carga con IA', () => {
  const rates: CurrencyRates = { arsPer: { ARS: 1, USD: 1000, EUR: 1200, BRL: 200 }, asOf: '2026-10-07', live: true }
  it('un monto sin moneda no es dólares', () => {
    expect(explicitCurrency('pedidosya 5000')).toBeNull()
    expect(explicitCurrency('pedidosya 5000 pesos')).toBe('ARS')
    expect(explicitCurrency('netflix 12 usd')).toBe('USD')
    expect(explicitCurrency('50 dólares')).toBe('USD')
    expect(explicitCurrency('30 euros')).toBe('EUR')
  })
  it('convierte a pesos y avisa la cotización', () => {
    const r = toArs(50_00, 'USD', rates)
    expect(r.cents).toBe(50_000_00)
    expect(r.note?.kind).toBe('converted')
  })
  it('pregunta solo si la app no está en pesos y el texto no dice la moneda', () => {
    expect(currencyAsk('pedidosya 5000', 'ARS', rates)).toBeNull()
    expect(currencyAsk('pedidosya 5000 usd', 'USD', rates)).toBeNull()
    const ask = currencyAsk('pedidosya 5000', 'USD', rates)
    expect(ask?.options.map((o) => o.factor)).toEqual([1, 1000])
  })
  it('avisa lo que no entendió', () => {
    const r = ruleParseTxn('algo raro', [], '2026-10-07')
    expect(ruleNotes('algo raro', r.found, '2026-10-07').map((n) => n.text)).toContain('No encontré el monto.')
  })
  it('crea categorías por texto y convierte por línea', () => {
    const plan = rulePlan('categoría gimnasio\npagué 50 usd de netflix', [], '2026-10-07', rates, [])
    expect(plan.categories[0]?.name).toBe('Gimnasio')
    expect(plan.transactions[0].amountCents).toBe(50_000_00)
  })
})

import { money, setClientFormat, toBaseCents, amountText } from '@/lib/format'

describe('moneda de visualización', () => {
  it('convierte al mostrar y al escribir', () => {
    setClientFormat({ currency: 'USD', decimals: false, rate: 0.001 })
    expect(money(1_000_000_00)).toBe('US$1.000')
    expect(toBaseCents(1_000_00)).toBe(1_000_000_00)
    expect(amountText(1_000_000_00)).toBe('1000')
    setClientFormat({ currency: 'ARS', decimals: false, rate: 1 })
    expect(money(42_000_00)).toBe('$42.000')
  })
})
