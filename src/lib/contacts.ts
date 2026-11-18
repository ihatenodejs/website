export const CONTACT_IDS = [
  'discord',
  'x',
  'email',
  'telegram',
  'github',
  'instagram',
] as const

export type ContactId = (typeof CONTACT_IDS)[number]

export type ContactValues = Record<ContactId, string>

export const EMPTY_CONTACTS: ContactValues = {
  discord: '',
  x: '',
  email: '',
  telegram: '',
  github: '',
  instagram: '',
}

type ContactDefinition = {
  id: ContactId
  label: string
  fieldLabel: string
  placeholder: string
  maxLength: number
  pattern: string | null
  display: (value: string) => string
  href: ((value: string) => string) | null
}

export const CONTACT_METHODS: readonly ContactDefinition[] = [
  {
    id: 'discord',
    label: 'Discord',
    fieldLabel: 'Discord username',
    placeholder: '@example',
    maxLength: 33,
    pattern: '@?[A-Za-z0-9._]{2,32}',
    display: (value) => `@${value}`,
    href: null,
  },
  {
    id: 'x',
    label: 'X',
    fieldLabel: 'X username',
    placeholder: '@example',
    maxLength: 16,
    pattern: '@?[A-Za-z0-9_]{1,15}',
    display: (value) => `@${value}`,
    href: (value) => `https://x.com/${encodeURIComponent(value)}`,
  },
  {
    id: 'email',
    label: 'Email',
    fieldLabel: 'Email address',
    placeholder: 'you@example.com',
    maxLength: 254,
    pattern: null,
    display: (value) => value,
    href: (value) => `mailto:${value}`,
  },
  {
    id: 'telegram',
    label: 'Telegram',
    fieldLabel: 'Telegram username',
    placeholder: '@example',
    maxLength: 33,
    pattern: '@?[A-Za-z0-9_]{5,32}',
    display: (value) => `@${value}`,
    href: (value) => `https://t.me/${encodeURIComponent(value)}`,
  },
  {
    id: 'github',
    label: 'GitHub',
    fieldLabel: 'GitHub username',
    placeholder: 'example',
    maxLength: 40,
    pattern: '@?[A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?',
    display: (value) => value,
    href: (value) => `https://github.com/${encodeURIComponent(value)}`,
  },
  {
    id: 'instagram',
    label: 'Instagram',
    fieldLabel: 'Instagram username',
    placeholder: '@example',
    maxLength: 31,
    pattern: '@?[A-Za-z0-9._]{1,30}',
    display: (value) => `@${value}`,
    href: (value) => `https://instagram.com/${encodeURIComponent(value)}`,
  },
]

export type ContactDisplay = {
  id: ContactId
  label: string
  value: string
  href: string | null
}

export function contactDisplays(values: ContactValues): ContactDisplay[] {
  const displays: ContactDisplay[] = []
  for (const method of CONTACT_METHODS) {
    const stored = values[method.id]?.trim()
    if (!stored) continue
    displays.push({
      id: method.id,
      label: method.label,
      value: method.display(stored),
      href: method.href ? method.href(stored) : null,
    })
  }
  return displays
}
