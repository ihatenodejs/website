import { drizzle } from 'drizzle-orm/node-postgres'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import { Pool } from 'pg'

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) {
  console.error('DATABASE_URL is required to run migrations.')
  process.exit(1)
}

const pool = new Pool({ connectionString: databaseUrl, max: 1 })
const db = drizzle(pool)

try {
  await migrate(db, { migrationsFolder: './drizzle' })
  console.log('Database migrations applied.')
} catch (error) {
  console.error('Database migration failed.')
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
} finally {
  await pool.end()
}
