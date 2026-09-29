import { NextResponse, type NextRequest } from 'next/server'

// filtro rápido: sin cookie de sesión no se entra a rutas privadas. la validación real ocurre en el servidor (requireUser).
const PUBLIC = ['/login', '/registro', '/recuperar', '/restablecer']

export function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl
  const hasSession = req.cookies.has('caudal_session')
  const isPublic = PUBLIC.some((p) => pathname === p || pathname.startsWith(`${p}/`))
  if (!hasSession && !isPublic && pathname !== '/') {
    const url = req.nextUrl.clone()
    url.pathname = '/login'
    url.search = `?next=${encodeURIComponent(pathname + search)}`
    return NextResponse.redirect(url)
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api/integrations/google/callback|_next/static|_next/image|favicon.ico|icon.svg|.*\\.(?:png|svg|jpg|webp|ico)$).*)'],
}
