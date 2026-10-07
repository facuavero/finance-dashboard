import * as React from 'react'
import { cn } from '@/lib/utils'

export const inputClass =
  'h-11 w-full rounded-xl border border-transparent bg-surface-2 px-3.5 text-sm text-fg placeholder:text-muted transition-colors hover:border-border-strong focus-visible:outline-none focus-visible:border-fg/60 focus-visible:bg-surface focus-visible:ring-4 focus-visible:ring-fg/5 disabled:opacity-60 aria-[invalid=true]:border-critical aria-[invalid=true]:focus-visible:ring-critical/15'

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(function Input({ className, ...props }, ref) {
  return <input ref={ref} className={cn(inputClass, className)} {...props} />
})

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(function Textarea({ className, ...props }, ref) {
  return <textarea ref={ref} className={cn(inputClass, 'h-auto min-h-20 py-2', className)} {...props} />
})

export const NativeSelect = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(function NativeSelect({ className, children, ...props }, ref) {
  return (
    <select ref={ref} className={cn(inputClass, 'appearance-none bg-[length:16px] bg-[right_12px_center] bg-no-repeat pr-9', className)} style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27%23888%27 stroke-width=%272%27%3E%3Cpath d=%27m6 9 6 6 6-6%27/%3E%3C/svg%3E")' }} {...props}>
      {children}
    </select>
  )
})

export function Field({ label, htmlFor, error, hint, children, className, optional }: { label: string; htmlFor: string; error?: string; hint?: React.ReactNode; children: React.ReactNode; className?: string; optional?: boolean }) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={htmlFor} className="text-[12px] font-medium text-fg-2">
        {label}
        {optional && <span className="ml-1 font-normal text-muted">(opcional)</span>}
      </label>
      {children}
      {error ? (
        <p id={`${htmlFor}-error`} className="text-[13px] text-critical" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="text-[13px] text-muted">{hint}</p>
      ) : null}
    </div>
  )
}
