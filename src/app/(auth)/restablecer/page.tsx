import Link from 'next/link'
import { ResetForm } from './reset-form'

export default async function ResetPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams
  if (!token) {
    return (
      <div>
        <h1 className="text-2xl font-semibold tracking-[-0.02em]">Link inválido</h1>
        <p className="mt-2 text-sm text-muted">Al link le falta el código. Pedí uno nuevo.</p>
        <Link href="/recuperar" className="mt-4 inline-block text-sm text-accent hover:underline">
          Pedir un link nuevo
        </Link>
      </div>
    )
  }
  return <ResetForm token={token} />
}
