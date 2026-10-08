import { cn } from '@/lib/utils'

/**
 * el mismo diamante de la landing, pero horneado: un sprite de 24 cuadros (public/gem-sprite.webp) que gira con CSS.
 * sin WebGL, sin JS y sin memoria de video, así que cuesta lo mismo con uno o con diez en pantalla.
 */
export function Gem({ className }: { className?: string }) {
  return (
    <span aria-hidden className={cn('inline-flex size-8 shrink-0 items-center justify-center', className)}>
      <span className="gem">
        <span className="gem-strip" />
      </span>
    </span>
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
