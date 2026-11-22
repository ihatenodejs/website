import { describe, expect, it } from 'vitest'
import {
  detectModelIconKey,
  formatCostMicros,
  formatTokenCount,
  rankModels,
  resolveModelIconKey,
  suggestModelGroups,
} from '../src/lib/model-usage'

describe('detectModelIconKey', () => {
  it('maps known model ids to their brand', () => {
    expect(detectModelIconKey('claude-sonnet-4-20250514')).toBe('claude')
    expect(detectModelIconKey('gpt-5.6-terra')).toBe('openai')
    expect(detectModelIconKey('gemini-3.8-flash')).toBe('gemini')
    expect(detectModelIconKey('deepseek/deepseek-v4.1-flash')).toBe('deepseek')
    expect(detectModelIconKey('grok-4.5')).toBe('grok')
    expect(detectModelIconKey('mimo-v2.5-free')).toBe('xiaomi-mimo')
    expect(detectModelIconKey('glm-4.5')).toBe('chatglm')
  })

  it('returns null when no brand matches', () => {
    expect(detectModelIconKey('coder-model')).toBeNull()
    expect(detectModelIconKey('unknown-model')).toBeNull()
  })
})

describe('resolveModelIconKey', () => {
  it('prefers an explicit override and falls back to detection', () => {
    expect(resolveModelIconKey('claude-sonnet-4', 'gemini')).toBe('gemini')
    expect(resolveModelIconKey('claude-sonnet-4', 'none')).toBe('none')
    expect(resolveModelIconKey('claude-sonnet-4', null)).toBe('claude')
    expect(resolveModelIconKey('unknown-model', null)).toBeNull()
  })
})

describe('rankModels', () => {
  const models = [
    { model: 'beta', tokens: 30, costMicros: 1 },
    { model: 'alpha', tokens: 30, costMicros: 5 },
    { model: 'gamma', tokens: 10, costMicros: 9 },
  ]

  it('sorts by the metric and breaks ties by model id', () => {
    expect(rankModels(models, 'tokens', 2).map((row) => row.model)).toEqual([
      'alpha',
      'beta',
    ])
    expect(rankModels(models, 'cost', 3).map((row) => row.model)).toEqual([
      'gamma',
      'alpha',
      'beta',
    ])
  })
})

describe('formatTokenCount', () => {
  it('scales the unit and trims trailing zeros', () => {
    expect(formatTokenCount(999)).toBe('999')
    expect(formatTokenCount(1_500)).toBe('1.5K')
    expect(formatTokenCount(2_700_000_000)).toBe('2.7B')
  })
})

describe('formatCostMicros', () => {
  it('renders whole cents with a thousands separator', () => {
    expect(formatCostMicros(1_830_770_000)).toBe('$1,830.77')
  })
})

describe('suggestModelGroups', () => {
  const rows = [
    { model: 'deepseek/deepseek-v4.1-flash', tokens: 100, costMicros: 10 },
    { model: 'deepseek-v4-1-flash-1017', tokens: 50, costMicros: 5 },
    { model: 'deepseek-v4.1-flash', tokens: 25, costMicros: 2 },
    { model: 'grok-4.5', tokens: 10, costMicros: 1 },
    { model: 'grok-4.6', tokens: 8, costMicros: 1 },
    { model: 'sole-model', tokens: 1, costMicros: 0 },
  ]

  it('merges ids that only differ by prefix, punctuation, and release stamp', () => {
    const [suggestion] = suggestModelGroups(rows, [])
    expect(suggestion).toMatchObject({
      key: 'deepseek-v4-1-flash',
      alias: 'deepseek-v4.1-flash',
      tokens: 175,
      costMicros: 17,
    })
    expect(suggestion!.models).toHaveLength(3)
  })

  it('leaves distinct versions and single models alone', () => {
    const suggestions = suggestModelGroups(rows, [])
    expect(suggestions).toHaveLength(1)
    expect(suggestions[0]!.models).not.toContain('grok-4.5')
    expect(suggestions[0]!.models).not.toContain('sole-model')
  })

  it('skips models that already belong to a group', () => {
    const taken = ['deepseek/deepseek-v4.1-flash', 'deepseek-v4.1-flash']
    expect(suggestModelGroups(rows, taken)).toEqual([])
  })
})
