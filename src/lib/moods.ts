import { EMOTICON_BY_SHORTCUT, type Emoticon } from './emoticons'

const MOOD_LABEL_OVERRIDES: Readonly<Record<string, string>> = {
  '(h)': 'Happy',
}

export function defaultMoodLabel(emoticon: Emoticon) {
  return MOOD_LABEL_OVERRIDES[emoticon.shortcut.toLowerCase()] ?? emoticon.name
}

export function moodLabelForShortcut(shortcut: string) {
  const emoticon = EMOTICON_BY_SHORTCUT.get(shortcut.trim().toLowerCase())
  return emoticon ? defaultMoodLabel(emoticon) : ''
}
