// alta de movimientos en lenguaje natural: "4500 pedidosya ayer con tarjeta" → borrador listo para confirmar.
// `ruleParseTxn` es el motor local (sin red). la ia externa, si está disponible, lo mejora (ver service-txn.ts).
import { addDays, toDate, toISO, type ISODate } from '@/modules/analytics/dates'
import { MAX_AMOUNT_CENTS, parseMoneyInput } from '@/lib/format'

export type ParseCat = { id: string; name: string; kind: 'expense' | 'income'; parentId: string | null }

export type ParsedTxn = {
  type: 'expense' | 'income'
  amountCents: number | null
  date: ISODate
  description: string
  categoryId: string | null
  subcategoryId: string | null
  paymentMethod: 'debito' | 'credito' | 'efectivo' | 'transferencia' | 'billetera'
  recurrence: 'none' | 'weekly' | 'monthly' | 'yearly'
}

/** qué campos se dedujeron del texto (los demás quedan con el valor por defecto) */
export type Found = Partial<Record<'amount' | 'date' | 'category' | 'type' | 'payment' | 'recurrence', boolean>>

export const MAX_CENTS = MAX_AMOUNT_CENTS

export const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

const INCOME_WORDS = /\b(cobre|cobramos|cobro|sueldo|salario|haberes|ingreso|me pagaron|me pago|me depositaron|me transfirieron|honorarios|freelance|vendi|venta|reembolso|devolucion|aguinaldo|dividendo|interes(?:es)?)\b/
const PAYMENT: [RegExp, ParsedTxn['paymentMethod']][] = [
  [/\b(efectivo|cash|en mano)\b/, 'efectivo'],
  [/\b(credito|tarjeta|visa|master(?:card)?|amex)\b/, 'credito'],
  [/\b(debito)\b/, 'debito'],
  [/\b(transferencia|transferi|cbu|alias)\b/, 'transferencia'],
  [/\b(mercado ?pago|mp|uala|billetera|naranja x|modo|personal pay)\b/, 'billetera'],
]
const RECURRENCE: [RegExp, ParsedTxn['recurrence']][] = [
  [/\b(todos los meses|mensual(?:es)?|por mes|cada mes|abono)\b/, 'monthly'],
  [/\b(semanal(?:es)?|por semana|cada semana)\b/, 'weekly'],
  [/\b(anual(?:es)?|por ano|cada ano)\b/, 'yearly'],
]

// palabra clave → nombre (normalizado) de categoría o subcategoría. la subcategoría gana si existe.
const KEYWORDS: [RegExp, string][] = [
  [/\b(pedidosya|pedidos ya|rappi|delivery|glovo)\b/, 'delivery'],
  [/\b(uber|cabify|didi|taxi|remis)\b/, 'apps de viaje'],
  [/\b(nafta|combustible|ypf|axion|gnc|estacionamiento|peaje)\b/, 'combustible'],
  [/\b(sube|colectivo|subte|tren|bondi)\b/, 'transporte publico'],
  [/\b(alquiler)\b/, 'alquiler'],
  [/\b(expensas)\b/, 'expensas'],
  [/\b(luz|edenor|edesur)\b/, 'luz'],
  [/\b(gas|metrogas)\b/, 'gas'],
  [/\b(internet|wifi|fibertel|telecentro|movistar hogar)\b/, 'internet'],
  [/\b(celular|claro|personal|movistar|recarga)\b/, 'celular'],
  [/\b(netflix|spotify|disney|hbo|max|youtube|prime|icloud|suscripcion|paramount|apple tv)\b/, 'suscripciones'],
  [/\b(coto|carrefour|jumbo|disco|dia|super|supermercado|verduleria|carniceria|chino|almacen|walmart)\b/, 'supermercado'],
  [/\b(cafe|starbucks|medialunas?|cortado|havanna)\b/, 'cafe y snacks'],
  [/\b(resto|restaurante|restaurant|bar|cena|almuerzo|birras?|cerveza|pizza|sushi|parrilla|hamburguesa|mcdonalds|burger)\b/, 'restaurantes y bares'],
  [/\b(cine|boliche|salida|steam|playstation|recital|entrada|teatro|juego|fiesta)\b/, 'ocio'],
  [/\b(farmacia|medico|dentista|obra social|prepaga|remedios?|analisis|psicologo|kinesio)\b/, 'salud'],
  [/\b(curso|udemy|facultad|colegio|libro|capacitacion|universidad)\b/, 'educacion'],
  [/\b(regalo|cumple)\b/, 'regalos'],
  [/\b(vuelo|hotel|airbnb|aerolineas|pasaje|hostel|vacaciones|booking)\b/, 'viajes'],
  [/\b(cuota|prestamo|credito hipotecario)\b/, 'cuotas y prestamos'],
  [/\b(ropa|zapatillas?|mercadolibre|amazon|shein|zara|remera|campera)\b/, 'compras'],
  // ingresos
  [/\b(sueldo|salario|haberes|aguinaldo)\b/, 'sueldo'],
  [/\b(freelance|honorarios|cliente|proyecto|trabajo extra|changa)\b/, 'trabajos extra'],
  [/\b(interes(?:es)?|plazo fijo|dividendo|rendimiento|cupon)\b/, 'rendimientos'],
]

