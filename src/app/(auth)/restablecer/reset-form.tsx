'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { Button } from '@/components/ui/button'
import { Field, Input } from '@/components/ui/input'
import { resetPasswordAction, type FormState } from '@/modules/auth/actions'
import { FormAlert } from '../form-alert'
import { useFormErrors } from '../use-form-errors'
import { PasswordInput } from '../password-input'

export function ResetForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(resetPasswordAction, {})
  const { err, onChange } = useFormErrors(state.errors)
  return (
    <div>
      <h1 className="display text-[44px]">Nueva contraseña</h1>
      <p className="mt-2 text-[15px] text-fg-2">Al guardarla se cierran todas tus sesiones abiertas.</p>
      {state.message && (
        <FormAlert className="mt-5">
          {state.message}{' '}
          <Link href="/recuperar" className="underline">
            Pedir otro link
          </Link>
        </FormAlert>
      )}
      <form action={action} className="mt-6 space-y-4" noValidate onChange={onChange}>
        <input type="hidden" name="token" value={token} />
        <Field label="Contraseña nueva" htmlFor="password" error={err('password')}>
          <PasswordInput id="password" name="password" invalid={!!err('password')} />
        </Field>
        <Field label="Repetila" htmlFor="confirm" error={err('confirm')}>
          <Input id="confirm" name="confirm" type="password" autoComplete="new-password" aria-invalid={!!err('confirm')} required />
        </Field>
        <Button type="submit" size="lg" className="w-full" loading={pending}>
          {pending ? 'Guardando…' : 'Guardar contraseña'}
        </Button>
      </form>
    </div>
  )
}
