import type { FinancialContext } from '@/modules/analytics/context'
import { addDays, daysBetween } from '@/modules/analytics/dates'
import type { CombinedReport } from '@/modules/insights/combined'
import type { Recommendation } from '@/modules/ai/rules'
import { money, pct, plural, relativeDays } from '@/lib/format'

export type AlertType =
  | 'budget_near'
  | 'budget_over'
  | 'anomaly'
  | 'bill_due'
  | 'subscription_renewal'
  | 'big_expense'
  | 'goal_behind'
  | 'money_leak'
  | 'saving_opportunity'

export type Severity = 'critical' | 'warning' | 'info' | 'positive'

export type Alert = {
  key: string // estable por período: si se descarta, vuelve recién el período siguiente
  type: AlertType
  severity: Severity
  title: string
  body: string
  href: string
  date: string | null
  score: number
}

export type AlertState = { alertKey: string; status: 'dismissed' | 'snoozed' | 'seen'; until: Date | null }

const SEV: Record<Severity, number> = { critical: 3, warning: 2, info: 1, positive: 1 }
const MAX_ALERTS = 10

/**
 * genera alertas priorizadas. anti-spam: una alerta por concepto, agrupa las del mismo tipo,
 * claves por período (lo descartado no vuelve hasta el próximo) y tope total.
 */
