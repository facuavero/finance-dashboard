import { Shell } from '@/components/app/shell'
import { QuickAddProvider, type CatOption } from '@/components/app/quick-add'
import { TooltipProvider } from '@/components/ui/misc'
import { FormatProvider } from '@/components/app/format-provider'
import { PrefsSync } from '@/components/app/prefs-sync'
import { getAppData } from '@/modules/app/data'

export const dynamic = 'force-dynamic'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, finance, alerts, today, prefs, currency, rate } = await getAppData()
  const usage = new Map<string, number>()
  for (const t of finance.txns) if (t.categoryId) usage.set(t.categoryId, (usage.get(t.categoryId) ?? 0) + 1)
  const categories: CatOption[] = finance.cats.map((c) => ({ id: c.id, name: c.name, kind: c.kind, parentId: c.parentId, icon: c.icon, usage: usage.get(c.id) ?? 0 }))
  return (
    <FormatProvider prefs={{ currency, decimals: prefs.decimals, rate }}>
      <PrefsSync prefs={prefs} />
      <TooltipProvider>
        <QuickAddProvider categories={categories} today={today}>
          <Shell user={{ name: user.name, email: user.email }} alerts={alerts.map((a) => ({ key: a.key, title: a.title, body: a.body, href: a.href, severity: a.severity }))} alertCount={alerts.filter((a) => a.severity === 'critical' || a.severity === 'warning').length}>
            {children}
          </Shell>
        </QuickAddProvider>
      </TooltipProvider>
    </FormatProvider>
  )
}
