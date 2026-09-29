'use client'

import { useState } from 'react'
import { Check, Eye, EyeOff, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { PASSWORD_RULES, passwordStrength } from '@/modules/auth/validation'
import { cn } from '@/lib/utils'

const LABELS = ['Muy débil', 'Débil', 'Aceptable', 'Buena', 'Fuerte']

// validación en vivo: barra de fuerza + checklist que se tilda mientras escribís (patrón origin)
export function PasswordInput({ id, name, invalid, autoComplete = 'new-password' }: { id: string; name: string; invalid?: boolean; autoComplete?: string }) {
  const [value, setValue] = useState('')
  const [show, setShow] = useState(false)
  const strength = passwordStrength(value)
  return (
    <div className="space-y-2">
      <div className="relative">
        <Input id={id} name={name} type={show ? 'text' : 'password'} autoComplete={autoComplete} value={value} onChange={(e) => setValue(e.target.value)} aria-invalid={invalid} aria-describedby={`${id}-rules`} className="pr-10" required />
        <button type="button" onClick={() => setShow((s) => !s)} className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-1 text-muted hover:text-fg" aria-label={show ? 'Ocultar contraseña' : 'Mostrar contraseña'}>
          {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
      {value && (
        <div className="flex items-center gap-2" aria-live="polite">
          <div className="flex flex-1 gap-1">
            {[0, 1, 2, 3].map((i) => (
              <span key={i} className={cn('h-1 flex-1 rounded-full', i < strength ? (strength <= 1 ? 'bg-critical' : strength === 2 ? 'bg-warning-mark' : 'bg-positive') : 'bg-surface-3')} />
            ))}
          </div>
          <span className="text-[12px] text-muted">{LABELS[strength]}</span>
        </div>
      )}
      <ul id={`${id}-rules`} className="grid grid-cols-2 gap-x-3 gap-y-1">
        {PASSWORD_RULES.map((r) => {
          const ok = r.test(value)
          return (
            <li key={r.id} className={cn('flex items-center gap-1.5 text-[12px]', ok ? 'text-positive' : 'text-muted')}>
              {ok ? <Check className="size-3.5" aria-hidden /> : <X className="size-3.5 opacity-50" aria-hidden />}
              <span>
                {r.label}
                <span className="sr-only">{ok ? ' (cumplido)' : ' (pendiente)'}</span>
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
