import { Lightbulb } from 'lucide-react'
import { getAppData } from '@/modules/app/data'
import { generateTip } from '@/modules/ai/tip-service'
import { rateLimit } from '@/modules/auth/rate-limit'
import { pickTip, type Tip } from '@/modules/insights/tips'

const GOAL_LABEL = { crecer: 'para que tu plata crezca', 'gastar-menos': 'para gastar menos', fuga: 'contra una fuga' } as const

export function TipAside({ tip, pending }: { tip: Tip | null; pending?: boolean }) {
  return (
    <aside aria-label="Tip del día" aria-busy={pending} className="relative mt-5 flex animate-slide-up gap-3 rounded-2xl bg-surface-2 px-4 py-3.5">
      <Lightbulb className={`mt-0.5 size-4 shrink-0 text-accent ${pending ? 'animate-pulse' : 'animate-wiggle'}`} aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="label-caps !text-[10px]">{pending ? 'Tip del día · pensando con tus datos' : `Tip${tip?.basis === 'ia' && tip.goal ? ` · ${GOAL_LABEL[tip.goal]}` : tip?.basis === 'datos' ? ' · según tus datos' : ''}`}</p>
        {pending || !tip ? (
          <div className="mt-2 space-y-1.5" aria-hidden>
            <div className="h-3 w-full animate-pulse rounded-full bg-surface-3" />
            <div className="h-3 w-2/3 animate-pulse rounded-full bg-surface-3" />
          </div>
        ) : (
          <p className="money mt-1 text-[13.5px] leading-relaxed text-fg-2">{tip.text}</p>
        )}
        {tip?.basis === 'ia' && tip.engine && <p className="mt-1.5 font-mono text-[10.5px] text-muted">{tip.engine}</p>}
      </div>
    </aside>
  )
}

/** el tip lo escribe la IA con los datos de la persona. si no hay IA, está apagada o falla: un tip por reglas (que también usa sus datos) */
export async function AiTipAside() {
  const { user, ctx, recommendations, combined, currency } = await getAppData()
  if (user.aiExternalEnabled && rateLimit(`tip:${user.id}`, 40, 60 * 60_000).ok) {
    const ai = await generateTip({ userId: user.id, currency, ctx, recs: recommendations, combined })
    if (ai) return <TipAside tip={{ id: 'ai', basis: 'ia', text: ai.text, goal: ai.goal, engine: ai.engine }} />
  }
  return <TipAside tip={pickTip(ctx)} />
}
