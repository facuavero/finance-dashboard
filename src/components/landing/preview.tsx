import { ArrowDownRight, ArrowLeftRight, ArrowUpRight, ChartColumn, Droplets, LayoutDashboard, Minus, PiggyBank, Search, Sparkles, Target, Telescope, type LucideIcon } from 'lucide-react'
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

const NAV: { label: string; icon: LucideIcon }[] = [
  { label: 'Inicio', icon: LayoutDashboard },
  { label: 'Movimientos', icon: ArrowLeftRight },
  { label: 'Presupuestos', icon: PiggyBank },
  { label: 'Objetivos', icon: Target },
  { label: 'Estadísticas', icon: ChartColumn },
  { label: 'Fugas de dinero', icon: Droplets },
  { label: 'Proyección', icon: Telescope },
  { label: 'IA financiera', icon: Sparkles },
]

const KPIS = [
  { label: 'Ingresos del mes', value: '$1.970.000', delta: 'igual', trend: 'flat' },
  { label: 'Gastos del mes', value: '$812.299', delta: '17%', trend: 'down' },
  { label: 'Ahorro neto', value: '$1.157.701', delta: '$161.200', trend: 'up' },
  { label: 'Tasa de ahorro', value: '59%', delta: '8 pts', trend: 'up' },
] as const

/** el inicio de la app tal como lo muestra la cuenta demo (midday + mercury: el producto es la prueba) */
export function ProductPreview() {
  return (
    <div className="rounded-2xl border border-border bg-surface-2 p-1.5 sm:p-2.5">
      <div className="flex overflow-hidden rounded-xl border border-border bg-bg">
        <div className="hidden w-[184px] shrink-0 flex-col gap-0.5 border-r border-border px-2.5 py-3.5 lg:flex">
          <Logo className="mb-4 px-1.5 [&_svg]:size-6 [&>span:last-child]:text-[15px]" />
          {NAV.map(({ label, icon: Icon }, i) => (
            <span key={label} className={cn('flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[13px]', i === 0 ? 'border border-border bg-surface font-medium text-fg' : 'text-fg-2')}>
              <Icon className={cn('size-4', i === 0 ? 'text-accent' : 'text-muted')} aria-hidden />
              {label}
            </span>
          ))}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex h-11 items-center gap-3 border-b border-border px-3 sm:px-4">
            <span className="flex h-7 w-full max-w-[280px] items-center gap-2 rounded-lg border border-border bg-surface px-2.5 text-[12px] text-muted">
              <Search className="size-3.5" aria-hidden /> Buscar o ir a…
              <kbd className="ml-auto rounded border border-border px-1 font-mono text-[10px]">⌘K</kbd>
            </span>
            <span className="ml-auto shrink-0 rounded-full bg-accent-soft px-2 py-0.5 text-[11px] font-medium text-accent">Cuenta demo</span>
          </div>

          <div className="space-y-3 p-3 sm:space-y-4 sm:p-5">
            <p className="text-[18px] font-semibold tracking-[-0.02em] sm:text-[20px]">Buenas tardes, Sam</p>

            <div className="grid gap-3 sm:gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)]">
              <Card className="p-4 sm:p-5">
                <div className="flex items-center gap-2">
                  <Sparkles className="size-4 text-accent" aria-hidden />
                  <span className="text-[13px] font-medium">Resumen del mes</span>
                  <span className="ml-auto text-[11px] text-muted">Motor de reglas local</span>
                </div>
                <p className="mt-3 text-[14px] leading-relaxed sm:text-[15px]">En lo que va del mes ingresaron $1.970.000 y gastaste $812.299, 17% menos que a esta altura del mes pasado. Tu mayor gasto fue hogar (64% del total). Si seguís así, cerrás el mes con $2.623.042 disponibles (estimado).</p>
                <p className="mt-3 text-[13px] font-medium text-accent">Ver recomendaciones</p>
              </Card>

              <Card className="pt-4">
                <div className="flex flex-wrap items-start justify-between gap-2 px-4 sm:px-5">
                  <div>
                    <p className="text-[13px] text-fg-2">Capital disponible</p>
                    <p className="mt-1 text-[30px] leading-none font-semibold tracking-[-0.03em] sm:text-[36px]">$3.724.731</p>
                    <p className="mt-2 text-[12px] text-muted">
                      <span className="text-positive">+$1.157.701</span> desde el 1 de octubre · cierre estimado <span className="font-medium text-fg-2">$2.623.042</span>
                    </p>
                  </div>
                  <TrendLegend />
                </div>
                <div className="px-4 pt-4 pb-3 sm:px-5">
                  <TrendMock points={CAPITAL} estimateFrom={6} min={1.2} max={4} className="h-[110px] sm:h-[140px]" />
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
              </Card>
            </div>

            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {KPIS.map((k) => {
                const Icon = k.trend === 'flat' ? Minus : k.trend === 'up' ? ArrowUpRight : ArrowDownRight
                return (
                  <Card key={k.label} className="p-3.5 sm:p-4">
                    <p className="text-[12px] text-fg-2 sm:text-[13px]">{k.label}</p>
                    <p className="mt-1 text-[17px] leading-tight font-semibold tracking-[-0.02em] sm:text-[20px]">{k.value}</p>
                    <p className={cn('mt-1 flex items-center gap-1 text-[11px] font-medium sm:text-[12px]', k.trend === 'flat' ? 'text-muted' : 'text-positive')}>
                      <Icon className="size-3.5 shrink-0" aria-hidden />
                      <span>
                        {k.delta} <span className="hidden font-normal text-muted sm:inline">vs. mes anterior</span>
                      </span>
                    </p>
                  </Card>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
