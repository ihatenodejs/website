import { describe, expect, it } from 'vitest'
import {
  avatarUrlSchema,
  commentBodySchema,
  contactValuesSchema,
  escapeLike,
  parsePage,
  parseSearchQuery,
  profileUpdateSchema,
  usernameSchema,
} from '../src/lib/validation'

describe('usernameSchema', () => {
  it('normalizes case and trims whitespace', () => {
    expect(usernameSchema.parse('  P0ntus_User  ')).toBe('p0ntus_user')
  })

  it('rejects short, long, and punctuated usernames', () => {
    expect(usernameSchema.safeParse('ab').success).toBe(false)
    expect(usernameSchema.safeParse('a'.repeat(25)).success).toBe(false)
    expect(usernameSchema.safeParse('has space').success).toBe(false)
    expect(usernameSchema.safeParse('dash-name').success).toBe(false)
  })
})

describe('avatarUrlSchema', () => {
  it('accepts empty and HTTPS URLs', () => {
    expect(avatarUrlSchema.parse('')).toBe('')
    expect(avatarUrlSchema.parse('https://example.com/a.png')).toBe(
      'https://example.com/a.png',
    )
  })

  it('rejects HTTP, FTP, and malformed URLs', () => {
    expect(avatarUrlSchema.safeParse('http://example.com/a.png').success).toBe(
      false,
    )
    expect(avatarUrlSchema.safeParse('ftp://example.com/a.png').success).toBe(
      false,
    )
    expect(avatarUrlSchema.safeParse('not a url').success).toBe(false)
  })
})

describe('commentBodySchema', () => {
  it('accepts a plain comment and rejects empty or oversized bodies', () => {
    expect(commentBodySchema.parse(' hello ')).toBe('hello')
    expect(commentBodySchema.safeParse('   ').success).toBe(false)
    expect(commentBodySchema.safeParse('a'.repeat(501)).success).toBe(false)
    expect(commentBodySchema.safeParse('a'.repeat(500)).success).toBe(true)
  })
})

describe('profileUpdateSchema', () => {
  it('defaults clearAvatar to false and normalizes the username', () => {
    const parsed = profileUpdateSchema.parse({
      displayName: 'Name',
      tagline: '',
      bio: '',
      username: 'Mixed_Case',
      theme: 'pink',
      avatarUrl: '',
    })
    expect(parsed.clearAvatar).toBe(false)
    expect(parsed.username).toBe('mixed_case')
  })
})

describe('contactValuesSchema', () => {
  it('normalizes leading @ signs and empty values', () => {
    const parsed = contactValuesSchema.parse({
      discord: '@Example.User',
      x: '@ExampleUser',
      email: ' EXAMPLE@Example.com ',
      telegram: '@example_user',
      github: '@example-user',
      instagram: '@example.name',
    })
    expect(parsed.discord).toBe('example.user')
    expect(parsed.x).toBe('ExampleUser')
    expect(parsed.email).toBe('example@example.com')
    expect(parsed.telegram).toBe('example_user')
    expect(parsed.github).toBe('example-user')
    expect(parsed.instagram).toBe('example.name')

    expect(
      contactValuesSchema.parse({
        discord: '',
        x: '',
        email: '',
        telegram: '',
        github: '',
        instagram: '',
      }).discord,
    ).toBe('')
  })

  it('rejects malformed handles and email addresses', () => {
    const empty = {
      discord: '',
      x: '',
      email: '',
      telegram: '',
      github: '',
      instagram: '',
    }
    expect(
      contactValuesSchema.safeParse({ ...empty, telegram: 'abc' }).success,
    ).toBe(false)
    expect(
      contactValuesSchema.safeParse({ ...empty, github: '-example' }).success,
    ).toBe(false)
    expect(
      contactValuesSchema.safeParse({ ...empty, instagram: 'a..b' }).success,
    ).toBe(false)
    expect(
      contactValuesSchema.safeParse({ ...empty, email: 'not-an-email' })
        .success,
    ).toBe(false)
  })
})

describe('search parsing', () => {
  it('trims and flags over-long queries', () => {
    expect(parseSearchQuery('  member  ')).toEqual({
      value: 'member',
      invalid: false,
      message: null,
    })
    const long = parseSearchQuery('a'.repeat(90))
    expect(long.value).toHaveLength(80)
    expect(long.invalid).toBe(true)
  })

  it('falls back to page 1 on invalid page values', () => {
    for (const raw of ['0', '-2', 'abc', '1.5', 0, -1]) {
      const parsed = parsePage(raw)
      expect(parsed.value).toBe(1)
      expect(parsed.invalid).toBe(true)
    }
    expect(parsePage('3')).toEqual({
      value: 3,
      invalid: false,
      message: null,
    })
  })

  it('escapes LIKE wildcards', () => {
    expect(escapeLike('100%_done\\')).toBe('100\\%\\_done\\\\')
  })
})
