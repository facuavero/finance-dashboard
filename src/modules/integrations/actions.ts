'use server'

import { revalidatePath } from 'next/cache'
import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { getDb, schema } from '@/db/client'
import { requireUser } from '@/modules/auth/session'
import { todayISO } from '@/modules/analytics/dates'
import { connectDemoIntegration } from '@/modules/demo/seed'
import { disconnect, syncIntegration, type Provider } from './google'

const provider = z.enum(['gmail', 'gcal'])
const done = () => revalidatePath('/', 'layout')

export async function connectDemoAction(p: Provider) {
  const user = await requireUser()
  await connectDemoIntegration(await getDb(), user.id, provider.parse(p), todayISO())
  done()
  return { ok: true as const }
}

export async function syncAction(p: Provider) {
  const user = await requireUser()
  try {
    const r = await syncIntegration(await getDb(), user.id, provider.parse(p))
    done()
    return { ok: true as const, count: r.count }
  } catch (e) {
    done()
    return { ok: false as const, error: e instanceof Error ? e.message : 'No se pudo sincronizar' }
  }
}

export async function disconnectAction(p: Provider) {
  const user = await requireUser()
  await disconnect(await getDb(), user.id, provider.parse(p))
  done()
  return { ok: true as const }
}

export async function dismissItemAction(id: string) {
  const user = await requireUser()
  const db = await getDb()
  await db.update(schema.integrationItems).set({ dismissed: true }).where(and(eq(schema.integrationItems.id, z.string().parse(id)), eq(schema.integrationItems.userId, user.id)))
  done()
  return { ok: true as const }
}
