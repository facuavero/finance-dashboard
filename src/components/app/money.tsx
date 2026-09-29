import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react'
import { money, pct } from '@/lib/format'
import { cn } from '@/lib/utils'

/** monto con clase .money para el modo privacidad */
export function Money({ cents, sign, compact, decimals, className, tabular }: { cents: number; sign?: boolean; compact?: boolean; decimals?: boolean; className?: string; tabular?: boolean }) {
  return <span className={cn('money', tabular && 'num', className)}>{money(cents, { sign, compact, decimals })}</span>
}

/**
 * variación contra el período anterior. `goodWhenUp` define el color:
 * ingresos que suben = bueno, gastos que suben = atención. siempre con flecha + texto, nunca solo color.
 */
export function Delta({ ratio, goodWhenUp, label, className, unit = 'pct' }: { ratio: number | null; goodWhenUp: boolean; label?: string; className?: string; unit?: 'pct' | 'pts' | 'cents' }) {
  if (ratio === null || !Number.isFinite(ratio)) return <span className={cn('text-[12px] text-muted', className)}>sin datos para comparar</span>
  const flat = unit === 'cents' ? ratio === 0 : Math.abs(ratio) < (unit === 'pts' ? 0.005 : 0.02)
  const up = ratio > 0
  const good = flat ? null : up === goodWhenUp
  const Icon = flat ? Minus : up ? ArrowUpRight : ArrowDownRight
  return (
    <span className={cn('inline-flex items-center gap-1 text-[12px] font-medium', good === null ? 'text-muted' : good ? 'text-positive' : 'text-critical', className)}>
      <Icon className="size-3.5" aria-hidden />
      <span>
        {flat ? 'igual' : unit === 'pts' ? `${Math.round(Math.abs(ratio) * 100)} pts` : unit === 'cents' ? <span className="money">{money(Math.abs(ratio))}</span> : pct(Math.abs(ratio))} <span className="font-normal text-muted">{label ?? 'vs. mes anterior'}</span>
      </span>
    </span>
  )
}
