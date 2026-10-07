'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ChevronDown } from 'lucide-react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Field, Input, NativeSelect } from '@/components/ui/input'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/misc'
import { CategoryIcon } from './icons'
import { money, parseMoneyInput } from '@/lib/format'
import { cn } from '@/lib/utils'
import { deleteTransactionsAction, saveTransactionAction } from '@/modules/finance/actions'

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
  const open = useCallback(
    (d?: Partial<TxnDraft>) => {
      setDraft({ ...blank(today), ...d })
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
        <DialogContent title={draft.id ? 'Editar movimiento' : 'Nuevo movimiento'} description={draft.id ? undefined : 'Monto, categoría y listo. El resto es opcional.'}>
          {isOpen && <TxnForm key={draft.id ?? 'new'} initial={draft} categories={categories} today={today} onDone={() => setOpen(false)} />}
        </DialogContent>
      </Dialog>
    </QuickAddContext.Provider>
  )
}

export function TxnForm({ initial, categories, today, onDone }: { initial: TxnDraft; categories: CatOption[]; today: string; onDone: () => void }) {
  const router = useRouter()
  const [d, setD] = useState<TxnDraft>(initial)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [pending, start] = useTransition()
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
    start(async () => {
      const res = await saveTransactionAction(
        {
          type: d.type,
          amountCents: cents!,
          date: d.date,
          description: d.description,
          categoryId: d.categoryId,
          subcategoryId: d.subcategoryId,
          paymentMethod: d.paymentMethod as 'debito',
          recurrence: d.recurrence,
          tags: d.tags.split(',').map((t) => t.trim()).filter(Boolean),
        },
        d.id,
      )
      if (!res.ok) {
        setErrors({ ...(res.fieldErrors ?? {}), amount: res.fieldErrors?.amountCents ?? '' })
        toast.error(res.error)
        return
      }
      const cat = categories.find((c) => c.id === d.categoryId)
      const newId = res.data?.id
      onDone()
      toast.success(`${d.id ? 'Movimiento actualizado' : d.type === 'expense' ? 'Gasto registrado' : 'Ingreso registrado'} · ${money(cents!)}${cat ? ` en ${cat.name}` : ''}`, {
        action:
          !d.id && newId
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
          <span className="pointer-events-none absolute top-1/2 left-5 -translate-y-1/2 font-mono text-3xl text-muted">$</span>
          <Input
            ref={amountRef}
            id="qa-amount"
            inputMode="decimal"
            autoComplete="off"
            placeholder="0"
            value={d.amount}
            onChange={(e) => set('amount', e.target.value)}
            aria-invalid={!!errors.amount}
            className="num h-20 rounded-2xl pl-12 font-mono text-[40px] font-medium tracking-[-0.04em]"
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
        <Button type="submit" size="lg" loading={pending} className="w-full sm:w-auto">
          {d.id ? 'Guardar cambios' : cents ? `Registrar ${money(cents)}` : 'Registrar'}
        </Button>
      </div>
    </form>
  )
}
