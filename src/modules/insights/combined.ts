import { type ISODate, addDays, daysBetween } from '@/modules/analytics/dates'
import type { RecurringItem } from '@/modules/analytics/recurring'
import { pendingUntil } from '@/modules/analytics/forecast'
import { type Cat, type Txn, indexCats, mean, txnGroup } from '@/modules/analytics/types'
import { money, plural, relativeDays } from '@/lib/format'
import { normalizeMerchant, stripAccents } from '@/modules/analytics/merchant'

// hallazgos que salen de gmail y calendar. nunca contienen el cuerpo del correo: solo lo mínimo para razonar.
export type Signal = {
  id: string
  provider: 'gmail' | 'gcal'
  kind: string // gmail: purchase|invoice|receipt|booking|flight|subscription|payment|due|income · gcal: trip|booking|birthday|event|due|renewal|payment|vacation|meeting
  title: string
  merchant: string | null
  amountCents: number | null
  occursOn: ISODate | null
  endsOn: ISODate | null
  confidence: number
}

export type Impact = 'positive' | 'negative' | 'possible' | 'none'

export type CombinedFinding = {
  key: string
  impact: Impact
  title: string
  detail: string
  amountCents: number | null
  estimated: boolean
  date: ISODate | null
  sources: ('gmail' | 'gcal' | 'movimientos' | 'recurrentes' | 'presupuestos' | 'objetivos')[]
  action: { label: string; href: string } | null
}

export type CombinedReport = {
  windowDays: number
  summary: string
  potentialExpenseCents: number
  expectedIncomeCents: number
  counts: { trips: number; recurringPayments: number; bookings: number; events: number }
  findings: CombinedFinding[]
}

const MIN_CONFIDENCE = 0.6

function norm(s: string) {
  return stripAccents(s.toLowerCase())
}

/** ¿hay un movimiento registrado que corresponda a este monto (±10%) en los 60 días anteriores? */
function matchesTxn(sig: Signal, txns: Txn[], today: ISODate): Txn | null {
  if (!sig.amountCents) return null
  const from = addDays(today, -60)
  const merchant = sig.merchant ? normalizeMerchant(sig.merchant) : null
  return (
    txns.find(
      (t) =>
        t.type === 'expense' &&
        t.date >= from &&
        Math.abs(t.amountCents - sig.amountCents!) <= sig.amountCents! * 0.1 &&
        (!merchant || normalizeMerchant(t.description).split(' ')[0] === merchant.split(' ')[0] || Math.abs(t.amountCents - sig.amountCents!) <= sig.amountCents! * 0.02),
    ) ?? null
  )
}

function overlaps(a: Signal, b: Signal) {
  if (!a.occursOn || !b.occursOn) return false
  const aEnd = a.endsOn ?? a.occursOn
  const bEnd = b.endsOn ?? b.occursOn
  return Math.abs(daysBetween(a.occursOn, b.occursOn)) <= 2 || (a.occursOn <= bEnd && b.occursOn <= aEnd)
}

function avgTicket(txns: Txn[], cats: Cat[], group: string, fallbackCents: number) {
  const idx = indexCats(cats)
  const xs = txns.filter((t) => t.type === 'expense' && txnGroup(idx, t) === group).map((t) => t.amountCents)
  return xs.length >= 2 ? Math.round(mean(xs)) : fallbackCents
}

const registerHref = (s: Signal) =>
  `/movimientos?nuevo=1&monto=${(s.amountCents ?? 0) / 100}&desc=${encodeURIComponent(s.merchant ?? s.title)}${s.occursOn ? `&fecha=${s.occursOn}` : ''}`

/**
 * cruza gmail + calendar + movimientos + recurrentes para anticipar impactos.
 * cada hallazgo dice de qué fuentes sale y si el monto es real o estimado.
 */
