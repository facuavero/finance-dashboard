import type { Metadata } from 'next'
import { LoginForm } from './login-form'

export const metadata: Metadata = { title: 'Iniciar sesión' }

export default async function LoginPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams
  const notice = sp.restablecida ? 'Listo, tu contraseña se cambió. Iniciá sesión con la nueva.' : sp.eliminada ? 'Tu cuenta y todos sus datos se eliminaron.' : sp.salida ? 'Cerraste sesión.' : null
  return <LoginForm next={sp.next ?? ''} notice={notice} demo={process.env.DEMO_MODE !== 'false'} />
}
