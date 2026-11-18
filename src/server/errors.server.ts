import { APIError } from 'better-auth/api'

export type ActionResult<T = unknown> =
  | ({ ok: true } & T)
  | { ok: false; message: string }

export function messageFromAuthError(error: unknown, fallback: string) {
  if (error instanceof APIError) {
    const body = error.body as { message?: string } | undefined
    if (body?.message) return body.message
    if (error.message) return error.message
  }
  if (error instanceof Error && error.message) return error.message
  return fallback
}