export function combineSignals(input: {
  signals: Signal[]
  txns: Txn[]
  cats: Cat[]
  recurring: RecurringItem[]
  today: ISODate
  windowDays?: number
  dailyVariableCents: number
  goalsBehind?: { name: string; gapCents: number }[]
}): CombinedReport {
  const { txns, cats, recurring, today } = input
  const windowDays = input.windowDays ?? 14
  const until = addDays(today, windowDays)
  const signals = input.signals.filter((s) => s.confidence >= MIN_CONFIDENCE && (!s.occursOn || (s.occursOn >= addDays(today, -3) && s.occursOn <= addDays(today, 60))))
  const inWindow = (s: Signal) => !!s.occursOn && s.occursOn >= today && s.occursOn <= until

  const findings: CombinedFinding[] = []
  const used = new Set<string>()

  // 1. viajes: calendar + confirmaciones de gmail
  const trips = signals.filter((s) => s.provider === 'gcal' && (s.kind === 'trip' || s.kind === 'vacation'))
  for (const trip of trips) {
    const related = signals.filter((s) => s.provider === 'gmail' && ['flight', 'booking'].includes(s.kind) && overlaps(s, trip))
    related.forEach((r) => used.add(r.id))
    used.add(trip.id)
    const days = trip.endsOn && trip.occursOn ? daysBetween(trip.occursOn, trip.endsOn) + 1 : 3
    const flight = related.find((r) => r.kind === 'flight')
    if (flight) {
      const paid = matchesTxn(flight, txns, today)
      findings.push({
        key: `trip-flight:${trip.id}`,
        impact: paid ? 'none' : 'negative',
        title: `Tu calendario muestra un viaje ${relativeDays(today, trip.occursOn!)} y Gmail tiene la confirmación del vuelo.`,
        detail: paid
          ? `El vuelo (${money(flight.amountCents ?? 0)}) ya está registrado en tus movimientos. No suma gasto nuevo.`
          : `No encontramos el pago del vuelo${flight.amountCents ? ` (${money(flight.amountCents)})` : ''} en tus movimientos.`,
        amountCents: paid ? null : flight.amountCents,
        estimated: false,
        date: trip.occursOn,
        sources: ['gcal', 'gmail', 'movimientos'],
        action: paid ? null : { label: 'Registrar vuelo', href: registerHref(flight) },
      })
    }
    for (const booking of related.filter((r) => r.kind === 'booking')) {
      const paid = matchesTxn(booking, txns, today)
      if (!paid) {
        findings.push({
          key: `booking:${booking.id}`,
          impact: 'negative',
          title: `Tenés una reserva${booking.merchant ? ` en ${booking.merchant}` : ''} ${relativeDays(today, booking.occursOn ?? trip.occursOn!)} y todavía no registraste ese gasto.`,
          detail: booking.amountCents ? `Gmail indica ${money(booking.amountCents)}. Si ya la pagaste, registrala para que el saldo sea real.` : 'El correo no trae monto. Revisá la confirmación.',
          amountCents: booking.amountCents,
          estimated: false,
          date: booking.occursOn ?? trip.occursOn,
          sources: ['gmail', 'gcal', 'movimientos'],
          action: { label: 'Registrar reserva', href: registerHref(booking) },
        })
      }
    }
    // gasto en destino: estimado con el gasto variable diario habitual × 1,5
    const onSite = Math.round(input.dailyVariableCents * 1.5 * days)
    findings.push({
      key: `trip-spend:${trip.id}`,
      impact: 'possible',
      title: `Durante el viaje (${plural(days, 'día', 'días')}) vas a tener gastos en destino.`,
      detail: `Estimamos ${money(onSite)} tomando tu gasto variable diario (${money(input.dailyVariableCents)}) con un 50% extra por estar de viaje.`,
      amountCents: onSite,
      estimated: true,
      date: trip.occursOn,
      sources: ['gcal', 'movimientos'],
      action: { label: 'Crear presupuesto de viaje', href: '/presupuestos?nuevo=1' },
    })
  }

  // 2. reservas sueltas y compras de gmail
  for (const s of signals.filter((x) => x.provider === 'gmail' && !used.has(x.id))) {
    if (s.kind === 'booking' || s.kind === 'flight') {
      const paid = matchesTxn(s, txns, today)
      findings.push({
        key: `booking:${s.id}`,
        impact: paid ? 'none' : 'negative',
        title: paid ? `La reserva${s.merchant ? ` de ${s.merchant}` : ''} ya está registrada.` : `Tenés una reserva${s.merchant ? ` en ${s.merchant}` : ''}${s.occursOn ? ` ${relativeDays(today, s.occursOn)}` : ''} y todavía no registraste ese gasto.`,
        detail: s.amountCents ? `Monto según el correo: ${money(s.amountCents)}.` : 'El correo no trae monto.',
        amountCents: paid ? null : s.amountCents,
        estimated: false,
        date: s.occursOn,
        sources: ['gmail', 'movimientos'],
        action: paid ? null : { label: 'Registrar', href: registerHref(s) },
      })
    } else if (s.kind === 'subscription') {
      const rec = recurring.find((r) => s.merchant && normalizeMerchant(r.label).split(' ')[0] === normalizeMerchant(s.merchant).split(' ')[0])
      const increase = rec && s.amountCents ? s.amountCents - rec.lastCents : 0
      findings.push({
        key: `sub:${s.id}`,
        impact: increase > 0 || !rec ? 'negative' : 'none',
        title:
          increase > 0
            ? `Detectamos una renovación de ${s.merchant ?? 'una suscripción'} que aumentará tus gastos mensuales.`
            : rec
              ? `${s.merchant ?? 'Una suscripción'} se renueva ${s.occursOn ? relativeDays(today, s.occursOn) : 'pronto'} con el mismo precio.`
              : `Gmail muestra una suscripción nueva: ${s.merchant ?? s.title}.`,
        detail:
          increase > 0
            ? `Pasa de ${money(rec!.lastCents)} a ${money(s.amountCents!)}: ${money(increase * 12)} más por año. Revisá si el plan te sigue sirviendo.`
            : rec
              ? 'Ya está contemplada en tu previsión de gastos.'
              : `No la vemos en tus movimientos. ${s.amountCents ? `Costo: ${money(s.amountCents)} por período.` : ''}`,
        amountCents: increase > 0 ? increase : rec ? null : s.amountCents,
        estimated: false,
        date: s.occursOn,
        sources: rec ? ['gmail', 'recurrentes'] : ['gmail', 'movimientos'],
        action: { label: 'Ver recurrentes', href: '/fugas#recurrentes' },
      })
    } else if (s.kind === 'invoice' || s.kind === 'due') {
      const rec = recurring.find((r) => s.merchant && normalizeMerchant(r.label).split(' ')[0] === normalizeMerchant(s.merchant).split(' ')[0])
      findings.push({
        key: `due:${s.id}`,
        impact: 'negative',
        title: `${s.merchant ?? 'Una factura'} vence ${s.occursOn ? relativeDays(today, s.occursOn) : 'pronto'}${s.amountCents ? ` por ${money(s.amountCents)}` : ''}.`,
        detail: rec ? `Ya está en tu previsión (último pago: ${money(rec.lastCents)}).` : 'No está entre tus pagos recurrentes. Sumala a tu previsión.',
        amountCents: s.amountCents,
        estimated: false,
        date: s.occursOn,
        sources: rec ? ['gmail', 'recurrentes'] : ['gmail'],
        action: s.amountCents ? { label: 'Registrar pago', href: registerHref(s) } : null,
      })
    } else if (s.kind === 'income') {
      findings.push({
        key: `income:${s.id}`,
        impact: 'positive',
        title: `Gmail confirma un ingreso${s.merchant ? ` de ${s.merchant}` : ''}${s.amountCents ? ` por ${money(s.amountCents)}` : ''}.`,
        detail: matchesTxnIncome(s, txns, today) ? 'Ya está registrado.' : 'Todavía no está en tus movimientos. Registralo para que el saldo sea real.',
        amountCents: s.amountCents,
        estimated: false,
        date: s.occursOn,
        sources: ['gmail', 'movimientos'],
        action: matchesTxnIncome(s, txns, today) ? null : { label: 'Registrar ingreso', href: `${registerHref(s)}&tipo=income` },
      })
    } else if (s.kind === 'purchase' || s.kind === 'receipt' || s.kind === 'payment') {
      const paid = matchesTxn(s, txns, today)
      if (!paid && s.amountCents) {
        findings.push({
          key: `purchase:${s.id}`,
          impact: 'negative',
          title: `Hay una compra en Gmail que no está en tus movimientos: ${s.merchant ?? s.title}.`,
          detail: `${money(s.amountCents)}${s.occursOn ? ` · ${relativeDays(today, s.occursOn)}` : ''}.`,
          amountCents: s.amountCents,
          estimated: false,
          date: s.occursOn,
          sources: ['gmail', 'movimientos'],
          action: { label: 'Registrar compra', href: registerHref(s) },
        })
      }
    }
  }

  // 3. eventos de calendar con posible impacto
  const giftCents = avgTicket(txns, cats, 'gifts', 30_000_00)
  const diningCents = avgTicket(txns, cats, 'dining', 35_000_00)
  for (const s of signals.filter((x) => x.provider === 'gcal' && !used.has(x.id))) {
    if (s.kind === 'birthday') {
      findings.push({ key: `bday:${s.id}`, impact: 'possible', title: `${s.title} ${s.occursOn ? relativeDays(today, s.occursOn) : ''}.`, detail: `Si hacés un regalo, tu promedio en regalos es ${money(giftCents)}.`, amountCents: giftCents, estimated: true, date: s.occursOn, sources: ['gcal', 'movimientos'], action: null })
    } else if (s.kind === 'event') {
      findings.push({ key: `event:${s.id}`, impact: 'possible', title: `${s.title} ${s.occursOn ? relativeDays(today, s.occursOn) : ''}.`, detail: `Podría generar un gasto parecido a tu salida promedio: ${money(diningCents)}.`, amountCents: diningCents, estimated: true, date: s.occursOn, sources: ['gcal', 'movimientos'], action: null })
    } else if (s.kind === 'due' || s.kind === 'renewal' || s.kind === 'payment') {
      const rec = recurring.find((r) => norm(s.title).includes(normalizeMerchant(r.label).split(' ')[0]))
      findings.push({
        key: `cal-due:${s.id}`,
        impact: 'possible',
        title: `${s.title} ${s.occursOn ? relativeDays(today, s.occursOn) : ''}.`,
        detail: rec ? `Lo asociamos a ${rec.label} (${money(rec.lastCents)}).` : s.amountCents ? `Monto en el evento: ${money(s.amountCents)}.` : 'El evento no tiene monto. Si implica un pago, cargalo como recurrente.',
        amountCents: rec?.lastCents ?? s.amountCents,
        estimated: !s.amountCents,
        date: s.occursOn,
        sources: rec ? ['gcal', 'recurrentes'] : ['gcal'],
        action: null,
      })
    } else if (s.kind === 'booking') {
      findings.push({ key: `cal-booking:${s.id}`, impact: 'possible', title: `${s.title} ${s.occursOn ? relativeDays(today, s.occursOn) : ''}.`, detail: 'Es una reserva en tu calendario. No encontramos confirmación con monto en Gmail.', amountCents: null, estimated: true, date: s.occursOn, sources: ['gcal'], action: null })
    } else {
      findings.push({ key: `none:${s.id}`, impact: 'none', title: `${s.title} ${s.occursOn ? relativeDays(today, s.occursOn) : ''}.`, detail: 'Sin impacto financiero esperable.', amountCents: null, estimated: false, date: s.occursOn, sources: ['gcal'], action: null })
    }
  }

  // 4. semana cargada: varios eventos con posible gasto en 7 días
  const weekPossible = findings.filter((f) => f.impact === 'possible' && f.date && f.date >= today && f.date <= addDays(today, 7))
  if (weekPossible.length >= 3) {
    findings.push({
      key: `busy-week:${today}`,
      impact: 'possible',
      title: 'Esta semana tenés varios eventos que podrían generar gastos adicionales.',
      detail: `${plural(weekPossible.length, 'evento', 'eventos')} con gasto probable: ~${money(weekPossible.reduce((a, f) => a + (f.amountCents ?? 0), 0))} en total.`,
      amountCents: null,
      estimated: true,
      date: today,
      sources: ['gcal'],
      action: null,
    })
  }

  // 5. objetivos atrasados que compiten con estos gastos
  for (const g of input.goalsBehind ?? []) {
    findings.push({ key: `goal:${g.name}`, impact: 'negative', title: `El objetivo "${g.name}" viene atrasado.`, detail: `Le faltan ${money(g.gapCents)} para estar al día. Los gastos de estas semanas compiten con ese aporte.`, amountCents: null, estimated: false, date: null, sources: ['objetivos'], action: { label: 'Ver objetivos', href: '/objetivos' } })
  }

  // resumen de la ventana
  const pending = pendingUntil(recurring, today, until)
  const pendingExp = pending.filter((p) => p.type === 'expense')
  const pendingInc = pending.filter((p) => p.type === 'income')
  const windowFindings = findings.filter((f) => !f.date || (f.date >= today && f.date <= until))
  const potential =
    windowFindings.filter((f) => (f.impact === 'negative' || f.impact === 'possible') && f.amountCents && f.key.indexOf('busy-week') === -1).reduce((a, f) => a + (f.amountCents ?? 0), 0) +
    pendingExp.reduce((a, p) => a + p.cents, 0)
  const counts = {
    trips: trips.filter(inWindow).length,
    recurringPayments: pendingExp.length,
    bookings: signals.filter((s) => (s.kind === 'booking' || s.kind === 'flight') && inWindow(s) && !trips.some((t) => overlaps(t, s))).length + signals.filter((s) => s.kind === 'booking' && s.provider === 'gmail' && inWindow(s) && trips.some((t) => overlaps(t, s))).length,
    events: signals.filter((s) => s.provider === 'gcal' && ['birthday', 'event'].includes(s.kind) && inWindow(s)).length,
  }
  // "un viaje", "una reserva", "2 pagos recurrentes"
  const say = (n: number, one: string, many: string, fem = false) => (n === 1 ? `${fem ? 'una' : 'un'} ${one}` : `${n} ${many}`)
  const parts = [
    counts.trips && say(counts.trips, 'viaje', 'viajes'),
    counts.recurringPayments && say(counts.recurringPayments, 'pago recurrente', 'pagos recurrentes'),
    counts.bookings && say(counts.bookings, 'reserva', 'reservas', true),
    counts.events && say(counts.events, 'evento', 'eventos'),
  ].filter(Boolean) as string[]
  const list = parts.length > 1 ? `${parts.slice(0, -1).join(', ')} y ${parts.at(-1)}` : (parts[0] ?? '')
  const summary = parts.length
    ? `Durante las próximas ${windowDays === 14 ? 'dos semanas' : `${windowDays} días`} tenés ${list}. Estimamos ${money(potential)} de gastos potenciales.`
    : `No vemos gastos especiales en los próximos ${windowDays} días.`

  const order: Record<Impact, number> = { negative: 0, possible: 1, positive: 2, none: 3 }
  findings.sort((a, b) => order[a.impact] - order[b.impact] || (a.date ?? '9').localeCompare(b.date ?? '9'))
  return { windowDays, summary, potentialExpenseCents: potential, expectedIncomeCents: pendingInc.reduce((a, p) => a + p.cents, 0), counts, findings }
}

function matchesTxnIncome(sig: Signal, txns: Txn[], today: ISODate) {
  if (!sig.amountCents) return false
  const from = addDays(today, -30)
  return txns.some((t) => t.type === 'income' && t.date >= from && Math.abs(t.amountCents - sig.amountCents!) <= sig.amountCents! * 0.05)
}
