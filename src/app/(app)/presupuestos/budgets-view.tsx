'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { MoreHorizontal, Pencil, PiggyBank, Plus, Target, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { ConfirmDialog } from '@/components/ui/alert-dialog'
import { Field, Input, NativeSelect } from '@/components/ui/input'
import { Menu, MenuContent, MenuItem, MenuTrigger, Segmented } from '@/components/ui/misc'
import { EmptyState, Meter, PageHeader } from '@/components/app/states'
import { CategoryBadge } from '@/components/app/icons'
import { Money } from '@/components/app/money'
import { dateShort, money, parseMoneyInput, pct, plural } from '@/lib/format'
import { deleteBudgetAction, saveBudgetAction } from '@/modules/finance/actions'
import type { BudgetStatus } from '@/modules/analytics/budgets'

type B = BudgetStatus & { icon: string; categoryName: string; goalId: string | null; goalName: string | null }
const PERIOD = { weekly: 'Semanal', monthly: 'Mensual', yearly: 'Anual' }
const STATE = { ok: { label: 'En rango', tone: 'positive' as const }, near: { label: 'Por agotarse', tone: 'warning' as const }, over: { label: 'Excedido', tone: 'critical' as const } }

export function BudgetsView({ budgets, categories, goals, suggestions, today, openNew }: { budgets: B[]; categories: { id: string; name: string }[]; goals: { id: string; name: string }[]; suggestions: { categoryId: string; name: string; icon: string; avgCents: number }[]; today: string; openNew: boolean }) {
  const [filter, setFilter] = useState<'all' | 'over' | 'near'>('all')
  const [editing, setEditing] = useState<Partial<B> | null>(openNew ? {} : null)
  const router = useRouter()
  const over = budgets.filter((b) => b.state === 'over')
  const near = budgets.filter((b) => b.state === 'near')
  const monthly = budgets.filter((b) => b.period === 'monthly' && b.categoryId)
  const shown = filter === 'all' ? budgets : budgets.filter((b) => b.state === filter)

  return (
    <>
      <PageHeader
        title="Presupuestos"
        description="Cuánto querés gastar por categoría, período u objetivo. Te avisamos antes de que se agote."
        actions={
          <Button onClick={() => setEditing({})}>
            <Plus /> Nuevo presupuesto
          </Button>
        }
      />

      {budgets.length > 0 && (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Stat label="Asignado este mes" value={<Money cents={monthly.reduce((a, b) => a + b.amountCents, 0)} />} />
            <Stat label="Gastado" value={<Money cents={monthly.reduce((a, b) => a + b.spentCents, 0)} />} />
            <Stat label="Restante" value={<Money cents={monthly.reduce((a, b) => a + b.remainingCents, 0)} />} />
            <Stat label="Mes transcurrido" value={pct(monthly[0]?.elapsedPct ?? 0)} />
          </div>
          {/* los problemas como filtros (patrón ynab) */}
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <Segmented
              label="Filtrar presupuestos"
              value={filter}
              onChange={setFilter}
              options={[
                { value: 'all', label: `Todos (${budgets.length})` },
                { value: 'over', label: `${plural(over.length, 'excedido', 'excedidos')}` },
                { value: 'near', label: `${near.length} por agotarse` },
              ]}
            />
          </div>
        </>
      )}

      {budgets.length === 0 ? (
        <Card className="mt-2">
          <EmptyState icon={PiggyBank} title="Todavía no tenés presupuestos" action={<Button onClick={() => setEditing({})}>Crear el primero</Button>}>
            Un presupuesto es un tope. Te avisamos cuando te acercás y te decimos a qué ritmo vas.
          </EmptyState>
        </Card>
      ) : (
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {shown.map((b) => (
            <Card key={b.id} className="p-5">
              <div className="flex items-start gap-3">
                <CategoryBadge icon={b.icon} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-[15px] font-medium">{b.name}</p>
                    <Badge tone={STATE[b.state].tone}>{STATE[b.state].label}</Badge>
                  </div>
                  <p className="text-[12px] text-muted">
                    {PERIOD[b.period]} · {b.categoryName}
                    {b.goalName && (
                      <span className="ml-1 inline-flex items-center gap-1">
                        · <Target className="size-3" /> {b.goalName}
                      </span>
                    )}
                  </p>
                </div>
                <Menu>
                  <MenuTrigger asChild>
                    <Button variant="ghost" size="icon-sm" aria-label={`Opciones de ${b.name}`}>
                      <MoreHorizontal />
                    </Button>
                  </MenuTrigger>
                  <MenuContent>
                    <MenuItem onSelect={() => setEditing(b)}>
                      <Pencil /> Editar
                    </MenuItem>
                    <DeleteItem id={b.id} name={b.name} onDone={() => router.refresh()} />
                  </MenuContent>
                </Menu>
              </div>
              <div className="mt-4 flex items-end justify-between gap-2">
                <p className="text-[24px] leading-none font-medium">
                  <Money cents={b.spentCents} />
                  <span className="ml-1 text-[13px] font-normal text-muted">
                    de <Money cents={b.amountCents} />
                  </span>
                </p>
                <p className="num text-[13px] font-medium">{pct(b.pct)}</p>
              </div>
              {/* marca de "dónde debería estar hoy" sobre la barra */}
              <div className="relative mt-2">
                <Meter value={b.pct} state={b.state} label={`${b.name}: ${pct(b.pct)} usado`} />
                <span className="absolute -top-1 h-3.5 w-px bg-fg/50" style={{ left: `${Math.min(100, b.elapsedPct * 100)}%` }} title="Ritmo esperado a hoy" aria-hidden />
              </div>
              <p className="mt-2.5 text-[13px] text-fg-2">
                {b.state === 'over' ? (
                  <>
                    Te pasaste <Money cents={-b.remainingCents} className="font-medium text-critical" />. {b.daysLeft === 0 ? 'Hoy cierra el período.' : b.daysLeft === 1 ? 'Queda 1 día del período.' : `Quedan ${b.daysLeft} días del período.`}
                  </>
                ) : b.projectedOverOn ? (
                  <>
                    Quedan <Money cents={b.remainingCents} className="font-medium" />. Al ritmo actual se agota el <span className="font-medium">{dateShort(b.projectedOverOn)}</span>.
                  </>
                ) : (
                  <>
                    Quedan <Money cents={b.remainingCents} className="font-medium" />. Al ritmo actual cerrás en <Money cents={b.projectedCents} className="font-medium" />.
                  </>
                )}
              </p>
            </Card>
          ))}
        </div>
      )}

      {suggestions.length > 0 && (
        <section className="mt-8" aria-labelledby="sug">
          <h2 id="sug" className="display text-[26px]">
            Sugerencias con tus datos
          </h2>
          <p className="mt-0.5 text-[13px] text-muted">Categorías sin presupuesto. El monto sugerido es tu promedio de los últimos 3 meses.</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            {suggestions.map((s) => (
              <Card key={s.categoryId} className="flex items-center gap-3 p-4">
                <CategoryBadge icon={s.icon} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium">{s.name}</p>
                  <p className="text-[12px] text-muted">
                    ~<Money cents={s.avgCents} /> por mes
                  </p>
                </div>
                <Button variant="secondary" size="sm" onClick={() => setEditing({ name: s.name, categoryId: s.categoryId, amountCents: s.avgCents, period: 'monthly' })}>
                  Crear
                </Button>
              </Card>
            ))}
          </div>
        </section>
      )}

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        {editing && (
          <DialogContent title={editing.id ? 'Editar presupuesto' : 'Nuevo presupuesto'} description="Por categoría, general o asociado a un objetivo.">
            <BudgetForm initial={editing} categories={categories} goals={goals} onDone={() => setEditing(null)} today={today} />
          </DialogContent>
        )}
      </Dialog>
    </>
  )
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Card className="p-5">
      <p className="label-caps">{label}</p>
      <p className="mt-3 font-mono text-[26px] leading-none font-medium tracking-[-0.045em]">{value}</p>
    </Card>
  )
}

