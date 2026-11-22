import { useRouter } from '@tanstack/react-router'
import { Fragment, useState } from 'react'
import { FormMessage, type FormResult } from './FormMessage'
import { ModelAvatar } from './ModelAvatar'
import { ModelIconPicker, type ModelIconDraft } from './ModelIconPicker'
import { Panel } from './Panel'
import {
  formatCostMicros,
  formatTokenCount,
  isModelIconKey,
  resolveModelIconKey,
  type ModelIconKey,
} from '~/lib/model-usage'
import { runAction } from '~/lib/run-action'
import { updateModelOverrideFn } from '~/server/connections.functions'
import type { ConnectionModel } from '~/server/connections.server'

export function AccountModelsTab({ models }: { models: ConnectionModel[] }) {
  const router = useRouter()
  const [editing, setEditing] = useState<string | null>(null)
  const [draftName, setDraftName] = useState('')
  const [draftIcon, setDraftIcon] = useState<ModelIconDraft>('auto')
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<FormResult>(null)

  const closeEditor = () => {
    setEditing(null)
    setResult(null)
  }

  const openEditor = (model: ConnectionModel) => {
    setEditing(model.model)
    setDraftName(model.displayName === model.model ? '' : model.displayName)
    setDraftIcon(
      model.iconKey === null
        ? 'auto'
        : isModelIconKey(model.iconKey)
          ? model.iconKey
          : 'none',
    )
    setResult(null)
  }

  const save = async (
    model: string,
    displayName: string,
    iconKey: ModelIconKey | 'none' | null,
  ) => {
    setBusy(true)
    setResult(null)
    const next = await runAction(
      () => updateModelOverrideFn({ data: { model, displayName, iconKey } }),
      'The model override could not be saved. Try again.',
    )
    setBusy(false)
    setResult(next)
    if (next.ok) {
      setEditing(null)
      await router.invalidate()
    }
  }

  return (
    <Panel title="Models" hint={`${models.length} synced`}>
      <p className="field-note">
        Names and icons here change only your profile. The synced model IDs stay
        unchanged.
      </p>

      {models.length === 0 ? (
        <p className="empty">
          No models are synced yet. Upload an agent-exporter export on
          Connections.
        </p>
      ) : (
        <table className="model-table">
          <thead>
            <tr>
              <th scope="col">Model</th>
              <th scope="col">Tokens</th>
              <th scope="col">Cost</th>
              <th scope="col">Last used</th>
              <th scope="col">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {models.map((model) => {
              const isEditing = editing === model.model

              return (
                <Fragment key={model.model}>
                  <tr>
                    <th scope="row">
                      <span className="model-cell">
                        <ModelAvatar
                          iconKey={resolveModelIconKey(
                            model.model,
                            model.iconKey,
                          )}
                          name={model.displayName}
                        />
                        <span className="model-cell-text">
                          <span className="model-cell-name">
                            {model.displayName}
                          </span>
                          {model.displayName !== model.model ? (
                            <span className="handle">{model.model}</span>
                          ) : null}
                          {model.groupAlias ? (
                            <span className="handle">
                              Group: {model.groupAlias}
                            </span>
                          ) : null}
                        </span>
                      </span>
                    </th>
                    <td data-label="Tokens" className="model-number">
                      {formatTokenCount(model.tokens)}
                    </td>
                    <td data-label="Cost" className="model-number">
                      {formatCostMicros(model.costMicros)}
                    </td>
                    <td data-label="Last used" className="model-number">
                      {model.lastUsed ?? 'Unknown'}
                    </td>
                    <td className="model-actions">
                      {isEditing ? null : (
                        <button
                          type="button"
                          className="button button-quiet"
                          aria-label={`Edit ${model.displayName}`}
                          onClick={() => openEditor(model)}
                        >
                          Edit
                        </button>
                      )}
                    </td>
                  </tr>

                  {isEditing ? (
                    <tr className="model-edit-row">
                      <td colSpan={5}>
                        <form
                          className="stack-form"
                          onSubmit={async (event) => {
                            event.preventDefault()
                            await save(
                              model.model,
                              draftName === model.model ? '' : draftName,
                              draftIcon === 'auto' ? null : draftIcon,
                            )
                          }}
                        >
                          <label className="field">
                            <span>Display name</span>
                            <input
                              value={draftName}
                              onChange={(event) =>
                                setDraftName(event.target.value)
                              }
                              maxLength={80}
                              placeholder={model.model}
                            />
                          </label>

                          <ModelIconPicker
                            name={`icon-${model.model}`}
                            value={draftIcon}
                            onChange={setDraftIcon}
                          />

                          <div className="form-row">
                            <button
                              type="submit"
                              className="button"
                              disabled={busy}
                            >
                              {busy ? 'Saving…' : 'Save model'}
                            </button>
                            {model.iconKey !== null ||
                            model.displayName !== model.model ? (
                              <button
                                type="button"
                                className="button button-quiet"
                                disabled={busy}
                                onClick={() => save(model.model, '', null)}
                              >
                                Clear override
                              </button>
                            ) : null}
                            <button
                              type="button"
                              className="button button-quiet"
                              onClick={closeEditor}
                            >
                              Cancel
                            </button>
                          </div>
                          <FormMessage result={result} />
                        </form>
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              )
            })}
          </tbody>
        </table>
      )}
    </Panel>
  )
}
