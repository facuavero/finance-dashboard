import { and, eq } from 'drizzle-orm'
import { type DB, schema } from '@/db/client'
import type { Integration } from '@/db/schema'
import { newId } from '@/lib/ids'
import { decrypt, encrypt, hasEncryptionKey } from './crypto'
import { type RawEmail, type RawEvent, parseEmail, parseEvent } from './parse'

export type Provider = 'gmail' | 'gcal'

// solo lectura. nada de enviar, borrar ni modificar correos o eventos.
export const SCOPES: Record<Provider, { scope: string; label: string; meaning: string }> = {
  gmail: {
    scope: 'https://www.googleapis.com/auth/gmail.readonly',
    label: 'gmail.readonly',
    meaning: 'Leer tus correos y sus metadatos. No puede enviar, borrar ni modificar nada.',
  },
  gcal: {
    scope: 'https://www.googleapis.com/auth/calendar.readonly',
    label: 'calendar.readonly',
    meaning: 'Ver los eventos de tus calendarios. No puede crear, editar ni borrar eventos.',
  },
}

export const isGoogleConfigured = () => !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && hasEncryptionKey())

const redirectUri = () => `${process.env.APP_URL || 'http://localhost:3000'}/api/integrations/google/callback`

export function authUrl(provider: Provider, state: string) {
  const p = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: redirectUri(),
    response_type: 'code',
    scope: `openid email ${SCOPES[provider].scope}`,
    access_type: 'offline',
    prompt: 'consent',
    include_granted_scopes: 'false',
    state,
  })
  return `https://accounts.google.com/o/oauth2/v2/auth?${p}`
}

type TokenResponse = { access_token: string; expires_in: number; refresh_token?: string; scope: string; id_token?: string }

async function tokenRequest(body: Record<string, string>): Promise<TokenResponse> {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: process.env.GOOGLE_CLIENT_ID!, client_secret: process.env.GOOGLE_CLIENT_SECRET!, ...body }),
  })
  if (!res.ok) throw new Error(`google token ${res.status}`)
  return res.json()
}

export const exchangeCode = (code: string) => tokenRequest({ code, grant_type: 'authorization_code', redirect_uri: redirectUri() })

/** email de la cuenta conectada, leído del id_token (viene firmado de google por https) */
export function emailFromIdToken(idToken?: string): string | null {
  if (!idToken) return null
  try {
    const payload = JSON.parse(Buffer.from(idToken.split('.')[1], 'base64url').toString('utf8'))
    return typeof payload.email === 'string' ? payload.email : null
  } catch {
    return null
  }
}

export async function saveConnection(db: DB, userId: string, provider: Provider, t: TokenResponse) {
  await db.delete(schema.integrations).where(and(eq(schema.integrations.userId, userId), eq(schema.integrations.provider, provider)))
  const id = newId()
  await db.insert(schema.integrations).values({
    id,
    userId,
    provider,
    isDemo: false,
    scopes: t.scope,
    accountEmail: emailFromIdToken(t.id_token),
    accessTokenEnc: encrypt(t.access_token),
    refreshTokenEnc: t.refresh_token ? encrypt(t.refresh_token) : null,
    tokenExpiresAt: new Date(Date.now() + (t.expires_in - 60) * 1000),
  })
  return id
}

async function accessToken(db: DB, i: Integration): Promise<string> {
  if (i.accessTokenEnc && i.tokenExpiresAt && i.tokenExpiresAt.getTime() > Date.now()) return decrypt(i.accessTokenEnc)
  if (!i.refreshTokenEnc) throw new Error('La conexión venció. Volvé a conectar.')
  const t = await tokenRequest({ refresh_token: decrypt(i.refreshTokenEnc), grant_type: 'refresh_token' })
  await db
    .update(schema.integrations)
    .set({ accessTokenEnc: encrypt(t.access_token), tokenExpiresAt: new Date(Date.now() + (t.expires_in - 60) * 1000) })
    .where(eq(schema.integrations.id, i.id))
  return t.access_token
}

async function gget<T>(token: string, url: string): Promise<T> {
  const res = await fetch(url, { headers: { authorization: `Bearer ${token}` } })
  if (!res.ok) throw new Error(`google api ${res.status}`)
  return res.json()
}

const GMAIL_QUERY =
  'newer_than:60d -category:promotions -category:social (factura OR recibo OR comprobante OR reserva OR "tu compra" OR "tu pedido" OR suscripción OR renovación OR vencimiento OR "pago aprobado" OR "transferencia recibida" OR vuelo OR itinerario OR booking OR receipt OR invoice)'

