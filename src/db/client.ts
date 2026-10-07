import type { PgliteDatabase } from 'drizzle-orm/pglite'
import * as schema from './schema'

// un solo tipo de db para toda la app. pglite, neon y node-postgres comparten el query builder de drizzle.
export type DB = PgliteDatabase<typeof schema>

type GlobalDb = { __caudalDb?: Promise<DB> }
const g = globalThis as unknown as GlobalDb

async function connect(): Promise<DB> {
  const url = process.env.DATABASE_URL

  // neon por http: sin conexiones abiertas, anda en cloudflare workers. las migraciones van aparte (npm run db:migrate).
  if (url && /\.neon\.tech/.test(url)) {
    const { neon } = await import('@neondatabase/serverless')
    const { drizzle } = await import('drizzle-orm/neon-http')
    return drizzle(neon(url), { schema }) as unknown as DB
  }

  // en workers no hay disco ni tcp: sin una url de neon, pglite y pg revientan con "operation not permitted". mejor decirlo claro.
  if (typeof navigator !== 'undefined' && navigator.userAgent === 'Cloudflare-Workers') {
    throw new Error(url ? 'DATABASE_URL no es una url de neon (tiene que contener .neon.tech). en workers no anda postgres por tcp.' : 'falta DATABASE_URL en el worker. cargala como secreto: npx wrangler secret put DATABASE_URL')
  }

  // postgres normal por tcp (servidor node). corre las migraciones al arrancar.
  // los imports van ocultos al bundler a proposito: en workers no hay tcp y pg rompe el build.
  if (url) {
    const path = await import('node:path')
    const [pgName, drizzleName, migratorName] = ['pg', 'drizzle-orm/node-postgres', 'drizzle-orm/node-postgres/migrator']
    const { Pool } = await import(/* turbopackIgnore: true */ /* webpackIgnore: true */ pgName)
    const { drizzle } = await import(/* turbopackIgnore: true */ /* webpackIgnore: true */ drizzleName)
    const { migrate } = await import(/* turbopackIgnore: true */ /* webpackIgnore: true */ migratorName)
    const db = drizzle(new Pool({ connectionString: url, max: 10 }), { schema })
    await migrate(db, { migrationsFolder: path.join(process.cwd(), 'drizzle') })
    return db as unknown as DB
  }

  // local: postgres embebido (wasm) persistido en .data/pglite
  const path = await import('node:path')
  const fs = await import('node:fs')
  const dir = path.join(process.cwd(), '.data', 'pglite')
  fs.mkdirSync(dir, { recursive: true })
  const { PGlite } = await import('@electric-sql/pglite')
  const { drizzle } = await import('drizzle-orm/pglite')
  const { migrate } = await import('drizzle-orm/pglite/migrator')
  const db = drizzle(new PGlite(dir), { schema })
  await migrate(db, { migrationsFolder: path.join(process.cwd(), 'drizzle') })
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
