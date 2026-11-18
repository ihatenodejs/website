import { createServerFn } from '@tanstack/react-start'
import { getRequestHeaders } from '@tanstack/react-start/server'
import { deleteIncompleteUser } from './accounts.server'
import { auth } from './auth.server'
import { getBootstrapState } from './bootstrap.server'
import { env } from './env.server'
import { messageFromAuthError, type ActionResult } from './errors.server'
import {
  registrationStorage,
  type RegistrationIntent,
} from './registration.server'
import { getCurrentUser } from './session.server'
import { verifyTurnstile } from './turnstile.server'
import { signinSchema, signupSchema } from '~/lib/validation'
import { isTheme, type Theme } from '~/lib/theme'

export const signUpFn = createServerFn({ method: 'POST' })
  .validator(signupSchema)
  .handler(async ({ data }): Promise<ActionResult> => {
    const captchaOk = await verifyTurnstile(data.captchaToken)
    if (!captchaOk) {
      return {
        ok: false,
        message:
          'Verification failed or expired. Complete the challenge again and retry.',
      }
    }

    const bootstrap = await getBootstrapState()
    if (!bootstrap.complete) {
      return {
        ok: false,
        message: 'Registration opens after the first administrator completes setup.',
      }
    }

    const intent: RegistrationIntent = {
      mode: 'normal',
      username: data.username,
      displayName: data.displayName,
      bio: '',
      avatarUrl: null,
      theme: 'blue',
    }

    const headers = new Headers(getRequestHeaders())
    headers.set('x-captcha-response', data.captchaToken)

    try {
      await registrationStorage.run(intent, () =>
        auth.api.signUpEmail({
          body: {
            email: data.email,
            password: data.password,
            name: data.displayName,
          },
          headers,
        }),
      )
    } catch (error) {
      if (intent.createdUserId) {
        await deleteIncompleteUser(intent.createdUserId).catch(() => undefined)
      }
      return {
        ok: false,
        message: messageFromAuthError(
          error,
          'The account could not be created. Try again.',
        ),
      }
    }

    return { ok: true }
  })

export const signInFn = createServerFn({ method: 'POST' })
  .validator(signinSchema)
  .handler(async ({ data }): Promise<ActionResult> => {
    try {
      await auth.api.signInEmail({
        body: { email: data.email, password: data.password },
        headers: getRequestHeaders(),
      })
    } catch (error) {
      return {
        ok: false,
        message: messageFromAuthError(error, 'Email or password is incorrect.'),
      }
    }
    return { ok: true }
  })

export const signOutFn = createServerFn({ method: 'POST' }).handler(
  async (): Promise<ActionResult> => {
    await auth.api.signOut({ headers: getRequestHeaders() })
    return { ok: true }
  },
)

export type SessionSummary = {
  id: string
  displayName: string
  username: string | null
  isAdmin: boolean
  themePreference: Theme | null
}

export const getSessionSummaryFn = createServerFn({ method: 'GET' }).handler(
  async (): Promise<SessionSummary | null> => {
    const current = await getCurrentUser()
    if (!current) return null

    return {
      id: current.id,
      displayName: current.profile?.displayName ?? current.name,
      username: current.profile?.username ?? null,
      isAdmin: current.role === 'admin',
      themePreference: isTheme(current.profile?.preferredTheme)
        ? current.profile.preferredTheme
        : null,
    }
  },
)

export const getPublicConfigFn = createServerFn({ method: 'GET' }).handler(
  async () => {
    const bootstrap = await getBootstrapState()
    return {
      siteKey: env.TURNSTILE_SITE_KEY,
      registrationOpen: bootstrap.complete,
      setupComplete: bootstrap.complete,
      adminCount: bootstrap.adminCount,
      homeUsername: env.HOME_USERNAME,
    }
  },
)
