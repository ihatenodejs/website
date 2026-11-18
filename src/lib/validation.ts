import { z } from 'zod'
import { THEMES } from './theme'

export const USERNAME_PATTERN = /^[a-z0-9_]{3,24}$/

export const usernameSchema = z
  .string()
  .trim()
  .min(3, 'Username must be at least 3 characters.')
  .max(24, 'Username must be 24 characters or fewer.')
  .transform((value) => value.trim().toLowerCase())
  .pipe(
    z
      .string()
      .regex(
        USERNAME_PATTERN,
        'Use 3 to 24 lowercase letters, digits, or underscores.',
      ),
  )

export const displayNameSchema = z
  .string()
  .trim()
  .min(1, 'Display name is required.')
  .max(80, 'Display name must be 80 characters or fewer.')

export const bioSchema = z
  .string()
  .trim()
  .max(2000, 'Bio must be 2000 characters or fewer.')

export const taglineSchema = z
  .string()
  .trim()
  .max(160, 'Tagline must be 160 characters or fewer.')

function handleSchema(
  max: number,
  pattern: RegExp,
  message: string,
  lowercase = false,
) {
  return z
    .string()
    .trim()
    .transform((value) => {
      const stripped = value.replace(/^@+/, '').trim()
      return lowercase ? stripped.toLowerCase() : stripped
    })
    .pipe(
      z
        .string()
        .max(max, message)
        .refine((value) => value === '' || pattern.test(value), message),
    )
}

const contactEmailValue = z.email('Enter a valid email address.')

export const contactValuesSchema = z.object({
  discord: handleSchema(
    32,
    /^[a-z0-9._]{2,32}$/,
    'Use 2 to 32 letters, digits, dots, or underscores.',
    true,
  ),
  x: handleSchema(
    15,
    /^[A-Za-z0-9_]{1,15}$/,
    'Use 1 to 15 letters, digits, or underscores.',
  ),
  email: z
    .string()
    .trim()
    .max(254, 'Email must be 254 characters or fewer.')
    .transform((value) => value.toLowerCase())
    .refine(
      (value) => value === '' || contactEmailValue.safeParse(value).success,
      'Enter a valid email address.',
    ),
  telegram: handleSchema(
    32,
    /^[A-Za-z0-9_]{5,32}$/,
    'Use 5 to 32 letters, digits, or underscores.',
  ),
  github: handleSchema(
    39,
    /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?$/,
    'Use 1 to 39 letters, digits, or hyphens, with no hyphen at either end.',
  ),
  instagram: handleSchema(
    30,
    /^[A-Za-z0-9._]{1,30}$/,
    'Use 1 to 30 letters, digits, dots, or underscores.',
  ).refine(
    (value) => value === '' || (!value.includes('..') && !value.endsWith('.')),
    'Periods cannot repeat or end the name.',
  ),
})

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .max(254, 'Email must be 254 characters or fewer.')
  .pipe(z.email('Enter a valid email address.'))

export const passwordSchema = z
  .string()
  .min(10, 'Password must be at least 10 characters.')
  .max(128, 'Password must be 128 characters or fewer.')

export const commentBodySchema = z
  .string()
  .trim()
  .min(1, 'Write a comment first.')
  .max(500, 'Comments are limited to 500 characters.')

export const avatarUrlSchema = z
  .string()
  .trim()
  .max(500, 'Avatar URL must be 500 characters or fewer.')
  .refine(
    (value) => value === '' || /^https:\/\//i.test(value),
    'Avatar URL must start with https://',
  )
  .refine((value) => {
    if (value === '') return true
    try {
      new URL(value)
      return true
    } catch {
      return false
    }
  }, 'Enter a valid URL.')

export const themeSchema = z.enum(THEMES)

export const siteThemeSchema = z.object({ theme: themeSchema })

export const themePreferenceSchema = z.object({
  theme: themeSchema.nullable(),
})

export const profileUpdateSchema = z.object({
  displayName: displayNameSchema,
  tagline: taglineSchema,
  bio: bioSchema,
  username: usernameSchema,
  theme: themeSchema,
  avatarUrl: avatarUrlSchema,
  clearAvatar: z.boolean().default(false),
})

export const contactsUpdateSchema = z.object({
  contacts: contactValuesSchema,
})

export const signupSchema = z.object({
  username: usernameSchema,
  displayName: displayNameSchema,
  email: emailSchema,
  password: passwordSchema,
  captchaToken: z.string().min(1, 'Complete the verification challenge.'),
})

export const setupSchema = signupSchema.extend({
  secret: z.string().min(1, 'Bootstrap secret is required.'),
})

export const signinSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required.'),
})

export const commentCreateSchema = z.object({
  targetUserId: z.string().min(1),
  body: commentBodySchema,
})

export const commentDeleteSchema = z.object({
  commentId: z.string().min(1),
})

export const moderationSchema = z.object({
  commentId: z.string().min(1),
  action: z.enum(['approve', 'reject', 'remove']),
})

export const roleUpdateSchema = z.object({
  userId: z.string().min(1),
  role: z.enum(['admin', 'user']),
})

export const userDeleteSchema = z.object({
  userId: z.string().min(1),
  confirmation: z.string().min(1),
})

export const selfDeleteSchema = z.object({
  confirmation: z.string().min(1),
})

export const MEMBERS_PAGE_SIZE = 20
export const COMMENTS_PAGE_SIZE = 20
export const ADMIN_PAGE_SIZE = 20
export const MAX_SEARCH_LENGTH = 80

export type SearchParse<T> = {
  value: T
  invalid: boolean
  message: string | null
}

export function parseSearchQuery(raw: unknown): SearchParse<string> {
  if (raw === undefined || raw === null || raw === '') {
    return { value: '', invalid: false, message: null }
  }
  if (typeof raw !== 'string') {
    return {
      value: '',
      invalid: true,
      message: 'Search must be text. Showing all entries.',
    }
  }
  const trimmed = raw.trim()
  if (trimmed.length > MAX_SEARCH_LENGTH) {
    return {
      value: trimmed.slice(0, MAX_SEARCH_LENGTH),
      invalid: true,
      message: `Search was shortened to ${MAX_SEARCH_LENGTH} characters.`,
    }
  }
  return { value: trimmed, invalid: false, message: null }
}

export function parsePage(raw: unknown): SearchParse<number> {
  if (raw === undefined || raw === null || raw === '') {
    return { value: 1, invalid: false, message: null }
  }
  const value =
    typeof raw === 'number'
      ? raw
      : typeof raw === 'string' && /^\d+$/.test(raw)
        ? Number(raw)
        : Number.NaN
  if (!Number.isInteger(value) || value < 1) {
    return {
      value: 1,
      invalid: true,
      message: 'Page number was invalid. Showing page 1.',
    }
  }
  return { value, invalid: false, message: null }
}

export function parseStatus(raw: unknown): 'pending' | 'approved' {
  return raw === 'approved' ? 'approved' : 'pending'
}

export function escapeLike(value: string) {
  return value.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_')
}
