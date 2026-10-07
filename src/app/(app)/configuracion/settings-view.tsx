'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Pencil, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import { Field, Input, NativeSelect } from '@/components/ui/input'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Segmented, Switch } from '@/components/ui/misc'
import { applyPrefs } from '@/components/app/prefs-sync'
import { CategoryIcon, ICON_NAMES } from '@/components/app/icons'
import { CURRENCIES, money, parseMoneyInput, type Currency } from '@/lib/format'
import { cn } from '@/lib/utils'
import { changePasswordAction, closeOtherSessionsAction, saveCategoryAction, updateNumbersAction, updatePreferencesAction, updateProfileAction } from '@/modules/settings/actions'
import { LANGUAGES, type Prefs } from '@/modules/settings/prefs'
import { logoutAction } from '@/modules/auth/actions'
import { PasswordInput } from '@/app/(auth)/password-input'

type Cat = { id: string; name: string; kind: 'expense' | 'income'; parentId: string | null; icon: string }

export function SettingsView({ user, categories, sessions, currency, prefs }: { user: { name: string; email: string; initialBalanceCents: number; microThresholdCents: number }; categories: Cat[]; sessions: number; currency: Currency; prefs: Prefs }) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [name, setName] = useState(user.name)
  const [balance, setBalance] = useState(String(user.initialBalanceCents / 100))
  const [threshold, setThreshold] = useState(String(user.microThresholdCents / 100))
  const [kind, setKind] = useState<'expense' | 'income'>('expense')
  const [editing, setEditing] = useState<Partial<Cat> | null>(null)

  const save = (fn: () => Promise<{ ok: boolean; error?: string; message?: string }>, msg: string) =>
    start(async () => {
      const r = await fn()
      if (!r.ok) toast.error(r.error ?? 'No se pudo guardar')
      else {
        toast.success(r.message ?? msg)
        router.refresh()
      }
    })

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <PreferencesCard currency={currency} prefs={prefs} />
      <Card>
        <CardHeader title="Perfil" subtitle={user.email} />
        <CardBody>
          <form className="flex items-end gap-2" onSubmit={(e) => { e.preventDefault(); save(() => updateProfileAction(name), 'Nombre actualizado') }}>
            <Field label="Nombre" htmlFor="s-name" className="flex-1">
              <Input id="s-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} />
            </Field>
            <Button type="submit" variant="secondary" loading={pending} disabled={name.trim() === user.name}>
              Guardar
            </Button>
          </form>
        </CardBody>
      </Card>

      <Card id="saldo" className="scroll-mt-20">
        <CardHeader title="Punto de partida" subtitle="El capital disponible arranca en este saldo y suma o resta cada movimiento." />
        <CardBody className="space-y-4">
          <form className="flex items-end gap-2" onSubmit={(e) => { e.preventDefault(); const c = parseMoneyInput(balance); if (c === null) return void toast.error('Monto inválido'); save(() => updateNumbersAction({ initialBalanceCents: c }), `Saldo inicial: ${money(c)}`) }}>
            <Field label="Saldo inicial" htmlFor="s-balance" className="flex-1" hint="Lo que tenías entre cuentas y efectivo antes de tu primer movimiento">
              <Input id="s-balance" inputMode="decimal" value={balance} onChange={(e) => setBalance(e.target.value)} className="num" />
            </Field>
            <Button type="submit" variant="secondary" loading={pending} className="mb-6">
              Guardar
            </Button>
          </form>
          <form className="flex items-end gap-2" onSubmit={(e) => { e.preventDefault(); const c = parseMoneyInput(threshold); if (!c || c < 10000) return void toast.error('Mínimo $100'); save(() => updateNumbersAction({ microThresholdCents: c }), `Umbral de microgasto: ${money(c)}`) }}>
            <Field label="Umbral de microgasto" htmlFor="s-threshold" className="flex-1" hint="Compras por debajo de este monto cuentan como microgastos">
              <Input id="s-threshold" inputMode="decimal" value={threshold} onChange={(e) => setThreshold(e.target.value)} className="num" />
            </Field>
            <Button type="submit" variant="secondary" loading={pending} className="mb-6">
              Guardar
            </Button>
          </form>
        </CardBody>
      </Card>

      <Card className="lg:row-span-2">
        <CardHeader title="Categorías" subtitle="Renombralas o sumá las tuyas. El análisis usa el tipo de cada categoría, no el nombre." action={<Button variant="secondary" size="sm" onClick={() => setEditing({ kind, parentId: null, icon: 'circle-dashed' })}><Plus /> Nueva</Button>} />
        <CardBody>
          <Segmented label="Tipo de categoría" size="sm" value={kind} onChange={setKind} options={[{ value: 'expense', label: 'Gastos' }, { value: 'income', label: 'Ingresos' }]} />
          <ul className="mt-3 divide-y divide-border">
            {categories
              .filter((c) => c.kind === kind && !c.parentId)
              .map((c) => (
                <li key={c.id} className="py-2">
                  <div className="flex items-center gap-2.5 text-[13px]">
                    <CategoryIcon icon={c.icon} className="text-muted" />
                    <span className="flex-1 font-medium">{c.name}</span>
                    <Button variant="ghost" size="icon-sm" aria-label={`Editar ${c.name}`} onClick={() => setEditing(c)}>
                      <Pencil />
                    </Button>
                  </div>
                  {categories.some((s) => s.parentId === c.id) && (
                    <p className="mt-0.5 pl-6.5 text-[12px] text-muted">
                      {categories
                        .filter((s) => s.parentId === c.id)
                        .map((s) => s.name)
                        .join(' · ')}
                    </p>
                  )}
                </li>
              ))}
          </ul>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Seguridad" subtitle={`${sessions} ${sessions === 1 ? 'sesión activa' : 'sesiones activas'}`} />
        <CardBody className="space-y-4">
          <PasswordForm />
          <div className="flex flex-wrap gap-2 border-t border-border pt-4">
            <Button variant="secondary" loading={pending} onClick={() => save(() => closeOtherSessionsAction(), 'Listo')} disabled={sessions <= 1}>
              Cerrar las demás sesiones
            </Button>
            <Button variant="ghost" onClick={() => logoutAction()}>
              Cerrar sesión
            </Button>
          </div>
        </CardBody>
      </Card>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        {editing && (
          <DialogContent title={editing.id ? 'Editar categoría' : 'Nueva categoría'}>
            <CategoryForm initial={editing} parents={categories.filter((c) => !c.parentId && c.kind === (editing.kind ?? kind))} onDone={() => setEditing(null)} />
          </DialogContent>
        )}
      </Dialog>
    </div>
  )
}