async function fetchGmail(token: string): Promise<RawEmail[]> {
  const list = await gget<{ messages?: { id: string }[] }>(token, `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=60&q=${encodeURIComponent(GMAIL_QUERY)}`)
  const out: RawEmail[] = []
  for (const m of list.messages ?? []) {
    const msg = await gget<{ id: string; snippet: string; internalDate: string; payload: { headers: { name: string; value: string }[] } }>(
      token,
      `https://gmail.googleapis.com/gmail/v1/users/me/messages/${m.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From`,
    )
    const h = (n: string) => msg.payload.headers.find((x) => x.name.toLowerCase() === n)?.value ?? ''
    // solo asunto, remitente y el fragmento que google ya expone. nunca el cuerpo completo.
    out.push({ id: msg.id, subject: h('subject'), from: h('from'), snippet: msg.snippet.replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&'), date: new Date(Number(msg.internalDate)).toISOString().slice(0, 10) })
  }
  return out
}

async function fetchCalendar(token: string): Promise<RawEvent[]> {
  const now = Date.now()
  const p = new URLSearchParams({ timeMin: new Date(now - 3 * 86_400_000).toISOString(), timeMax: new Date(now + 60 * 86_400_000).toISOString(), singleEvents: 'true', orderBy: 'startTime', maxResults: '100' })
  const data = await gget<{ items?: { id: string; summary?: string; start?: { date?: string; dateTime?: string }; end?: { date?: string; dateTime?: string } }[] }>(token, `https://www.googleapis.com/calendar/v3/calendars/primary/events?${p}`)
  return (data.items ?? [])
    .filter((e) => e.summary && (e.start?.date || e.start?.dateTime))
    .map((e) => {
      const start = (e.start!.date ?? e.start!.dateTime!).slice(0, 10)
      // en eventos de día completo google pone el fin como el día siguiente (exclusivo)
      let end = (e.end?.date ?? e.end?.dateTime ?? '').slice(0, 10) || null
      if (e.end?.date && end) end = new Date(new Date(`${end}T00:00:00Z`).getTime() - 86_400_000).toISOString().slice(0, 10)
      return { id: e.id, summary: e.summary!, start, end }
    })
}

export async function syncIntegration(db: DB, userId: string, provider: Provider) {
  const rows = await db.select().from(schema.integrations).where(and(eq(schema.integrations.userId, userId), eq(schema.integrations.provider, provider))).limit(1)
  const i = rows[0]
  if (!i) throw new Error('Integración no conectada')
  if (i.isDemo) {
    await db.update(schema.integrations).set({ lastSyncedAt: new Date() }).where(eq(schema.integrations.id, i.id))
    return { count: -1 }
  }
  try {
    const token = await accessToken(db, i)
    const parsed = provider === 'gmail' ? (await fetchGmail(token)).map(parseEmail).filter((p) => p !== null) : (await fetchCalendar(token)).map(parseEvent)
    // se conservan los descartes del usuario
    const dismissed = new Set(
      (await db.select({ externalId: schema.integrationItems.externalId }).from(schema.integrationItems).where(and(eq(schema.integrationItems.integrationId, i.id), eq(schema.integrationItems.dismissed, true)))).map((r) => r.externalId),
    )
    await db.delete(schema.integrationItems).where(eq(schema.integrationItems.integrationId, i.id))
    if (parsed.length) {
      await db.insert(schema.integrationItems).values(
        parsed.map((p) => ({ id: newId(), userId, integrationId: i.id, provider, externalId: p!.externalId, kind: p!.kind, title: p!.title, merchant: p!.merchant, amountCents: p!.amountCents, currency: p!.currency, occursOn: p!.occursOn, endsOn: p!.endsOn, confidence: p!.confidence, evidence: p!.evidence, dismissed: dismissed.has(p!.externalId) })),
      )
    }
    await db.update(schema.integrations).set({ lastSyncedAt: new Date(), status: 'connected', lastError: null }).where(eq(schema.integrations.id, i.id))
    return { count: parsed.length }
  } catch (err) {
    await db.update(schema.integrations).set({ status: 'error', lastError: err instanceof Error ? err.message : 'error' }).where(eq(schema.integrations.id, i.id))
    throw err
  }
}

/** desconectar: revoca en google y borra tokens + hallazgos. los movimientos manuales no se tocan. */
export async function disconnect(db: DB, userId: string, provider: Provider) {
  const rows = await db.select().from(schema.integrations).where(and(eq(schema.integrations.userId, userId), eq(schema.integrations.provider, provider))).limit(1)
  const i = rows[0]
  if (!i) return
  if (!i.isDemo && (i.refreshTokenEnc || i.accessTokenEnc)) {
    try {
      const token = decrypt(i.refreshTokenEnc ?? i.accessTokenEnc!)
      await fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(token)}`, { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' } })
    } catch (err) {
      console.error('[caudal] no se pudo revocar el token', err)
    }
  }
  await db.delete(schema.integrations).where(eq(schema.integrations.id, i.id)) // cascade borra integration_items
}
