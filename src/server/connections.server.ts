import { and, asc, desc, eq, inArray, lt, sql } from 'drizzle-orm'
import { AGENT_SYNC_LOCK_KEY, db } from './db.server'
import type { AgentUsageRow } from './agent-export.server'
import {
  agentConnections,
  agentSyncRuns,
  agentUsage,
  modelGroupMembers,
  modelGroups,
  modelOverrides,
} from './schema'
import {
  suggestModelGroups,
  type ModelGroupSuggestion,
} from '~/lib/model-usage'

export const AGENT_RUN_STALE_MS = 15 * 60 * 1000

const STALE_MESSAGE = 'The merge was interrupted. Upload the file again.'

export type ConnectionModel = {
  model: string
  displayName: string
  iconKey: string | null
  tokens: number
  costMicros: number
  lastUsed: string | null
  groupAlias: string | null
}

export type ModelGroup = {
  id: string
  alias: string
  iconKey: string | null
  models: string[]
  tokens: number
  costMicros: number
  lastUsed: string | null
}

export const RUN_STATUSES = ['queued', 'running', 'complete', 'failed'] as const
export type RunStatus = (typeof RUN_STATUSES)[number]

export type AgentSyncRun = {
  id: string
  status: RunStatus
  fileName: string
  insertedCount: number
  updatedCount: number
  unchangedCount: number
  providerCount: number
  dayCount: number
  modelCount: number
  totalTokens: number
  totalCostMicros: number
  earliestDate: string | null
  latestDate: string | null
  errorMessage: string | null
  createdAt: string
  completedAt: string | null
}

export type ConnectionSummary = {
  connected: boolean
  showModels: boolean
  providerCount: number
  dayCount: number
  modelCount: number
  totalTokens: number
  totalCostMicros: number
  lastSyncedAt: string | null
  models: ConnectionModel[]
  groups: ModelGroup[]
  suggestions: ModelGroupSuggestion[]
  latestRun: AgentSyncRun | null
}

export type PublicModelUsage = {
  model: string
  displayName: string
  iconKey: string | null
  tokens: number
  costMicros: number
}

type RunRow = typeof agentSyncRuns.$inferSelect

function runStatus(status: string): RunStatus {
  return (RUN_STATUSES as readonly string[]).includes(status)
    ? (status as RunStatus)
    : 'failed'
}

function toRun(row: RunRow): AgentSyncRun {
  return {
    id: row.id,
    status: runStatus(row.status),
    fileName: row.fileName,
    insertedCount: row.insertedCount,
    updatedCount: row.updatedCount,
    unchangedCount: row.unchangedCount,
    providerCount: row.providerCount,
    dayCount: row.dayCount,
    modelCount: row.modelCount,
    totalTokens: row.totalTokens,
    totalCostMicros: row.totalCostMicros,
    earliestDate: row.earliestDate,
    latestDate: row.latestDate,
    errorMessage: row.errorMessage,
    createdAt: row.createdAt.toISOString(),
    completedAt: row.completedAt?.toISOString() ?? null,
  }
}

type ModelStats = Omit<ConnectionModel, 'groupAlias'>

async function listModelStats(userId: string): Promise<ModelStats[]> {
  const rows = await db
    .select({
      model: agentUsage.model,
      overrideName: modelOverrides.displayName,
      overrideIcon: modelOverrides.iconKey,
      tokens: sql<number>`sum(${agentUsage.inputTokens} + ${agentUsage.outputTokens} + ${agentUsage.cacheCreationTokens} + ${agentUsage.cacheReadTokens})`.mapWith(
        Number,
      ),
      costMicros: sql<number>`sum(${agentUsage.costMicros})`.mapWith(Number),
      lastUsed: sql<string | null>`max(${agentUsage.usageDate})`,
    })
    .from(agentUsage)
    .leftJoin(
      modelOverrides,
      and(
        eq(modelOverrides.userId, agentUsage.userId),
        eq(modelOverrides.model, agentUsage.model),
      ),
    )
    .where(eq(agentUsage.userId, userId))
    .groupBy(agentUsage.model, modelOverrides.displayName, modelOverrides.iconKey)

  return rows
    .map((row) => ({
      model: row.model,
      displayName: row.overrideName || row.model,
      iconKey: row.overrideIcon,
      tokens: row.tokens,
      costMicros: row.costMicros,
      lastUsed: row.lastUsed,
    }))
    .sort((a, b) => b.tokens - a.tokens)
}

