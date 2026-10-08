'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ArrowRight, Check, ChevronDown, Pencil, Sparkles } from 'lucide-react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Field, Input, NativeSelect } from '@/components/ui/input'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/misc'
import { CategoryIcon } from './icons'
import { CurrencyAsk } from './currency-ask'
import { MAX_AMOUNT_CENTS, currencySymbol, dateLong, money, parseMoneyInput } from '@/lib/format'
import { cn } from '@/lib/utils'
import { deleteTransactionsAction, saveTransactionAction } from '@/modules/finance/actions'
import { parseTxnAction } from '@/modules/ai/actions'
import type { Ask, ParsedTxn } from '@/modules/ai/parse-txn'

export type CatOption = { id: string; name: string; kind: 'expense' | 'income'; parentId: string | null; icon: string; usage: number }

export type TxnDraft = {
  id?: string
  type: 'expense' | 'income'
  amount: string
  date: string
  description: string
  categoryId: string | null
  subcategoryId: string | null
  paymentMethod: string
  recurrence: 'none' | 'weekly' | 'monthly' | 'yearly'
  tags: string
}

type Ctx = { open: (draft?: Partial<TxnDraft>) => void }
const QuickAddContext = createContext<Ctx>({ open: () => {} })
export const useQuickAdd = () => useContext(QuickAddContext)

export const PAYMENT_METHODS = [
  { value: 'debito', label: 'Débito' },
  { value: 'credito', label: 'Crédito' },
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'transferencia', label: 'Transferencia' },
  { value: 'billetera', label: 'Billetera virtual' },
]

const blank = (today: string): TxnDraft => ({ type: 'expense', amount: '', date: today, description: '', categoryId: null, subcategoryId: null, paymentMethod: 'debito', recurrence: 'none', tags: '' })

