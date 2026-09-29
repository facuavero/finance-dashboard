import 'server-only'
import { cache } from 'react'
import { cookies, headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { createHash, randomBytes } from 'node:crypto'
import { eq, lt } from 'drizzle-orm'
import { getDb, schema } from '@/db/client'
import type { User } from '@/db/schema'

export const SESSION_COOKIE = 'caudal_session'
const PERSISTENT_DAYS = 30
const SHORT_HOURS = 12

const sha256 = (v: string) => createHash('sha256').update(v).digest('hex')

export async function createSession(userId: string, persistent: boolean) {
  const db = await getDb()
  const token = randomBytes(32).toString('base64url')
  const ms = persistent ? PERSISTENT_DAYS * 86_400_000 : SHORT_HOURS * 3_600_000
  const expiresAt = new Date(Date.now() + ms)
  const ua = (await headers()).get('user-agent')?.slice(0, 200) ?? null

  await db.insert(schema.sessions).values({ id: sha256(token), userId, expiresAt, persistent, userAgent: ua })
  // limpieza oportunista de sesiones vencidas
  await db.delete(schema.sessions).where(lt(schema.sessions.expiresAt, new Date()))

  const store = await cookies()
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    // sin maxAge la cookie muere al cerrar el navegador
    ...(persistent ? { maxAge: PERSISTENT_DAYS * 86_400 } : {}),
  })
}

export const getCurrentUser = cache(async (): Promise<User | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value
  if (!token) return null
  const db = await getDb()
  const rows = await db
    .select({ user: schema.users, expiresAt: schema.sessions.expiresAt })
    .from(schema.sessions)
    .innerJoin(schema.users, eq(schema.users.id, schema.sessions.userId))
    .where(eq(schema.sessions.id, sha256(token)))
    .limit(1)
  const row = rows[0]
  if (!row || row.expiresAt.getTime() < Date.now()) return null
  return row.user
})

export async function requireUser(): Promise<User> {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  return user
}

export async function destroySession() {
  const store = await cookies()
  const token = store.get(SESSION_COOKIE)?.value
  if (token) {
    const db = await getDb()
    await db.delete(schema.sessions).where(eq(schema.sessions.id, sha256(token)))
  }
  store.delete(SESSION_COOKIE)
}

export async function destroyAllSessions(userId: string) {
  const db = await getDb()
  await db.delete(schema.sessions).where(eq(schema.sessions.userId, userId))
}

export { sha256 }
