import { NextResponse, type NextRequest } from 'next/server'
import { randomBytes } from 'node:crypto'
import { getCurrentUser } from '@/modules/auth/session'
import { authUrl, isGoogleConfigured } from '@/modules/integrations/google'
import { DEMO_EMAIL } from '@/modules/demo/constants'

export async function GET(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.redirect(new URL('/login', req.url))
  const provider = req.nextUrl.searchParams.get('provider')
  if (provider !== 'gmail' && provider !== 'gcal') return NextResponse.redirect(new URL('/integraciones?error=proveedor', req.url))
  if (!isGoogleConfigured()) return NextResponse.redirect(new URL('/integraciones?error=no-configurado', req.url))
  // la cuenta demo es compartida: nunca se conecta una cuenta real de google ahí
  if (user.email === DEMO_EMAIL) return NextResponse.redirect(new URL('/integraciones?error=demo', req.url))

  // state contra csrf: se guarda en cookie y google lo devuelve en el callback
  const state = randomBytes(24).toString('base64url')
  const res = NextResponse.redirect(authUrl(provider, state))
  res.cookies.set('caudal_oauth', `${state}:${provider}:${user.id}`, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/api/integrations/google', maxAge: 600 })
  return res
}
