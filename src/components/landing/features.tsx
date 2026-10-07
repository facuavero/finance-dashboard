import { Check } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { EstimateTag } from '@/components/app/states'
import { cn } from '@/lib/utils'
import { TrendLegend, TrendMock } from './preview'

// fragmentos de ui recortados con números de la cuenta demo (mercury features: cada función se muestra con el componente que la resuelve)

function Feature({ title, body, children, className }: { title: string; body: string; children: React.ReactNode; className?: string }) {
  return (
    <Card className={cn('flex flex-col p-2', className)}>
      <div className="flex min-h-[200px] flex-1 items-center justify-center rounded-2xl bg-surface-2 p-4 sm:p-6" aria-hidden>
        <div className="w-full max-w-[380px]">{children}</div>
      </div>
      <div className="px-4 pt-5 pb-4">
        <h3 className="display text-[28px]">{title}</h3>
        <p className="mt-1 text-[14px] text-fg-2">{body}</p>
      </div>
    </Card>
  )
}

const Kbd = ({ children }: { children: React.ReactNode }) => <kbd className="rounded border border-border bg-surface px-1.5 font-mono text-[11px] text-fg-2">{children}</kbd>

function QuickAdd() {
  return (
    <Card className="p-4 shadow-sm">
      <p className="text-[12px] text-muted">Nuevo gasto</p>
      <p className="mt-1 flex items-center text-[32px] leading-none font-semibold tracking-[-0.03em]">
        <span className="font-mono tracking-[-0.04em]">$4.500</span><span className="ml-0.5 h-8 w-px animate-pulse bg-accent-solid" />
      </p>
      <div className="mt-4 flex flex-wrap gap-1.5">
        {['Café y snacks', 'Supermercado', 'Transporte'].map((c, i) => (
          <span key={c} className={cn('inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[12px]', i === 0 ? 'border-fg bg-fg text-bg' : 'border-border text-fg-2')}>
            {i === 0 && <Check className="size-3" />}
            {c}
          </span>
        ))}
      </div>
      <p className="mt-4 flex items-center gap-3 border-t border-border pt-3 text-[12px] text-muted">
        <span>
          <Kbd>N</Kbd> abre
        </span>
        <span>
          <Kbd>Enter</Kbd> guarda
        </span>
      </p>
    </Card>
  )
}

function Leaks() {
  const rows = [
    { name: 'Delivery', meta: '1,6 por semana', value: '$83.499' },
    { name: 'Cafés, kiosco y snacks', meta: '4,7 por semana', value: '$70.528' },
    { name: 'Viajes en apps', meta: '1,3 por semana', value: '$37.189' },
  ]
  return (
    <Card className="shadow-sm">
      <div className="divide-y divide-border">
        {rows.map((r) => (
          <div key={r.name} className="flex items-center justify-between gap-3 px-4 py-2.5">
            <div className="min-w-0">
              <p className="truncate text-[13px] font-medium">{r.name}</p>
              <p className="text-[12px] text-muted">{r.meta}</p>
            </div>
            <p className="num font-mono tracking-[-0.03em] shrink-0 text-[13px] font-medium">
              {r.value}
              <span className="font-normal text-muted">/mes</span>
            </p>
          </div>
        ))}
        <div className="flex items-center justify-between gap-3 px-4 py-2.5">
          <div className="min-w-0">
            <p className="truncate text-[13px] font-medium">Netflix.com</p>
            <p className="text-[12px] text-muted">Suscripción</p>
          </div>
          <Badge tone="warning">+15% último cobro</Badge>
        </div>
      </div>
      <p className="rounded-b-[10px] bg-positive-soft px-4 py-2 text-[12px] text-positive">Si reducís un 30%: +$60.516/mes · +$726.195/año</p>
    </Card>
  )
}

function Budget() {
  return (
    <Card className="p-4 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[13px] font-medium">Restaurantes y bares</p>
        <Badge tone="positive">En rango</Badge>
      </div>
      <p className="mt-2 text-[13px] text-fg-2">
        <span className="num font-mono tracking-[-0.03em] font-semibold text-fg">$57.100</span> de $170.000
      </p>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-3">
        <div className="h-full w-[34%] rounded-full bg-fg" />
      </div>
      <p className="mt-2 text-[12px] text-muted">Al ritmo actual se agota el 21 oct.</p>
    </Card>
  )
}

const DAILY = [3.1, 3.4, 3.72, 3.5, 3.2, 3.05, 2.9, 2.62].map((v, i) => ({ label: String(i), v }))

