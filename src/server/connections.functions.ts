import { createServerFn } from '@tanstack/react-start'
import { and, eq, inArray, notInArray } from 'drizzle-orm'
import { z } from 'zod'
import {
  agentConnections,
  agentUsage,
  modelGroupMembers,
  modelGroups,
  modelOverrides,
} from './schema'
import { db } from './db.server'
import { databaseErrorCode } from './errors.server'
import { failStaleRuns, getAgentSyncRun } from './connections.server'
import { getCurrentUser } from './session.server'
import { MODEL_ICON_KEYS } from '~/lib/model-usage'

export const updateShowModelsFn = createServerFn({ method: 'POST' })
  .validator(z.object({ showModels: z.boolean() }))
  .handler(async ({ data }) => {
    const current = await getCurrentUser()
    if (!current) {
      return { ok: false as const, message: 'Sign in to change your connection.' }
    }

    await db
      .insert(agentConnections)
      .values({ userId: current.id, showModels: data.showModels })
      .onConflictDoUpdate({
        target: agentConnections.userId,
        set: { showModels: data.showModels, updatedAt: new Date() },
      })

    return { ok: true as const, showModels: data.showModels }
  })

export const updateModelOverrideFn = createServerFn({ method: 'POST' })
  .validator(
    z.object({
      model: z.string().trim().min(1).max(200),
      displayName: z.string().trim().max(80),
      iconKey: z
        .union([z.enum(MODEL_ICON_KEYS), z.literal('none')])
        .nullable(),
    }),
  )
  .handler(async ({ data }) => {
    const current = await getCurrentUser()
    if (!current) {
      return { ok: false as const, message: 'Sign in to change your connection.' }
    }

    const [model] = await db
      .select({ model: agentUsage.model })
      .from(agentUsage)
      .where(
        and(
          eq(agentUsage.userId, current.id),
          eq(agentUsage.model, data.model),
        ),
      )
      .limit(1)

    if (!model) {
      return {
        ok: false as const,
        message: 'That model is not in your synced usage.',
      }
    }

    if (data.displayName === '' && data.iconKey === null) {
      await db
        .delete(modelOverrides)
        .where(
          and(
            eq(modelOverrides.userId, current.id),
            eq(modelOverrides.model, data.model),
          ),
        )
      return {
        ok: true as const,
        override: { displayName: '', iconKey: null },
      }
    }

    await db
      .insert(modelOverrides)
      .values({
        userId: current.id,
        model: data.model,
        displayName: data.displayName,
        iconKey: data.iconKey,
      })
      .onConflictDoUpdate({
        target: [modelOverrides.userId, modelOverrides.model],
        set: {
          displayName: data.displayName,
          iconKey: data.iconKey,
          updatedAt: new Date(),
        },
      })

    return {
      ok: true as const,
      override: { displayName: data.displayName, iconKey: data.iconKey },
    }
  })

export const getAgentSyncRunFn = createServerFn({ method: 'GET' })
  .validator(z.object({ runId: z.string().min(1).max(64) }))
  .handler(async ({ data }) => {
    const current = await getCurrentUser()
    if (!current) {
      return { ok: false as const, message: 'Sign in to check a sync.' }
    }

    await failStaleRuns(current.id)
    const run = await getAgentSyncRun(current.id, data.runId)
    if (!run) {
      return { ok: false as const, message: 'That sync was not found.' }
    }
    return { ok: true as const, run }
  })

const modelGroupSchema = z.object({
  alias: z.string().trim().min(1).max(80),
  iconKey: z
    .union([z.enum(MODEL_ICON_KEYS), z.literal('none')])
    .nullable(),
  models: z.array(z.string().trim().min(1).max(200)).min(1).max(200),
})

