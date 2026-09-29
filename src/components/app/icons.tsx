import {
  Bike, Briefcase, Building, Bus, Car, CarTaxiFront, CircleDashed, Coffee, CreditCard, Flame, Fuel, Gift, GraduationCap, HeartPulse, House,
  KeyRound, Laptop, Lightbulb, Plane, Plus, Repeat, ShoppingBag, ShoppingCart, Smartphone, Ticket, TrendingUp, Utensils, Wifi, Zap, type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const MAP: Record<string, LucideIcon> = {
  'shopping-cart': ShoppingCart, bike: Bike, utensils: Utensils, car: Car, 'car-taxi-front': CarTaxiFront, fuel: Fuel, bus: Bus, home: House,
  'key-round': KeyRound, building: Building, zap: Zap, lightbulb: Lightbulb, flame: Flame, wifi: Wifi, smartphone: Smartphone, repeat: Repeat,
  ticket: Ticket, coffee: Coffee, 'shopping-bag': ShoppingBag, 'heart-pulse': HeartPulse, 'graduation-cap': GraduationCap, gift: Gift, plane: Plane,
  'credit-card': CreditCard, 'circle-dashed': CircleDashed, briefcase: Briefcase, laptop: Laptop, 'trending-up': TrendingUp, plus: Plus,
}

export const ICON_NAMES = Object.keys(MAP)

export function CategoryIcon({ icon, className }: { icon: string; className?: string }) {
  const I = MAP[icon] ?? CircleDashed
  return <I className={cn('size-4', className)} aria-hidden />
}

/** color de serie de una categoría (slot fijo). sin slot → gris "otros" */
export const seriesVar = (slot: number | null | undefined) => (slot && slot >= 1 && slot <= 8 ? `var(--series-${slot})` : 'var(--series-other)')

/** ícono de categoría en chip: el color va en el punto, el texto sigue en tinta */
export function CategoryBadge({ icon, slot, className }: { icon: string; slot?: number | null; className?: string }) {
  return (
    <span className={cn('relative inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-fg-2', className)}>
      <CategoryIcon icon={icon} />
      {slot ? <span className="absolute -right-0.5 -bottom-0.5 size-2.5 rounded-full border-2 border-surface" style={{ background: seriesVar(slot) }} aria-hidden /> : null}
    </span>
  )
}
