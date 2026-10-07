import * as React from 'react'
import { cn } from '@/lib/utils'

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('min-w-0 rounded-card border border-border bg-surface transition-[border-color,box-shadow] duration-200 hover:border-border-strong', className)} {...props} />
}

export function CardHeader({ title, subtitle, action, className, id }: { title: React.ReactNode; subtitle?: React.ReactNode; action?: React.ReactNode; className?: string; id?: string }) {
  return (
    <div className={cn('flex items-start justify-between gap-3 px-5 pt-5 pb-3 sm:px-6', className)}>
      <div className="min-w-0">
        <h2 id={id} className="text-[15px] font-medium tracking-[-0.01em] text-fg">
          {title}
        </h2>
        {subtitle && <p className="mt-0.5 text-[13px] text-muted">{subtitle}</p>}
      </div>
      {action && <div className="flex shrink-0 items-center gap-1">{action}</div>}
    </div>
  )
}

export function CardBody({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('px-5 pb-5 sm:px-6 sm:pb-6', className)} {...props} />
}
