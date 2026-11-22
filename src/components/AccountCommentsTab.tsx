import { Link, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { FormMessage, type FormResult } from './FormMessage'
import { Panel } from './Panel'
import { formatDateTime } from '~/lib/format'
import { runAction } from '~/lib/run-action'
import { deleteOwnCommentFn } from '~/server/profiles.functions'

export type AccountComment = {
  id: string
  body: string
  status: string
  createdAt: string
  targetUsername: string
  targetDisplayName: string
}

function CommentRow({ comment }: { comment: AccountComment }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<FormResult>(null)

  return (
    <li className="account-comment">
      <div>
        <p className="comment-meta">
          <span className={`status-label status-${comment.status}`}>
            {comment.status === 'approved' ? 'Approved' : 'Pending review'}
          </span>
          <span className="comment-time">
            {formatDateTime(comment.createdAt)}
          </span>
        </p>
        <p className="comment-text">{comment.body}</p>
        <p className="comment-target">
          On{' '}
          <Link to="/u/$username" params={{ username: comment.targetUsername }}>
            {comment.targetDisplayName}&apos;s profile
          </Link>
        </p>
      </div>
      <button
        type="button"
        className="button button-quiet"
        disabled={busy}
        onClick={async () => {
          setBusy(true)
          setMessage(null)
          const next = await runAction(
            () =>
              deleteOwnCommentFn({
                data: { commentId: comment.id },
              }),
            'The comment could not be deleted. Try again.',
          )
          setBusy(false)
          setMessage(next)
          if (next.ok) await router.invalidate()
        }}
      >
        {busy ? 'Deleting…' : 'Delete comment'}
      </button>
      <FormMessage result={message} />
    </li>
  )
}

export function AccountCommentsTab({ comments }: { comments: AccountComment[] }) {
  return (
    <Panel title="Your comments" hint={String(comments.length)}>
      {comments.length === 0 ? (
        <p className="empty">
          You have not commented yet. Open a profile and add one; it appears
          after review.
        </p>
      ) : (
        <ul className="account-comments">
          {comments.map((comment) => (
            <CommentRow key={comment.id} comment={comment} />
          ))}
        </ul>
      )}
    </Panel>
  )
}
