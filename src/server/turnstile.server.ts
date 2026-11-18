import { env } from './env.server'

type SiteVerifyResponse = {
  success?: boolean
  'error-codes'?: string[]
}

export async function verifyTurnstile(token: string): Promise<boolean> {
  const body = new URLSearchParams({
    secret: env.TURNSTILE_SECRET_KEY,
    response: token,
  })

  try {
    const response = await fetch(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      {
        method: 'POST',
        body,
        signal: AbortSignal.timeout(8000),
      },
    )
    if (!response.ok) return false
    const result = (await response.json()) as SiteVerifyResponse
    return result.success === true
  } catch {
    return false
  }
}
