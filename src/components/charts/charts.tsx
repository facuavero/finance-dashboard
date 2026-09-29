'use client'

import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, ComposedChart, Line, Pie, PieChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { money } from '@/lib/format'
import { cn } from '@/lib/utils'

// especificación común (skill dataviz): barras ≤24px con punta redondeada, líneas 2px,
// grilla hairline sólida, un solo eje y, tooltip con todas las series. estimado = punteado.

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
              <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.12} />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
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
                    { label: 'real', value: (payload[0].payload as { real: number | null }).real, color: 'var(--accent)' },
                    { label: 'estimado', value: (payload[0].payload as { est?: number | null; real: number | null }).real === null ? ((payload[0].payload as { est?: number | null }).est ?? null) : null, color: 'var(--accent)', dashed: true },
                  ]}
                />
              ) : null
            }
          />
          {rows.some((r) => r.band) && <Area dataKey="band" stroke="none" fill="var(--accent)" fillOpacity={0.08} isAnimationActive={false} />}
          <Area type="monotone" dataKey="real" stroke="var(--accent)" strokeWidth={2} fill="url(#capFill)" connectNulls={false} dot={false} activeDot={{ r: 4, stroke: 'var(--surface)', strokeWidth: 2 }} />
          {hasEst && <Line type="monotone" dataKey="est" stroke="var(--accent)" strokeWidth={2} strokeDasharray="5 4" strokeOpacity={0.7} dot={false} activeDot={{ r: 4, stroke: 'var(--surface)', strokeWidth: 2 }} connectNulls />}
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
          { label: 'Ingresos', color: 'var(--series-1)', kind: 'box' },
          { label: 'Gastos', color: 'var(--series-2)', kind: 'box' },
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
                      { label: 'ingresos', value: payload[0].payload.income, color: 'var(--series-1)' },
                      { label: 'gastos', value: payload[0].payload.expense, color: 'var(--series-2)' },
                      { label: 'neto', value: payload[0].payload.income - payload[0].payload.expense, color: 'var(--muted)' },
                    ]}
                  />
                ) : null
              }
            />
            <Bar dataKey="income" fill="var(--series-1)" radius={[4, 4, 0, 0]} maxBarSize={24} />
            <Bar dataKey="expense" fill="var(--series-2)" radius={[4, 4, 0, 0]} maxBarSize={24} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

/** una serie de barras (ahorro mensual, microgastos, etc). negativos van para abajo desde la misma línea base */
export function SingleBars({ data, height = 200, name, color = 'var(--accent)', refLine, refLabel, highlightLast }: { data: { label: string; value: number }[]; height?: number; name: string; color?: string; refLine?: number; refLabel?: string; highlightLast?: boolean }) {
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

/** parte del todo: ≤6 porciones + otros. siempre acompañado de una lista con montos visibles */
export function Donut({ data, total, size = 168, centerLabel }: { data: { name: string; value: number; color: string }[]; total: number; size?: number; centerLabel: string }) {
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }} role="img" aria-label={`${centerLabel}: ${money(total)}`}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius="70%" outerRadius="100%" paddingAngle={data.length > 1 ? 1.5 : 0} stroke="var(--surface)" strokeWidth={2} isAnimationActive={false}>
            {data.map((d) => (
              <Cell key={d.name} fill={d.color} />
            ))}
          </Pie>
          <Tooltip content={({ active, payload }) => (active && payload?.length ? <TooltipBox title={String(payload[0].name)} rows={[{ label: '', value: Number(payload[0].value), color: String(payload[0].payload.color) }]} /> : null)} />
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="money text-[17px] font-semibold">{money(total, { compact: total >= 10_000_000_00 })}</span>
        <span className="text-[11px] text-muted">{centerLabel}</span>
      </div>
    </div>
  )
}

/** historial mensual de una categoría con su promedio (anomalías) */
export function HistoryBars({ data, avg, height = 160 }: { data: { label: string; value: number }[]; avg: number; height?: number }) {
  return <SingleBars data={data} height={height} name="Gasto" refLine={avg} refLabel="promedio" highlightLast />
}

/** simulador: aportes (gris) vs total con rendimiento (acento) y banda pesimista/optimista */
export function SimulatorChart({ data, height = 260 }: { data: { label: string; contributed: number; total: number; low: number; high: number }[]; height?: number }) {
  const rows = data.map((d) => ({ ...d, band: [d.low, d.high] }))
  return (
    <div>
      <Legend
        className="mb-2"
        items={[
          { label: 'Total estimado', color: 'var(--accent)', kind: 'dashed' },
          { label: 'Rango pesimista–optimista', color: 'var(--accent)', kind: 'box' },
          { label: 'Lo que aportás', color: 'var(--muted)', kind: 'line' },
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
                      { label: 'total estimado', value: payload[0].payload.total, color: 'var(--accent)', dashed: true },
                      { label: 'optimista', value: payload[0].payload.high, color: 'var(--accent)' },
                      { label: 'pesimista', value: payload[0].payload.low, color: 'var(--accent)' },
                      { label: 'aportado', value: payload[0].payload.contributed, color: 'var(--muted)' },
                    ]}
                  />
                ) : null
              }
            />
            <Area dataKey="band" stroke="none" fill="var(--accent)" fillOpacity={0.12} isAnimationActive={false} />
            <Line type="monotone" dataKey="contributed" stroke="var(--muted)" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="total" stroke="var(--accent)" strokeWidth={2} strokeDasharray="5 4" dot={false} activeDot={{ r: 4, stroke: 'var(--surface)', strokeWidth: 2 }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

/** evolución de categorías: líneas (máx. 4 series con leyenda + color fijo por categoría) */
export function CategoryLines({ data, series, height = 240 }: { data: Record<string, number | string>[]; series: { key: string; name: string; color: string }[]; height?: number }) {
  return (
    <div>
      <Legend className="mb-2" items={series.map((s) => ({ label: s.name, color: s.color }))} />
      <div style={{ height }} role="img" aria-label="Evolución de categorías">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid vertical={false} stroke="var(--grid)" />
            <XAxis dataKey="label" {...AXIS} />
            <YAxis {...AXIS} width={64} tickFormatter={compact} />
            <Tooltip
              cursor={{ stroke: 'var(--axis)' }}
              content={({ active, payload, label }) =>
                active && payload?.length ? <TooltipBox title={String(label)} rows={series.map((s) => ({ label: s.name, value: Number(payload[0].payload[s.key] ?? 0), color: s.color }))} /> : null
              }
            />
            {series.map((s) => (
              <Area key={s.key} type="monotone" dataKey={s.key} stroke={s.color} strokeWidth={2} fill={s.color} fillOpacity={0} dot={false} activeDot={{ r: 4, stroke: 'var(--surface)', strokeWidth: 2 }} />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
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
