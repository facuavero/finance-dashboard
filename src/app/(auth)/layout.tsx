import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Gem, Logo } from '@/components/app/logo'
import { getCurrentUser } from '@/modules/auth/session'

// split oscuro (cosmos): a la izquierda el rubí con su brillo y la promesa, a la derecha el formulario
export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  if (await getCurrentUser()) redirect('/inicio')
  return (
    <div className="grid min-h-dvh lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
      <aside className="relative hidden overflow-hidden border-r border-border lg:flex lg:flex-col lg:justify-between lg:p-12" aria-label="Qué hace Caudal">
        <div className="pointer-events-none absolute top-1/2 left-1/2 size-[640px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,var(--glow-strong),transparent)]" aria-hidden />
        <Link href="/" aria-label="Caudal, inicio" className="relative">
          <Logo />
        </Link>
        <div className="relative flex justify-center">
          <Gem className="size-56 drop-shadow-[0_30px_60px_rgb(224_18_61_/_0.35)]" />
        </div>
        <div className="relative max-w-[460px]">
          <p className="display text-[40px]">Qué pasó con tu plata, por qué y qué conviene hacer ahora.</p>
          <p className="mt-4 font-mono text-[12px] text-muted">microgastos · suscripciones · saldo a fin de mes · gmail y calendar en solo lectura</p>
        </div>
      </aside>
      <main className="relative flex flex-col px-5 py-6 sm:px-10">
        {/* en mobile no entra el split: el brillo va detrás del formulario (fey) */}
        <div className="pointer-events-none absolute inset-x-0 top-24 mx-auto size-[420px] rounded-full bg-[radial-gradient(closest-side,var(--glow),transparent)] lg:hidden" aria-hidden />
        <Link href="/" aria-label="Caudal, inicio" className="relative lg:invisible">
          <Logo />
        </Link>
        <div className="relative mx-auto flex w-full max-w-[380px] flex-1 flex-col justify-center py-10">{children}</div>
        <p className="relative text-center text-[12px] text-muted">Tus datos son tuyos. Podés exportarlos o borrarlos cuando quieras.</p>
      </main>
    </div>
  )
}
