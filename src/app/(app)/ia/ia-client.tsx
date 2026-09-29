'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { ArrowRight, ChevronDown, RefreshCw, Send, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Collapsible, CollapsibleContent, CollapsibleTrigger, Segmented } from '@/components/ui/misc'
import { Money } from '@/components/app/money'
import { EstimateTag } from '@/components/app/states'
import { askAction, regenerateAction } from '@/modules/ai/actions'
import type { Recommendation } from '@/modules/ai/rules'
import { cn } from '@/lib/utils'

const AREA: Record<Recommendation['area'], string> = { ahorro: 'Ahorro', gastos: 'Gastos', inversion: 'Inversión', distribucion: 'Distribución', objetivos: 'Objetivos', recurrentes: 'Recurrentes', microgastos: 'Microgastos', anomalias: 'Anomalías' }
const PRIO = { alta: 'critical' as const, media: 'warning' as const, baja: 'neutral' as const }

export function RegenerateButton() {
  const [pending, start] = useTransition()
  return (
    <Button
      variant="secondary"
      loading={pending}
      onClick={() =>
        start(async () => {
          const r = await regenerateAction()
          if (!r.ok) toast.error(r.error)
          else toast.success('Análisis actualizado')
        })
      }
    >
      <RefreshCw /> Regenerar
    </Button>
  )
}

export function Recommendations({ summary, upcoming, recs, engine, note, generatedAt, pending }: { summary: string; upcoming: string | null; recs: Recommendation[]; engine: string; note: string | null; generatedAt: string | null; pending?: boolean }) {
  const [prio, setPrio] = useState<'todas' | Recommendation['priority']>('todas')
  const [all, setAll] = useState(false)
  const filtered = prio === 'todas' ? recs : recs.filter((r) => r.priority === prio)
  const shown = all ? filtered : filtered.slice(0, 8)
  // solo lo que es ahorro concreto: patrones de microgastos y suscripciones (no metas ni excesos puntuales)
  const totalMonthly = recs.filter((r) => r.impactMonthlyCents && (r.area === 'recurrentes' || (r.area === 'microgastos' && r.id !== 'micro:total'))).reduce((a, r) => a + (r.impactMonthlyCents ?? 0), 0)
  return (
    <div className={cn('space-y-6 transition-opacity', pending && 'opacity-70')}>
      <section aria-labelledby="sum-title" className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <Card className="p-5">
          <div className="flex items-center gap-2 text-[13px]">
            <Sparkles className="size-4 text-accent" aria-hidden />
            <h2 id="sum-title" className="font-medium">
              Qué pasó y por qué
            </h2>
            <span className="ml-auto text-[12px] text-muted">
              {engine}
              {generatedAt ? ` · ${new Date(generatedAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'America/Argentina/Buenos_Aires' })}` : ''}
            </span>
          </div>
          <p className="money mt-3 text-[16px] leading-relaxed">{summary}</p>
          {upcoming && (
            <p className="money mt-3 border-t border-border pt-3 text-[14px] text-fg-2">
              <span className="font-medium text-fg">Qué viene: </span>
              {upcoming}{' '}
              <Link href="/calendario" className="text-accent hover:underline">
                Ver calendario
              </Link>
            </p>
          )}
          {note && <p className="mt-3 text-[12px] text-muted">{note}</p>}
        </Card>
        <Card className="p-5">
          <p className="flex items-center gap-2 text-[13px] text-fg-2">
            Ahorro posible en microgastos y suscripciones <EstimateTag />
          </p>
          <p className="mt-1 text-[32px] leading-tight font-semibold tracking-[-0.02em] text-positive">
            <Money cents={totalMonthly} />
            <span className="ml-1 text-[14px] font-normal text-muted">/mes</span>
          </p>
          <p className="text-[13px] text-muted">
            ~<Money cents={totalMonthly * 12} /> al año si aplicás esas recomendaciones. No incluye gastos puntuales.
          </p>
        </Card>
      </section>

      <section aria-labelledby="recs-title">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 id="recs-title" className="text-[17px] font-semibold">
            Qué deberías hacer ahora
          </h2>
          <Segmented size="sm" label="Filtrar por prioridad" value={prio} onChange={setPrio} options={[{ value: 'todas', label: `Todas (${recs.length})` }, { value: 'alta', label: 'Alta' }, { value: 'media', label: 'Media' }, { value: 'baja', label: 'Baja' }]} />
        </div>
        <ol className="space-y-3">
          {shown.map((r, i) => (
            <li key={r.id}>
              <Card className="p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="num text-[12px] text-muted">{String(i + 1).padStart(2, '0')}</span>
                  <Badge tone={PRIO[r.priority]}>Prioridad {r.priority}</Badge>
                  <Badge tone="outline">{AREA[r.area]}</Badge>
                </div>
                <div className="mt-3 grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px]">
                  <div>
                    <h3 className="money text-[16px] leading-snug font-semibold">{r.problem}</h3>
                    <p className="money mt-2 text-[14px] text-fg-2">
                      <span className="font-medium text-fg">Por qué: </span>
                      {r.explanation}
                    </p>
                    <p className="money mt-2 text-[14px] text-fg-2">
                      <span className="font-medium text-fg">Qué hacer: </span>
                      {r.action}
                    </p>
                    {r.evidence.length > 0 && (
                      <Collapsible>
                        <CollapsibleTrigger className="group mt-3 flex cursor-pointer items-center gap-1 text-[12px] text-muted hover:text-fg">
                          Datos usados <ChevronDown className="size-3.5 transition-transform group-data-[state=open]:rotate-180" />
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <ul className="mt-2 list-disc space-y-0.5 pl-4 text-[12px] text-muted">
                            {r.evidence.map((e) => (
                              <li key={e}>{e}</li>
                            ))}
                          </ul>
                        </CollapsibleContent>
                      </Collapsible>
                    )}
                  </div>
                  <div className="flex flex-col justify-between gap-3 rounded-lg bg-surface-2 p-4">
                    <div>
                      <p className="flex items-center gap-1.5 text-[12px] text-muted">
                        Impacto estimado <EstimateTag />
                      </p>
                      {r.impactMonthlyCents ? (
                        <>
                          <p className="mt-1 text-[20px] font-semibold text-fg">
                            <Money cents={r.impactMonthlyCents} />
                            <span className="text-[12px] font-normal text-muted">/mes</span>
                          </p>
                          {r.impactAnnualCents ? (
                            <p className="text-[12px] text-muted">
                              <Money cents={r.impactAnnualCents} /> al año
                            </p>
                          ) : null}
                        </>
                      ) : (
                        <p className="mt-1 text-[13px] text-fg-2">Sin monto directo: impacta en tus objetivos.</p>
                      )}
                    </div>
                    {r.href && (
                      <Link href={r.href} className="inline-flex items-center gap-1 text-[13px] font-medium text-accent hover:underline">
                        Ir al detalle <ArrowRight className="size-3.5" />
                      </Link>
                    )}
                  </div>
                </div>
              </Card>
            </li>
          ))}
        </ol>
        {filtered.length > shown.length && (
          <div className="mt-4 flex justify-center">
            <Button variant="secondary" onClick={() => setAll(true)}>
              Ver {filtered.length - shown.length} recomendaciones más
            </Button>
          </div>
        )}
      </section>
    </div>
  )
}

