'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ArrowRight, Check, Paperclip, Sparkles, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CurrencyAsk } from './currency-ask'
import { applyPlanAction, assistantPlanAction } from '@/modules/ai/actions'
import type { Plan } from '@/modules/ai/assistant'
import type { Ask } from '@/modules/ai/parse-txn'
import { dateShort, money } from '@/lib/format'
import { cn } from '@/lib/utils'

type Cat = { id: string; name: string }
type Proposal = { plan: Plan; engine: string; external: boolean; ask: Ask | null }

const EXAMPLES = ['gasté 4500 en pedidosya ayer', 'cobré el sueldo 1.200.000', 'presupuesto de delivery 50000 por mes', 'objetivo viaje 1.500.000 para diciembre']
const MAX_FILE = 200_000
const SEEN = 'caudal-assistant-seen'

const KIND: Record<Plan['goals'][number]['kind'], string> = { purchase: 'Compra', travel: 'Viaje', emergency: 'Emergencia', savings: 'Ahorro', investment: 'Inversión' }
const PERIOD = { weekly: 'por semana', monthly: 'por mes', yearly: 'por año' }
const m = (c: number) => money(c, { decimals: c % 100 !== 0 || undefined })

type Row = { key: string; group: 'tx' | 'bu' | 'go'; title: string; detail: string; problem: string | null }

/**
 * recuadro de bienvenida: se le habla a la IA y carga movimientos, presupuestos y objetivos.
 * acepta texto o un archivo de texto (csv, txt). primero muestra qué va a cargar, después confirma.
 * aparece una vez por sesión del navegador (al ingresar), o cuando se lo pide con ?asistente=1.
 */
