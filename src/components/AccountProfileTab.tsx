import { Link, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { AccountDetailsPanel } from './AccountDetailsPanel'
import { AccountSchoolsPanel } from './AccountSchoolsPanel'
import { Avatar } from './Avatar'
import { FormMessage, type FormResult } from './FormMessage'
import { Panel } from './Panel'
import { CONTACT_METHODS, type ContactValues } from '~/lib/contacts'
import { runAction } from '~/lib/run-action'
import { THEMES, THEME_LABELS, isTheme, type Theme } from '~/lib/theme'
import { avatarUrlSchema } from '~/lib/validation'
import {
  updateContactsFn,
  updateProfileFn,
  type PublicProfile,
} from '~/server/profiles.functions'

export function AccountProfileTab({
  profile,
  isAdmin,
}: {
  profile: PublicProfile
  isAdmin: boolean
}) {
  const router = useRouter()

  const [displayName, setDisplayName] = useState(profile.displayName)
  const [username, setUsername] = useState(profile.username)
  const [tagline, setTagline] = useState(profile.tagline)
  const [bio, setBio] = useState(profile.bio)
  const [theme, setTheme] = useState<Theme>(
    isTheme(profile.theme) ? profile.theme : 'blue',
  )
  const [avatarUrl, setAvatarUrl] = useState(
    profile.avatarUrl?.startsWith('https://') ? profile.avatarUrl : '',
  )
  const [clearAvatar, setClearAvatar] = useState(false)
  const [contacts, setContacts] = useState<ContactValues>(() => ({
    ...profile.contacts,
  }))
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<FormResult>(null)
  const [contactsBusy, setContactsBusy] = useState(false)
  const [contactsResult, setContactsResult] = useState<FormResult>(null)
  const [uploadBusy, setUploadBusy] = useState(false)
  const [uploadResult, setUploadResult] = useState<FormResult>(null)

  const homeProtected = profile.isHome

  return (
    <div className={`account-grid${isAdmin ? '' : ' account-grid-profile'}`}>
      <div className="account-profile">
        <Panel
          title="Public profile"
          hint={
            <Link to="/u/$username" params={{ username: profile.username }}>
              View public page
            </Link>
          }
        >
          <div className="account-avatar">
            <Avatar
              src={profile.avatarUrl}
              name={profile.displayName}
              size="large"
            />
            <div>
              <p className="portrait-name">@{profile.username}</p>
              <p className="field-note">
                Displayed with your display name on your profile and comments.
              </p>
            </div>
          </div>

          <form
            className="stack-form"
            onSubmit={async (event) => {
              event.preventDefault()
              const parsedUrl = avatarUrlSchema.safeParse(avatarUrl)
              if (!parsedUrl.success) {
                setResult({
                  ok: false,
                  message:
                    parsedUrl.error.issues[0]?.message ??
                    'Enter a valid HTTPS avatar URL.',
                })
                return
              }
              setBusy(true)
              setResult(null)
              const next = await runAction(
                () =>
                  updateProfileFn({
                    data: {
                      displayName,
                      tagline,
                      username,
                      bio,
                      theme,
                      avatarUrl,
                      clearAvatar,
                    },
                  }),
                'Your profile could not be saved. Try again.',
              )
              setBusy(false)
              setResult(next)
              if (next.ok) {
                setDisplayName(next.profile.displayName)
                setUsername(next.profile.username)
                setTagline(next.profile.tagline)
                setBio(next.profile.bio)
                setAvatarUrl(
                  next.profile.avatarUrl?.startsWith('https://')
                    ? next.profile.avatarUrl
                    : '',
                )
                setClearAvatar(false)
                if (isTheme(next.profile.theme)) setTheme(next.profile.theme)
                await router.invalidate()
              }
            }}
          >
            <label className="field">
              <span>Display name</span>
              <input
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                maxLength={80}
                required
              />
            </label>

            <label className="field">
              <span>Username</span>
              <input
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                minLength={3}
                maxLength={24}
                pattern="[A-Za-z0-9_]{3,24}"
                required
                disabled={homeProtected}
                spellCheck={false}
              />
              <span className="field-note">
                {homeProtected
                  ? 'The home profile username is fixed by HOME_USERNAME and cannot be changed.'
                  : 'Changing it makes the old profile URL stop resolving. Stored lowercase.'}
              </span>
            </label>

            <label className="field">
              <span>Tagline</span>
              <input
                value={tagline}
                onChange={(event) => setTagline(event.target.value)}
                maxLength={160}
                placeholder="One line about you"
              />
              <span className="field-note">
                Shown under your handle on your profile. {tagline.length}/160
                characters.
              </span>
            </label>

            <label className="field">
              <span>Bio</span>
              <textarea
                value={bio}
                onChange={(event) => setBio(event.target.value)}
                maxLength={2000}
                rows={7}
              />
              <span className="field-note">{bio.length}/2000 characters</span>
            </label>

            <label className="field">
              <span>Profile theme</span>
              <select
                value={theme}
                onChange={(event) => {
                  const next = event.target.value
                  if (isTheme(next)) setTheme(next)
                }}
              >
                {THEMES.map((value) => (
                  <option key={value} value={value}>
                    {THEME_LABELS[value]}
                  </option>
                ))}
              </select>
              <span className="field-note">
                Applies to your public profile for visitors. The rest of the
                site uses the color theme selected by an administrator.
              </span>
            </label>

            <label className="field">
              <span>Avatar URL</span>
              <input
                type="url"
                value={avatarUrl}
                onChange={(event) => setAvatarUrl(event.target.value)}
                placeholder="https://example.com/photo.jpg"
                maxLength={500}
              />
              <span className="field-note">
                HTTPS only. The image host receives requests from visitors who
                view your profile.
              </span>
            </label>

            <label className="checkbox-field">
              <input
                type="checkbox"
                checked={clearAvatar}
                onChange={(event) => setClearAvatar(event.target.checked)}
              />
              <span>Remove the current avatar when saving</span>
            </label>

            <button type="submit" className="button" disabled={busy}>
              {busy ? 'Saving…' : 'Save profile'}
            </button>
            <FormMessage result={result} />
          </form>
        </Panel>
      </div>

      <div className="account-contact">
        <Panel title="Contact methods" hint="Optional">
          <form
            className="stack-form"
            onSubmit={async (event) => {
              event.preventDefault()
              setContactsBusy(true)
              setContactsResult(null)
              const next = await runAction(
                () => updateContactsFn({ data: { contacts } }),
                'Your contacts could not be saved. Try again.',
              )
              setContactsBusy(false)
              setContactsResult(next)
              if (next.ok) {
                setContacts({ ...next.profile.contacts })
                await router.invalidate()
              }
            }}
          >
            <p className="field-note">
              Only filled-in methods appear on your public profile. Leaving
              every method blank hides the contact panel.
            </p>
            {CONTACT_METHODS.map((method) => (
              <label className="field" key={method.id}>
                <span>{method.fieldLabel}</span>
                <input
                  type={method.id === 'email' ? 'email' : 'text'}
                  value={contacts[method.id]}
                  onChange={(event) =>
                    setContacts((current) => ({
                      ...current,
                      [method.id]: event.target.value,
                    }))
                  }
                  maxLength={method.maxLength}
                  pattern={method.pattern ?? undefined}
                  placeholder={method.placeholder}
                  spellCheck={false}
                  autoComplete="off"
                />
              </label>
            ))}
            <button type="submit" className="button" disabled={contactsBusy}>
              {contactsBusy ? 'Saving…' : 'Save contacts'}
            </button>
            <FormMessage result={contactsResult} />
          </form>
        </Panel>
      </div>

      {isAdmin ? (
        <div className="account-side">
          <Panel title="Avatar upload" hint="Administrators only">
            <form
              className="stack-form"
              onSubmit={async (event) => {
                event.preventDefault()
                const form = new FormData(event.currentTarget)
                const file = form.get('avatar')
                if (!(file instanceof File) || file.size === 0) {
                  setUploadResult({
                    ok: false,
                    message: 'Choose a JPEG, PNG, or WebP image first.',
                  })
                  return
                }
                setUploadBusy(true)
                setUploadResult(null)
                const response = await fetch('/api/avatar-upload', {
                  method: 'POST',
                  body: form,
                })
                const payload = (await response.json().catch(() => null)) as {
                  ok?: boolean
                  message?: string
                } | null
                setUploadBusy(false)
                const next = {
                  ok: response.ok && payload?.ok === true,
                  message:
                    payload?.message ??
                    (response.ok
                      ? 'Avatar uploaded.'
                      : 'The avatar could not be uploaded.'),
                }
                setUploadResult(next)
                if (next.ok) {
                  setAvatarUrl('')
                  setClearAvatar(false)
                  await router.invalidate()
                }
              }}
            >
              <label className="field">
                <span>Image file</span>
                <input
                  name="avatar"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  required
                />
                <span className="field-note">
                  JPEG, PNG, or WebP. 5 MiB maximum. Re-encoded to WebP.
                </span>
              </label>
              <button type="submit" className="button" disabled={uploadBusy}>
                {uploadBusy ? 'Uploading…' : 'Upload avatar'}
              </button>
              <FormMessage result={uploadResult} />
            </form>
          </Panel>
        </div>
      ) : null}

      <div className="account-extras">
        <AccountDetailsPanel profile={profile} isAdmin={isAdmin} />
        <AccountSchoolsPanel profile={profile} />
      </div>
    </div>
  )
}
