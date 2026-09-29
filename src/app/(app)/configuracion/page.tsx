import type { Metadata } from 'next'
import { PageHeader } from '@/components/app/states'
import { getAppData } from '@/modules/app/data'
import { listSessionsCount } from '@/modules/settings/actions'
import { SettingsView } from './settings-view'

export const metadata: Metadata = { title: 'Configuración' }

export default async function Configuracion() {
  const { user, finance } = await getAppData()
  const sessions = await listSessionsCount()
  return (
    <>
      <PageHeader title="Configuración" description="Tu perfil, tu punto de partida y cómo analizamos tus datos." />
      <SettingsView
        user={{ name: user.name, email: user.email, initialBalanceCents: user.initialBalanceCents, microThresholdCents: user.microThresholdCents }}
        categories={finance.cats.map((c) => ({ id: c.id, name: c.name, kind: c.kind, parentId: c.parentId, icon: c.icon }))}
        sessions={sessions}
      />
    </>
  )
}
