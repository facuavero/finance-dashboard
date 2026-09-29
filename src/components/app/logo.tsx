import { cn } from '@/lib/utils'

export function Logo({ className, withText = true }: { className?: string; withText?: boolean }) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <svg viewBox="0 0 32 32" className="size-7" aria-hidden>
        <rect width="32" height="32" rx="8" className="fill-fg" />
        <path d="M8 20c3 0 3-4 6-4s3 4 6 4 3-4 4-4" fill="none" className="stroke-bg" strokeWidth="2.4" strokeLinecap="round" />
        <path d="M8 13c3 0 3-4 6-4s3 4 6 4 3-4 4-4" fill="none" stroke="var(--accent)" strokeWidth="2.4" strokeLinecap="round" />
      </svg>
      {withText && <span className="text-[17px] font-semibold tracking-[-0.02em]">Caudal</span>}
    </span>
  )
}
