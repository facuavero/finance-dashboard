'use client'

import * as Sw from '@radix-ui/react-switch'
import * as T from '@radix-ui/react-tooltip'
import * as P from '@radix-ui/react-popover'
import * as DM from '@radix-ui/react-dropdown-menu'
import * as Tabs from '@radix-ui/react-tabs'
import * as C from '@radix-ui/react-collapsible'
import * as React from 'react'
import { cn } from '@/lib/utils'

export function Switch({ className, ...props }: React.ComponentProps<typeof Sw.Root>) {
  return (
    <Sw.Root className={cn('relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full bg-surface-3 transition-colors data-[state=checked]:bg-accent disabled:opacity-50', className)} {...props}>
      <Sw.Thumb className="block size-4 translate-x-0.5 rounded-full bg-white shadow transition-transform data-[state=checked]:translate-x-[18px]" />
    </Sw.Root>
  )
}

export function Tip({ content, children, side = 'top' }: { content: React.ReactNode; children: React.ReactNode; side?: 'top' | 'bottom' | 'left' | 'right' }) {
  return (
    <T.Root delayDuration={200}>
      <T.Trigger asChild>{children}</T.Trigger>
      <T.Portal>
        <T.Content side={side} sideOffset={6} className="z-50 max-w-xs rounded-xl bg-fg px-3 py-1.5 text-[12px] leading-snug text-bg shadow-lg animate-in">
          {content}
        </T.Content>
      </T.Portal>
    </T.Root>
  )
}

export const TooltipProvider = T.Provider

export const Popover = P.Root
export const PopoverTrigger = P.Trigger
export function PopoverContent({ className, ...props }: React.ComponentProps<typeof P.Content>) {
  return (
    <P.Portal>
      <P.Content sideOffset={6} align="start" className={cn('z-50 w-72 rounded-2xl border border-border-strong bg-surface p-3 shadow-2xl shadow-black/30 outline-none animate-in', className)} {...props} />
    </P.Portal>
  )
}

export const Menu = DM.Root
export const MenuTrigger = DM.Trigger
export function MenuContent({ className, ...props }: React.ComponentProps<typeof DM.Content>) {
  return (
    <DM.Portal>
      <DM.Content sideOffset={6} align="end" className={cn('z-50 min-w-52 rounded-2xl border border-border-strong bg-surface p-1.5 shadow-2xl shadow-black/30 animate-in', className)} {...props} />
    </DM.Portal>
  )
}
export function MenuItem({ className, ...props }: React.ComponentProps<typeof DM.Item>) {
  return <DM.Item className={cn('flex cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-fg outline-none data-[highlighted]:bg-surface-2 [&_svg]:size-4 [&_svg]:text-muted', className)} {...props} />
}
export const MenuSeparator = () => <DM.Separator className="my-1 h-px bg-border" />
export function MenuLabel({ children }: { children: React.ReactNode }) {
  return <DM.Label className="label-caps px-3 pt-2 pb-1 !text-[10px]">{children}</DM.Label>
}

export const TabsRoot = Tabs.Root
export function TabsList({ className, ...props }: React.ComponentProps<typeof Tabs.List>) {
  return <Tabs.List className={cn('inline-flex gap-1 rounded-full bg-surface-2 p-1', className)} {...props} />
}
export function TabsTrigger({ className, ...props }: React.ComponentProps<typeof Tabs.Trigger>) {
  return <Tabs.Trigger className={cn('cursor-pointer rounded-full px-3.5 py-1.5 text-sm text-muted transition-colors hover:text-fg data-[state=active]:bg-surface data-[state=active]:text-fg data-[state=active]:shadow-[0_0_0_1px_var(--border-strong)]', className)} {...props} />
}
export const TabsContent = Tabs.Content

export const Collapsible = C.Root
export const CollapsibleTrigger = C.Trigger
export const CollapsibleContent = C.Content

/** selector segmentado en pills (1s/1m/3m…) */
export function Segmented<T extends string>({ value, onChange, options, label, size = 'md' }: { value: T; onChange: (v: T) => void; options: { value: T; label: string }[]; label: string; size?: 'sm' | 'md' }) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex rounded-full bg-surface-2 p-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn('cursor-pointer rounded-full font-medium transition-colors', size === 'sm' ? 'px-2.5 py-0.5 text-[12px]' : 'px-3.5 py-1 text-[13px]', value === o.value ? 'bg-fg text-bg' : 'text-muted hover:text-fg')}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
