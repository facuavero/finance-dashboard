'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Laptop, LifeBuoy, MoreHorizontal, Pencil, PiggyBank, Plane, Plus, Target, Trash2, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { ConfirmDialog } from '@/components/ui/alert-dialog'
import { Field, Input } from '@/components/ui/input'
import { Menu, MenuContent, MenuItem, MenuTrigger, Segmented } from '@/components/ui/misc'
import { EmptyState, Meter, PageHeader } from '@/components/app/states'
import { GOAL_STATE } from '@/components/app/blocks/goals-mini'
import { Money } from '@/components/app/money'
import { dateLong, money, parseMoneyInput, pct } from '@/lib/format'
import { cn } from '@/lib/utils'
import { contributeGoalAction, deleteGoalAction, saveGoalAction } from '@/modules/finance/actions'
import type { GoalStatus } from '@/modules/analytics/goals'

const KIND = {
  purchase: { label: 'Comprar algo', icon: Laptop },
  travel: { label: 'Viajar', icon: Plane },
  emergency: { label: 'Fondo de emergencia', icon: LifeBuoy },
  savings: { label: 'Ahorrar un monto', icon: PiggyBank },
  investment: { label: 'Invertir', icon: TrendingUp },
} as const
type Kind = keyof typeof KIND

export function GoalsView({ goals, capacityCents, today, openNew }: { goals: GoalStatus[]; capacityCents: number; today: string; openNew: boolean }) {
  const [editing, setEditing] = useState<Partial<GoalStatus> | null>(openNew ? {} : null)
  const [contrib, setContrib] = useState<GoalStatus | null>(null)
  const router = useRouter()
  const active = goals.filter((g) => g.state !== 'done')
  const needed = active.reduce((a, g) => a + g.recommendedMonthlyCents, 0)

  return (
    <>
      <PageHeader title="Objetivos" description="Para qué ahorrás. Te decimos cuánto aportar por mes y si vas en camino." actions={<Button onClick={() => setEditing({})}><Plus /> Nuevo objetivo</Button>} />

      {active.length > 0 && (
        <Card className="mb-5 flex flex-col gap-3 p-5 sm:flex-row sm:items-center">
          <div className="flex-1">
            <p className="text-[13px] text-fg-2">Tus objetivos piden por mes</p>
            <p className="text-[24px] font-semibold tracking-[-0.02em]">
              <Money cents={needed} />
            </p>
          </div>
          <div className="flex-1">
            <p className="text-[13px] text-fg-2">Tu capacidad de ahorro típica</p>
            <p className="text-[24px] font-semibold tracking-[-0.02em]">
              <Money cents={capacityCents} />
            </p>
          </div>
          <p className={cn('flex-[1.4] rounded-lg px-3 py-2 text-[13px]', needed > capacityCents ? 'bg-warning-soft text-warning' : 'bg-positive-soft text-positive')}>
            {needed > capacityCents ? (
              <>
                Te faltan <Money cents={needed - capacityCents} className="font-semibold" /> por mes para cumplir todo en fecha. Priorizá o mové alguna fecha.
              </>
            ) : (
              <>
                Te sobran <Money cents={capacityCents - needed} className="font-semibold" /> por mes después de aportar a todos. Vas bien.
              </>
            )}
          </p>
        </Card>
      )}

      {goals.length === 0 ? (
        <Card>
          <EmptyState icon={Target} title="Todavía no tenés objetivos" action={<Button onClick={() => setEditing({})}>Crear objetivo</Button>}>
            Un viaje, un fondo de emergencia, una compra o invertir. Ponés el monto y la fecha, y te calculamos el aporte mensual.
          </EmptyState>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {goals.map((g) => {
            const K = KIND[g.kind as Kind] ?? KIND.savings
            return (
              <Card key={g.id} className="flex flex-col p-5">
                <div className="flex items-start gap-3">
                  <span className="flex size-9 items-center justify-center rounded-lg bg-surface-2 text-fg-2">
                    <K.icon className="size-4" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-medium">{g.name}</p>
                    <p className="text-[12px] text-muted">{K.label}</p>
                  </div>
                  <Badge tone={GOAL_STATE[g.state].tone}>{GOAL_STATE[g.state].label}</Badge>
                  <Menu>
                    <MenuTrigger asChild>
                      <Button variant="ghost" size="icon-sm" aria-label={`Opciones de ${g.name}`}>
                        <MoreHorizontal />
                      </Button>
                    </MenuTrigger>
                    <MenuContent>
                      <MenuItem onSelect={() => setEditing(g)}>
                        <Pencil /> Editar
                      </MenuItem>
                      <DeleteGoal id={g.id} name={g.name} onDone={() => router.refresh()} />
                    </MenuContent>
                  </Menu>
                </div>
                <p className="mt-4 text-[22px] leading-none font-semibold tracking-[-0.02em]">
                  <Money cents={g.savedCents} />
                  <span className="ml-1 text-[13px] font-normal text-muted">
                    de <Money cents={g.targetCents} />
                  </span>
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <Meter value={g.pct} state={g.state === 'done' ? 'done' : g.state === 'on_track' ? 'ok' : 'near'} label={`${g.name}: ${pct(g.pct)}`} />
                  <span className="num w-10 text-right text-[13px] font-medium">{pct(g.pct)}</span>
                </div>
                <dl className="mt-4 grid grid-cols-2 gap-3 text-[12px]">
                  <div>
                    <dt className="text-muted">Fecha objetivo</dt>
                    <dd className="mt-0.5 font-medium first-letter:uppercase">{dateLong(g.targetDate, true).split(' ').slice(1).join(' ')}</dd>
                  </div>
                  <div>
                    <dt className="text-muted">Aporte recomendado</dt>
                    <dd className="mt-0.5 font-medium">{g.state === 'done' ? '—' : <><Money cents={g.recommendedMonthlyCents} />/mes</>}</dd>
                  </div>
                </dl>
                {g.state === 'behind' && (
                  <p className="mt-3 rounded-lg bg-warning-soft px-3 py-2 text-[12px] text-warning">
                    Para ir al día deberías tener <Money cents={g.expectedByNowCents} className="font-semibold" />. Faltan <Money cents={g.gapCents} className="font-semibold" />.
                  </p>
                )}
                {g.state === 'overdue' && <p className="mt-3 rounded-lg bg-critical-soft px-3 py-2 text-[12px] text-critical">La fecha ya pasó. Mové la fecha o ajustá el monto.</p>}
                <div className="mt-auto pt-4">
                  <Button variant="secondary" size="sm" className="w-full" onClick={() => setContrib(g)} disabled={g.state === 'done'}>
                    Registrar aporte
                  </Button>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        {editing && (
          <DialogContent title={editing.id ? 'Editar objetivo' : 'Nuevo objetivo'} description="Con el monto y la fecha te calculamos el aporte mensual.">
            <GoalForm initial={editing} today={today} onDone={() => setEditing(null)} />
          </DialogContent>
        )}
      </Dialog>
      <Dialog open={!!contrib} onOpenChange={(o) => !o && setContrib(null)}>
        {contrib && (
          <DialogContent title={`Aporte a ${contrib.name}`} description={`Llevás ${money(contrib.savedCents)} de ${money(contrib.targetCents)}.`}>
            <ContributionForm goal={contrib} onDone={() => setContrib(null)} />
          </DialogContent>
        )}
      </Dialog>
    </>
  )
}

function DeleteGoal({ id, name, onDone }: { id: string; name: string; onDone: () => void }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <MenuItem className="text-critical" onSelect={(e) => { e.preventDefault(); setOpen(true) }}>
        <Trash2 /> Eliminar
      </MenuItem>
      <ConfirmDialog open={open} onOpenChange={setOpen} title={`Eliminar "${name}"`} description="Se borra el objetivo y su progreso. Tus movimientos no se tocan." confirmLabel="Eliminar" danger onConfirm={async () => { await deleteGoalAction(id); toast.success('Objetivo eliminado'); setOpen(false); onDone() }} />
    </>
  )
}

function monthsUntil(today: string, date: string) {
  return Math.max(0, (new Date(`${date}T00:00:00Z`).getTime() - new Date(`${today}T00:00:00Z`).getTime()) / (30.44 * 86_400_000))
}

function GoalForm({ initial, today, onDone }: { initial: Partial<GoalStatus>; today: string; onDone: () => void }) {
  const router = useRouter()
  const [kind, setKind] = useState<Kind>((initial.kind as Kind) ?? 'savings')
  const [name, setName] = useState(initial.name ?? '')
  const [target, setTarget] = useState(initial.targetCents ? String(initial.targetCents / 100) : '')
  const [saved, setSaved] = useState(initial.savedCents ? String(initial.savedCents / 100) : '')
  const [date, setDate] = useState(initial.targetDate ?? '')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [pending, start] = useTransition()
  const t = parseMoneyInput(target) ?? 0
  const s = parseMoneyInput(saved) ?? 0
  const months = date ? monthsUntil(today, date) : 0
  const monthly = t > s && months > 0 ? Math.ceil((t - s) / Math.max(1, months)) : 0

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const errs: Record<string, string> = {}
    if (name.trim().length < 2) errs.name = 'Poné un nombre'
    if (t <= 0) errs.target = 'Ingresá el monto objetivo'
    if (!date) errs.date = 'Elegí una fecha'
    else if (date <= today) errs.date = 'Tiene que ser una fecha futura'
    if (Object.keys(errs).length) return setErrors(errs)
    start(async () => {
      const res = await saveGoalAction({ name: name.trim(), kind, targetCents: t, savedCents: s, targetDate: date }, initial.id)
      if (!res.ok) {
        setErrors(res.fieldErrors ?? {})
        return void toast.error(res.error)
      }
      toast.success(initial.id ? 'Objetivo actualizado' : 'Objetivo creado')
      onDone()
      router.refresh()
    })
  }

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <fieldset>
        <legend className="mb-1.5 text-[13px] font-medium">Tipo</legend>
        <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
          {(Object.keys(KIND) as Kind[]).map((k) => {
            const K = KIND[k]
            return (
              <button key={k} type="button" aria-pressed={kind === k} onClick={() => setKind(k)} className={cn('flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-left text-[13px]', kind === k ? 'border-fg bg-surface-2 font-medium' : 'border-border text-fg-2 hover:border-border-strong')}>
                <K.icon className="size-4 shrink-0" aria-hidden /> {K.label}
              </button>
            )
          })}
        </div>
      </fieldset>
      <Field label="Nombre" htmlFor="g-name" error={errors.name}>
        <Input id="g-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Viaje a Bariloche" aria-invalid={!!errors.name} maxLength={60} autoFocus />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Monto objetivo" htmlFor="g-target" error={errors.target}>
          <Input id="g-target" inputMode="decimal" value={target} onChange={(e) => setTarget(e.target.value)} className="num" aria-invalid={!!errors.target} />
        </Field>
        <Field label="Ya tengo" htmlFor="g-saved" optional>
          <Input id="g-saved" inputMode="decimal" value={saved} onChange={(e) => setSaved(e.target.value)} className="num" placeholder="0" />
        </Field>
      </div>
      <Field label="Fecha objetivo" htmlFor="g-date" error={errors.date}>
        <Input id="g-date" type="date" min={today} value={date} onChange={(e) => setDate(e.target.value)} aria-invalid={!!errors.date} />
      </Field>
      {monthly > 0 && (
        <p className="rounded-lg bg-accent-soft px-3 py-2 text-[13px] text-accent" aria-live="polite">
          Tendrías que aportar <span className="font-semibold">{money(monthly)}</span> por mes durante {Math.max(1, Math.round(months))} {Math.round(months) === 1 ? 'mes' : 'meses'}.
        </p>
      )}
      <div className="flex justify-end border-t border-border pt-4">
        <Button type="submit" loading={pending}>
          {initial.id ? 'Guardar' : 'Crear objetivo'}
        </Button>
      </div>
    </form>
  )
}

function ContributionForm({ goal, onDone }: { goal: GoalStatus; onDone: () => void }) {
  const router = useRouter()
  const [mode, setMode] = useState<'in' | 'out'>('in')
  const [amount, setAmount] = useState(String(goal.recommendedMonthlyCents / 100))
  const [pending, start] = useTransition()
  const cents = parseMoneyInput(amount)
  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault()
        if (!cents || cents <= 0) return void toast.error('Ingresá un monto')
        start(async () => {
          const res = await contributeGoalAction(goal.id, mode === 'in' ? cents : -cents)
          if (!res.ok) return void toast.error(res.error)
          toast.success(mode === 'in' ? `Sumaste ${money(cents)} a ${goal.name}` : `Retiraste ${money(cents)} de ${goal.name}`)
          onDone()
          router.refresh()
        })
      }}
    >
      <Segmented label="Tipo de aporte" value={mode} onChange={setMode} options={[{ value: 'in', label: 'Aportar' }, { value: 'out', label: 'Retirar' }]} />
      <Field label="Monto" htmlFor="c-amount" hint={`Recomendado: ${money(goal.recommendedMonthlyCents)} por mes`}>
        <Input id="c-amount" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} className="num h-12 text-xl font-semibold" autoFocus />
      </Field>
      <p className="text-[12px] text-muted">El aporte mueve el progreso del objetivo. No crea un movimiento: la plata sigue en tu capital hasta que la uses.</p>
      <div className="flex justify-end border-t border-border pt-4">
        <Button type="submit" loading={pending}>
          {mode === 'in' ? 'Aportar' : 'Retirar'}
        </Button>
      </div>
    </form>
  )
}
