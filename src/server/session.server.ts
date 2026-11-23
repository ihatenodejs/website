import { getRequestHeaders } from '@tanstack/react-start/server'
import { eq } from 'drizzle-orm'
import { auth } from './auth.server'
import { db } from './db.server'
import { profiles } from './schema'

export type ProfileRecord = {
  userId: string
  username: string
  displayName: string
  tagline: string
  bio: string
  profileLink: string
  detailStatus: string
  hereFor: string
  hometown: string
  ethnicity: string
  zodiac: string
  smoke: string
  drink: string
  education: string
  occupation: string
  contactDiscord: string
  contactX: string
  contactEmail: string
  contactTelegram: string
  contactGithub: string
  contactInstagram: string
  avatarUrl: string | null
  theme: string
  preferredTheme: string | null
  createdAt: Date
  updatedAt: Date
}

export type CurrentUser = {
  id: string
  email: string
  name: string
  role: 'admin' | 'user'
  profile: ProfileRecord | null
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await auth.api.getSession({ headers: getRequestHeaders() })
  if (!session) return null

  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.userId, session.user.id))
    .limit(1)

  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    role: session.user.role === 'admin' ? 'admin' : 'user',
    profile: profile ?? null,
  }
}

export async function getAdminUser() {
  const current = await getCurrentUser()
  return current?.role === 'admin' ? current : null
}
