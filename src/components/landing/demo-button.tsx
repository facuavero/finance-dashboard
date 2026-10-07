'use client'

import { useFormStatus } from 'react-dom'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { demoLoginAction } from '@/modules/auth/actions'
import { cn } from '@/lib/utils'

function Submit() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" size="lg" className="w-full" loading={pending}>
      {pending ? 'Preparando la demo…' : 'Probar la demo'}
      {!pending && <ArrowRight aria-hidden />}
    </Button>
  )
}

/** un click y entrás a la cuenta demo, sin formulario (mercury "explore demo") */
export function DemoButton({ className }: { className?: string }) {
  return (
    <form action={demoLoginAction} className={cn('w-full sm:w-auto', className)}>
      <Submit />
    </form>
  )
}
