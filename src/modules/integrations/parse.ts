import { stripAccents } from '@/modules/analytics/merchant'
import { parseMoneyInput } from '@/lib/format'
import type { ISODate } from '@/modules/analytics/dates'

// clasificación de correos y eventos. regla de oro: ante la duda, no es un gasto (devuelve null).

export type RawEmail = { id: string; subject: string; from: string; snippet: string; date: ISODate }
export type RawEvent = { id: string; summary: string; start: ISODate; end: ISODate | null; description?: string }

export type ParsedItem = {
  externalId: string
  kind: string
  title: string
  merchant: string | null
  amountCents: number | null
  currency: string | null
  occursOn: ISODate | null
  endsOn: ISODate | null
  confidence: number
  evidence: string
}

const has = (text: string, words: string[]) => words.some((w) => text.includes(w))

const PROMO = ['promo', 'descuento', '% off', 'newsletter', 'oferta', '2x1', 'cupon', 'sorteo', 'ultimas horas', 'black friday', 'cyber monday', 'te extranamos', 'novedades']

const EMAIL_RULES: { kind: string; words: string[]; base: number }[] = [
  { kind: 'income', words: ['transferencia recibida', 'te enviaron', 'reintegro', 'acreditamos', 'recibiste un pago', 'recibo de sueldo', 'te transfirieron'], base: 0.75 },
  { kind: 'flight', words: ['vuelo', 'tarjeta de embarque', 'boarding pass', 'e-ticket', 'itinerario de viaje', 'aerolineas', 'flybondi', 'jetsmart', 'latam'], base: 0.8 },
  { kind: 'booking', words: ['confirmacion de reserva', 'tu reserva', 'reserva confirmada', 'booking.com', 'airbnb', 'check-in', 'despegar'], base: 0.8 },
  { kind: 'subscription', words: ['suscripcion', 'se renovara', 'renovacion', 'actualizamos el precio', 'tu membresia', 'cambio de precio', 'tu plan'], base: 0.7 },
  { kind: 'invoice', words: ['factura', 'vencimiento', 'vence el', 'tu resumen', 'saldo a pagar', 'aviso de deuda'], base: 0.75 },
  { kind: 'payment', words: ['pago aprobado', 'pago realizado', 'pagaste', 'transferencia enviada', 'debito automatico'], base: 0.7 },
  { kind: 'receipt', words: ['recibo', 'comprobante de pago', 'comprobante'], base: 0.65 },
  { kind: 'purchase', words: ['tu compra', 'gracias por tu compra', 'tu pedido', 'orden #', 'order confirmation', 'compraste'], base: 0.65 },
]

