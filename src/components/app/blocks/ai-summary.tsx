import Link from 'next/link'
import { Sparkles } from 'lucide-react'
import { getAppData } from '@/modules/app/data'
import { generateReport } from '@/modules/ai/service'
import { ruleSummary } from '@/modules/ai/rules'

function Frame({ text, engine, note, pending }: { text: string; engine: string; note?: string | null; pending?: boolean }) {
  return (
    // "daily recap" de fey: prosa protagonista sobre un brillo rubí
    <section aria-labelledby="ai-summary-title" className="relative overflow-hidden rounded-card border border-border bg-surface p-6 sm:p-7">
      <div className="pointer-events-none absolute -top-24 -right-16 size-72 rounded-full bg-[radial-gradient(closest-side,var(--glow-strong),transparent)]" aria-hidden />
      <div className="relative flex items-center gap-2">
        <span className="flex size-6 items-center justify-center rounded-full bg-accent-soft">
          <Sparkles className="size-3.5 text-accent" aria-hidden />
        </span>
        <h2 id="ai-summary-title" className="text-[13px] font-medium">
          Resumen del mes
        </h2>
        <span className="ml-auto font-mono text-[11px] text-muted">{pending ? 'Analizando…' : engine}</span>
      </div>
      <p className={`money relative mt-4 text-[17px] leading-[1.6] font-medium text-fg sm:text-[18px] ${pending ? 'opacity-60' : ''}`}>{text}</p>
      <div className="relative mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px]">
        <Link href="/ia" className="font-medium text-accent hover:underline">
          Ver recomendaciones →
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
