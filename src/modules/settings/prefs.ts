import { isCurrency, type Currency } from '@/lib/format'

// preferencias de visualización. viven en una cookie (por dispositivo), salvo la moneda que va en el usuario.
export const PREFS_COOKIE = 'caudal-prefs'

export type ThemePref = 'dark' | 'light' | 'system'
export type Prefs = {
  theme: ThemePref
  hideAmounts: boolean // arrancar con los montos ocultos
  decimals: boolean // mostrar centavos
  tips: boolean // tip del día en inicio
  language: 'es-AR'
}

export const DEFAULT_PREFS: Prefs = { theme: 'dark', hideAmounts: false, decimals: false, tips: true, language: 'es-AR' }

export const LANGUAGES = [
  { value: 'es-AR', label: 'Español (Argentina)', available: true },
  { value: 'en', label: 'English', available: false },
] as const

export function parsePrefs(raw: string | undefined | null): Prefs {
  if (!raw) return DEFAULT_PREFS
  try {
    const j = JSON.parse(raw) as Partial<Prefs>
    return {
      theme: j.theme === 'light' || j.theme === 'system' || j.theme === 'dark' ? j.theme : DEFAULT_PREFS.theme,
      hideAmounts: j.hideAmounts === true,
      decimals: j.decimals === true,
      tips: j.tips !== false,
      language: 'es-AR',
    }
  } catch {
    return DEFAULT_PREFS
  }
}

export const toCurrency = (v: unknown): Currency => (isCurrency(v) ? v : 'ARS')
