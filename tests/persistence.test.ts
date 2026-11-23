import { randomUUID } from 'node:crypto'
import { eq } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/node-postgres'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import { Pool } from 'pg'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import {
  agentConnections,
  agentSyncRuns,
  agentUsage,
  appState,
  comments,
  modelGroupMembers,
  modelGroups,
  modelOverrides,
  profileSchools,
  profiles,
  session,
  siteSettings,
  statusPosts,
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
      'TRUNCATE agent_connections, agent_sync_runs, agent_usage, model_group_members, model_groups, model_overrides, app_state, profile_schools, status_posts, comments, profiles, session, site_settings, account, verification, "user" CASCADE',
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

    const profileLink = await db
      .update(profiles)
      .set({ profileLink: 'a'.repeat(501) })
      .where(eq(profiles.userId, id))
      .catch((error) => error)
    expect(errorCode(profileLink)).toBe('23514')

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

  it('enforces status body and mood lengths in SQL', async () => {
    const id = await createUser('status', 'status_user')

    const empty = await db
      .insert(statusPosts)
      .values({ id: randomUUID(), userId: id, body: '' })
      .catch((error) => error)
    expect(errorCode(empty)).toBe('23514')

    const tooLong = await db
      .insert(statusPosts)
      .values({ id: randomUUID(), userId: id, body: 'a'.repeat(501) })
      .catch((error) => error)
    expect(errorCode(tooLong)).toBe('23514')

    const longMood = await db
      .insert(statusPosts)
      .values({
        id: randomUUID(),
        userId: id,
        body: 'Listening to music',
        mood: 'a'.repeat(61),
      })
      .catch((error) => error)
    expect(errorCode(longMood)).toBe('23514')

    const longMoodEmoticon = await db
      .insert(statusPosts)
      .values({
        id: randomUUID(),
        userId: id,
        body: 'Listening to music',
        moodEmoticon: 'a'.repeat(21),
      })
      .catch((error) => error)
    expect(errorCode(longMoodEmoticon)).toBe('23514')
  })

  it('enforces school year order and lengths, and cascades with the account', async () => {
    const id = await createUser('school', 'school_user')

    const backwards = await db
      .insert(profileSchools)
      .values({
        id: randomUUID(),
        userId: id,
        name: 'Example High',
        startYear: 2010,
        endYear: 2000,
      })
      .catch((error) => error)
    expect(errorCode(backwards)).toBe('23514')

    const early = await db
      .insert(profileSchools)
      .values({
        id: randomUUID(),
        userId: id,
        name: 'Example High',
        startYear: 1800,
      })
      .catch((error) => error)
    expect(errorCode(early)).toBe('23514')

    await db.insert(profileSchools).values({
      id: randomUUID(),
      userId: id,
      name: 'Example High',
      startYear: 1999,
      endYear: 2003,
      graduatedYear: 2003,
    })
    await db.insert(statusPosts).values({
      id: randomUUID(),
      userId: id,
      body: 'School is out',
    })

    await db.delete(user).where(eq(user.id, id))
    expect(await db.select().from(profileSchools)).toHaveLength(0)
    expect(await db.select().from(statusPosts)).toHaveLength(0)
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

  it('rejects negative token counts and unknown run statuses in SQL', async () => {
    const id = await createUser('usage', 'usage_user')

    const negative = await db
      .insert(agentUsage)
      .values({
        userId: id,
        provider: 'opencode',
        usageDate: '2026-11-18',
        model: 'claude-sonnet-4',
        inputTokens: -1,
        outputTokens: 0,
        cacheCreationTokens: 0,
        cacheReadTokens: 0,
        costMicros: 0,
      })
      .catch((error) => error)
    expect(errorCode(negative)).toBe('23514')

    const status = await db
      .insert(agentSyncRuns)
      .values({
        id: randomUUID(),
        userId: id,
        status: 'canceled',
        fileName: 'agent-usage.json',
      })
      .catch((error) => error)
    expect(errorCode(status)).toBe('23514')
  })

  it('keeps one usage row per user, provider, date, and model on re-upload', async () => {
    const id = await createUser('upsert', 'upsert_user')
    const row = {
      userId: id,
      provider: 'opencode',
      usageDate: '2026-11-18',
      model: 'claude-sonnet-4',
      inputTokens: 10,
      outputTokens: 1,
      cacheCreationTokens: 2,
      cacheReadTokens: 3,
      costMicros: 250_000,
    }

    for (const inputTokens of [10, 25]) {
      await db
        .insert(agentUsage)
        .values({ ...row, inputTokens })
        .onConflictDoUpdate({
          target: [
            agentUsage.userId,
            agentUsage.provider,
            agentUsage.usageDate,
            agentUsage.model,
          ],
          set: { inputTokens },
        })
    }

    const rows = await db.select().from(agentUsage)
    expect(rows).toHaveLength(1)
    expect(rows[0]?.inputTokens).toBe(25)
  })

  it('cascades usage, overrides, connections, and runs with the auth user', async () => {
    const id = await createUser('cascade', 'cascade_user')
    await db.insert(agentUsage).values({
      userId: id,
      provider: 'opencode',
      usageDate: '2026-11-18',
      model: 'claude-sonnet-4',
      inputTokens: 1,
      outputTokens: 1,
      cacheCreationTokens: 0,
      cacheReadTokens: 0,
      costMicros: 1,
    })
    await db
      .insert(modelOverrides)
      .values({ userId: id, model: 'claude-sonnet-4', displayName: 'Sonnet' })
    await db.insert(agentConnections).values({ userId: id, showModels: true })
    await db.insert(agentSyncRuns).values({
      id: randomUUID(),
      userId: id,
      status: 'complete',
      fileName: 'agent-usage.json',
    })

    await db.delete(user).where(eq(user.id, id))
    expect(await db.select().from(agentUsage)).toHaveLength(0)
    expect(await db.select().from(modelOverrides)).toHaveLength(0)
    expect(await db.select().from(agentConnections)).toHaveLength(0)
    expect(await db.select().from(agentSyncRuns)).toHaveLength(0)
  })
  it('keeps one group per alias and one group per model', async () => {
    const id = await createUser('groups', 'groups_user')
    const first = randomUUID()
    const second = randomUUID()

    await db.insert(modelGroups).values({
      id: first,
      userId: id,
      alias: 'deepseek-v4.1-flash',
    })
    await db.insert(modelGroups).values({
      id: second,
      userId: id,
      alias: 'gemini-flash',
    })
    await db.insert(modelGroupMembers).values({
      userId: id,
      groupId: first,
      model: 'deepseek/deepseek-v4.1-flash',
    })

    const duplicateAlias = await db
      .insert(modelGroups)
      .values({ id: randomUUID(), userId: id, alias: 'deepseek-v4.1-flash' })
      .catch((error) => error)
    expect(errorCode(duplicateAlias)).toBe('23505')

    const duplicateModel = await db
      .insert(modelGroupMembers)
      .values({
        userId: id,
        groupId: second,
        model: 'deepseek/deepseek-v4.1-flash',
      })
      .catch((error) => error)
    expect(errorCode(duplicateModel)).toBe('23505')

    const emptyAlias = await db
      .insert(modelGroups)
      .values({ id: randomUUID(), userId: id, alias: '' })
      .catch((error) => error)
    expect(errorCode(emptyAlias)).toBe('23514')
  })

  it('cascades model groups and their members with the auth user', async () => {
    const id = await createUser('groupcascade', 'group_cascade_user')
    const groupId = randomUUID()
    await db
      .insert(modelGroups)
      .values({ id: groupId, userId: id, alias: 'deepseek-v4.1-flash' })
    await db.insert(modelGroupMembers).values({
      userId: id,
      groupId,
      model: 'deepseek/deepseek-v4.1-flash',
    })

    await db.delete(user).where(eq(user.id, id))
    expect(await db.select().from(modelGroups)).toHaveLength(0)
    expect(await db.select().from(modelGroupMembers)).toHaveLength(0)
  })
})
