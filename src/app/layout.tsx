import type { Metadata, Viewport } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import Script from 'next/script'
import { Toaster } from 'sonner'
import './globals.css'

export const metadata: Metadata = {
  title: { default: 'Caudal', template: '%s · Caudal' },
  description: 'Tu centro de inteligencia financiera personal: qué pasó con tu plata, por qué, qué puede pasar y qué conviene hacer.',
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f6f5f2' },
    { media: '(prefers-color-scheme: dark)', color: '#0f0f0e' },
  ],
}

// aplica tema y modo privacidad antes del primer pintado (sin parpadeo)
const bootScript = `(function(){try{var t=localStorage.getItem('caudal-theme');var d=t==='dark'||(t!=='light'&&matchMedia('(prefers-color-scheme: dark)').matches);var e=document.documentElement;if(d)e.classList.add('dark');if(localStorage.getItem('caudal-privacy')==='1')e.classList.add('privacy')}catch(_){}})()`

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-AR" className={`${GeistSans.variable} ${GeistMono.variable}`} suppressHydrationWarning>
      <body>
        <Script id="caudal-boot" strategy="beforeInteractive">
          {bootScript}
        </Script>
        {children}
        <Toaster position="bottom-right" toastOptions={{ className: '!bg-surface !text-fg !border-border !rounded-xl' }} />
      </body>
    </html>
  )
}
