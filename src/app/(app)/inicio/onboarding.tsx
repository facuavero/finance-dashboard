'use client'

import Link from 'next/link'
import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ArrowRight, Database, Plug, Plus, Wallet } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useQuickAdd } from '@/components/app/quick-add'
import { loadDemoDataAction } from '@/modules/finance/actions'

// estado vacío del inicio: enseña qué va a aparecer y da 3 caminos concretos
export function Onboarding({ name, welcome }: { name: string; welcome: boolean }) {
  const quick = useQuickAdd()
  const router = useRouter()
  const [pending, start] = useTransition()
  const steps = [
    { icon: Wallet, title: 'Cargá tu saldo actual', body: 'Lo que tenés hoy entre cuentas y efectivo. Es el punto de partida del capital.', action: <Button asChild variant="secondary" size="sm"><Link href="/configuracion#saldo">Cargar saldo</Link></Button> },
    { icon: Plus, title: 'Registrá tu primer gasto', body: 'Monto y categoría. Tarda 5 segundos. Atajo: tecla N.', action: <Button size="sm" onClick={() => quick.open()}>Nuevo movimiento</Button> },
    { icon: Plug, title: 'Conectá Gmail y Calendar', body: 'Opcional. Detectamos facturas, reservas y viajes para anticipar gastos.', action: <Button asChild variant="secondary" size="sm"><Link href="/integraciones">Ver integraciones</Link></Button> },
  ]
  return (
    <div className="mx-auto max-w-3xl py-4">
      <p className="label-caps">{welcome ? 'Cuenta creada' : 'Empecemos'}</p>
      <h1 className="display mt-3 text-[40px] sm:text-[52px]">Hola, {name}. Armemos tu tablero.</h1>
      <p className="mt-2 max-w-xl text-[15px] text-fg-2">Con unos pocos movimientos ya te mostramos en qué se va tu plata, cuánto podés ahorrar y qué gastos se vienen.</p>
      <ol className="mt-8 space-y-3">
        {steps.map((s, i) => (
          <li key={s.title}>
            <Card className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface-2 text-fg-2">
                <s.icon className="size-5" aria-hidden />
              </span>
              <div className="flex-1">
                <p className="text-[15px] font-medium">
                  <span className="num mr-2 text-muted">{i + 1}.</span>
                  {s.title}
                </p>
                <p className="mt-0.5 text-[13px] text-muted">{s.body}</p>
              </div>
              {s.action}
            </Card>
          </li>
        ))}
      </ol>
      <Card className="mt-6 flex flex-col gap-4 border-dashed bg-transparent p-5 sm:flex-row sm:items-center">
        <Database className="size-5 shrink-0 text-muted" aria-hidden />
        <div className="flex-1">
          <p className="text-[15px] font-medium">¿Querés ver cómo se ve con datos?</p>
          <p className="mt-0.5 text-[13px] text-muted">Cargamos 6 meses de movimientos de ejemplo. Después los borrás con un clic desde Privacidad.</p>
        </div>
        <Button
          variant="secondary"
          loading={pending}
          onClick={() =>
            start(async () => {
              const r = await loadDemoDataAction()
              if (!r.ok) toast.error(r.error)
              else {
                toast.success('Cargamos los datos de ejemplo')
                router.refresh()
              }
            })
          }
        >
          Cargar ejemplo <ArrowRight />
        </Button>
      </Card>
    </div>
  )
}
