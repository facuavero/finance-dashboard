// limitador en memoria por clave. alcanza para una instancia. con varias, mover a redis/postgres.
const hits = new Map<string, number[]>()

export function rateLimit(key: string, max: number, windowMs: number): { ok: boolean; retryInSec: number } {
  const now = Date.now()
  const list = (hits.get(key) ?? []).filter((t) => now - t < windowMs)
  if (list.length >= max) {
    return { ok: false, retryInSec: Math.ceil((windowMs - (now - list[0])) / 1000) }
  }
  list.push(now)
  hits.set(key, list)
  return { ok: true, retryInSec: 0 }
}
