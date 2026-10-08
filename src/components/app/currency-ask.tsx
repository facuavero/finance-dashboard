'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { MessageCircleQuestion } from 'lucide-react'
import { setCurrencyAction } from '@/modules/settings/actions'
import type { Ask } from '@/modules/ai/parse-txn'

/** la IA frena antes de cargar y pregunta la moneda. no se puede confirmar hasta responder */
export function CurrencyAsk({ ask, onAnswered }: { ask: Ask; onAnswered: () => void }) {
  const router = useRouter()
  const [pending, start] = useTransition()
  return (
    <section aria-label="Pregunta de la IA" className="animate-slide-up rounded-2xl border border-accent/40 bg-accent-soft p-4">
      <p className="flex items-start gap-2 text-[13.5px] font-medium">
        <MessageCircleQuestion className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />
        {ask.question}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {ask.options.map((o) => (
          <button
            key={o.label}
            type="button"
            disabled={pending}
            onClick={() =>
              start(async () => {
                const r = await setCurrencyAction(o.currency)
                if (!r.ok) return void toast.error(r.error)
                onAnswered()
                router.refresh()
              })
            }
            className="h-9 cursor-pointer rounded-full bg-surface px-4 text-[13px] font-medium transition-[transform,background-color] duration-150 hover:bg-surface-3 active:scale-95 disabled:opacity-50"
          >
            {o.label}
          </button>
        ))}
      </div>
    </section>
  )
}
