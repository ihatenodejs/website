import { createFileRoute, defer, notFound } from '@tanstack/react-router'
import { ProfilePage } from '~/components/ProfilePage'
import { parsePage } from '~/lib/validation'
import {
  getProfileFn,
  getApprovedCommentsFn,
} from '~/server/profiles.functions'

export const Route = createFileRoute('/u/$username')({
  ssr: true,
  validateSearch: (
    search: Record<string, unknown>,
  ): { page?: number; pageInvalid?: boolean } => {
    if (
      search.page === undefined ||
      search.page === null ||
      search.page === ''
    ) {
      return {}
    }
    const page = parsePage(search.page)
    return page.invalid ? { page: 1, pageInvalid: true } : { page: page.value }
  },
  loaderDeps: ({ search }) => ({
    page: search.page ?? 1,
    pageInvalid: search.pageInvalid ?? false,
  }),
  loader: async ({ params, deps }) => {
    const profile = await getProfileFn({ data: { username: params.username } })
    if (!profile) throw notFound()

    const commentsPromise = defer(
      getApprovedCommentsFn({
        data: { targetUserId: profile.userId, page: deps.page },
      }),
    )

    return {
      profile,
      page: deps.page,
      pageInvalid: deps.pageInvalid,
      commentsPromise,
    }
  },
  head: ({ loaderData }) => ({
    meta: [
      {
        title: loaderData
          ? `${loaderData.profile.displayName} (@${loaderData.profile.username}) | p0ntus`
          : 'Profile not found | p0ntus',
      },
    ],
  }),
  component: ProfileRoute,
})

function ProfileRoute() {
  const data = Route.useLoaderData()
  const { session } = Route.useRouteContext()

  return (
    <ProfilePage
      profile={data.profile}
      commentsPromise={data.commentsPromise}
      page={data.page}
      pageInvalid={data.pageInvalid}
      viewer={session ? { id: session.id, isAdmin: session.isAdmin } : null}
    />
  )
}
