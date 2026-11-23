import { useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { FormMessage, type FormResult } from './FormMessage'
import { Panel } from './Panel'
import {
  DRINK_OPTIONS,
  EDUCATION_OPTIONS,
  HERE_FOR_OPTIONS,
  RELATIONSHIP_OPTIONS,
  SMOKE_OPTIONS,
  ZODIAC_OPTIONS,
} from '~/lib/profile-details'
import { runAction } from '~/lib/run-action'
import { profileDetailsUpdateSchema } from '~/lib/validation'
import {
  updateDetailsFn,
  type PublicProfile,
} from '~/server/profiles.functions'

export function AccountDetailsPanel({
  profile,
  isAdmin,
}: {
  profile: PublicProfile
  isAdmin: boolean
}) {
  const router = useRouter()
  const [profileLink, setProfileLink] = useState(profile.profileLink)
  const [detailStatus, setDetailStatus] = useState(profile.details.detailStatus)
  const [hereFor, setHereFor] = useState(profile.details.hereFor)
  const [hometown, setHometown] = useState(profile.details.hometown)
  const [ethnicity, setEthnicity] = useState(profile.details.ethnicity)
  const [zodiac, setZodiac] = useState(profile.details.zodiac)
  const [smoke, setSmoke] = useState(profile.details.smoke)
  const [drink, setDrink] = useState(profile.details.drink)
  const [education, setEducation] = useState(profile.details.education)
  const [occupation, setOccupation] = useState(profile.details.occupation)
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<FormResult>(null)

  return (
    <Panel title="Details" hint="Optional">
      <form
        className="stack-form"
        onSubmit={async (event) => {
          event.preventDefault()
          const parsed = profileDetailsUpdateSchema.safeParse({
            profileLink,
            detailStatus,
            hereFor,
            hometown,
            ethnicity,
            zodiac,
            smoke,
            drink,
            education,
            occupation,
          })
          if (!parsed.success) {
            setResult({
              ok: false,
              message:
                parsed.error.issues[0]?.message ??
                'Check the details and try again.',
            })
            return
          }
          setBusy(true)
          setResult(null)
          const next = await runAction(
            () => updateDetailsFn({ data: parsed.data }),
            'Your details could not be saved. Try again.',
          )
          setBusy(false)
          setResult(next)
          if (next.ok) {
            setProfileLink(next.profile.profileLink)
            setDetailStatus(next.profile.details.detailStatus)
            setHereFor(next.profile.details.hereFor)
            setHometown(next.profile.details.hometown)
            setEthnicity(next.profile.details.ethnicity)
            setZodiac(next.profile.details.zodiac)
            setSmoke(next.profile.details.smoke)
            setDrink(next.profile.details.drink)
            setEducation(next.profile.details.education)
            setOccupation(next.profile.details.occupation)
            await router.invalidate()
          }
        }}
      >
        <p className="field-note">
          Only filled-in details appear on your public profile. Leaving a detail
          blank hides its row.
        </p>

        {isAdmin ? (
          <label className="field">
            <span>Profile link</span>
            <input
              type="url"
              value={profileLink}
              onChange={(event) => setProfileLink(event.target.value)}
              placeholder="https://example.com"
              maxLength={500}
            />
            <span className="field-note">
              Administrators only. Shown as a link beside your latest status.
              The URL badge always shows your p0ntus profile URL. HTTPS only.
            </span>
          </label>
        ) : null}

        <div className="detail-fields">
          <label className="field">
            <span>Status</span>
            <select
              value={detailStatus}
              onChange={(event) => setDetailStatus(event.target.value)}
            >
              {RELATIONSHIP_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option || 'Prefer not to say'}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Here for</span>
            <select
              value={hereFor}
              onChange={(event) => setHereFor(event.target.value)}
            >
              {HERE_FOR_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option || 'Prefer not to say'}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Hometown</span>
            <input
              value={hometown}
              onChange={(event) => setHometown(event.target.value)}
              maxLength={80}
              placeholder="Los Angeles, California"
            />
          </label>

          <label className="field">
            <span>Ethnicity</span>
            <input
              value={ethnicity}
              onChange={(event) => setEthnicity(event.target.value)}
              maxLength={80}
            />
          </label>

          <label className="field">
            <span>Zodiac sign</span>
            <select
              value={zodiac}
              onChange={(event) => setZodiac(event.target.value)}
            >
              {ZODIAC_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option || 'Prefer not to say'}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Smoke</span>
            <select
              value={smoke}
              onChange={(event) => setSmoke(event.target.value)}
            >
              {SMOKE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option || 'Prefer not to say'}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Drink</span>
            <select
              value={drink}
              onChange={(event) => setDrink(event.target.value)}
            >
              {DRINK_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option || 'Prefer not to say'}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Education</span>
            <select
              value={education}
              onChange={(event) => setEducation(event.target.value)}
            >
              {EDUCATION_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option || 'Prefer not to say'}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Occupation</span>
            <input
              value={occupation}
              onChange={(event) => setOccupation(event.target.value)}
              maxLength={80}
            />
          </label>
        </div>

        <button type="submit" className="button" disabled={busy}>
          {busy ? 'Saving…' : 'Save details'}
        </button>
        <FormMessage result={result} />
      </form>
    </Panel>
  )
}
