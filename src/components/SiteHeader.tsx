import { Link, useRouter } from '@tanstack/react-router'
import type { SessionSummary } from '~/server/auth.functions'
import { signOutFn } from '~/server/auth.functions'

/**
 * `undefined` means the viewer is unknown, which happens when the root route
 * fails before its session lookup. The chrome still renders, without account
 * state, so a failed page keeps the site header.
 */
export function SiteHeader({ session }: { session?: SessionSummary | null }) {
  const router = useRouter()

  return (
    <header className="site-header">
      <div className="utility">
        <div className="canvas">
          <Link to="/" className="utility-mark">
            p0ntus
          </Link>
          <nav aria-label="Utility">
            <Link to="/members">Members</Link>
            <Link to="/privacy">Privacy</Link>
            <Link to="/terms">Terms</Link>
          </nav>
          {session === undefined ? null : (
            <div className="utility-account">
              {session ? (
                <>
                  <span>
                    Signed in as{' '}
                    <Link to="/account">
                      {session.username ? `@${session.username}` : session.displayName}
                    </Link>
                  </span>
                  <form
                    className="inline-form"
                    onSubmit={async (event) => {
                      event.preventDefault()
                      await signOutFn()
                      await router.invalidate()
                      await router.navigate({ to: '/' })
                    }}
                  >
                    <button type="submit" className="link-button">
                      Log out
                    </button>
                  </form>
                </>
              ) : (
                <>
                  <span>Not signed in</span>
                  <Link to="/login">Log in</Link>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="masthead">
        <div className="canvas">
          <Link to="/" className="wordmark">
            p0ntus<span aria-hidden="true">.</span>
          </Link>
          <form className="site-search" action="/members" method="get" role="search">
            <label className="sr-only" htmlFor="site-search-q">
              Search members
            </label>
            <input
              id="site-search-q"
              name="q"
              type="search"
              maxLength={80}
              placeholder="Search members"
            />
            <button type="submit">Search</button>
          </form>
          <nav className="primary-nav" aria-label="Primary">
            <Link to="/">Home</Link>
            <Link to="/members">Members</Link>
            {session === undefined ? null : session ? (
              <Link to="/account">My account</Link>
            ) : (
              <Link to="/login">Log in</Link>
            )}
            {session?.isAdmin ? <Link to="/admin">Admin</Link> : null}
          </nav>
        </div>
      </div>
    </header>
  )
}
