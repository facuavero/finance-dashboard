import Link from 'next/link'
import { Sparkles } from 'lucide-react'
import { getAppData } from '@/modules/app/data'
import { generateReport } from '@/modules/ai/service'
import { ruleSummary } from '@/modules/ai/rules'

function Frame({ text, engine, note, pending }: { text: string; engine: string; note?: string | null; pending?: boolean }) {
  return (
    <section aria-labelledby="ai-summary-title" className="rounded-[10px] border border-border bg-surface p-5">
      <div className="flex items-center gap-2">
        <Sparkles className="size-4 text-accent" aria-hidden />
        <h2 id="ai-summary-title" className="text-[13px] font-medium">
          Resumen del mes
        </h2>
        <span className="ml-auto text-[12px] text-muted">{pending ? 'Analizando…' : engine}</span>
      </div>
      <p className={`money mt-3 text-[16px] leading-relaxed text-fg sm:text-[17px] ${pending ? 'opacity-60' : ''}`}>{text}</p>
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px]">
        <Link href="/ia" className="font-medium text-accent hover:underline">
          Ver recomendaciones
        </Link>
        {note && <span className="text-muted">{note}</span>}
      </div>
    </section>
  )
}

export async function AiSummary() {
  const { db, user, ctx, recommendations, combined } = await getAppData()
  const report = await generateReport(db, user, ctx, recommendations, combined)
  return <Frame text={report.summary} engine={report.engine} note={report.external ? null : report.note} />
}

export async function AiSummaryFallback() {
  const { ctx } = await getAppData()
  return <Frame text={ruleSummary(ctx)} engine="" pending />
}
