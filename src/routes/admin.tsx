import {
  Link,
  createFileRoute,
  redirect,
  useRouter,
} from '@tanstack/react-router'
import { useState } from 'react'
import { ConfirmDelete } from '~/components/ConfirmDelete'
import { FormMessage, type FormResult } from '~/components/FormMessage'
import { Panel } from '~/components/Panel'
import { formatDateTime } from '~/lib/format'
import { runAction } from '~/lib/run-action'
import { THEMES, THEME_LABELS, isTheme, type Theme } from '~/lib/theme'
import { parsePage, parseSearchQuery, parseStatus } from '~/lib/validation'
import {
  adminDeleteUserFn,
  getAdminDataFn,
  moderateCommentFn,
  setRoleFn,
} from '~/server/admin.functions'
import { updateSiteThemeFn } from '~/server/settings.functions'

type AdminTab = 'comments' | 'members' | 'settings'

export const Route = createFileRoute('/admin')({
  ssr: true,
  beforeLoad: ({ context }) => {
    if (!context.session?.isAdmin) throw redirect({ to: '/login' })
  },
  validateSearch: (
    search: Record<string, unknown>,
  ): {
    status?: 'pending' | 'approved'
    tab?: AdminTab
    page?: number
    pageInvalid?: boolean
    q?: string
    qInvalid?: boolean
    usersPage?: number
    usersPageInvalid?: boolean
  } => {
    const page = parsePage(search.page)
    const q = parseSearchQuery(search.q)
    const usersPage = parsePage(search.usersPage)
    const status = parseStatus(search.status)
    const tab: AdminTab =
      search.tab === 'members' || search.tab === 'settings'
        ? search.tab
        : 'comments'
    const result: {
      status?: 'pending' | 'approved'
      tab?: AdminTab
      page?: number
      pageInvalid?: boolean
      q?: string
      qInvalid?: boolean
      usersPage?: number
      usersPageInvalid?: boolean
    } = {}
    if (tab !== 'comments' || search.tab !== undefined) {
      result.tab = tab
    }
    if (status !== 'pending' || search.status !== undefined) {
      result.status = status
    }
    if (page.invalid) {
      result.page = 1
      result.pageInvalid = true
    } else if (page.value !== 1 || search.page !== undefined) {
      result.page = page.value
    }
    if (q.value !== '') result.q = q.value
    else if (search.q !== undefined) result.q = ''
    if (q.invalid) result.qInvalid = true
    if (usersPage.invalid) {
      result.usersPage = 1
      result.usersPageInvalid = true
    } else if (usersPage.value !== 1 || search.usersPage !== undefined) {
      result.usersPage = usersPage.value
    }
    return result
  },
  loaderDeps: ({ search }) => ({
    status: search.status ?? 'pending',
    page: search.page ?? 1,
    q: search.q ?? '',
    usersPage: search.usersPage ?? 1,
    pageInvalid: search.pageInvalid ?? false,
    qInvalid: search.qInvalid ?? false,
    usersPageInvalid: search.usersPageInvalid ?? false,
  }),
  loader: async ({ deps }) => {
    const data = await getAdminDataFn({
      data: {
        status: deps.status,
        page: deps.page,
        q: deps.q,
        usersPage: deps.usersPage,
      },
    })
    if (!data.authorized) throw redirect({ to: '/login' })
    return {
      ...data,
      pageInvalid: deps.pageInvalid,
      qInvalid: deps.qInvalid,
      usersPageInvalid: deps.usersPageInvalid,
    }
  },
  head: () => ({
    meta: [{ title: 'Administration | p0ntus' }],
  }),
  component: AdminRoute,
})

type ModerationAction = 'approve' | 'reject' | 'remove'

function CommentControls({
  commentId,
  status,
}: {
  commentId: string
  status: 'pending' | 'approved'
}) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<FormResult>(null)

  const run = async (action: ModerationAction) => {
    setBusy(true)
    setResult(null)
    const next = await runAction(
      () => moderateCommentFn({ data: { commentId, action } }),
      'The moderation action failed. Try again.',
    )
    setBusy(false)
    setResult(next)
    if (next.ok) await router.invalidate()
  }

  return (
    <div className="moderation-actions">
      {status === 'pending' ? (
        <>
          <button
            type="button"
            className="button"
            disabled={busy}
            onClick={() => run('approve')}
          >
            {busy ? 'Working…' : 'Approve'}
          </button>
          <button
            type="button"
            className="button button-danger"
            disabled={busy}
            onClick={() => run('reject')}
          >
            Reject
          </button>
        </>
      ) : (
        <button
          type="button"
          className="button button-danger"
          disabled={busy}
          onClick={() => run('remove')}
        >
          {busy ? 'Removing…' : 'Remove'}
        </button>
      )}
      <FormMessage result={result} />
    </div>
  )
}