const SUGGESTED = ['¿Cuánto gasté en delivery este mes?', '¿Cómo cierro el mes?', '¿Cuánto pago en suscripciones?', '¿Qué gastos se vienen?', '¿Cuánto puedo ahorrar?']

export function AskBox() {
  const [q, setQ] = useState('')
  const [answers, setAnswers] = useState<{ q: string; a: string; engine: string }[]>([])
  const [pending, start] = useTransition()
  const ask = (question: string) => {
    if (question.trim().length < 3) return
    start(async () => {
      const r = await askAction(question)
      if (!r.ok) return void toast.error(r.error)
      setAnswers((a) => [{ q: question, a: r.answer, engine: r.engine }, ...a].slice(0, 5))
      setQ('')
    })
  }
  return (
    <Card className="mb-6 p-5">
      <form
        onSubmit={(e) => {
          e.preventDefault()
          ask(q)
        }}
        className="flex gap-2"
      >
        <label htmlFor="ask" className="sr-only">
          Preguntale a Caudal
        </label>
        <Input id="ask" placeholder="Preguntale a Caudal sobre tu plata…" value={q} onChange={(e) => setQ(e.target.value)} maxLength={500} />
        <Button type="submit" loading={pending} aria-label="Preguntar">
          <Send />
        </Button>
      </form>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {SUGGESTED.map((s) => (
          <button key={s} type="button" onClick={() => ask(s)} disabled={pending} className="cursor-pointer rounded-full border border-border px-3 py-1 text-[12px] text-fg-2 hover:border-border-strong hover:text-fg disabled:opacity-50">
            {s}
          </button>
        ))}
      </div>
      {answers.length > 0 && (
        <ul className="mt-4 space-y-3" aria-live="polite">
          {answers.map((a, i) => (
            <li key={i} className="rounded-lg bg-surface-2 p-4 text-[14px]">
              <p className="text-[12px] text-muted">{a.q}</p>
              <p className="money mt-1 whitespace-pre-line">{a.a}</p>
              <p className="mt-2 text-[11px] text-muted">{a.engine}</p>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
