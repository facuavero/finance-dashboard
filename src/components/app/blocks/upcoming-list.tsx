import { CalendarClock } from 'lucide-react'
import type { UpcomingItem } from '@/modules/insights/upcoming'
import { dateShort, relativeDays } from '@/lib/format'
import { Money } from '../money'
import { EmptyState, EstimateTag } from '../states'
import { cn } from '@/lib/utils'

export function UpcomingList({ items, today, limit = 6 }: { items: UpcomingItem[]; today: string; limit?: number }) {
  if (!items.length)
    return (
      <EmptyState compact icon={CalendarClock} title="Nada previsto en los próximos días">
        Acá aparecen tus pagos recurrentes y lo que detectemos en Gmail y Calendar.
      </EmptyState>
    )
  return (
    <ul className="divide-y divide-border">
      {items.slice(0, limit).map((i) => (
        <li key={i.key} className="flex items-center gap-3 py-2.5">
          <div className="w-11 shrink-0 text-center">
            <p className="text-[13px] font-semibold">{dateShort(i.date).split(' ')[0]}</p>
            <p className="text-[11px] text-muted uppercase">{dateShort(i.date).split(' ')[1]}</p>
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-medium">{i.title}</p>
            <p className="text-[12px] text-muted">
              {relativeDays(today, i.date)} · {i.source}
            </p>
          </div>
          <div className="flex flex-col items-end gap-0.5">
            {i.cents !== null && <Money cents={i.type === 'income' ? i.cents : -i.cents} sign={i.type === 'income'} tabular className={cn('text-[13px] font-semibold', i.type === 'income' && 'text-positive')} />}
            {i.estimated && <EstimateTag />}
          </div>
        </li>
      ))}
    </ul>
  )
}
