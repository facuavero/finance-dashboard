import type { ISODate } from './dates'

// tipos propios del motor. no dependen de la base: cualquier fuente que los cumpla sirve.
export type Txn = {
  id: string
  type: 'expense' | 'income'
  amountCents: number
  date: ISODate
  description: string
  categoryId: string | null
  subcategoryId: string | null
  paymentMethod: string
  recurrence: 'none' | 'weekly' | 'monthly' | 'yearly'
  tags: string[]
}

export type Cat = {
  id: string
  name: string
  kind: 'expense' | 'income'
  parentId: string | null
  group: string | null
  icon: string
  colorSlot: number | null
}

export type CatIndex = Map<string, Cat>

export const indexCats = (cats: Cat[]): CatIndex => new Map(cats.map((c) => [c.id, c]))

/** categoría raíz (si es subcategoría, el padre) */
export function rootCat(idx: CatIndex, id: string | null): Cat | null {
  if (!id) return null
  const c = idx.get(id)
  if (!c) return null
  return c.parentId ? (idx.get(c.parentId) ?? c) : c
}

/** grupo semántico del movimiento: primero la subcategoría (más específica), después la categoría */
export function txnGroup(idx: CatIndex, t: Txn): string | null {
  const sub = t.subcategoryId ? idx.get(t.subcategoryId) : null
  if (sub?.group) return sub.group
  const cat = t.categoryId ? idx.get(t.categoryId) : null
  return cat?.group ?? null
}

export const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0)
export const mean = (xs: number[]) => (xs.length ? sum(xs) / xs.length : 0)
export function median(xs: number[]): number {
  if (!xs.length) return 0
  const s = [...xs].sort((a, b) => a - b)
  const m = Math.floor(s.length / 2)
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2
}
export function stdev(xs: number[]): number {
  if (xs.length < 2) return 0
  const m = mean(xs)
  return Math.sqrt(sum(xs.map((x) => (x - m) ** 2)) / (xs.length - 1))
}
export const roundCents = (n: number) => Math.round(n)
