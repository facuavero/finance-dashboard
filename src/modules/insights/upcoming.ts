import { addDays, type ISODate } from '@/modules/analytics/dates'
import { pendingUntil } from '@/modules/analytics/forecast'
import type { RecurringItem } from '@/modules/analytics/recurring'
import type { CombinedReport } from './combined'

export type UpcomingItem = { key: string; date: ISODate; title: string; cents: number | null; type: 'expense' | 'income'; estimated: boolean; source: 'recurrente' | 'gmail' | 'calendar' | 'gmail + calendar'; kind: string }

/** próximos gastos e ingresos: recurrentes pendientes + lo detectado en gmail/calendar */
export function upcoming(recurring: RecurringItem[], combined: CombinedReport | null, today: ISODate, days = 14): UpcomingItem[] {
  const until = addDays(today, days)
  const items: UpcomingItem[] = pendingUntil(recurring, today, until).map((p) => ({
    key: `rec:${p.label}:${p.date}`,
    date: p.date,
    title: p.label,
    cents: p.cents,
    type: p.type,
    estimated: true, // el monto es el último cobrado: puede variar
    source: 'recurrente',
    kind: p.kind,
  }))
  for (const f of combined?.findings ?? []) {
    if (!f.date || f.date < today || f.date > until || !f.amountCents) continue
    if (f.impact !== 'negative' && f.impact !== 'possible' && f.impact !== 'positive') continue
    if (f.key.startsWith('busy-week') || f.key.startsWith('due:')) continue // las facturas ya están como recurrentes
    const src = f.sources.includes('gmail') && f.sources.includes('gcal') ? 'gmail + calendar' : f.sources.includes('gmail') ? 'gmail' : 'calendar'
    items.push({ key: f.key, date: f.date, title: f.title, cents: f.amountCents, type: f.impact === 'positive' ? 'income' : 'expense', estimated: f.estimated, source: src, kind: f.impact })
  }
  return items.sort((a, b) => a.date.localeCompare(b.date))
}
