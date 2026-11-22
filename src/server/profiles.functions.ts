import { createServerFn } from '@tanstack/react-start'
import { and, asc, count, desc, eq, ilike, or, sql } from 'drizzle-orm'
import { z } from 'zod'
import { ADMIN_LOCK_KEY, db } from './db.server'
import { env } from './env.server'
import { databaseErrorCode, type ActionResult } from './errors.server'
import { deleteUploadedAvatar } from './storage.server'
import { comments, profiles, user } from './schema'
import { getConnectionSummary, getPublicModelRanking } from './connections.server'
import { getCurrentUser } from './session.server'
import { getSiteTheme } from './settings.server'
import {
  COMMENTS_PAGE_SIZE,
  MEMBERS_PAGE_SIZE,
  commentCreateSchema,
  commentDeleteSchema,
  contactsUpdateSchema,
  escapeLike,
  profileUpdateSchema,
  themePreferenceSchema,
} from '~/lib/validation'
import type { ContactValues } from '~/lib/contacts'
import { isTheme, type Theme } from '~/lib/theme'

export type ProfileModelUsage = {
  model: string
  displayName: string
  iconKey: string | null
  tokens: number
  costMicros: number
}

export type PublicProfile = {
  userId: string
  username: string
  displayName: string
  tagline: string
  bio: string
  contacts: ContactValues
  avatarUrl: string | null
  theme: string
  createdAt: string
  isHome: boolean
  modelRanking: ProfileModelUsage[] | null
}

class AccountPolicyError extends Error {
  constructor(readonly reason: 'LAST_ADMIN' | 'NOT_FOUND') {
    super(reason)
    this.name = 'AccountPolicyError'
  }
}

function toPublicProfile(row: typeof profiles.$inferSelect): PublicProfile {
  return {
    userId: row.userId,
    username: row.username,
    displayName: row.displayName,
    tagline: row.tagline,
    bio: row.bio,
    contacts: {
      discord: row.contactDiscord,
      x: row.contactX,
      email: row.contactEmail,
      telegram: row.contactTelegram,
      github: row.contactGithub,
      instagram: row.contactInstagram,
    },
    avatarUrl: row.avatarUrl,
    theme: row.theme,
    createdAt: row.createdAt.toISOString(),
    isHome: row.username === env.HOME_USERNAME,
    modelRanking: null,
  }
}

async function findProfile(username: string) {
  const [row] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.username, username))
    .limit(1)
  return row ?? null
}

export const getHomeProfileFn = createServerFn({ method: 'GET' }).handler(
  async () => {
    if (!env.HOME_USERNAME) {
      return {
        state: 'misconfigured' as const,
        message:
          'HOME_USERNAME is not configured. Set it in the environment and restart the application.',
      }
    }

    const row = await findProfile(env.HOME_USERNAME)
    if (row) {
      return {
        state: 'ok' as const,
        profile: {
          ...toPublicProfile(row),
          modelRanking: await getPublicModelRanking(row.userId),
        },
      }
    }

    return {
      state: 'setup' as const,
      message: `No profile exists for ${env.HOME_USERNAME} yet.`,
    }
  },
)

export const getProfileFn = createServerFn({ method: 'GET' })
  .validator(z.object({ username: z.string().trim().max(64) }))
  .handler(async ({ data }) => {
    const username = data.username.trim().toLowerCase()
    if (!/^[a-z0-9_]{3,24}$/.test(username)) return null
    const row = await findProfile(username)
    if (!row) return null
    return {
      ...toPublicProfile(row),
      modelRanking: await getPublicModelRanking(row.userId),
    }
  })

export const searchMembersFn = createServerFn({ method: 'GET' })
  .validator(
    z.object({
      q: z.string().max(80).default(''),
      page: z.number().int().min(1).default(1),
    }),
  )
  .handler(async ({ data }) => {
    const q = data.q.trim()
    const pattern = `%${escapeLike(q)}%`
    const where = q
      ? or(
          ilike(profiles.username, pattern),
          ilike(profiles.displayName, pattern),
        )
      : undefined

    const offset = (data.page - 1) * MEMBERS_PAGE_SIZE
    const rows = await db
      .select()
      .from(profiles)
      .where(where)
      .orderBy(asc(profiles.username))
      .limit(MEMBERS_PAGE_SIZE)
      .offset(offset)

    const [totalRow] = await db
      .select({ value: count() })
      .from(profiles)
      .where(where)
    const total = Number(totalRow?.value ?? 0)

    return {
      members: rows.map(toPublicProfile),
      total,
      page: data.page,
      pageCount: Math.max(1, Math.ceil(total / MEMBERS_PAGE_SIZE)),
    }
  })

export type ApprovedCommentsResult =
  | {
      ok: true
      comments: Array<{
        id: string
        body: string
        createdAt: string
        authorName: string
        authorUsername: string | null
      }>
      total: number
      page: number
      pageCount: number
    }
  | { ok: false; message: string }

