import { redirect } from 'next/navigation'
import { demoLoginAction } from '@/modules/auth/actions'

// el botón "Probar la demo" de la landing estática hace POST acá. crea la sesión de la cuenta demo y redirige a /inicio
export async function POST(req: Request) {
  const origin = req.headers.get('origin')
  if (origin && new URL(origin).host !== new URL(req.url).host) redirect('/')
  return demoLoginAction()
}
