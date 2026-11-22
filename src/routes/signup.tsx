import {
  Link,
  createFileRoute,
  redirect,
  useRouter,
} from '@tanstack/react-router'
import { useState } from 'react'
import { FormMessage, type FormResult } from '~/components/FormMessage'
import { Panel } from '~/components/Panel'
import { Turnstile } from '~/components/Turnstile'
import { runAction } from '~/lib/run-action'
import { signUpFn, getPublicConfigFn } from '~/server/auth.functions'

export const Route = createFileRoute('/signup')({
  ssr: true,
  beforeLoad: ({ context }) => {
    if (context.session) throw redirect({ to: '/account', search: { tab: 'profile' } })
  },
  loader: async () => ({
    config: await getPublicConfigFn(),
  }),
  head: () => ({
    meta: [{ title: 'Create an account | p0ntus' }],
  }),
  component: SignupRoute,
})

function SignupRoute() {
  const { config } = Route.useLoaderData()
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<FormResult>(null)
  const [token, setToken] = useState<string | null>(null)
  const [resetSignal, setResetSignal] = useState(0)

  if (!config.registrationOpen) {
    return (
      <div className="canvas page page-narrow">
        <h1>Registration is closed</h1>
        <Panel title="Signup status">
          <p>
            {config.adminCount === 0
              ? 'The first administrator has not completed setup yet.'
              : 'This deployment is not accepting new accounts.'}
          </p>
          {config.adminCount === 0 ? (
            <p>
              <Link to="/setup">Complete the first-administrator setup</Link>{' '}
              before creating other accounts.
            </p>
          ) : (
            <p>
              <Link to="/login">Log in</Link> with an existing account.
            </p>
          )}
        </Panel>
      </div>
    )
  }

  return (
    <div className="canvas page page-narrow">
      <h1>Create an account</h1>
      <p className="page-intro">
        Your display name, username, bio, avatar, and approved comments are
        public. Your email address is not shown on your profile.
      </p>

      <Panel title="New account">
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
                signUpFn({
                  data: {
                    username: String(form.get('username') ?? ''),
                    displayName: String(form.get('displayName') ?? ''),
                    email: String(form.get('email') ?? ''),
                    password: String(form.get('password') ?? ''),
                    captchaToken: token,
                  },
                }),
              'The account could not be created. Try again.',
            )
            setBusy(false)
            setResult(next)
            if (next.ok) {
              await router.invalidate()
              await router.navigate({ to: '/account', search: { tab: 'profile' } })
            } else {
              setToken(null)
              setResetSignal((value) => value + 1)
            }
          }}
        >
          <label className="field">
            <span>Username</span>
            <input
              name="username"
              autoComplete="username"
              minLength={3}
              maxLength={24}
              pattern="[A-Za-z0-9_]{3,24}"
              required
              spellCheck={false}
            />
            <span className="field-note">
              3 to 24 letters, digits, or underscores. Stored lowercase.
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
            siteKey={config.siteKey}
            onToken={setToken}
            resetSignal={resetSignal}
          />
          <button type="submit" className="button" disabled={busy}>
            {busy ? 'Creating account…' : 'Create account'}
          </button>
          <FormMessage result={result} />
        </form>

        <p className="form-footnote">
          Already registered? <Link to="/login">Log in</Link>. By creating an
          account you agree to the <Link to="/terms">terms</Link> and{' '}
          <Link to="/privacy">privacy policy</Link>.
        </p>
      </Panel>
    </div>
  )
}
