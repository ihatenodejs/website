import { Await, Link } from '@tanstack/react-router'
import { Component, Suspense, useState, type ReactNode } from 'react'
import { Avatar } from './Avatar'
import { ContactIcon } from './ContactIcon'
import { FormMessage, type FormResult } from './FormMessage'
import { ModelRanking } from './ModelRanking'
import { Panel } from './Panel'
import { contactDisplays, type ContactDisplay } from '~/lib/contacts'
import { formatDate, formatDateTime } from '~/lib/format'
import { runAction } from '~/lib/run-action'
import { isTheme } from '~/lib/theme'
import { postCommentFn } from '~/server/profiles.functions'
import type {
  ApprovedCommentsResult,
  PublicProfile,
} from '~/server/profiles.functions'

export type Viewer = {
  id: string
  isAdmin: boolean
} | null

class CommentBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  render() {
    if (this.state.failed) {
      return (
        <p className="form-error" role="alert">
          Comments could not be displayed. Reload the page to try again.
        </p>
      )
    }
    return this.props.children
  }
}

function CommentComposer({
  targetUserId,
  viewer,
}: {
  targetUserId: string
  viewer: Viewer
}) {
  const [body, setBody] = useState('')
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<FormResult>(null)

  if (!viewer) {
    return (
      <p className="comment-signin">
        <Link to="/login">Log in</Link> to leave a comment. New comments appear
        after an administrator reviews them.
      </p>
    )
  }

  return (
    <form
      className="comment-form"
      onSubmit={async (event) => {
        event.preventDefault()
        setBusy(true)
        setResult(null)
        const next = await runAction(
          () =>
            postCommentFn({
              data: { targetUserId, body },
            }),
          'The comment could not be submitted. Try again.',
        )
        setBusy(false)
        setResult(next)
        if (next.ok) setBody('')
      }}
    >
      <label className="field">
        <span>Add a comment</span>
        <textarea
          value={body}
          onChange={(event) => setBody(event.target.value)}
          maxLength={500}
          rows={3}
          required
          placeholder="Plain text, up to 500 characters"
        />
      </label>
      <div className="form-row">
        <button type="submit" className="button" disabled={busy}>
          {busy ? 'Sending…' : 'Submit for review'}
        </button>
        <span className="field-note">{body.length}/500</span>
      </div>
      <FormMessage result={result} />
    </form>
  )
}

function ContactCard({ contact }: { contact: ContactDisplay }) {
  const at = contact.id === 'email' ? contact.value.lastIndexOf('@') : -1
  const content = (
    <>
      <ContactIcon id={contact.id} />
      <span className="contact-text">
        <span className="contact-label">{contact.label}</span>
        <span className="contact-value">
          {at > 0 ? (
            <>
              {contact.value.slice(0, at)}
              <wbr />@{contact.value.slice(at + 1)}
            </>
          ) : (
            contact.value
          )}
        </span>
      </span>
    </>
  )

  if (!contact.href) {
    return <div className="contact-item contact-item-static">{content}</div>
  }

  const external = contact.href.startsWith('http')
  return (
    <a
      className="contact-item"
      href={contact.href}
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener noreferrer' : undefined}
    >
      {content}
    </a>
  )
}

