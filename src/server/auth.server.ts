import { drizzleAdapter } from '@better-auth/drizzle-adapter'
import { betterAuth } from 'better-auth'
import { APIError } from 'better-auth/api'
import { captcha } from 'better-auth/plugins'
import { tanstackStartCookies } from 'better-auth/tanstack-start'
import { eq } from 'drizzle-orm'
import { getBootstrapState } from './bootstrap.server'
import { db } from './db.server'
import { env } from './env.server'
import { registrationStorage } from './registration.server'
import { appState, profiles, user } from './schema'
import * as schema from './schema'

export const auth = betterAuth({
  appName: 'p0ntus',
  baseURL: env.APP_ORIGIN,
  secret: env.BETTER_AUTH_SECRET,
  trustedOrigins: [env.APP_ORIGIN],
  database: drizzleAdapter(db, { provider: 'pg', schema }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 10,
    maxPasswordLength: 128,
  },
  user: {
    additionalFields: {
      role: {
        type: 'string',
        required: true,
        defaultValue: 'user',
        input: false,
      },
    },
    changeEmail: { enabled: false },
    deleteUser: { enabled: false },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 30,
    updateAge: 60 * 60 * 24,
  },
  disabledPaths: [
    '/update-user',
    '/delete-user',
    '/change-email',
    '/change-password',
    '/set-password',
    '/request-password-reset',
    '/reset-password',
    '/reset-password/:token',
    '/send-verification-email',
    '/verify-email',
  ],
  advanced: {
    useSecureCookies: env.APP_ORIGIN.startsWith('https://'),
  },
  plugins: [
    captcha({
      provider: 'cloudflare-turnstile',
      secretKey: env.TURNSTILE_SECRET_KEY,
      endpoints: ['/sign-up/email'],
    }),
    tanstackStartCookies(),
  ],
  databaseHooks: {
    user: {
      create: {
        before: async (userData) => {
          const intent = registrationStorage.getStore()
          if (!intent) {
            throw new APIError('FORBIDDEN', {
              message: 'Create accounts through the signup form.',
              code: 'SIGNUP_REQUIRED',
            })
          }

          const bootstrap = await getBootstrapState()

          if (intent.mode === 'normal') {
            if (!bootstrap.complete) {
              throw new APIError('FORBIDDEN', {
                message: 'This site is not open for registration yet.',
                code: 'SETUP_REQUIRED',
              })
            }
          } else {
            if (bootstrap.complete || bootstrap.adminCount > 0) {
              throw new APIError('FORBIDDEN', {
                message: 'Setup is already complete.',
                code: 'SETUP_COMPLETE',
              })
            }
            if (!env.HOME_USERNAME || intent.username !== env.HOME_USERNAME) {
              throw new APIError('BAD_REQUEST', {
                message:
                  'The first account must use the configured home username.',
                code: 'HOME_USERNAME_MISMATCH',
              })
            }
          }

          const [existing] = await db
            .select({ userId: profiles.userId })
            .from(profiles)
            .where(eq(profiles.username, intent.username))
            .limit(1)

          if (existing) {
            throw new APIError('CONFLICT', {
              message: 'That username is already taken.',
              code: 'USERNAME_TAKEN',
            })
          }

          return {
            data: {
              ...userData,
              role: intent.mode === 'setup' ? 'admin' : 'user',
            },
          }
        },
        after: async (createdUser) => {
          const intent = registrationStorage.getStore()
          if (!intent) {
            await db.delete(user).where(eq(user.id, createdUser.id))
            throw new APIError('FORBIDDEN', {
              message: 'Create accounts through the signup form.',
              code: 'SIGNUP_REQUIRED',
            })
          }

          try {
            await db.transaction(async (tx) => {
              await tx.insert(profiles).values({
                userId: createdUser.id,
                username: intent.username,
                displayName: intent.displayName,
                bio: intent.bio,
                avatarUrl: intent.avatarUrl,
                theme: intent.theme,
              })

              if (intent.mode === 'setup') {
                await tx.insert(appState).values({
                  key: 'bootstrap',
                  homeUserId: createdUser.id,
                })
              }
            })
          } catch (error) {
            await db.transaction(async (tx) => {
              await tx
                .delete(appState)
                .where(eq(appState.homeUserId, createdUser.id))
              await tx.delete(user).where(eq(user.id, createdUser.id))
            })
            throw new APIError('BAD_REQUEST', {
              message:
                error instanceof APIError
                  ? error.message
                  : 'The account was created without a profile and has been rolled back.',
              code: 'PROFILE_CREATE_FAILED',
            })
          }

          intent.createdUserId = createdUser.id
        },
      },
    },
  },
})
