import type { Metadata } from 'next'
import Link from 'next/link'
import { AlertTriangle, Repeat } from 'lucide-react'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { EmptyState, PageHeader, SectionLabel } from '@/components/app/states'
import { Money } from '@/components/app/money'
import { HistoryBars } from '@/components/charts/charts'
import { getAppData } from '@/modules/app/data'
import { addDays, addMonths, dayOfMonth, daysInMonth, inRange, startOfMonth } from '@/modules/analytics/dates'
import { indexCats, rootCat, sum } from '@/modules/analytics/types'
import { dateShort, money, monthShort, pct, relativeDays } from '@/lib/format'
import { MicroPatterns } from './micro-patterns'

export const metadata: Metadata = { title: 'Fugas de dinero' }

const KIND = { subscription: 'Suscripción', installment: 'Cuota', utility: 'Servicio', housing: 'Vivienda', income: 'Ingreso', other: 'Pago recurrente' }
const FREQ = { weekly: 'Semanal', monthly: 'Mensual', yearly: 'Anual' }

export default async function Fugas() {
  const { ctx, finance, today, user } = await getAppData()
  const micro = ctx.micro
  const recurring = ctx.recurring.filter((r) => r.type === 'expense')
  const subsReview = recurring.filter((r) => r.reviewHint)
  const growth = ctx.anomalies.filter((a) => a.kind === 'category_growth')
  const unusual = ctx.anomalies.filter((a) => a.kind === 'unusual_txn')
  const leakMonthly = sum(micro.patterns.map((p) => p.monthlyCents)) + sum(growth.map((g) => (g.kind === 'category_growth' ? g.extraCents : 0)))

  // historial al mismo día del mes de cada categoría que creció (para ver la anomalía)
  const idx = indexCats(finance.cats)
  const dom = dayOfMonth(today)
  const history = (catId: string) =>
    [4, 3, 2, 1, 0].map((i) => {
      const start = addMonths(startOfMonth(today), -i)
      const end = addDays(start, Math.min(dom, daysInMonth(start)) - 1)
      return { label: monthShort(start), value: sum(finance.txns.filter((t) => t.type === 'expense' && inRange(t.date, { start, end }) && rootCat(idx, t.categoryId)?.id === catId).map((t) => t.amountCents)) }
    })

  return (
    <>
      <PageHeader title="Fugas de dinero" description="Lo que se va sin que lo notes: compras chicas repetidas, suscripciones y gastos que crecieron fuera de lo normal." />

      {ctx.hasData && (
        <Card className="mb-6 p-5">
          <p className="text-[13px] text-fg-2">Posibles fugas detectadas</p>
          <p className="mt-1 text-[40px] leading-none font-medium">
            <Money cents={leakMonthly} />
            <span className="ml-1.5 text-[15px] font-normal text-muted">por mes</span>
          </p>
          <p className="mt-1 text-[13px] text-muted">
            ~<Money cents={leakMonthly * 12} /> al año · microgastos frecuentes más lo que crecieron las categorías con anomalías. No todo es evitable: es lo que vale la pena revisar.
          </p>
        </Card>
      )}

      {/* microgastos */}
      <section id="microgastos" aria-labelledby="micro-title" className="scroll-mt-20">
        <SectionLabel>Microgastos</SectionLabel>
        <h2 id="micro-title" className="mt-1 display text-[30px] sm:text-[34px]">
          Gastaste <Money cents={micro.thisMonth.totalCents} /> este mes en compras inferiores a {money(micro.thresholdCents)}.
        </h2>
        <p className="mt-1 text-[13px] text-muted">
          {micro.thisMonth.count} compras. El umbral se cambia en <Link href="/configuracion" className="text-accent hover:underline">configuración</Link>.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <MiniStat label="Promedio mensual" value={<Money cents={micro.monthlyAvgCents} />} />
          <MiniStat label="Anual estimado" value={<Money cents={micro.annualEstimateCents} />} estimated />
          <MiniStat label="Del ingreso mensual" value={pct(micro.pctOfIncome, { decimals: 1 })} />
          <MiniStat label="Patrones detectados" value={String(micro.patterns.length)} />
        </div>
        {micro.patterns.length ? (
          <MicroPatterns patterns={micro.patterns} incomeCents={ctx.monthlyIncomeCents} />
        ) : (
          <Card className="mt-4">
            <EmptyState compact icon={Repeat} title="No encontramos patrones de microgastos">
              Necesitamos al menos 3 compras parecidas en los últimos 90 días.
            </EmptyState>
          </Card>
        )}
      </section>

      {/* recurrentes */}
      <section id="recurrentes" aria-labelledby="rec-title" className="mt-10 scroll-mt-20">
        <SectionLabel>Gastos recurrentes y suscripciones</SectionLabel>
        <div className="mt-1 flex flex-wrap items-end justify-between gap-2">
          <h2 id="rec-title" className="display text-[30px] sm:text-[34px]">
            <Money cents={ctx.recurringTotals.monthlyCents} /> por mes en {ctx.recurringTotals.count} pagos recurrentes
          </h2>
          <p className="text-[13px] text-muted">
            <Money cents={ctx.recurringTotals.annualCents} /> al año · suscripciones: <Money cents={ctx.recurringTotals.subscriptionsMonthlyCents} />/mes
          </p>
        </div>
        <p className="mt-1 text-[13px] text-muted">Detectados automáticamente por comercio, frecuencia y monto. Sugerimos revisar algunos: nunca asumimos que haya que cancelarlos.</p>
        <Card className="mt-4 overflow-x-auto">
          {recurring.length ? (
            <table className="w-full min-w-[720px] text-[13px]">
              <caption className="sr-only">Pagos recurrentes detectados</caption>
              <thead className="border-b border-border text-left text-[12px] text-muted">
                <tr>
                  <th className="py-2.5 pl-5 font-medium">Pago</th>
                  <th className="py-2.5 font-medium">Frecuencia</th>
                  <th className="py-2.5 text-right font-medium">Importe</th>
                  <th className="py-2.5 text-right font-medium">Mensual</th>
                  <th className="py-2.5 text-right font-medium">Anual</th>
                  <th className="py-2.5 pr-5 text-right font-medium">Próximo pago</th>
                </tr>
              </thead>
              <tbody>
                {recurring.map((r) => (
                  <tr key={r.key} className="border-b border-border/60 last:border-0">
                    <td className="py-3 pl-5">
                      <p className="font-medium">{r.label}</p>
                      <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[12px] text-muted">
                        {KIND[r.kind]}
                        {r.installment && <span>· cuota {r.installment.current}/{r.installment.total}, termina en {monthShort(r.installment.endsOn, true)}</span>}
                        {r.priceChangePct !== null && Math.abs(r.priceChangePct) >= 0.05 && r.kind !== 'utility' && (
                          <Badge tone={r.priceChangePct > 0 ? 'warning' : 'positive'}>{pct(r.priceChangePct, { sign: true })} último cobro</Badge>
                        )}
                        {r.reviewHint && <Badge tone="accent">Revisar</Badge>}
                      </p>
                      {r.reviewHint && <p className="mt-1 text-[12px] text-fg-2">{r.reviewHint}</p>}
                    </td>
                    <td className="py-3 text-fg-2">{FREQ[r.frequency]}</td>
                    <td className="py-3 text-right">
                      <Money cents={r.lastCents} tabular />
                    </td>
                    <td className="py-3 text-right font-medium">
                      <Money cents={r.monthlyCents} tabular />
                    </td>
                    <td className="py-3 text-right text-fg-2">
                      <Money cents={r.annualCents} tabular />
                    </td>
                    <td className="py-3 pr-5 text-right">
                      <p>{dateShort(r.nextDate)}</p>
                      <p className="text-[12px] text-muted">{relativeDays(today, r.nextDate)}</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <EmptyState compact icon={Repeat} title="Todavía no detectamos pagos recurrentes">
              Aparecen cuando un mismo pago se repite con frecuencia regular (al menos 3 veces, o 2 si lo marcás como recurrente).
            </EmptyState>
          )}
        </Card>
        {subsReview.length > 0 && <p className="mt-2 text-[12px] text-muted">{subsReview.length} para revisar. Si alguno lo usás, está perfecto: la sugerencia es solo para que lo decidas vos.</p>}
      </section>

      {/* anomalías */}
      <section id="anomalias" aria-labelledby="anom-title" className="mt-10 scroll-mt-20">
        <SectionLabel>Anomalías</SectionLabel>
        <h2 id="anom-title" className="mt-1 display text-[30px] sm:text-[34px]">
          {growth.length || unusual.length ? 'Gastos fuera de tu comportamiento habitual' : 'Sin anomalías este mes'}
        </h2>
        <p className="mt-1 text-[13px] text-muted">Cada categoría se compara con el promedio de los últimos 3 meses al mismo día del mes. Así el día 15 no se compara medio mes contra meses completos.</p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {growth.map((a) =>
            a.kind === 'category_growth' ? (
              <Card key={a.key}>
                <CardHeader title={`Tu gasto en ${a.name.toLowerCase()} aumentó un ${pct(a.changePct)}`} subtitle={`respecto del promedio de los últimos 3 meses`} action={<Badge tone="warning"><AlertTriangle /> +{money(a.extraCents)}</Badge>} />
                <CardBody>
                  <HistoryBars data={history(a.categoryId)} avg={a.baselineCents} height={150} />
                  <p className="mt-2 text-[13px] text-fg-2">
                    Llevás <Money cents={a.currentCents} className="font-medium" /> al día {dom}. Lo habitual a esta fecha: <Money cents={a.baselineCents} className="font-medium" />.
                  </p>
                </CardBody>
              </Card>
            ) : null,
          )}
        </div>
        {unusual.length > 0 && (
          <Card className="mt-3">
            <CardHeader title="Movimientos inusualmente altos" subtitle="Últimos 30 días, muy por encima del gasto típico de su categoría" />
            <CardBody className="pb-3">
              <ul className="divide-y divide-border">
                {unusual.map((u) =>
                  u.kind === 'unusual_txn' ? (
                    <li key={u.key} className="flex items-center gap-3 py-2.5 text-[13px]">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium">{u.label}</p>
                        <p className="text-[12px] text-muted">
                          {u.categoryName} · {dateShort(u.date)} · {u.ratio.toFixed(0)}× lo típico (<Money cents={u.typicalCents} />){u.isNewMerchant ? ' · comercio nuevo' : ''}
                        </p>
                      </div>
                      <Money cents={u.amountCents} className="font-semibold" tabular />
                    </li>
                  ) : null,
                )}
              </ul>
            </CardBody>
          </Card>
        )}
        {!growth.length && !unusual.length && (
          <Card>
            <EmptyState compact icon={AlertTriangle} title="Nada fuera de lo normal">
              Te avisamos si una categoría crece más de 25% contra tu promedio o si aparece un gasto muy por encima de lo habitual.
            </EmptyState>
          </Card>
        )}
      </section>
      <p className="mt-8 text-center text-[12px] text-muted">Umbral de microgasto: {money(user.microThresholdCents)} · ventana de análisis: 90 días</p>
    </>
  )
}

function MiniStat({ label, value, estimated }: { label: string; value: React.ReactNode; estimated?: boolean }) {
  return (
    <Card className="p-5">
      <p className="label-caps flex items-center gap-1.5">
        {label}
        {estimated && <span className="rounded-full border border-dashed border-border-strong px-1.5 text-[10px] text-muted">estimado</span>}
      </p>
      <p className="mt-3 font-mono text-[24px] leading-none font-medium tracking-[-0.045em]">{value}</p>
    </Card>
  )
}
