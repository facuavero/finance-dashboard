'use client'

import Link from 'next/link'
import { useActionState, useState } from 'react'
import { CircleCheck, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Field, Input } from '@/components/ui/input'
import { demoLoginAction, loginAction, type FormState } from '@/modules/auth/actions'
import { FormAlert } from '../form-alert'
import { useFormErrors } from '../use-form-errors'

export function LoginForm({ next, notice, demo }: { next: string; notice: string | null; demo: boolean }) {
  const [state, action, pending] = useActionState<FormState, FormData>(loginAction, {})
  const { err, onChange } = useFormErrors(state.errors)
  const [show, setShow] = useState(false)
  const [demoPending, setDemoPending] = useState(false)
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-[-0.02em]">Iniciar sesión</h1>
      <p className="mt-1 text-sm text-muted">Entrá para ver cómo viene tu mes.</p>

      {notice && (
        <p className="mt-5 flex items-center gap-2 rounded-lg bg-positive-soft px-3 py-2 text-[13px] text-positive" role="status">
          <CircleCheck className="size-4" aria-hidden /> {notice}
        </p>
      )}
      {state.message && <FormAlert className="mt-5">{state.message}</FormAlert>}

      <form action={action} className="mt-6 space-y-4" noValidate onChange={onChange}>
        <input type="hidden" name="next" value={next} />
        <Field label="Email" htmlFor="email" error={err('email')}>
          <Input id="email" name="email" type="email" autoComplete="email" inputMode="email" defaultValue={state.values?.email} aria-invalid={!!err('email')} aria-describedby={err('email') ? 'email-error' : undefined} required autoFocus />
        </Field>
        <Field label="Contraseña" htmlFor="password" error={err('password')}>
          <div className="relative">
            <Input id="password" name="password" type={show ? 'text' : 'password'} autoComplete="current-password" aria-invalid={!!err('password')} className="pr-10" required />
            <button type="button" onClick={() => setShow((s) => !s)} className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-1 text-muted hover:text-fg" aria-label={show ? 'Ocultar contraseña' : 'Mostrar contraseña'}>
              {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </Field>
        <div className="flex items-center justify-between">
          <label className="flex cursor-pointer items-center gap-2 text-[13px] text-fg-2">
            <input type="checkbox" name="remember" defaultChecked className="size-4 accent-[var(--accent)]" /> Mantener la sesión iniciada
          </label>
          <Link href="/recuperar" className="text-[13px] text-accent hover:underline">
            ¿Olvidaste tu contraseña?
          </Link>
        </div>
        <Button type="submit" size="lg" className="w-full" loading={pending}>
          {pending ? 'Entrando…' : 'Iniciar sesión'}
        </Button>
      </form>

      {demo && (
        <form action={demoLoginAction} onSubmit={() => setDemoPending(true)} className="mt-3">
          <Button type="submit" variant="secondary" size="lg" className="w-full" loading={demoPending}>
            Probar con una cuenta demo
          </Button>
        </form>
      )}

      <p className="mt-6 text-center text-sm text-muted">
        ¿No tenés cuenta?{' '}
        <Link href="/registro" className="font-medium text-accent hover:underline">
          Creá una gratis
        </Link>
      </p>
    </div>
  )
}
