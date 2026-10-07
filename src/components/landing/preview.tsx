import { ArrowDownRight, ArrowUpRight, Minus, Search, Sparkles } from 'lucide-react'
import { Logo } from '@/components/app/logo'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

// vista estática del inicio con los números de la cuenta demo. sin .money: el modo privacidad no aplica a datos de ejemplo

type Point = { label: string; v: number }

/** línea real sólida + tramo estimado punteado, como CapitalChart pero sin js */
export function TrendMock({ points, estimateFrom, min, max, className }: { points: Point[]; estimateFrom: number; min: number; max: number; className?: string }) {
  const W = 100
  const H = 40
  const xy = points.map((p, i) => [(i / (points.length - 1)) * W, H - ((p.v - min) / (max - min)) * H] as const)
  const path = (pts: typeof xy) => pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(2)},${y.toFixed(2)}`).join(' ')
  const real = xy.slice(0, estimateFrom + 1)
  const est = xy.slice(estimateFrom)
  const stroke = { fill: 'none', stroke: 'var(--chart-1)', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', vectorEffect: 'non-scaling-stroke' } as const
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className={cn('block w-full overflow-visible', className)} aria-hidden>
      {[0, 0.5, 1].map((f) => (
        <line key={f} x1="0" x2={W} y1={H * f} y2={H * f} stroke="var(--grid)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
      ))}
      <path d={`${path(real)} L${real[real.length - 1][0]},${H} L0,${H} Z`} fill="var(--chart-1)" fillOpacity="0.08" />
      <path d={path(real)} {...stroke} />
      <path d={path(est)} {...stroke} strokeDasharray="5 4" strokeOpacity="0.7" />
    </svg>
  )
}

export function TrendLegend({ className }: { className?: string }) {
  return (
    <span className={cn('flex items-center gap-3 text-[12px] text-fg-2', className)}>
      <span className="inline-flex items-center gap-1.5">
        <svg width="14" height="4" aria-hidden>
          <line x1="0" y1="2" x2="14" y2="2" stroke="var(--chart-1)" strokeWidth="2" />
        </svg>
        Real
      </span>
      <span className="inline-flex items-center gap-1.5">
        <svg width="14" height="4" aria-hidden>
          <line x1="0" y1="2" x2="14" y2="2" stroke="var(--chart-1)" strokeWidth="2" strokeDasharray="3 2" />
        </svg>
        Estimado
      </span>
    </span>
  )
}

const CAPITAL: Point[] = [
  { label: '30 abr', v: 1.52 },
  { label: '31 may', v: 1.72 },
  { label: '30 jun', v: 1.97 },
  { label: '31 jul', v: 2.17 },
  { label: '31 ago', v: 2.45 },
  { label: '30 sep', v: 2.44 },
  { label: '7 oct', v: 3.72 },
  { label: '31 oct', v: 2.62 },
]

const MOBILE_LABELS = [0, 2, 4, 7]

const TABS = ['Inicio', 'Movimientos', 'Presupuestos', 'Objetivos', 'Análisis', 'Agenda']

const KPIS = [
  { label: 'Ingresos', value: '$1.970.000', delta: 'igual', trend: 'flat' },
  { label: 'Gastos', value: '$812.299', delta: '17%', trend: 'down' },
  { label: 'Ahorro neto', value: '$1.157.701', delta: '$161.200', trend: 'up' },
  { label: 'Tasa de ahorro', value: '59%', delta: '8 pts', trend: 'up' },
] as const

const FEED = [
  { title: 'Tenés una reserva en Booking.com en 8 días y todavía no registraste ese gasto.', body: 'Gmail indica $312.000.' },
  { title: 'Netflix.com se renueva mañana', body: 'Subió 15%. Revisá si el plan te sigue sirviendo.' },
]

/** el inicio de la app tal como lo muestra la cuenta demo, con el shell v3 (midday + mercury: el producto es la prueba) */
export function ProductPreview() {
  return (
    <div className="glow-ring rounded-[28px] bg-surface-2 p-1.5 sm:p-2">
      <div className="overflow-hidden rounded-[22px] border border-border bg-bg">
        {/* barra superior con tabs pill */}
        <div className="flex h-12 items-center gap-3 border-b border-border px-3 sm:px-4">
          <Logo className="[&_svg]:size-5 [&>span:last-child]:text-[18px]" />
          <span className="ml-3 hidden items-center gap-0.5 rounded-full border border-border bg-surface/60 p-0.5 lg:flex">
            {TABS.map((t, i) => (
              <span key={t} className={cn('flex items-center gap-1 rounded-full px-2.5 py-1 text-[11.5px]', i === 0 ? 'bg-surface-3 font-medium text-fg' : 'text-muted')}>
                {i === 0 && <span className="size-1 rounded-full bg-accent-solid" />}
                {t}
              </span>
            ))}
          </span>
          <span className="ml-auto flex items-center gap-2">
            <Search className="size-3.5 text-muted" aria-hidden />
            <span className="rounded-full bg-accent-solid px-2.5 py-1 text-[11px] font-medium text-on-accent">+ Nuevo</span>
          </span>
        </div>

        <div className="p-3 sm:p-6">
          <p className="font-mono text-[10px] tracking-[0.08em] text-muted uppercase">Miércoles 7 de octubre</p>
          <p className="display mt-1 text-[28px] sm:text-[36px]">Buenas tardes, Sam</p>

          <div className="mt-4 grid gap-3 sm:gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
            <Card className="overflow-hidden">
              <div className="flex flex-wrap items-start justify-between gap-2 px-4 pt-4 sm:px-5">
                <div>
                  <p className="font-mono text-[10px] tracking-[0.08em] text-muted uppercase">Capital disponible</p>
                  <p className="mt-2 font-figure text-[32px] leading-none font-medium tracking-[-0.035em] sm:text-[40px]">$3.724.731</p>
                  <p className="mt-2 text-[11.5px] text-muted">
                    <span className="font-figure text-fg">+$1.157.701</span> desde el 1 de octubre · cierre estimado <span className="font-figure text-fg-2">$2.623.042</span>
                  </p>
                </div>
                <TrendLegend />
              </div>
              <div className="px-4 pt-4 pb-3 sm:px-5">
                <TrendMock points={CAPITAL} estimateFrom={6} min={1.2} max={4} className="h-[110px] sm:h-[150px]" />
                {/* cada etiqueta va en la x de su punto. en mobile quedan menos para que no se pisen */}
                <div className="relative mt-2 h-4 text-[10px] text-muted sm:text-[11px]">
                  {CAPITAL.map((p, i) => {
                    const last = i === CAPITAL.length - 1
                    return (
                      <span key={p.label} className={cn('absolute top-0 whitespace-nowrap', i === 0 ? '' : last ? '-translate-x-full' : '-translate-x-1/2', !MOBILE_LABELS.includes(i) && 'hidden sm:inline')} style={{ left: `${(i / (CAPITAL.length - 1)) * 100}%` }}>
                        {p.label}
                      </span>
                    )
                  })}
                </div>
              </div>
              <div className="grid grid-cols-2 border-t border-border sm:grid-cols-4">
                {KPIS.map((k, i) => {
                  const Icon = k.trend === 'flat' ? Minus : k.trend === 'up' ? ArrowUpRight : ArrowDownRight
                  return (
                    <div key={k.label} className={cn('px-4 py-3 sm:px-5', i % 2 === 1 && 'border-l border-border', i >= 2 && 'border-t border-border sm:border-t-0', i === 2 && 'sm:border-l')}>
                      <p className="font-mono text-[9.5px] tracking-[0.08em] text-muted uppercase">{k.label}</p>
                      <p className="mt-1.5 font-figure text-[15px] leading-none font-medium tracking-[-0.025em] sm:text-[17px]">{k.value}</p>
                      <p className="mt-1.5 flex items-center gap-1 text-[11px] font-medium text-fg-2">
                        <Icon className="size-3 shrink-0" aria-hidden />
                        {k.delta}
                      </p>
                    </div>
                  )
                })}
              </div>
            </Card>

            <div className="hidden space-y-3 sm:space-y-4 lg:block">
              <Card className="relative overflow-hidden p-5">
                <div className="pointer-events-none absolute -top-20 -right-16 size-56 rounded-full bg-[radial-gradient(closest-side,var(--glow-strong),transparent)]" aria-hidden />
                <div className="relative flex items-center gap-2">
                  <Sparkles className="size-3.5 text-accent" aria-hidden />
                  <span className="text-[12px] font-medium">Resumen del mes</span>
                </div>
                <p className="relative mt-3 text-[13.5px] leading-relaxed font-medium">En lo que va del mes ingresaron $1.970.000 y gastaste $812.299, 17% menos que a esta altura del mes pasado. Tu mayor gasto fue hogar (64% del total). Si seguís así, cerrás el mes con $2.623.042 disponibles (estimado).</p>
              </Card>
              <Card className="p-5">
                <p className="text-[12px] font-medium">Lo importante</p>
                <ul className="mt-2 divide-y divide-border">
                  {FEED.map((f) => (
                    <li key={f.title} className="flex gap-2.5 py-2.5">
                      <span className="mt-1 size-1.5 shrink-0 rounded-full bg-accent-solid" aria-hidden />
                      <span>
                        <span className="block text-[12px] leading-snug font-medium">{f.title}</span>
                        <span className="mt-0.5 block text-[11px] text-muted">{f.body}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
