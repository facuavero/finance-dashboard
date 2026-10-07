import Link from 'next/link'
import { ChevronRight, CircleAlert, Info, Lightbulb, TriangleAlert } from 'lucide-react'
import type { Alert } from '@/modules/alerts/engine'
import { cn } from '@/lib/utils'

const ICON = { critical: CircleAlert, warning: TriangleAlert, info: Info, positive: Lightbulb }
const LABEL = { critical: 'Urgente', warning: 'Atención', info: 'Info', positive: 'Oportunidad' }
const TONE = { critical: 'text-on-accent bg-accent-solid', warning: 'text-warning bg-warning-soft', info: 'text-fg-2 bg-surface-2', positive: 'text-fg bg-surface-2' }

export function AlertRow({ alert, compact, actions }: { alert: Alert; compact?: boolean; actions?: React.ReactNode }) {
  const Icon = ICON[alert.severity]
  return (
    <div className={cn('flex gap-3', compact ? 'py-3' : 'py-4')}>
      <span className={cn('flex size-9 shrink-0 items-center justify-center rounded-full', TONE[alert.severity])}>
        <Icon className="size-4" aria-hidden />
        <span className="sr-only">{LABEL[alert.severity]}</span>
      </span>
      <div className="min-w-0 flex-1">
        <Link href={alert.href} className="group flex items-start gap-1 text-[14px] font-medium hover:text-accent">
          {alert.title}
          <ChevronRight className="mt-0.5 size-4 shrink-0 text-muted opacity-0 transition-opacity group-hover:opacity-100" aria-hidden />
        </Link>
        <p className="money mt-0.5 text-[13px] text-fg-2">{alert.body}</p>
        {actions}
      </div>
    </div>
  )
}