async function validateGroupMembers(
  userId: string,
  models: string[],
  ownGroupId: string | null,
) {
  const unique = [...new Set(models)]

  const used = await db
    .selectDistinct({ model: agentUsage.model })
    .from(agentUsage)
    .where(
      and(eq(agentUsage.userId, userId), inArray(agentUsage.model, unique)),
    )
  if (used.length !== unique.length) {
    return {
      ok: false as const,
      message: 'Some of those models are not in your synced usage.',
    }
  }

  const memberships = await db
    .select({ model: modelGroupMembers.model, groupId: modelGroupMembers.groupId })
    .from(modelGroupMembers)
    .where(
      and(
        eq(modelGroupMembers.userId, userId),
        inArray(modelGroupMembers.model, unique),
      ),
    )
  const taken = memberships.find((row) => row.groupId !== ownGroupId)
  if (taken) {
    return {
      ok: false as const,
      message: `${taken.model} already belongs to another group.`,
    }
  }

  return { ok: true as const, models: unique }
}

export const createModelGroupFn = createServerFn({ method: 'POST' })
  .validator(modelGroupSchema)
  .handler(async ({ data }) => {
    const current = await getCurrentUser()
    if (!current) {
      return { ok: false as const, message: 'Sign in to change your groups.' }
    }

    const checked = await validateGroupMembers(current.id, data.models, null)
    if (!checked.ok) return checked

    const groupId = crypto.randomUUID()
    try {
      await db.transaction(async (tx) => {
        await tx.insert(modelGroups).values({
          id: groupId,
          userId: current.id,
          alias: data.alias,
          iconKey: data.iconKey,
        })
        await tx.insert(modelGroupMembers).values(
          checked.models.map((model) => ({
            userId: current.id,
            groupId,
            model,
          })),
        )
      })
    } catch (error) {
      if (databaseErrorCode(error) === '23505') {
        return {
          ok: false as const,
          message: 'You already have a group with that alias.',
        }
      }
      return { ok: false as const, message: 'The group could not be saved.' }
    }

    return {
      ok: true as const,
      group: { id: groupId, alias: data.alias, iconKey: data.iconKey },
    }
  })

export const updateModelGroupFn = createServerFn({ method: 'POST' })
  .validator(modelGroupSchema.extend({ id: z.string().min(1).max(64) }))
  .handler(async ({ data }) => {
    const current = await getCurrentUser()
    if (!current) {
      return { ok: false as const, message: 'Sign in to change your groups.' }
    }

    const [group] = await db
      .select({ id: modelGroups.id })
      .from(modelGroups)
      .where(
        and(
          eq(modelGroups.id, data.id),
          eq(modelGroups.userId, current.id),
        ),
      )
      .limit(1)
    if (!group) {
      return { ok: false as const, message: 'That group no longer exists.' }
    }

    const checked = await validateGroupMembers(current.id, data.models, group.id)
    if (!checked.ok) return checked

    try {
      await db.transaction(async (tx) => {
        await tx
          .update(modelGroups)
          .set({
            alias: data.alias,
            iconKey: data.iconKey,
            updatedAt: new Date(),
          })
          .where(eq(modelGroups.id, group.id))
        await tx
          .delete(modelGroupMembers)
          .where(
            and(
              eq(modelGroupMembers.groupId, group.id),
              notInArray(modelGroupMembers.model, checked.models),
            ),
          )
        await tx
          .insert(modelGroupMembers)
          .values(
            checked.models.map((model) => ({
              userId: current.id,
              groupId: group.id,
              model,
            })),
          )
          .onConflictDoNothing()
      })
    } catch (error) {
      if (databaseErrorCode(error) === '23505') {
        return {
          ok: false as const,
          message: 'You already have a group with that alias.',
        }
      }
      return { ok: false as const, message: 'The group could not be saved.' }
    }

    return {
      ok: true as const,
      group: { id: group.id, alias: data.alias, iconKey: data.iconKey },
    }
  })

export const deleteModelGroupFn = createServerFn({ method: 'POST' })
  .validator(z.object({ id: z.string().min(1).max(64) }))
  .handler(async ({ data }) => {
    const current = await getCurrentUser()
    if (!current) {
      return { ok: false as const, message: 'Sign in to change your groups.' }
    }

    const removed = await db
      .delete(modelGroups)
      .where(
        and(eq(modelGroups.id, data.id), eq(modelGroups.userId, current.id)),
      )
      .returning({ id: modelGroups.id })

    if (removed.length === 0) {
      return { ok: false as const, message: 'That group no longer exists.' }
    }
    return { ok: true as const }
  })
