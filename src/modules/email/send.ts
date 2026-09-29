// envío de emails transaccionales. con RESEND_API_KEY usa resend; sin eso, en desarrollo lo loguea.

export type SendResult = { delivered: boolean; devPreviewUrl?: string }

export async function sendPasswordReset(to: string, name: string, url: string): Promise<SendResult> {
  const key = process.env.RESEND_API_KEY
  if (!key) {
    if (process.env.NODE_ENV !== 'production') {
      console.info(`\n[caudal] link de recuperación para ${to}:\n${url}\n`)
      return { delivered: false, devPreviewUrl: url }
    }
    console.error('[caudal] RESEND_API_KEY no configurada: no se puede enviar el email de recuperación')
    return { delivered: false }
  }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM || 'Caudal <onboarding@resend.dev>',
      to,
      subject: 'Restablecé tu contraseña de Caudal',
      text: `Hola ${name},\n\nPara crear una contraseña nueva entrá a este link (vence en 1 hora):\n${url}\n\nSi no lo pediste, ignorá este correo. Tu contraseña actual sigue funcionando.`,
    }),
  })
  return { delivered: res.ok }
}
