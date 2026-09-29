'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { sql } from 'drizzle-orm'
import { getDb, schema } from '@/db/client'
import { requireUser } from '@/modules/auth/session'

async function setState(key: string, status: 'dismissed' | 'snoozed', until: Date | null) {
  const user = await requireUser()
  const db = await getDb()
  const alertKey = z.string().min(1).max(500).parse(key)
  await db
    .insert(schema.alertStates)
    .values({ userId: user.id, alertKey, status, until })
    .onConflictDoUpdate({ target: [schema.alertStates.userId, schema.alertStates.alertKey], set: { status, until, updatedAt: sql`now()` } })
  revalidatePath('/', 'layout')
}

export async function dismissAlertAction(key: string) {
  await setState(key, 'dismissed', null)
  return { ok: true as const }
}

export async function snoozeAlertAction(key: string, days: number) {
  await setState(key, 'snoozed', new Date(Date.now() + z.number().int().min(1).max(30).parse(days) * 86_400_000))
  return { ok: true as const }
}

export async function restoreAlertsAction() {
  const user = await requireUser()
  const db = await getDb()
  await db.delete(schema.alertStates).where(sql`${schema.alertStates.userId} = ${user.id}`)
  revalidatePath('/', 'layout')
  return { ok: true as const }
}
