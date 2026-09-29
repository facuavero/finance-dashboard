import type { Metadata } from 'next'
import { eq } from 'drizzle-orm'
import { schema } from '@/db/client'
import { getAppData } from '@/modules/app/data'
import { SCOPES, isGoogleConfigured } from '@/modules/integrations/google'
import { PageHeader } from '@/components/app/states'
import { IntegrationsView } from './integrations-view'

export const metadata: Metadata = { title: 'Integraciones' }

export default async function Integraciones({ searchParams }: { searchParams: Promise<{ conectado?: string; error?: string }> }) {
  const { db, user, signals } = await getAppData()
  const sp = await searchParams
  const rows = await db.select().from(schema.integrations).where(eq(schema.integrations.userId, user.id))
  const items = await db.select().from(schema.integrationItems).where(eq(schema.integrationItems.userId, user.id))
  const conn = (p: 'gmail' | 'gcal') => {
    const r = rows.find((x) => x.provider === p)
    return r ? { status: r.status, isDemo: r.isDemo, accountEmail: r.accountEmail, lastSyncedAt: r.lastSyncedAt?.toISOString() ?? null, lastError: r.lastError, scopes: r.scopes } : null
  }
  const list = (p: 'gmail' | 'gcal') =>
    items
      .filter((i) => i.provider === p)
      .sort((a, b) => (b.occursOn ?? '').localeCompare(a.occursOn ?? ''))
      .map((i) => ({ id: i.id, kind: i.kind, title: i.title, merchant: i.merchant, amountCents: i.amountCents, occursOn: i.occursOn, confidence: i.confidence, evidence: i.evidence, dismissed: i.dismissed }))
  return (
    <>
      <PageHeader title="Integraciones" description="Conectá Gmail y Google Calendar para anticipar gastos. Solo lectura, desconectás cuando quieras y tus movimientos manuales nunca se tocan." />
      <IntegrationsView
        googleReady={isGoogleConfigured()}
        notice={sp.conectado ? `Listo, ${sp.conectado === 'gmail' ? 'Gmail' : 'Google Calendar'} quedó conectado.` : null}
        error={sp.error ?? null}
        providers={[
          { id: 'gmail', name: 'Gmail', connection: conn('gmail'), scope: SCOPES.gmail, items: list('gmail') },
          { id: 'gcal', name: 'Google Calendar', connection: conn('gcal'), scope: SCOPES.gcal, items: list('gcal') },
        ]}
        activeSignals={signals.length}
      />
    </>
  )
}