const AMOUNT_RE = /(?:\$|ars|ar\$)\s?(\d{1,3}(?:[.\s]\d{3})+(?:,\d{1,2})?|\d+(?:,\d{1,2})?)/i
const USD_RE = /(?:us\$|usd|u\$s)\s?(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{1,2})?)/i
const DATE_RE = /(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?/

export function extractAmount(text: string): { cents: number; currency: string } | null {
  const ars = text.match(AMOUNT_RE)
  if (ars) {
    const cents = parseMoneyInput(ars[1].replace(/\s/g, '.'))
    if (cents && cents > 0) return { cents, currency: 'ARS' }
  }
  const usd = text.match(USD_RE)
  if (usd) {
    const cents = parseMoneyInput(usd[1])
    if (cents && cents > 0) return { cents, currency: 'USD' }
  }
  return null
}

/** fecha dd/mm(/aaaa) mencionada en el texto, resuelta al año más cercano al correo */
export function extractDate(text: string, ref: ISODate): ISODate | null {
  const m = text.match(DATE_RE)
  if (!m) return null
  const day = Number(m[1])
  const month = Number(m[2])
  if (day < 1 || day > 31 || month < 1 || month > 12) return null
  let year = m[3] ? Number(m[3].length === 2 ? `20${m[3]}` : m[3]) : Number(ref.slice(0, 4))
  const iso = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  // sin año y muy en el pasado: probablemente es del año siguiente
  if (!m[3] && iso < ref && Number(ref.slice(5, 7)) - month > 6) year += 1
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function senderName(from: string): string | null {
  const name = from.replace(/<.*>/, '').replace(/"/g, '').trim()
  if (name) return name.replace(/\b(no-?reply|notificaciones|info|avisos)\b/gi, '').trim() || null
  const domain = from.match(/@([\w-]+)\./)
  return domain ? domain[1] : null
}

export function parseEmail(e: RawEmail): ParsedItem | null {
  const text = stripAccents(`${e.subject} ${e.snippet}`.toLowerCase())
  if (has(text, PROMO)) return null
  const rule = EMAIL_RULES.find((r) => has(text, r.words))
  if (!rule) return null
  const amount = extractAmount(`${e.subject} ${e.snippet}`)
  const mentioned = extractDate(e.snippet, e.date)
  // sin monto ni fecha no hay contexto suficiente para mostrarlo
  if (!amount && !mentioned && rule.kind !== 'flight' && rule.kind !== 'booking') return null
  let confidence = rule.base + (amount ? 0.1 : -0.1) + (mentioned ? 0.05 : 0)
  if (amount?.currency === 'USD') confidence -= 0.05
  return {
    externalId: e.id,
    kind: rule.kind,
    title: e.subject.slice(0, 140),
    merchant: senderName(e.from),
    amountCents: amount?.currency === 'ARS' ? amount.cents : null,
    currency: amount?.currency ?? null,
    occursOn: mentioned ?? e.date,
    endsOn: null,
    confidence: Math.max(0, Math.min(1, confidence)),
    evidence: `Correo del ${e.date} · "${e.subject.slice(0, 80)}"`,
  }
}

const EVENT_RULES: { kind: string; words: string[]; base: number }[] = [
  { kind: 'birthday', words: ['cumple', 'cumpleanos', '🎂'], base: 0.85 },
  { kind: 'trip', words: ['viaje', 'vuelo', 'aeropuerto', '✈', 'escapada'], base: 0.85 },
  { kind: 'vacation', words: ['vacaciones'], base: 0.85 },
  { kind: 'due', words: ['vence', 'vencimiento', 'pagar ', 'pago de', 'cuota', 'patente', 'abl', 'seguro'], base: 0.75 },
  { kind: 'renewal', words: ['renovacion', 'renovar', 'renueva'], base: 0.75 },
  { kind: 'booking', words: ['reserva', 'turno'], base: 0.7 },
  { kind: 'event', words: ['cena', 'almuerzo', 'salida', 'recital', 'show', 'cine', 'casamiento', 'boda', 'fiesta', 'teatro', 'partido', 'after', 'bar '], base: 0.7 },
  { kind: 'meeting', words: ['reunion', 'meet', 'call', 'daily', 'standup', 'sync', '1:1', 'clase', 'entrenamiento'], base: 0.8 },
]

export function parseEvent(e: RawEvent): ParsedItem {
  const text = stripAccents(`${e.summary} ${e.description ?? ''}`.toLowerCase())
  const rule = EVENT_RULES.find((r) => has(`${text} `, r.words))
  const amount = extractAmount(`${e.summary} ${e.description ?? ''}`)
  return {
    externalId: e.id,
    kind: rule?.kind ?? 'meeting',
    title: e.summary.slice(0, 140),
    merchant: null,
    amountCents: amount?.currency === 'ARS' ? amount.cents : null,
    currency: amount?.currency ?? null,
    occursOn: e.start,
    endsOn: e.end && e.end !== e.start ? e.end : null,
    confidence: rule ? rule.base : 0.6,
    evidence: `Evento del ${e.start}${e.end && e.end !== e.start ? ` al ${e.end}` : ''}`,
  }
}