export function ProfilePage({
  profile,
  commentsPromise,
  page,
  pageInvalid,
  viewer,
}: {
  profile: PublicProfile
  commentsPromise: Promise<ApprovedCommentsResult>
  page: number
  pageInvalid: boolean
  viewer: Viewer
}) {
  const theme = isTheme(profile.theme) ? profile.theme : 'night'
  const contacts = contactDisplays(profile.contacts)
  const bioParagraphs = profile.bio
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)

  const commentPageLink = (targetPage: number, label: string) =>
    profile.isHome ? (
      <Link to="/" search={{ page: targetPage, pageInvalid: false }}>
        {label}
      </Link>
    ) : (
      <Link
        to="/u/$username"
        params={{ username: profile.username }}
        search={{ page: targetPage, pageInvalid: false }}
      >
        {label}
      </Link>
    )

  return (
    <div className="profile-field" data-profile-theme={theme}>
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <div className="canvas">
          <Link to="/">p0ntus</Link>
          <span aria-hidden="true"> » </span>
          <Link to="/members">Members</Link>
          <span aria-hidden="true"> » </span>
          <span aria-current="page">{profile.displayName}</span>
        </div>
      </nav>

      <div className="canvas">
        <section className="profile-masthead">
          <div>
            <h1>{profile.displayName}</h1>
            <p className="profile-handle">@{profile.username}</p>
            {profile.tagline ? (
              <p className="profile-tagline">{profile.tagline}</p>
            ) : null}
            <p className="profile-meta">
              Member since {formatDate(profile.createdAt)}
            </p>
          </div>
        </section>

        <div className="profile-grid">
          <aside className="profile-left">
            <Panel title={`${profile.displayName}'s portrait`}>
              <div className="portrait-well">
                <Avatar
                  src={profile.avatarUrl}
                  name={profile.displayName}
                  size="hero"
                />
              </div>
              <p className="portrait-name">@{profile.username}</p>
            </Panel>

            {contacts.length > 0 ? (
              <Panel
                title={`Contacting ${profile.displayName}`}
                hint="External routes"
              >
                <div className="contact-grid">
                  {contacts.map((contact) => (
                    <ContactCard key={contact.id} contact={contact} />
                  ))}
                </div>
              </Panel>
            ) : null}

            <Panel title="Profile details">
              <table className="facts">
                <tbody>
                  <tr>
                    <th scope="row">Username</th>
                    <td>@{profile.username}</td>
                  </tr>
                  <tr>
                    <th scope="row">Member since</th>
                    <td>{formatDate(profile.createdAt)}</td>
                  </tr>
                  <tr>
                    <th scope="row">Profile URL</th>
                    <td>
                      <Link
                        to="/u/$username"
                        params={{ username: profile.username }}
                      >
                        /u/{profile.username}
                      </Link>
                    </td>
                  </tr>
                </tbody>
              </table>
            </Panel>
          </aside>

          <div className="profile-about">
            <Panel
              title="About me"
              hint={
                viewer?.id === profile.userId ? (
                  <Link to="/account" search={{ tab: 'profile' }}>
                    Edit
                  </Link>
                ) : null
              }
            >
              {bioParagraphs.length > 0 ? (
                <div className="blurb">
                  {bioParagraphs.map((paragraph, index) => (
                    <p key={index}>{paragraph}</p>
                  ))}
                </div>
              ) : (
                <p className="empty">
                  This profile has no bio yet.
                  {viewer?.id === profile.userId ? (
                    <>
                      {' '}
                      <Link to="/account" search={{ tab: 'profile' }}>
                        Add one from your account.
                      </Link>
                    </>
                  ) : null}
                </p>
              )}
            </Panel>

            <ModelRanking models={profile.modelRanking} />
          </div>

          <div className="profile-comments">
            <Panel title="Comments" hint={`Approved only · page ${page}`}>
              <CommentComposer targetUserId={profile.userId} viewer={viewer} />

              {pageInvalid ? (
                <p className="notice" role="status">
                  The page number was invalid. Showing page 1.
                </p>
              ) : null}

              <CommentBoundary>
                <Suspense
                  fallback={
                    <p className="loading" role="status">
                      Loading approved comments…
                    </p>
                  }
                >
                  <Await
                    promise={commentsPromise}
                    fallback={
                      <p className="loading" role="status">
                        Loading approved comments…
                      </p>
                    }
                  >
                    {(result) => {
                      if (!result.ok) {
                        return (
                          <p className="form-error" role="alert">
                            {result.message}
                          </p>
                        )
                      }
                      if (result.comments.length === 0) {
                        return (
                          <div className="empty-state">
                            <p>
                              No approved comments
                              {result.total > 0 ? ' on this page' : ' yet'}.
                            </p>
                            {result.total > 0
                              ? commentPageLink(1, 'Go to the first page')
                              : null}
                          </div>
                        )
                      }
                      return (
                        <>
                          <ul className="comment-list">
                            {result.comments.map((comment) => (
                              <li key={comment.id} className="comment">
                                <Avatar
                                  src={null}
                                  name={comment.authorName}
                                  size="small"
                                />
                                <div className="comment-body">
                                  <p className="comment-meta">
                                    {comment.authorUsername ? (
                                      <Link
                                        to="/u/$username"
                                        params={{
                                          username: comment.authorUsername,
                                        }}
                                        className="comment-author"
                                      >
                                        {comment.authorName}
                                      </Link>
                                    ) : (
                                      <span className="comment-author">
                                        {comment.authorName}
                                      </span>
                                    )}
                                    <span className="comment-time">
                                      {formatDateTime(comment.createdAt)}
                                    </span>
                                  </p>
                                  <p className="comment-text">{comment.body}</p>
                                </div>
                              </li>
                            ))}
                          </ul>
                          {result.pageCount > 1 ? (
                            <nav
                              className="pagination"
                              aria-label="Comment pages"
                            >
                              {result.page > 1
                                ? commentPageLink(
                                    result.page - 1,
                                    'Previous comments',
                                  )
                                : null}
                              <span>
                                Page {result.page} of {result.pageCount}
                              </span>
                              {result.page < result.pageCount
                                ? commentPageLink(
                                    result.page + 1,
                                    'Next comments',
                                  )
                                : null}
                            </nav>
                          ) : null}
                        </>
                      )
                    }}
                  </Await>
                </Suspense>
              </CommentBoundary>
            </Panel>
          </div>
        </div>
      </div>
    </div>
  )
}