export function buildAlerts(ctx: FinancialContext, extra: { combined?: CombinedReport; recommendations?: Recommendation[] } = {}): Alert[] {
  const out: Alert[] = []
  const month = ctx.today.slice(0, 7)
  const income = Math.max(1, ctx.monthlyIncomeCents)
  const weight = (cents: number) => Math.min(3, (cents / income) * 20)

  for (const b of ctx.budgets) {
    if (b.state === 'over') {
      out.push({
        key: `budget_over:${b.id}:${b.range.start}`,
        type: 'budget_over',
        severity: 'critical',
        title: `Superaste el presupuesto de ${b.name}`,
        body: `Gastaste ${money(b.spentCents)} de ${money(b.amountCents)} (${pct(b.pct)}).`,
        href: '/presupuestos',
        date: ctx.today,
        score: 0,
      })
    } else if (b.state === 'near') {
      out.push({
        key: `budget_near:${b.id}:${b.range.start}`,
        type: 'budget_near',
        severity: 'warning',
        title: `El presupuesto de ${b.name} está por agotarse`,
        body: b.projectedOverOn ? `Va al ${pct(b.pct)}. Al ritmo actual se termina el ${Number(b.projectedOverOn.slice(8))}.` : `Va al ${pct(b.pct)} y te quedan ${money(b.remainingCents)}.`,
        href: '/presupuestos',
        date: ctx.today,
        score: 0,
      })
    }
  }

  const unusual = ctx.anomalies.filter((a) => a.kind === 'unusual_txn')
  for (const a of ctx.anomalies) {
    if (a.kind === 'category_growth') {
      // anti-spam: si ya hay alerta de presupuesto para esa categoría, se suma ahí; si un solo gasto lo explica, alcanza con ese
      const budgetAlert = out.find((x) => x.type.startsWith('budget') && ctx.budgets.find((b) => x.key.includes(b.id))?.categoryId === a.categoryId)
      if (budgetAlert) {
        budgetAlert.body += ` Es ${pct(a.changePct, { sign: true })} contra tu promedio de 3 meses.`
        continue
      }
      if (unusual.some((u) => u.kind === 'unusual_txn' && u.categoryName === a.name && u.amountCents >= a.extraCents * 0.6)) continue
      out.push({ key: `anomaly:${a.categoryId}:${month}`, type: 'anomaly', severity: 'warning', title: `Gasto inusual en ${a.name}`, body: `${pct(a.changePct, { sign: true })} contra tu promedio de 3 meses: ${money(a.extraCents)} de más.`, href: '/fugas#anomalias', date: ctx.today, score: weight(a.extraCents) })
    } else {
      out.push({ key: `anomaly_txn:${a.txnId}`, type: 'anomaly', severity: 'info', title: `Movimiento fuera de lo habitual`, body: `${a.label} por ${money(a.amountCents)} (${a.ratio.toFixed(0)}× lo típico en ${a.categoryName.toLowerCase()}).`, href: '/movimientos', date: a.date, score: weight(a.amountCents) * 0.5 })
    }
  }

  // facturas y cuotas de los próximos 5 días, agrupadas
  const soon = addDays(ctx.today, 5)
  const bills = ctx.recurring.filter((r) => r.type === 'expense' && ['utility', 'housing', 'installment'].includes(r.kind) && r.nextDate >= ctx.today && r.nextDate <= soon)
  if (bills.length) {
    const total = bills.reduce((a, r) => a + r.lastCents, 0)
    out.push({
      key: `bill_due:${bills.map((b) => `${b.key}@${b.nextDate}`).join('|')}`,
      type: 'bill_due',
      severity: 'info',
      title: bills.length === 1 ? `${bills[0].label} vence ${relativeDays(ctx.today, bills[0].nextDate)}` : `${plural(bills.length, 'pago', 'pagos')} fijos en los próximos 5 días`,
      body: bills.length === 1 ? `Monto estimado: ${money(total)}.` : `${bills.map((b) => b.label).join(', ')}. Total estimado: ${money(total)}.`,
      href: '/calendario',
      date: bills[0].nextDate,
      score: weight(total),
    })
  }

  // suscripciones que se renuevan en 3 días (solo se destacan si subieron)
  const renew = ctx.recurring.filter((r) => r.kind === 'subscription' && r.nextDate >= ctx.today && r.nextDate <= addDays(ctx.today, 3))
  if (renew.length) {
    const raised = renew.filter((r) => (r.priceChangePct ?? 0) > 0.05)
    out.push({
      key: `subscription_renewal:${renew.map((r) => `${r.key}@${r.nextDate}`).join('|')}`,
      type: 'subscription_renewal',
      severity: raised.length ? 'warning' : 'info',
      title: renew.length === 1 ? `${renew[0].label} se renueva ${relativeDays(ctx.today, renew[0].nextDate)}` : `${plural(renew.length, 'suscripción', 'suscripciones')} se renuevan en 3 días`,
      body: raised.length ? `${raised.map((r) => `${r.label} subió ${pct(r.priceChangePct)}`).join('. ')}. Revisá si el plan te sigue sirviendo.` : `Total: ${money(renew.reduce((a, r) => a + r.lastCents, 0))}.`,
      href: '/fugas#recurrentes',
      date: renew[0].nextDate,
      score: raised.length ? 1 : 0.2,
    })
  }

  // gastos futuros importantes (gmail + calendar)
  for (const f of extra.combined?.findings ?? []) {
    if (f.impact !== 'negative' || !f.amountCents || !f.date) continue
    if (f.amountCents < income * 0.08) continue
    out.push({
      key: `big_expense:${f.key}`,
      type: 'big_expense',
      severity: 'warning',
      title: f.title,
      body: `${f.detail}`,
      href: '/calendario',
      date: f.date,
      score: weight(f.amountCents) + (daysBetween(ctx.today, f.date) <= 7 ? 1 : 0),
    })
  }

  for (const g of ctx.goals.filter((x) => x.state === 'behind' || x.state === 'overdue')) {
    out.push({ key: `goal_behind:${g.id}:${month}`, type: 'goal_behind', severity: g.state === 'overdue' ? 'critical' : 'warning', title: `"${g.name}" va atrasado`, body: `Llevás ${pct(g.pct)}. Para estar al día faltan ${money(g.gapCents)}.`, href: '/objetivos', date: g.targetDate, score: 1 })
  }

  if (ctx.micro.pctOfIncome !== null && ctx.micro.pctOfIncome > 0.04) {
    out.push({ key: `money_leak:${month}`, type: 'money_leak', severity: 'warning', title: 'Posible fuga de dinero en compras chicas', body: `Gastaste ${money(ctx.micro.thisMonth.totalCents)} este mes en compras menores a ${money(ctx.micro.thresholdCents)}. Al año son ~${money(ctx.micro.annualEstimateCents)}.`, href: '/fugas#microgastos', date: ctx.today, score: weight(ctx.micro.monthlyAvgCents) })
  }

  const best = extra.recommendations?.find((r) => r.impactMonthlyCents && r.area !== 'objetivos' && r.area !== 'gastos')
  if (best?.impactMonthlyCents) {
    out.push({ key: `saving_opportunity:${best.id}:${month}`, type: 'saving_opportunity', severity: 'positive', title: 'Oportunidad de ahorro', body: `${best.problem} ${best.impactAnnualCents ? `Podrías liberar ~${money(best.impactAnnualCents)} al año.` : ''}`, href: '/ia', date: ctx.today, score: weight(best.impactMonthlyCents) * 0.6 })
  }

  for (const a of out) a.score += SEV[a.severity] * 2
  return out.sort((a, b) => b.score - a.score)
}

/** filtra descartadas y pospuestas. `top` son las más importantes para el header y el inicio. */
export function applyStates(alerts: Alert[], states: AlertState[], now = new Date()): { active: Alert[]; top: Alert[]; hidden: number } {
  const map = new Map(states.map((s) => [s.alertKey, s]))
  const active = alerts.filter((a) => {
    const s = map.get(a.key)
    if (!s) return true
    if (s.status === 'dismissed') return false
    if (s.status === 'snoozed') return !!s.until && s.until < now
    return true
  })
  return { active, top: active.slice(0, MAX_ALERTS), hidden: alerts.length - active.length }
}
