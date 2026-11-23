import { useRef, useState, type ChangeEvent } from 'react'
import { EMOTICONS } from '~/lib/emoticons'

type FieldElement = HTMLInputElement | HTMLTextAreaElement

export function EmoticonField({
  id,
  label,
  value,
  onChange,
  maxLength,
  rows,
  required,
  placeholder,
  note,
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  maxLength: number
  rows?: number
  required?: boolean
  placeholder?: string
  note?: string
}) {
  const [pickerOpen, setPickerOpen] = useState(false)
  const field = useRef<FieldElement>(null)
  const multiline = rows !== undefined

  function insert(shortcut: string) {
    const element = field.current
    const start = element?.selectionStart ?? value.length
    const end = element?.selectionEnd ?? value.length
    const next = value.slice(0, start) + shortcut + value.slice(end)
    if (next.length > maxLength) return
    onChange(next)
    requestAnimationFrame(() => {
      const caret = start + shortcut.length
      element?.focus()
      element?.setSelectionRange(caret, caret)
    })
  }

  const handleChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => onChange(event.target.value)

  return (
    <div className="emoticon-field">
      <label className="field" htmlFor={id}>
        <span>{label}</span>
        {multiline ? (
          <textarea
            id={id}
            ref={(element) => {
              field.current = element
            }}
            value={value}
            onChange={handleChange}
            rows={rows}
            required={required}
            maxLength={maxLength}
            placeholder={placeholder}
          />
        ) : (
          <input
            id={id}
            ref={(element) => {
              field.current = element
            }}
            value={value}
            onChange={handleChange}
            required={required}
            maxLength={maxLength}
            placeholder={placeholder}
          />
        )}
      </label>
      <div className="emoticon-tools">
        <button
          type="button"
          className="button-quiet emoticon-toggle"
          aria-expanded={pickerOpen}
          aria-controls={`${id}-picker`}
          onClick={() => setPickerOpen((open) => !open)}
        >
          Emoticons
        </button>
        {note ? <span className="field-note">{note}</span> : null}
      </div>
      {pickerOpen ? (
        <div
          id={`${id}-picker`}
          className="emoticon-picker"
          role="group"
          aria-label="MSN Messenger emoticons"
        >
          {EMOTICONS.map((emoticon) => (
            <button
              key={emoticon.shortcut}
              type="button"
              onClick={() => insert(emoticon.shortcut)}
              title={`${emoticon.name} ${emoticon.shortcut}`}
              aria-label={`Insert ${emoticon.name}`}
            >
              <img src={emoticon.src} alt="" width={19} height={19} />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
