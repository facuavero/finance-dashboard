import { AskAi } from '@/components/app/ask-ai'
import type { Metadata } from 'next'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/app/states'
import { Kpi } from '@/components/app/blocks/kpi'
import { CategoryIcon } from '@/components/app/icons'
import { Money } from '@/components/app/money'
import { CapitalChart, CategoryMultiples, FlowBars, SingleBars, StackedBars } from '@/components/charts/charts'
import { getAppData } from '@/modules/app/data'
import { buildStats } from '@/modules/analytics/stats'
import type { Granularity } from '@/modules/analytics/dates'
import { money, pct } from '@/lib/format'
import { cn } from '@/lib/utils'

export const metadata: Metadata = { title: 'Estadísticas' }

const TABS: { g: Granularity; label: string }[] = [
  { g: 'week', label: 'Semana' },
  { g: 'month', label: 'Mes' },
  { g: 'quarter', label: 'Trimestre' },
  { g: 'year', label: 'Año' },
]
const UNIT = { week: 'semana', month: 'mes', quarter: 'trimestre', year: 'año' }

export default async function Estadisticas({ searchParams }: { searchParams: Promise<{ p?: string; a?: string }> }) {
  const { finance, ctx, user, today } = await getAppData()
  const sp = await searchParams
  const g: Granularity = (['week', 'month', 'quarter', 'year'] as const).find((x) => x === sp.p) ?? 'month'
  const anchor = sp.a && /^\d{4}-\d{2}-\d{2}$/.test(sp.a) && sp.a <= today ? sp.a : today
  const s = buildStats({ txns: finance.txns, cats: finance.cats, recurring: ctx.recurring, initialCents: user.initialBalanceCents, g, anchor, today, microThresholdCents: user.microThresholdCents })
  const prev = s.previousSummary
  const d = (a: number, b: number) => (b > 0 ? (a - b) / b : null)
  const href = (p: Granularity, a?: string | null) => `/estadisticas?p=${p}${a ? `&a=${a}` : ''}`

  return (
    <>
      <PageHeader title="Estadísticas" description="Cómo evolucionan tu capital, tus ingresos y tus gastos. Cambiá la unidad para comparar semanas, meses, trimestres o años." actions={<AskAi topic="estadisticas" suggestions={["¿En qué categoría crecieron más mis gastos?", "¿Cómo viene este mes contra mi promedio?", "¿Cuál fue mi mejor mes de ahorro?"]} />} />

      {/* filtros de período: una fila arriba de todo */}
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <nav aria-label="Unidad de tiempo" className="inline-flex rounded-full border border-border bg-surface p-0.5">
          {TABS.map((t) => (
            <Link key={t.g} href={href(t.g)} aria-current={g === t.g ? 'page' : undefined} className={cn('rounded-full px-3 py-1 text-[13px] font-medium', g === t.g ? 'bg-fg text-bg' : 'text-fg-2 hover:text-fg')}>
              {t.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-1">
          <Button asChild variant="ghost" size="icon-sm" aria-label={`${UNIT[g]} anterior`}>
            <Link href={href(g, s.prevAnchor)}>
              <ChevronLeft />
            </Link>
          </Button>
          <p className="min-w-40 text-center text-sm font-medium first-letter:uppercase">{s.title}</p>
          {s.nextAnchor ? (
            <Button asChild variant="ghost" size="icon-sm" aria-label={`${UNIT[g]} siguiente`}>
              <Link href={href(g, s.nextAnchor)}>
                <ChevronRight />
              </Link>
            </Button>
          ) : (
            <span className="size-8" />
          )}
        </div>
        {s.isCurrentPeriod && <p className="text-[12px] text-muted">En curso: se compara con el mismo tramo del {UNIT[g]} anterior.</p>}
      </div>

      <section aria-label="Resumen del período" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Ingresos" cents={s.summary.incomeCents} delta={d(s.summary.incomeCents, prev.incomeCents)} goodWhenUp help="Todo lo que entró en el período." deltaLabel={`vs. ${UNIT[g]} anterior`} />
        <Kpi label="Gastos" cents={s.summary.expenseCents} delta={d(s.summary.expenseCents, prev.expenseCents)} goodWhenUp={false} help="Todo lo que salió en el período." deltaLabel={`vs. ${UNIT[g]} anterior`} />
        <Kpi label="Ahorro neto" cents={s.summary.netCents} delta={s.summary.netCents - prev.netCents} deltaUnit="cents" goodWhenUp help="Ingresos menos gastos." deltaLabel={`vs. ${UNIT[g]} anterior`} />
        <Kpi label="Tasa de ahorro" ratio={s.summary.savingsRate} delta={s.summary.savingsRate !== null && prev.savingsRate !== null ? s.summary.savingsRate - prev.savingsRate : null} deltaUnit="pts" goodWhenUp help="Qué parte de lo que entró te quedó." deltaLabel={`vs. ${UNIT[g]} anterior`} />
      </section>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Ingresos vs gastos" subtitle={`Por ${UNIT[g]}, últimos ${s.series.length}`} />
          <CardBody>
            <FlowBars data={s.series.map((p) => ({ label: p.label, income: p.incomeCents, expense: p.expenseCents }))} />
            <DataTable caption="Ingresos y gastos por período" headers={['Período', 'Ingresos', 'Gastos', 'Neto']} rows={s.series.map((p) => [p.label + (p.partial ? ' (en curso)' : ''), money(p.incomeCents), money(p.expenseCents), money(p.netCents, { sign: true })])} />
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Evolución del capital" subtitle={`Saldo al cierre de cada ${UNIT[g]}`} />
          <CardBody>
            <CapitalChart data={s.series.map((p) => ({ label: p.label, real: p.balanceCents }))} height={264} />
          </CardBody>
        </Card>
        <Card>
          <CardHeader title={`Ahorro por ${UNIT[g]}`} subtitle="Ingresos menos gastos. En rojo, los períodos en que gastaste más de lo que entró." />
          <CardBody>
            <SingleBars data={s.series.map((p) => ({ label: p.label, value: p.netCents }))} name="Ahorro" height={220} />
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Gastos fijos vs variables" subtitle="Recurrentes (alquiler, servicios, cuotas, suscripciones) contra el resto" />
          <CardBody>
            <StackedBars
              data={s.series.map((p) => ({ label: p.label, a: p.recurringCents, b: p.variableCents }))}
              series={[
                { key: 'a', name: 'Recurrentes', color: 'var(--chart-1)' },
                { key: 'b', name: 'Variables', color: 'var(--chart-2)' },
              ]}
            />
          </CardBody>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <Card>
          <CardHeader title="Gastos por categoría" subtitle={`${s.title} contra el ${UNIT[g]} anterior`} />
          <CardBody className="px-0 pb-2">
            <table className="w-full text-[13px]">
              <caption className="sr-only">Gasto por categoría y variación</caption>
              <thead className="text-left text-[12px] text-muted">
                <tr className="border-b border-border">
                  <th className="py-2 pl-5 font-medium">Categoría</th>
                  <th className="py-2 text-right font-medium">Este {UNIT[g]}</th>
                  <th className="hidden py-2 text-right font-medium sm:table-cell">Anterior</th>
                  <th className="py-2 pr-5 text-right font-medium">Cambio</th>
                </tr>
              </thead>
              <tbody>
                {s.categories.map((c) => (
                  <tr key={c.categoryId ?? c.name} className="border-b border-border/60 last:border-0">
                    <td className="py-2 pl-5">
                      <span className="flex items-center gap-2">
                        <CategoryIcon icon={c.icon} className="size-3.5 text-muted" />
                        {c.name}
                      </span>
                      <span className="mt-1 block h-1 rounded-full bg-surface-2">
                        <span className="bar-grow block h-1 rounded-full bg-chart-1" style={{ width: `${Math.max(1, c.pct * 100)}%` }} />
                      </span>
                    </td>
                    <td className="py-2 text-right font-medium">
                      <Money cents={c.cents} tabular />
                    </td>
                    <td className="hidden py-2 text-right text-muted sm:table-cell">
                      <Money cents={c.previousCents} tabular />
                    </td>
                    <td className={cn('num py-2 pr-5 text-right', c.changePct === null ? 'text-muted' : c.changePct > 0.15 ? 'text-critical' : c.changePct < -0.15 ? 'text-positive' : 'text-fg-2')}>{c.changePct === null ? 'nuevo' : pct(c.changePct, { sign: true })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardBody>
        </Card>
        <div className="space-y-4">
          <Card>
            <CardHeader title="Evolución de categorías" subtitle="Tus 4 categorías con más gasto" />
            <CardBody>
              <CategoryMultiples data={s.categorySeries} series={s.topCategories.map((c) => ({ key: c.key, name: c.name }))} />
            </CardBody>
          </Card>
          <Card>
            <CardHeader title="Microgastos" subtitle={`Compras menores a ${money(user.microThresholdCents)} por ${UNIT[g]}`} action={<Link href="/fugas" className="text-[13px] text-accent hover:underline">Analizar</Link>} />
            <CardBody>
              <SingleBars data={s.series.map((p) => ({ label: p.label, value: p.microCents }))} name="Microgastos" height={160} />
            </CardBody>
          </Card>
        </div>
      </div>
      <p className="mt-6 text-center text-[12px] text-muted">El último período puede estar en curso: sus valores son parciales, no estimados.</p>
    </>
  )
}

function DataTable({ caption, headers, rows }: { caption: string; headers: string[]; rows: string[][] }) {
  return (
    <details className="mt-3 text-[12px]">
      <summary className="cursor-pointer text-muted hover:text-fg">Ver como tabla</summary>
      <div className="mt-2 max-h-56 overflow-auto rounded-2xl border border-border">
        <table className="money w-full">
          <caption className="sr-only">{caption}</caption>
          <thead className="bg-surface-2 text-left text-muted">
            <tr>
              {headers.map((h, i) => (
                <th key={h} className={cn('px-3 py-1.5 font-medium', i > 0 && 'text-right')}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r[0]} className="border-t border-border">
                {r.map((c, i) => (
                  <td key={i} className={cn('num px-3 py-1.5', i > 0 && 'text-right')}>
                    {c}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  )
}
