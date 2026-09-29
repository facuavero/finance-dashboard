import path from 'node:path'
import fs from 'node:fs'
import type { PgliteDatabase } from 'drizzle-orm/pglite'
import * as schema from './schema'

// un solo tipo de db para toda la app. pglite y node-postgres comparten el query builder de drizzle.
export type DB = PgliteDatabase<typeof schema>

const MIGRATIONS = path.join(process.cwd(), 'drizzle')

type GlobalDb = { __caudalDb?: Promise<DB> }
const g = globalThis as unknown as GlobalDb

async function connect(): Promise<DB> {
  const url = process.env.DATABASE_URL
  if (url) {
    const { Pool } = await import('pg')
    const { drizzle } = await import('drizzle-orm/node-postgres')
    const { migrate } = await import('drizzle-orm/node-postgres/migrator')
    const pool = new Pool({ connectionString: url, max: 10 })
    const db = drizzle(pool, { schema })
    await migrate(db, { migrationsFolder: MIGRATIONS })
    return db as unknown as DB
  }

  // local: postgres embebido (wasm) persistido en .data/pglite
  const dir = path.join(process.cwd(), '.data', 'pglite')
  fs.mkdirSync(dir, { recursive: true })
  const { PGlite } = await import('@electric-sql/pglite')
  const { drizzle } = await import('drizzle-orm/pglite')
  const { migrate } = await import('drizzle-orm/pglite/migrator')
  const client = new PGlite(dir)
  const db = drizzle(client, { schema })
  await migrate(db, { migrationsFolder: MIGRATIONS })
  return db
}

export function getDb(): Promise<DB> {
  if (!g.__caudalDb) {
    g.__caudalDb = connect().catch((err) => {
      g.__caudalDb = undefined
      throw err
    })
  }
  return g.__caudalDb
}

export { schema }