function UserRow({
  member,
}: {
  member: {
    id: string
    role: string | null
    username: string
    displayName: string
    createdAt: string
    isHome: boolean
    isAdmin: boolean
  }
}) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<FormResult>(null)

  const nextRole = member.isAdmin ? 'user' : 'admin'

  return (
    <li className="admin-user">
      <div className="admin-user-head">
        <Link to="/u/$username" params={{ username: member.username }}>
          {member.displayName}
        </Link>{' '}
        <span className="handle">@{member.username}</span>
        {member.isHome ? <span className="tag">Home profile</span> : null}
        {member.isAdmin ? <span className="tag">Administrator</span> : null}
      </div>
      <p className="field-note">Joined {formatDateTime(member.createdAt)}</p>
      <div className="moderation-actions">
        <button
          type="button"
          className="button button-quiet"
          disabled={busy}
          onClick={async () => {
            setBusy(true)
            setResult(null)
            const next = await runAction(
              () =>
                setRoleFn({
                  data: { userId: member.id, role: nextRole },
                }),
              'The role change failed. Try again.',
            )
            setBusy(false)
            setResult(next)
            if (next.ok) await router.invalidate()
          }}
        >
          {busy
            ? 'Saving…'
            : member.isAdmin
              ? 'Revoke administrator'
              : 'Grant administrator'}
        </button>
        {member.isHome ? (
          <span className="field-note">
            The home profile cannot be deleted.
          </span>
        ) : (
          <ConfirmDelete
            username={member.username}
            actionLabel="Delete user"
            description={`Deleting @${member.username} removes the profile, sessions, and every authored or received comment.`}
            onDelete={(confirmation) =>
              adminDeleteUserFn({ data: { userId: member.id, confirmation } })
            }
            onDone={async () => {
              await router.invalidate()
            }}
          />
        )}
      </div>
      <FormMessage result={result} />
    </li>
  )
}

function AdminSettings({ initialTheme }: { initialTheme: Theme }) {
  const router = useRouter()
  const [theme, setTheme] = useState<Theme>(initialTheme)
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<FormResult>(null)

  return (
    <div className="admin-settings">
      <Panel title="Site settings" hint="All visitors">
        <form
          className="stack-form"
          onSubmit={async (event) => {
            event.preventDefault()
            setBusy(true)
            setResult(null)
            const next = await runAction(
              () => updateSiteThemeFn({ data: { theme } }),
              'The site color theme could not be saved. Try again.',
            )
            setBusy(false)
            setResult(next)
            if (next.ok) {
              setTheme(next.theme)
              await router.invalidate()
            }
          }}
        >
          <label className="field">
            <span>Color theme</span>
            <select
              value={theme}
              onChange={(event) => {
                const next = event.target.value
                if (isTheme(next)) setTheme(next)
              }}
            >
              {THEMES.map((value) => (
                <option key={value} value={value}>
                  {THEME_LABELS[value]}
                </option>
              ))}
            </select>
          </label>
          <p className="field-note">
            Sets the page, header, footer, panels, and form colors for everyone,
            including signed-out visitors. Profile themes stay separate.
          </p>
          <button type="submit" className="button" disabled={busy}>
            {busy ? 'Saving…' : 'Save color theme'}
          </button>
          <FormMessage result={result} />
        </form>
      </Panel>
    </div>
  )
}

