import { Link, createFileRoute, redirect, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { FormMessage, type FormResult } from '~/components/FormMessage'
import { Panel } from '~/components/Panel'
import { runAction } from '~/lib/run-action'
import { signInFn } from '~/server/auth.functions'

export const Route = createFileRoute('/login')({
  ssr: true,
  beforeLoad: ({ context }) => {
    if (context.session) throw redirect({ to: '/account' })
  },
  head: () => ({
    meta: [{ title: 'Log in | p0ntus' }],
  }),
  component: LoginRoute,
})

function LoginRoute() {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<FormResult>(null)

  return (
    <div className="canvas page page-narrow">
      <h1>Log in</h1>
      <p className="page-intro">
        Sessions last 30 days. There is no password reset flow on this
        deployment, so keep your password somewhere safe.
      </p>

      <Panel title="Account login">
        <form
          className="stack-form"
          onSubmit={async (event) => {
            event.preventDefault()
            const form = new FormData(event.currentTarget)
            setBusy(true)
            setResult(null)
            const next = await runAction(
              () =>
                signInFn({
                  data: {
                    email: String(form.get('email') ?? ''),
                    password: String(form.get('password') ?? ''),
                  },
                }),
              'Login could not be completed. Try again.',
            )
            setBusy(false)
            setResult(next)
            if (next.ok) {
              await router.invalidate()
              await router.navigate({ to: '/account' })
            }
          }}
        >
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
              autoComplete="current-password"
              maxLength={128}
              required
            />
          </label>
          <button type="submit" className="button" disabled={busy}>
            {busy ? 'Logging in…' : 'Log in'}
          </button>
          <FormMessage result={result} />
        </form>

        <p className="form-footnote">
          Need an account? <Link to="/signup">Create one</Link>. Running this
          site for the first time? <Link to="/setup">Finish setup</Link>.
        </p>
      </Panel>
    </div>
  )
}
