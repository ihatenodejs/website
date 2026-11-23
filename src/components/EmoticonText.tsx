import { Fragment } from 'react'
import { EMOTICONS, EMOTICON_BY_SHORTCUT } from '~/lib/emoticons'

const byLongestFirst = [...EMOTICONS].sort(
  (left, right) => right.shortcut.length - left.shortcut.length,
)

function escapePattern(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

const PATTERN = new RegExp(
  `(${byLongestFirst.map((emoticon) => escapePattern(emoticon.shortcut)).join('|')})`,
  'gi',
)

export function EmoticonText({ text }: { text: string }) {
  if (!text) return null

  return (
    <>
      {text.split(PATTERN).map((part, index) => {
        const emoticon = EMOTICON_BY_SHORTCUT.get(part.toLowerCase())
        if (!emoticon) return <Fragment key={index}>{part}</Fragment>
        return (
          <img
            key={index}
            className="emoticon"
            src={emoticon.src}
            alt={emoticon.name}
            title={emoticon.name}
            width={19}
            height={19}
          />
        )
      })}
    </>
  )
}
