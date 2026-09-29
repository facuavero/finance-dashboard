'use client'

import * as D from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import * as React from 'react'
import { cn } from '@/lib/utils'

export const Dialog = D.Root
export const DialogTrigger = D.Trigger
export const DialogClose = D.Close

export function DialogContent({ className, children, title, description, wide, ...props }: React.ComponentProps<typeof D.Content> & { title: string; description?: React.ReactNode; wide?: boolean }) {
  return (
    <D.Portal>
      <D.Overlay className="fixed inset-0 z-50 bg-black/40 animate-in" />
      <D.Content
        className={cn(
          'fixed z-50 flex max-h-[92dvh] flex-col border border-border bg-surface shadow-xl outline-none animate-slide-up',
          // mobile: hoja desde abajo · desktop: modal centrado
          'inset-x-0 bottom-0 rounded-t-2xl sm:inset-auto sm:top-1/2 sm:left-1/2 sm:w-[calc(100%-2rem)] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-xl',
          wide ? 'sm:max-w-2xl' : 'sm:max-w-lg',
          className,
        )}
        {...props}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
          <div>
            <D.Title className="text-base font-semibold">{title}</D.Title>
            {description ? <D.Description className="mt-0.5 text-[13px] text-muted">{description}</D.Description> : <D.Description className="sr-only">{title}</D.Description>}
          </div>
          <D.Close className="-mr-1 rounded-md p-1 text-muted hover:bg-surface-2 hover:text-fg" aria-label="Cerrar">
            <X className="size-4" />
          </D.Close>
        </div>
        <div className="overflow-y-auto px-5 py-4 scrollbar-thin">{children}</div>
      </D.Content>
    </D.Portal>
  )
}

/** panel lateral para editar sin perder contexto (patrón copilot / midday) */
export function SheetContent({ className, children, title, description, ...props }: React.ComponentProps<typeof D.Content> & { title: string; description?: React.ReactNode }) {
  return (
    <D.Portal>
      <D.Overlay className="fixed inset-0 z-50 bg-black/30 animate-in" />
      <D.Content
        className={cn(
          'fixed z-50 flex flex-col border-border bg-surface shadow-xl outline-none',
          'inset-x-0 bottom-0 max-h-[92dvh] rounded-t-2xl border-t animate-slide-up',
          'sm:inset-y-0 sm:right-0 sm:left-auto sm:max-h-none sm:w-[440px] sm:rounded-none sm:border-t-0 sm:border-l sm:animate-slide-left',
          className,
        )}
        {...props}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
          <div className="min-w-0">
            <D.Title className="truncate text-base font-semibold">{title}</D.Title>
            {description ? <D.Description className="mt-0.5 text-[13px] text-muted">{description}</D.Description> : <D.Description className="sr-only">{title}</D.Description>}
          </div>
          <D.Close className="-mr-1 rounded-md p-1 text-muted hover:bg-surface-2 hover:text-fg" aria-label="Cerrar">
            <X className="size-4" />
          </D.Close>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4 scrollbar-thin">{children}</div>
      </D.Content>
    </D.Portal>
  )
}
