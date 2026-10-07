'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { CalendarDays, CheckCircle2, CircleAlert, Mail, RefreshCw, Unplug, Upload, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ConfirmDialog } from '@/components/ui/alert-dialog'
import { Tip } from '@/components/ui/misc'
import { Money } from '@/components/app/money'
import { connectDemoAction, disconnectAction, dismissItemAction, syncAction } from '@/modules/integrations/actions'
import { dateShort, pct } from '@/lib/format'
import { cn } from '@/lib/utils'

type Item = { id: string; kind: string; title: string; merchant: string | null; amountCents: number | null; occursOn: string | null; confidence: number; evidence: string; dismissed: boolean }
type Conn = { status: string; isDemo: boolean; accountEmail: string | null; lastSyncedAt: string | null; lastError: string | null; scopes: string } | null
type P = { id: 'gmail' | 'gcal'; name: string; connection: Conn; scope: { scope: string; label: string; meaning: string }; items: Item[] }

const KIND: Record<string, string> = {
  purchase: 'Compra', invoice: 'Factura', receipt: 'Recibo', booking: 'Reserva', flight: 'Vuelo', subscription: 'Suscripción', payment: 'Pago', due: 'Vencimiento', income: 'Ingreso',
  trip: 'Viaje', birthday: 'Cumpleaños', event: 'Evento', renewal: 'Renovación', vacation: 'Vacaciones', meeting: 'Sin impacto',
}
const DETECTS = {
  gmail: ['Compras, facturas y recibos', 'Reservas y confirmaciones de vuelos', 'Suscripciones, renovaciones y cambios de precio', 'Vencimientos y confirmaciones de pago'],
  gcal: ['Viajes y vacaciones', 'Cumpleaños y eventos con gasto probable', 'Vencimientos, renovaciones y pagos programados', 'Reservas y turnos'],
}
const STORES = {
  gmail: 'Asunto (hasta 140 caracteres), remitente, fecha, monto detectado y tipo. Nunca el cuerpo del correo.',
  gcal: 'Título del evento (hasta 140 caracteres), fechas y tipo. Nunca invitados, descripción ni ubicación.',
}
const ERRORS: Record<string, string> = {
  'no-configurado': 'La conexión real con Google no está configurada en este servidor. Mientras tanto podés probar con datos de ejemplo.',
  cancelado: 'Cancelaste el permiso en Google. No se guardó nada.',
  estado: 'La conexión expiró o no coincide. Probá de nuevo.',
  google: 'Google no respondió bien. Probá de nuevo en unos minutos.',
  demo: 'La cuenta demo es compartida: para conectar tu Google real, creá tu propia cuenta.',
}

export function IntegrationsView({ providers, googleReady, notice, error, activeSignals }: { providers: P[]; googleReady: boolean; notice: string | null; error: string | null; activeSignals: number }) {
  return (
    <div className="space-y-6">
      {notice && (
        <p className="flex items-center gap-2 rounded-lg bg-positive-soft px-4 py-2.5 text-[13px] text-positive" role="status">
          <CheckCircle2 className="size-4" /> {notice}
        </p>
      )}
      {error && (
        <p className="flex items-center gap-2 rounded-lg bg-critical-soft px-4 py-2.5 text-[13px] text-critical" role="alert">
          <CircleAlert className="size-4" /> {ERRORS[error] ?? 'No se pudo conectar.'}
        </p>
      )}
      <div className="grid gap-4 xl:grid-cols-2">
        {providers.map((p) => (
          <ProviderCard key={p.id} p={p} googleReady={googleReady} />
        ))}
      </div>
      <Card className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center">
        <span className="flex size-10 items-center justify-center rounded-2xl bg-surface-2 text-fg-2">
          <Upload className="size-5" aria-hidden />
        </span>
        <div className="flex-1">
          <p className="font-medium">Importar movimientos desde tu banco</p>
          <p className="text-[13px] text-muted">Subí el CSV que exporta tu banco o billetera. Revisás el mapeo antes de confirmar.</p>
        </div>
        <Button asChild variant="secondary">
          <Link href="/movimientos?importar=1">Importar CSV</Link>
        </Button>
      </Card>
      <p className="text-center text-[12px] text-muted">
        {activeSignals} hallazgos activos alimentan el <Link href="/calendario" className="text-accent hover:underline">análisis combinado</Link>. Todo lo que viene de integraciones se guarda aparte de tus movimientos.
      </p>
    </div>
  )
}

