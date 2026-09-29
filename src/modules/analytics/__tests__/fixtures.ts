import { DEFAULT_CATEGORIES } from '@/modules/finance/categories'
import { generateDemoData } from '@/modules/demo/generate'
import type { Cat, Txn } from '../types'

export function demoFixture(today: string) {
  const cats: Cat[] = []
  DEFAULT_CATEGORIES.forEach((c) => {
    cats.push({ id: c.key, name: c.name, kind: c.kind, parentId: null, group: c.group, icon: c.icon, colorSlot: c.slot ?? null })
    c.subs?.forEach((s) => cats.push({ id: s.key, name: s.name, kind: c.kind, parentId: c.key, group: s.group ?? c.group, icon: s.icon, colorSlot: null }))
  })
  const data = generateDemoData(today)
  const txns: Txn[] = data.transactions.map((t, i) => ({
    id: `t${i}`,
    type: t.type,
    amountCents: t.amountCents,
    date: t.date,
    description: t.description,
    categoryId: t.cat,
    subcategoryId: t.sub ?? null,
    paymentMethod: t.paymentMethod,
    recurrence: t.recurrence,
    tags: t.tags,
  }))
  return { cats, txns, data }
}

export const txn = (p: Partial<Txn> & Pick<Txn, 'date' | 'amountCents' | 'description'>): Txn => ({
  id: Math.random().toString(36).slice(2),
  type: 'expense',
  categoryId: null,
  subcategoryId: null,
  paymentMethod: 'debito',
  recurrence: 'none',
  tags: [],
  ...p,
})
