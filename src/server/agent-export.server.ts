import { z } from 'zod'

export type AgentUsageRow = {
  provider: string
  usageDate: string
  model: string
  inputTokens: number
  outputTokens: number
  cacheCreationTokens: number
  cacheReadTokens: number
  costMicros: number
}

export class AgentExportError extends Error {}

const MAX_PROVIDERS = 50
const MAX_DAYS = 20_000
const MAX_MODELS_PER_DAY = 200
const MAX_ROWS = 100_000

const tokenCount = z
  .number()
  .int()
  .min(0)
  .max(Number.MAX_SAFE_INTEGER)

const daySchema = z.looseObject({
  date: z.string(),
  modelBreakdowns: z
    .array(
      z.looseObject({
        modelName: z.string().trim().min(1).max(200),
        inputTokens: tokenCount,
        outputTokens: tokenCount,
        cacheCreationTokens: tokenCount,
        cacheReadTokens: tokenCount,
        cost: z.number().min(0).max(1_000_000_000),
      }),
    )
    .max(MAX_MODELS_PER_DAY),
})

const providerSchema = z.looseObject({
  daily: z.array(daySchema).max(MAX_DAYS),
})

const exportSchema = z.record(z.string().min(1).max(64), providerSchema)

function parseDate(value: string): string | null {
  if (!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(value)) return null
  const date = new Date(`${value}T00:00:00Z`)
  if (Number.isNaN(date.getTime())) return null
  return date.toISOString().slice(0, 10) === value ? value : null
}

function issueText(error: z.ZodError): string {
  const issue = error.issues[0]
  if (!issue) return 'The export could not be read.'
  const path = issue.path.length > 0 ? issue.path.join('.') : 'export'
  return `${path}: ${issue.message}`
}

export function parseAgentExport(input: unknown): AgentUsageRow[] {
  if (Array.isArray(input)) {
    throw new AgentExportError('The export must be a JSON object.')
  }

  const parsed = exportSchema.safeParse(input)
  if (!parsed.success) {
    throw new AgentExportError(issueText(parsed.error))
  }

  const providers = Object.entries(parsed.data)
  if (providers.length === 0) {
    throw new AgentExportError('The export has no providers.')
  }
  if (providers.length > MAX_PROVIDERS) {
    throw new AgentExportError('The export has more than 50 providers.')
  }

  const merged = new Map<string, AgentUsageRow>()
  let rowCount = 0

  for (const [rawProvider, providerExport] of providers) {
    const provider = rawProvider.trim()
    if (provider.length === 0) {
      throw new AgentExportError('A provider name is blank.')
    }

    for (const day of providerExport.daily) {
      const usageDate = parseDate(day.date)
      if (usageDate === null) {
        throw new AgentExportError(`Invalid date: ${day.date}`)
      }

      for (const breakdown of day.modelBreakdowns) {
        rowCount += 1
        if (rowCount > MAX_ROWS) {
          throw new AgentExportError(
            'The export has more than 100,000 model rows.',
          )
        }

        const key = `${provider}::${usageDate}::${breakdown.modelName}`
        const existing = merged.get(key)
        if (existing) {
          existing.inputTokens += breakdown.inputTokens
          existing.outputTokens += breakdown.outputTokens
          existing.cacheCreationTokens += breakdown.cacheCreationTokens
          existing.cacheReadTokens += breakdown.cacheReadTokens
          existing.costMicros += Math.round(breakdown.cost * 1_000_000)
          continue
        }

        merged.set(key, {
          provider,
          usageDate,
          model: breakdown.modelName,
          inputTokens: breakdown.inputTokens,
          outputTokens: breakdown.outputTokens,
          cacheCreationTokens: breakdown.cacheCreationTokens,
          cacheReadTokens: breakdown.cacheReadTokens,
          costMicros: Math.round(breakdown.cost * 1_000_000),
        })
      }
    }
  }

  return [...merged.values()]
}
