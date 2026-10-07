'use client'

import { useRef, useState, useTransition } from 'react'
import Link from 'next/link'
import { ArrowUp, Sparkles } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/misc'
import { askAction } from '@/modules/ai/actions'
import type { AskTopic } from '@/modules/ai/service'
import { cn } from '@/lib/utils'

/**
 * "Preguntale a la IA" para cada pantalla. abre un panel con preguntas sugeridas para esa pantalla y responde sobre los datos reales.
 * la IA recibe la pantalla como contexto y prioriza esos datos (no es un chat aparte).
 */
export function AskAi({ topic, suggestions, label = 'Preguntar a la IA', className }: { topic: Exclude<AskTopic, 'general'>; suggestions: string[]; label?: string; className?: string }) {
  const [q, setQ] = useState('')
  const [asked, setAsked] = useState('')
  const [answer, setAnswer] = useState<{ text: string; engine: string } | null>(null)
  const [error, setError] = useState('')
  const [pending, start] = useTransition()
  const inputRef = useRef<HTMLInputElement>(null)

  const ask = (question: string) => {
    const text = question.trim()
    if (text.length < 3) return
    setQ('')
    setAsked(text)
    setAnswer(null)
    setError('')
    start(async () => {
      const r = await askAction(text, topic)
      if (r.ok) setAnswer({ text: r.answer, engine: r.engine })
      else setError(r.error)
    })
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className={cn('inline-flex h-9 cursor-pointer items-center gap-2 rounded-full border border-border-strong px-3.5 text-[13px] font-medium text-fg-2 transition-colors hover:bg-surface-2 hover:text-fg', className)}>
          <Sparkles className="size-3.5 text-accent" aria-hidden />
          {label}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[min(420px,calc(100vw-2rem))] p-4" onOpenAutoFocus={(e) => (e.preventDefault(), inputRef.current?.focus())}>
        <p className="display text-[22px]">Preguntale a la IA</p>
        <p className="mt-0.5 text-[12.5px] text-muted">Responde con tus datos reales de esta pantalla.</p>

        {(asked || pending) && (
          <div className="mt-3 space-y-2" aria-live="polite">
            <p className="ml-auto w-fit max-w-[90%] rounded-2xl rounded-br-md bg-surface-3 px-3.5 py-2 text-[13px]">{asked}</p>
            {pending ? (
              <p className="px-1 text-[13px] text-muted">Pensando…</p>
            ) : error ? (
              <p className="px-1 text-[13px] text-critical" role="alert">
                {error}
              </p>
            ) : answer ? (
              <div className="rounded-2xl rounded-bl-md bg-surface-2 px-3.5 py-2.5">
                <p className="money text-[13.5px] leading-relaxed">{answer.text}</p>
                <p className="mt-1.5 font-mono text-[10.5px] text-muted">{answer.engine}</p>
              </div>
            ) : null}
          </div>
        )}

        {!asked && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {suggestions.map((s) => (
              <button key={s} onClick={() => ask(s)} className="cursor-pointer rounded-full bg-surface-2 px-3 py-1.5 text-left text-[12.5px] text-fg-2 transition-colors hover:bg-surface-3 hover:text-fg">
                {s}
              </button>
            ))}
          </div>
        )}

        <form
          className="relative mt-3"
          onSubmit={(e) => {
            e.preventDefault()
            ask(q)
          }}
        >
          <input ref={inputRef} value={q} onChange={(e) => setQ(e.target.value)} maxLength={500} autoComplete="off" placeholder="Preguntá lo que quieras…" aria-label="Tu pregunta" className="h-11 w-full rounded-full border border-transparent bg-surface-2 pr-12 pl-4 text-[13.5px] outline-none placeholder:text-muted focus-visible:border-fg/60" />
          <button type="submit" disabled={q.trim().length < 3 || pending} aria-label="Enviar pregunta" className="absolute top-1/2 right-1.5 flex size-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-fg text-bg disabled:opacity-30">
            <ArrowUp className="size-4" />
          </button>
        </form>
        <Link href="/ia" className="mt-3 inline-block text-[12.5px] font-medium text-accent hover:underline">
          Ver todas las recomendaciones →
        </Link>
      </PopoverContent>
    </Popover>
  )
}