export function AssistantCard({ categories, force }: { categories: Cat[]; force?: boolean }) {
  const router = useRouter()
  const [visible, setVisible] = useState(false)
  const [text, setText] = useState('')
  const [fileName, setFileName] = useState('')
  const [proposal, setProposal] = useState<Proposal | null>(null)
  const [off, setOff] = useState<Set<string>>(new Set())
  const [error, setError] = useState('')
  const [thinking, startThinking] = useTransition()
  const [saving, startSaving] = useTransition()
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    let seen = false
    try {
      seen = sessionStorage.getItem(SEEN) === '1'
      sessionStorage.setItem(SEEN, '1')
    } catch {}
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (force || !seen) setVisible(true)
  }, [force])

  if (!visible) return null

  const catName = (id: string | null) => categories.find((c) => c.id === id)?.name
  const rows: Row[] = proposal
    ? [
        ...proposal.plan.transactions.map((t, i): Row => ({
          key: `tx${i}`,
          group: 'tx',
          title: `${t.type === 'expense' ? '−' : '+'}${t.amountCents ? m(t.amountCents) : '¿monto?'} ${t.description || catName(t.categoryId) || ''}`.trim(),
          detail: `${catName(t.categoryId) ?? 'Sin categoría'} · ${dateShort(t.date)}`,
          problem: !t.amountCents ? 'Falta el monto' : !t.categoryId ? 'Falta la categoría' : null,
        })),
        ...proposal.plan.budgets.map((b, i): Row => ({ key: `bu${i}`, group: 'bu', title: b.name, detail: `${m(b.amountCents)} ${PERIOD[b.period]}`, problem: null })),
        ...proposal.plan.goals.map((g, i): Row => ({ key: `go${i}`, group: 'go', title: g.name, detail: `${KIND[g.kind]} · ${m(g.targetCents)} para el ${dateShort(g.targetDate)}`, problem: null })),
      ]
    : []
  const chosen = rows.filter((r) => !r.problem && !off.has(r.key))

  const run = (input: string) => {
    setError('')
    startThinking(async () => {
      const r = await assistantPlanAction(input)
      if (!r.ok) return void setError(r.error)
      setProposal({ plan: r.plan, engine: r.engine, external: r.external, ask: r.ask })
      setOff(new Set())
    })
  }

  const readFile = async (f: File | undefined) => {
    if (!f) return
    if (f.size > MAX_FILE) return void setError('El archivo es muy grande (máximo 200 KB). Probá con uno más chico.')
    if (/\.(png|jpe?g|webp|gif|pdf|xlsx?|docx?)$/i.test(f.name) || (f.type && !/^text\/|json|csv/.test(f.type))) return void setError('Por ahora leo archivos de texto: .csv, .txt o .tsv. Para Excel, guardalo como CSV.')
    setFileName(f.name)
    setText(await f.text())
    setError('')
  }

  const apply = () => {
    if (!proposal) return
    const keep = (prefix: string, i: number) => !off.has(`${prefix}${i}`)
    const plan: Plan = {
      transactions: proposal.plan.transactions.filter((_, i) => keep('tx', i) && !rows.find((r) => r.key === `tx${i}`)?.problem),
      budgets: proposal.plan.budgets.filter((_, i) => keep('bu', i)),
      goals: proposal.plan.goals.filter((_, i) => keep('go', i)),
    }
    startSaving(async () => {
      const r = await applyPlanAction(plan)
      if (!r.ok) return void toast.error(r.error)
      const c = r.created
      const parts = [c.transactions && `${c.transactions} movimiento${c.transactions === 1 ? '' : 's'}`, c.budgets && `${c.budgets} presupuesto${c.budgets === 1 ? '' : 's'}`, c.goals && `${c.goals} objetivo${c.goals === 1 ? '' : 's'}`].filter(Boolean)
      toast.success(`Cargué ${parts.join(', ') || 'nada'}${r.skipped ? ` (${r.skipped} quedaron afuera)` : ''}`)
      setProposal(null)
      setText('')
      setFileName('')
      setVisible(false)
      router.refresh()
    })
  }

  const groups: { id: Row['group']; label: string }[] = [
    { id: 'tx', label: 'Movimientos' },
    { id: 'bu', label: 'Presupuestos' },
    { id: 'go', label: 'Objetivos' },
  ]

  return (
    <section aria-labelledby="assistant-title" className="glow-ring relative mb-8 overflow-hidden rounded-card bg-surface p-5 sm:p-6">
      <div className="pointer-events-none absolute -top-24 -left-10 size-72 rounded-full bg-[radial-gradient(closest-side,var(--glow),transparent)]" aria-hidden />
      <div className="relative flex items-start gap-3">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent-soft">
          <Sparkles className="size-4 text-accent" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <h2 id="assistant-title" className="display text-[26px]">
            ¿Qué querés cargar hoy?
          </h2>
          <p className="mt-0.5 text-[13.5px] text-fg-2">Contame con tus palabras, o subí un archivo. Cargo movimientos, presupuestos y objetivos, y antes de guardar te muestro cómo quedan.</p>
        </div>
        <button onClick={() => setVisible(false)} aria-label="Cerrar asistente" className="-mt-1 -mr-1 flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-muted hover:bg-surface-2 hover:text-fg">
          <X className="size-4" />
        </button>
      </div>

      {!proposal ? (
        <form
          className="relative mt-4 space-y-3"
          onSubmit={(e) => {
            e.preventDefault()
            if (text.trim().length >= 3) run(text)
          }}
        >
          <div className="rounded-2xl border border-transparent bg-surface-2 p-1 transition-colors focus-within:border-fg/50 focus-within:bg-surface">
            <textarea
              aria-label="Texto a cargar"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey && text.trim().length >= 3) {
                  e.preventDefault()
                  run(text)
                }
              }}
              maxLength={30_000}
              rows={3}
              placeholder={'Ej: ayer gasté 4500 en pedidosya y 12000 en el súper\nPresupuesto de delivery 50000 por mes\nObjetivo: viaje a Brasil, 1.500.000 para diciembre'}
              className="block max-h-56 min-h-[84px] w-full resize-y bg-transparent px-3 py-2.5 text-[14px] outline-none placeholder:text-muted"
            />
            <div className="flex items-center justify-between gap-2 px-1.5 pb-1">
              <div className="flex min-w-0 items-center gap-1.5">
                <input ref={fileRef} type="file" accept=".csv,.txt,.tsv,text/plain,text/csv" className="sr-only" onChange={(e) => (readFile(e.target.files?.[0]), (e.target.value = ''))} aria-label="Subir archivo" />
                <button type="button" onClick={() => fileRef.current?.click()} className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-full px-2.5 text-[12.5px] text-fg-2 hover:bg-surface-3 hover:text-fg">
                  <Paperclip className="size-3.5" aria-hidden /> Archivo
                </button>
                {fileName && <span className="truncate text-[12px] text-muted">{fileName}</span>}
              </div>
              <Button type="submit" size="sm" loading={thinking} disabled={text.trim().length < 3}>
                Preparar <ArrowRight />
              </Button>
            </div>
          </div>
          {error && (
            <p className="text-[13px] text-critical" role="alert">
              {error}
            </p>
          )}
          <div className="flex flex-wrap gap-1.5">
            {EXAMPLES.map((ex) => (
              <button key={ex} type="button" onClick={() => setText((t) => (t ? `${t}\n${ex}` : ex))} className="h-8 cursor-pointer rounded-full bg-surface-2 px-3 text-[12.5px] text-fg-2 transition-colors hover:bg-surface-3 hover:text-fg">
                {ex}
              </button>
            ))}
          </div>
        </form>
      ) : (
        <div className="relative mt-4 space-y-4">
          {proposal.ask && <CurrencyAsk ask={proposal.ask} onAnswered={() => setProposal({ ...proposal, ask: null })} />}
          <p className="text-[13px] text-fg-2">Esto es lo que voy a cargar. Destildá lo que no quieras.</p>
          {groups.map((g) => {
            const list = rows.filter((r) => r.group === g.id)
            if (!list.length) return null
            return (
              <div key={g.id}>
                <p className="label-caps mb-1.5 !text-[10px]">
                  {g.label} · {list.length}
                </p>
                <ul className="max-h-64 divide-y divide-border overflow-y-auto rounded-2xl border border-border bg-surface-2/50">
                  {list.map((r) => (
                    <li key={r.key} className="flex items-center gap-3 px-3.5 py-2.5">
                      <input type="checkbox" aria-label={`Cargar ${r.title}`} disabled={!!r.problem} checked={!r.problem && !off.has(r.key)} onChange={() => setOff((s) => { const n = new Set(s); if (n.has(r.key)) n.delete(r.key); else n.add(r.key); return n })} className="size-4 shrink-0 accent-[var(--accent)]" />
                      <div className="min-w-0 flex-1">
                        <p className="money truncate text-[13.5px] font-medium">{r.title}</p>
                        <p className={cn('truncate text-[12px]', r.problem ? 'text-critical' : 'text-muted')}>{r.problem ? `${r.problem}. Cargalo con el botón Nuevo.` : r.detail}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
            <Button variant="ghost" size="sm" onClick={() => setProposal(null)}>
              Volver a escribir
            </Button>
            <Button onClick={apply} loading={saving} disabled={!chosen.length || !!proposal.ask}>
              <Check /> Cargar {chosen.length} {chosen.length === 1 ? 'cosa' : 'cosas'}
            </Button>
          </div>
          <p className="text-center text-[11.5px] text-muted">{proposal.external ? `Interpretado con ${proposal.engine}. Se envió el texto, la fecha de hoy y los nombres de tus categorías.` : 'Interpretado en el servidor de Caudal, sin enviar nada a terceros.'}</p>
        </div>
      )}
    </section>
  )
}
