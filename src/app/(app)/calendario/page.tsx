import type { Metadata } from 'next'
import Link from 'next/link'
import { CalendarDays, CircleMinus, CirclePlus, CircleHelp, Circle, Plug } from 'lucide-react'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EmptyState, EstimateTag, PageHeader } from '@/components/app/states'
import { Money } from '@/components/app/money'
import { UpcomingList } from '@/components/app/blocks/upcoming-list'
import { getAppData } from '@/modules/app/data'
import { upcoming } from '@/modules/insights/upcoming'
import type { CombinedFinding, Impact } from '@/modules/insights/combined'
import { addDays } from '@/modules/analytics/dates'
import { dateShort, money } from '@/lib/format'
import { cn } from '@/lib/utils'

export const metadata: Metadata = { title: 'Calendario' }

const IMPACT: Record<Impact, { label: string; icon: typeof Circle; tone: 'critical' | 'warning' | 'positive' | 'neutral'; cls: string }> = {
  negative: { label: 'Impacto negativo', icon: CircleMinus, tone: 'critical', cls: 'text-critical bg-critical-soft' },
  possible: { label: 'Posible impacto', icon: CircleHelp, tone: 'warning', cls: 'text-warning bg-warning-soft' },
  positive: { label: 'Impacto positivo', icon: CirclePlus, tone: 'positive', cls: 'text-positive bg-positive-soft' },
  none: { label: 'Sin impacto relevante', icon: Circle, tone: 'neutral', cls: 'text-muted bg-surface-2' },
}
const SOURCE: Record<string, string> = { gmail: 'Gmail', gcal: 'Calendar', movimientos: 'Movimientos', recurrentes: 'Recurrentes', presupuestos: 'Presupuestos', objetivos: 'Objetivos' }
const WEEKDAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D']