function AdminRoute() {
  const data = Route.useLoaderData()
  const search = Route.useSearch()
  const tab: AdminTab =
    search.tab === 'members' || search.tab === 'settings'
      ? search.tab
      : 'comments'

  return (
    <div className="canvas page page-admin">
      <h1>Administration</h1>
      <p className="page-intro">
        Moderation, account, and site controls. Every action here re-checks your
        administrator role on the server.
      </p>

      <nav className="admin-pages" aria-label="Administration pages">
        <Link
          to="/admin"
          search={{ ...search, tab: 'comments' }}
          className={tab === 'comments' ? 'active' : undefined}
          aria-current={tab === 'comments' ? 'page' : undefined}
        >
          Comments
        </Link>
        <Link
          to="/admin"
          search={{ ...search, tab: 'members' }}
          className={tab === 'members' ? 'active' : undefined}
          aria-current={tab === 'members' ? 'page' : undefined}
        >
          Members
        </Link>
        <Link
          to="/admin"
          search={{ ...search, tab: 'settings' }}
          className={tab === 'settings' ? 'active' : undefined}
          aria-current={tab === 'settings' ? 'page' : undefined}
        >
          Settings
        </Link>
      </nav>

      {tab === 'comments' ? (
        <Panel
          title="Comments"
          hint={`${data.pendingCount} pending · ${data.approvedCount} approved`}
        >
          <nav className="admin-tabs" aria-label="Comment status">
            <Link
              to="/admin"
              search={{
                ...search,
                status: 'pending',
                page: 1,
                pageInvalid: false,
              }}
              className={data.status === 'pending' ? 'active' : undefined}
              aria-current={data.status === 'pending' ? 'page' : undefined}
            >
              Pending ({data.pendingCount})
            </Link>
            <Link
              to="/admin"
              search={{
                ...search,
                status: 'approved',
                page: 1,
                pageInvalid: false,
              }}
              className={data.status === 'approved' ? 'active' : undefined}
              aria-current={data.status === 'approved' ? 'page' : undefined}
            >
              Approved ({data.approvedCount})
            </Link>
          </nav>

          {data.pageInvalid ? (
            <p className="notice" role="status">
              The page number was invalid. Showing page 1.
            </p>
          ) : null}

          {data.comments.length === 0 ? (
            <p className="empty">
              {data.commentTotal > 0
                ? `No comments on page ${data.page}. Go to page 1 to continue.`
                : data.status === 'pending'
                  ? 'No comments are waiting for review.'
                  : 'No approved comments have been published.'}
            </p>
          ) : (
            <ul className="admin-comments">
              {data.comments.map((comment) => (
                <li key={comment.id} className="admin-comment">
                  <p className="comment-meta">
                    <Link
                      to="/u/$username"
                      params={{ username: comment.authorUsername }}
                      className="comment-author"
                    >
                      {comment.authorDisplayName}
                    </Link>
                    <span>
                      on{' '}
                      <Link
                        to="/u/$username"
                        params={{ username: comment.targetUsername }}
                      >
                        {comment.targetDisplayName}
                      </Link>
                    </span>
                    <span className="comment-time">
                      {formatDateTime(comment.createdAt)}
                    </span>
                  </p>
                  <p className="comment-text">{comment.body}</p>
                  <CommentControls
                    commentId={comment.id}
                    status={
                      comment.status === 'approved' ? 'approved' : 'pending'
                    }
                  />
                </li>
              ))}
            </ul>
          )}

          {data.pageCount > 1 ? (
            <nav className="pagination" aria-label="Comment moderation pages">
              {data.page > 1 ? (
                <Link
                  to="/admin"
                  search={{
                    ...search,
                    page: data.page - 1,
                    pageInvalid: false,
                  }}
                >
                  Previous page
                </Link>
              ) : null}
              <span>
                Page {data.page} of {data.pageCount}
              </span>
              {data.page < data.pageCount ? (
                <Link
                  to="/admin"
                  search={{
                    ...search,
                    page: data.page + 1,
                    pageInvalid: false,
                  }}
                >
                  Next page
                </Link>
              ) : null}
            </nav>
          ) : null}
        </Panel>
      ) : null}

      {tab === 'members' ? (
        <Panel
          title="Members"
          hint={`${data.userTotal} ${data.userTotal === 1 ? 'account' : 'accounts'}`}
        >
          <form className="admin-search" action="/admin" method="get">
            <input type="hidden" name="status" value={data.status} />
            <input type="hidden" name="tab" value="members" />
            <label className="field">
              <span>Search accounts</span>
              <input
                type="search"
                name="q"
                defaultValue={data.q}
                maxLength={80}
                placeholder="Display name or username"
              />
            </label>
            <button type="submit" className="button">
              Search
            </button>
            {data.q ? (
              <Link
                to="/admin"
                search={{
                  ...search,
                  q: '',
                  qInvalid: false,
                  usersPage: 1,
                  usersPageInvalid: false,
                }}
                className="button button-quiet"
              >
                Clear search
              </Link>
            ) : null}
          </form>

          {data.qInvalid ? (
            <p className="notice" role="status">
              Search was shortened to 80 characters.
            </p>
          ) : null}
          {data.usersPageInvalid ? (
            <p className="notice" role="status">
              The account page number was invalid. Showing page 1.
            </p>
          ) : null}

          {data.users.length === 0 ? (
            <p className="empty">
              {data.q ? `No accounts match “${data.q}”.` : 'No accounts exist.'}
            </p>
          ) : (
            <ul className="admin-users">
              {data.users.map((member) => (
                <UserRow key={member.id} member={member} />
              ))}
            </ul>
          )}

          {data.userPageCount > 1 ? (
            <nav
              className="pagination"
              aria-label="Member administration pages"
            >
              {data.usersPage > 1 ? (
                <Link
                  to="/admin"
                  search={{
                    ...search,
                    usersPage: data.usersPage - 1,
                    usersPageInvalid: false,
                  }}
                >
                  Previous accounts
                </Link>
              ) : null}
              <span>
                Page {data.usersPage} of {data.userPageCount}
              </span>
              {data.usersPage < data.userPageCount ? (
                <Link
                  to="/admin"
                  search={{
                    ...search,
                    usersPage: data.usersPage + 1,
                    usersPageInvalid: false,
                  }}
                >
                  Next accounts
                </Link>
              ) : null}
            </nav>
          ) : null}
        </Panel>
      ) : null}

      {tab === 'settings' ? (
        <AdminSettings initialTheme={data.siteTheme} />
      ) : null}
    </div>
  )
}
