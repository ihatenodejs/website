export const MODEL_ICON_KEYS = [
  'openai',
  'claude',
  'gemini',
  'deepseek',
  'grok',
  'qwen',
  'zai',
  'chatglm',
  'mistral',
  'meta',
  'minimax',
  'moonshot',
  'xiaomi-mimo',
  'antigravity',
  'cursor',
  'v0',
  'cohere',
  'nvidia',
  'perplexity',
  'microsoft',
] as const

export type ModelIconKey = (typeof MODEL_ICON_KEYS)[number]

export const MODEL_ICON_LABELS: Record<ModelIconKey, string> = {
  openai: 'OpenAI',
  claude: 'Claude',
  gemini: 'Gemini',
  deepseek: 'DeepSeek',
  grok: 'Grok',
  qwen: 'Qwen',
  zai: 'Z.ai',
  chatglm: 'ChatGLM',
  mistral: 'Mistral',
  meta: 'Meta',
  minimax: 'MiniMax',
  moonshot: 'Moonshot',
  'xiaomi-mimo': 'Xiaomi MiMo',
  antigravity: 'Antigravity',
  cursor: 'Cursor',
  v0: 'v0',
  cohere: 'Cohere',
  nvidia: 'NVIDIA',
  perplexity: 'Perplexity',
  microsoft: 'Microsoft',
}

const DETECTION: Array<{ needles: string[]; key: ModelIconKey }> = [
  { needles: ['claude'], key: 'claude' },
  {
    needles: [
      'gpt',
      'o1-',
      'o3-',
      'o4-',
      'codex',
      'davinci',
      'openai',
      'text-embedding',
    ],
    key: 'openai',
  },
  { needles: ['gemini', 'gemma', 'palm'], key: 'gemini' },
  { needles: ['deepseek'], key: 'deepseek' },
  { needles: ['grok'], key: 'grok' },
  { needles: ['qwen', 'qwq', 'qvq'], key: 'qwen' },
  { needles: ['glm-5'], key: 'zai' },
  { needles: ['glm-', 'chatglm'], key: 'chatglm' },
  { needles: ['mimo'], key: 'xiaomi-mimo' },
  { needles: ['mistral', 'mixtral', 'codestral'], key: 'mistral' },
  { needles: ['llama'], key: 'meta' },
  { needles: ['minimax', 'abab'], key: 'minimax' },
  { needles: ['kimi', 'moonshot'], key: 'moonshot' },
  { needles: ['antigravity'], key: 'antigravity' },
  { needles: ['composer'], key: 'cursor' },
  { needles: ['v0-'], key: 'v0' },
  { needles: ['command'], key: 'cohere' },
  { needles: ['nemotron'], key: 'nvidia' },
  { needles: ['sonar', 'pplx'], key: 'perplexity' },
  { needles: ['phi-'], key: 'microsoft' },
]

export function isModelIconKey(value: unknown): value is ModelIconKey {
  return (
    typeof value === 'string' &&
    (MODEL_ICON_KEYS as readonly string[]).includes(value)
  )
}

export function detectModelIconKey(model: string): ModelIconKey | null {
  const id = model.toLowerCase()
  for (const rule of DETECTION) {
    if (rule.needles.some((needle) => id.includes(needle))) return rule.key
  }
  return null
}

export function resolveModelIconKey(
  model: string,
  override: string | null,
): ModelIconKey | 'none' | null {
  if (override === 'none') return 'none'
  if (isModelIconKey(override)) return override
  return detectModelIconKey(model)
}

export type ModelMetric = 'tokens' | 'cost'

export function rankModels<
  T extends { model: string; tokens: number; costMicros: number },
>(models: T[], metric: ModelMetric, limit: number): T[] {
  return [...models]
    .sort((a, b) => {
      const left = metric === 'tokens' ? a.tokens : a.costMicros
      const right = metric === 'tokens' ? b.tokens : b.costMicros
      if (left !== right) return right - left
      return a.model.localeCompare(b.model)
    })
    .slice(0, limit)
}

function trimFraction(value: string) {
  return value.includes('.') ? value.replace(/0+$/, '').replace(/\.$/, '') : value
}

export function formatTokenCount(value: number): string {
  if (value < 1_000) return Math.round(value).toLocaleString('en-US')
  if (value < 1_000_000) return `${trimFraction((value / 1_000).toFixed(1))}K`
  if (value < 1_000_000_000) {
    return `${trimFraction((value / 1_000_000).toFixed(2))}M`
  }
  return `${trimFraction((value / 1_000_000_000).toFixed(2))}B`
}

const costFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

export function formatCostMicros(value: number): string {
  return costFormatter.format(value / 1_000_000)
}

const VERSION_SUFFIX = /-(\d{4,}|latest|preview|free|beta|alpha|experimental|exp)$/i

/* A synced id carries a provider prefix, punctuation variants, and often a
   release stamp: deepseek/deepseek-v4.1-flash, deepseek-v4-1-flash-1017, and
   deepseek-v4.1-flash all describe the same model. */
function modelBaseName(model: string) {
  const display = (model.split('/').pop() ?? model).trim()
  let base = display
  for (let pass = 0; pass < 3; pass += 1) {
    const next = base.replace(VERSION_SUFFIX, '')
    if (next === base || next.length === 0) break
    base = next
  }
  return base
}

export function normalizeModelGroupKey(model: string): string {
  return modelBaseName(model)
    .toLowerCase()
    .replace(/[_.]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export type ModelGroupSuggestion = {
  key: string
  alias: string
  models: string[]
  tokens: number
  costMicros: number
}

export function suggestModelGroups<
  T extends { model: string; tokens: number; costMicros: number },
>(models: T[], taken: readonly string[]): ModelGroupSuggestion[] {
  const takenSet = new Set(taken)
  const tokensFor = new Map(models.map((row) => [row.model, row.tokens]))
  const buckets = new Map<string, ModelGroupSuggestion>()

  for (const row of models) {
    if (takenSet.has(row.model)) continue
    const key = normalizeModelGroupKey(row.model)
    if (key.length === 0) continue

    const existing = buckets.get(key)
    if (existing) {
      existing.models.push(row.model)
      existing.tokens += row.tokens
      existing.costMicros += row.costMicros
      continue
    }
    buckets.set(key, {
      key,
      alias: modelBaseName(row.model),
      models: [row.model],
      tokens: row.tokens,
      costMicros: row.costMicros,
    })
  }

  const suggestions: ModelGroupSuggestion[] = []
  for (const bucket of buckets.values()) {
    if (bucket.models.length < 2) continue
    /* Name the group after its busiest member, so the biggest contributor's
       own spelling wins; ties fall back to the shortest id, then alphabetical. */
    const [busiest] = [...bucket.models].sort(
      (a, b) =>
        (tokensFor.get(b) ?? 0) - (tokensFor.get(a) ?? 0) ||
        a.length - b.length ||
        a.localeCompare(b),
    )
    suggestions.push({ ...bucket, alias: modelBaseName(busiest!) })
  }

  return suggestions.sort(
    (a, b) => b.tokens - a.tokens || a.alias.localeCompare(b.alias),
  )
}
