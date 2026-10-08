// formato es-AR: $42.000 · $1,2 M · 38 %
import { cache } from 'react'

// moneda de visualización. no convierte: cambia el símbolo con el que se muestran los montos que cargaste
export const CURRENCIES = {
  ARS: { symbol: '$', label: 'Peso argentino', short: 'ARS' },
  USD: { symbol: 'US$', label: 'Dólar', short: 'USD' },
  EUR: { symbol: '€', label: 'Euro', short: 'EUR' },
  BRL: { symbol: 'R$', label: 'Real', short: 'BRL' },
} as const
export type Currency = keyof typeof CURRENCIES
export const isCurrency = (v: unknown): v is Currency => typeof v === 'string' && v in CURRENCIES

export type FormatPrefs = { currency: Currency; decimals: boolean }
const DEFAULT_FORMAT: FormatPrefs = { currency: 'ARS', decimals: false }

// en el servidor la preferencia vive por request (react cache); en el navegador, en una variable del módulo
const requestFormat = cache((): { v: FormatPrefs | null } => ({ v: null }))
let clientFormat: FormatPrefs = DEFAULT_FORMAT

/** servidor: se llama una vez por request, después de leer al usuario */
export function setRequestFormat(p: FormatPrefs) {
  requestFormat().v = p
}
/** navegador: lo llama el provider del layout */
export function setClientFormat(p: FormatPrefs) {
  clientFormat = p
}
export const currentFormat = (): FormatPrefs => requestFormat().v ?? clientFormat

const nf0 = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 })
const nf2 = new Intl.NumberFormat('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export function money(cents: number, opts: { decimals?: boolean; sign?: boolean; compact?: boolean } = {}): string {
  const fmt = currentFormat()
  const v = cents / 100
  const abs = Math.abs(v)
  let body: string
  if (opts.compact && abs >= 1_000_000) body = `${new Intl.NumberFormat('es-AR', { maximumFractionDigits: 1 }).format(abs / 1_000_000)} M`
  else if (opts.compact && abs >= 10_000) body = `${nf0.format(Math.round(abs / 1000))} mil`
  else body = (opts.decimals ?? fmt.decimals) ? nf2.format(abs) : nf0.format(Math.round(abs))
  const sign = v < 0 ? '−' : opts.sign && v > 0 ? '+' : ''
  return `${sign}${CURRENCIES[fmt.currency].symbol}${body}`
}

/** tope por movimiento: $100.000.000.000 (lo mismo que valida el servidor) */
export const MAX_AMOUNT_CENTS = 100_000_000_000_00

export function pct(ratio: number | null | undefined, opts: { sign?: boolean; decimals?: number } = {}): string {
  if (ratio === null || ratio === undefined || !Number.isFinite(ratio)) return '—'
  const digits = opts.decimals ?? 0
  const v = Number((ratio * 100).toFixed(digits))
  const s = new Intl.NumberFormat('es-AR', { maximumFractionDigits: digits }).format(Math.abs(v))
  const sign = v < 0 ? '−' : opts.sign && v > 0 ? '+' : ''
  return `${sign}${s}%`
}

const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
const MONTHS_SHORT = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
const WEEKDAYS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']

export function dateShort(iso: string): string {
  return `${Number(iso.slice(8, 10))} ${MONTHS_SHORT[Number(iso.slice(5, 7)) - 1]}`
}

export function dateLong(iso: string, withYear = false): string {
  const d = new Date(`${iso}T00:00:00Z`)
  const base = `${WEEKDAYS[d.getUTCDay()]} ${d.getUTCDate()} de ${MONTHS[d.getUTCMonth()]}`
  return withYear ? `${base} de ${d.getUTCFullYear()}` : base
}

export function monthName(iso: string, withYear = false): string {
  const m = MONTHS[Number(iso.slice(5, 7)) - 1]
  return withYear ? `${m} ${iso.slice(0, 4)}` : m
}

export function monthShort(iso: string, withYear = false): string {
  const m = MONTHS_SHORT[Number(iso.slice(5, 7)) - 1]
  return withYear ? `${m} ${iso.slice(2, 4)}` : m
}

/** "hoy", "mañana", "en 8 días", "hace 3 días" */
export function relativeDays(fromISO: string, toISO: string): string {
  const diff = Math.round((new Date(`${toISO}T00:00:00Z`).getTime() - new Date(`${fromISO}T00:00:00Z`).getTime()) / 86_400_000)
  if (diff === 0) return 'hoy'
  if (diff === 1) return 'mañana'
  if (diff === -1) return 'ayer'
  return diff > 0 ? `en ${diff} días` : `hace ${-diff} días`
}

export function plural(n: number, one: string, many: string) {
  return `${n} ${n === 1 ? one : many}`
}

/** parsea montos escritos a mano: "42.000", "42000,50", "1.234.567,8" → centavos */
export function parseMoneyInput(raw: string): number | null {
  const s = raw.replace(/[^\d.,-]/g, '')
  if (!s) return null
  let normalized: string
  if (s.includes(',')) normalized = s.replace(/\./g, '').replace(',', '.')
  else if (/\.\d{3}($|\.)/.test(s)) normalized = s.replace(/\./g, '')
  else normalized = s
  const v = Number(normalized)
  if (!Number.isFinite(v)) return null
  return Math.round(v * 100)
}

export const currencySymbol = () => CURRENCIES[currentFormat().currency].symbol
