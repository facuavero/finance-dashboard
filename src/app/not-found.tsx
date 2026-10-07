import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-3 p-6 text-center">
      <p className="label-caps">404</p>
      <h1 className="display text-[44px]">Esta página no existe</h1>
      <Link href="/inicio" className="text-sm text-accent hover:underline">
        Volver al inicio
      </Link>
    </main>
  )
}
