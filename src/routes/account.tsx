import { Link, createFileRoute, redirect } from '@tanstack/react-router'
import { AccountCommentsTab } from '~/components/AccountCommentsTab'
import { AccountModelGroupsTab } from '~/components/AccountModelGroupsTab'
import { AccountConnectionsTab } from '~/components/AccountConnectionsTab'
import { AccountModelsTab } from '~/components/AccountModelsTab'
import { AccountProfileTab } from '~/components/AccountProfileTab'
import { AccountSettingsTab } from '~/components/AccountSettingsTab'
import { Panel } from '~/components/Panel'
import { getAccountDataFn } from '~/server/profiles.functions'

type AccountTab =
  | 'profile'
  | 'comments'
  | 'connections'
  | 'models'
  | 'groups'
  | 'settings'

export const Route = createFileRoute('/account')({
  ssr: true,
  beforeLoad: ({ context }) => {
    if (!context.session) throw redirect({ to: '/login' })
  },
  validateSearch: (search: Record<string, unknown>): { tab: AccountTab } => {
    const tab = search.tab
    return {
      tab:
        tab === 'comments' ||
        tab === 'connections' ||
        tab === 'models' ||
        tab === 'groups' ||
        tab === 'settings'
          ? tab
          : 'profile',
    }
  },
  loaderDeps: ({ search }) => ({ tab: search.tab }),
  loader: async () => {
    const data = await getAccountDataFn()
    if (!data.authenticated) throw redirect({ to: '/login' })
    return data
  },
  head: () => ({
    meta: [{ title: 'Your account | p0ntus' }],
  }),
  component: AccountRoute,
})

function AccountRoute() {
  const data = Route.useLoaderData()
  const { tab } = Route.useSearch()
  const profile =
    data.authenticated && !data.profileMissing ? data.profile : null

  if (!data.authenticated || data.profileMissing || !profile) {
    return (
      <div className="canvas page">
        <h1>Account</h1>
        <Panel title="Profile missing">
          <p>
            This account has no profile row. An administrator needs to repair
            the account before it can be used.
          </p>
        </Panel>
      </div>
    )
  }

  const activeTab: AccountTab =
    (tab === 'models' || tab === 'groups') &&
    !data.connections.connected
      ? 'connections'
      : tab

  const tabs = [
    { value: 'profile' as const, label: 'Profile' },
    { value: 'comments' as const, label: 'Comments' },
    { value: 'connections' as const, label: 'Connections' },
    ...(data.connections.connected
      ? [
          { value: 'models' as const, label: 'Models' },
          { value: 'groups' as const, label: 'Model Groups' },
        ]
      : []),
    { value: 'settings' as const, label: 'Settings' },
  ]

  return (
    <div className="canvas page page-account">
      <h1>Your account</h1>
      <p className="page-intro">
        Signed in as <strong>{data.email}</strong>. Your email is used for login
        and is not published. Password changes are not enabled on this
        deployment.
      </p>

      <nav className="account-pages" aria-label="Account pages">
        {tabs.map((entry) => (
          <Link
            key={entry.value}
            to="/account"
            search={{ tab: entry.value }}
            className={activeTab === entry.value ? 'active' : undefined}
            aria-current={activeTab === entry.value ? 'page' : undefined}
          >
            {entry.label}
          </Link>
        ))}
      </nav>

      {activeTab === 'profile' ? (
        <AccountProfileTab profile={profile} isAdmin={data.isAdmin} />
      ) : null}

      {activeTab === 'comments' ? (
        <AccountCommentsTab comments={data.comments} />
      ) : null}

      {activeTab === 'connections' ? (
        <AccountConnectionsTab connections={data.connections} />
      ) : null}

      {activeTab === 'models' ? (
        <AccountModelsTab models={data.connections.models} />
      ) : null}

      {activeTab === 'groups' ? (
        <AccountModelGroupsTab
          groups={data.connections.groups}
          suggestions={data.connections.suggestions}
          models={data.connections.models}
        />
      ) : null}

      {activeTab === 'settings' ? (
        <AccountSettingsTab
          profile={profile}
          siteTheme={data.siteTheme}
          themePreference={data.themePreference}
        />
      ) : null}
    </div>
  )
}
