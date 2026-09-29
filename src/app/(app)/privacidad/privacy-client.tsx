'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Download, Eraser, Trash2, UserX } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/misc'
import { ConfirmDialog } from '@/components/ui/alert-dialog'
import { deleteAccountAction, deleteFinancialDataAction, exportDataAction, setAiExternalAction } from '@/modules/privacy/actions'
import { clearDemoDataAction } from '@/modules/finance/actions'

export function AiToggle({ enabled, available }: { enabled: boolean; available: boolean }) {
  const router = useRouter()
  const [on, setOn] = useState(enabled)
  const [pending, start] = useTransition()
  return (
    <label className="flex items-center gap-2 text-[13px]">
      <span className="text-fg-2">Usar IA externa</span>
      <Switch
        checked={on}
        disabled={pending}
        onCheckedChange={(v) =>
          start(async () => {
            setOn(v)
            await setAiExternalAction(v)
            toast.success(v ? (available ? 'IA externa activada' : 'Activada: se usará cuando configures una clave') : 'IA externa desactivada. Todo se calcula localmente.')
            router.refresh()
          })
        }
        aria-label="Usar IA externa"
      />
    </label>
  )
}

export function DataActions({ email }: { email: string }) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [confirm, setConfirm] = useState('')
  const [err, setErr] = useState('')

  const rows = [
    {
      icon: Download,
      title: 'Exportar todo',
      body: 'Descargá un JSON con tus movimientos, categorías, presupuestos, objetivos y hallazgos.',
      action: (
        <Button
          variant="secondary"
          loading={pending}
          onClick={() =>
            start(async () => {
              const data = await exportDataAction()
              const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }))
              const a = document.createElement('a')
              a.href = url
              a.download = `caudal-${new Date().toISOString().slice(0, 10)}.json`
              a.click()
              URL.revokeObjectURL(url)
              toast.success('Exportación descargada')
            })
          }
        >
          Exportar
        </Button>
      ),
    },
    {
      icon: Eraser,
      title: 'Borrar datos de ejemplo',
      body: 'Elimina solo los movimientos cargados como ejemplo. Lo que cargaste vos queda.',
      action: (
        <ConfirmDialog
          trigger={<Button variant="secondary">Borrar ejemplo</Button>}
          title="Borrar datos de ejemplo"
          description="Se eliminan los movimientos de ejemplo. Tus movimientos cargados a mano o importados no se tocan."
          confirmLabel="Borrar"
          onConfirm={() =>
            start(async () => {
              const r = await clearDemoDataAction()
              toast.success(r.ok ? (r.message ?? 'Listo') : 'No se pudo')
              router.refresh()
            })
          }
        />
      ),
    },
    {
      icon: Trash2,
      title: 'Borrar todos mis datos financieros',
      body: 'Movimientos, presupuestos, objetivos, integraciones y análisis. Tu cuenta sigue activa.',
      action: (
        <ConfirmDialog
          trigger={<Button variant="secondary" className="text-critical">Borrar datos</Button>}
          title="Borrar todos tus datos financieros"
          description="Se desconectan Gmail y Calendar y se borra todo lo financiero. No se puede deshacer. Te recomendamos exportar antes."
          confirmLabel="Borrar todo"
          danger
          onConfirm={() =>
            start(async () => {
              await deleteFinancialDataAction()
              toast.success('Datos financieros borrados')
              router.push('/inicio')
            })
          }
        />
      ),
    },
  ]

  return (
    <div className="mt-2 space-y-3">
      <Card className="divide-y divide-border">
        {rows.map((r) => (
          <div key={r.title} className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center">
            <r.icon className="size-5 shrink-0 text-muted" aria-hidden />
            <div className="flex-1">
              <p className="font-medium">{r.title}</p>
              <p className="text-[13px] text-muted">{r.body}</p>
            </div>
            {r.action}
          </div>
        ))}
      </Card>
      <Card className="border-critical/30 p-5">
        <div className="flex items-start gap-3">
          <UserX className="mt-0.5 size-5 shrink-0 text-critical" aria-hidden />
          <div className="flex-1">
            <p className="font-medium text-critical">Eliminar mi cuenta</p>
            <p className="text-[13px] text-muted">Borra la cuenta y todos sus datos de forma permanente. Revoca los accesos a Google.</p>
            <form
              className="mt-3 flex flex-col gap-2 sm:flex-row"
              onSubmit={(e) => {
                e.preventDefault()
                setErr('')
                start(async () => {
                  const r = await deleteAccountAction(confirm)
                  if (r && !r.ok) setErr(r.error)
                })
              }}
            >
              <label htmlFor="del-email" className="sr-only">
                Escribí tu email para confirmar
              </label>
              <Input id="del-email" placeholder={`Escribí ${email} para confirmar`} value={confirm} onChange={(e) => setConfirm(e.target.value)} aria-invalid={!!err} className="sm:max-w-xs" autoComplete="off" />
              <Button type="submit" variant="danger" disabled={confirm.trim().toLowerCase() !== email} loading={pending}>
                Eliminar cuenta
              </Button>
            </form>
            {err && (
              <p className="mt-1 text-[13px] text-critical" role="alert">
                {err}
              </p>
            )}
          </div>
        </div>
      </Card>
    </div>
  )
}
