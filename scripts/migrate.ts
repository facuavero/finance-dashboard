import path from 'node:path'
import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import { migrate } from 'drizzle-orm/neon-http/migrator'

// aplica las migraciones de drizzle/ en neon por http. uso: DATABASE_URL=... npm run db:migrate
const url = process.env.DATABASE_URL
if (!url) throw new Error('falta DATABASE_URL')

await migrate(drizzle(neon(url)), { migrationsFolder: path.join(process.cwd(), 'drizzle') })
console.log('migraciones aplicadas')
