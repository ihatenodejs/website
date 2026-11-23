import { Await, Link } from '@tanstack/react-router'
import { Component, Suspense, useState, type ReactNode } from 'react'
import { Avatar } from './Avatar'
import { CommentDialog } from './CommentDialog'
import { ContactIcon } from './ContactIcon'
import { EmoticonText } from './EmoticonText'
import { ModelRanking } from './ModelRanking'
import { Panel } from './Panel'
import { StatusDialog } from './StatusDialog'
import { contactDisplays, type ContactDisplay } from '~/lib/contacts'
import { EMOTICON_BY_SHORTCUT } from '~/lib/emoticons'
import { formatDate, formatDateTime, formatRelativeTime } from '~/lib/format'
import { isTheme } from '~/lib/theme'
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

function displayLink(value: string) {
  try {
    const url = new URL(value)
    return `${url.host}${url.pathname === '/' ? '' : url.pathname}`
  } catch {
    return value
  }
}

function ProfileUrl({ profile }: { profile: PublicProfile }) {
  return (
    <Link
      to="/u/$username"
      params={{ username: profile.username }}
      className="masthead-url-link"
    >
      {displayLink(profile.profileUrl)}
    </Link>
  )
}

function MoodLine({
  mood,
  moodEmoticon,
}: {
  mood: string
  moodEmoticon: string
}) {
  if (!mood && !moodEmoticon) return null
  if (!moodEmoticon) return <EmoticonText text={mood} />
  const emoticon = EMOTICON_BY_SHORTCUT.get(moodEmoticon.toLowerCase())
  return (
    <>
      {emoticon ? (
        <img
          className="emoticon"
          src={emoticon.src}
          alt=""
          title={emoticon.name}
          width={19}
          height={19}
        />
      ) : null}
      {mood ? <> {mood}</> : null}
    </>
  )
}

