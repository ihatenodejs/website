import { useEffect, useState } from 'react'
import { useRouter } from '@tanstack/react-router'
import { EmoticonField } from './EmoticonField'
import { FormMessage, type FormResult } from './FormMessage'
import { MoodPicker } from './MoodPicker'
import { SiteDialog } from './SiteDialog'
import { runAction } from '~/lib/run-action'
import { statusCreateSchema } from '~/lib/validation'
import { createStatusFn } from '~/server/profiles.functions'

export function StatusDialog({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const router = useRouter()
  const [body, setBody] = useState('')
  const [mood, setMood] = useState('')
  const [moodEmoticon, setMoodEmoticon] = useState('')
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<FormResult>(null)

  useEffect(() => {
    if (open) setResult(null)
  }, [open])

  return (
    <SiteDialog open={open} onClose={onClose} title="Add a status">
      <form
        className="stack-form"
        onSubmit={async (event) => {
          event.preventDefault()
          const parsed = statusCreateSchema.safeParse({
            body,
            mood,
            moodEmoticon,
          })
          if (!parsed.success) {
            setResult({
              ok: false,
              message:
                parsed.error.issues[0]?.message ??
                'Check the status and try again.',
            })
            return
          }
          setBusy(true)
          setResult(null)
          const next = await runAction(
            () => createStatusFn({ data: parsed.data }),
            'The status could not be posted. Try again.',
          )
          setBusy(false)
          setResult(next)
          if (next.ok) {
            setBody('')
            setMood('')
            setMoodEmoticon('')
            await router.invalidate()
            onClose()
          }
        }}
      >
        <EmoticonField
          id="status-body"
          label="Status"
          value={body}
          onChange={setBody}
          maxLength={500}
          rows={4}
          required
          placeholder="What are you doing right now?"
          note={`${body.length}/500 characters.`}
        />
        <MoodPicker
          emoticon={moodEmoticon}
          label={mood}
          onEmoticonChange={setMoodEmoticon}
          onLabelChange={setMood}
        />
        <p className="field-note">
          Optional. The newest status sets the mood in your profile header.
        </p>
        <div className="button-row">
          <button type="submit" className="button" disabled={busy}>
            {busy ? 'Posting…' : 'Post status'}
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
    </SiteDialog>
  )
}
