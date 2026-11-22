import { useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { FormMessage, type FormResult } from './FormMessage'
import { ModelAvatar } from './ModelAvatar'
import { ModelIconPicker, type ModelIconDraft } from './ModelIconPicker'
import { Panel } from './Panel'
import {
  formatCostMicros,
  formatTokenCount,
  isModelIconKey,
  resolveModelIconKey,
  type ModelGroupSuggestion,
} from '~/lib/model-usage'
import { runAction } from '~/lib/run-action'
import {
  createModelGroupFn,
  deleteModelGroupFn,
  updateModelGroupFn,
} from '~/server/connections.functions'
import type { ConnectionModel, ModelGroup } from '~/server/connections.server'

export function AccountModelGroupsTab({
  groups,
  suggestions,
  models,
}: {
  groups: ModelGroup[]
  suggestions: ModelGroupSuggestion[]
  models: ConnectionModel[]
}) {
  const router = useRouter()
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<{ id: string; alias: string } | null>(
    null,
  )
  const [alias, setAlias] = useState('')
  const [icon, setIcon] = useState<ModelIconDraft>('auto')
  const [selected, setSelected] = useState<string[]>([])
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<FormResult>(null)
  const [confirming, setConfirming] = useState<string | null>(null)

  const open = creating || editing !== null

  const closeForm = () => {
    setCreating(false)
    setEditing(null)
    setResult(null)
  }

  const startCreate = () => {
    setCreating(true)
    setEditing(null)
    setAlias('')
    setIcon('auto')
    setSelected([])
    setResult(null)
  }

  const startEdit = (group: ModelGroup) => {
    setCreating(false)
    setEditing({ id: group.id, alias: group.alias })
    setAlias(group.alias)
    setIcon(
      group.iconKey === null
        ? 'auto'
        : isModelIconKey(group.iconKey)
          ? group.iconKey
          : 'none',
    )
    setSelected(group.models)
    setResult(null)
  }

  const submitEditor = async () => {
    setBusy(true)
    setResult(null)
    const payload = {
      alias,
      iconKey: icon === 'auto' ? null : icon,
      models: selected,
    }
    const next = editing
      ? await runAction(
          () => updateModelGroupFn({ data: { ...payload, id: editing.id } }),
          'The group could not be saved. Try again.',
        )
      : await runAction(
          () => createModelGroupFn({ data: payload }),
          'The group could not be saved. Try again.',
        )
    setBusy(false)
    setResult(next)
    if (next.ok) {
      closeForm()
      await router.invalidate()
    }
  }

  const createSuggested = async (suggestion: ModelGroupSuggestion) => {
    setBusy(true)
    setResult(null)
    const next = await runAction(
      () =>
        createModelGroupFn({
          data: {
            alias: suggestion.alias,
            iconKey: null,
            models: suggestion.models,
          },
        }),
      'The group could not be saved. Try again.',
    )
    setBusy(false)
    setResult(next)
    if (next.ok) await router.invalidate()
  }

  const removeGroup = async (groupId: string) => {
    setBusy(true)
    setResult(null)
    const next = await runAction(
      () => deleteModelGroupFn({ data: { id: groupId } }),
      'The group could not be deleted. Try again.',
    )
    setBusy(false)
    setResult(next)
    setConfirming(null)
    if (next.ok) await router.invalidate()
  }

  const editor = (
    <form
      className="stack-form model-group-editor"
      onSubmit={(event) => {
        event.preventDefault()
        void submitEditor()
      }}
    >
      <label className="field">
        <span>Alias</span>
        <input
          value={alias}
          onChange={(event) => setAlias(event.target.value)}
          maxLength={80}
          required
          placeholder="deepseek-v4.1-flash"
        />
        <span className="field-note">
          Shown on your profile card instead of the individual model ids.
        </span>
      </label>

      <ModelIconPicker name="group-icon" value={icon} onChange={setIcon} />

      <fieldset className="member-picker">
        <legend>
          Models in this group
          {models.length > 0
            ? ` (${selected.length} of ${models.length} selected)`
            : null}
        </legend>
        <div className="member-picker-list">
          {models.length === 0 ? (
            <p className="empty">No models are synced yet.</p>
          ) : (
            models.map((model) => {
              const inThisGroup =
                editing !== null && model.groupAlias === editing.alias
              const disabled = Boolean(model.groupAlias) && !inThisGroup
              return (
                <label
                  className={`member-option${disabled ? ' is-disabled' : ''}`}
                  key={model.model}
                >
                  <input
                    type="checkbox"
                    checked={selected.includes(model.model)}
                    disabled={disabled}
                    onChange={(event) =>
                      setSelected((current) =>
                        event.target.checked
                          ? [...current, model.model]
                          : current.filter((id) => id !== model.model),
                      )
                    }
                  />
                  <span className="member-option-name">{model.model}</span>
                  <span className="member-option-tokens">
                    {formatTokenCount(model.tokens)}
                  </span>
                  {disabled ? (
                    <span className="member-option-note">
                      in {model.groupAlias}
                    </span>
                  ) : null}
                </label>
              )
            })
          )}
        </div>
      </fieldset>

      <div className="form-row">
        <button
          type="submit"
          className="button"
          disabled={busy || selected.length === 0}
        >
          {busy ? 'Saving…' : editing ? 'Save group' : 'Create group'}
        </button>
        <button
          type="button"
          className="button button-quiet"
          onClick={closeForm}
        >
          Cancel
        </button>
      </div>
      {selected.length === 0 ? (
        <p className="field-note">Choose at least one model.</p>
      ) : null}
      <FormMessage result={result} />
    </form>
  )

  return (
    <div className="account-groups">
      <Panel title="Suggested model groups" hint={String(suggestions.length)}>
        <p className="field-note">
          Synced ids that differ only by provider prefix, punctuation, or
          release stamp. Group them to show one model on your profile.
        </p>
        {suggestions.length === 0 ? (
          <p className="empty">
            No repeated models found in your synced usage.
          </p>
        ) : (
          <ul className="model-group-list">
            {suggestions.map((suggestion) => (
              <li className="model-group-row" key={suggestion.key}>
                <div className="model-group-head">
                  <ModelAvatar
                    iconKey={resolveModelIconKey(suggestion.alias, null)}
                    name={suggestion.alias}
                  />
                  <span className="model-group-alias">{suggestion.alias}</span>
                  <span className="model-group-actions">
                    <button
                      type="button"
                      className="button button-quiet"
                      disabled={busy}
                      aria-label={`Create group ${suggestion.alias}`}
                      onClick={() => createSuggested(suggestion)}
                    >
                      Create
                    </button>
                  </span>
                </div>
                <ul className="model-group-members">
                  {suggestion.models.map((model) => (
                    <li key={model} className="model-group-member">
                      {model}
                    </li>
                  ))}
                </ul>
                <p className="model-group-stats">
                  <span>{formatTokenCount(suggestion.tokens)} tokens</span>
                  <span>{formatCostMicros(suggestion.costMicros)}</span>
                </p>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel
        title="Model groups"
        hint={groups.length === 0 ? 'None yet' : String(groups.length)}
      >
        <p className="field-note">
          A group shows one alias on your profile card and adds up the tokens
          and cost of every model in it. Each model belongs to one group.
        </p>

        {open ? null : (
          <button type="button" className="button" onClick={startCreate}>
            New group
          </button>
        )}

        {creating ? editor : null}

        {groups.length === 0 ? (
          <p className="empty">
            No groups yet. Create one above, or start from a suggestion.
          </p>
        ) : (
          <ul className="model-group-list">
            {groups.map((group) => (
              <li className="model-group-row" key={group.id}>
                <div className="model-group-head">
                  <ModelAvatar
                    iconKey={resolveModelIconKey(group.alias, group.iconKey)}
                    name={group.alias}
                  />
                  <span className="model-group-alias">{group.alias}</span>
                  {editing?.id === group.id ||
                  confirming === group.id ? null : (
                    <span className="model-group-actions">
                      <button
                        type="button"
                        className="button button-quiet"
                        aria-label={`Edit ${group.alias}`}
                        onClick={() => startEdit(group)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="button button-quiet"
                        aria-label={`Delete ${group.alias}`}
                        onClick={() => setConfirming(group.id)}
                      >
                        Delete
                      </button>
                    </span>
                  )}
                </div>

                {editing?.id === group.id ? (
                  editor
                ) : (
                  <>
                    <ul className="model-group-members">
                      {group.models.map((model) => (
                        <li key={model} className="model-group-member">
                          {model}
                        </li>
                      ))}
                    </ul>
                    <p className="model-group-stats">
                      <span>{formatTokenCount(group.tokens)} tokens</span>
                      <span>{formatCostMicros(group.costMicros)}</span>
                      {group.lastUsed ? (
                        <span>Last {group.lastUsed}</span>
                      ) : null}
                    </p>
                    {confirming === group.id ? (
                      <div className="form-row">
                        <button
                          type="button"
                          className="button button-danger"
                          disabled={busy}
                          onClick={() => removeGroup(group.id)}
                        >
                          Delete {group.alias}
                        </button>
                        <button
                          type="button"
                          className="button button-quiet"
                          onClick={() => setConfirming(null)}
                        >
                          Keep it
                        </button>
                      </div>
                    ) : null}
                  </>
                )}
              </li>
            ))}
          </ul>
        )}

        {open ? null : <FormMessage result={result} />}
      </Panel>
    </div>
  )
}
