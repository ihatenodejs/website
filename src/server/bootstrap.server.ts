import { count, eq } from 'drizzle-orm'
import { db } from './db.server'
import { appState, user } from './schema'

export async function getBootstrapState() {
  const [marker] = await db
    .select({ homeUserId: appState.homeUserId })
    .from(appState)
    .where(eq(appState.key, 'bootstrap'))
    .limit(1)
  const [admins] = await db
    .select({ value: count() })
    .from(user)
    .where(eq(user.role, 'admin'))

  return {
    complete: Boolean(marker),
    adminCount: Number(admins?.value ?? 0),
  }
}
