import {
  HeadContent,
  Link,
  Outlet,
  Scripts,
  createRootRoute,
} from '@tanstack/react-router'
import type { ReactNode } from 'react'
import { Breadcrumbs } from '~/components/Breadcrumbs'
import { Panel } from '~/components/Panel'
import { SiteFooter } from '~/components/SiteFooter'
import { SiteHeader } from '~/components/SiteHeader'
import appCss from '~/styles/app.css?url'
import { getSessionSummaryFn } from '~/server/auth.functions'
import { getSiteThemeFn } from '~/server/settings.functions'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      {
        title: 'p0ntus',
      },
      {
        name: 'description',
        content: 'My personal website and mini social network',
      },
      { name: 'theme-color', content: '#160e28' },
    ],
    links: [{ rel: 'stylesheet', href: appCss }],
  }),
  beforeLoad: async () => {
    const [session, siteTheme] = await Promise.all([
      getSessionSummaryFn(),
      getSiteThemeFn(),
    ])
    return { session, siteTheme: session?.themePreference ?? siteTheme }
  },
  component: RootLayout,
  shellComponent: RootDocument,
  pendingComponent: LoadingPage,
  notFoundComponent: NotFound,
  errorComponent: RootError,
})

function RootDocument({ children }: { children: ReactNode }) {
  const { siteTheme } = Route.useRouteContext()

  return (
    <html lang="en" data-site-theme={siteTheme}>
      <head>
        <HeadContent />
      </head>
      <body>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        {children}
        <Scripts />
      </body>
    </html>
  )
}

function RootLayout() {
  const { session } = Route.useRouteContext()

  return (
    <>
      <SiteHeader session={session} />
      <main id="main">
        <Outlet />
      </main>
      <SiteFooter />
    </>
  )
}

/**
 * The chrome below renders without route context: the root route's pending,
 * not-found, and error states replace RootLayout, so the viewer's session is
 * unknown there and the header shows no account state.
 */

function LoadingPage() {
  return (
    <>
      <SiteHeader />
      <main id="main">
        <div className="canvas page">
          <p className="loading" role="status">
            Loading this page…
          </p>
        </div>
      </main>
      <SiteFooter />
    </>
  )
}

function NotFound() {
  return (
    <>
      <Breadcrumbs current="Page not found" />
      <div className="canvas page page-narrow">
        <h1>Page not found</h1>
        <p className="page-intro">
          That address does not match a profile or page on this site.
        </p>
        <Panel title="Where to go">
          <p>
            <Link to="/">Go to the home profile</Link> or{' '}
            <Link to="/members">browse members</Link>.
          </p>
        </Panel>
      </div>
    </>
  )
}

function RootError({ reset }: { reset: () => void }) {
  return (
    <>
      <SiteHeader />
      <Breadcrumbs current="Error" />
      <main id="main">
        <div className="canvas page page-narrow">
          <h1>This page could not load</h1>
          <p className="page-intro">
            The request failed before the page could render. The database may be
            unavailable, or the address may be wrong.
          </p>
          <Panel title="What you can do">
            <div className="button-row">
              <button type="button" className="button" onClick={reset}>
                Try again
              </button>
              <Link to="/" className="button button-quiet">
                Go home
              </Link>
            </div>
          </Panel>
        </div>
      </main>
      <SiteFooter />
    </>
  )
}
