import { Link, createFileRoute, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { FormMessage, type FormResult } from '~/components/FormMessage'
import { Panel } from '~/components/Panel'
import { Turnstile } from '~/components/Turnstile'
import { runAction } from '~/lib/run-action'
import { completeSetupFn, getSetupStateFn } from '~/server/setup.functions'

export const Route = createFileRoute('/setup')({
  ssr: true,
  loader: async () => ({
    state: await getSetupStateFn(),
  }),
  head: () => ({
    meta: [{ title: 'Site setup | p0ntus' }],
  }),
  component: SetupRoute,
})

function SetupRoute() {
  const { state } = Route.useLoaderData()
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<FormResult>(null)
  const [token, setToken] = useState<string | null>(null)
  const [resetSignal, setResetSignal] = useState(0)

  if (!state.allowed) {
    return (
      <div className="canvas page page-narrow">
        <h1>{state.complete ? 'Setup is complete' : 'Setup is unavailable'}</h1>
        <Panel title="Bootstrap status">
          <p>{state.reason}</p>
          <p>
            <Link to={state.complete ? '/login' : '/'}>
              {state.complete ? 'Log in to your account' : 'Return home'}
            </Link>
          </p>
        </Panel>
      </div>
    )
  }

  return (
    <div className="canvas page page-narrow">
      <h1>Create the first administrator</h1>
      <p className="page-intro">
        This form runs once. It creates the home profile, grants administrator
        access, and closes public registration until setup finishes. The
        bootstrap secret is the value of BOOTSTRAP_SECRET in the server
        environment.
      </p>

      <Panel title="First administrator">
        <form
          className="stack-form"
          onSubmit={async (event) => {
            event.preventDefault()
            const form = new FormData(event.currentTarget)
            if (!token) {
              setResult({
                ok: false,
                message: 'Complete the verification challenge first.',
              })
              return
            }
            setBusy(true)
            setResult(null)
            const next = await runAction(
              () =>
                completeSetupFn({
                  data: {
                    secret: String(form.get('secret') ?? ''),
                    username: String(form.get('username') ?? ''),
                    displayName: String(form.get('displayName') ?? ''),
                    email: String(form.get('email') ?? ''),
                    password: String(form.get('password') ?? ''),
                    captchaToken: token,
                  },
                }),
              'Setup could not be completed. Try again.',
            )
            setBusy(false)
            setResult(next)
            if (next.ok) {
              await router.invalidate()
              await router.navigate({ to: '/' })
            } else {
              setToken(null)
              setResetSignal((value) => value + 1)
            }
          }}
        >
          <label className="field">
            <span>Bootstrap secret</span>
            <input
              name="secret"
              type="password"
              autoComplete="off"
              required
            />
          </label>
          <label className="field">
            <span>Home username</span>
            <input
              name="username"
              defaultValue={state.homeUsername}
              autoComplete="username"
              minLength={3}
              maxLength={24}
              pattern="[A-Za-z0-9_]{3,24}"
              required
              spellCheck={false}
            />
            <span className="field-note">
              Must match HOME_USERNAME. This profile owns the home page and
              cannot be renamed or deleted.
            </span>
          </label>
          <label className="field">
            <span>Display name</span>
            <input
              name="displayName"
              autoComplete="name"
              maxLength={80}
              required
            />
            <span className="field-note">
              Shown on the home profile. You can edit it later on the account
              page.
            </span>
          </label>
          <label className="field">
            <span>Email</span>
            <input
              name="email"
              type="email"
              autoComplete="email"
              maxLength={254}
              required
            />
          </label>
          <label className="field">
            <span>Password</span>
            <input
              name="password"
              type="password"
              autoComplete="new-password"
              minLength={10}
              maxLength={128}
              required
            />
            <span className="field-note">At least 10 characters.</span>
          </label>
          <Turnstile
            siteKey={state.siteKey}
            onToken={setToken}
            resetSignal={resetSignal}
          />
          <button type="submit" className="button" disabled={busy}>
            {busy ? 'Creating administrator…' : 'Finish setup'}
          </button>
          <FormMessage result={result} />
        </form>
      </Panel>
    </div>
  )
}
