'use client'

import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, ComposedChart, Line, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { money } from '@/lib/format'
import { cn } from '@/lib/utils'

// especificación común (skill dataviz): barras ≤24px con punta redondeada, líneas 2px,
// grilla hairline sólida, un solo eje y, tooltip con todas las series. estimado = punteado.
// color: escala de grises. serie principal en tinta (--chart-1), secundaria en gris (--chart-2).
// el rojo solo aparece en valores negativos.

const AXIS = { stroke: 'var(--axis)', tick: { fill: 'var(--muted)', fontSize: 11 }, tickLine: false, axisLine: false } as const
const compact = (v: number) => money(v, { compact: true })

type TipRow = { label: string; value: number | null; color: string; dashed?: boolean }

function TooltipBox({ title, rows }: { title: string; rows: TipRow[] }) {
  return (
    <div className="min-w-40 rounded-lg border border-border bg-surface px-3 py-2 text-[12px] shadow-lg">
      <p className="mb-1 text-muted">{title}</p>
      {rows
        .filter((r) => r.value !== null && r.value !== undefined)
        .map((r) => (
          <div key={r.label} className="flex items-center gap-2 py-0.5">
            <svg width="12" height="4" aria-hidden>
              <line x1="0" y1="2" x2="12" y2="2" stroke={r.color} strokeWidth="2" strokeDasharray={r.dashed ? '3 2' : undefined} />
            </svg>
            <span className="money num font-semibold text-fg">{money(r.value!)}</span>
            <span className="text-muted">{r.label}</span>
          </div>
        ))}
    </div>
  )
}

export function Legend({ items, className }: { items: { label: string; color: string; kind?: 'line' | 'dashed' | 'box' }[]; className?: string }) {
  return (
    <ul className={cn('flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-fg-2', className)}>
      {items.map((i) => (
        <li key={i.label} className="flex items-center gap-1.5">
          {i.kind === 'box' ? (
            <span className="size-2.5 rounded-[3px]" style={{ background: i.color }} aria-hidden />
          ) : (
            <svg width="14" height="4" aria-hidden>
              <line x1="0" y1="2" x2="14" y2="2" stroke={i.color} strokeWidth="2" strokeDasharray={i.kind === 'dashed' ? '3 2' : undefined} />
            </svg>
          )}
          {i.label}
        </li>
      ))}
    </ul>
  )
}

/** evolución del capital: real sólido, estimado punteado (con banda opcional) */
const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
const fmtLabel = (mode: 'day' | 'month' | 'raw') => (l: string) =>
  mode === 'raw' ? l : mode === 'month' ? `${MONTHS[Number(l.slice(5, 7)) - 1]} ${l.slice(2, 4)}` : `${Number(l.slice(8, 10))} ${MONTHS[Number(l.slice(5, 7)) - 1]}`

