import { createServerFn } from '@tanstack/react-start'
import {
  ADMIN_PAGE_SIZE,
  escapeLike,
  MAX_SEARCH_LENGTH,
  moderationSchema,
  roleUpdateSchema,
  userDeleteSchema,
} from '~/lib/validation'
import { ADMIN_LOCK_KEY, db } from './db.server'
import { env } from './env.server'
import type { ActionResult } from './errors.server'
import { deleteUploadedAvatar } from './storage.server'
import { comments, profiles, user } from './schema'
import { getAdminUser } from './session.server'
import { getSiteTheme } from './settings.server'
import { asc, count, desc, eq, ilike, or, sql, type SQL } from 'drizzle-orm'
import { alias } from 'drizzle-orm/pg-core'
import { z } from 'zod'

class AdminPolicyError extends Error {
  constructor(readonly reason: 'LAST_ADMIN' | 'MISSING') {
    super(reason)
    this.name = 'AdminPolicyError'
  }
}

const adminDataSchema = z.object({
  status: z.enum(['pending', 'approved']).default('pending'),
  page: z.number().int().min(1).default(1),
  q: z.string().max(MAX_SEARCH_LENGTH).default(''),
  usersPage: z.number().int().min(1).default(1),
})

const authorProfile = alias(profiles, 'author_profile')
const targetProfile = alias(profiles, 'target_profile')

export const getAdminDataFn = createServerFn({ method: 'GET' })
  .validator(adminDataSchema)
  .handler(async ({ data }) => {
    const admin = await getAdminUser()
    if (!admin) {
      return { authorized: false as const }
    }

    const status = data.status
    const q = data.q.trim()
    const pattern = `%${escapeLike(q)}%`

    const commentRows = await db
      .select({
        id: comments.id,
        body: comments.body,
        status: comments.status,
        createdAt: comments.createdAt,
        authorUsername: authorProfile.username,
        authorDisplayName: authorProfile.displayName,
        targetUsername: targetProfile.username,
        targetDisplayName: targetProfile.displayName,
      })
      .from(comments)
      .innerJoin(authorProfile, eq(comments.authorId, authorProfile.userId))
      .innerJoin(targetProfile, eq(comments.targetUserId, targetProfile.userId))
      .where(eq(comments.status, status))
      .orderBy(desc(comments.createdAt))
      .limit(ADMIN_PAGE_SIZE)
      .offset((data.page - 1) * ADMIN_PAGE_SIZE)

    const [statusCount] = await db
      .select({ value: count() })
      .from(comments)
      .where(eq(comments.status, status))
    const commentTotal = Number(statusCount?.value ?? 0)

    const [pendingCount] = await db
      .select({ value: count() })
      .from(comments)
      .where(eq(comments.status, 'pending'))
    const [approvedCount] = await db
      .select({ value: count() })
      .from(comments)
      .where(eq(comments.status, 'approved'))

    const userWhere: SQL | undefined = q
      ? or(
          ilike(profiles.username, pattern),
          ilike(profiles.displayName, pattern),
        )
      : undefined

    const userRows = await db
      .select({
        id: user.id,
        role: user.role,
        createdAt: user.createdAt,
        username: profiles.username,
        displayName: profiles.displayName,
      })
      .from(user)
      .innerJoin(profiles, eq(profiles.userId, user.id))
      .where(userWhere)
      .orderBy(asc(profiles.username))
      .limit(ADMIN_PAGE_SIZE)
      .offset((data.usersPage - 1) * ADMIN_PAGE_SIZE)

    const [userCount] = await db
      .select({ value: count() })
      .from(user)
      .innerJoin(profiles, eq(profiles.userId, user.id))
      .where(userWhere)
    const userTotal = Number(userCount?.value ?? 0)

    return {
      authorized: true as const,
      status,
      siteTheme: await getSiteTheme(),
      page: data.page,
      pageCount: Math.max(1, Math.ceil(commentTotal / ADMIN_PAGE_SIZE)),
      commentTotal,
      pendingCount: Number(pendingCount?.value ?? 0),
      approvedCount: Number(approvedCount?.value ?? 0),
      comments: commentRows.map((row) => ({
        ...row,
        createdAt: row.createdAt.toISOString(),
      })),
      q,
      usersPage: data.usersPage,
      userPageCount: Math.max(1, Math.ceil(userTotal / ADMIN_PAGE_SIZE)),
      userTotal,
      users: userRows.map((row) => ({
        ...row,
        createdAt: row.createdAt.toISOString(),
        isHome: row.username === env.HOME_USERNAME,
        isAdmin: row.role === 'admin',
      })),
      currentUserId: admin.id,
    }
  })

