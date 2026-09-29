import { redirect } from 'next/navigation'
import { Check, Sparkles } from 'lucide-react'
import { Logo } from '@/components/app/logo'
import { getCurrentUser } from '@/modules/auth/session'

// split: formulario angosto a la izquierda, producto real y beneficios a la derecha (monarch + origin)
export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  if (await getCurrentUser()) redirect('/inicio')
  return (
    <div className="grid min-h-dvh lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
      <main className="flex flex-col px-5 py-6 sm:px-10">
        <Logo />
        <div className="mx-auto flex w-full max-w-[380px] flex-1 flex-col justify-center py-10">{children}</div>
        <p className="text-center text-[12px] text-muted">Tus datos son tuyos. Podés exportarlos o borrarlos cuando quieras.</p>
      </main>
      <aside className="hidden border-l border-border bg-surface-2 lg:flex lg:flex-col lg:justify-center lg:px-14" aria-label="Qué hace Caudal">
        <div className="max-w-[480px]">
          <p className="label-caps">Inteligencia financiera personal</p>
          <h2 className="mt-3 text-[28px] leading-tight font-semibold tracking-[-0.02em]">Qué pasó con tu plata, por qué pasó y qué conviene hacer ahora.</h2>
          <ul className="mt-6 space-y-3 text-[15px] text-fg-2">
            {['Detecta microgastos, suscripciones y fugas de dinero', 'Predice tu saldo a fin de mes y tus próximos gastos', 'Cruza Gmail y Calendar para anticipar viajes, facturas y reservas'].map((t) => (
              <li key={t} className="flex gap-2.5">
                <Check className="mt-0.5 size-4 shrink-0 text-positive" aria-hidden />
                {t}
              </li>
            ))}
          </ul>
          <div className="mt-8 rounded-xl border border-border bg-surface p-4 shadow-sm">
            <div className="flex items-center gap-2 text-[13px] font-medium">
              <Sparkles className="size-4 text-accent" aria-hidden /> Recomendación
              <span className="ml-auto rounded-full bg-critical-soft px-2 py-0.5 text-[11px] text-critical">prioridad alta</span>
            </div>
            <p className="mt-2 text-[15px] font-medium">Detectamos $31.500 mensuales en delivery.</p>
            <p className="mt-1 text-[13px] text-muted">Reducirlo un 40% representaría aproximadamente $12.600 de ahorro mensual y $151.200 al año.</p>
          </div>
        </div>
      </aside>
    </div>
  )
}