export function CapitalChart({ data, height = 220, labels = 'raw' }: { data: { label: string; real: number | null; est?: number | null; low?: number | null; high?: number | null }[]; height?: number; labels?: 'day' | 'month' | 'raw' }) {
  const labelFormat = fmtLabel(labels)
  const hasEst = data.some((d) => d.est !== null && d.est !== undefined)
  const rows = data.map((d) => ({ ...d, band: d.low !== null && d.low !== undefined && d.high !== null && d.high !== undefined ? [d.low, d.high] : null }))
  return (
    <div style={{ height }} role="img" aria-label="Evolución del capital">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={rows} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="capFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.1} />
              <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="var(--grid)" />
          <XAxis dataKey="label" {...AXIS} tickFormatter={labelFormat} minTickGap={16} />
          <YAxis {...AXIS} width={64} tickFormatter={compact} domain={['auto', 'auto']} />
          <Tooltip
            cursor={{ stroke: 'var(--axis)' }}
            content={({ active, payload, label }) =>
              active && payload?.length ? (
                <TooltipBox
                  title={labelFormat(String(label))}
                  rows={[
                    { label: 'real', value: (payload[0].payload as { real: number | null }).real, color: 'var(--chart-1)' },
                    { label: 'estimado', value: (payload[0].payload as { est?: number | null; real: number | null }).real === null ? ((payload[0].payload as { est?: number | null }).est ?? null) : null, color: 'var(--chart-1)', dashed: true },
                  ]}
                />
              ) : null
            }
          />
          {rows.some((r) => r.band) && <Area dataKey="band" stroke="none" fill="var(--chart-1)" fillOpacity={0.08} isAnimationActive={false} />}
          <Area type="monotone" dataKey="real" stroke="var(--chart-1)" strokeWidth={2} fill="url(#capFill)" connectNulls={false} dot={false} activeDot={{ r: 4, stroke: 'var(--surface)', strokeWidth: 2 }} />
          {hasEst && <Line type="monotone" dataKey="est" stroke="var(--chart-1)" strokeWidth={2} strokeDasharray="5 4" strokeOpacity={0.7} dot={false} activeDot={{ r: 4, stroke: 'var(--surface)', strokeWidth: 2 }} connectNulls />}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}

/** ingresos vs gastos por período (2 series, leyenda arriba) */
export function FlowBars({ data, height = 240 }: { data: { label: string; income: number; expense: number }[]; height?: number }) {
  return (
    <div>
      <Legend
        className="mb-2"
        items={[
          { label: 'Ingresos', color: 'var(--chart-1)', kind: 'box' },
          { label: 'Gastos', color: 'var(--chart-2)', kind: 'box' },
        ]}
      />
      <div style={{ height }} role="img" aria-label="Ingresos contra gastos">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }} barGap={2} barCategoryGap="28%">
            <CartesianGrid vertical={false} stroke="var(--grid)" />
            <XAxis dataKey="label" {...AXIS} minTickGap={8} />
            <YAxis {...AXIS} width={64} tickFormatter={compact} />
            <Tooltip
              cursor={{ fill: 'var(--surface-2)' }}
              content={({ active, payload, label }) =>
                active && payload?.length ? (
                  <TooltipBox
                    title={String(label)}
                    rows={[
                      { label: 'ingresos', value: payload[0].payload.income, color: 'var(--chart-1)' },
                      { label: 'gastos', value: payload[0].payload.expense, color: 'var(--chart-2)' },
                      { label: 'neto', value: payload[0].payload.income - payload[0].payload.expense, color: 'var(--muted)' },
                    ]}
                  />
                ) : null
              }
            />
            <Bar dataKey="income" fill="var(--chart-1)" radius={[4, 4, 0, 0]} maxBarSize={24} />
            <Bar dataKey="expense" fill="var(--chart-2)" radius={[4, 4, 0, 0]} maxBarSize={24} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

/** una serie de barras (ahorro mensual, microgastos, etc). negativos van para abajo desde la misma línea base */
export function SingleBars({ data, height = 200, name, color = 'var(--chart-1)', refLine, refLabel, highlightLast }: { data: { label: string; value: number }[]; height?: number; name: string; color?: string; refLine?: number; refLabel?: string; highlightLast?: boolean }) {
  return (
    <div style={{ height }} role="img" aria-label={name}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 12, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid vertical={false} stroke="var(--grid)" />
          <XAxis dataKey="label" {...AXIS} minTickGap={6} />
          <YAxis {...AXIS} width={64} tickFormatter={compact} />
          <ReferenceLine y={0} stroke="var(--axis)" />
          {refLine !== undefined && <ReferenceLine y={refLine} stroke="var(--text-2)" strokeDasharray="4 3" label={{ value: refLabel, position: 'insideBottomLeft', fill: 'var(--muted)', fontSize: 11, dy: -2 }} />}
          <Tooltip cursor={{ fill: 'var(--surface-2)' }} content={({ active, payload, label }) => (active && payload?.length ? <TooltipBox title={String(label)} rows={[{ label: name.toLowerCase(), value: payload[0].payload.value, color }]} /> : null)} />
          <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={24}>
            {data.map((d, i) => (
              <Cell key={d.label + i} fill={d.value < 0 ? 'var(--critical)' : color} fillOpacity={highlightLast && i !== data.length - 1 ? 0.45 : 1} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

/** historial mensual de una categoría con su promedio (anomalías) */
export function HistoryBars({ data, avg, height = 160 }: { data: { label: string; value: number }[]; avg: number; height?: number }) {
  return <SingleBars data={data} height={height} name="Gasto" refLine={avg} refLabel="promedio" highlightLast />
}

/** simulador: aportes (gris) vs total con rendimiento (tinta, punteado) y banda pesimista/optimista */
export function SimulatorChart({ data, height = 260 }: { data: { label: string; contributed: number; total: number; low: number; high: number }[]; height?: number }) {
  const rows = data.map((d) => ({ ...d, band: [d.low, d.high] }))
  return (
    <div>
      <Legend
        className="mb-2"
        items={[
          { label: 'Total estimado', color: 'var(--chart-1)', kind: 'dashed' },
          { label: 'Rango pesimista–optimista', color: 'color-mix(in oklab, var(--chart-1) 18%, transparent)', kind: 'box' },
          { label: 'Lo que aportás', color: 'var(--chart-2)', kind: 'line' },
        ]}
      />
      <div style={{ height }} role="img" aria-label="Proyección del simulador">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={rows} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid vertical={false} stroke="var(--grid)" />
            <XAxis dataKey="label" {...AXIS} minTickGap={20} />
            <YAxis {...AXIS} width={64} tickFormatter={compact} />
            <Tooltip
              cursor={{ stroke: 'var(--axis)' }}
              content={({ active, payload, label }) =>
                active && payload?.length ? (
                  <TooltipBox
                    title={String(label)}
                    rows={[
                      { label: 'total estimado', value: payload[0].payload.total, color: 'var(--chart-1)', dashed: true },
                      { label: 'optimista', value: payload[0].payload.high, color: 'var(--chart-1)' },
                      { label: 'pesimista', value: payload[0].payload.low, color: 'var(--chart-1)' },
                      { label: 'aportado', value: payload[0].payload.contributed, color: 'var(--chart-2)' },
                    ]}
                  />
                ) : null
              }
            />
            <Area dataKey="band" stroke="none" fill="var(--chart-1)" fillOpacity={0.12} isAnimationActive={false} />
            <Line type="monotone" dataKey="contributed" stroke="var(--chart-2)" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="total" stroke="var(--chart-1)" strokeWidth={2} strokeDasharray="5 4" dot={false} activeDot={{ r: 4, stroke: 'var(--surface)', strokeWidth: 2 }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

/**
 * evolución de categorías como small multiples: una mini serie por categoría, todas con la misma escala.
 * sin colores por categoría: el nombre identifica, la forma compara
 */
export function CategoryMultiples({ data, series, height = 72 }: { data: Record<string, number | string>[]; series: { key: string; name: string }[]; height?: number }) {
  const max = Math.max(1, ...data.flatMap((d) => series.map((s) => Number(d[s.key] ?? 0))))
  const first = String(data[0]?.label ?? '')
  const last = String(data[data.length - 1]?.label ?? '')
  return (
    <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
      {series.map((s) => (
        <div key={s.key} className="min-w-0">
          <div className="flex items-baseline justify-between gap-2 text-[12px]">
            <span className="truncate text-fg-2">{s.name}</span>
            <span className="shrink-0 text-muted">
              prom. <span className="money num font-medium text-fg">{money(data.reduce((a, d) => a + Number(d[s.key] ?? 0), 0) / Math.max(1, data.length), { compact: true })}</span>
            </span>
          </div>
          <div className="mt-1.5" style={{ height }} role="img" aria-label={`Evolución de ${s.name}`}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 4 }}>
                <XAxis dataKey="label" hide />
                <YAxis hide domain={[0, max]} />
                <ReferenceLine y={0} stroke="var(--grid)" />
                <Tooltip
                  cursor={{ stroke: 'var(--axis)' }}
                  content={({ active, payload, label }) => (active && payload?.length ? <TooltipBox title={String(label)} rows={[{ label: s.name.toLowerCase(), value: Number(payload[0].payload[s.key] ?? 0), color: 'var(--chart-1)' }]} /> : null)}
                />
                <Area type="monotone" dataKey={s.key} stroke="var(--chart-1)" strokeWidth={2} fill="var(--chart-1)" fillOpacity={0.06} dot={false} activeDot={{ r: 3.5, stroke: 'var(--surface)', strokeWidth: 2 }} isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-1 flex justify-between text-[11px] text-muted">
            <span>{first}</span>
            <span>{last}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

/** dos series apiladas (fijos vs variables). 2px de separación entre segmentos */
export function StackedBars({ data, series, height = 220 }: { data: { label: string; a: number; b: number }[]; series: [{ key: 'a'; name: string; color: string }, { key: 'b'; name: string; color: string }]; height?: number }) {
  return (
    <div>
      <Legend className="mb-2" items={series.map((s) => ({ label: s.name, color: s.color, kind: 'box' as const }))} />
      <div style={{ height }} role="img" aria-label={series.map((s) => s.name).join(' y ')}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid vertical={false} stroke="var(--grid)" />
            <XAxis dataKey="label" {...AXIS} minTickGap={6} />
            <YAxis {...AXIS} width={64} tickFormatter={compact} />
            <Tooltip
              cursor={{ fill: 'var(--surface-2)' }}
              content={({ active, payload, label }) =>
                active && payload?.length ? (
                  <TooltipBox
                    title={String(label)}
                    rows={[
                      ...series.map((s) => ({ label: s.name.toLowerCase(), value: Number(payload[0].payload[s.key]), color: s.color })),
                      { label: 'total', value: Number(payload[0].payload.a) + Number(payload[0].payload.b), color: 'var(--muted)' },
                    ]}
                  />
                ) : null
              }
            />
            <Bar dataKey="a" stackId="s" fill={series[0].color} maxBarSize={24} stroke="var(--surface)" strokeWidth={1} />
            <Bar dataKey="b" stackId="s" fill={series[1].color} radius={[4, 4, 0, 0]} maxBarSize={24} stroke="var(--surface)" strokeWidth={1} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
