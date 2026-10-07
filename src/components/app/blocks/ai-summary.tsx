import Link from 'next/link'
import { Lightbulb, Sparkles } from 'lucide-react'
import { Delta, Money } from '@/components/app/money'
import { getAppData } from '@/modules/app/data'
import { generateReport } from '@/modules/ai/service'
import { ruleSummary } from '@/modules/ai/rules'
import type { Tip } from '@/modules/insights/tips'
import { monthName, pct } from '@/lib/format'

function Frame({ text, engine, note, pending, facts, tip }: { text: string; engine: string; note?: string | null; pending?: boolean; facts: React.ReactNode; tip: Tip | null }) {
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
      {facts}
      <div className="relative mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px]">
        <Link href="/ia" className="font-medium text-accent hover:underline">
          Ver recomendaciones →
        </Link>
        {note && <span className="text-muted">{note}</span>}
      </div>
      {tip && (
        <aside aria-label="Tip del día" className="relative mt-5 flex gap-3 rounded-2xl bg-surface-2 px-4 py-3.5">
          <Lightbulb className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />
          <div className="min-w-0">
            <p className="label-caps !text-[10px]">Tip{tip.basis === 'datos' ? ' · según tus datos' : ''}</p>
            <p className="money mt-1 text-[13.5px] leading-relaxed text-fg-2">{tip.text}</p>
          </div>
        </aside>
      )}
    </section>
  )
}

/** tres datos para leer el mes de un vistazo; se calculan, no los inventa la IA */
async function SummaryFacts() {
  const { ctx, today } = await getAppData()
  if (!ctx.hasData) return null
  const top = ctx.categories[0]
  const eom = ctx.forecast.endOfMonthBalanceCents
  return (
    <dl className="relative mt-5 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-border bg-border min-[420px]:grid-cols-3">
      <div className="bg-surface px-3.5 py-3">
        <dt className="label-caps !text-[10px]">Gastos vs. antes</dt>
        <dd className="mt-1.5">
          <Delta ratio={ctx.month.deltas.expense.pct} goodWhenUp={false} label="" className="!text-[13px]" />
        </dd>
      </div>
      <div className="bg-surface px-3.5 py-3">
        <dt className="label-caps !text-[10px]">Mayor gasto</dt>
        <dd className="mt-1.5 truncate text-[13px] font-medium">
          {top ? (
            <>
              {top.name} <span className="font-normal text-muted">{pct(top.pct)}</span>
            </>
          ) : (
            <span className="font-normal text-muted">—</span>
          )}
        </dd>
      </div>
      <div className="bg-surface px-3.5 py-3">
        <dt className="label-caps !text-[10px]">Cierre de {monthName(today)}</dt>
        <dd className="mt-1.5 text-[13px] font-medium">
          <Money cents={eom} /> <span className="font-normal text-muted">est.</span>
        </dd>
      </div>
    </dl>
  )
}

export async function AiSummary({ tip }: { tip: Tip | null }) {
  const { db, user, ctx, recommendations, combined } = await getAppData()
  const report = await generateReport(db, user, ctx, recommendations, combined)
  return <Frame text={report.summary} engine={report.engine} note={report.external ? null : report.note} facts={<SummaryFacts />} tip={tip} />
}

export async function AiSummaryFallback({ tip }: { tip: Tip | null }) {
  const { ctx } = await getAppData()
  return <Frame text={ruleSummary(ctx)} engine="" pending facts={<SummaryFacts />} tip={tip} />
}
