import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/modules/auth/session'
import html from './landing.generated'

// la landing es HTML/CSS/JS plano: public/landing/index.html (+ landing.css, landing.js, gem.js).
// con sesión va directo a la app. sin sesión, se sirve ese HTML tal cual en "/"
export const dynamic = 'force-dynamic'

export async function GET() {
  if (await getCurrentUser()) redirect('/inicio')
  return new Response(html, { headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'private, no-cache', vary: 'Cookie' } })
}