type GroupRow = {
  id: string
  alias: string
  iconKey: string | null
  models: string[]
}

async function listGroupRows(userId: string): Promise<GroupRow[]> {
  const groups = await db
    .select({
      id: modelGroups.id,
      alias: modelGroups.alias,
      iconKey: modelGroups.iconKey,
    })
    .from(modelGroups)
    .where(eq(modelGroups.userId, userId))
    .orderBy(asc(modelGroups.alias))

  if (groups.length === 0) return []

  const members = await db
    .select({ groupId: modelGroupMembers.groupId, model: modelGroupMembers.model })
    .from(modelGroupMembers)
    .where(eq(modelGroupMembers.userId, userId))

  const byGroup = new Map<string, string[]>()
  for (const member of members) {
    const list = byGroup.get(member.groupId)
    if (list) list.push(member.model)
    else byGroup.set(member.groupId, [member.model])
  }

  return groups.map((group) => ({
    ...group,
    models: (byGroup.get(group.id) ?? []).sort((a, b) => a.localeCompare(b)),
  }))
}

function groupAliasByModel(groups: GroupRow[]): Map<string, string> {
  const map = new Map<string, string>()
  for (const group of groups) {
    for (const model of group.models) map.set(model, group.alias)
  }
  return map
}

/* Groups aggregate their members, so the profile card shows one row per group
   instead of one row per synced id. */
function buildModelGroups(
  groups: GroupRow[],
  stats: ModelStats[],
): ModelGroup[] {
  const statsByModel = new Map(stats.map((row) => [row.model, row]))
  return groups.map((group) => {
    let tokens = 0
    let costMicros = 0
    let lastUsed: string | null = null
    for (const model of group.models) {
      const row = statsByModel.get(model)
      if (!row) continue
      tokens += row.tokens
      costMicros += row.costMicros
      if (row.lastUsed && (!lastUsed || row.lastUsed > lastUsed)) {
        lastUsed = row.lastUsed
      }
    }
    return {
      id: group.id,
      alias: group.alias,
      iconKey: group.iconKey,
      models: group.models,
      tokens,
      costMicros,
      lastUsed,
    }
  })
}

function mergeGroupsForRanking(
  stats: ModelStats[],
  groups: GroupRow[],
): PublicModelUsage[] {
  const groupByModel = new Map<string, GroupRow>()
  for (const group of groups) {
    for (const model of group.models) groupByModel.set(model, group)
  }

  const merged = new Map<string, PublicModelUsage>()
  for (const row of stats) {
    const group = groupByModel.get(row.model)
    const key = group ? `group:${group.id}` : `model:${row.model}`
    const existing = merged.get(key)
    if (existing) {
      existing.tokens += row.tokens
      existing.costMicros += row.costMicros
      continue
    }
    merged.set(key, {
      model: group ? group.alias : row.model,
      displayName: group ? group.alias : row.displayName,
      iconKey: group ? group.iconKey : row.iconKey,
      tokens: row.tokens,
      costMicros: row.costMicros,
    })
  }

  return [...merged.values()]
}

export async function failStaleRuns(userId: string): Promise<void> {
  const cutoff = new Date(Date.now() - AGENT_RUN_STALE_MS)
  await db
    .update(agentSyncRuns)
    .set({
      status: 'failed',
      errorMessage: STALE_MESSAGE,
      completedAt: new Date(),
    })
    .where(
      and(
        eq(agentSyncRuns.userId, userId),
        inArray(agentSyncRuns.status, ['queued', 'running']),
        lt(agentSyncRuns.createdAt, cutoff),
      ),
    )
}

