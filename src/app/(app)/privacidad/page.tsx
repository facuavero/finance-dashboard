import type { Metadata } from 'next'
import Link from 'next/link'
import { CalendarDays, Mail } from 'lucide-react'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { PageHeader, SectionLabel } from '@/components/app/states'
import { getAppData } from '@/modules/app/data'
import { SCOPES } from '@/modules/integrations/google'
import { availableEngine } from '@/modules/ai/providers'
import { aiPayload } from '@/modules/ai/service'
import { AiToggle, DataActions } from './privacy-client'

export const metadata: Metadata = { title: 'Privacidad' }

const ROWS: { data: string; why: string; where: string; remove: string }[] = [
  { data: 'Nombre, email y contraseña (guardada como hash scrypt, nunca en texto)', why: 'Iniciar sesión', where: 'Base de datos de Caudal', remove: 'Eliminar cuenta' },
  { data: 'Movimientos, categorías, presupuestos y objetivos', why: 'Todo el análisis: resumen, fugas, predicción, alertas', where: 'Base de datos de Caudal', remove: 'Borrar datos financieros' },
  { data: 'Gmail: asunto, remitente, fecha, monto y tipo de los correos con contexto financiero', why: 'Detectar compras, facturas, reservas y suscripciones', where: 'Tabla separada de hallazgos (no se mezcla con tus movimientos)', remove: 'Desconectar Gmail' },
  { data: 'Calendar: título, fechas y tipo de los eventos de los próximos 60 días', why: 'Anticipar viajes, eventos y vencimientos', where: 'Tabla separada de hallazgos', remove: 'Desconectar Calendar' },
  { data: 'Tokens de acceso de Google', why: 'Mantener la conexión sin pedirte permiso cada vez', where: 'Cifrados con AES-256-GCM', remove: 'Desconectar (además se revocan en Google)' },
  { data: 'Resúmenes generados por la IA', why: 'No volver a pedirle lo mismo a la IA si tus datos no cambiaron', where: 'Base de datos de Caudal', remove: 'Borrar datos financieros' },
  { data: 'Tema (claro/oscuro) y modo privacidad', why: 'Recordar tus preferencias', where: 'Solo en tu navegador', remove: 'Borrar datos del sitio en el navegador' },
]

export default async function Privacidad() {
  const { user, ctx, recommendations, combined, integrations } = await getAppData()
  const engine = availableEngine()
  const payload = aiPayload(ctx, recommendations, combined)
  const gmail = integrations.find((i) => i.provider === 'gmail')
  const gcal = integrations.find((i) => i.provider === 'gcal')

  return (
    <>
      <PageHeader title="Privacidad" description="Qué puede ver Caudal, para qué lo usa, dónde queda y cómo lo borrás. Sin letra chica." />

      <SectionLabel>Qué datos tenemos</SectionLabel>
      <Card className="mt-2 overflow-x-auto">
        <table className="w-full min-w-[760px] text-[13px]">
          <caption className="sr-only">Datos que guarda Caudal</caption>
          <thead className="border-b border-border text-left text-[12px] text-muted">
            <tr>
              <th className="py-2.5 pl-5 font-medium">Dato</th>
              <th className="py-2.5 font-medium">Para qué se usa</th>
              <th className="py-2.5 font-medium">Dónde queda</th>
              <th className="py-2.5 pr-5 font-medium">Cómo se borra</th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map((r) => (
              <tr key={r.data} className="border-b border-border/60 align-top last:border-0">
                <td className="py-3 pr-4 pl-5 font-medium">{r.data}</td>
                <td className="py-3 pr-4 text-fg-2">{r.why}</td>
                <td className="py-3 pr-4 text-fg-2">{r.where}</td>
                <td className="py-3 pr-5 text-fg-2">{r.remove}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <p className="mt-2 text-[12px] text-muted">No vendemos ni compartimos tus datos. No hay publicidad ni analítica de terceros en la app.</p>

      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        {[
          { id: 'gmail' as const, name: 'Gmail', icon: Mail, conn: gmail },
          { id: 'gcal' as const, name: 'Google Calendar', icon: CalendarDays, conn: gcal },
        ].map((p) => (
          <Card key={p.id}>
            <CardHeader
              title={
                <span className="flex items-center gap-2">
                  <p.icon className="size-4" /> Permisos de {p.name}
                </span>
              }
              action={p.conn ? <Badge tone={p.conn.isDemo ? 'warning' : 'positive'}>{p.conn.isDemo ? 'Modo demo' : 'Conectado'}</Badge> : <Badge>No conectado</Badge>}
            />
            <CardBody className="space-y-3 text-[13px]">
              <div>
                <p className="text-[12px] text-muted">Permiso exacto que pedimos a Google</p>
                <code className="mt-1 block rounded bg-surface-2 px-2 py-1 font-mono text-[12px] break-all">{SCOPES[p.id].scope}</code>
              </div>
              <p>
                <span className="font-medium">Qué significa: </span>
                {SCOPES[p.id].meaning}
              </p>
              <p>
                <span className="font-medium">Qué no hacemos: </span>
                {p.id === 'gmail' ? 'No leemos el cuerpo completo, no guardamos adjuntos, no enviamos ni borramos correos. No asumimos que cualquier correo es un gasto: los que no tienen monto o fecha se descartan.' : 'No guardamos invitados, descripciones ni ubicaciones. No creamos ni modificamos eventos.'}
              </p>
              <Button asChild variant="secondary" size="sm">
                <Link href="/integraciones">{p.conn ? 'Administrar o desconectar' : 'Ver integración'}</Link>
              </Button>
            </CardBody>
          </Card>
        ))}
      </div>

      <section id="ia" className="mt-8 scroll-mt-20">
        <SectionLabel>IA</SectionLabel>
        <Card className="mt-2">
          <CardHeader title="Qué datos usa la IA" subtitle={engine ? `Proveedor configurado: ${engine.label} (${engine.model}), plan gratuito.` : 'No hay proveedor de IA externa configurado: todo se calcula en el servidor de Caudal.'} action={<AiToggle enabled={user.aiExternalEnabled} available={!!engine} />} />
          <CardBody className="space-y-3 text-[13px]">
            <p className="text-fg-2">
              <span className="font-medium text-fg">Se envía:</span> totales del mes, categorías con montos, previsión de fin de mes, capacidad de ahorro y las recomendaciones ya calculadas (incluyen nombres de comercios de microgastos y suscripciones).
            </p>
            <p className="text-fg-2">
              <span className="font-medium text-fg">No se envía:</span> tu nombre, tu email, la lista de movimientos, el contenido de correos ni los datos de eventos más allá de un título corto.
            </p>
            <p className="text-fg-2">Los proveedores gratuitos pueden usar lo que reciben para mejorar sus modelos. Si no querés eso, apagá la IA externa: las recomendaciones siguen funcionando con el motor local.</p>
            <details>
              <summary className="cursor-pointer text-accent hover:underline">Ver exactamente lo que se enviaría ahora</summary>
              <pre className="money mt-2 max-h-80 overflow-auto rounded-2xl bg-surface-2 p-3 font-mono text-[11px] leading-relaxed">{JSON.stringify(payload, null, 2)}</pre>
            </details>
          </CardBody>
        </Card>
      </section>

      <section className="mt-8">
        <SectionLabel>Tus datos</SectionLabel>
        <DataActions email={user.email} />
      </section>
    </>
  )
}