export const getApprovedCommentsFn = createServerFn({ method: 'GET' })
  .validator(
    z.object({
      targetUserId: z.string().min(1),
      page: z.number().int().min(1).default(1),
    }),
  )
  .handler(async ({ data }): Promise<ApprovedCommentsResult> => {
    try {
      const where = and(
        eq(comments.targetUserId, data.targetUserId),
        eq(comments.status, 'approved'),
      )
      const rows = await db
        .select({
          id: comments.id,
          body: comments.body,
          createdAt: comments.createdAt,
          authorName: profiles.displayName,
          authorUsername: profiles.username,
        })
        .from(comments)
        .innerJoin(profiles, eq(comments.authorId, profiles.userId))
        .where(where)
        .orderBy(desc(comments.createdAt))
        .limit(COMMENTS_PAGE_SIZE)
        .offset((data.page - 1) * COMMENTS_PAGE_SIZE)

      const [totalRow] = await db
        .select({ value: count() })
        .from(comments)
        .where(where)
      const total = Number(totalRow?.value ?? 0)

      return {
        ok: true as const,
        comments: rows.map((row) => ({
          id: row.id,
          body: row.body,
          createdAt: row.createdAt.toISOString(),
          authorName: row.authorName,
          authorUsername: row.authorUsername,
        })),
        total,
        page: data.page,
        pageCount: Math.max(1, Math.ceil(total / COMMENTS_PAGE_SIZE)),
      }
    } catch {
      return {
        ok: false as const,
        message: 'Comments could not be loaded. Refresh to try again.',
      }
    }
  })

export const postCommentFn = createServerFn({ method: 'POST' })
  .validator(commentCreateSchema)
  .handler(async ({ data }): Promise<ActionResult<{ message: string }>> => {
    const current = await getCurrentUser()
    if (!current) {
      return { ok: false, message: 'Sign in to leave a comment.' }
    }

    const [target] = await db
      .select({ userId: profiles.userId })
      .from(profiles)
      .where(eq(profiles.userId, data.targetUserId))
      .limit(1)
    if (!target) {
      return { ok: false, message: 'That profile no longer exists.' }
    }

    await db.insert(comments).values({
      id: crypto.randomUUID(),
      authorId: current.id,
      targetUserId: data.targetUserId,
      body: data.body,
      status: 'pending',
    })

    return {
      ok: true,
      message:
        'Comment submitted. It appears after an administrator approves it.',
    }
  })

export const deleteOwnCommentFn = createServerFn({ method: 'POST' })
  .validator(commentDeleteSchema)
  .handler(async ({ data }): Promise<ActionResult> => {
    const current = await getCurrentUser()
    if (!current) {
      return { ok: false, message: 'Sign in to manage your comments.' }
    }

    const deleted = await db
      .delete(comments)
      .where(
        and(eq(comments.id, data.commentId), eq(comments.authorId, current.id)),
      )
      .returning({ id: comments.id })

    if (deleted.length === 0) {
      return {
        ok: false,
        message: 'That comment was not found on your account.',
      }
    }
    return { ok: true }
  })

export const getAccountDataFn = createServerFn({ method: 'GET' }).handler(
  async () => {
    const current = await getCurrentUser()
    if (!current) {
      return { authenticated: false as const }
    }
    if (!current.profile) {
      return {
        authenticated: true as const,
        profileMissing: true as const,
        email: current.email,
        isAdmin: current.role === 'admin',
      }
    }

    const rows = await db
      .select({
        id: comments.id,
        body: comments.body,
        status: comments.status,
        createdAt: comments.createdAt,
        targetUsername: profiles.username,
        targetDisplayName: profiles.displayName,
      })
      .from(comments)
      .innerJoin(profiles, eq(comments.targetUserId, profiles.userId))
      .where(eq(comments.authorId, current.id))
      .orderBy(desc(comments.createdAt))
      .limit(50)

    return {
      authenticated: true as const,
      profileMissing: false as const,
      email: current.email,
      isAdmin: current.role === 'admin',
      siteTheme: await getSiteTheme(),
      themePreference: isTheme(current.profile.preferredTheme)
        ? current.profile.preferredTheme
        : null,
      profile: toPublicProfile(current.profile),
      connections: await getConnectionSummary(current.id),
      comments: rows.map((row) => ({
        ...row,
        createdAt: row.createdAt.toISOString(),
      })),
    }
  },
)

