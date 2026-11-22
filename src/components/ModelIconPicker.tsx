import { ModelAvatar } from './ModelAvatar'
import {
  MODEL_ICON_KEYS,
  MODEL_ICON_LABELS,
  type ModelIconKey,
} from '~/lib/model-usage'

export type ModelIconDraft = 'auto' | ModelIconKey | 'none'

export function ModelIconPicker({
  name,
  value,
  onChange,
}: {
  name: string
  value: ModelIconDraft
  onChange: (value: ModelIconDraft) => void
}) {
  return (
    <fieldset className="model-icon-picker">
      <legend>Icon</legend>
      <label className="model-icon-option">
        <input
          type="radio"
          name={name}
          checked={value === 'auto'}
          onChange={() => onChange('auto')}
        />
        <span>Detect automatically</span>
      </label>
      {MODEL_ICON_KEYS.map((key) => (
        <label className="model-icon-option" key={key}>
          <input
            type="radio"
            name={name}
            checked={value === key}
            onChange={() => onChange(key)}
          />
          <ModelAvatar iconKey={key} name={key} size={14} />
          <span>{MODEL_ICON_LABELS[key]}</span>
        </label>
      ))}
      <label className="model-icon-option">
        <input
          type="radio"
          name={name}
          checked={value === 'none'}
          onChange={() => onChange('none')}
        />
        <span>No icon</span>
      </label>
    </fieldset>
  )
}
