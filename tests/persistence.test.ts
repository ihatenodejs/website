import { randomUUID } from 'node:crypto'
import { eq } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/node-postgres'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import { Pool } from 'pg'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import {
  appState,
  comments,
  profiles,
  session,
  siteSettings,
  user,
} from '../src/server/schema'

const databaseUrl = process.env.TEST_DATABASE_URL

function errorCode(error: unknown, depth = 0): string | null {
  if (depth > 4 || typeof error !== 'object' || error === null) return null
  if ('code' in error && typeof error.code === 'string') return error.code
  if ('cause' in error) return errorCode(error.cause, depth + 1)
  return null
}

const suite = databaseUrl ? describe : describe.skip

suite('PostgreSQL persistence rules', () => {
  let pool: Pool
  let db: ReturnType<typeof drizzle>

  beforeAll(async () => {
    pool = new Pool({ connectionString: databaseUrl, max: 4 })
    db = drizzle(pool)
    await migrate(db, { migrationsFolder: './drizzle' })
  })

  afterAll(async () => {
    await pool.end()
  })

  beforeEach(async () => {
    await pool.query(
      'TRUNCATE app_state, comments, profiles, session, site_settings, account, verification, "user" CASCADE',
    )
  })

  async function createUser(label: string, username: string) {
    const id = randomUUID()
    const now = new Date()
    await db.insert(user).values({
      id,
      name: label,
      email: `${label}@example.test`,
      emailVerified: false,
      createdAt: now,
      updatedAt: now,
      role: 'user',
    })
    await db.insert(profiles).values({
      userId: id,
      username,
      displayName: label,
      bio: '',
      theme: 'night',
    })
    return id
  }

  it('rejects a duplicate username regardless of input case', async () => {
    await createUser('alpha', 'same_name')
    const failure = await createUser('beta', 'same_name').catch((e) => e)
    expect(errorCode(failure)).toBe('23505')
  })

  it('enforces lowercase usernames, known themes, and comment length in SQL', async () => {
    const id = await createUser('gamma', 'gamma_user')

    const uppercase = await db
      .update(profiles)
      .set({ username: 'Gamma_User' })
      .where(eq(profiles.userId, id))
      .catch((error) => error)
    expect(errorCode(uppercase)).toBe('23514')

    const theme = await db
      .update(profiles)
      .set({ theme: 'green' })
      .where(eq(profiles.userId, id))
      .catch((error) => error)
    expect(errorCode(theme)).toBe('23514')

    const preferredTheme = await db
      .update(profiles)
      .set({ preferredTheme: 'green' })
      .where(eq(profiles.userId, id))
      .catch((error) => error)
    expect(errorCode(preferredTheme)).toBe('23514')

    await db
      .update(profiles)
      .set({ preferredTheme: null })
      .where(eq(profiles.userId, id))

    const siteTheme = await db
      .insert(siteSettings)
      .values({ id: 'site', theme: 'green' })
      .catch((error) => error)
    expect(errorCode(siteTheme)).toBe('23514')

    const tagline = await db
      .update(profiles)
      .set({ tagline: 'a'.repeat(161) })
      .where(eq(profiles.userId, id))
      .catch((error) => error)
    expect(errorCode(tagline)).toBe('23514')

    const github = await db
      .update(profiles)
      .set({ contactGithub: 'a'.repeat(40) })
      .where(eq(profiles.userId, id))
      .catch((error) => error)
    expect(errorCode(github)).toBe('23514')

    const author = await createUser('author', 'author_user')
    const tooLong = await db
      .insert(comments)
      .values({
        id: randomUUID(),
        authorId: author,
        targetUserId: id,
        body: 'a'.repeat(501),
        status: 'pending',
      })
      .catch((error) => error)
    expect(errorCode(tooLong)).toBe('23514')
  })

  it('cascades authored and received comments when an account is deleted', async () => {
    const author = await createUser('author', 'author_user')
    const target = await createUser('target', 'target_user')
    const commentId = randomUUID()
    await db.insert(comments).values({
      id: commentId,
      authorId: author,
      targetUserId: target,
      body: 'Hello',
      status: 'approved',
    })

    await db.delete(user).where(eq(user.id, author))
    expect(await db.select().from(comments)).toHaveLength(0)
  })

  it('cascades profiles and sessions with the auth user', async () => {
    const id = await createUser('delta', 'delta_user')
    await db.insert(session).values({
      id: randomUUID(),
      token: randomUUID(),
      userId: id,
      expiresAt: new Date(Date.now() + 60_000),
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    await db.delete(user).where(eq(user.id, id))
    expect(await db.select().from(profiles)).toHaveLength(0)
    expect(await db.select().from(session)).toHaveLength(0)
  })

  it('restricts deleting the home user referenced by the bootstrap marker', async () => {
    const home = await createUser('home', 'home_user')
    await db.insert(appState).values({ key: 'bootstrap', homeUserId: home })

    const failure = await db
      .delete(user)
      .where(eq(user.id, home))
      .catch((error) => error)
    expect(errorCode(failure)).toBe('23503')
    expect(await db.select().from(user)).toHaveLength(1)
  })
})
