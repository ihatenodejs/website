export const THEMES = ['night', 'blue', 'pink'] as const

export type Theme = (typeof THEMES)[number]

export const THEME_LABELS: Record<Theme, string> = {
  night: 'Night purple',
  blue: 'Reference blue',
  pink: 'Burgundy pink',
}

export const DEFAULT_THEME: Theme = 'blue'

export const DEFAULT_SITE_THEME: Theme = 'night'

export const THEME_PAGE_COLORS: Record<Theme, string> = {
  night: '#160e28',
  blue: '#06182e',
  pink: '#240b18',
}

export function isTheme(value: unknown): value is Theme {
  return typeof value === 'string' && (THEMES as readonly string[]).includes(value)
}
