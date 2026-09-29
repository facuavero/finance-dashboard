// normalización de descripciones para agrupar movimientos del mismo comercio

const STOP = new Set(['compra', 'pago', 'de', 'del', 'la', 'el', 'en', 'con', 'debito', 'credito', 'tarjeta', 'visa', 'master', 'mastercard', 'mp', 'mercadopago', 'suscripcion', 'mensual', 'plan', 'sa', 'srl', 'arg', 'ar', 'www', 'com'])

export function stripAccents(s: string) {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '')
}

/** "PEDIDOSYA *Mostaza 1234" → "pedidosya" · "Netflix.com" → "netflix" */
export function normalizeMerchant(desc: string): string {
  const clean = stripAccents(desc.toLowerCase())
    .replace(/cuota\s*\d+\s*(\/|de)\s*\d+/g, ' ')
    .replace(/[*#.,:;()/\\_-]+/g, ' ')
    .replace(/\d+/g, ' ')
  const words = clean.split(/\s+/).filter((w) => w.length > 1 && !STOP.has(w))
  return words.slice(0, 2).join(' ') || desc.toLowerCase().trim()
}

/** nombre legible para mostrar */
export function merchantLabel(desc: string): string {
  const base = desc.replace(/cuota\s*\d+\s*(\/|de)\s*\d+/gi, '').replace(/\s+/g, ' ').trim()
  return base.length > 40 ? `${base.slice(0, 38)}…` : base
}

export type Installment = { current: number; total: number }

export function parseInstallment(desc: string): Installment | null {
  const m = stripAccents(desc.toLowerCase()).match(/cuota\s*(\d+)\s*(?:\/|de)\s*(\d+)/)
  if (!m) return null
  const current = Number(m[1])
  const total = Number(m[2])
  return current > 0 && total >= current ? { current, total } : null
}

// palabras clave por grupo. sirven cuando el usuario no categorizó bien.
export const KEYWORD_GROUPS: Record<string, string[]> = {
  delivery: ['pedidosya', 'pedidos ya', 'rappi', 'delivery', 'ubereats', 'uber eats', 'didi food'],
  coffee: ['cafe', 'cafeteria', 'starbucks', 'havanna', 'bonafide', 'martinez', 'kiosco', 'maxikiosco', 'panaderia'],
  rides: ['uber', 'cabify', 'didi', 'taxi', 'remis'],
  subscriptions: ['netflix', 'spotify', 'disney', 'hbo', 'max', 'prime video', 'amazon prime', 'youtube', 'icloud', 'google one', 'chatgpt', 'openai', 'apple', 'paramount', 'crunchyroll', 'xbox', 'playstation', 'deezer', 'canva', 'notion'],
  utilities: ['edenor', 'edesur', 'metrogas', 'naturgy', 'aysa', 'personal', 'movistar', 'claro', 'telecentro', 'fibertel', 'flow'],
  gym: ['gimnasio', 'megatlon', 'smartfit', 'sportclub'],
}

export function keywordGroup(desc: string): string | null {
  const d = stripAccents(desc.toLowerCase())
  for (const [group, words] of Object.entries(KEYWORD_GROUPS)) {
    if (words.some((w) => new RegExp(`(^|[^a-z])${w}([^a-z]|$)`).test(d))) return group
  }
  return null
}
