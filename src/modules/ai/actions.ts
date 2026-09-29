'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { getAppData } from '@/modules/app/data'
import { rateLimit } from '@/modules/auth/rate-limit'
import { answerQuestion, generateReport } from './service'

export async function askAction(question: string): Promise<{ ok: true; answer: string; engine: string } | { ok: false; error: string }> {
  const q = z.string().trim().min(3, 'Escribí una pregunta').max(500).safeParse(question)
  if (!q.success) return { ok: false, error: q.error.issues[0].message }
  const { user, ctx, recommendations, combined } = await getAppData()
  const limit = rateLimit(`ask:${user.id}`, 20, 60 * 60_000)
  if (!limit.ok) return { ok: false, error: 'Llegaste al límite de preguntas por hora. Probá más tarde.' }
  const res = await answerQuestion(user, ctx, recommendations, combined, q.data)
  return { ok: true, ...res }
}

export async function regenerateAction() {
  const { db, user, ctx, recommendations, combined } = await getAppData()
  const limit = rateLimit(`regen:${user.id}`, 6, 60 * 60_000)
  if (!limit.ok) return { ok: false as const, error: 'Ya regeneraste varias veces esta hora.' }
  await generateReport(db, user, ctx, recommendations, combined, { force: true })
  revalidatePath('/ia')
  revalidatePath('/inicio')
  return { ok: true as const }
}
