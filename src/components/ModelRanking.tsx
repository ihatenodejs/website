import { useState } from 'react'
import { ModelAvatar } from './ModelAvatar'
import { Panel } from './Panel'
import {
  formatCostMicros,
  formatTokenCount,
  rankModels,
  resolveModelIconKey,
  type ModelMetric,
} from '~/lib/model-usage'
import type { PublicProfile } from '~/server/profiles.functions'

export function ModelRanking({
  models,
}: {
  models: PublicProfile['modelRanking']
}) {
  const [metric, setMetric] = useState<ModelMetric>('tokens')

  if (!models || models.length === 0) return null

  const top = rankModels(models, metric, 5)
  const max = Math.max(
    ...top.map((model) => (metric === 'tokens' ? model.tokens : model.costMicros)),
    1,
  )

  return (
    <Panel title="Model usage" hint="Top 5">
      <div className="model-ranking-head">
        <label className="field">
          <span>Rank by</span>
          <select
            value={metric}
            onChange={(event) =>
              setMetric(event.target.value === 'cost' ? 'cost' : 'tokens')
            }
          >
            <option value="tokens">By tokens</option>
            <option value="cost">By cost</option>
          </select>
        </label>
      </div>
      <ol className="model-ranking">
        {top.map((model, index) => {
          const value = metric === 'tokens' ? model.tokens : model.costMicros
          return (
            <li key={model.model}>
              <span className="model-rank">{index + 1}</span>
              <ModelAvatar
                iconKey={resolveModelIconKey(model.model, model.iconKey)}
                name={model.displayName}
              />
              <span className="model-name">{model.displayName}</span>
              <span className="model-value">
                {metric === 'tokens'
                  ? formatTokenCount(model.tokens)
                  : formatCostMicros(model.costMicros)}
              </span>
              <span className="model-bar-track" aria-hidden="true">
                <span
                  className="model-bar"
                  style={{
                    width: `${value === 0 ? 0 : Math.max(2, (value / max) * 100)}%`,
                  }}
                />
              </span>
            </li>
          )
        })}
      </ol>
      <p className="field-note">Synced with agent-exporter.</p>
    </Panel>
  )
}
