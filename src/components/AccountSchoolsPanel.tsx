import { useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { FormMessage, type FormResult } from './FormMessage'
import { Panel } from './Panel'
import { STUDENT_STATUS_OPTIONS } from '~/lib/profile-details'
import { runAction } from '~/lib/run-action'
import { profileSchoolsUpdateSchema } from '~/lib/validation'
import {
  updateSchoolsFn,
  type ProfileSchool,
  type PublicProfile,
} from '~/server/profiles.functions'

type SchoolDraft = {
  key: string
  name: string
  location: string
  startYear: string
  endYear: string
  graduatedYear: string
  studentStatus: string
  major: string
  clubs: string
}

function toDraft(school: ProfileSchool): SchoolDraft {
  return {
    key: school.id,
    name: school.name,
    location: school.location,
    startYear: school.startYear?.toString() ?? '',
    endYear: school.endYear?.toString() ?? '',
    graduatedYear: school.graduatedYear?.toString() ?? '',
    studentStatus: school.studentStatus,
    major: school.major,
    clubs: school.clubs,
  }
}

function emptyDraft(): SchoolDraft {
  return {
    key: crypto.randomUUID(),
    name: '',
    location: '',
    startYear: '',
    endYear: '',
    graduatedYear: '',
    studentStatus: '',
    major: '',
    clubs: '',
  }
}

export function AccountSchoolsPanel({ profile }: { profile: PublicProfile }) {
  const router = useRouter()
  const [schools, setSchools] = useState<SchoolDraft[]>(() =>
    profile.schools.map(toDraft),
  )
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<FormResult>(null)

  function update(key: string, patch: Partial<SchoolDraft>) {
    setSchools((current) =>
      current.map((school) =>
        school.key === key ? { ...school, ...patch } : school,
      ),
    )
  }

  return (
    <Panel title="Schools" hint={`${schools.length}/5`}>
      <form
        className="stack-form"
        onSubmit={async (event) => {
          event.preventDefault()
          const years = schools.flatMap((school) =>
            [school.startYear, school.endYear, school.graduatedYear].map(
              (value) => (value.trim() === '' ? null : Number(value)),
            ),
          )
          if (
            years.some(
              (year) =>
                year !== null &&
                (!Number.isInteger(year) || year < 1900 || year > 2100),
            )
          ) {
            setResult({
              ok: false,
              message: 'Enter four-digit years from 1900 to 2100.',
            })
            return
          }

          setBusy(true)
          setResult(null)
          const payload = {
            schools: schools.map((school) => ({
              name: school.name,
              location: school.location,
              startYear:
                school.startYear.trim() === ''
                  ? null
                  : Number(school.startYear),
              endYear:
                school.endYear.trim() === '' ? null : Number(school.endYear),
              graduatedYear:
                school.graduatedYear.trim() === ''
                  ? null
                  : Number(school.graduatedYear),
              studentStatus: school.studentStatus,
              major: school.major,
              clubs: school.clubs,
            })),
          }
          const parsed = profileSchoolsUpdateSchema.safeParse(payload)
          if (!parsed.success) {
            setBusy(false)
            setResult({
              ok: false,
              message:
                parsed.error.issues[0]?.message ??
                'Check the schools and try again.',
            })
            return
          }

          const next = await runAction(
            () => updateSchoolsFn({ data: parsed.data }),
            'Your schools could not be saved. Try again.',
          )
          setBusy(false)
          setResult(next)
          if (next.ok) {
            setSchools(next.schools.map(toDraft))
            await router.invalidate()
          }
        }}
      >
        <p className="field-note">
          Optional. Up to five schools appear in a card under the details on
          your profile.
        </p>

        {schools.length === 0 ? (
          <p className="empty">No schools added.</p>
        ) : null}

        {schools.map((school, index) => (
          <fieldset className="school-editor" key={school.key}>
            <legend>School {index + 1}</legend>

            <label className="field">
              <span>School name</span>
              <input
                value={school.name}
                onChange={(event) =>
                  update(school.key, { name: event.target.value })
                }
                maxLength={120}
                required
              />
            </label>

            <label className="field">
              <span>Location</span>
              <input
                value={school.location}
                onChange={(event) =>
                  update(school.key, { location: event.target.value })
                }
                maxLength={120}
                placeholder="Los Angeles, California"
              />
            </label>

            <div className="school-years">
              <label className="field">
                <span>Start year</span>
                <input
                  type="number"
                  min={1900}
                  max={2100}
                  value={school.startYear}
                  onChange={(event) =>
                    update(school.key, { startYear: event.target.value })
                  }
                />
              </label>
              <label className="field">
                <span>End year</span>
                <input
                  type="number"
                  min={1900}
                  max={2100}
                  value={school.endYear}
                  onChange={(event) =>
                    update(school.key, { endYear: event.target.value })
                  }
                />
              </label>
              <label className="field">
                <span>Graduated</span>
                <input
                  type="number"
                  min={1900}
                  max={2100}
                  value={school.graduatedYear}
                  onChange={(event) =>
                    update(school.key, { graduatedYear: event.target.value })
                  }
                />
              </label>
            </div>

            <label className="field">
              <span>Student status</span>
              <select
                value={school.studentStatus}
                onChange={(event) =>
                  update(school.key, { studentStatus: event.target.value })
                }
              >
                {STUDENT_STATUS_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option || 'Not specified'}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>Major</span>
              <input
                value={school.major}
                onChange={(event) =>
                  update(school.key, { major: event.target.value })
                }
                maxLength={120}
              />
            </label>

            <label className="field">
              <span>Clubs</span>
              <input
                value={school.clubs}
                onChange={(event) =>
                  update(school.key, { clubs: event.target.value })
                }
                maxLength={120}
              />
            </label>

            <button
              type="button"
              className="button-quiet"
              onClick={() =>
                setSchools((current) =>
                  current.filter((entry) => entry.key !== school.key),
                )
              }
            >
              Remove school
            </button>
          </fieldset>
        ))}

        <div className="button-row">
          <button
            type="button"
            className="button-quiet"
            disabled={schools.length >= 5}
            onClick={() => setSchools((current) => [...current, emptyDraft()])}
          >
            Add school
          </button>
          <button type="submit" className="button" disabled={busy}>
            {busy ? 'Saving…' : 'Save schools'}
          </button>
        </div>
        <FormMessage result={result} />
      </form>
    </Panel>
  )
}
