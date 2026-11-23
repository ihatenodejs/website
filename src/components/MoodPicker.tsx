import { useState } from 'react'
import { EMOTICONS } from '~/lib/emoticons'
import { defaultMoodLabel } from '~/lib/moods'

export function MoodPicker({
  emoticon,
  label,
  onEmoticonChange,
  onLabelChange,
}: {
  emoticon: string
  label: string
  onEmoticonChange: (shortcut: string) => void
  onLabelChange: (label: string) => void
}) {
  const [pickerOpen, setPickerOpen] = useState(false)
  const selected =
    EMOTICONS.find(
      (entry) => entry.shortcut.toLowerCase() === emoticon.toLowerCase(),
    ) ?? null

  return (
    <div className="mood-field">
      <span className="field-label">Mood</span>

      <div className="mood-selected">
        {selected ? (
          <span className="mood-current">
            <img
              src={selected.src}
              alt=""
              width={19}
              height={19}
              className="emoticon"
            />
            {label || defaultMoodLabel(selected)}
          </span>
        ) : (
          <span className="field-note">No mood selected.</span>
        )}
        <button
          type="button"
          className="button-quiet"
          aria-expanded={pickerOpen}
          aria-controls="mood-emoticon-picker"
          onClick={() => setPickerOpen((open) => !open)}
        >
          {selected ? 'Change emoticon' : 'Choose emoticon'}
        </button>
        {selected ? (
          <button
            type="button"
            className="button-quiet"
            onClick={() => {
              setPickerOpen(false)
              onEmoticonChange('')
              onLabelChange('')
            }}
          >
            Clear mood
          </button>
        ) : null}
      </div>

      {pickerOpen ? (
        <div
          id="mood-emoticon-picker"
          className="emoticon-picker"
          role="radiogroup"
          aria-label="Mood emoticon"
        >
          {EMOTICONS.map((entry) => {
            const checked =
              entry.shortcut.toLowerCase() === emoticon.toLowerCase()
            return (
              <button
                key={entry.shortcut}
                type="button"
                role="radio"
                aria-checked={checked}
                className={checked ? 'selected' : undefined}
                title={`${defaultMoodLabel(entry)} ${entry.shortcut}`}
                aria-label={defaultMoodLabel(entry)}
                onClick={() => {
                  onEmoticonChange(entry.shortcut)
                  onLabelChange(defaultMoodLabel(entry))
                  setPickerOpen(false)
                }}
              >
                <img src={entry.src} alt="" width={19} height={19} />
              </button>
            )
          })}
        </div>
      ) : null}

      <label className="field">
        <span>Mood label</span>
        <input
          value={label}
          onChange={(event) => onLabelChange(event.target.value)}
          maxLength={60}
          disabled={!selected}
          required={Boolean(selected)}
          placeholder={
            selected
              ? `Default: ${defaultMoodLabel(selected)}`
              : 'Choose an emoticon first'
          }
        />
        <span className="field-note">
          Defaults to the emoticon&apos;s label. Edit it to say something else.{' '}
          {label.length}/60
        </span>
      </label>
    </div>
  )
}
