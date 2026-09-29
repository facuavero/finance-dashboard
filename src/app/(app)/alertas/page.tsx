import type { Metadata } from 'next'
import { BellOff } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { EmptyState, PageHeader } from '@/components/app/states'
import { getAppData } from '@/modules/app/data'
import { AlertsView } from './alerts-view'

export const metadata: Metadata = { title: 'Alertas' }

const TYPE_LABEL: Record<string, string> = {
  budget_over: 'Presupuesto superado',
  budget_near: 'Presupuesto por agotarse',
  anomaly: 'Gasto anormal',
  bill_due: 'Factura próxima',
  subscription_renewal: 'Renovación de suscripción',
  big_expense: 'Gasto futuro importante',
  goal_behind: 'Objetivo retrasado',
  money_leak: 'Posible fuga de dinero',
  saving_opportunity: 'Oportunidad de ahorro',
}

export default async function Alertas() {
  const { alerts, hiddenAlerts: hidden } = await getAppData()
  return (
    <>
      <PageHeader title="Alertas" description="Ordenadas por importancia. Agrupamos las del mismo tipo y cada una aparece una sola vez por período: si la descartás, no vuelve hasta el próximo." />
      {alerts.length ? (
        <AlertsView alerts={alerts.map((a) => ({ ...a, typeLabel: TYPE_LABEL[a.type] }))} hidden={hidden} />
      ) : (
        <Card>
          <EmptyState icon={BellOff} title="No hay alertas activas">
            Te avisamos cuando un presupuesto se esté por agotar, aparezca un gasto fuera de lo normal, se acerque una factura o un objetivo se atrase.
          </EmptyState>
        </Card>
      )}
    </>
  )
}
