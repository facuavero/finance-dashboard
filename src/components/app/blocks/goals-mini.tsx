import Link from 'next/link'
import { Target } from 'lucide-react'
import type { GoalStatus } from '@/modules/analytics/goals'
import { Badge } from '@/components/ui/badge'
import { Money } from '../money'
import { EmptyState, Meter } from '../states'
import { pct } from '@/lib/format'
import { Button } from '@/components/ui/button'

export const GOAL_STATE = {
  done: { label: 'Cumplido', tone: 'positive' as const },
  on_track: { label: 'En camino', tone: 'neutral' as const },
  behind: { label: 'Atrasado', tone: 'warning' as const },
  overdue: { label: 'Vencido', tone: 'critical' as const },
}

export function GoalsMini({ goals }: { goals: GoalStatus[] }) {
  if (!goals.length)
    return (
      <EmptyState compact icon={Target} title="Todavía no tenés objetivos" action={<Button asChild variant="secondary" size="sm"><Link href="/objetivos?nuevo=1">Crear objetivo</Link></Button>}>
        Un viaje, un fondo de emergencia, una compra: te decimos cuánto aportar por mes.
      </EmptyState>
    )
  return (
    <ul className="space-y-4">
      {goals.slice(0, 3).map((g) => (
        <li key={g.id}>
          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-[13px] font-medium">{g.name}</p>
            <Badge tone={GOAL_STATE[g.state].tone}>{GOAL_STATE[g.state].label}</Badge>
          </div>
          <Meter className="mt-2" value={g.pct} state={g.state === 'done' ? 'done' : g.state === 'behind' || g.state === 'overdue' ? 'near' : 'ok'} label={`${g.name}: ${pct(g.pct)}`} />
          <p className="mt-1.5 flex justify-between text-[12px] text-muted">
            <span>
              <Money cents={g.savedCents} /> de <Money cents={g.targetCents} />
            </span>
            {g.state !== 'done' && (
              <span>
                <Money cents={g.recommendedMonthlyCents} />/mes
              </span>
            )}
          </p>
        </li>
      ))}
    </ul>
  )
}