function DeleteItem({ id, name, onDone }: { id: string; name: string; onDone: () => void }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <MenuItem className="text-critical" onSelect={(e) => { e.preventDefault(); setOpen(true) }}>
        <Trash2 /> Eliminar
      </MenuItem>
      <ConfirmDialog open={open} onOpenChange={setOpen} title={`Eliminar "${name}"`} description="Tus movimientos no se tocan. Solo se borra el tope." confirmLabel="Eliminar" danger onConfirm={async () => { await deleteBudgetAction(id); toast.success('Presupuesto eliminado'); setOpen(false); onDone() }} />
    </>
  )
}

function BudgetForm({ initial, categories, goals, onDone }: { initial: Partial<B>; categories: { id: string; name: string }[]; goals: { id: string; name: string }[]; onDone: () => void; today: string }) {
  const router = useRouter()
  const [kind, setKind] = useState<'category' | 'total' | 'goal'>(initial.goalId ? 'goal' : initial.id && !initial.categoryId ? 'total' : 'category')
  const [name, setName] = useState(initial.name ?? '')
  const [categoryId, setCategoryId] = useState(initial.categoryId ?? categories[0]?.id ?? '')
  const [goalId, setGoalId] = useState(initial.goalId ?? goals[0]?.id ?? '')
  const [period, setPeriod] = useState<B['period']>(initial.period ?? 'monthly')
  const [amount, setAmount] = useState(initial.amountCents ? String(initial.amountCents / 100) : '')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [pending, start] = useTransition()

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const cents = parseMoneyInput(amount)
    const catName = categories.find((c) => c.id === categoryId)?.name
    const finalName = name.trim() || (kind === 'total' ? 'Gasto total' : kind === 'goal' ? (goals.find((g) => g.id === goalId)?.name ?? '') : (catName ?? ''))
    const errs: Record<string, string> = {}
    if (!cents || cents <= 0) errs.amount = 'Ingresá un monto mayor a 0'
    if (kind === 'goal' && !goalId) errs.goal = 'Primero creá un objetivo'
    if (Object.keys(errs).length) return setErrors(errs)
    start(async () => {
      const res = await saveBudgetAction({ name: finalName, categoryId: kind === 'category' ? categoryId : kind === 'goal' ? categoryId || null : null, goalId: kind === 'goal' ? goalId : null, period, amountCents: cents! }, initial.id)
      if (!res.ok) {
        setErrors(res.fieldErrors ?? {})
        return void toast.error(res.error)
      }
      toast.success(initial.id ? 'Presupuesto actualizado' : `Presupuesto creado: ${money(cents!)} ${PERIOD[period].toLowerCase()}`)
      onDone()
      router.refresh()
    })
  }

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <Segmented label="Tipo de presupuesto" value={kind} onChange={setKind} options={[{ value: 'category', label: 'Por categoría' }, { value: 'total', label: 'General' }, { value: 'goal', label: 'Por objetivo' }]} />
      {(kind === 'category' || kind === 'goal') && (
        <Field label={kind === 'goal' ? 'Categoría que cuenta para el objetivo' : 'Categoría'} htmlFor="b-cat">
          <NativeSelect id="b-cat" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </NativeSelect>
        </Field>
      )}
      {kind === 'goal' && (
        <Field label="Objetivo" htmlFor="b-goal" error={errors.goal}>
          <NativeSelect id="b-goal" value={goalId} onChange={(e) => setGoalId(e.target.value)} disabled={!goals.length}>
            {goals.length ? goals.map((g) => <option key={g.id} value={g.id}>{g.name}</option>) : <option>Sin objetivos</option>}
          </NativeSelect>
        </Field>
      )}
      <div className="grid grid-cols-2 gap-3">
        <Field label="Monto" htmlFor="b-amount" error={errors.amount}>
          <Input id="b-amount" inputMode="decimal" placeholder="0" value={amount} onChange={(e) => setAmount(e.target.value)} aria-invalid={!!errors.amount} className="num" autoFocus />
        </Field>
        <Field label="Período" htmlFor="b-period">
          <NativeSelect id="b-period" value={period} onChange={(e) => setPeriod(e.target.value as B['period'])}>
            <option value="weekly">Semanal</option>
            <option value="monthly">Mensual</option>
            <option value="yearly">Anual</option>
          </NativeSelect>
        </Field>
      </div>
      <Field label="Nombre" htmlFor="b-name" optional hint="Si lo dejás vacío usamos el de la categoría">
        <Input id="b-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} />
      </Field>
      <div className="flex justify-end border-t border-border pt-4">
        <Button type="submit" loading={pending}>
          {initial.id ? 'Guardar' : 'Crear presupuesto'}
        </Button>
      </div>
    </form>
  )
}
