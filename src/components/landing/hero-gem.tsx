'use client'

import { useEffect, useRef, useState } from 'react'
import { Gem } from '@/components/app/logo'
import { cn } from '@/lib/utils'

/** diamante que gira y brilla (three.js, cargado aparte para no pesar en el primer pintado). sin WebGL queda el rubí del logo */
export function HeroGem({ className }: { className?: string }) {
  const host = useRef<HTMLDivElement>(null)
  const [failed, setFailed] = useState(false)
  useEffect(() => {
    const el = host.current
    if (!el) return
    let dead = false
    let stop = () => {}
    import('./gem-scene')
      .then(({ mountGem }) => {
        if (dead) return
        try {
          stop = mountGem(el)
        } catch {
          setFailed(true)
        }
      })
      .catch(() => setFailed(true))
    return () => {
      dead = true
      stop()
    }
  }, [])
  return (
    <div aria-hidden className={cn('pointer-events-none relative', className)}>
      {/* brillo rubí que respira detrás de la piedra */}
      <div className="absolute inset-[8%] animate-pulse rounded-full bg-[radial-gradient(closest-side,var(--glow-strong),transparent)] [animation-duration:4s]" />
      <div ref={host} className="absolute inset-0 animate-pop-in">
        {failed && <Gem className="size-full animate-float" />}
      </div>
    </div>
  )
}
