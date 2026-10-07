'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ArrowDownUp, ArrowLeftRight, Filter, Plus, Repeat, Search, SearchX, Trash2, Upload, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input, NativeSelect } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Dialog, SheetContent } from '@/components/ui/dialog'
import { ConfirmDialog } from '@/components/ui/alert-dialog'
import { Popover, PopoverContent, PopoverTrigger, Segmented } from '@/components/ui/misc'
import { PageHeader, EmptyState } from '@/components/app/states'
import { CategoryIcon } from '@/components/app/icons'
import { Money } from '@/components/app/money'
import { PAYMENT_METHODS, TxnForm, useQuickAdd, type CatOption, type TxnDraft } from '@/components/app/quick-add'
import { ImportDialog } from './import-dialog'
import { dateLong, money, parseMoneyInput, plural } from '@/lib/format'
import { cn } from '@/lib/utils'
import { deleteTransactionsAction } from '@/modules/finance/actions'
import type { Txn } from '@/modules/analytics/types'

export type Row = Txn & { categoryName: string; categoryIcon: string; colorSlot: number | null; subcategoryName: string | null; detectedRecurring: boolean }
export type CatLite = { id: string; name: string; kind: 'expense' | 'income'; parentId: string | null; icon: string; group: string | null }

type Filters = {
  q: string
  type: 'all' | 'expense' | 'income'
  range: 'month' | 'last-month' | '90d' | 'year' | 'all' | 'custom'
  from: string
  to: string
  cats: string[]
  methods: string[]
  min: string
  max: string
  recurringOnly: boolean
  sort: 'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc'
}

const RANGE_LABEL: Record<Filters['range'], string> = { month: 'Este mes', 'last-month': 'Mes pasado', '90d': 'Últimos 90 días', year: 'Este año', all: 'Todo', custom: 'Personalizado' }
const PAGE = 60

function rangeBounds(f: Filters, today: string): { from: string; to: string } | null {
  const y = today.slice(0, 4)
  const m = today.slice(0, 7)
  switch (f.range) {
    case 'month':
      return { from: `${m}-01`, to: today }
    case 'last-month': {
      const d = new Date(`${m}-01T00:00:00Z`)
      d.setUTCMonth(d.getUTCMonth() - 1)
      const start = d.toISOString().slice(0, 10)
      const end = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).toISOString().slice(0, 10)
      return { from: start, to: end }
    }
    case '90d':
      return { from: new Date(new Date(`${today}T00:00:00Z`).getTime() - 89 * 86_400_000).toISOString().slice(0, 10), to: today }
    case 'year':
      return { from: `${y}-01-01`, to: today }
    case 'custom':
      return { from: f.from || '0000-01-01', to: f.to || '9999-12-31' }
    default:
      return null
  }
}

const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

