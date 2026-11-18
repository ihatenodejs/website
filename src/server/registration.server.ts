import { AsyncLocalStorage } from 'node:async_hooks'
import type { Theme } from '~/lib/theme'

export type RegistrationIntent = {
  mode: 'setup' | 'normal'
  username: string
  displayName: string
  bio: string
  avatarUrl: string | null
  theme: Theme
  createdUserId?: string
}

export const registrationStorage = new AsyncLocalStorage<RegistrationIntent>()
