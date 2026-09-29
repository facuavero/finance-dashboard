import type { Metadata } from 'next'
import { getAppData } from '@/modules/app/data'
import { previousFullMonths, inRange } from '@/modules/analytics/dates'
import { indexCats, mean, rootCat } from '@/modules/analytics/types'
import { BudgetsView } from './budgets-view'

export const metadata: Metadata = { title: 'Presupuestos' }

export default async function Presupuestos({ searchParams }: { searchParams: Promise<{ nuevo?: string }> }) {
  const { ctx, finance, today } = await getAppData()
  const sp = await searchParams
  // sugerencias: promedio de los últimos 3 meses de las categorías sin presupuesto
  const idx = indexCats(finance.cats)
  const months = previousFullMonths(today, 3)
  const withBudget = new Set(finance.budgets.map((b) => b.categoryId))
  const suggestions = finance.cats
    .filter((c) => c.kind === 'expense' && !c.parentId && !withBudget.has(c.id) && ['groceries', 'delivery', 'dining', 'leisure', 'shopping', 'coffee', 'transport'].includes(c.group ?? ''))
    .map((c) => {
      const avg = mean(months.map((r) => finance.txns.filter((t) => t.type === 'expense' && inRange(t.date, r) && rootCat(idx, t.categoryId)?.id === c.id).reduce((a, t) => a + t.amountCents, 0)))
      return { categoryId: c.id, name: c.name, icon: c.icon, avgCents: Math.round(avg / 100_000) * 100_000 }
    })
    .filter((s) => s.avgCents > 0)
    .sort((a, b) => b.avgCents - a.avgCents)
    .slice(0, 3)

  const goalsById = new Map(finance.goals.map((g) => [g.id, g.name]))
  return (
    <BudgetsView
      budgets={ctx.budgets.map((b) => {
        const cat = b.categoryId ? idx.get(b.categoryId) : null
        const raw = finance.budgets.find((x) => x.id === b.id)!
        return { ...b, icon: cat?.icon ?? 'circle-dashed', categoryName: cat?.name ?? 'Todos los gastos', goalId: raw.goalId, goalName: raw.goalId ? (goalsById.get(raw.goalId) ?? null) : null }
      })}
      categories={finance.cats.filter((c) => c.kind === 'expense' && !c.parentId).map((c) => ({ id: c.id, name: c.name }))}
      goals={finance.goals.map((g) => ({ id: g.id, name: g.name }))}
      suggestions={suggestions}
      today={today}
      openNew={sp.nuevo === '1'}
    />
  )
}
