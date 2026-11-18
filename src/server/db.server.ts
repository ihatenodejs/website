import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import { env } from './env.server'
import * as schema from './schema'

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  max: 10,
})

export const db = drizzle(pool, { schema })

export const BOOTSTRAP_LOCK_KEY = 724_101
export const ADMIN_LOCK_KEY = 724_102
