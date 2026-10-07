'use client'

import { useState } from 'react'
import { Coffee, Bike, Car, ShoppingBag, CircleDashed, type LucideIcon } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Money } from '@/components/app/money'
import type { MicroPattern } from '@/modules/analytics/micro'
import { pct } from '@/lib/format'

const ICON: Record<string, LucideIcon> = { delivery: Bike, coffee: Coffee, rides: Car, shopping: ShoppingBag }

/** cada patrón con su costo real y cuánto liberás reduciéndolo (el % lo elegís vos) */
export function MicroPatterns({ patterns, incomeCents }: { patterns: MicroPattern[]; incomeCents: number }) {
  const [cut, setCut] = useState(30)
  const total = patterns.reduce((a, p) => a + p.monthlyCents, 0)
  const saved = Math.round((total * cut) / 100)
  return (
    <div className="mt-4">
      <Card className="mb-3 flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
        <label htmlFor="cut" className="text-[13px] font-medium whitespace-nowrap">
          Si reducís un <span className="num">{cut}%</span>
        </label>
        <input id="cut" type="range" min={10} max={80} step={5} value={cut} onChange={(e) => setCut(Number(e.target.value))} className="flex-1 accent-[var(--accent)]" aria-valuetext={`${cut}%`} />
        <p className="text-[13px] text-fg-2" aria-live="polite">
          liberás <Money cents={saved} className="font-semibold text-positive" /> por mes · <Money cents={saved * 12} className="font-semibold text-positive" /> al año
          {incomeCents > 0 && <span className="text-muted"> ({pct(saved / incomeCents, { decimals: 1 })} de tu ingreso)</span>}
        </p>
      </Card>
      <div className="grid gap-3 md:grid-cols-2">
        {patterns.map((p) => {
          const Icon = ICON[p.group ?? ''] ?? CircleDashed
          const s = Math.round((p.monthlyCents * cut) / 100)
          return (
            <Card key={p.key} className="p-5">
              <div className="flex items-center gap-3">
                <span className="flex size-9 items-center justify-center rounded-2xl bg-surface-2 text-fg-2">
                  <Icon className="size-4" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-medium">{p.label}</p>
                  <p className="truncate text-[12px] text-muted">{p.merchants.join(', ')}</p>
                </div>
                <p className="text-right">
                  <Money cents={p.monthlyCents} className="text-[17px] font-semibold" />
                  <span className="block text-[11px] text-muted">por mes</span>
                </p>
              </div>
              <dl className="mt-4 grid grid-cols-3 gap-2 text-[12px]">
                <div>
                  <dt className="text-muted">Frecuencia</dt>
                  <dd className="mt-0.5 font-medium">{p.perWeek.toFixed(1).replace('.', ',')} por semana</dd>
                </div>
                <div>
                  <dt className="text-muted">Ticket promedio</dt>
                  <dd className="mt-0.5 font-medium">
                    <Money cents={p.avgTicketCents} />
                  </dd>
                </div>
                <div>
                  <dt className="text-muted">Anual estimado</dt>
                  <dd className="mt-0.5 font-medium">
                    <Money cents={p.annualCents} />
                  </dd>
                </div>
                <div>
                  <dt className="text-muted">Del ingreso</dt>
                  <dd className="mt-0.5 font-medium">{pct(p.pctOfIncome, { decimals: 1 })}</dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-muted">Reduciéndolo {cut}%</dt>
                  <dd className="mt-0.5 font-medium text-positive">
                    +<Money cents={s} />/mes · +<Money cents={s * 12} />/año
                  </dd>
                </div>
              </dl>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