const WEEKDAYS = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado']

/** todos los números del texto con su valor en centavos. "2 lucas" = $2.000, "1,5 palos" = $1.500.000, "4k" = $4.000 */
export function amountsIn(text: string): { cents: number; start: number; end: number }[] {
  const out: { cents: number; start: number; end: number }[] = []
  const re = /(\d{1,3}(?:[.,]\d{3})+(?:[.,]\d{1,2})?|\d+(?:[.,]\d+)?)\s*(k|mil|lucas?|palos?|millon(?:es)?)?(?![\d\p{L}])/giu
  for (const m of text.matchAll(re)) {
    const base = parseMoneyInput(m[1])
    if (base === null || base <= 0) continue
    const unit = (m[2] ?? '').toLowerCase()
    const mult = !unit ? 1 : /^(k|mil|luca)/.test(unit) ? 1_000 : 1_000_000
    out.push({ cents: Math.round(base * mult), start: m.index ?? 0, end: (m.index ?? 0) + m[0].length })
  }
  return out
}

/** fecha dicha en palabras. devuelve null si el texto no dice nada de fecha */
export function dateIn(text: string, today: ISODate): { date: ISODate; span: [number, number] } | null {
  const t = norm(text)
  let m: RegExpExecArray | null
  if ((m = /\bantes de ayer\b|\banteayer\b/.exec(t))) return { date: addDays(today, -2), span: [m.index, m.index + m[0].length] }
  if ((m = /\bayer\b/.exec(t))) return { date: addDays(today, -1), span: [m.index, m.index + m[0].length] }
  if ((m = /\bhoy\b/.exec(t))) return { date: today, span: [m.index, m.index + m[0].length] }
  if ((m = /\bhace (\d{1,3}) dias?\b/.exec(t))) return { date: addDays(today, -Number(m[1])), span: [m.index, m.index + m[0].length] }
  if ((m = /\b(\d{1,2})[/-](\d{1,2})(?:[/-](\d{2,4}))?\b/.exec(t))) {
    const d = Number(m[1])
    const mo = Number(m[2])
    let y = m[3] ? Number(m[3]) : Number(today.slice(0, 4))
    if (y < 100) y += 2000
    const iso = `${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    if (mo >= 1 && mo <= 12 && d >= 1 && d <= 31 && toISO(toDate(iso)) === iso) {
      // sin año y en el futuro: es del año pasado
      return { date: !m[3] && iso > today ? `${y - 1}${iso.slice(4)}` : iso, span: [m.index, m.index + m[0].length] }
    }
  }
  if ((m = new RegExp(`\\b(?:el )?(${WEEKDAYS.join('|')})(?: pasado)?\\b`).exec(t))) {
    const target = WEEKDAYS.indexOf(m[1])
    const diff = (toDate(today).getUTCDay() - target + 7) % 7
    return { date: addDays(today, -(diff === 0 && /pasado/.test(m[0]) ? 7 : diff)), span: [m.index, m.index + m[0].length] }
  }
  if ((m = /\bel (\d{1,2})\b(?! ?(?:de|%))/.exec(t))) {
    const d = Number(m[1])
    if (d >= 1 && d <= 31) {
      let iso = `${today.slice(0, 7)}-${String(d).padStart(2, '0')}`
      if (toISO(toDate(iso)) !== iso) return null
      if (iso > today) iso = toISO(new Date(Date.UTC(Number(today.slice(0, 4)), Number(today.slice(5, 7)) - 2, d)))
      return { date: iso, span: [m.index, m.index + m[0].length] }
    }
  }
  return null
}

const FILLER = new Set(['dolar', 'dolares', 'usd', 'euro', 'euros', 'reales', 'verdes', 'gaste', 'gasto', 'pague', 'pago', 'compre', 'compra', 'cobre', 'cobro', 'ingrese', 'ingreso', 'de', 'del', 'en', 'por', 'con', 'el', 'la', 'los', 'las', 'un', 'una', 'y', 'a', 'fue', 'fueron', 'me', 'mi', 'mis', 'pesos', 'ars'])

export function ruleParseTxn(text: string, cats: ParseCat[], today: ISODate): { draft: ParsedTxn; found: Found } {
  const found: Found = {}
  const raw = text.trim().slice(0, 300)
  const n = norm(raw)

  const type: ParsedTxn['type'] = INCOME_WORDS.test(n) ? 'income' : 'expense'
  if (INCOME_WORDS.test(n)) found.type = true

  const dated = dateIn(raw, today)
  // el texto sin la fecha, para que "ayer 15/10" no cuente 15 ni 10 como monto
  let rest = raw
  if (dated) {
    found.date = true
    rest = `${raw.slice(0, dated.span[0])} ${raw.slice(dated.span[1])}`
  }
  const best = amountsIn(rest).filter((a) => a.cents <= MAX_CENTS).sort((a, b) => b.cents - a.cents)[0]
  if (best) found.amount = true

  let paymentMethod: ParsedTxn['paymentMethod'] = 'debito'
  for (const [re, v] of PAYMENT) if (re.test(n)) {
    paymentMethod = v
    found.payment = true
    break
  }
  let recurrence: ParsedTxn['recurrence'] = 'none'
  for (const [re, v] of RECURRENCE) if (re.test(n)) {
    recurrence = v
    found.recurrence = true
    break
  }

  // categoría: primero por palabra clave (sub antes que raíz), después por el nombre mismo
  const pool = cats.filter((c) => c.kind === type)
  let hit: ParseCat | undefined
  for (const [re, name] of KEYWORDS) {
    if (!re.test(n)) continue
    hit = pool.find((c) => norm(c.name) === name)
    if (hit) break
  }
  if (!hit) hit = pool.filter((c) => norm(c.name).length >= 3 && n.includes(norm(c.name))).sort((a, b) => b.name.length - a.name.length)[0]
  let categoryId: string | null = null
  let subcategoryId: string | null = null
  if (hit) {
    found.category = true
    categoryId = hit.parentId ?? hit.id
    subcategoryId = hit.parentId ? hit.id : null
  }

  // descripción: lo que sobra sin el monto, la fecha ni las muletillas
  const withoutAmount = best ? `${rest.slice(0, best.start)} ${rest.slice(best.end)}` : rest
  const desc = withoutAmount
    .replace(/[$,;]/g, ' ')
    .split(/\s+/)
    .filter((w) => w && !FILLER.has(norm(w)) && !PAYMENT.some(([re]) => re.test(norm(w))) && !RECURRENCE.some(([re]) => re.test(norm(w))))
    .join(' ')
    .trim()
    .slice(0, 140)

  return {
    draft: { type, amountCents: best?.cents ?? null, date: dated?.date ?? today, description: desc ? desc[0].toUpperCase() + desc.slice(1) : '', categoryId, subcategoryId, paymentMethod, recurrence },
    found,
  }
}

/** aplica una corrección sobre el borrador ("era ayer", "poné 5000", "es ingreso") con el motor local */
export function ruleRefine(prev: ParsedTxn, instruction: string, cats: ParseCat[], today: ISODate): ParsedTxn {
  const { draft, found } = ruleParseTxn(instruction, cats, today)
  const type = found.type ? draft.type : /\b(gasto|egreso)\b/.test(norm(instruction)) ? 'expense' : prev.type
  const typeChanged = type !== prev.type
  return {
    type,
    amountCents: found.amount ? draft.amountCents : prev.amountCents,
    date: found.date ? draft.date : prev.date,
    description: prev.description,
    categoryId: found.category ? draft.categoryId : typeChanged ? null : prev.categoryId,
    subcategoryId: found.category ? draft.subcategoryId : typeChanged ? null : prev.subcategoryId,
    paymentMethod: found.payment ? draft.paymentMethod : prev.paymentMethod,
    recurrence: found.recurrence ? draft.recurrence : prev.recurrence,
  }
}

export type CurrencyCode = 'ARS' | 'USD' | 'EUR' | 'BRL'
const CURRENCY_NAME: Record<CurrencyCode, string> = { ARS: 'pesos', USD: 'dólares', EUR: 'euros', BRL: 'reales' }

/** la moneda solo cuenta si el texto la dice (usd, dólares, u$s, verdes...). un número pelado no es una moneda */
export function explicitCurrency(text: string): CurrencyCode | null {
  const n = norm(text)
  if (/(?:^|[^a-z])(?:usd|u\$s|us\$|dolar(?:es)?|dls|verdes)(?![a-z])/.test(n)) return 'USD'
  if (/€|(?:^|[^a-z])(?:eur|euros?)(?![a-z])/.test(n)) return 'EUR'
  if (/r\$|(?:^|[^a-z])(?:brl|reales)(?![a-z])/.test(n)) return 'BRL'
  if (/\$|(?:^|[^a-z])(?:ars|pesos?)(?![a-z])/.test(n)) return 'ARS'
  return null
}

/** pesos que vale 1 unidad de cada moneda, y de cuándo es la cotización */
export type CurrencyRates = { arsPer: Record<CurrencyCode, number>; asOf: string; live: boolean }

/** aviso para la persona: algo que no se entendió, o una conversión que se hizo sola */
export type Note = { kind: 'unclear' | 'converted'; text: string }

/** pregunta que la IA le hace a la persona antes de cargar. cada opción multiplica los montos (pesos = 1) */
export type Ask = { question: string; options: { label: string; factor: number }[] }

const fmtNum = (n: number) => new Intl.NumberFormat('es-AR', { maximumFractionDigits: 2 }).format(n)

/** monto escrito en otra moneda → pesos, con el aviso de cuánto fue y a qué cotización */
export function toArs(cents: number, cur: CurrencyCode, rates: CurrencyRates): { cents: number; note: Note | null } {
  if (cur === 'ARS') return { cents, note: null }
  const rate = rates.arsPer[cur]
  const out = Math.round(cents * rate)
  return { cents: out, note: { kind: 'converted', text: `${fmtNum(cents / 100)} ${cur} pasados a $${fmtNum(out / 100)} (1 ${cur} = $${fmtNum(rate)}${rates.live ? `, cotización del ${rates.asOf}` : ', cotización aproximada: no pude consultarla'}).` } }
}

/**
 * un 5000 sin moneda es plata argentina. si la app muestra otra moneda, la persona puede estar pensando en esa:
 * se pregunta antes de cargar. si el texto dice la moneda (usd, dólares...), no se pregunta: se convierte solo.
 */
export function currencyAsk(text: string, display: CurrencyCode, rates: CurrencyRates): Ask | null {
  if (!amountsIn(text).length || explicitCurrency(text) || display === 'ARS') return null
  return {
    question: `No dijiste la moneda. Tu Caudal muestra en ${CURRENCY_NAME[display]}, pero un monto así suele ser en pesos. ¿Qué es?`,
    options: [
      { label: 'Son pesos', factor: 1 },
      { label: `Son ${CURRENCY_NAME[display]} (a $${fmtNum(rates.arsPer[display])})`, factor: rates.arsPer[display] },
    ],
  }
}

/** lo que el motor local no pudo deducir del texto */
export function ruleNotes(text: string, found: Found, today: ISODate): Note[] {
  const out: Note[] = []
  if (!found.amount) out.push({ kind: 'unclear', text: 'No encontré el monto.' })
  if (!found.category) out.push({ kind: 'unclear', text: 'No pude deducir la categoría.' })
  const dated = dateIn(text, today)
  const rest = dated ? `${text.slice(0, dated.span[0])} ${text.slice(dated.span[1])}` : text
  const nums = [...new Set(amountsIn(rest).filter((a) => a.cents <= MAX_CENTS).map((a) => a.cents))]
  if (nums.length > 1) out.push({ kind: 'unclear', text: `Vi más de un número (${nums.slice(0, 4).map((c) => fmtNum(c / 100)).join(', ')}) y tomé el mayor como monto.` })
  return out
}