export function QuickAddProvider({ categories, today, children }: { categories: CatOption[]; today: string; children: React.ReactNode }) {
  const [isOpen, setOpen] = useState(false)
  const [draft, setDraft] = useState<TxnDraft>(blank(today))
  // sin borrador: arranca por la IA (escribís y confirma). con borrador o al editar: va directo al formulario
  const [mode, setMode] = useState<'ai' | 'form'>('ai')
  const open = useCallback(
    (d?: Partial<TxnDraft>) => {
      setDraft({ ...blank(today), ...d })
      setMode(d && Object.keys(d).length ? 'form' : 'ai')
      setOpen(true)
    },
    [today],
  )

  // atajo global: "n" abre el alta rápida (fuera de inputs)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement
      if (e.key === 'n' && !e.metaKey && !e.ctrlKey && !e.altKey && !['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName) && !t.isContentEditable) {
        e.preventDefault()
        open()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const value = useMemo(() => ({ open }), [open])
  return (
    <QuickAddContext.Provider value={value}>
      {children}
      <Dialog open={isOpen} onOpenChange={setOpen}>
        <DialogContent title={draft.id ? 'Editar movimiento' : 'Nuevo movimiento'} description={draft.id ? undefined : mode === 'ai' ? 'Contalo con tus palabras y lo preparamos.' : 'Monto, categoría y listo. El resto es opcional.'}>
          {isOpen && mode === 'ai' && (
            <AiCapture
              categories={categories}
              today={today}
              onDone={() => setOpen(false)}
              onManual={(d) => {
                setDraft({ ...blank(today), ...d })
                setMode('form')
              }}
            />
          )}
          {isOpen && mode === 'form' && <TxnForm key={draft.id ?? `new-${draft.amount}-${draft.categoryId}`} initial={draft} categories={categories} today={today} onDone={() => setOpen(false)} />}
        </DialogContent>
      </Dialog>
    </QuickAddContext.Provider>
  )
}

/** guarda un movimiento y avisa con un toast que permite deshacer. lo usan el formulario y la carga con IA */
function useSaveTxn(categories: CatOption[]) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const save = (
    v: { type: 'expense' | 'income'; amountCents: number; date: string; description: string; categoryId: string | null; subcategoryId: string | null; paymentMethod: string; recurrence: TxnDraft['recurrence']; tags?: string[] },
    id: string | undefined,
    cb: { onDone: () => void; onError?: (r: { error: string; fieldErrors?: Record<string, string> }) => void },
  ) =>
    start(async () => {
      const res = await saveTransactionAction({ ...v, paymentMethod: v.paymentMethod as 'debito', tags: v.tags ?? [] }, id)
      if (!res.ok) {
        cb.onError?.(res)
        toast.error(res.error)
        return
      }
      const cat = categories.find((c) => c.id === v.categoryId)
      const newId = res.data?.id
      cb.onDone()
      toast.success(`${id ? 'Movimiento actualizado' : v.type === 'expense' ? 'Gasto registrado' : 'Ingreso registrado'} · ${money(v.amountCents)}${cat ? ` en ${cat.name}` : ''}`, {
        action:
          !id && newId
            ? {
                label: 'Deshacer',
                onClick: async () => {
                  await deleteTransactionsAction([newId])
                  router.refresh()
                  toast('Se deshizo el movimiento')
                },
              }
            : undefined,
      })
      router.refresh()
    })
  return { save, pending }
}

/** el monto se limita mientras se escribe: un número gigante rompía el layout y el servidor lo rechaza igual */
function cleanAmount(next: string): { value: string; tooBig: boolean } {
  let value = next.replace(/[^\d.,]/g, '')
  let tooBig = false
  // un pegado gigante se recorta al último valor permitido
  while (value && (parseMoneyInput(value) ?? 0) > MAX_AMOUNT_CENTS) {
    value = value.slice(0, -1)
    tooBig = true
  }
  return { value: value.slice(0, 20), tooBig }
}
const MAX_LABEL = `Máximo ${money(MAX_AMOUNT_CENTS)}`

export function TxnForm({ initial, categories, today, onDone }: { initial: TxnDraft; categories: CatOption[]; today: string; onDone: () => void }) {
  const [d, setD] = useState<TxnDraft>(initial)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const { save, pending } = useSaveTxn(categories)
  const amountRef = useRef<HTMLInputElement>(null)
  const set = <K extends keyof TxnDraft>(k: K, v: TxnDraft[K]) => {
    setD((p) => ({ ...p, [k]: v }))
    if (errors[k]) setErrors((e) => ({ ...e, [k]: '' }))
  }

  const roots = categories.filter((c) => c.kind === d.type && !c.parentId)
  const top = [...roots].sort((a, b) => b.usage - a.usage).slice(0, 8)
  const subs = categories.filter((c) => c.parentId && c.parentId === d.categoryId)
  const cents = parseMoneyInput(d.amount)
  const yesterday = new Date(new Date(`${today}T00:00:00Z`).getTime() - 86_400_000).toISOString().slice(0, 10)

  useEffect(() => {
    amountRef.current?.focus()
  }, [])

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const errs: Record<string, string> = {}
    if (!cents || cents <= 0) errs.amount = 'Ingresá un monto mayor a 0'
    if (!d.categoryId) errs.categoryId = 'Elegí una categoría'
    if (!d.date) errs.date = 'Elegí una fecha'
    if (Object.keys(errs).length) {
      setErrors(errs)
      if (errs.amount) amountRef.current?.focus()
      return
    }
    save(
      {
        type: d.type,
        amountCents: cents!,
        date: d.date,
        description: d.description,
        categoryId: d.categoryId,
        subcategoryId: d.subcategoryId,
        paymentMethod: d.paymentMethod,
        recurrence: d.recurrence,
        tags: d.tags.split(',').map((t) => t.trim()).filter(Boolean),
      },
      d.id,
      { onDone, onError: (r) => setErrors({ ...(r.fieldErrors ?? {}), amount: r.fieldErrors?.amountCents ?? '' }) },
    )
  }

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <div role="radiogroup" aria-label="Tipo" className="grid grid-cols-2 gap-1 rounded-full bg-surface-2 p-1">
        {(['expense', 'income'] as const).map((t) => (
          <button
            key={t}
            type="button"
            role="radio"
            aria-checked={d.type === t}
            onClick={() => setD((p) => ({ ...p, type: t, categoryId: null, subcategoryId: null }))}
            className={cn('h-9 cursor-pointer rounded-full text-sm font-medium transition-colors', d.type === t ? 'bg-fg text-bg' : 'text-muted hover:text-fg')}
          >
            {t === 'expense' ? 'Gasto' : 'Ingreso'}
          </button>
        ))}
      </div>

      <Field label="Monto" htmlFor="qa-amount" error={errors.amount}>
        <div className="relative">
          <span className="pointer-events-none absolute top-1/2 left-5 -translate-y-1/2 font-figure text-3xl text-muted">{currencySymbol()}</span>
          <Input
            ref={amountRef}
            id="qa-amount"
            inputMode="decimal"
            autoComplete="off"
            placeholder="0"
            value={d.amount}
            onChange={(e) => {
              const r = cleanAmount(e.target.value)
              set('amount', r.value)
              if (r.tooBig) setErrors((x) => ({ ...x, amount: MAX_LABEL }))
            }}
            aria-invalid={!!errors.amount}
            className={cn('num h-20 min-w-0 rounded-2xl font-figure font-medium tracking-[-0.03em]', currencySymbol().length > 1 ? 'pl-[4.5rem]' : 'pl-12', d.amount.length > 13 ? 'text-[28px]' : 'text-[40px]')}
          />
        </div>
      </Field>

      <fieldset>
        <legend className="mb-2 text-[12px] font-medium text-fg-2">Categoría</legend>
        <div className="flex flex-wrap gap-1.5">
          {top.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => {
                set('categoryId', c.id)
                set('subcategoryId', null)
              }}
              aria-pressed={d.categoryId === c.id}
              className={cn('inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full border px-3.5 text-[13px] transition-colors', d.categoryId === c.id ? 'border-fg bg-fg text-bg' : 'border-transparent bg-surface-2 text-fg-2 hover:bg-surface-3 hover:text-fg')}
            >
              <CategoryIcon icon={c.icon} className="size-3.5" />
              {c.name}
            </button>
          ))}
          {roots.length > top.length && (
            <NativeSelect aria-label="Otras categorías" value={top.some((c) => c.id === d.categoryId) ? '' : (d.categoryId ?? '')} onChange={(e) => set('categoryId', e.target.value || null)} className="h-9 w-auto rounded-full py-0 text-[13px]">
              <option value="">Otra…</option>
              {roots
                .filter((c) => !top.includes(c))
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
            </NativeSelect>
          )}
        </div>
        {errors.categoryId && (
          <p className="mt-1.5 text-[13px] text-critical" role="alert">
            {errors.categoryId}
          </p>
        )}
      </fieldset>

      <div className="grid grid-cols-[1fr_auto] items-end gap-2">
        <Field label="Descripción" htmlFor="qa-desc" optional>
          <Input id="qa-desc" placeholder="Ej: PedidosYa, Coto, alquiler" value={d.description} onChange={(e) => set('description', e.target.value)} maxLength={140} />
        </Field>
        <Field label="Fecha" htmlFor="qa-date" error={errors.date}>
          <div className="flex gap-1">
            {[
              { v: today, l: 'Hoy' },
              { v: yesterday, l: 'Ayer' },
            ].map((o) => (
              <button key={o.l} type="button" onClick={() => set('date', o.v)} aria-pressed={d.date === o.v} className={cn('h-11 cursor-pointer rounded-full border px-3.5 text-[13px]', d.date === o.v ? 'border-fg bg-fg text-bg' : 'border-transparent bg-surface-2 text-fg-2 hover:text-fg')}>
                {o.l}
              </button>
            ))}
            <Input id="qa-date" type="date" value={d.date} max="2100-12-31" onChange={(e) => set('date', e.target.value)} className="w-[138px]" aria-invalid={!!errors.date} />
          </div>
        </Field>
      </div>

      <Collapsible defaultOpen={!!(initial.subcategoryId || initial.recurrence !== 'none' || initial.tags || initial.id)}>
        <CollapsibleTrigger className="group flex cursor-pointer items-center gap-1 text-[13px] font-medium text-fg-2 hover:text-fg">
          Más detalles <ChevronDown className="size-4 transition-transform group-data-[state=open]:rotate-180" />
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-3 grid gap-3 sm:grid-cols-2">
          <Field label="Subcategoría" htmlFor="qa-sub" optional>
            <NativeSelect id="qa-sub" value={d.subcategoryId ?? ''} onChange={(e) => set('subcategoryId', e.target.value || null)} disabled={!subs.length}>
              <option value="">{subs.length ? 'Ninguna' : 'Sin subcategorías'}</option>
              {subs.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </NativeSelect>
          </Field>
          <Field label="Método de pago" htmlFor="qa-pay">
            <NativeSelect id="qa-pay" value={d.paymentMethod} onChange={(e) => set('paymentMethod', e.target.value)}>
              {PAYMENT_METHODS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </NativeSelect>
          </Field>
          <Field label="Frecuencia" htmlFor="qa-rec">
            <NativeSelect id="qa-rec" value={d.recurrence} onChange={(e) => set('recurrence', e.target.value as TxnDraft['recurrence'])}>
              <option value="none">Único</option>
              <option value="weekly">Recurrente semanal</option>
              <option value="monthly">Recurrente mensual</option>
              <option value="yearly">Recurrente anual</option>
            </NativeSelect>
          </Field>
          <Field label="Etiquetas" htmlFor="qa-tags" optional hint="Separadas por coma">
            <Input id="qa-tags" placeholder="viaje, trabajo" value={d.tags} onChange={(e) => set('tags', e.target.value)} />
          </Field>
        </CollapsibleContent>
      </Collapsible>

      <div className="flex items-center justify-between gap-3 border-t border-border pt-4">
        <p className="hidden text-[12px] text-muted sm:block">
          <kbd className="rounded-full border border-border-strong px-1.5 font-mono text-[11px]">Enter</kbd> guarda
        </p>
        <Button type="submit" size="lg" loading={pending} className="min-w-0 max-w-full flex-1 sm:flex-none">
          <span className="truncate">{d.id ? 'Guardar cambios' : cents ? `Registrar ${money(cents, { decimals: cents % 100 !== 0 || undefined })}` : 'Registrar'}</span>
        </Button>
      </div>
    </form>
  )
}

const EXAMPLES = ['pedidosya 4500 ayer', 'cobré el sueldo 1.200.000', 'uber 9700 con tarjeta', 'netflix 8999 todos los meses']
const RECURRENCE_LABEL: Record<TxnDraft['recurrence'], string> = { none: 'Único', weekly: 'Semanal', monthly: 'Mensual', yearly: 'Anual' }

const asDraft = (p: ParsedTxn): Partial<TxnDraft> => ({
  type: p.type,
  amount: p.amountCents ? String(p.amountCents / 100) : '',
  date: p.date,
  description: p.description,
  categoryId: p.categoryId,
  subcategoryId: p.subcategoryId,
  paymentMethod: p.paymentMethod,
  recurrence: p.recurrence,
})

/**
 * paso 1 del alta: la persona escribe el movimiento, la IA lo interpreta y lo muestra cómo quedaría.
 * puede pedir cambios en lenguaje natural, abrir el formulario completo o confirmar con un botón.
 */
function AiCapture({ categories, today, onDone, onManual }: { categories: CatOption[]; today: string; onDone: () => void; onManual: (d: Partial<TxnDraft>) => void }) {
  const [text, setText] = useState('')
  const [fix, setFix] = useState('')
  const [proposal, setProposal] = useState<{ draft: ParsedTxn; engine: string; external: boolean; ask: Ask | null } | null>(null)
  const [error, setError] = useState('')
  const [thinking, startThinking] = useTransition()
  const { save, pending } = useSaveTxn(categories)
  const inputRef = useRef<HTMLInputElement>(null)
  const confirmRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const run = (input: { text: string; previous?: ParsedTxn; instruction?: string }) => {
    setError('')
    startThinking(async () => {
      const r = await parseTxnAction(input)
      if (!r.ok) return void setError(r.error)
      setProposal((prev) => ({ draft: r.draft, engine: r.engine, external: r.external, ask: input.previous ? (prev?.ask ?? null) : r.ask }))
      setFix('')
      // Enter vuelve a confirmar sin tocar el mouse
      setTimeout(() => confirmRef.current?.focus(), 0)
    })
  }

  if (!proposal) {
    return (
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault()
          if (text.trim().length >= 2) run({ text })
        }}
      >
        <div className="relative">
          <Sparkles className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-accent" aria-hidden />
          <Input ref={inputRef} aria-label="Contá el movimiento" autoComplete="off" maxLength={300} value={text} onChange={(e) => setText(e.target.value)} placeholder="Ej: pedidosya 4500 ayer" className="h-14 rounded-2xl pl-11 text-[15px]" aria-invalid={!!error} />
        </div>
        {error && (
          <p className="text-[13px] text-critical" role="alert">
            {error}
          </p>
        )}
        <div className="flex flex-wrap gap-1.5" aria-label="Ejemplos">
          {EXAMPLES.map((ex) => (
            <button key={ex} type="button" onClick={() => setText(ex)} className="h-8 cursor-pointer rounded-full bg-surface-2 px-3 text-[12.5px] text-fg-2 transition-colors hover:bg-surface-3 hover:text-fg">
              {ex}
            </button>
          ))}
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-border pt-4">
          <button type="button" onClick={() => onManual({})} className="cursor-pointer text-[13px] font-medium text-fg-2 hover:text-fg">
            Cargar a mano
          </button>
          <Button type="submit" size="lg" loading={thinking} disabled={text.trim().length < 2}>
            Preparar <ArrowRight />
          </Button>
        </div>
      </form>
    )
  }

  const p = proposal.draft
  const cat = categories.find((c) => c.id === p.categoryId)
  const sub = categories.find((c) => c.id === p.subcategoryId)
  const missing = [!p.amountCents && 'el monto', !p.categoryId && 'la categoría'].filter(Boolean) as string[]
  const roots = categories.filter((c) => c.kind === p.type && !c.parentId).sort((a, b) => b.usage - a.usage)
  const yesterday = new Date(new Date(`${today}T00:00:00Z`).getTime() - 86_400_000).toISOString().slice(0, 10)
  const when = p.date === today ? 'Hoy' : p.date === yesterday ? 'Ayer' : null
  const patch = (x: Partial<ParsedTxn>) => setProposal({ ...proposal, draft: { ...p, ...x } })

  const confirm = () => {
    if (!p.amountCents || !p.categoryId) return
    save({ type: p.type, amountCents: p.amountCents, date: p.date, description: p.description, categoryId: p.categoryId, subcategoryId: p.subcategoryId, paymentMethod: p.paymentMethod, recurrence: p.recurrence }, undefined, { onDone })
  }

  return (
    <div className="space-y-4">
      <p className="text-[12px] text-muted">
        “{text}” <span aria-hidden>·</span> así quedaría
      </p>

      <section aria-label="Movimiento preparado" className="relative overflow-hidden rounded-2xl border border-border-strong bg-surface-2 p-5">
        <div className="pointer-events-none absolute -top-16 -right-10 size-48 rounded-full bg-[radial-gradient(closest-side,var(--glow),transparent)]" aria-hidden />
        <div className="relative flex items-start justify-between gap-3">
          <span className="rounded-full bg-surface-3 px-2.5 py-0.5 text-[12px] font-medium text-fg-2">{p.type === 'expense' ? 'Gasto' : 'Ingreso'}</span>
          <span className="text-[12px] text-muted">{when ? `${when} · ` : ''}{dateLong(p.date, p.date.slice(0, 4) !== today.slice(0, 4))}</span>
        </div>
        <p className="money relative mt-3 truncate font-figure text-[34px] leading-none font-medium tracking-[-0.03em]">{p.amountCents ? `${p.type === 'expense' ? '−' : '+'}${money(p.amountCents, { decimals: p.amountCents % 100 !== 0 || undefined })}` : <span className="text-muted">Sin monto</span>}</p>
        <dl className="relative mt-4 grid gap-x-6 gap-y-2.5 text-[13px] sm:grid-cols-2">
          <div>
            <dt className="text-muted">Categoría</dt>
            <dd className="mt-0.5 flex items-center gap-1.5 font-medium">{cat ? <><CategoryIcon icon={sub?.icon ?? cat.icon} className="size-3.5 text-muted" /> {sub ? `${cat.name} · ${sub.name}` : cat.name}</> : <span className="text-muted">Sin categoría</span>}</dd>
          </div>
          <div>
            <dt className="text-muted">Descripción</dt>
            <dd className="mt-0.5 truncate font-medium">{p.description || <span className="font-normal text-muted">Sin descripción</span>}</dd>
          </div>
          <div>
            <dt className="text-muted">Medio de pago</dt>
            <dd className="mt-0.5 font-medium">{PAYMENT_METHODS.find((m) => m.value === p.paymentMethod)?.label}</dd>
          </div>
          <div>
            <dt className="text-muted">Frecuencia</dt>
            <dd className="mt-0.5 font-medium">{RECURRENCE_LABEL[p.recurrence]}</dd>
          </div>
        </dl>
      </section>

      {proposal.ask && <CurrencyAsk ask={proposal.ask} onAnswered={() => setProposal({ ...proposal, ask: null })} />}

      {!p.categoryId && (
        <fieldset>
          <legend className="mb-1.5 text-[12px] font-medium text-fg-2">No pude deducir la categoría. ¿Cuál es?</legend>
          <div className="flex flex-wrap gap-1.5">
            {roots.slice(0, 8).map((c) => (
              <button key={c.id} type="button" onClick={() => patch({ categoryId: c.id, subcategoryId: null })} className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-full bg-surface-2 px-3 text-[12.5px] text-fg-2 transition-colors hover:bg-surface-3 hover:text-fg">
                <CategoryIcon icon={c.icon} className="size-3.5" />
                {c.name}
              </button>
            ))}
          </div>
        </fieldset>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault()
          if (fix.trim()) run({ text, previous: p, instruction: fix })
        }}
      >
        <label htmlFor="qa-fix" className="mb-1.5 block text-[12px] font-medium text-fg-2">
          {missing.length ? `Falta ${missing.join(' y ')}. Decime cómo completarlo o cambiá lo que quieras` : '¿Querés cambiar algo?'}
        </label>
        <div className="relative">
          <Input id="qa-fix" value={fix} onChange={(e) => setFix(e.target.value)} maxLength={300} autoComplete="off" placeholder="Ej: era ayer · poné 5000 · es en efectivo" className="pr-24" />
          <button type="submit" disabled={!fix.trim() || thinking} className="absolute top-1/2 right-1.5 h-8 -translate-y-1/2 cursor-pointer rounded-full px-3 text-[12.5px] font-medium text-fg-2 hover:bg-surface-3 hover:text-fg disabled:opacity-40">
            {thinking ? 'Un seg…' : 'Aplicar'}
          </button>
        </div>
        {error && (
          <p className="mt-1.5 text-[13px] text-critical" role="alert">
            {error}
          </p>
        )}
      </form>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
        <div className="flex items-center gap-1">
          <Button type="button" variant="ghost" size="sm" onClick={() => onManual(asDraft(p))}>
            <Pencil /> Editar detalles
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => setProposal(null)}>
            Empezar de nuevo
          </Button>
        </div>
        <Button ref={confirmRef} type="button" size="lg" loading={pending} disabled={missing.length > 0 || !!proposal.ask} onClick={confirm} className="min-w-0 max-w-full flex-1 sm:flex-none">
          <Check />
          <span className="truncate">{p.amountCents ? `Confirmar ${money(p.amountCents, { decimals: p.amountCents % 100 !== 0 || undefined })}` : 'Confirmar'}</span>
        </Button>
      </div>
      <p className="text-center text-[11.5px] text-muted">{proposal.external ? `Interpretado con ${proposal.engine}. Se envió solo el texto que escribiste y los nombres de tus categorías.` : 'Interpretado en el servidor de Caudal, sin enviar nada a terceros.'}</p>
    </div>
  )
}
