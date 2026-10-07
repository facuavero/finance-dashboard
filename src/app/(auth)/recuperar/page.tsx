'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { ArrowLeft, MailCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Field, Input } from '@/components/ui/input'
import { forgotPasswordAction, type FormState } from '@/modules/auth/actions'
import { FormAlert } from '../form-alert'
import { useFormErrors } from '../use-form-errors'

export default function ForgotPage() {
  const [state, action, pending] = useActionState<FormState, FormData>(forgotPasswordAction, {})
  const { err, onChange } = useFormErrors(state.errors)
  if (state.ok) {
    return (
      <div role="status">
        <span className="flex size-10 items-center justify-center rounded-full bg-positive-soft text-positive">
          <MailCheck className="size-5" aria-hidden />
        </span>
        <h1 className="display mt-4 text-[44px]">Revisá tu correo</h1>
        <p className="mt-2 text-sm text-fg-2">{state.message}</p>
        <p className="mt-2 text-[13px] text-muted">¿No llega? Mirá en spam o esperá un par de minutos antes de pedirlo de nuevo.</p>
        {state.devLink && (
          <div className="mt-4 rounded-lg border border-dashed border-border-strong p-3 text-[13px]">
            <p className="font-medium">Modo desarrollo</p>
            <p className="mt-1 text-muted">No hay servicio de email configurado. Este es el link que se habría enviado:</p>
            <a href={state.devLink} className="mt-1 block break-all text-accent hover:underline">
              {state.devLink}
            </a>
          </div>
        )}
        <Link href="/login" className="mt-6 inline-flex items-center gap-1.5 text-sm text-accent hover:underline">
          <ArrowLeft className="size-4" /> Volver a iniciar sesión
        </Link>
      </div>
    )
  }
  return (
    <div>
      <h1 className="display text-[44px]">Recuperar contraseña</h1>
      <p className="mt-2 text-[15px] text-fg-2">Ingresá tu email y te mandamos un link para crear una contraseña nueva.</p>
      {state.message && <FormAlert className="mt-5">{state.message}</FormAlert>}
      <form action={action} className="mt-6 space-y-4" noValidate onChange={onChange}>
        <Field label="Email" htmlFor="email" error={err('email')}>
          <Input id="email" name="email" type="email" inputMode="email" autoComplete="email" defaultValue={state.values?.email} aria-invalid={!!err('email')} required autoFocus />
        </Field>
        <Button type="submit" size="lg" className="w-full" loading={pending}>
          {pending ? 'Enviando…' : 'Enviar link'}
        </Button>
      </form>
      <Link href="/login" className="mt-6 inline-flex items-center gap-1.5 text-sm text-accent hover:underline">
        <ArrowLeft className="size-4" /> Me acordé, volver
      </Link>
    </div>
  )
}
