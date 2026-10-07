import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import { Card } from '@/components/ui/card'
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
      {/* la pregunta es la protagonista (v0, chronicle) */}
      <div className="mx-auto max-w-[760px] pt-4 pb-10 text-center sm:pt-10">
        <p className="label-caps">IA financiera</p>
        <h1 className="display mt-3 text-[40px] sm:text-[56px]">¿Qué querés saber de tu plata?</h1>
        <p className="mx-auto mt-3 max-w-xl text-[15px] text-fg-2">
          Caudal calcula los montos con tus movimientos. {engine && user.aiExternalEnabled ? `${engine.label} (gratis) los explica y ordena prioridades, pero no puede cambiar los números.` : 'Ahora todo sale del motor de reglas local, sin IA externa.'}{' '}
          <Link href="/privacidad#ia" className="text-accent hover:underline">
            Qué datos se usan
          </Link>
        </p>
        {engine && user.aiExternalEnabled ? (
          <div className="mt-4 flex justify-center">
            <RegenerateButton />
          </div>
        ) : null}
        {ctx.hasData && (
          <div className="mt-8 text-left">
            <AskBox />
          </div>
        )}
      </div>
      {ctx.hasData ? (
        <Suspense fallback={<Fallback />}>
          <Report />
        </Suspense>
      ) : (
        <Card className="p-8 text-center text-sm text-muted">Cargá algunos movimientos y acá vas a ver recomendaciones con tus números.</Card>
      )}
    </>
  )
}
