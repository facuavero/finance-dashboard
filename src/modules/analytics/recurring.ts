import { type ISODate, addDays, addMonths, daysBetween } from './dates'
import { keywordGroup, merchantLabel, normalizeMerchant, parseInstallment } from './merchant'
import { type Cat, type Txn, indexCats, mean, median, stdev, txnGroup } from './types'

export type RecurringKind = 'subscription' | 'installment' | 'utility' | 'housing' | 'income' | 'other'
export type Frequency = 'weekly' | 'monthly' | 'yearly'

export type RecurringItem = {
  key: string
  label: string
  type: 'expense' | 'income'
  kind: RecurringKind
  frequency: Frequency
  lastCents: number
  avgCents: number
  monthlyCents: number
  annualCents: number
  lastDate: ISODate
  nextDate: ISODate
  occurrences: number
  categoryId: string | null
  /** variación del último cobro contra el anterior (0.12 = subió 12%) */
  priceChangePct: number | null
  installment: { current: number; total: number; remaining: number; endsOn: ISODate } | null
  confidence: number
  /** motivo para sugerir revisarla. nunca se asume que hay que cancelarla */
  reviewHint: string | null
}

const PER_MONTH: Record<Frequency, number> = { weekly: 52 / 12, monthly: 1, yearly: 1 / 12 }

function classifyGap(gap: number): Frequency | null {
  if (gap >= 5 && gap <= 9) return 'weekly'
  if (gap >= 25 && gap <= 36) return 'monthly'
  if (gap >= 350 && gap <= 380) return 'yearly'
  return null
}

function nextFrom(last: ISODate, f: Frequency, today: ISODate): ISODate {
  const step = (d: ISODate) => (f === 'weekly' ? addDays(d, 7) : f === 'monthly' ? addMonths(d, 1) : addMonths(d, 12))
  let next = step(last)
  // si ya pasó la fecha esperada y no se registró, se asume pendiente para hoy en adelante
  let guard = 0
  while (next < today && daysBetween(next, today) > 5 && guard++ < 24) next = step(next)
  return next
}

function kindFor(group: string | null, type: 'expense' | 'income', installment: boolean): RecurringKind {
  if (type === 'income') return 'income'
  if (installment || group === 'installments') return 'installment'
  if (group === 'subscriptions' || group === 'gym') return 'subscription'
  if (group === 'utilities') return 'utility'
  if (group === 'housing') return 'housing'
  return 'other'
}

/**
 * detecta pagos recurrentes: mismo comercio, intervalo regular y monto parecido.
 * alcanza con 2 apariciones si el usuario lo marcó como recurrente; si no, pide 3.
 */
export function detectRecurring(txns: Txn[], cats: Cat[], today: ISODate): RecurringItem[] {
  const idx = indexCats(cats)
  const byKey = new Map<string, Txn[]>()
  for (const t of txns) {
    if (t.date > today) continue
    const key = `${t.type}:${normalizeMerchant(t.description)}`
    byKey.set(key, [...(byKey.get(key) ?? []), t])
  }

  const items: RecurringItem[] = []
  for (const [key, raw] of byKey) {
    const list = [...raw].sort((a, b) => a.date.localeCompare(b.date))
    const explicit = list.some((t) => t.recurrence !== 'none')
    if (list.length < (explicit ? 2 : 3)) continue

    const gaps = list.slice(1).map((t, i) => daysBetween(list[i].date, t.date))
    const med = median(gaps)
    const freq = explicit && list.at(-1)!.recurrence !== 'none' ? (list.at(-1)!.recurrence as Frequency) : classifyGap(med)
    if (!freq) continue
    const regular = gaps.filter((g) => Math.abs(g - med) <= Math.max(3, med * 0.25)).length / gaps.length
    if (!explicit && regular < 0.7) continue

    const amounts = list.map((t) => t.amountCents)
    const avg = mean(amounts)
    const cv = avg ? stdev(amounts) / avg : 0
    const last = list.at(-1)!
    const group = keywordGroup(last.description) ?? txnGroup(idx, last)
    const inst = parseInstallment(last.description)
    const kind = kindFor(group, last.type, !!inst)
    // un pago "otro" sin marcar necesita un patrón muy regular (evita confundir salidas al cine con suscripciones)
    if (!explicit && kind === 'other' && (regular < 0.9 || list.length < 4)) continue
    // servicios y sueldos varían. suscripciones y cuotas no deberían.
    if (!explicit && cv > (kind === 'utility' || kind === 'income' ? 0.45 : 0.25)) continue

    // si terminó (cuotas pagadas o hace mucho que no aparece) no se lista
    const staleDays = freq === 'weekly' ? 21 : freq === 'monthly' ? 50 : 400
    if (daysBetween(last.date, today) > staleDays) continue
    if (inst && inst.current >= inst.total) continue

    // último cambio de precio, si ocurrió en los últimos 3 cobros
    let priceChangePct: number | null = null
    for (let i = list.length - 2; i >= Math.max(0, list.length - 4); i--) {
      const prevAmount = list[i].amountCents
      if (prevAmount > 0 && Math.abs(last.amountCents - prevAmount) / prevAmount >= 0.01) {
        priceChangePct = (last.amountCents - prevAmount) / prevAmount
        break
      }
    }
    const monthly = last.amountCents * PER_MONTH[freq]
    const nextDate = nextFrom(last.date, freq, today)

    let reviewHint: string | null = null
    if (kind === 'subscription' && priceChangePct !== null && priceChangePct > 0.05) {
      reviewHint = `Subió ${Math.round(priceChangePct * 100)}% en los últimos cobros.`
    }

    items.push({
      key,
      label: merchantLabel(last.description),
      type: last.type,
      kind,
      frequency: freq,
      lastCents: last.amountCents,
      avgCents: Math.round(avg),
      monthlyCents: Math.round(monthly),
      annualCents: Math.round(monthly * 12),
      lastDate: last.date,
      nextDate,
      occurrences: list.length,
      categoryId: last.categoryId,
      priceChangePct,
      installment: inst
        ? { current: inst.current, total: inst.total, remaining: inst.total - inst.current, endsOn: addMonths(last.date, inst.total - inst.current) }
        : null,
      confidence: Math.min(1, 0.5 + regular * 0.3 + (explicit ? 0.2 : 0) + Math.min(0.2, list.length * 0.03)),
      reviewHint,
    })
  }

  // varias suscripciones del mismo rubro: sugerir revisar si se usan todas (sin asumir nada)
  const streaming = items.filter((i) => i.kind === 'subscription' && /netflix|disney|hbo|max|prime|paramount|star|crunchyroll/i.test(i.label))
  if (streaming.length >= 3) {
    for (const s of streaming) {
      s.reviewHint ??= `Tenés ${streaming.length} servicios de streaming activos. Revisá si usás todos.`
    }
  }

  return items.sort((a, b) => a.nextDate.localeCompare(b.nextDate))
}

export function recurringTotals(items: RecurringItem[]) {
  const exp = items.filter((i) => i.type === 'expense')
  return {
    monthlyCents: exp.reduce((a, i) => a + i.monthlyCents, 0),
    annualCents: exp.reduce((a, i) => a + i.annualCents, 0),
    subscriptionsMonthlyCents: exp.filter((i) => i.kind === 'subscription').reduce((a, i) => a + i.monthlyCents, 0),
    count: exp.length,
  }
}
