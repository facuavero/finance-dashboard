'use client'

import { useMemo, useState } from 'react'
import { ShieldAlert } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { SimulatorChart } from '@/components/charts/charts'
import { Money } from '@/components/app/money'
import { simulate } from '@/modules/analytics/simulator'
import { cn } from '@/lib/utils'

type V = { initial: number; saving: number; invest: number; rate: number; reduction: number }

const FIELDS: { key: keyof V; label: string; hint: string; max: number; step: number; unit: '$' | '%' }[] = [
  { key: 'initial', label: 'Capital inicial a invertir', hint: 'Sugerido: lo que tenés por encima de 3 meses de gastos', max: 50_000_000, step: 50_000, unit: '$' },
  { key: 'saving', label: 'Ahorro mensual', hint: 'Queda guardado, sin rendimiento', max: 3_000_000, step: 10_000, unit: '$' },
  { key: 'invest', label: 'Inversión mensual', hint: 'Rinde a la tasa estimada', max: 3_000_000, step: 10_000, unit: '$' },
  { key: 'rate', label: 'Rendimiento anual estimado', hint: 'Real, descontada la inflación', max: 20, step: 0.5, unit: '%' },
  { key: 'reduction', label: 'Reducción de gastos', hint: 'Lo que dejás de gastar y ahorrás', max: 1_000_000, step: 5_000, unit: '$' },
]

export function Simulator({ defaults }: { defaults: V }) {
  const [v, setV] = useState<V>(defaults)
  const result = useMemo(
    () => simulate({ initialCents: v.initial * 100, monthlySavingCents: v.saving * 100, monthlyInvestCents: v.invest * 100, annualRatePct: v.rate, expenseReductionCents: v.reduction * 100 }),
    [v],
  )
  const data = result.series.map((p) => ({
    label: p.month === 0 ? 'hoy' : `${p.month / 12} ${p.month === 12 ? 'año' : 'años'}`,
    contributed: p.contributedCents,
    total: p.totalCents,
    low: result.low[p.month].totalCents,
    high: result.high[p.month].totalCents,
  }))

  return (
    <div className="mt-4 grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
      <Card className="space-y-5 p-5">
        {FIELDS.map((f) => (
          <div key={f.key}>
            <div className="flex items-baseline justify-between gap-2">
              <label htmlFor={`sim-${f.key}`} className="text-[13px] font-medium">
                {f.label}
              </label>
              <div className="flex items-center gap-1 text-[13px]">
                {f.unit === '$' && <span className="text-muted">$</span>}
                <input
                  aria-label={`${f.label} (valor)`}
                  inputMode="decimal"
                  value={f.unit === '%' ? v[f.key] : v[f.key].toLocaleString('es-AR')}
                  onChange={(e) => {
                    const n = Number(e.target.value.replace(/\./g, '').replace(',', '.'))
                    if (Number.isFinite(n)) setV((p) => ({ ...p, [f.key]: Math.max(0, Math.min(f.max * 10, n)) }))
                  }}
                  className="num w-28 rounded-md border border-border bg-surface px-2 py-1 text-right font-medium"
                />
                {f.unit === '%' && <span className="text-muted">%</span>}
              </div>
            </div>
            <input id={`sim-${f.key}`} type="range" min={0} max={f.max} step={f.step} value={Math.min(f.max, v[f.key])} onChange={(e) => setV((p) => ({ ...p, [f.key]: Number(e.target.value) }))} className="mt-2 w-full accent-[var(--accent)]" />
            <p className="text-[12px] text-muted">{f.hint}</p>
          </div>
        ))}
      </Card>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          {result.milestones.map((m) => (
            <Card key={m.years} className="p-4">
              <p className="text-[13px] text-fg-2">
                En {m.years} {m.years === 1 ? 'año' : 'años'}
              </p>
              <p className="mt-1 text-[20px] font-semibold tracking-[-0.02em]">
                <Money cents={m.totalCents} compact={m.totalCents >= 100_000_000_00} />
              </p>
              <p className="mt-1 text-[12px] text-muted">
                aportás <Money cents={m.contributedCents} compact />
              </p>
              <p className={cn('text-[12px]', m.returnCents > 0 ? 'text-positive' : 'text-muted')}>
                rendimiento <Money cents={m.returnCents} compact sign />
              </p>
              <p className="mt-1 text-[11px] text-muted">
                rango <Money cents={m.lowCents} compact /> – <Money cents={m.highCents} compact />
              </p>
            </Card>
          ))}
        </div>
        <Card className="p-5">
          <SimulatorChart data={data} />
        </Card>
        <p className="flex gap-2 rounded-lg border border-border bg-surface-2 px-4 py-3 text-[13px] text-fg-2" role="note">
          <ShieldAlert className="mt-0.5 size-4 shrink-0 text-muted" aria-hidden />
          <span>
            <span className="font-medium text-fg">Esto es una proyección, no una garantía.</span> Supone aportes constantes y un rendimiento fijo, cosas que en la realidad varían. El rango pesimista–optimista usa ±3 puntos de rendimiento. No es asesoramiento financiero.
          </span>
        </p>
      </div>
    </div>
  )
}
