'use client'

import { useEffect } from 'react'
import type { Prefs } from '@/modules/settings/prefs'

const store = {
  get: (k: string) => {
    try {
      return localStorage.getItem(k)
    } catch {
      return null
    }
  },
  set: (k: string, v: string | null) => {
    try {
      if (v === null) localStorage.removeItem(k)
      else localStorage.setItem(k, v)
    } catch {}
  },
}

const wantsLight = (theme: Prefs['theme']) => theme === 'light' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: light)').matches)

/**
 * pasa las preferencias guardadas al DOM. el script de arranque (layout raíz) lee las mismas claves antes del primer pintado.
 * `reset`: el cambio vino de Configuración, así que pisa lo que se haya elegido a mano con los botones de la barra.
 */
export function applyPrefs(prefs: Prefs, reset: { theme?: boolean; privacy?: boolean } = {}) {
  const root = document.documentElement
  store.set('caudal-theme-pref', prefs.theme)
  store.set('caudal-privacy-default', prefs.hideAmounts ? '1' : '0')
  if (reset.theme) store.set('caudal-theme', null)
  if (reset.privacy) store.set('caudal-privacy', null)
  const override = store.get('caudal-theme')
  root.classList.toggle('dark', override ? override !== 'light' : !wantsLight(prefs.theme))
  const privacy = store.get('caudal-privacy')
  root.classList.toggle('privacy', privacy !== null ? privacy === '1' : prefs.hideAmounts)
}

/** mantiene el dispositivo alineado con las preferencias de la cookie (ej: primer ingreso desde otro navegador) */
export function PrefsSync({ prefs }: { prefs: Prefs }) {
  useEffect(() => {
    applyPrefs(prefs)
    if (prefs.theme !== 'system') return
    const mq = window.matchMedia('(prefers-color-scheme: light)')
    const on = () => applyPrefs(prefs)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [prefs])
  return null
}
