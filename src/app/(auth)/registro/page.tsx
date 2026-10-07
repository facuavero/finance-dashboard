'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { Button } from '@/components/ui/button'
import { Field, Input } from '@/components/ui/input'
import { registerAction, type FormState } from '@/modules/auth/actions'
import { FormAlert } from '../form-alert'
import { useFormErrors } from '../use-form-errors'
import { PasswordInput } from '../password-input'

export default function RegisterPage() {
  const [state, action, pending] = useActionState<FormState, FormData>(registerAction, {})
  const { err, onChange } = useFormErrors(state.errors)
  return (
    <div>
      <h1 className="display text-[44px]">Crear cuenta</h1>
      <p className="mt-2 text-[15px] text-fg-2">Gratis. En 1 minuto estás cargando tu primer gasto.</p>
      {state.message && <FormAlert className="mt-5">{state.message}</FormAlert>}
      <form action={action} className="mt-6 space-y-4" noValidate onChange={onChange}>
        <Field label="Nombre" htmlFor="name" error={err('name')}>
          <Input id="name" name="name" autoComplete="given-name" defaultValue={state.values?.name} aria-invalid={!!err('name')} required autoFocus />
        </Field>
        <Field label="Email" htmlFor="email" error={err('email')}>
          <Input id="email" name="email" type="email" inputMode="email" autoComplete="email" defaultValue={state.values?.email} aria-invalid={!!err('email')} required />
        </Field>
        <Field label="Contraseña" htmlFor="password" error={err('password')}>
          <PasswordInput id="password" name="password" invalid={!!err('password')} />
        </Field>
        <Button type="submit" size="lg" className="w-full" loading={pending}>
          {pending ? 'Creando tu cuenta…' : 'Crear cuenta'}
        </Button>
        <p className="text-center text-[12px] text-muted">Al crear la cuenta aceptás que guardemos tus datos financieros para analizarlos. Nada se comparte sin tu permiso.</p>
      </form>
      <p className="mt-6 text-center text-sm text-muted">
        ¿Ya tenés cuenta?{' '}
        <Link href="/login" className="font-medium text-accent hover:underline">
          Iniciá sesión
        </Link>
      </p>
    </div>
  )
}
