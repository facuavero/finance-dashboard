import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import { CategoryBreakdown } from '@/components/app/blocks/category-breakdown'
import { AlertRow } from '@/components/app/blocks/alert-list'
import { UpcomingList } from '@/components/app/blocks/upcoming-list'
import { GoalsMini } from '@/components/app/blocks/goals-mini'
import { AiSummary, AiSummaryFallback } from '@/components/app/blocks/ai-summary'
import { CapitalChart, Legend } from '@/components/charts/charts'
import { Delta, Money } from '@/components/app/money'
import { EstimateTag } from '@/components/app/states'
import { Onboarding } from './onboarding'
import { AssistantCard } from '@/components/app/assistant-card'
import { getAppData } from '@/modules/app/data'
import { upcoming } from '@/modules/insights/upcoming'
import { pickTip } from '@/modules/insights/tips'
import { balanceAt } from '@/modules/analytics/summary'
import { endOfMonth, previousFullMonths } from '@/modules/analytics/dates'
import { dateLong, money, monthName, pct } from '@/lib/format'
import { cn } from '@/lib/utils'

export const metadata: Metadata = { title: 'Inicio' }

function greeting() {
  const h = Number(new Intl.DateTimeFormat('es-AR', { hour: 'numeric', hour12: false, timeZone: 'America/Argentina/Buenos_Aires' }).format(new Date()))
  return h < 6 ? 'Buenas noches' : h < 13 ? 'Buen día' : h < 20 ? 'Buenas tardes' : 'Buenas noches'
}

