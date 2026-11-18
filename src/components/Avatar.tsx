import { useEffect, useState } from 'react'

type AvatarSize = 'hero' | 'large' | 'small'

const SIZES: Record<AvatarSize, number> = {
  hero: 180,
  large: 64,
  small: 44,
}

export function Avatar({
  src,
  name,
  size = 'small',
}: {
  src: string | null
  name: string
  size?: AvatarSize
}) {
  const [failed, setFailed] = useState(false)
  const pixels = SIZES[size]
  const initial = name.trim().charAt(0).toUpperCase() || '?'

  useEffect(() => {
    setFailed(false)
  }, [src])

  if (!src || failed) {
    return (
      <span
        className={`avatar avatar-fallback avatar-${size}`}
        style={{ width: pixels, height: pixels }}
        aria-hidden="true"
      >
        {initial}
      </span>
    )
  }

  return (
    <img
      className={`avatar avatar-${size}`}
      src={src}
      alt={`${name}'s profile picture`}
      width={pixels}
      height={pixels}
      style={{ width: pixels, height: pixels }}
      referrerPolicy="no-referrer"
      loading={size === 'hero' ? 'eager' : 'lazy'}
      fetchPriority={size === 'hero' ? 'high' : 'auto'}
      decoding="async"
      onError={() => setFailed(true)}
    />
  )
}