function StatusCard({
  profile,
  canAdd,
  onAdd,
}: {
  profile: PublicProfile
  canAdd: boolean
  onAdd: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  const statuses = expanded ? profile.statuses : profile.statuses.slice(0, 5)

  return (
    <div id="status-and-mood">
      <Panel
        title={`${profile.displayName}'s Status and Mood`}
        hint={
          canAdd ? (
            <button type="button" className="panel-link" onClick={onAdd}>
              add status
            </button>
          ) : null
        }
      >
        {profile.statuses.length === 0 ? (
          <p className="empty">No status posts yet.</p>
        ) : (
          <>
            <ul className="status-list">
              {statuses.map((status) => (
                <li key={status.id} className="status-post">
                  <p className="status-text">
                    <span className="status-author">{profile.displayName}</span>{' '}
                    <EmoticonText text={status.body} />
                  </p>
                  {status.mood || status.moodEmoticon ? (
                    <p className="status-mood">
                      Mood:{' '}
                      <MoodLine
                        mood={status.mood}
                        moodEmoticon={status.moodEmoticon}
                      />
                    </p>
                  ) : null}
                  <p className="status-time">
                    <time
                      dateTime={status.createdAt}
                      title={formatDateTime(status.createdAt)}
                      suppressHydrationWarning
                    >
                      Posted {formatRelativeTime(status.createdAt)}
                    </time>
                  </p>
                </li>
              ))}
            </ul>
            {profile.statuses.length > 5 ? (
              <div className="status-more">
                <button
                  type="button"
                  className="panel-link"
                  onClick={() => setExpanded((open) => !open)}
                >
                  {expanded ? 'Show fewer' : 'View More'}
                </button>
              </div>
            ) : null}
          </>
        )}
      </Panel>
    </div>
  )
}

function SchoolsCard({ profile }: { profile: PublicProfile }) {
  if (profile.schools.length === 0) return null

  return (
    <Panel title="Schools">
      <ul className="school-list">
        {profile.schools.map((school) => {
          const years =
            school.startYear && school.endYear
              ? `${school.startYear} to ${school.endYear}`
              : school.startYear
                ? `${school.startYear}`
                : school.endYear
                  ? `${school.endYear}`
                  : ''
          return (
            <li key={school.id} className="school">
              <div className="school-head">
                <span className="school-name">{school.name}</span>
                {years ? <span className="school-years">{years}</span> : null}
              </div>
              {school.location ? (
                <p className="school-location">{school.location}</p>
              ) : null}
              {school.graduatedYear ? (
                <p>
                  <span className="school-label">Graduated:</span>{' '}
                  {school.graduatedYear}
                </p>
              ) : null}
              {school.studentStatus ? (
                <p>
                  <span className="school-label">Student status:</span>{' '}
                  {school.studentStatus}
                </p>
              ) : null}
              {school.major ? (
                <p>
                  <span className="school-label">Major:</span> {school.major}
                </p>
              ) : null}
              {school.clubs ? (
                <p>
                  <span className="school-label">Clubs:</span> {school.clubs}
                </p>
              ) : null}
            </li>
          )
        })}
      </ul>
    </Panel>
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
  const [commentOpen, setCommentOpen] = useState(false)
  const [statusOpen, setStatusOpen] = useState(false)
  const [actionNote, setActionNote] = useState('')
  const latest = profile.statuses[0] ?? null
  const isOwner = viewer?.id === profile.userId

  const detailRows = [
    ['Status', profile.details.detailStatus],
    ['Here for', profile.details.hereFor],
    ['Hometown', profile.details.hometown],
    ['Ethnicity', profile.details.ethnicity],
    ['Zodiac sign', profile.details.zodiac],
    ['Smoke', profile.details.smoke],
    ['Drink', profile.details.drink],
    ['Education', profile.details.education],
    ['Occupation', profile.details.occupation],
  ].filter((entry): entry is [string, string] => entry[1] !== '')

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
          <div className="masthead-portrait">
            <Avatar
              src={profile.avatarUrl}
              name={profile.displayName}
              size="hero"
            />
          </div>

          <div className="masthead-main">
            <h1>{profile.displayName}</h1>
            <p className="profile-handle">@{profile.username}</p>
            {profile.tagline ? (
              <p className="profile-tagline">{profile.tagline}</p>
            ) : null}

            {profile.profileLink || latest ? (
              <p className="masthead-status">
                {profile.profileLink ? (
                  <a
                    className="masthead-profile-link"
                    href={profile.profileLink}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {displayLink(profile.profileLink)}
                  </a>
                ) : null}
                {latest ? (
                  <span className="masthead-status-text">
                    <EmoticonText text={latest.body} />
                  </span>
                ) : null}
              </p>
            ) : null}

            {latest?.mood || latest?.moodEmoticon ? (
              <p className="masthead-mood">
                Mood:{' '}
                <MoodLine
                  mood={latest?.mood ?? ''}
                  moodEmoticon={latest?.moodEmoticon ?? ''}
                />
              </p>
            ) : null}

            {latest ? (
              <p className="masthead-posted">
                <time
                  dateTime={latest.createdAt}
                  title={formatDateTime(latest.createdAt)}
                  suppressHydrationWarning
                >
                  Posted {formatRelativeTime(latest.createdAt)}
                </time>
              </p>
            ) : null}

            <p className="masthead-viewmy">
              View My: <a href="#">Music</a>
            </p>
          </div>

          <div className="masthead-actions">
            <p className="masthead-url">
              <img
                src="/myspace/url.png"
                alt=""
                width={28}
                height={11}
                className="masthead-url-icon"
              />
              <ProfileUrl profile={profile} />
            </p>
            <button
              type="button"
              className="masthead-action"
              onClick={() =>
                setActionNote('Send Message is not available on p0ntus yet.')
              }
            >
              <img src="/myspace/message.png" alt="" width={28} height={13} />
              <span>Send Message</span>
            </button>
            <button
              type="button"
              className="masthead-action"
              onClick={() =>
                setActionNote('Add to Friends is not available on p0ntus yet.')
              }
            >
              <img src="/myspace/friend.png" alt="" width={28} height={16} />
              <span>Add to Friends</span>
            </button>
            <button
              type="button"
              className="masthead-action"
              onClick={() => {
                setActionNote('')
                setCommentOpen(true)
              }}
            >
              <img src="/myspace/comment.png" alt="" width={28} height={13} />
              <span>Add Comment</span>
            </button>
            {actionNote ? (
              <p className="masthead-action-note" role="status">
                {actionNote}
              </p>
            ) : null}
          </div>
        </section>

        <div className="profile-grid">
          <aside className="profile-left">
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

            <Panel title="Details">
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
                  {detailRows.map(([label, value]) => (
                    <tr key={label}>
                      <th scope="row">{label}</th>
                      <td>{value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Panel>

            <SchoolsCard profile={profile} />
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
            <StatusCard
              profile={profile}
              canAdd={isOwner}
              onAdd={() => setStatusOpen(true)}
            />

            <Panel title="Comments" hint={`Approved only · page ${page}`}>
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
                                  <p className="comment-text">
                                    <EmoticonText text={comment.body} />
                                  </p>
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

      <CommentDialog
        open={commentOpen}
        onClose={() => setCommentOpen(false)}
        targetUserId={profile.userId}
        viewer={viewer}
      />
      {isOwner ? (
        <StatusDialog open={statusOpen} onClose={() => setStatusOpen(false)} />
      ) : null}
    </div>
  )
}
