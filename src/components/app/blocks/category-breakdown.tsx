import Link from 'next/link'
import { PieChart as PieIcon } from 'lucide-react'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import { Donut } from '@/components/charts/charts'
import type { CategorySlice } from '@/modules/analytics/summary'
import { CategoryIcon, seriesVar } from '../icons'
import { Money } from '../money'
import { EmptyState } from '../states'
import { pct } from '@/lib/format'

/** ≤5 categorías con color propio + "otros". el color sigue a la categoría (slot fijo), no al ranking */
export function CategoryBreakdown({ slices, subtitle, href = '/estadisticas' }: { slices: CategorySlice[]; subtitle: string; href?: string }) {
  const total = slices.reduce((a, s) => a + s.cents, 0)
  const main = slices.filter((s) => s.colorSlot).slice(0, 5)
  const rest = slices.filter((s) => !main.includes(s))
  const restCents = rest.reduce((a, s) => a + s.cents, 0)
  const data = [...main.map((s) => ({ name: s.name, value: s.cents, color: seriesVar(s.colorSlot) })), ...(restCents > 0 ? [{ name: 'Otros', value: restCents, color: 'var(--series-other)' }] : [])]
  return (
    <Card>
      <CardHeader title="Gastos por categoría" subtitle={subtitle} action={<Link href={href} className="text-[13px] text-accent hover:underline">Ver detalle</Link>} />
      <CardBody>
        {total === 0 ? (
          <EmptyState compact icon={PieIcon} title="Sin gastos en este período">
            Cuando registres gastos vas a ver en qué se va tu plata.
          </EmptyState>
        ) : (
          <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start">
            <Donut data={data} total={total} centerLabel="gastado" />
            <ul className="w-full min-w-0 flex-1 space-y-2.5">
              {main.map((s) => (
                <li key={s.categoryId ?? s.name} className="flex items-center gap-2.5 text-[13px]">
                  <span className="size-2.5 shrink-0 rounded-[3px]" style={{ background: seriesVar(s.colorSlot) }} aria-hidden />
                  <CategoryIcon icon={s.icon} className="size-3.5 text-muted" />
                  <span className="min-w-0 flex-1 truncate">{s.name}</span>
                  <Money cents={s.cents} tabular className="font-medium" />
                  <span className="num w-10 text-right text-muted">{pct(s.pct)}</span>
                </li>
              ))}
              {restCents > 0 && (
                <li className="flex items-center gap-2.5 text-[13px]">
                  <span className="size-2.5 shrink-0 rounded-[3px] bg-[var(--series-other)]" aria-hidden />
                  <span className="size-3.5" />
                  <span className="min-w-0 flex-1 truncate text-fg-2">Otros ({rest.length})</span>
                  <Money cents={restCents} tabular className="font-medium" />
                  <span className="num w-10 text-right text-muted">{pct(restCents / total)}</span>
                </li>
              )}
            </ul>
          </div>
        )}
      </CardBody>
    </Card>
  )
}
