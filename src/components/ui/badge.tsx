import { cva, type VariantProps } from 'class-variance-authority'
import * as React from 'react'
import { cn } from '@/lib/utils'

const badge = cva('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[12px] font-medium whitespace-nowrap [&_svg]:size-3', {
  variants: {
    tone: {
      neutral: 'bg-surface-3 text-fg-2',
      accent: 'bg-accent-soft text-accent',
      positive: 'bg-positive-soft text-positive',
      warning: 'bg-warning-soft text-warning',
      critical: 'bg-accent-solid text-on-accent',
      outline: 'border border-border-strong text-fg-2',
    },
  },
  defaultVariants: { tone: 'neutral' },
})

export function Badge({ className, tone, ...props }: React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badge>) {
  return <span className={cn(badge({ tone }), className)} {...props} />
}
