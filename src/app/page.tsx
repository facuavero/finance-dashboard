import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { Landing } from '@/components/landing/landing'
import { getCurrentUser } from '@/modules/auth/session'

export const metadata: Metadata = {
  title: { absolute: 'Caudal · Inteligencia financiera personal' },
  description: 'Caudal te dice qué pasó con tu plata, por qué pasó, qué puede pasar y qué conviene hacer ahora. Gratis, sin conectar el banco.',
}

// con sesión va directo a la app. sin sesión, la landing
export default async function Root() {
  if (await getCurrentUser()) redirect('/inicio')
  return <Landing demo={process.env.DEMO_MODE !== 'false'} />
}
