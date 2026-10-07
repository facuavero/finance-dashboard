import { Info } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Tip } from '@/components/ui/misc'
import { Delta, Money } from '../money'
import { pct } from '@/lib/format'

/** stat tile: label · valor · delta vs período anterior nombrado */
export function Kpi({ label, cents, ratio, delta, goodWhenUp, help, deltaLabel, deltaUnit }: { label: string; cents?: number; ratio?: number | null; delta: number | null; goodWhenUp: boolean; help: string; deltaLabel?: string; deltaUnit?: 'pct' | 'pts' | 'cents' }) {
  return (
    <Card className="p-5">
      <div className="flex items-center gap-1.5">
        <p className="label-caps">{label}</p>
        <Tip content={help}>
          <button type="button" className="text-muted hover:text-fg" aria-label={`Qué es ${label.toLowerCase()}`}>
            <Info className="size-3.5" />
          </button>
        </Tip>
      </div>
      <p className="mt-3 text-[26px] leading-none font-medium">
        {cents !== undefined ? <Money cents={cents} /> : <span className="money font-mono tracking-[-0.03em]">{pct(ratio ?? null)}</span>}
      </p>
      <Delta ratio={delta} goodWhenUp={goodWhenUp} label={deltaLabel} unit={deltaUnit} className="mt-3" />
    </Card>
  )
}