function PrefRow({ title, hint, htmlFor, children }: { title: string; hint: string; htmlFor?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2.5 py-3.5 first:pt-0 last:pb-0">
      <div className="min-w-0 flex-1 basis-56">
        <label htmlFor={htmlFor} className="text-[13.5px] font-medium">
          {title}
        </label>
        <p className="mt-0.5 text-[12.5px] text-muted">{hint}</p>
      </div>
      {children}
    </div>
  )
}

/** cada cambio se guarda al instante: sin botón de guardar */
function PreferencesCard({ currency, prefs }: { currency: Currency; prefs: Prefs }) {
  const router = useRouter()
  const [cur, setCur] = useState(currency)
  const [p, setP] = useState(prefs)
  const [, start] = useTransition()

  const commit = (nextCur: Currency, next: Prefs) => {
    setCur(nextCur)
    setP(next)
    applyPrefs(next, { theme: next.theme !== p.theme, privacy: next.hideAmounts !== p.hideAmounts })
    start(async () => {
      const r = await updatePreferencesAction({ ...next, currency: nextCur })
      if (!r.ok) {
        setCur(currency)
        setP(prefs)
        applyPrefs(prefs)
        return void toast.error(r.error)
      }
      router.refresh()
    })
  }

  return (
    <Card className="lg:col-span-2">
      <CardHeader title="Preferencias" subtitle="Moneda, idioma y cómo se ve Caudal. Se guardan solas." />
      <CardBody className="divide-y divide-border">
        <PrefRow title="Moneda" hint="Cambia el símbolo de todos los montos. No convierte: se muestran los números que cargaste.">
          <Segmented label="Moneda" value={cur} onChange={(v) => commit(v, p)} options={(Object.keys(CURRENCIES) as Currency[]).map((c) => ({ value: c, label: `${CURRENCIES[c].short}` }))} />
        </PrefRow>
        <PrefRow title="Idioma" hint="Por ahora Caudal está en español rioplatense. Inglés viene después." htmlFor="pref-lang">
          <NativeSelect id="pref-lang" value={p.language} onChange={() => {}} className="w-[220px]">
            {LANGUAGES.map((l) => (
              <option key={l.value} value={l.value} disabled={!l.available}>
                {l.label}
                {l.available ? '' : ' (pronto)'}
              </option>
            ))}
          </NativeSelect>
        </PrefRow>
        <PrefRow title="Tema por defecto" hint="Con qué tema abre Caudal. El botón de la barra sigue sirviendo para cambiarlo al paso.">
          <Segmented label="Tema" value={p.theme} onChange={(v) => commit(cur, { ...p, theme: v })} options={[{ value: 'dark', label: 'Oscuro' }, { value: 'light', label: 'Claro' }, { value: 'system', label: 'Sistema' }]} />
        </PrefRow>
        <PrefRow title="Ocultar montos al abrir" hint="Arranca con el modo privacidad activado. Se destapa con el ojo de la barra.">
          <Switch aria-label="Ocultar montos al abrir" checked={p.hideAmounts} onCheckedChange={(v) => commit(cur, { ...p, hideAmounts: v })} />
        </PrefRow>
        <PrefRow title="Mostrar centavos" hint="$1.234,50 en vez de $1.235.">
          <Switch aria-label="Mostrar centavos" checked={p.decimals} onCheckedChange={(v) => commit(cur, { ...p, decimals: v })} />
        </PrefRow>
        <PrefRow title="Tip del día" hint="Un consejo corto en Inicio que cambia cada vez que entrás.">
          <Switch aria-label="Tip del día" checked={p.tips} onCheckedChange={(v) => commit(cur, { ...p, tips: v })} />
        </PrefRow>
      </CardBody>
    </Card>
  )
}

