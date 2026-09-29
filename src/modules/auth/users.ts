import { eq } from 'drizzle-orm'
import { type DB, schema } from '@/db/client'
import { newId } from '@/lib/ids'
import { seedCategories } from '@/modules/finance/categories'
import { hashPassword } from './password'

export async function findUserByEmail(db: DB, email: string) {
  const rows = await db.select().from(schema.users).where(eq(schema.users.email, email.toLowerCase())).limit(1)
  return rows[0] ?? null
}

export async function createUser(db: DB, input: { name: string; email: string; password: string }) {
  const id = newId()
  const passwordHash = await hashPassword(input.password)
  await db.insert(schema.users).values({ id, name: input.name, email: input.email.toLowerCase(), passwordHash })
  await seedCategories(db, id)
  return id
}