export function TransactionsView({ rows, categories, today, initialQuery, openImport, prefill }: { rows: Row[]; categories: CatLite[]; today: string; initialQuery: string; openImport: boolean; prefill: Partial<TxnDraft> | null }) {
  const router = useRouter()
  const quick = useQuickAdd()
  const [f, setF] = useState<Filters>({ q: initialQuery, type: 'all', range: initialQuery ? 'all' : 'month', from: '', to: '', cats: [], methods: [], min: '', max: '', recurringOnly: false, sort: 'date-desc' })
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [limit, setLimit] = useState(PAGE)
  const [editing, setEditing] = useState<Row | null>(null)
  const [importOpen, setImportOpen] = useState(openImport)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [deleting, startDelete] = useTransition()
  const set = <K extends keyof Filters>(k: K, v: Filters[K]) => {
    setF((p) => ({ ...p, [k]: v }))
    setLimit(PAGE)
  }

  // prefill desde otras pantallas (ej: "registrar reserva" en calendario)
  useEffect(() => {
    if (prefill) {
      quick.open(prefill)
      router.replace('/movimientos')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const filtered = useMemo(() => {
    const b = rangeBounds(f, today)
    const q = norm(f.q.trim())
    const min = parseMoneyInput(f.min)
    const max = parseMoneyInput(f.max)
    const out = rows.filter((r) => {
      if (f.type !== 'all' && r.type !== f.type) return false
      if (b && (r.date < b.from || r.date > b.to)) return false
      if (f.cats.length && !f.cats.includes(r.categoryId ?? '')) return false
      if (f.methods.length && !f.methods.includes(r.paymentMethod)) return false
      if (f.recurringOnly && !r.detectedRecurring) return false
      if (min !== null && r.amountCents < min) return false
      if (max !== null && r.amountCents > max) return false
      if (q && !norm(`${r.description} ${r.categoryName} ${r.subcategoryName ?? ''} ${r.tags.join(' ')}`).includes(q)) return false
      return true
    })
    const [key, dir] = f.sort.split('-')
    out.sort((a, b2) => {
      const d = key === 'date' ? a.date.localeCompare(b2.date) : a.amountCents - b2.amountCents
      return dir === 'asc' ? d : -d
    })
    return out
  }, [rows, f, today])

  const totals = useMemo(() => {
    let inc = 0
    let exp = 0
    for (const r of filtered) {
      if (r.type === 'income') inc += r.amountCents
      else exp += r.amountCents
    }
    return { inc, exp }
  }, [filtered])

  const visible = filtered.slice(0, limit)
  const byDay = f.sort.startsWith('date')
  const activeChips: { label: string; clear: () => void }[] = [
    ...(f.type !== 'all' ? [{ label: f.type === 'expense' ? 'Gastos' : 'Ingresos', clear: () => set('type', 'all') }] : []),
    ...f.cats.map((id) => ({ label: categories.find((c) => c.id === id)?.name ?? 'Categoría', clear: () => set('cats', f.cats.filter((x) => x !== id)) })),
    ...f.methods.map((m) => ({ label: PAYMENT_METHODS.find((p) => p.value === m)?.label ?? m, clear: () => set('methods', f.methods.filter((x) => x !== m)) })),
    ...(f.min || f.max ? [{ label: `Monto ${f.min ? `desde $${f.min}` : ''} ${f.max ? `hasta $${f.max}` : ''}`.trim(), clear: () => setF((p) => ({ ...p, min: '', max: '' })) }] : []),
    ...(f.recurringOnly ? [{ label: 'Solo recurrentes', clear: () => set('recurringOnly', false) }] : []),
  ]
  const clearAll = () => setF((p) => ({ ...p, q: '', type: 'all', cats: [], methods: [], min: '', max: '', recurringOnly: false, range: 'all' }))

  const catOptions: CatOption[] = categories.map((c) => ({ ...c, usage: rows.filter((r) => r.categoryId === c.id).length }))
  const toggle = (id: string) => setSelected((s) => {
    const n = new Set(s)
    if (n.has(id)) n.delete(id)
    else n.add(id)
    return n
  })
  const allVisibleSelected = visible.length > 0 && visible.every((r) => selected.has(r.id))

  const editDraft = (r: Row): TxnDraft => ({
    id: r.id,
    type: r.type,
    amount: String(r.amountCents / 100).replace('.', ','),
    date: r.date,
    description: r.description,
    categoryId: r.categoryId,
    subcategoryId: r.subcategoryId,
    paymentMethod: r.paymentMethod,
    recurrence: r.recurrence,
    tags: r.tags.join(', '),
  })

  // agrupado por día con subtotal (patrón monarch) cuando se ordena por fecha
  const groups: { date: string; rows: Row[]; net: number }[] = []
  for (const r of visible) {
    const last = groups.at(-1)
    if (byDay && last?.date === r.date) {
      last.rows.push(r)
      last.net += r.type === 'income' ? r.amountCents : -r.amountCents
    } else groups.push({ date: byDay ? r.date : `row-${r.id}`, rows: [r], net: r.type === 'income' ? r.amountCents : -r.amountCents })
  }

  if (!rows.length) {
    return (
      <>
        <PageHeader title="Movimientos" description="Todos tus ingresos y gastos." />
        <Card>
          <EmptyState icon={ArrowLeftRight} title="Todavía no hay movimientos" action={<div className="flex gap-2"><Button onClick={() => quick.open()}><Plus /> Nuevo movimiento</Button><Button variant="secondary" onClick={() => setImportOpen(true)}><Upload /> Importar CSV</Button></div>}>
            Registrá un gasto en segundos o importá el resumen de tu banco en CSV.
          </EmptyState>
        </Card>
        <ImportDialog open={importOpen} onOpenChange={setImportOpen} categories={categories} />
      </>
    )
  }

  return (
    <>
      <PageHeader
        title="Movimientos"
        description="Buscá, filtrá y editá. Click en un movimiento para ver el detalle."
        actions={
          <>
            <Button variant="secondary" onClick={() => setImportOpen(true)}>
              <Upload /> Importar
            </Button>
            <Button variant="accent" onClick={() => quick.open()}>
              <Plus /> Nuevo
            </Button>
          </>
        }
      />

      {/* resumen del filtro arriba de la tabla (mercury): neto, entró, salió */}
      <section aria-label="Resumen del filtro" aria-live="polite" className="mb-6 grid grid-cols-2 gap-px overflow-hidden rounded-card border border-border bg-border sm:grid-cols-[1.4fr_1fr_1fr]">
        <div className="col-span-2 bg-surface px-5 py-5 sm:col-span-1 sm:px-6">
          <p className="label-caps">Neto · {RANGE_LABEL[f.range].toLowerCase()}</p>
          <p className="mt-3 text-[36px] leading-none font-medium">
            <Money cents={totals.inc - totals.exp} sign />
          </p>
          <p className="mt-2 text-[13px] text-muted">{plural(filtered.length, 'movimiento', 'movimientos')}</p>
        </div>
        <div className="bg-surface px-5 py-4 sm:px-6 sm:py-5">
          <p className="label-caps">Entró</p>
          <p className="mt-3 text-[22px] leading-none font-medium">
            <Money cents={totals.inc} />
          </p>
        </div>
        <div className="bg-surface px-5 py-4 sm:px-6 sm:py-5">
          <p className="label-caps">Salió</p>
          <p className="mt-3 text-[22px] leading-none font-medium">
            <Money cents={totals.exp} />
          </p>
        </div>
      </section>

      {/* filtros: una fila arriba de todo lo que afectan */}
      <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
        <div className="relative lg:w-72">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" aria-hidden />
          <Input type="search" placeholder="Buscar descripción, categoría, etiqueta" value={f.q} onChange={(e) => set('q', e.target.value)} className="pl-9" aria-label="Buscar movimientos" />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Segmented label="Tipo" value={f.type} onChange={(v) => set('type', v)} options={[{ value: 'all', label: 'Todos' }, { value: 'expense', label: 'Gastos' }, { value: 'income', label: 'Ingresos' }]} />
          <NativeSelect aria-label="Período" value={f.range} onChange={(e) => set('range', e.target.value as Filters['range'])} className="h-9 w-auto">
            {Object.entries(RANGE_LABEL).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </NativeSelect>
          {f.range === 'custom' && (
            <div className="flex items-center gap-1">
              <Input type="date" aria-label="Desde" value={f.from} onChange={(e) => set('from', e.target.value)} className="h-9 w-[140px]" />
              <span className="text-muted">–</span>
              <Input type="date" aria-label="Hasta" value={f.to} onChange={(e) => set('to', e.target.value)} className="h-9 w-[140px]" />
            </div>
          )}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="secondary">
                <Filter /> Filtros {activeChips.filter((c) => c.label !== 'Gastos' && c.label !== 'Ingresos').length ? <Badge tone="accent">{activeChips.filter((c) => c.label !== 'Gastos' && c.label !== 'Ingresos').length}</Badge> : null}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <FilterPanel f={f} set={set} categories={categories} matchCount={filtered.length} />
            </PopoverContent>
          </Popover>
          <NativeSelect aria-label="Ordenar" value={f.sort} onChange={(e) => set('sort', e.target.value as Filters['sort'])} className="h-9 w-auto">
            <option value="date-desc">Más recientes</option>
            <option value="date-asc">Más antiguos</option>
            <option value="amount-desc">Mayor monto</option>
            <option value="amount-asc">Menor monto</option>
          </NativeSelect>
        </div>
      </div>

      {activeChips.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          {activeChips.map((c) => (
            <button key={c.label} onClick={c.clear} className="inline-flex cursor-pointer items-center gap-1 rounded-full border border-border bg-surface px-2.5 py-1 text-[12px] hover:border-border-strong">
              {c.label} <X className="size-3 text-muted" aria-label="Quitar filtro" />
            </button>
          ))}
          <button onClick={clearAll} className="cursor-pointer px-1 text-[12px] text-accent hover:underline">
            Limpiar filtros
          </button>
        </div>
      )}

      <Card className="mt-4 overflow-hidden">
        {filtered.length === 0 ? (
          <EmptyState icon={SearchX} title="Sin resultados" action={<Button variant="secondary" size="sm" onClick={clearAll}>Limpiar filtros</Button>}>
            Probá con otra búsqueda o ajustá los filtros.
          </EmptyState>
        ) : (
          <table className="w-full text-[13px] md:table-fixed">
            <caption className="sr-only">Movimientos filtrados</caption>
            <colgroup>
              <col className="w-10" />
              {!byDay && <col className="w-20" />}
              <col />
              <col className="hidden w-[26%] md:table-column" />
              <col className="hidden w-[15%] md:table-column" />
              <col className="w-32 md:w-36" />
            </colgroup>
            <thead className="hidden border-b border-border text-left font-mono text-[11px] tracking-[0.06em] text-muted uppercase md:table-header-group">
              <tr>
                <th className="w-10 py-3 pl-5">
                  <input type="checkbox" aria-label="Seleccionar todos los visibles" checked={allVisibleSelected} onChange={() => setSelected(allVisibleSelected ? new Set() : new Set(visible.map((r) => r.id)))} className="size-4 accent-[var(--accent)]" />
                </th>
                {!byDay && <th className="py-2 font-medium">Fecha</th>}
                <th className="py-2 font-medium">Descripción</th>
                <th className="py-2 font-medium">Categoría</th>
                <th className="py-2 font-medium">Método</th>
                <th className="py-2 pr-5 text-right font-medium">
                  <button onClick={() => set('sort', f.sort === 'amount-desc' ? 'amount-asc' : 'amount-desc')} className="inline-flex cursor-pointer items-center gap-1 hover:text-fg">
                    Monto <ArrowDownUp className="size-3" />
                  </button>
                </th>
              </tr>
            </thead>
            {groups.map((g) => (
              <tbody key={g.date} className="border-b border-border last:border-0">
                {byDay && (
                  <tr>
                    <th colSpan={4} scope="rowgroup" className="pt-4 pb-1.5 pl-5 text-left text-[12px] font-medium text-muted first-letter:uppercase">
                      {dateLong(g.date, g.date.slice(0, 4) !== today.slice(0, 4))}
                    </th>
                    <td className="pt-4 pb-1.5 pr-5 text-right text-[12px] whitespace-nowrap text-muted">
                      <Money cents={g.net} sign tabular />
                    </td>
                  </tr>
                )}
                {g.rows.map((r) => (
                  <tr key={r.id} className={cn('group cursor-pointer hover:bg-surface-2', selected.has(r.id) && 'bg-accent-soft/60')} onClick={() => setEditing(r)}>
                    <td className="w-10 py-3 pl-5 align-middle" onClick={(e) => e.stopPropagation()}>
                      <input type="checkbox" aria-label={`Seleccionar ${r.description || r.categoryName}`} checked={selected.has(r.id)} onChange={() => toggle(r.id)} className="size-4 accent-[var(--accent)]" />
                    </td>
                    {!byDay && <td className="py-3 font-mono whitespace-nowrap text-fg-2">{r.date.split('-').reverse().slice(0, 2).join('/')}</td>}
                    <td className="max-w-[58vw] py-3 pr-3 md:max-w-0">
                      {/* avatar con el ícono de la categoría (mercury) */}
                      <span className="flex items-center gap-3">
                        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-surface-3 text-fg-2">
                          <CategoryIcon icon={r.categoryIcon} className="size-3.5" />
                        </span>
                        <button className="block min-w-0 flex-1 truncate text-left font-medium text-fg" onClick={() => setEditing(r)}>
                          {r.description || r.categoryName}
                        </button>
                      </span>
                      <span className="mt-0.5 flex flex-wrap items-center gap-1 pl-11 md:hidden">
                        <span className="text-[12px] text-muted">{r.categoryName}</span>
                      </span>
                      {(r.detectedRecurring || r.tags.length > 0) && (
                        <span className="mt-1 hidden flex-wrap gap-1 pl-11 md:flex">
                          {r.detectedRecurring && (
                            <Badge tone="neutral">
                              <Repeat /> recurrente
                            </Badge>
                          )}
                          {r.tags.map((t) => (
                            <Badge key={t} tone="outline">
                              #{t}
                            </Badge>
                          ))}
                        </span>
                      )}
                    </td>
                    <td className="hidden py-3 pr-3 text-fg-2 md:table-cell">
                      <span className="inline-flex items-center gap-2">
                        <span className="truncate">{r.subcategoryName ? `${r.categoryName} · ${r.subcategoryName}` : r.categoryName}</span>
                      </span>
                    </td>
                    <td className="hidden py-3 pr-3 text-muted md:table-cell">{PAYMENT_METHODS.find((p) => p.value === r.paymentMethod)?.label ?? r.paymentMethod}</td>
                    <td className={cn('py-3 pr-5 text-right text-[14px] font-medium whitespace-nowrap', r.type === 'income' && 'text-positive')}>
                      <Money cents={r.type === 'income' ? r.amountCents : -r.amountCents} sign={r.type === 'income'} tabular />
                    </td>
                  </tr>
                ))}
              </tbody>
            ))}
          </table>
        )}
      </Card>

      {filtered.length > limit && (
        <div className="mt-4 flex justify-center">
          <Button variant="secondary" onClick={() => setLimit((l) => l + PAGE)}>
            Mostrar {Math.min(PAGE, filtered.length - limit)} más ({filtered.length - limit} restantes)
          </Button>
        </div>
      )}

      {/* acciones masivas */}
      {selected.size > 0 && (
        <div className="fixed inset-x-4 bottom-24 z-30 mx-auto flex max-w-md items-center gap-3 rounded-full border border-border-strong bg-surface-2 py-2 pr-2 pl-5 shadow-2xl animate-slide-up lg:bottom-6">
          <span className="text-sm font-medium">{plural(selected.size, 'seleccionado', 'seleccionados')}</span>
          <span className="money text-[13px] text-muted">{money(rows.filter((r) => selected.has(r.id)).reduce((a, r) => a + (r.type === 'income' ? r.amountCents : -r.amountCents), 0), { sign: true })}</span>
          <div className="ml-auto flex gap-1">
            <Button variant="ghost" size="sm" onClick={() => setSelected(new Set())}>
              Cancelar
            </Button>
            <Button variant="danger" size="sm" onClick={() => setConfirmOpen(true)}>
              <Trash2 /> Eliminar
            </Button>
          </div>
        </div>
      )}
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={`Eliminar ${plural(selected.size, 'movimiento', 'movimientos')}`}
        description="Se borran de tus datos y dejan de contar en estadísticas, presupuestos y análisis. No se puede deshacer."
        confirmLabel="Eliminar"
        danger
        loading={deleting}
        onConfirm={() =>
          startDelete(async () => {
            await deleteTransactionsAction([...selected])
            toast.success(`${plural(selected.size, 'movimiento eliminado', 'movimientos eliminados')}`)
            setSelected(new Set())
            setConfirmOpen(false)
            router.refresh()
          })
        }
      />

      {/* edición en panel lateral sin perder la lista */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        {editing && (
          <SheetContent title={editing.description || editing.categoryName} description={`${dateLong(editing.date, true)} · ${editing.type === 'income' ? 'Ingreso' : 'Gasto'}`}>
            <TxnForm key={editing.id} initial={editDraft(editing)} categories={catOptions} today={today} onDone={() => setEditing(null)} />
            <div className="mt-6 border-t border-border pt-4">
              <ConfirmDialog
                trigger={
                  <Button variant="ghost" className="text-critical hover:text-critical">
                    <Trash2 /> Eliminar movimiento
                  </Button>
                }
                title="Eliminar movimiento"
                description="No se puede deshacer."
                confirmLabel="Eliminar"
                danger
                onConfirm={async () => {
                  await deleteTransactionsAction([editing.id])
                  toast.success('Movimiento eliminado')
                  setEditing(null)
                  router.refresh()
                }}
              />
            </div>
          </SheetContent>
        )}
      </Dialog>

      <ImportDialog open={importOpen} onOpenChange={setImportOpen} categories={categories} />
    </>
  )
}

function FilterPanel({ f, set, categories, matchCount }: { f: Filters; set: <K extends keyof Filters>(k: K, v: Filters[K]) => void; categories: CatLite[]; matchCount: number }) {
  const roots = categories.filter((c) => !c.parentId && (f.type === 'all' || c.kind === f.type))
  return (
    <div className="space-y-4">
      <fieldset>
        <legend className="mb-2 text-[12px] font-medium text-muted">Categorías</legend>
        <div className="grid max-h-44 grid-cols-2 gap-1 overflow-y-auto">
          {roots.map((c) => (
            <label key={c.id} className="flex cursor-pointer items-center gap-2 rounded-md px-1.5 py-1 text-[13px] hover:bg-surface-2">
              <input type="checkbox" className="size-3.5 accent-[var(--accent)]" checked={f.cats.includes(c.id)} onChange={(e) => set('cats', e.target.checked ? [...f.cats, c.id] : f.cats.filter((x) => x !== c.id))} />
              <span className="truncate">{c.name}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend className="mb-2 text-[12px] font-medium text-muted">Método de pago</legend>
        <div className="flex flex-wrap gap-1">
          {PAYMENT_METHODS.map((m) => (
            <button key={m.value} type="button" aria-pressed={f.methods.includes(m.value)} onClick={() => set('methods', f.methods.includes(m.value) ? f.methods.filter((x) => x !== m.value) : [...f.methods, m.value])} className={cn('cursor-pointer rounded-full border px-2.5 py-1 text-[12px]', f.methods.includes(m.value) ? 'border-fg bg-fg text-bg' : 'border-border text-fg-2')}>
              {m.label}
            </button>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend className="mb-2 text-[12px] font-medium text-muted">Monto</legend>
        <div className="flex items-center gap-2">
          <Input aria-label="Monto mínimo" inputMode="decimal" placeholder="Desde" value={f.min} onChange={(e) => set('min', e.target.value)} className="h-9" />
          <Input aria-label="Monto máximo" inputMode="decimal" placeholder="Hasta" value={f.max} onChange={(e) => set('max', e.target.value)} className="h-9" />
        </div>
      </fieldset>
      <label className="flex cursor-pointer items-center gap-2 text-[13px]">
        <input type="checkbox" className="size-4 accent-[var(--accent)]" checked={f.recurringOnly} onChange={(e) => set('recurringOnly', e.target.checked)} /> Solo recurrentes y suscripciones
      </label>
      <p className="border-t border-border pt-3 text-[12px] text-muted">{plural(matchCount, 'movimiento coincide', 'movimientos coinciden')}</p>
    </div>
  )
}