export const updateProfileFn = createServerFn({ method: 'POST' })
  .validator(profileUpdateSchema)
  .handler(
    async ({ data }): Promise<ActionResult<{ profile: PublicProfile }>> => {
      const current = await getCurrentUser()
      if (!current?.profile) {
        return { ok: false, message: 'Sign in to edit your profile.' }
      }

      if (
        current.profile.username === env.HOME_USERNAME &&
        data.username !== current.profile.username
      ) {
        return {
          ok: false,
          message: 'The home profile username cannot be changed.',
        }
      }

      try {
        const nextAvatar = data.avatarUrl
          ? data.avatarUrl
          : data.clearAvatar
            ? null
            : current.profile.avatarUrl

        const [updated] = await db
          .update(profiles)
          .set({
            displayName: data.displayName,
            tagline: data.tagline,
            bio: data.bio,
            username: data.username,
            theme: data.theme,
            avatarUrl: nextAvatar,
          })
          .where(eq(profiles.userId, current.id))
          .returning()

        if (!updated) {
          return { ok: false, message: 'Your profile could not be updated.' }
        }

        const previousAvatar = current.profile.avatarUrl
        if (previousAvatar && previousAvatar !== updated.avatarUrl) {
          await deleteUploadedAvatar(previousAvatar)
        }

        return { ok: true, profile: toPublicProfile(updated) }
      } catch (error) {
        if (databaseErrorCode(error) === '23505') {
          return { ok: false, message: 'That username is already taken.' }
        }
        return {
          ok: false,
          message: 'Your profile could not be updated. Try again.',
        }
      }
    },
  )

export const updateContactsFn = createServerFn({ method: 'POST' })
  .validator(contactsUpdateSchema)
  .handler(
    async ({ data }): Promise<ActionResult<{ profile: PublicProfile }>> => {
      const current = await getCurrentUser()
      if (!current?.profile) {
        return { ok: false, message: 'Sign in to edit your profile.' }
      }

      try {
        const [updated] = await db
          .update(profiles)
          .set({
            contactDiscord: data.contacts.discord,
            contactX: data.contacts.x,
            contactEmail: data.contacts.email,
            contactTelegram: data.contacts.telegram,
            contactGithub: data.contacts.github,
            contactInstagram: data.contacts.instagram,
          })
          .where(eq(profiles.userId, current.id))
          .returning()

        if (!updated) {
          return { ok: false, message: 'Your contacts could not be saved.' }
        }

        return { ok: true, profile: toPublicProfile(updated) }
      } catch {
        return {
          ok: false,
          message: 'Your contacts could not be saved. Try again.',
        }
      }
    },
  )

export const updateThemePreferenceFn = createServerFn({ method: 'POST' })
  .validator(themePreferenceSchema)
  .handler(
    async ({
      data,
    }): Promise<ActionResult<{ themePreference: Theme | null }>> => {
      const current = await getCurrentUser()
      if (!current?.profile) {
        return { ok: false, message: 'Sign in to change your color theme.' }
      }

      try {
        const [updated] = await db
          .update(profiles)
          .set({ preferredTheme: data.theme })
          .where(eq(profiles.userId, current.id))
          .returning({ preferredTheme: profiles.preferredTheme })

        if (!updated) {
          return { ok: false, message: 'Your color theme could not be saved.' }
        }

        return {
          ok: true,
          themePreference: isTheme(updated.preferredTheme)
            ? updated.preferredTheme
            : null,
        }
      } catch {
        return {
          ok: false,
          message: 'Your color theme could not be saved. Try again.',
        }
      }
    },
  )

export const deleteOwnAccountFn = createServerFn({ method: 'POST' })
  .validator(z.object({ confirmation: z.string().min(1) }))
  .handler(async ({ data }): Promise<ActionResult> => {
    const current = await getCurrentUser()
    if (!current?.profile) {
      return { ok: false, message: 'Sign in to delete your account.' }
    }
    if (data.confirmation !== current.profile.username) {
      return {
        ok: false,
        message: `Type ${current.profile.username} to confirm deletion.`,
      }
    }
    if (current.profile.username === env.HOME_USERNAME) {
      return { ok: false, message: 'The home profile cannot be deleted.' }
    }

    const avatar = current.profile.avatarUrl

    try {
      await db.transaction(async (tx) => {
        await tx.execute(sql`select pg_advisory_xact_lock(${ADMIN_LOCK_KEY})`)
        const [fresh] = await tx
          .select({ role: user.role })
          .from(user)
          .where(eq(user.id, current.id))
          .limit(1)
        if (!fresh) throw new AccountPolicyError('NOT_FOUND')

        if (fresh.role === 'admin') {
          const [admins] = await tx
            .select({ value: count() })
            .from(user)
            .where(eq(user.role, 'admin'))
          if (Number(admins?.value ?? 0) <= 1) {
            throw new AccountPolicyError('LAST_ADMIN')
          }
        }

        await tx.delete(user).where(eq(user.id, current.id))
      })
    } catch (error) {
      if (
        error instanceof AccountPolicyError &&
        error.reason === 'LAST_ADMIN'
      ) {
        return {
          ok: false,
          message:
            'You are the last administrator. Grant another administrator before deleting this account.',
        }
      }
      return {
        ok: false,
        message: 'The account could not be deleted. Try again.',
      }
    }

    if (avatar) await deleteUploadedAvatar(avatar)
    return { ok: true }
  })
