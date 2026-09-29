// fechas como strings YYYY-MM-DD. toda la aritmética en UTC para no depender del huso del servidor.

export type ISODate = string
export type Granularity = 'week' | 'month' | 'quarter' | 'year'
export type Range = { start: ISODate; end: ISODate } // ambos inclusive

const DAY = 86_400_000

export const toDate = (d: ISODate) => new Date(`${d}T00:00:00Z`)
export const toISO = (d: Date): ISODate => d.toISOString().slice(0, 10)

export function todayISO(tz = 'America/Argentina/Buenos_Aires'): ISODate {
  // en-CA formatea como YYYY-MM-DD
  return new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())
}

export const addDays = (d: ISODate, n: number): ISODate => toISO(new Date(toDate(d).getTime() + n * DAY))

export function addMonths(d: ISODate, n: number): ISODate {
  const x = toDate(d)
  const day = x.getUTCDate()
  const target = new Date(Date.UTC(x.getUTCFullYear(), x.getUTCMonth() + n, 1))
  const last = daysInMonth(toISO(target))
  target.setUTCDate(Math.min(day, last))
  return toISO(target)
}

export const daysBetween = (a: ISODate, b: ISODate) => Math.round((toDate(b).getTime() - toDate(a).getTime()) / DAY)

export function daysInMonth(d: ISODate): number {
  const x = toDate(d)
  return new Date(Date.UTC(x.getUTCFullYear(), x.getUTCMonth() + 1, 0)).getUTCDate()
}

export const startOfMonth = (d: ISODate): ISODate => `${d.slice(0, 7)}-01`
export const endOfMonth = (d: ISODate): ISODate => `${d.slice(0, 7)}-${String(daysInMonth(d)).padStart(2, '0')}`
export const monthKey = (d: ISODate) => d.slice(0, 7)
export const dayOfMonth = (d: ISODate) => Number(d.slice(8, 10))

export function startOfWeek(d: ISODate): ISODate {
  const wd = (toDate(d).getUTCDay() + 6) % 7 // lunes = 0
  return addDays(d, -wd)
}

export function periodRange(g: Granularity, anchor: ISODate): Range {
  switch (g) {
    case 'week': {
      const start = startOfWeek(anchor)
      return { start, end: addDays(start, 6) }
    }
    case 'month':
      return { start: startOfMonth(anchor), end: endOfMonth(anchor) }
    case 'quarter': {
      const m = Number(anchor.slice(5, 7))
      const qStart = Math.floor((m - 1) / 3) * 3 + 1
      const start = `${anchor.slice(0, 4)}-${String(qStart).padStart(2, '0')}-01`
      return { start, end: endOfMonth(addMonths(start, 2)) }
    }
    case 'year':
      return { start: `${anchor.slice(0, 4)}-01-01`, end: `${anchor.slice(0, 4)}-12-31` }
  }
}

export function previousRange(g: Granularity, r: Range): Range {
  switch (g) {
    case 'week':
      return { start: addDays(r.start, -7), end: addDays(r.end, -7) }
    case 'month':
      return periodRange('month', addMonths(r.start, -1))
    case 'quarter':
      return periodRange('quarter', addMonths(r.start, -3))
    case 'year':
      return periodRange('year', addMonths(r.start, -12))
  }
}

/** mismo tramo del período anterior (ej: del 1 al 14 del mes pasado) para comparar justo a mitad de período */
export function previousComparableRange(g: Granularity, r: Range, today: ISODate): Range {
  const prev = previousRange(g, r)
  if (today < r.start || today > r.end) return prev
  const elapsed = daysBetween(r.start, today)
  const end = addDays(prev.start, elapsed)
  return { start: prev.start, end: end > prev.end ? prev.end : end }
}

export const inRange = (d: ISODate, r: Range) => d >= r.start && d <= r.end

export function eachMonth(start: ISODate, end: ISODate): ISODate[] {
  const out: ISODate[] = []
  let cur = startOfMonth(start)
  while (cur <= end) {
    out.push(cur)
    cur = addMonths(cur, 1)
  }
  return out
}

/** los N meses completos anteriores al mes de `today` (el más viejo primero) */
export function previousFullMonths(today: ISODate, n: number): Range[] {
  const out: Range[] = []
  for (let i = n; i >= 1; i--) out.push(periodRange('month', addMonths(startOfMonth(today), -i)))
  return out
}
