import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import { Sparkles } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { PageHeader } from '@/components/app/states'
import { getAppData } from '@/modules/app/data'
import { generateReport } from '@/modules/ai/service'
import { ruleSummary } from '@/modules/ai/rules'
import { availableEngine } from '@/modules/ai/providers'
import { AskBox, Recommendations, RegenerateButton } from './ia-client'

export const metadata: Metadata = { title: 'IA financiera' }

async function Report() {
  const { db, user, ctx, recommendations, combined } = await getAppData()
  const report = await generateReport(db, user, ctx, recommendations, combined)
  return <Recommendations summary={report.summary} upcoming={report.upcoming} recs={report.recommendations} engine={report.engine} note={report.note} generatedAt={report.generatedAt} />
}

async function Fallback() {
  const { ctx, recommendations, combined } = await getAppData()
  return <Recommendations summary={ruleSummary(ctx)} upcoming={combined.summary} recs={recommendations} engine="Analizando con IA…" note={null} generatedAt={null} pending />
}

export default async function IaPage() {
  const { ctx, user } = await getAppData()
  const engine = availableEngine()
  return (
    <>
      <PageHeader
        title="IA financiera"
        description="Recomendaciones con tus datos reales: qué detectamos, por qué importa, qué hacer y cuánto impacta."
        actions={engine && user.aiExternalEnabled ? <RegenerateButton /> : null}
      />
      <Card className="mb-6 flex flex-col gap-2 p-4 text-[13px] text-fg-2 sm:flex-row sm:items-center">
        <Sparkles className="size-4 shrink-0 text-accent" aria-hidden />
        <p className="flex-1">
          <span className="font-medium text-fg">Cómo funciona:</span> Caudal calcula los montos con tus movimientos (microgastos, recurrentes, anomalías, presupuestos, objetivos).{' '}
          {engine && user.aiExternalEnabled ? `${engine.label} (gratis) redacta la explicación y ordena prioridades, pero no puede cambiar los números.` : 'Ahora mismo todo sale del motor de reglas local, sin IA externa.'}{' '}
          <Link href="/privacidad#ia" className="text-accent hover:underline">
            Qué datos se usan
          </Link>
        </p>
      </Card>
      {ctx.hasData ? (
        <>
          <AskBox />
          <Suspense fallback={<Fallback />}>
            <Report />
          </Suspense>
        </>
      ) : (
        <Card className="p-8 text-center text-sm text-muted">Cargá algunos movimientos y acá vas a ver recomendaciones con tus números.</Card>
      )}
    </>
  )
}
