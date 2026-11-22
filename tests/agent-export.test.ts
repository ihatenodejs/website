import { describe, expect, it } from 'vitest'
import {
  AgentExportError,
  parseAgentExport,
} from '../src/server/agent-export.server'

const breakdown = (modelName: string, inputTokens: number, cost: number) => ({
  modelName,
  inputTokens,
  outputTokens: 1,
  cacheCreationTokens: 2,
  cacheReadTokens: 3,
  cost,
})

function provider(days: Array<Record<string, unknown>>) {
  return { daily: days, totals: { inputTokens: 999 } }
}

describe('parseAgentExport', () => {
  it('flattens two providers into one row per day and model', () => {
    const rows = parseAgentExport({
      opencode: provider([
        {
          date: '2026-11-18',
          modelBreakdowns: [breakdown('claude-sonnet-4', 10, 0.25)],
        },
      ]),
      codex: provider([
        {
          date: '2026-11-19',
          modelBreakdowns: [breakdown('gpt-5.6-terra', 20, 1)],
        },
      ]),
    })

    expect(rows).toEqual([
      {
        provider: 'opencode',
        usageDate: '2026-11-18',
        model: 'claude-sonnet-4',
        inputTokens: 10,
        outputTokens: 1,
        cacheCreationTokens: 2,
        cacheReadTokens: 3,
        costMicros: 250_000,
      },
      {
        provider: 'codex',
        usageDate: '2026-11-19',
        model: 'gpt-5.6-terra',
        inputTokens: 20,
        outputTokens: 1,
        cacheCreationTokens: 2,
        cacheReadTokens: 3,
        costMicros: 1_000_000,
      },
    ])
  })

  it('sums duplicate provider, date, and model keys inside one file', () => {
    const rows = parseAgentExport({
      opencode: provider([
        {
          date: '2026-11-18',
          modelBreakdowns: [
            breakdown('claude-sonnet-4', 10, 0.5),
            breakdown('claude-sonnet-4', 5, 0.25),
          ],
        },
      ]),
    })

    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({ inputTokens: 15, costMicros: 750_000 })
  })

  it('rejects negative token counts', () => {
    expect(() =>
      parseAgentExport({
        opencode: provider([
          {
            date: '2026-11-18',
            modelBreakdowns: [breakdown('claude-sonnet-4', -1, 0)],
          },
        ]),
      }),
    ).toThrow(AgentExportError)
  })

  it('rejects invalid dates', () => {
    expect(() =>
      parseAgentExport({
        opencode: provider([
          {
            date: '2026-02-31',
            modelBreakdowns: [breakdown('claude-sonnet-4', 1, 0)],
          },
        ]),
      }),
    ).toThrow(AgentExportError)
  })

  it('rejects arrays and other non-object input', () => {
    expect(() => parseAgentExport([])).toThrow(AgentExportError)
    expect(() => parseAgentExport('nope')).toThrow(AgentExportError)
  })

  it('rejects more than 50 providers', () => {
    const payload: Record<string, unknown> = {}
    for (let index = 0; index < 51; index += 1) {
      payload[`provider-${index}`] = provider([])
    }
    expect(() => parseAgentExport(payload)).toThrow(AgentExportError)
  })
})
