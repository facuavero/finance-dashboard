'use client'

import { setClientFormat, type FormatPrefs } from '@/lib/format'

/** deja la moneda y los decimales del usuario disponibles para el formato en el navegador (y en el render inicial) */
export function FormatProvider({ prefs, children }: { prefs: FormatPrefs; children: React.ReactNode }) {
  setClientFormat(prefs)
  return <>{children}</>
}