function Forecast() {
  return (
    <Card className="p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[12px] text-muted">Cierre de octubre</p>
          <p className="mt-1 font-mono text-[22px] leading-tight font-medium tracking-[-0.045em]">$2.623.042</p>
        </div>
        <EstimateTag />
      </div>
      <TrendMock points={DAILY} estimateFrom={2} min={2.4} max={3.9} className="mt-4 h-[64px]" />
      <TrendLegend className="mt-3" />
    </Card>
  )
}

function Upcoming() {
  const rows = [
    { d: '8', title: 'Netflix.com', meta: 'mañana · recurrente', value: '−$14.999', est: true },
    { d: '9', title: 'Cena con amigos', meta: 'en 2 días · calendar', value: '−$38.892', est: true },
    { d: '10', title: 'Expensas consorcio', meta: 'en 3 días · recurrente', value: '−$98.000', est: true },
  ]
  return (
    <Card className="shadow-sm">
      <div className="divide-y divide-border">
        {rows.map((r) => (
          <div key={r.title} className="flex items-center gap-3 px-4 py-2.5">
            <span className="w-7 shrink-0 text-center leading-none">
              <span className="block text-[14px] font-semibold">{r.d}</span>
              <span className="text-[10px] text-muted uppercase">oct</span>
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-medium">{r.title}</p>
              <p className="text-[12px] text-muted">{r.meta}</p>
            </div>
            <p className="num font-mono tracking-[-0.03em] shrink-0 text-[13px] font-medium">{r.value}</p>
          </div>
        ))}
      </div>
    </Card>
  )
}

export function Features() {
  return (
    <div className="grid gap-4 lg:grid-cols-6">
      <Feature className="lg:col-span-3" title="Cargá un gasto en segundos" body="Tocás N, escribís el monto y Enter. Las categorías que más usás aparecen primero.">
        <QuickAdd />
      </Feature>
      <Feature className="lg:col-span-3" title="Encontrá la plata que se escapa" body="Microgastos, suscripciones que suben y gastos fuera de lo normal, con lo que cuestan por año.">
        <Leaks />
      </Feature>
      <Feature className="lg:col-span-2" title="Presupuestos que avisan antes" body="No te dice que te pasaste. Te dice cuándo te vas a pasar si seguís así.">
        <Budget />
      </Feature>
      <Feature className="lg:col-span-2" title="Sabé cómo cerrás el mes" body="Saldo día por día: real hasta hoy, estimado después. Y un simulador a 1, 3, 5 y 10 años.">
        <Forecast />
      </Feature>
      <Feature className="lg:col-span-2" title="Lo que viene, antes de que llegue" body="Cruza pagos recurrentes con Gmail y Calendar en solo lectura: viajes, reservas y facturas.">
        <Upcoming />
      </Feature>
    </div>
  )
}

/** recomendación tal como la arma ia financiera en la cuenta demo: problema, por qué, qué hacer, impacto calculado */
export function Recommendation() {
  return (
    <Card className="overflow-hidden" aria-hidden>
      <div className="p-5">
        <div className="flex flex-wrap items-center gap-2 text-[12px]">
          <span className="num font-mono tracking-[-0.03em] text-muted">04</span>
          <Badge tone="warning">Prioridad media</Badge>
          <Badge tone="outline">Microgastos</Badge>
        </div>
        <p className="mt-3 text-[16px] font-semibold tracking-[-0.01em]">Detectamos $83.499 mensuales en delivery.</p>
        <p className="mt-2 text-[14px] text-fg-2">
          <span className="font-medium text-fg">Por qué:</span> Son 1,6 compras por semana con un ticket promedio de $12.360. Por separado no pesan, pero suman $1.001.984 por año (4% de tu ingreso).
        </p>
        <p className="mt-1.5 text-[14px] text-fg-2">
          <span className="font-medium text-fg">Qué hacer:</span> Pedir la mitad de las veces y cocinar esas noches. Reducirlo un 40% alcanza.
        </p>
      </div>
      <div className="flex flex-wrap items-end justify-between gap-3 border-t border-border bg-surface-2 px-5 py-4">
        <div>
          <p className="flex items-center gap-2 text-[12px] text-muted">
            Impacto estimado <EstimateTag />
          </p>
          <p className="mt-1 font-mono text-[26px] leading-tight font-medium tracking-[-0.045em] text-positive">
            $33.399<span className="text-[13px] font-normal text-muted">/mes</span>
          </p>
          <p className="text-[12px] text-muted">$400.794 al año</p>
        </div>
        <p className="text-[12px] text-muted">Calculado por el motor, no por la IA</p>
      </div>
    </Card>
  )
}

export const SUGGESTED_QUESTIONS = ['¿Cuánto gasté en delivery este mes?', '¿Cómo cierro el mes?', '¿Cuánto pago en suscripciones?', '¿Qué gastos se vienen?', '¿Cuánto puedo ahorrar?']
