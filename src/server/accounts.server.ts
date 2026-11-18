import { eq } from 'drizzle-orm'
import { db } from './db.server'
import { appState, user } from './schema'

export async function deleteIncompleteUser(userId: string) {
  await db.transaction(async (tx) => {
    await tx.delete(appState).where(eq(appState.homeUserId, userId))
    await tx.delete(user).where(eq(user.id, userId))
  })
}