export async function getConnectionSummary(
  userId: string,
): Promise<ConnectionSummary> {
  await failStaleRuns(userId)

  const [connection] = await db
    .select()
    .from(agentConnections)
    .where(eq(agentConnections.userId, userId))
    .limit(1)

  const [totals] = await db
    .select({
      providerCount: sql<number>`count(distinct ${agentUsage.provider})`.mapWith(
        Number,
      ),
      dayCount: sql<number>`count(distinct ${agentUsage.usageDate})`.mapWith(
        Number,
      ),
      modelCount: sql<number>`count(distinct ${agentUsage.model})`.mapWith(
        Number,
      ),
      totalTokens: sql<number>`coalesce(sum(${agentUsage.inputTokens} + ${agentUsage.outputTokens} + ${agentUsage.cacheCreationTokens} + ${agentUsage.cacheReadTokens}), 0)`.mapWith(
        Number,
      ),
      totalCostMicros: sql<number>`coalesce(sum(${agentUsage.costMicros}), 0)`.mapWith(
        Number,
      ),
    })
    .from(agentUsage)
    .where(eq(agentUsage.userId, userId))

  const stats = await listModelStats(userId)
  const groupRows = await listGroupRows(userId)
  const aliasByModel = groupAliasByModel(groupRows)
  const models: ConnectionModel[] = stats.map((row) => ({
    ...row,
    groupAlias: aliasByModel.get(row.model) ?? null,
  }))
  const groups = buildModelGroups(groupRows, stats)
  const groupedModels = groupRows.flatMap((group) => group.models)
  const existingAliases = new Set(
    groups.map((group) => group.alias.toLowerCase()),
  )
  const suggestions = suggestModelGroups(stats, groupedModels).filter(
    (suggestion) => !existingAliases.has(suggestion.alias.toLowerCase()),
  )

  const [run] = await db
    .select()
    .from(agentSyncRuns)
    .where(eq(agentSyncRuns.userId, userId))
    .orderBy(desc(agentSyncRuns.createdAt))
    .limit(1)

  return {
    connected: models.length > 0,
    showModels: connection?.showModels ?? false,
    providerCount: totals?.providerCount ?? 0,
    dayCount: totals?.dayCount ?? 0,
    modelCount: totals?.modelCount ?? 0,
    totalTokens: totals?.totalTokens ?? 0,
    totalCostMicros: totals?.totalCostMicros ?? 0,
    lastSyncedAt: connection?.lastSyncedAt?.toISOString() ?? null,
    models,
    groups,
    suggestions,
    latestRun: run ? toRun(run) : null,
  }
}

export async function getPublicModelRanking(
  userId: string,
): Promise<PublicModelUsage[] | null> {
  const [connection] = await db
    .select({ showModels: agentConnections.showModels })
    .from(agentConnections)
    .where(eq(agentConnections.userId, userId))
    .limit(1)

  if (!connection?.showModels) return null

  const stats = await listModelStats(userId)
  if (stats.length === 0) return null

  const rows = mergeGroupsForRanking(stats, await listGroupRows(userId))
  const byTokens = [...rows].sort((a, b) => b.tokens - a.tokens).slice(0, 5)
  const byCost = [...rows].sort((a, b) => b.costMicros - a.costMicros).slice(0, 5)

  const seen = new Set<string>()
  const ranking: PublicModelUsage[] = []
  for (const model of [...byTokens, ...byCost]) {
    if (seen.has(model.model)) continue
    seen.add(model.model)
    ranking.push({
      model: model.model,
      displayName: model.displayName,
      iconKey: model.iconKey,
      tokens: model.tokens,
      costMicros: model.costMicros,
    })
  }
  return ranking
}

export async function createAgentSyncRun(
  userId: string,
  fileName: string,
): Promise<AgentSyncRun> {
  const safeName =
    (fileName.trim() || 'agent-usage.json').slice(0, 120).replace(/[\r\n]/g, ' ')

  const [row] = await db
    .insert(agentSyncRuns)
    .values({ id: crypto.randomUUID(), userId, fileName: safeName })
    .returning()

  return toRun(row)
}

export async function getAgentSyncRun(
  userId: string,
  runId: string,
): Promise<AgentSyncRun | null> {
  const [row] = await db
    .select()
    .from(agentSyncRuns)
    .where(and(eq(agentSyncRuns.id, runId), eq(agentSyncRuns.userId, userId)))
    .limit(1)
  return row ? toRun(row) : null
}