function PasswordForm() {
  const [current, setCurrent] = useState('')
  const [pending, start] = useTransition()
  const [key, setKey] = useState(0)
  return (
    <form
      key={key}
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault()
        const next = String(new FormData(e.currentTarget).get('new-password') ?? '')
        start(async () => {
          const r = await changePasswordAction(current, next)
          if (!r.ok) return void toast.error(r.error)
          toast.success(r.message ?? 'Contraseña actualizada')
          setCurrent('')
          setKey((k) => k + 1)
        })
      }}
    >
      <Field label="Contraseña actual" htmlFor="s-current">
        <Input id="s-current" type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} />
      </Field>
      <Field label="Contraseña nueva" htmlFor="s-new">
        <PasswordInput id="s-new" name="new-password" />
      </Field>
      <Button type="submit" variant="secondary" loading={pending} disabled={!current}>
        Cambiar contraseña
      </Button>
    </form>
  )
}

function CategoryForm({ initial, parents, onDone }: { initial: Partial<Cat>; parents: Cat[]; onDone: () => void }) {
  const router = useRouter()
  const [name, setName] = useState(initial.name ?? '')
  const [icon, setIcon] = useState(initial.icon ?? 'circle-dashed')
  const [parentId, setParentId] = useState(initial.parentId ?? '')
  const [pending, start] = useTransition()
  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault()
        start(async () => {
          const r = await saveCategoryAction({ name, icon, kind: initial.kind ?? 'expense', parentId: parentId || null }, initial.id)
          if (!r.ok) return void toast.error(r.error)
          toast.success(initial.id ? 'Categoría actualizada' : 'Categoría creada')
          onDone()
          router.refresh()
        })
      }}
    >
      <Field label="Nombre" htmlFor="c-name">
        <Input id="c-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={40} autoFocus />
      </Field>
      {!initial.id && (
        <Field label="Es subcategoría de" htmlFor="c-parent" optional>
          <NativeSelect id="c-parent" value={parentId} onChange={(e) => setParentId(e.target.value)}>
            <option value="">Ninguna (categoría principal)</option>
            {parents.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </NativeSelect>
        </Field>
      )}
      <fieldset>
        <legend className="mb-1.5 text-[13px] font-medium">Ícono</legend>
        <div className="grid grid-cols-8 gap-1">
          {ICON_NAMES.map((n) => (
            <button key={n} type="button" onClick={() => setIcon(n)} aria-pressed={icon === n} aria-label={n} className={cn('flex aspect-square cursor-pointer items-center justify-center rounded-2xl border', icon === n ? 'border-fg bg-surface-2' : 'border-transparent hover:bg-surface-2')}>
              <CategoryIcon icon={n} />
            </button>
          ))}
        </div>
      </fieldset>
      <div className="flex justify-end border-t border-border pt-4">
        <Button type="submit" loading={pending}>
          Guardar
        </Button>
      </div>
    </form>
  )
}
