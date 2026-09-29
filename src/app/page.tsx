import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/modules/auth/session'

export default async function Root() {
  redirect((await getCurrentUser()) ? '/inicio' : '/login')
}