function summarize(rows: AgentUsageRow[]) {
  const providers = new Set<string>()
  const days = new Set<string>()
  const models = new Set<string>()
  let totalTokens = 0
  let totalCostMicros = 0
  let earliestDate: string | null = null
  let latestDate: string | null = null

  for (const row of rows) {
    providers.add(row.provider)
    days.add(row.usageDate)
    models.add(row.model)
    totalTokens +=
      row.inputTokens +
      row.outputTokens +
      row.cacheCreationTokens +
      row.cacheReadTokens
    totalCostMicros += row.costMicros
    if (earliestDate === null || row.usageDate < earliestDate) {
      earliestDate = row.usageDate
    }
    if (latestDate === null || row.usageDate > latestDate) {
      latestDate = row.usageDate
    }
  }

  return {
    providerCount: providers.size,
    dayCount: days.size,
    modelCount: models.size,
    totalTokens,
    totalCostMicros,
    earliestDate,
    latestDate,
  }
}

export async function mergeAgentExport(
  userId: string,
  runId: string,
  rows: AgentUsageRow[],
): Promise<void> {
  const startedAt = new Date()
  await db
    .update(agentSyncRuns)
    .set({ status: 'running', startedAt })
    .where(and(eq(agentSyncRuns.id, runId), eq(agentSyncRuns.userId, userId)))

  try {
    await db.transaction(async (tx) => {
      await tx.execute(sql`select pg_advisory_xact_lock(${AGENT_SYNC_LOCK_KEY})`)

      const existingRows = await tx
        .select()
        .from(agentUsage)
        .where(eq(agentUsage.userId, userId))
      const existing = new Map(
        existingRows.map((row) => [
          `${row.provider}::${row.usageDate}::${row.model}`,
          row,
        ]),
      )

      let insertedCount = 0
      let updatedCount = 0
      let unchangedCount = 0

      for (const row of rows) {
        const previous = existing.get(
          `${row.provider}::${row.usageDate}::${row.model}`,
        )
        if (!previous) {
          insertedCount += 1
        } else if (
          previous.inputTokens === row.inputTokens &&
          previous.outputTokens === row.outputTokens &&
          previous.cacheCreationTokens === row.cacheCreationTokens &&
          previous.cacheReadTokens === row.cacheReadTokens &&
          previous.costMicros === row.costMicros
        ) {
          unchangedCount += 1
        } else {
          updatedCount += 1
        }
      }

      for (let index = 0; index < rows.length; index += 500) {
        const chunk = rows.slice(index, index + 500)
        await tx
          .insert(agentUsage)
          .values(
            chunk.map((row) => ({
              userId,
              provider: row.provider,
              usageDate: row.usageDate,
              model: row.model,
              inputTokens: row.inputTokens,
              outputTokens: row.outputTokens,
              cacheCreationTokens: row.cacheCreationTokens,
              cacheReadTokens: row.cacheReadTokens,
              costMicros: row.costMicros,
            })),
          )
          .onConflictDoUpdate({
            target: [
              agentUsage.userId,
              agentUsage.provider,
              agentUsage.usageDate,
              agentUsage.model,
            ],
            set: {
              inputTokens: sql`excluded.input_tokens`,
              outputTokens: sql`excluded.output_tokens`,
              cacheCreationTokens: sql`excluded.cache_creation_tokens`,
              cacheReadTokens: sql`excluded.cache_read_tokens`,
              costMicros: sql`excluded.cost_micros`,
              updatedAt: new Date(),
            },
          })
      }

      const syncedAt = new Date()
      await tx
        .insert(agentConnections)
        .values({ userId, lastSyncedAt: syncedAt })
        .onConflictDoUpdate({
          target: agentConnections.userId,
          set: { lastSyncedAt: syncedAt, updatedAt: syncedAt },
        })

      const summary = summarize(rows)
      await tx
        .update(agentSyncRuns)
        .set({
          status: 'complete',
          insertedCount,
          updatedCount,
          unchangedCount,
          ...summary,
          startedAt,
          completedAt: new Date(),
          errorMessage: null,
        })
        .where(and(eq(agentSyncRuns.id, runId), eq(agentSyncRuns.userId, userId)))
    })
  } catch (error) {
    const message =
      error instanceof Error && error.message
        ? error.message.slice(0, 500)
        : 'The merge failed.'
    await db
      .update(agentSyncRuns)
      .set({
        status: 'failed',
        errorMessage: message,
        completedAt: new Date(),
      })
      .where(and(eq(agentSyncRuns.id, runId), eq(agentSyncRuns.userId, userId)))
  }
}
