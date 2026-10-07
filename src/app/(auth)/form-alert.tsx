import { CircleAlert } from 'lucide-react'
import { cn } from '@/lib/utils'

export function FormAlert({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={cn('flex items-start gap-2 rounded-2xl bg-critical-soft px-4 py-3 text-[13px] text-critical', className)} role="alert">
      <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden /> <span>{children}</span>
    </p>
  )
}
