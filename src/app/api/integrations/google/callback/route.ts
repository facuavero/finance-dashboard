import { NextResponse, type NextRequest } from 'next/server'
import { getDb } from '@/db/client'
import { getCurrentUser } from '@/modules/auth/session'
import { exchangeCode, saveConnection, syncIntegration, type Provider } from '@/modules/integrations/google'

export async function GET(req: NextRequest) {
  const back = (q: string) => {
    const res = NextResponse.redirect(new URL(`/integraciones?${q}`, req.url))
    res.cookies.delete({ name: 'caudal_oauth', path: '/api/integrations/google' })
    return res
  }
  const user = await getCurrentUser()
  if (!user) return NextResponse.redirect(new URL('/login', req.url))

  const [state, provider, uid] = (req.cookies.get('caudal_oauth')?.value ?? '').split(':')
  const sp = req.nextUrl.searchParams
  if (sp.get('error')) return back('error=cancelado')
  if (!state || state !== sp.get('state') || uid !== user.id || (provider !== 'gmail' && provider !== 'gcal')) return back('error=estado')
  const code = sp.get('code')
  if (!code) return back('error=codigo')

  try {
    const tokens = await exchangeCode(code)
    const db = await getDb()
    await saveConnection(db, user.id, provider as Provider, tokens)
    await syncIntegration(db, user.id, provider as Provider).catch(() => null)
    return back(`conectado=${provider}`)
  } catch (err) {
    console.error('[caudal] oauth google', err)
    return back('error=google')
  }
}
