import { useRouter } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { FormMessage, type FormResult } from './FormMessage'
import { Panel } from './Panel'
import { formatDateTime } from '~/lib/format'
import { formatCostMicros, formatTokenCount } from '~/lib/model-usage'
import { runAction } from '~/lib/run-action'
import { AGENT_EXPORT_MAX_BYTES } from '~/lib/validation'
import {
  getAgentSyncRunFn,
  updateShowModelsFn,
} from '~/server/connections.functions'
import type {
  AgentSyncRun,
  ConnectionSummary,
} from '~/server/connections.server'

const POLL_INTERVAL_MS = 1500

function RunSummary({ run }: { run: AgentSyncRun }) {
  return (
    <>
      <p className="form-ok" role="status">
        Merged {run.insertedCount} new, {run.updatedCount} updated, and{' '}
        {run.unchangedCount} unchanged rows.
      </p>
      <table className="facts">
        <tbody>
          <tr>
            <th scope="row">Providers</th>
            <td>{run.providerCount}</td>
          </tr>
          <tr>
            <th scope="row">Days</th>
            <td>{run.dayCount}</td>
          </tr>
          <tr>
            <th scope="row">Models</th>
            <td>{run.modelCount}</td>
          </tr>
          <tr>
            <th scope="row">Tokens</th>
            <td>{formatTokenCount(run.totalTokens)}</td>
          </tr>
          <tr>
            <th scope="row">Cost</th>
            <td>{formatCostMicros(run.totalCostMicros)}</td>
          </tr>
          {run.earliestDate && run.latestDate ? (
            <tr>
              <th scope="row">Date range</th>
              <td>
                {run.earliestDate} to {run.latestDate}
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </>
  )
}

export function AccountConnectionsTab({
  connections,
}: {
  connections: ConnectionSummary
}) {
  const router = useRouter()
  const [run, setRun] = useState<AgentSyncRun | null>(null)
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState<FormResult>(null)
  const [showModels, setShowModels] = useState(connections.showModels)
  const [showModelsBusy, setShowModelsBusy] = useState(false)
  const [showModelsResult, setShowModelsResult] = useState<FormResult>(null)

  const activeRun = run ?? connections.latestRun
  const pending =
    activeRun?.status === 'queued' || activeRun?.status === 'running'
  const activeRunId = activeRun?.id

  useEffect(() => {
    if (!activeRunId || !pending) return
    let stopped = false
    const timer = setInterval(async () => {
      const next = await getAgentSyncRunFn({ data: { runId: activeRunId } })
      if (stopped) return
      if (!next.ok) {
        setResult({ ok: false, message: next.message })
        clearInterval(timer)
        return
      }
      setRun(next.run)
      if (next.run.status === 'complete') {
        clearInterval(timer)
        await router.invalidate()
      } else if (next.run.status === 'failed') {
        clearInterval(timer)
        await router.invalidate()
      }
    }, POLL_INTERVAL_MS)
    return () => {
      stopped = true
      clearInterval(timer)
    }
  }, [activeRunId, pending, router])

  return (
    <div className="account-connections">
      <Panel title="agent-exporter" hint="AI usage">
        <p>
          agent-exporter keeps a local usage database. Sync it, then export the
          JSON this site reads.
        </p>
        <ol className="connection-steps">
          <li>
            Enable each harness you use. For example,{' '}
            <code>agent-exporter harness opencode enable</code>. The names are
            opencode, oh-my-pi, antigravity, ccusage, codex, and qwen.
          </li>
          <li>
            Run <code>agent-exporter sync</code>.
          </li>
          <li>
            Export the database: <code>agent-exporter json --output agent-usage.json</code>
            .
          </li>
          <li>
            Upload <code>agent-usage.json</code> below.
          </li>
        </ol>
        <p className="field-note">
          Keep this page open until the upload finishes. After the server
          accepts the file, merging continues if you leave. Upload again after
          future syncs: rows for the same provider, date, and model are
          replaced, not added twice.
        </p>

        <form
          className="stack-form"
          onSubmit={async (event) => {
            event.preventDefault()
            const form = new FormData(event.currentTarget)
            const file = form.get('file')
            if (!(file instanceof File) || file.size === 0) {
              setResult({
                ok: false,
                message: 'Choose an agent-exporter JSON file first.',
              })
              return
            }
            if (file.size > AGENT_EXPORT_MAX_BYTES) {
              setResult({ ok: false, message: 'The file is larger than 10 MiB.' })
              return
            }
            setUploading(true)
            setResult(null)
            const response = await fetch('/api/agent-export', {
              method: 'POST',
              body: form,
            })
            const payload = (await response.json().catch(() => null)) as {
              ok?: boolean
              message?: string
              run?: AgentSyncRun
            } | null
            setUploading(false)
            if (response.ok && payload?.ok && payload.run) {
              setRun(payload.run)
              return
            }
            setResult({
              ok: false,
              message: payload?.message ?? 'The export could not be uploaded.',
            })
          }}
        >
          <label className="field">
            <span>Export file</span>
            <input
              name="file"
              type="file"
              accept="application/json,.json"
              required
            />
          </label>
          <button type="submit" className="button" disabled={uploading}>
            {uploading ? 'Uploading…' : 'Upload usage'}
          </button>
          <FormMessage result={result} />
        </form>

        {activeRun ? (
          <div className="connection-status">
            {pending ? (
              <p className="loading" role="status">
                Merging the upload. You can leave this page; the merge
                continues on the server.
              </p>
            ) : null}
            {activeRun.status === 'failed' ? (
              <p className="form-error" role="alert">
                {activeRun.errorMessage ?? 'The merge failed.'}
              </p>
            ) : null}
            {activeRun.status === 'complete' ? (
              <RunSummary run={activeRun} />
            ) : null}
          </div>
        ) : null}
      </Panel>

      <Panel title="Synced usage">
        {connections.connected ? (
          <table className="facts">
            <tbody>
              <tr>
                <th scope="row">Models</th>
                <td>{connections.modelCount}</td>
              </tr>
              <tr>
                <th scope="row">Providers</th>
                <td>{connections.providerCount}</td>
              </tr>
              <tr>
                <th scope="row">Days</th>
                <td>{connections.dayCount}</td>
              </tr>
              <tr>
                <th scope="row">Total tokens</th>
                <td>{formatTokenCount(connections.totalTokens)}</td>
              </tr>
              <tr>
                <th scope="row">Total cost</th>
                <td>{formatCostMicros(connections.totalCostMicros)}</td>
              </tr>
              <tr>
                <th scope="row">Last sync</th>
                <td>
                  {connections.lastSyncedAt
                    ? formatDateTime(connections.lastSyncedAt)
                    : 'Not recorded'}
                </td>
              </tr>
            </tbody>
          </table>
        ) : (
          <p className="empty">No usage has been uploaded yet.</p>
        )}
      </Panel>

      {connections.connected ? (
        <Panel title="Profile display">
          <form
            className="stack-form"
            onSubmit={async (event) => {
              event.preventDefault()
              setShowModelsBusy(true)
              setShowModelsResult(null)
              const next = await runAction(
                () => updateShowModelsFn({ data: { showModels } }),
                'The connection setting could not be saved. Try again.',
              )
              setShowModelsBusy(false)
              setShowModelsResult(next)
              if (next.ok) {
                setShowModels(next.showModels)
                await router.invalidate()
              }
            }}
          >
            <label className="checkbox-field">
              <input
                type="checkbox"
                checked={showModels}
                onChange={(event) => setShowModels(event.target.checked)}
              />
              <span>Show my top models on my profile</span>
            </label>
            <p className="field-note">
              Adds a card with your five most-used models. Off by default.
            </p>
            <button type="submit" className="button" disabled={showModelsBusy}>
              {showModelsBusy ? 'Saving…' : 'Save connection settings'}
            </button>
            <FormMessage result={showModelsResult} />
          </form>
        </Panel>
      ) : null}
    </div>
  )
}
