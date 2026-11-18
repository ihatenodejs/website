import { Link, createFileRoute } from '@tanstack/react-router'
import { Avatar } from '~/components/Avatar'
import { Breadcrumbs } from '~/components/Breadcrumbs'
import { Panel } from '~/components/Panel'
import { formatDate } from '~/lib/format'
import { parsePage, parseSearchQuery } from '~/lib/validation'
import { searchMembersFn } from '~/server/profiles.functions'

export const Route = createFileRoute('/members')({
  ssr: true,
  validateSearch: (
    search: Record<string, unknown>,
  ): {
    q?: string
    page?: number
    qInvalid?: boolean
    pageInvalid?: boolean
  } => {
    const q = parseSearchQuery(search.q)
    const page = parsePage(search.page)
    const result: {
      q?: string
      page?: number
      qInvalid?: boolean
      pageInvalid?: boolean
    } = {}
    if (q.value !== '') result.q = q.value
    else if (search.q !== undefined) result.q = ''
    if (q.invalid) result.qInvalid = true
    if (page.invalid) {
      result.page = 1
      result.pageInvalid = true
    } else if (page.value !== 1 || search.page !== undefined) {
      result.page = page.value
    }
    return result
  },
  loaderDeps: ({ search }) => ({
    q: search.q ?? '',
    page: search.page ?? 1,
    qInvalid: search.qInvalid ?? false,
    pageInvalid: search.pageInvalid ?? false,
  }),
  loader: async ({ deps }) => {
    const result = await searchMembersFn({
      data: { q: deps.q, page: deps.page },
    })
    return {
      ...result,
      qInvalid: deps.qInvalid,
      pageInvalid: deps.pageInvalid,
    }
  },
  head: () => ({
    meta: [{ title: 'Members | p0ntus' }],
  }),
  component: MembersRoute,
})

function MembersRoute() {
  const data = Route.useLoaderData()
  const q = Route.useSearch().q ?? ''

  return (
    <>
      <Breadcrumbs current="Members" />
      <div className="canvas page page-members">
        <h1>Members</h1>
        <p className="page-intro">
          Every account on this site has a public profile and an approved
          comment history. Search by display name or username.
        </p>

        <Panel
          title="Member directory"
          hint={`${data.total} ${data.total === 1 ? 'member' : 'members'}`}
        >
          <form className="directory-search" action="/members" method="get">
            <label className="field">
              <span>Search members</span>
              <input
                type="search"
                name="q"
                defaultValue={q}
                maxLength={80}
                placeholder="Display name or username"
              />
            </label>
            <button type="submit" className="button">
              Search
            </button>
            {q ? (
              <Link to="/members" className="button button-quiet">
                Clear search
              </Link>
            ) : null}
          </form>

          {data.qInvalid ? (
            <p className="notice" role="status">
              Search was shortened to 80 characters.
            </p>
          ) : null}
          {data.pageInvalid ? (
            <p className="notice" role="status">
              The page number was invalid. Showing page 1.
            </p>
          ) : null}

          {data.members.length === 0 ? (
            <div className="empty-state">
              {data.total > 0 ? (
                <>
                  <p>No members on page {data.page}.</p>
                  <Link
                    to="/members"
                    search={{
                      q,
                      page: 1,
                      qInvalid: false,
                      pageInvalid: false,
                    }}
                  >
                    Go to the first page
                  </Link>
                </>
              ) : q ? (
                <>
                  <p>No members match “{q}”.</p>
                  <Link to="/members">Show every member</Link>
                </>
              ) : (
                <>
                  <p>No member profiles exist yet.</p>
                  <p>
                    The first profile appears after setup at{' '}
                    <Link to="/setup">/setup</Link>.
                  </p>
                </>
              )}
            </div>
          ) : (
            <div className="table-wrap">
              <table className="member-table">
                <thead>
                  <tr>
                    <th scope="col">Member</th>
                    <th scope="col">Handle</th>
                    <th scope="col">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {data.members.map((member) => (
                    <tr key={member.userId}>
                      <td data-label="Member">
                        <span className="member-cell">
                          <Avatar
                            src={member.avatarUrl}
                            name={member.displayName}
                            size="small"
                          />
                          <Link
                            to="/u/$username"
                            params={{ username: member.username }}
                            className="member-name"
                          >
                            {member.displayName}
                          </Link>
                        </span>
                      </td>
                      <td data-label="Handle">
                        <span className="handle">@{member.username}</span>
                      </td>
                      <td data-label="Joined">
                        {formatDate(member.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {data.pageCount > 1 ? (
            <nav className="pagination" aria-label="Member pages">
              {data.page > 1 ? (
                <Link
                  to="/members"
                  search={{
                    q,
                    page: data.page - 1,
                    qInvalid: false,
                    pageInvalid: false,
                  }}
                >
                  Previous members
                </Link>
              ) : null}
              <span>
                Page {data.page} of {data.pageCount}
              </span>
              {data.page < data.pageCount ? (
                <Link
                  to="/members"
                  search={{
                    q,
                    page: data.page + 1,
                    qInvalid: false,
                    pageInvalid: false,
                  }}
                >
                  Next members
                </Link>
              ) : null}
            </nav>
          ) : null}
        </Panel>
      </div>
    </>
  )
}
