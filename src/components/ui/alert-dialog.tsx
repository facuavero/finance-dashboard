'use client'

import * as A from '@radix-ui/react-alert-dialog'
import * as React from 'react'
import { Button } from './button'

export function ConfirmDialog({ trigger, title, description, confirmLabel, onConfirm, danger, loading, open, onOpenChange }: { trigger?: React.ReactNode; title: string; description: React.ReactNode; confirmLabel: string; onConfirm: () => void; danger?: boolean; loading?: boolean; open?: boolean; onOpenChange?: (v: boolean) => void }) {
  return (
    <A.Root open={open} onOpenChange={onOpenChange}>
      {trigger && <A.Trigger asChild>{trigger}</A.Trigger>}
      <A.Portal>
        <A.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-[2px] animate-in" />
        <A.Content className="fixed top-1/2 left-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-border-strong bg-surface p-6 shadow-2xl animate-slide-up">
          <A.Title className="display text-[26px]">{title}</A.Title>
          <A.Description asChild>
            <div className="mt-2 text-sm text-fg-2">{description}</div>
          </A.Description>
          <div className="mt-5 flex justify-end gap-2">
            <A.Cancel asChild>
              <Button variant="secondary">Cancelar</Button>
            </A.Cancel>
            <Button variant={danger ? 'danger' : 'primary'} loading={loading} onClick={onConfirm}>
              {confirmLabel}
            </Button>
          </div>
        </A.Content>
      </A.Portal>
    </A.Root>
  )
}