export const moderateCommentFn = createServerFn({ method: 'POST' })
  .validator(moderationSchema)
  .handler(async ({ data }): Promise<ActionResult> => {
    const admin = await getAdminUser()
    if (!admin) {
      return { ok: false, message: 'Administrator access is required.' }
    }

    const [comment] = await db
      .select({ id: comments.id, status: comments.status })
      .from(comments)
      .where(eq(comments.id, data.commentId))
      .limit(1)

    if (!comment) {
      return { ok: false, message: 'That comment no longer exists.' }
    }

    if (data.action === 'approve') {
      if (comment.status !== 'pending') {
        return { ok: false, message: 'Only pending comments can be approved.' }
      }
      await db
        .update(comments)
        .set({ status: 'approved' })
        .where(eq(comments.id, comment.id))
      return { ok: true }
    }

    if (data.action === 'reject') {
      if (comment.status !== 'pending') {
        return { ok: false, message: 'Only pending comments can be rejected.' }
      }
      await db.delete(comments).where(eq(comments.id, comment.id))
      return { ok: true }
    }

    if (comment.status !== 'approved') {
      return { ok: false, message: 'Only approved comments can be removed.' }
    }
    await db.delete(comments).where(eq(comments.id, comment.id))
    return { ok: true }
  })

export const setRoleFn = createServerFn({ method: 'POST' })
  .validator(roleUpdateSchema)
  .handler(async ({ data }): Promise<ActionResult> => {
    const admin = await getAdminUser()
    if (!admin) {
      return { ok: false, message: 'Administrator access is required.' }
    }

    try {
      await db.transaction(async (tx) => {
        await tx.execute(sql`select pg_advisory_xact_lock(${ADMIN_LOCK_KEY})`)
        const [target] = await tx
          .select({ id: user.id, role: user.role })
          .from(user)
          .where(eq(user.id, data.userId))
          .limit(1)
        if (!target) throw new AdminPolicyError('MISSING')

        if (target.role === data.role) return

        if (target.role === 'admin' && data.role === 'user') {
          const [admins] = await tx
            .select({ value: count() })
            .from(user)
            .where(eq(user.role, 'admin'))
          if (Number(admins?.value ?? 0) <= 1) {
            throw new AdminPolicyError('LAST_ADMIN')
          }
        }

        await tx
          .update(user)
          .set({ role: data.role })
          .where(eq(user.id, target.id))
      })
    } catch (error) {
      if (error instanceof AdminPolicyError) {
        return {
          ok: false,
          message:
            error.reason === 'LAST_ADMIN'
              ? 'That change would leave the site with zero administrators.'
              : 'That account no longer exists.',
        }
      }
      return { ok: false, message: 'The role change could not be saved.' }
    }

    return { ok: true }
  })

export const adminDeleteUserFn = createServerFn({ method: 'POST' })
  .validator(userDeleteSchema)
  .handler(async ({ data }): Promise<ActionResult> => {
    const admin = await getAdminUser()
    if (!admin) {
      return { ok: false, message: 'Administrator access is required.' }
    }

    const [target] = await db
      .select({
        id: user.id,
        role: user.role,
        username: profiles.username,
        avatarUrl: profiles.avatarUrl,
      })
      .from(user)
      .innerJoin(profiles, eq(profiles.userId, user.id))
      .where(eq(user.id, data.userId))
      .limit(1)

    if (!target) {
      return { ok: false, message: 'That account no longer exists.' }
    }
    if (data.confirmation !== target.username) {
      return {
        ok: false,
        message: `Type ${target.username} to confirm deletion.`,
      }
    }
    if (target.username === env.HOME_USERNAME) {
      return { ok: false, message: 'The home profile cannot be deleted.' }
    }

    try {
      await db.transaction(async (tx) => {
        await tx.execute(sql`select pg_advisory_xact_lock(${ADMIN_LOCK_KEY})`)
        const [fresh] = await tx
          .select({ role: user.role })
          .from(user)
          .where(eq(user.id, target.id))
          .limit(1)
        if (!fresh) return

        if (fresh.role === 'admin') {
          const [admins] = await tx
            .select({ value: count() })
            .from(user)
            .where(eq(user.role, 'admin'))
          if (Number(admins?.value ?? 0) <= 1) {
            throw new AdminPolicyError('LAST_ADMIN')
          }
        }

        await tx.delete(user).where(eq(user.id, target.id))
      })
    } catch (error) {
      if (error instanceof AdminPolicyError && error.reason === 'LAST_ADMIN') {
        return {
          ok: false,
          message: 'The last administrator cannot be deleted.',
        }
      }
      return { ok: false, message: 'The account could not be deleted.' }
    }

    await deleteUploadedAvatar(target.avatarUrl)
    return { ok: true }
  })
