import 'server-only'
import { CURRENCIES, type Currency } from '@/lib/format'

// cotizaciones de open.er-api.com (gratis, sin clave, cubre ARS, USD, EUR y BRL). se piden una vez cada 6 horas por instancia.
export type Rates = { perARS: Record<Currency, number>; asOf: string; live: boolean }

const TTL = 6 * 60 * 60_000
// solo por si la API no responde: orden de magnitud, y la pantalla lo avisa como aproximado
const FALLBACK: Record<Currency, number> = { ARS: 1, USD: 1 / 1450, EUR: 1 / 1700, BRL: 1 / 265 }

let cached: { at: number; value: Rates } | null = null
let inflight: Promise<Rates> | null = null

async function fetchRates(): Promise<Rates> {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), 4000)
  try {
    const res = await fetch('https://open.er-api.com/v6/latest/ARS', { signal: ctrl.signal })
    if (!res.ok) throw new Error(`rates ${res.status}`)
    const j = (await res.json()) as { result?: string; rates?: Record<string, number>; time_last_update_utc?: string }
    const perARS = { ARS: 1 } as Record<Currency, number>
    for (const c of Object.keys(CURRENCIES) as Currency[]) {
      const v = c === 'ARS' ? 1 : j.rates?.[c]
      if (typeof v !== 'number' || !(v > 0)) throw new Error(`rates: falta ${c}`)
      perARS[c] = v
    }
    return { perARS, asOf: j.time_last_update_utc ? new Date(j.time_last_update_utc).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10), live: true }
  } finally {
    clearTimeout(t)
  }
}

export async function getRates(): Promise<Rates> {
  if (cached && Date.now() - cached.at < TTL) return cached.value
  inflight ??= fetchRates()
    .then((value) => (cached = { at: Date.now(), value }).value)
    .catch((err) => {
      console.error('[caudal] cotizaciones no disponibles', err)
      // si ya había una buena, se sigue usando aunque esté vencida
      return cached?.value ?? { perARS: FALLBACK, asOf: new Date().toISOString().slice(0, 10), live: false }
    })
    .finally(() => {
      inflight = null
    })
  return inflight
}

/** pesos que vale 1 unidad de `c` */
export const arsPer = (r: Rates, c: Currency) => 1 / r.perARS[c]
