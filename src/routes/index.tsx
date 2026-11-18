import { Link, createFileRoute, defer } from '@tanstack/react-router'
import { ProfilePage } from '~/components/ProfilePage'
import { parsePage } from '~/lib/validation'
import { getHomeProfileFn, getApprovedCommentsFn } from '~/server/profiles.functions'

export const Route = createFileRoute('/')({
  ssr: true,
  validateSearch: (
    search: Record<string, unknown>,
  ): { page?: number; pageInvalid?: boolean } => {
    if (search.page === undefined || search.page === null || search.page === '') {
      return {}
    }
    const page = parsePage(search.page)
    return page.invalid
      ? { page: 1, pageInvalid: true }
      : { page: page.value }
  },
  loaderDeps: ({ search }) => ({
    page: search.page ?? 1,
    pageInvalid: search.pageInvalid ?? false,
  }),
  loader: async ({ deps }) => {
    const home = await getHomeProfileFn()
    if (home.state !== 'ok') return home

    const commentsPromise = defer(
      getApprovedCommentsFn({
        data: { targetUserId: home.profile.userId, page: deps.page },
      }),
    )

    return {
      ...home,
      page: deps.page,
      pageInvalid: deps.pageInvalid,
      commentsPromise,
    }
  },
  head: ({ loaderData }) => ({
    meta: [
      {
        title:
          loaderData?.state === 'ok'
            ? `${loaderData.profile.displayName} (@${loaderData.profile.username}) | p0ntus`
            : 'p0ntus',
      },
    ],
  }),
  component: HomeRoute,
})

function HomeRoute() {
  const data = Route.useLoaderData()
  const { session } = Route.useRouteContext()

  if (data.state === 'misconfigured') {
    return (
      <div className="canvas page">
        <h1>Configuration needed</h1>
        <p>{data.message}</p>
      </div>
    )
  }

  if (data.state === 'setup') {
    return (
      <div className="canvas page">
        <h1>This site is not set up yet</h1>
        <p>{data.message}</p>
        <p>
          The first administrator creates the home profile from the{' '}
          <Link to="/setup">setup page</Link>.
        </p>
      </div>
    )
  }

  return (
    <ProfilePage
      profile={data.profile}
      commentsPromise={data.commentsPromise}
      page={data.page}
      pageInvalid={data.pageInvalid}
      viewer={
        session ? { id: session.id, isAdmin: session.isAdmin } : null
      }
    />
  )
}