export default async function Inicio({ searchParams }: { searchParams: Promise<{ bienvenida?: string; asistente?: string }> }) {
  const { user, ctx, alerts, combined, today, finance, prefs } = await getAppData()
  const sp = await searchParams
  const first = user.name.split(' ')[0]

  const assistantCats = finance.cats.map((c) => ({ id: c.id, name: c.name }))
  if (!ctx.hasData) {
    return (
      <>
        <div className="mx-auto max-w-3xl pt-4">
          <AssistantCard categories={assistantCats} force={!!sp.asistente} />
        </div>
        <Onboarding name={first} welcome={!!sp.bienvenida} />
      </>
    )
  }

  const m = ctx.month
  // capital al cierre de cada mes (real), hoy, y el cierre estimado de este mes (punteado)
  const capitalData: { label: string; real: number | null; est: number | null }[] = previousFullMonths(today, 6).map((r) => ({ label: r.end, real: balanceAt(finance.txns, user.initialBalanceCents, r.end), est: null }))
  capitalData.push({ label: today, real: ctx.balanceCents, est: ctx.balanceCents })
  if (endOfMonth(today) > today) capitalData.push({ label: endOfMonth(today), real: null, est: ctx.forecast.endOfMonthBalanceCents })
  const monthStartBalance = ctx.forecast.series[0]?.realCents ?? ctx.balanceCents
  const up = upcoming(ctx.recurring, combined, today)
  // un tip distinto en cada visita (la página es dinámica: se vuelve a elegir en cada request)
  const tip = prefs.tips ? pickTip(ctx) : null

  const kpis = [
    { label: 'Ingresos', cents: m.incomeCents, delta: m.deltas.income.pct, goodWhenUp: true },
    { label: 'Gastos', cents: m.expenseCents, delta: m.deltas.expense.pct, goodWhenUp: false },
    { label: 'Ahorro neto', cents: m.netCents, delta: m.deltas.net.cents, goodWhenUp: true, unit: 'cents' as const },
    { label: 'Tasa de ahorro', ratio: m.savingsRate, delta: m.deltas.savingsRatePts, goodWhenUp: true, unit: 'pts' as const },
  ]

  return (
    <div>
      {/* saludo en serif, como un diario (fey) */}
      <div className="mb-8">
        <p className="label-caps first-letter:uppercase">{dateLong(today)}</p>
        <h1 className="display mt-2 text-[40px] sm:text-[52px]">
          {greeting()}, {first}
        </h1>
      </div>

      <AssistantCard categories={assistantCats} force={!!sp.asistente} />

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        {/* izquierda: qué pasó. capital, gráfico y kpis en una sola pieza */}
        <div className="min-w-0 space-y-5">
          <Card className="overflow-hidden">
            <div className="flex flex-wrap items-start justify-between gap-4 px-5 pt-6 sm:px-7">
              <div>
                <p className="label-caps">Capital disponible</p>
                <p className="mt-3 text-[34px] leading-none font-medium min-[420px]:text-[40px] sm:text-[56px]">
                  <Money cents={ctx.balanceCents} />
                </p>
                <p className="mt-3 text-[13px] text-muted">
                  <Money cents={ctx.balanceCents - monthStartBalance} sign className="text-fg" /> desde el 1 de {monthName(today)} · cierre estimado <Money cents={ctx.forecast.endOfMonthBalanceCents} className="text-fg-2" />
                </p>
              </div>
              <Legend
                items={[
                  { label: 'Real', color: 'var(--chart-1)' },
                  { label: 'Estimado', color: 'var(--chart-1)', kind: 'dashed' },
                ]}
              />
            </div>
            <div className="px-3 pt-4 pb-2 sm:px-5">
              <CapitalChart data={capitalData} height={230} labels="day" />
            </div>
            <dl className="grid grid-cols-2 border-t border-border lg:grid-cols-4" aria-label={`Resumen de ${monthName(today)}`}>
              {kpis.map((k, i) => (
                <div key={k.label} className={cn('px-5 py-5 sm:px-7', i % 2 === 1 && 'border-l border-border', i >= 2 && 'border-t border-border lg:border-t-0', i === 2 && 'lg:border-l')}>
                  <dt className="label-caps">{k.label}</dt>
                  <dd className="mt-2 text-[20px] leading-none font-medium sm:text-[22px]">{k.cents !== undefined ? <Money cents={k.cents} /> : <span className="money font-figure tracking-[-0.02em]">{pct(k.ratio ?? null)}</span>}</dd>
                  <Delta ratio={k.delta} goodWhenUp={k.goodWhenUp} unit={k.unit} label="" className="mt-2" />
                </div>
              ))}
            </dl>
          </Card>
          <CategoryBreakdown slices={ctx.categories} subtitle={`${monthName(today)} hasta hoy`} />
        </div>

        {/* derecha: feed. por qué pasó y qué viene */}
        <div className="min-w-0 space-y-5">
          <Suspense fallback={<AiSummaryFallback tip={tip} />}>
            <AiSummary tip={tip} />
          </Suspense>
          <Card>
            <CardHeader title="Lo importante" subtitle={alerts.length ? `${alerts.length} alertas, por prioridad` : undefined} action={<Link href="/alertas" className="text-[13px] text-accent hover:underline">Ver todas</Link>} />
            <CardBody className="pb-3">
              {alerts.length ? (
                <div className="divide-y divide-border">
                  {alerts.slice(0, 3).map((a) => (
                    <AlertRow key={a.key} alert={a} compact />
                  ))}
                </div>
              ) : (
                <p className="py-6 text-center text-[13px] text-muted">Todo en orden. No hay nada que requiera tu atención.</p>
              )}
            </CardBody>
          </Card>
          <Card>
            <CardHeader title="Lo que viene" subtitle="Próximas 2 semanas" action={<Link href="/calendario" className="text-[13px] text-accent hover:underline">Calendario</Link>} />
            <CardBody>
              {combined.potentialExpenseCents > 0 && (
                <p className="mb-2 flex flex-wrap items-center gap-2 rounded-2xl bg-surface-2 px-4 py-3 text-[13px] text-fg-2">
                  <span className="money">{combined.summary}</span>
                  <EstimateTag />
                </p>
              )}
              <UpcomingList items={up} today={today} limit={5} />
            </CardBody>
          </Card>
          <Card>
            <CardHeader title="Objetivos" action={<Link href="/objetivos" className="text-[13px] text-accent hover:underline">Ver todos</Link>} />
            <CardBody>
              <GoalsMini goals={ctx.goals} />
            </CardBody>
          </Card>
        </div>
      </div>

      <p className="mt-10 text-center font-mono text-[11px] text-muted">
        {finance.txns.length} movimientos analizados · lo marcado como estimado es proyección, no dato real · {money(ctx.monthlyIncomeCents)} de ingreso típico
      </p>
    </div>
  )
}
