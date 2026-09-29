import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import { Kpi } from '@/components/app/blocks/kpi'
import { CategoryBreakdown } from '@/components/app/blocks/category-breakdown'
import { AlertRow } from '@/components/app/blocks/alert-list'
import { UpcomingList } from '@/components/app/blocks/upcoming-list'
import { GoalsMini } from '@/components/app/blocks/goals-mini'
import { AiSummary, AiSummaryFallback } from '@/components/app/blocks/ai-summary'
import { CapitalChart, Legend } from '@/components/charts/charts'
import { Money } from '@/components/app/money'
import { EstimateTag } from '@/components/app/states'
import { Onboarding } from './onboarding'
import { getAppData } from '@/modules/app/data'
import { upcoming } from '@/modules/insights/upcoming'
import { balanceAt } from '@/modules/analytics/summary'
import { endOfMonth, previousFullMonths } from '@/modules/analytics/dates'
import { dateLong, money, monthName } from '@/lib/format'

export const metadata: Metadata = { title: 'Inicio' }

function greeting() {
  const h = Number(new Intl.DateTimeFormat('es-AR', { hour: 'numeric', hour12: false, timeZone: 'America/Argentina/Buenos_Aires' }).format(new Date()))
  return h < 6 ? 'Buenas noches' : h < 13 ? 'Buen día' : h < 20 ? 'Buenas tardes' : 'Buenas noches'
}

export default async function Inicio({ searchParams }: { searchParams: Promise<{ bienvenida?: string }> }) {
  const { user, ctx, alerts, combined, today, finance } = await getAppData()
  const sp = await searchParams
  const first = user.name.split(' ')[0]

  if (!ctx.hasData) return <Onboarding name={first} welcome={!!sp.bienvenida} />

  const m = ctx.month
  // capital al cierre de cada mes (real), hoy, y el cierre estimado de este mes (punteado)
  const capitalData: { label: string; real: number | null; est: number | null }[] = previousFullMonths(today, 6).map((r) => ({ label: r.end, real: balanceAt(finance.txns, user.initialBalanceCents, r.end), est: null }))
  capitalData.push({ label: today, real: ctx.balanceCents, est: ctx.balanceCents })
  if (endOfMonth(today) > today) capitalData.push({ label: endOfMonth(today), real: null, est: ctx.forecast.endOfMonthBalanceCents })
  const monthStartBalance = ctx.forecast.series[0]?.realCents ?? ctx.balanceCents
  const up = upcoming(ctx.recurring, combined, today)

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[13px] text-muted first-letter:uppercase">{dateLong(today)}</p>
        <h1 className="mt-0.5 text-[22px] font-semibold tracking-[-0.02em] sm:text-2xl">
          {greeting()}, {first}
        </h1>
      </div>

      {/* nivel 1: qué pasó + capital */}
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)]">
        <Suspense fallback={<AiSummaryFallback />}>
          <AiSummary />
        </Suspense>
        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3 px-5 pt-4">
            <div>
              <p className="text-[13px] text-fg-2">Capital disponible</p>
              <p className="mt-1 text-[40px] leading-none font-semibold tracking-[-0.03em]">
                <Money cents={ctx.balanceCents} />
              </p>
              <p className="mt-2 text-[13px] text-muted">
                <span className={ctx.balanceCents - monthStartBalance >= 0 ? 'text-positive' : 'text-critical'}>
                  <Money cents={ctx.balanceCents - monthStartBalance} sign />
                </span>{' '}
                desde el 1 de {monthName(today)} · cierre estimado <Money cents={ctx.forecast.endOfMonthBalanceCents} className="font-medium text-fg-2" />
              </p>
            </div>
            <Legend
              items={[
                { label: 'Real', color: 'var(--accent)' },
                { label: 'Estimado', color: 'var(--accent)', kind: 'dashed' },
              ]}
            />
          </div>
          <div className="px-2 pt-2 pb-3">
            <CapitalChart data={capitalData} height={190} labels="day" />
          </div>
        </Card>
      </div>

      {/* nivel 2: kpis del mes */}
      <section aria-label={`Resumen de ${monthName(today)}`} className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Ingresos del mes" cents={m.incomeCents} delta={m.deltas.income.pct} goodWhenUp help="Todo lo que entró este mes. Se compara con el mismo tramo del mes pasado." />
        <Kpi label="Gastos del mes" cents={m.expenseCents} delta={m.deltas.expense.pct} goodWhenUp={false} help="Todo lo que salió este mes, incluidos fijos y cuotas." />
        <Kpi label="Ahorro neto" cents={m.netCents} delta={m.deltas.net.cents} deltaUnit="cents" goodWhenUp help="Ingresos menos gastos del mes." />
        <Kpi label="Tasa de ahorro" ratio={m.savingsRate} delta={m.deltas.savingsRatePts} deltaUnit="pts" goodWhenUp help="Qué parte de lo que entró te quedó. Una referencia sana es 20% o más." />
      </section>

      {/* nivel 3: por qué pasó y qué viene */}
      <div className="grid gap-4 lg:grid-cols-2">
        <CategoryBreakdown slices={ctx.categories} subtitle={`${monthName(today)} hasta hoy`} />
        <Card>
          <CardHeader title="Próximos gastos" subtitle="Próximas 2 semanas" action={<Link href="/calendario" className="text-[13px] text-accent hover:underline">Calendario</Link>} />
          <CardBody>
            {combined.potentialExpenseCents > 0 && (
              <p className="mb-2 flex flex-wrap items-center gap-2 rounded-lg bg-surface-2 px-3 py-2 text-[13px] text-fg-2">
                <span className="money">{combined.summary}</span>
                <EstimateTag />
              </p>
            )}
            <UpcomingList items={up} today={today} />
          </CardBody>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <Card>
          <CardHeader title="Alertas importantes" subtitle={alerts.length ? `${alerts.length} activas, ordenadas por importancia` : undefined} action={<Link href="/alertas" className="text-[13px] text-accent hover:underline">Ver todas</Link>} />
          <CardBody className="pb-2">
            {alerts.length ? (
              <div className="divide-y divide-border">
                {alerts.slice(0, 4).map((a) => (
                  <AlertRow key={a.key} alert={a} compact />
                ))}
              </div>
            ) : (
              <p className="py-6 text-center text-[13px] text-muted">Todo en orden. No hay nada que requiera tu atención.</p>
            )}
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Objetivos" action={<Link href="/objetivos" className="text-[13px] text-accent hover:underline">Ver todos</Link>} />
          <CardBody>
            <GoalsMini goals={ctx.goals} />
          </CardBody>
        </Card>
      </div>

      <p className="text-center text-[12px] text-muted">
        {finance.txns.length} movimientos analizados · los valores marcados como estimado son proyecciones, no datos reales · {money(ctx.monthlyIncomeCents)} de ingreso típico
      </p>
    </div>
  )
}
