import Link from 'next/link'
import { ChartBarBig } from 'lucide-react'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import type { CategorySlice } from '@/modules/analytics/summary'
import { CategoryIcon } from '../icons'
import { Money } from '../money'
import { EmptyState } from '../states'
import { pct } from '@/lib/format'

/**
 * top 5 categorías + "otros" como barras horizontales en una sola tinta, ordenadas por monto.
 * las categorías son nominales: se leen por nombre e ícono, el largo de la barra muestra cuánto (skill dataviz)
 */
export function CategoryBreakdown({ slices, subtitle, href = '/estadisticas' }: { slices: CategorySlice[]; subtitle: string; href?: string }) {
  const total = slices.reduce((a, s) => a + s.cents, 0)
  const main = slices.slice(0, 5)
  const rest = slices.slice(5)
  const restCents = rest.reduce((a, s) => a + s.cents, 0)
  const max = Math.max(1, restCents, ...main.map((s) => s.cents))
  const rows = [...main.map((s) => ({ key: s.categoryId ?? s.name, name: s.name, icon: s.icon as string | null, cents: s.cents, other: false })), ...(restCents > 0 ? [{ key: 'otros', name: `Otros (${rest.length})`, icon: null, cents: restCents, other: true }] : [])]
  return (
    <Card>
      <CardHeader title="Gastos por categoría" subtitle={subtitle} action={<Link href={href} className="text-[13px] text-accent hover:underline">Ver detalle</Link>} />
      <CardBody>
        {total === 0 ? (
          <EmptyState compact icon={ChartBarBig} title="Sin gastos en este período">
            Cuando registres gastos vas a ver en qué se va tu plata.
          </EmptyState>
        ) : (
          <>
            <p className="flex items-baseline gap-2">
              <Money cents={total} className="text-[30px] leading-none font-medium" />
              <span className="text-[13px] text-muted">gastado</span>
            </p>
            <ul className="mt-5 space-y-3.5">
              {rows.map((r) => (
                <li key={r.key}>
                  <div className="flex items-center gap-2.5 text-[13px]">
                    {r.icon ? <CategoryIcon icon={r.icon} className="size-3.5 text-muted" /> : <span className="size-3.5" />}
                    <span className={r.other ? 'min-w-0 flex-1 truncate text-fg-2' : 'min-w-0 flex-1 truncate'}>{r.name}</span>
                    <Money cents={r.cents} tabular className="font-medium" />
                    <span className="num w-10 text-right text-muted">{pct(r.cents / total)}</span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-2" aria-hidden>
                    <div className={r.other ? 'bar-grow h-full rounded-full bg-chart-2' : 'bar-grow h-full rounded-full bg-chart-1'} style={{ width: `${Math.max(1, (r.cents / max) * 100)}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </CardBody>
    </Card>
  )
}
