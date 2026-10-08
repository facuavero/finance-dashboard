'use client'

import { ArrowLeftRight, CircleHelp, MessageCircleQuestion } from 'lucide-react'
import type { Ask, Note } from '@/modules/ai/parse-txn'

/** la IA frena antes de cargar y pregunta la moneda. no se puede confirmar hasta responder. cada opción trae el factor que multiplica los montos */
export function CurrencyAsk({ ask, onAnswer }: { ask: Ask; onAnswer: (factor: number) => void }) {
  return (
    <section aria-label="Pregunta de la IA" className="animate-slide-up rounded-2xl border border-accent/40 bg-accent-soft p-4">
      <p className="flex items-start gap-2 text-[13.5px] font-medium">
        <MessageCircleQuestion className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />
        {ask.question}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {ask.options.map((o) => (
          <button key={o.label} type="button" onClick={() => onAnswer(o.factor)} className="h-9 cursor-pointer rounded-full bg-surface px-4 text-[13px] font-medium transition-[transform,background-color] duration-150 hover:bg-surface-3 active:scale-95">
            {o.label}
          </button>
        ))}
      </div>
    </section>
  )
}

/** "no entendí" y conversiones hechas: una ventanita con lo que la IA dudó, con salida para cambiarlo */
export function AiNotes({ notes, onFix, fixLabel = 'Cambiar' }: { notes: Note[]; onFix?: () => void; fixLabel?: string }) {
  if (!notes.length) return null
  const unclear = notes.filter((n) => n.kind === 'unclear')
  const converted = notes.filter((n) => n.kind === 'converted')
  return (
    <section aria-label="Avisos de la IA" aria-live="polite" className="animate-slide-up rounded-2xl border border-border-strong bg-surface-2 p-4">
      {unclear.length > 0 && (
        <>
          <p className="flex items-center gap-2 text-[13px] font-medium">
            <CircleHelp className="size-4 shrink-0 text-accent" aria-hidden /> No entendí del todo
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-9 text-[13px] text-fg-2">
            {unclear.map((n) => (
              <li key={n.text}>{n.text}</li>
            ))}
          </ul>
          {onFix && (
            <button type="button" onClick={onFix} className="mt-3 h-8 cursor-pointer rounded-full bg-surface px-3.5 text-[12.5px] font-medium transition-[transform,background-color] hover:bg-surface-3 active:scale-95">
              {fixLabel}
            </button>
          )}
        </>
      )}
      {converted.length > 0 && (
        <ul className={`space-y-1 text-[12.5px] text-fg-2 ${unclear.length ? 'mt-3 border-t border-border pt-3' : ''}`}>
          {converted.map((n) => (
            <li key={n.text} className="flex gap-2">
              <ArrowLeftRight className="mt-0.5 size-3.5 shrink-0 text-muted" aria-hidden /> {n.text}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
