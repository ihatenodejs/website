import { useEffect, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { EmoticonField } from './EmoticonField'
import { FormMessage, type FormResult } from './FormMessage'
import { SiteDialog } from './SiteDialog'
import { runAction } from '~/lib/run-action'
import { commentCreateSchema } from '~/lib/validation'
import { postCommentFn } from '~/server/profiles.functions'

export function CommentDialog({
  open,
  onClose,
  targetUserId,
  viewer,
}: {
  open: boolean
  onClose: () => void
  targetUserId: string
  viewer: { id: string } | null
}) {
  const [body, setBody] = useState('')
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<FormResult>(null)

  useEffect(() => {
    if (open) setResult(null)
  }, [open])

  return (
    <SiteDialog open={open} onClose={onClose} title="Add a comment">
      {viewer ? (
        <form
          className="stack-form"
          onSubmit={async (event) => {
            event.preventDefault()
            const parsed = commentCreateSchema.safeParse({
              targetUserId,
              body,
            })
            if (!parsed.success) {
              setResult({
                ok: false,
                message:
                  parsed.error.issues[0]?.message ??
                  'Check the comment and try again.',
              })
              return
            }
            setBusy(true)
            setResult(null)
            const next = await runAction(
              () => postCommentFn({ data: parsed.data }),
              'The comment could not be submitted. Try again.',
            )
            setBusy(false)
            setResult(next)
            if (next.ok) setBody('')
          }}
        >
          <EmoticonField
            id="comment-body"
            label="Comment"
            value={body}
            onChange={setBody}
            maxLength={500}
            rows={4}
            required
            placeholder="Plain text, up to 500 characters"
            note={`${body.length}/500 characters. Comments appear after an administrator reviews them.`}
          />
          <div className="button-row">
            <button type="submit" className="button" disabled={busy}>
              {busy ? 'Sending…' : 'Submit for review'}
            </button>
            <button
              type="button"
              className="button-quiet"
              onClick={onClose}
              disabled={busy}
            >
              Cancel
            </button>
          </div>
          <FormMessage result={result} />
        </form>
      ) : (
        <p>
          <Link to="/login">Log in</Link> to leave a comment. New comments
          appear after an administrator reviews them.
        </p>
      )}
    </SiteDialog>
  )
}