export default async function Calendario() {
  const { combined, ctx, today, integrations } = await getAppData()
  const items = upcoming(ctx.recurring, combined, today, 28)
  const groups = (['negative', 'possible', 'positive', 'none'] as Impact[]).map((i) => ({ impact: i, findings: combined.findings.filter((f) => f.impact === i) }))
  const connected = integrations.length > 0

  // tira de 4 semanas desde el lunes de esta semana con el gasto previsto por día
  const start = addDays(today, -((new Date(`${today}T00:00:00Z`).getUTCDay() + 6) % 7))
  const days = Array.from({ length: 28 }, (_, i) => addDays(start, i))
  const byDay = new Map<string, number>()
  for (const it of items) if (it.type === 'expense' && it.cents) byDay.set(it.date, (byDay.get(it.date) ?? 0) + it.cents)
  const maxDay = Math.max(1, ...byDay.values())

  return (
    <>
      <PageHeader title="Calendario" description="Qué puede pasar con tu plata en las próximas semanas: cruzamos tus movimientos, pagos recurrentes, Gmail y Calendar." />

      {!connected && (
        <Card className="mb-5 flex flex-col gap-3 p-5 sm:flex-row sm:items-center">
          <Plug className="size-5 shrink-0 text-muted" aria-hidden />
          <p className="flex-1 text-[13px] text-fg-2">Por ahora solo usamos tus pagos recurrentes. Conectá Gmail y Calendar para detectar viajes, reservas, facturas y eventos con gasto.</p>
          <Button asChild variant="secondary" size="sm">
            <Link href="/integraciones">Conectar</Link>
          </Button>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <Card className="p-5">
          <p className="flex items-center gap-2 text-[13px] text-fg-2">
            Resumen de las próximas 2 semanas <EstimateTag />
          </p>
          <p className="money mt-2 text-[18px] leading-snug font-medium">{combined.summary}</p>
          <dl className="mt-4 grid grid-cols-2 gap-3 text-[13px] sm:grid-cols-4">
            <Stat label="Gastos potenciales" value={<Money cents={combined.potentialExpenseCents} />} />
            <Stat label="Ingresos esperados" value={<Money cents={combined.expectedIncomeCents} />} />
            <Stat label="Pagos recurrentes" value={String(combined.counts.recurringPayments)} />
            <Stat label="Viajes y eventos" value={String(combined.counts.trips + combined.counts.events)} />
          </dl>
        </Card>
        <Card className="p-5">
          <p className="text-[13px] text-fg-2">Gasto previsto por día · 4 semanas</p>
          <div className="mt-3 grid grid-cols-7 gap-1.5" role="grid" aria-label="Gasto previsto por día">
            {WEEKDAYS.map((w, i) => (
              <span key={i} className="text-center text-[11px] text-muted" role="columnheader">
                {w}
              </span>
            ))}
            {days.map((d) => {
              const v = byDay.get(d) ?? 0
              const past = d < today
              return (
                <div
                  key={d}
                  role="gridcell"
                  title={v ? `${dateShort(d)}: ${money(v)}` : dateShort(d)}
                  className={cn('flex aspect-square flex-col items-center justify-center rounded-md border text-[11px]', d === today ? 'border-fg' : 'border-transparent', past && 'opacity-40')}
                  style={{ background: v ? `color-mix(in oklab, var(--series-2) ${Math.round(15 + (v / maxDay) * 60)}%, var(--surface))` : 'var(--surface-2)' }}
                >
                  <span className={cn(v / maxDay > 0.5 && 'font-semibold')}>{Number(d.slice(8))}</span>
                </div>
              )
            })}
          </div>
          <p className="mt-2 text-[11px] text-muted">Más oscuro = más gasto previsto. El número exacto está en la lista.</p>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <div className="space-y-4">
          {combined.findings.length === 0 ? (
            <Card>
              <EmptyState icon={CalendarDays} title="Sin hallazgos todavía">
                Cuando conectes Gmail o Calendar, acá vas a ver reservas sin registrar, renovaciones, viajes y eventos con gasto probable.
              </EmptyState>
            </Card>
          ) : (
            groups
              .filter((g) => g.findings.length)
              .map((g) => (
                <Card key={g.impact}>
                  <CardHeader title={IMPACT[g.impact].label} subtitle={`${g.findings.length} ${g.findings.length === 1 ? 'hallazgo' : 'hallazgos'}`} />
                  <CardBody className="pb-2">
                    <ul className="divide-y divide-border">
                      {(g.impact === 'none' ? g.findings.slice(0, 4) : g.findings).map((f) => (
                        <Finding key={f.key} f={f} />
                      ))}
                    </ul>
                  </CardBody>
                </Card>
              ))
          )}
        </div>
        <Card className="self-start">
          <CardHeader title="Próximos 28 días" subtitle="Pagos recurrentes y gastos detectados" />
          <CardBody>
            <UpcomingList items={items} today={today} limit={20} />
          </CardBody>
        </Card>
      </div>
    </>
  )
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-[12px] text-muted">{label}</dt>
      <dd className="mt-0.5 text-[16px] font-semibold">{value}</dd>
    </div>
  )
}

function Finding({ f }: { f: CombinedFinding }) {
  const I = IMPACT[f.impact]
  return (
    <li className="flex gap-3 py-3">
      <span className={cn('flex size-8 shrink-0 items-center justify-center rounded-lg', I.cls)}>
        <I.icon className="size-4" aria-hidden />
        <span className="sr-only">{I.label}</span>
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[14px] font-medium">{f.title}</p>
        <p className="money mt-0.5 text-[13px] text-fg-2">{f.detail}</p>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          {f.sources.map((s) => (
            <Badge key={s} tone="outline">
              {SOURCE[s]}
            </Badge>
          ))}
          {f.date && <span className="text-[12px] text-muted">{dateShort(f.date)}</span>}
          {f.action && (
            <Link href={f.action.href} className="ml-auto text-[13px] font-medium text-accent hover:underline">
              {f.action.label}
            </Link>
          )}
        </div>
      </div>
      {f.amountCents ? (
        <div className="flex flex-col items-end gap-0.5">
          <Money cents={f.impact === 'positive' ? f.amountCents : -f.amountCents} sign={f.impact === 'positive'} className={cn('text-[14px] font-semibold', f.impact === 'positive' && 'text-positive')} />
          {f.estimated && <EstimateTag />}
        </div>
      ) : null}
    </li>
  )
}
