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

/** ícono de categoría en chip. la categoría se identifica por nombre e ícono, no por color */
export function CategoryBadge({ icon, className }: { icon: string; className?: string }) {
  return (
    <span className={cn('inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-fg-2', className)}>
      <CategoryIcon icon={icon} />
    </span>
  )
}
