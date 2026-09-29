'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Clock, X } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Segmented } from '@/components/ui/misc'
import { AlertRow } from '@/components/app/blocks/alert-list'
import type { Alert } from '@/modules/alerts/engine'
import { dismissAlertAction, restoreAlertsAction, snoozeAlertAction } from '@/modules/alerts/actions'

export function AlertsView({ alerts, hidden }: { alerts: (Alert & { typeLabel: string })[]; hidden: number }) {
  const router = useRouter()
  const [filter, setFilter] = useState<'all' | 'urgent' | 'info'>('all')
  const [pending, start] = useTransition()
  const shown = alerts.filter((a) => (filter === 'all' ? true : filter === 'urgent' ? a.severity === 'critical' || a.severity === 'warning' : a.severity === 'info' || a.severity === 'positive'))
  const act = (fn: () => Promise<unknown>, msg: string) =>
    start(async () => {
      await fn()
      toast.success(msg)
      router.refresh()
    })
  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <Segmented
          label="Filtrar alertas"
          value={filter}
          onChange={setFilter}
          options={[
            { value: 'all', label: `Todas (${alerts.length})` },
            { value: 'urgent', label: 'Requieren atención' },
            { value: 'info', label: 'Informativas' },
          ]}
        />
        {hidden > 0 && (
          <Button variant="ghost" size="sm" loading={pending} onClick={() => act(() => restoreAlertsAction(), 'Alertas restauradas')}>
            Mostrar {hidden} descartadas o pospuestas
          </Button>
        )}
      </div>
      <Card className="px-5">
        <ul className="divide-y divide-border">
          {shown.map((a) => (
            <li key={a.key}>
              <AlertRow
                alert={a}
                actions={
                  <div className="mt-2 flex flex-wrap items-center gap-1">
                    <span className="mr-2 text-[12px] text-muted">{a.typeLabel}</span>
                    <Button variant="ghost" size="sm" disabled={pending} onClick={() => act(() => snoozeAlertAction(a.key, 3), 'Pospuesta 3 días')}>
                      <Clock /> Posponer 3 días
                    </Button>
                    <Button variant="ghost" size="sm" disabled={pending} onClick={() => act(() => dismissAlertAction(a.key), 'Alerta descartada')}>
                      <X /> Descartar
                    </Button>
                  </div>
                }
              />
            </li>
          ))}
        </ul>
      </Card>
    </>
  )
}
