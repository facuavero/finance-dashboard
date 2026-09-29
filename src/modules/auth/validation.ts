import { z } from 'zod'

// compartido entre cliente (validación en vivo) y servidor (validación real)
export const PASSWORD_RULES = [
  { id: 'length', label: 'Entre 8 y 72 caracteres', test: (v: string) => v.length >= 8 && v.length <= 72 },
  { id: 'lower', label: 'Una minúscula', test: (v: string) => /[a-záéíóúñ]/.test(v) },
  { id: 'upper', label: 'Una mayúscula', test: (v: string) => /[A-ZÁÉÍÓÚÑ]/.test(v) },
  { id: 'number', label: 'Un número', test: (v: string) => /\d/.test(v) },
] as const

export function passwordStrength(v: string): number {
  if (!v) return 0
  const passed = PASSWORD_RULES.filter((r) => r.test(v)).length
  const bonus = v.length >= 12 ? 1 : 0
  return Math.min(4, passed - (passed === 4 ? 0 : 1) + bonus)
}

const email = z.string().trim().toLowerCase().email('Ingresá un email válido')

const password = z
  .string()
  .superRefine((v, ctx) => {
    const failed = PASSWORD_RULES.filter((r) => !r.test(v))
    if (failed.length) ctx.addIssue({ code: 'custom', message: 'La contraseña no cumple los requisitos de abajo' })
  })

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Poné al menos 2 letras').max(60, 'Máximo 60 caracteres'),
  email,
  password,
})

export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Ingresá tu contraseña'),
  remember: z.boolean(),
})

export const forgotSchema = z.object({ email })

export const resetSchema = z
  .object({ token: z.string().min(20), password, confirm: z.string() })
  .refine((d) => d.password === d.confirm, { message: 'Las contraseñas no coinciden', path: ['confirm'] })

export type FieldErrors = Partial<Record<string, string>>

export function flattenErrors(error: z.ZodError): FieldErrors {
  const out: FieldErrors = {}
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? 'form')
    if (!out[key]) out[key] = issue.message
  }
  return out
}
