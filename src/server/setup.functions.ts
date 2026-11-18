import { createServerFn } from '@tanstack/react-start'
import { getRequestHeaders } from '@tanstack/react-start/server'
import { createHash, timingSafeEqual } from 'node:crypto'
import { deleteIncompleteUser } from './accounts.server'
import { auth } from './auth.server'
import { getBootstrapState } from './bootstrap.server'
import { BOOTSTRAP_LOCK_KEY, pool } from './db.server'
import { env } from './env.server'
import { messageFromAuthError, type ActionResult } from './errors.server'
import {
  registrationStorage,
  type RegistrationIntent,
} from './registration.server'
import { verifyTurnstile } from './turnstile.server'
import { setupSchema } from '~/lib/validation'

function secretsMatch(provided: string) {
  const expected = createHash('sha256').update(env.BOOTSTRAP_SECRET).digest()
  const actual = createHash('sha256').update(provided).digest()
  return timingSafeEqual(expected, actual)
}

async function getSetupStatus() {
  const bootstrap = await getBootstrapState()

  if (!env.HOME_USERNAME) {
    return {
      allowed: false,
      complete: bootstrap.complete,
      adminCount: bootstrap.adminCount,
      reason:
        'HOME_USERNAME is not configured. Set it before running setup.',
    }
  }
  if (bootstrap.complete) {
    return {
      allowed: false,
      complete: true,
      adminCount: bootstrap.adminCount,
      reason: 'Setup is already complete.',
    }
  }
  if (bootstrap.adminCount > 0) {
    return {
      allowed: false,
      complete: false,
      adminCount: bootstrap.adminCount,
      reason:
        'An administrator exists without a bootstrap marker. Setup is locked to avoid creating a second one.',
    }
  }
  return {
    allowed: true,
    complete: false,
    adminCount: 0,
    reason: null,
  }
}

export const getSetupStateFn = createServerFn({ method: 'GET' }).handler(
  async () => {
    const status = await getSetupStatus()
    return {
      ...status,
      homeUsername: env.HOME_USERNAME,
      siteKey: env.TURNSTILE_SITE_KEY,
    }
  },
)

export const completeSetupFn = createServerFn({ method: 'POST' })
  .validator(setupSchema)
  .handler(async ({ data }): Promise<ActionResult> => {
    if (!secretsMatch(data.secret)) {
      return { ok: false, message: 'Bootstrap secret is incorrect.' }
    }
    if (!env.HOME_USERNAME) {
      return {
        ok: false,
        message: 'HOME_USERNAME is not configured. Setup cannot run.',
      }
    }
    if (data.username !== env.HOME_USERNAME) {
      return {
        ok: false,
        message: `The first account username must be ${env.HOME_USERNAME}.`,
      }
    }
    if (!(await verifyTurnstile(data.captchaToken))) {
      return {
        ok: false,
        message:
          'Verification failed or expired. Complete the challenge again and retry.',
      }
    }

    const client = await pool.connect()
    try {
      await client.query('SELECT pg_advisory_lock($1)', [BOOTSTRAP_LOCK_KEY])

      const status = await getSetupStatus()
      if (!status.allowed) {
        return { ok: false, message: status.reason ?? 'Setup is not available.' }
      }

      const intent: RegistrationIntent = {
        mode: 'setup',
        username: data.username,
        displayName: data.displayName,
        bio: '',
        avatarUrl: null,
        theme: 'night',
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
          await deleteIncompleteUser(intent.createdUserId).catch(
            () => undefined,
          )
        }
        return {
          ok: false,
          message: messageFromAuthError(
            error,
            'Setup failed before the administrator was created.',
          ),
        }
      }

      return { ok: true }
    } finally {
      try {
        await client.query('SELECT pg_advisory_unlock($1)', [
          BOOTSTRAP_LOCK_KEY,
        ])
      } finally {
        client.release()
      }
    }
  })
