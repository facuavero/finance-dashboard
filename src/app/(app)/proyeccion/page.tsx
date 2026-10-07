import type { Metadata } from 'next'
import { Minus, Plus, Equal } from 'lucide-react'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import { EstimateTag, PageHeader, RealTag, SectionLabel } from '@/components/app/states'
import { Money } from '@/components/app/money'
import { CapitalChart, Legend } from '@/components/charts/charts'
import { getAppData } from '@/modules/app/data'
import { projectCapital } from '@/modules/analytics/forecast'
import { dateShort, monthName, relativeDays } from '@/lib/format'
import { Simulator } from './simulator'

export const metadata: Metadata = { title: 'Proyección' }

export default async function Proyeccion() {
  const { ctx, finance, user, today, recommendations } = await getAppData()
  const f = ctx.forecast
  const cap = ctx.capacity
  const projection = projectCapital(finance.txns, user.initialBalanceCents, today, 6)
  const reduction = recommendations.filter((r) => r.area === 'microgastos' && r.id !== 'micro:total').reduce((a, r) => a + (r.impactMonthlyCents ?? 0), 0)

  return (
    <>
      <PageHeader title="Proyección" description="Qué puede pasar: saldo a fin de mes, capacidad de ahorro y hacia dónde va tu capital. Todo lo estimado está marcado como tal." />

      <div className="mb-5 flex flex-wrap items-center gap-3 rounded-lg border border-border bg-surface px-4 py-2.5 text-[13px] text-fg-2">
        <span className="flex items-center gap-1.5">
          <RealTag /> dato cargado por vos
        </span>
        <span className="flex items-center gap-1.5">
          <EstimateTag /> cálculo a partir de tu historial y tus pagos recurrentes
        </span>
      </div>

      <SectionLabel>Este mes</SectionLabel>
      <div className="mt-2 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
        <Card className="p-5">
          <p className="flex items-center gap-2 text-[13px] text-fg-2">
            Saldo estimado al {dateShort(f.series.at(-1)?.date ?? today)} <EstimateTag />
          </p>
          <p className="mt-1 text-[40px] leading-none font-semibold tracking-[-0.03em]">
            <Money cents={f.endOfMonthBalanceCents} />
          </p>
          <ul className="mt-5 space-y-2.5 text-[13px]">
            <Line icon={null} label="Capital hoy" cents={f.balanceNowCents} tag={<RealTag />} />
            <Line icon={<Plus className="size-3.5" />} label="Ingresos previstos" cents={f.expectedIncomeCents} tag={<EstimateTag />} hint="recurrentes que todavía no entraron" />
            <Line icon={<Minus className="size-3.5" />} label="Pagos fijos pendientes" cents={f.expectedFixedCents} tag={<EstimateTag />} hint="recurrentes que faltan pagar" />
            <Line icon={<Minus className="size-3.5" />} label={`Gasto variable (${f.remainingDays} ${f.remainingDays === 1 ? 'día' : 'días'})`} cents={f.expectedVariableCents} tag={<EstimateTag />} hint={`tu promedio: ${Math.round(f.dailyVariableCents / 100).toLocaleString('es-AR')} por día`} />
            <li className="flex items-center gap-2 border-t border-border pt-2.5 font-semibold">
              <Equal className="size-3.5 text-muted" />
              <span className="flex-1">Cierre de {monthName(today)}</span>
              <Money cents={f.endOfMonthBalanceCents} tabular />
            </li>
          </ul>
        </Card>
        <Card>
          <CardHeader title="Saldo día por día" subtitle={`${monthName(today)}: real hasta hoy, estimado después`} action={<Legend items={[{ label: 'Real', color: 'var(--chart-1)' }, { label: 'Estimado', color: 'var(--chart-1)', kind: 'dashed' }]} />} />
          <CardBody>
            <CapitalChart data={f.series.map((p) => ({ label: p.date, real: p.realCents, est: p.estimatedCents }))} labels="day" height={230} />
          </CardBody>
        </Card>
      </div>

      {f.pending.length > 0 && (
        <Card className="mt-4">
          <CardHeader title="Pendiente hasta fin de mes" subtitle="Pagos e ingresos recurrentes que todavía no se registraron" />
          <CardBody className="pb-3">
            <ul className="divide-y divide-border">
              {f.pending.map((p) => (
                <li key={p.label + p.date} className="flex items-center gap-3 py-2 text-[13px]">
                  <span className="w-14 text-muted">{dateShort(p.date)}</span>
                  <span className="flex-1">{p.label}</span>
                  <span className="text-[12px] text-muted">{relativeDays(today, p.date)}</span>
                  <Money cents={p.type === 'income' ? p.cents : -p.cents} sign={p.type === 'income'} tabular className={p.type === 'income' ? 'text-positive' : ''} />
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      )}

      <div className="mt-8 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
        <div>
          <SectionLabel>Capacidad de ahorro</SectionLabel>
          <Card className="mt-2 p-5">
            <p className="flex items-center gap-2 text-[13px] text-fg-2">
              Por mes, con tu comportamiento actual <EstimateTag />
            </p>
            <p className="mt-1 text-[32px] leading-none font-semibold tracking-[-0.02em]">
              <Money cents={cap.capacityCents} />
            </p>
            <ul className="mt-5 space-y-2.5 text-[13px]">
              <Line icon={null} label="Ingreso típico" cents={cap.typicalIncomeCents} />
              <Line icon={<Minus className="size-3.5" />} label="Gastos fijos y recurrentes" cents={cap.fixedCents} />
              <Line icon={<Minus className="size-3.5" />} label="Gastos variables típicos" cents={cap.variableCents} />
            </ul>
            <p className="mt-4 text-[12px] text-muted">Promedio de los últimos {cap.months} meses completos. Los fijos salen de los pagos recurrentes detectados.</p>
          </Card>
        </div>
        <div>
          <SectionLabel>Evolución probable del capital</SectionLabel>
          <Card className="mt-2">
            <CardHeader title="Próximos 6 meses" subtitle="Si seguís con el ahorro promedio de los últimos 3 meses. La banda muestra la variación habitual." action={<Legend items={[{ label: 'Real', color: 'var(--chart-1)' }, { label: 'Estimado', color: 'var(--chart-1)', kind: 'dashed' }]} />} />
            <CardBody>
              <CapitalChart data={projection.map((p) => ({ label: p.month, real: p.realCents, est: p.estimatedCents, low: p.lowCents, high: p.highCents }))} labels="month" height={220} />
            </CardBody>
          </Card>
        </div>
      </div>

      <section id="simulador" className="mt-10 scroll-mt-20" aria-labelledby="sim-title">
        <SectionLabel>Simulador</SectionLabel>
        <h2 id="sim-title" className="mt-1 text-[20px] font-semibold tracking-[-0.02em]">
          ¿Qué pasa si cambiás algo?
        </h2>
        <p className="mt-1 text-[13px] text-muted">Mové los valores y mirá los escenarios a 1, 3, 5 y 10 años.</p>
        <Simulator defaults={{ initial: Math.max(0, Math.round((ctx.balanceCents - ctx.monthlyExpenseCents * 3) / 100_000) * 1000), saving: Math.max(0, Math.round(cap.capacityCents / 200_000) * 1000), invest: Math.max(0, Math.round(cap.capacityCents / 200_000) * 1000), rate: 4, reduction: Math.round(reduction / 100_000) * 1000 }} />
      </section>
    </>
  )
}

function Line({ icon, label, cents, tag, hint }: { icon: React.ReactNode; label: string; cents: number; tag?: React.ReactNode; hint?: string }) {
  return (
    <li className="flex items-center gap-2">
      <span className="flex size-3.5 items-center justify-center text-muted">{icon}</span>
      <span className="flex-1">
        {label}
        {hint && <span className="block text-[12px] text-muted">{hint}</span>}
      </span>
      {tag}
      <Money cents={cents} tabular className="w-28 text-right font-medium" />
    </li>
  )
}
