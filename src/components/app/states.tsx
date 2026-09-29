import type { LucideIcon } from 'lucide-react'
import * as React from 'react'
import { cn } from '@/lib/utils'

export function EmptyState({ icon: Icon, title, children, action, className, compact }: { icon: LucideIcon; title: string; children?: React.ReactNode; action?: React.ReactNode; className?: string; compact?: boolean }) {
  return (
    <div className={cn('flex flex-col items-center justify-center text-center', compact ? 'gap-2 py-6' : 'gap-3 py-12', className)}>
      <span className="flex size-10 items-center justify-center rounded-full bg-surface-2 text-muted">
        <Icon className="size-5" aria-hidden />
      </span>
      <div className="max-w-sm">
        <p className="text-sm font-semibold text-fg">{title}</p>
        {children && <div className="mt-1 text-[13px] text-muted">{children}</div>}
      </div>
      {action}
    </div>
  )
}

/** marca de valor estimado. siempre visible al lado de una proyección */
export function EstimateTag({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full border border-dashed border-border-strong px-1.5 py-px text-[11px] font-medium text-muted', className)}>
      <svg width="12" height="4" aria-hidden className="text-muted">
        <line x1="0" y1="2" x2="12" y2="2" stroke="currentColor" strokeWidth="2" strokeDasharray="3 2" />
      </svg>
      estimado
    </span>
  )
}

export function RealTag({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full border border-border px-1.5 py-px text-[11px] font-medium text-muted', className)}>
      <svg width="12" height="4" aria-hidden>
        <line x1="0" y1="2" x2="12" y2="2" stroke="currentColor" strokeWidth="2" />
      </svg>
      real
    </span>
  )
}

/** barra de progreso: el relleno lleva el estado, la pista es el mismo tono más claro */
export function Meter({ value, state = 'ok', label, className }: { value: number; state?: 'ok' | 'near' | 'over' | 'done'; label: string; className?: string }) {
  const color = state === 'over' ? 'bg-critical' : state === 'near' ? 'bg-warning-mark' : state === 'done' ? 'bg-positive' : 'bg-accent'
  return (
    <div className={cn('h-1.5 w-full overflow-hidden rounded-full bg-surface-3', className)} role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(Math.min(1, value) * 100)}>
      <div className={cn('h-full rounded-full transition-[width] duration-500', color)} style={{ width: `${Math.max(2, Math.min(100, value * 100))}%` }} />
    </div>
  )
}

export function PageHeader({ title, description, actions }: { title: string; description?: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-fg sm:text-2xl">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-sm text-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

export function SectionLabel({ children, className, id }: { children: React.ReactNode; className?: string; id?: string }) {
  return (
    <p id={id} className={cn('label-caps', className)}>
      {children}
    </p>
  )
}
