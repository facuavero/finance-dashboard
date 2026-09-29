import type { Metadata } from 'next'
import { getAppData } from '@/modules/app/data'
import { GoalsView } from './goals-view'

export const metadata: Metadata = { title: 'Objetivos' }

export default async function Objetivos({ searchParams }: { searchParams: Promise<{ nuevo?: string }> }) {
  const { ctx, today } = await getAppData()
  const sp = await searchParams
  return <GoalsView goals={ctx.goals} capacityCents={ctx.capacity.capacityCents} today={today} openNew={sp.nuevo === '1'} />
}
