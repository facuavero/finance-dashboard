import { cn } from '@/lib/utils'

// rubí facetado: cada cara un tono plano, sin gradientes (no necesita ids y se ve igual repetido en la página)
const FACETS: [string, string][] = [
  ['6,11 10,5 13,11', '#c80f37'],
  ['10,5 16,5 13,11', '#ff4d6d'],
  ['16,5 19,11 13,11', '#ff8aa0'],
  ['16,5 22,5 19,11', '#e0123d'],
  ['26,11 22,5 19,11', '#a30b2c'],
  ['6,11 13,11 16,28', '#b40d33'],
  ['13,11 19,11 16,28', '#e0123d'],
  ['19,11 26,11 16,28', '#7d0821'],
]

export function Gem({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn('size-7', className)} aria-hidden>
      {FACETS.map(([points, fill]) => (
        <polygon key={points} points={points} fill={fill} />
      ))}
    </svg>
  )
}

export function Logo({ className, withText = true }: { className?: string; withText?: boolean }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5', className)}>
      <Gem />
      {withText && <span className="display text-[24px] leading-none text-fg">Caudal</span>}
    </span>
  )
}
