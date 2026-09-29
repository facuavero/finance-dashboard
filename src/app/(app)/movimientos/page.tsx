import type { Metadata } from 'next'
import { getAppData } from '@/modules/app/data'
import { normalizeMerchant } from '@/modules/analytics/merchant'
import { TransactionsView, type Row } from './transactions-view'

export const metadata: Metadata = { title: 'Movimientos' }

export default async function Movimientos({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const { finance, today, ctx } = await getAppData()
  const sp = await searchParams
  const cats = new Map(finance.cats.map((c) => [c.id, c]))
  const recurringKeys = new Set(ctx.recurring.map((r) => r.key))
  const rows: Row[] = finance.txns.map((t) => {
    const c = t.categoryId ? cats.get(t.categoryId) : null
    const s = t.subcategoryId ? cats.get(t.subcategoryId) : null
    return {
      ...t,
      categoryName: c?.name ?? 'Sin categoría',
      categoryIcon: c?.icon ?? 'circle-dashed',
      colorSlot: c?.colorSlot ?? null,
      subcategoryName: s?.name ?? null,
      detectedRecurring: t.recurrence !== 'none' || recurringKeys.has(`${t.type}:${normalizeMerchant(t.description)}`),
    }
  })
  return (
    <TransactionsView
      rows={rows}
      categories={finance.cats.map((c) => ({ id: c.id, name: c.name, kind: c.kind, parentId: c.parentId, icon: c.icon, group: c.group }))}
      today={today}
      initialQuery={sp.q ?? ''}
      openImport={sp.importar === '1'}
      prefill={sp.nuevo === '1' ? { amount: sp.monto ?? '', description: sp.desc ?? '', date: sp.fecha ?? today, type: sp.tipo === 'income' ? 'income' : 'expense' } : null}
    />
  )
}
