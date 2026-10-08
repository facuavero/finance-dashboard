import type { Metadata, Viewport } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import localFont from 'next/font/local'
import Script from 'next/script'
import { Toaster } from 'sonner'
import './globals.css'

// serif para títulos y momentos (docs/propuesta-diseño.md, tipografía: tres voces)
const serif = localFont({
  src: [
    { path: './fonts/instrument-serif-latin-400-normal.woff2', weight: '400', style: 'normal' },
    { path: './fonts/instrument-serif-latin-400-italic.woff2', weight: '400', style: 'italic' },
  ],
  variable: '--font-serif-display',
  display: 'swap',
})

// cifras: Inter variable con numerales tabulares (reemplaza al mono para montos)
const figure = localFont({
  src: [{ path: './fonts/inter-latin-wght-normal.woff2', weight: '100 900', style: 'normal' }],
  variable: '--font-figure-face',
  display: 'swap',
})

export const metadata: Metadata = {
  title: { default: 'Caudal', template: '%s · Caudal' },
  description: 'Tu centro de inteligencia financiera personal: qué pasó con tu plata, por qué, qué puede pasar y qué conviene hacer.',
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#09090a' },
    { media: '(prefers-color-scheme: dark)', color: '#09090a' },
  ],
}

// aplica tema y modo privacidad antes del primer pintado (sin parpadeo).
// oscuro por defecto: el claro solo si la persona lo eligió (a mano o en Configuración). 'system' sigue al sistema
const bootScript = `(function(){var e=document.documentElement;try{var l=localStorage,t=l.getItem('caudal-theme'),p=l.getItem('caudal-theme-pref'),light=t?t==='light':(p==='light'||(p==='system'&&matchMedia('(prefers-color-scheme: light)').matches));if(light)e.classList.remove('dark');var v=l.getItem('caudal-privacy');if(v===null)v=l.getItem('caudal-privacy-default');if(v==='1')e.classList.add('privacy')}catch(_){}})()`

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-AR" className={`dark ${GeistSans.variable} ${GeistMono.variable} ${serif.variable} ${figure.variable}`} suppressHydrationWarning>
      <body>
        <Script id="caudal-boot" strategy="beforeInteractive">
          {bootScript}
        </Script>
        {children}
        <Toaster position="bottom-right" toastOptions={{ className: '!bg-surface-2 !text-fg !border-border-strong !rounded-2xl' }} />
      </body>
    </html>
  )
}
