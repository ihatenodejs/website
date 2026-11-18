import { useState } from 'react'
import { runAction } from '~/lib/run-action'
import { FormMessage, type FormResult } from './FormMessage'

export function ConfirmDelete({
  username,
  actionLabel,
  description,
  onDelete,
  onDone,
}: {
  username: string
  actionLabel: string
  description: string
  onDelete: (confirmation: string) => Promise<{ ok: boolean; message?: string }>
  onDone: () => void
}) {
  const [open, setOpen] = useState(false)
  const [confirmation, setConfirmation] = useState('')
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<FormResult>(null)

  if (!open) {
    return (
      <button
        type="button"
        className="button button-quiet"
        onClick={() => setOpen(true)}
      >
        {actionLabel}
      </button>
    )
  }

  return (
    <div
      className="confirm-box"
      onKeyDown={(event) => {
        if (event.key === 'Escape') setOpen(false)
      }}
    >
      <p>{description}</p>
      <label className="field">
        <span>
          Type <strong>{username}</strong> to confirm
        </span>
        <input
          value={confirmation}
          onChange={(event) => setConfirmation(event.target.value)}
          autoComplete="off"
          spellCheck={false}
        />
      </label>
      <div className="button-row">
        <button
          type="button"
          className="button button-danger"
          disabled={busy || confirmation !== username}
          onClick={async () => {
            setBusy(true)
            setResult(null)
            const next = await runAction(
              () => onDelete(confirmation),
              'The account or comment could not be deleted. Try again.',
            )
            setBusy(false)
            setResult(next)
            if (next?.ok) {
              setOpen(false)
              setConfirmation('')
              onDone()
            }
          }}
        >
          {busy ? 'Deleting…' : 'Delete permanently'}
        </button>
        <button
          type="button"
          className="button button-quiet"
          onClick={() => {
            setOpen(false)
            setConfirmation('')
            setResult(null)
          }}
        >
          Cancel
        </button>
      </div>
      <FormMessage result={result} />
    </div>
  )
}
