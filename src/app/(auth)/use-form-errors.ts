'use client'

import { useState } from 'react'
import type { FieldErrors } from '@/modules/auth/validation'

/** errores del servidor que se limpian apenas el usuario edita el campo */
export function useFormErrors(errors?: FieldErrors) {
  const [cleared, setCleared] = useState<Set<string>>(new Set())
  const [prev, setPrev] = useState(errors)
  if (prev !== errors) {
    setPrev(errors)
    setCleared(new Set())
  }
  return {
    err: (k: string) => (cleared.has(k) ? undefined : errors?.[k]),
    onChange: (e: React.FormEvent<HTMLFormElement>) => {
      const name = (e.target as HTMLInputElement).name
      if (name && errors?.[name] && !cleared.has(name)) setCleared((s) => new Set(s).add(name))
    },
  }
}
