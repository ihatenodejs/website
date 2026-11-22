import { useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { ConfirmDelete } from './ConfirmDelete'
import { FormMessage, type FormResult } from './FormMessage'
import { Panel } from './Panel'
import { runAction } from '~/lib/run-action'
import { THEMES, THEME_LABELS, isTheme, type Theme } from '~/lib/theme'
import {
  deleteOwnAccountFn,
  updateThemePreferenceFn,
  type PublicProfile,
} from '~/server/profiles.functions'

export function AccountSettingsTab({
  profile,
  siteTheme,
  themePreference: initialThemePreference,
}: {
  profile: PublicProfile
  siteTheme: Theme
  themePreference: Theme | null
}) {
  const router = useRouter()
  const [themePreference, setThemePreference] = useState<Theme | null>(
    initialThemePreference,
  )
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<FormResult>(null)

  return (
    <div className="account-settings">
      <Panel title="Color theme" hint="Your view">
        <form
          className="stack-form"
          onSubmit={async (event) => {
            event.preventDefault()
            setBusy(true)
            setResult(null)
            const next = await runAction(
              () =>
                updateThemePreferenceFn({
                  data: { theme: themePreference },
                }),
              'Your color theme could not be saved. Try again.',
            )
            setBusy(false)
            setResult(next)
            if (next.ok) {
              setThemePreference(next.themePreference)
              await router.invalidate()
            }
          }}
        >
          <label className="field">
            <span>Color theme</span>
            <select
              value={themePreference ?? 'site'}
              onChange={(event) => {
                const next = event.target.value
                if (next === 'site') setThemePreference(null)
                else if (isTheme(next)) setThemePreference(next)
              }}
            >
              <option value="site">
                Site default ({THEME_LABELS[siteTheme]})
              </option>
              {THEMES.map((value) => (
                <option key={value} value={value}>
                  {THEME_LABELS[value]}
                </option>
              ))}
            </select>
            <span className="field-note">
              Overrides the administrator&apos;s color theme for your account on
              every page. Your public profile keeps its own profile theme.
            </span>
          </label>
          <button type="submit" className="button" disabled={busy}>
            {busy ? 'Saving…' : 'Save color theme'}
          </button>
          <FormMessage result={result} />
        </form>
      </Panel>

      <Panel title="Delete account">
        <p>
          Deleting your account removes your profile, sessions, and every
          comment you wrote or received. This cannot be undone.
        </p>
        {profile.isHome ? (
          <p className="notice">
            This is the home profile. It cannot be deleted, regardless of role.
          </p>
        ) : (
          <ConfirmDelete
            username={profile.username}
            actionLabel="Delete my account"
            description="Your profile and all related comments are removed permanently."
            onDelete={(confirmation) =>
              deleteOwnAccountFn({ data: { confirmation } })
            }
            onDone={async () => {
              await router.invalidate()
              await router.navigate({ to: '/' })
            }}
          />
        )}
      </Panel>
    </div>
  )
}