function ProviderCard({ p, googleReady }: { p: P; googleReady: boolean }) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [showAll, setShowAll] = useState(false)
  const Icon = p.id === 'gmail' ? Mail : CalendarDays
  const c = p.connection
  const visible = p.items.filter((i) => !i.dismissed)
  const run = (fn: () => Promise<{ ok: boolean; error?: string; count?: number }>, ok: string) =>
    start(async () => {
      const r = await fn()
      if (!r.ok) toast.error(r.error ?? 'Algo falló')
      else toast.success(ok)
      router.refresh()
    })

  return (
    <Card className="flex flex-col">
      <div className="flex items-start gap-3 p-5">
        <span className="flex size-10 items-center justify-center rounded-2xl bg-surface-2 text-fg">
          <Icon className="size-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-[16px] font-semibold">{p.name}</h2>
            {!c ? <Badge tone="neutral">No conectado</Badge> : c.status === 'error' ? <Badge tone="critical">Error</Badge> : c.isDemo ? <Badge tone="warning">Modo demo</Badge> : <Badge tone="positive">Conectado</Badge>}
          </div>
          <p className="text-[13px] text-muted">
            {c ? (
              <>
                {c.isDemo ? 'Datos de ejemplo, no tu cuenta real' : c.accountEmail}
                {c.lastSyncedAt && <> · sincronizado {new Date(c.lastSyncedAt).toLocaleString('es-AR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'America/Argentina/Buenos_Aires' })}</>}
              </>
            ) : (
              'Solo lectura. Lo desconectás cuando quieras.'
            )}
          </p>
          {c?.lastError && <p className="mt-1 text-[12px] text-critical">{c.lastError}</p>}
        </div>
      </div>

      <div className="grid gap-4 border-t border-border px-5 py-4 text-[13px] sm:grid-cols-2">
        <div>
          <p className="label-caps mb-1.5">Qué detecta</p>
          <ul className="space-y-1 text-fg-2">
            {DETECTS[p.id].map((d) => (
              <li key={d}>· {d}</li>
            ))}
          </ul>
        </div>
        <div className="space-y-3">
          <div>
            <p className="label-caps mb-1.5">Permiso que pedimos</p>
            <code className="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-[12px]">{p.scope.label}</code>
            <p className="mt-1 text-fg-2">{p.scope.meaning}</p>
          </div>
          <div>
            <p className="label-caps mb-1.5">Qué guardamos</p>
            <p className="text-fg-2">{STORES[p.id]}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 border-t border-border px-5 py-4">
        {!c || c.isDemo ? (
          <>
            {googleReady ? (
              <Button asChild>
                <a href={`/api/integrations/google/connect?provider=${p.id}`}>Conectar con Google</a>
              </Button>
            ) : (
              <Tip content="Falta configurar GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET en el servidor (ver README).">
                <span>
                  <Button disabled>Conectar con Google</Button>
                </span>
              </Tip>
            )}
            {!c && (
              <Button variant="secondary" loading={pending} onClick={() => run(() => connectDemoAction(p.id), `${p.name} en modo demo`)}>
                Probar con datos de ejemplo
              </Button>
            )}
          </>
        ) : (
          <Button variant="secondary" loading={pending} onClick={() => run(() => syncAction(p.id), 'Sincronizado')}>
            <RefreshCw /> Sincronizar ahora
          </Button>
        )}
        {c && (
          <ConfirmDialog
            trigger={
              <Button variant="ghost" className="text-critical hover:text-critical">
                <Unplug /> Desconectar
              </Button>
            }
            title={`Desconectar ${p.name}`}
            description={
              <ul className="list-disc space-y-1 pl-4">
                <li>{c.isDemo ? 'Se borran los datos de ejemplo.' : 'Revocamos el acceso en Google y borramos los tokens.'}</li>
                <li>Se borran los {p.items.length} hallazgos detectados.</li>
                <li className="font-medium text-fg">Tus movimientos, presupuestos y objetivos no se tocan.</li>
              </ul>
            }
            confirmLabel="Desconectar"
            danger
            onConfirm={() => run(() => disconnectAction(p.id), `${p.name} desconectado`)}
          />
        )}
      </div>

      {c && (
        <div className="border-t border-border px-5 py-4">
          <p className="mb-2 text-[13px] font-medium">
            Hallazgos <span className="font-normal text-muted">({visible.length}) · solo se muestran los que tienen contexto suficiente</span>
          </p>
          {visible.length ? (
            <ul className="divide-y divide-border">
              {(showAll ? visible : visible.slice(0, 5)).map((i) => (
                <li key={i.id} className="flex items-center gap-3 py-2 text-[13px]">
                  <Badge tone={i.kind === 'meeting' ? 'neutral' : i.kind === 'income' ? 'positive' : 'outline'} className="w-24 justify-center">
                    {KIND[i.kind] ?? i.kind}
                  </Badge>
                  <div className="min-w-0 flex-1">
                    <p className="truncate">{i.title}</p>
                    <p className="text-[12px] text-muted">
                      {i.occursOn ? dateShort(i.occursOn) : 'sin fecha'} · confianza {pct(i.confidence)}
                    </p>
                  </div>
                  {i.amountCents ? <Money cents={i.amountCents} tabular className="font-medium" /> : <span className="text-[12px] text-muted">sin monto</span>}
                  <Tip content="No es un gasto: descartar">
                    <button
                      onClick={() => run(() => dismissItemAction(i.id), 'Hallazgo descartado')}
                      className={cn('rounded p-1 text-muted hover:bg-surface-2 hover:text-fg', pending && 'opacity-50')}
                      aria-label={`Descartar ${i.title}`}
                    >
                      <X className="size-4" />
                    </button>
                  </Tip>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[13px] text-muted">Sin hallazgos por ahora.</p>
          )}
          {visible.length > 5 && !showAll && (
            <button onClick={() => setShowAll(true)} className="mt-2 cursor-pointer text-[13px] text-accent hover:underline">
              Ver los {visible.length} hallazgos
            </button>
          )}
        </div>
      )}
    </Card>
  )
}
