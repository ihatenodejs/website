import { createFileRoute } from '@tanstack/react-router'
import { eq } from 'drizzle-orm'
import { db } from '~/server/db.server'
import { env } from '~/server/env.server'
import { profiles } from '~/server/schema'
import { getCurrentUser } from '~/server/session.server'
import {
  AvatarError,
  deleteUploadedAvatar,
  processAvatar,
} from '~/server/storage.server'

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024

export const Route = createFileRoute('/api/avatar-upload')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (request.headers.get('origin') !== env.APP_ORIGIN) {
          return Response.json(
            { ok: false, message: 'Cross-origin upload rejected.' },
            { status: 403 },
          )
        }

        const current = await getCurrentUser()
        if (!current) {
          return Response.json(
            { ok: false, message: 'Sign in to upload an avatar.' },
            { status: 401 },
          )
        }
        if (current.role !== 'admin') {
          return Response.json(
            { ok: false, message: 'Administrator access is required.' },
            { status: 403 },
          )
        }

        let form: FormData
        try {
          form = await request.formData()
        } catch {
          return Response.json(
            { ok: false, message: 'The upload could not be read.' },
            { status: 400 },
          )
        }

        const file = form.get('avatar')
        if (!(file instanceof File) || file.size === 0) {
          return Response.json(
            { ok: false, message: 'Choose a JPEG, PNG, or WebP image.' },
            { status: 400 },
          )
        }
        if (file.size > MAX_UPLOAD_BYTES) {
          return Response.json(
            { ok: false, message: 'The image is larger than 5 MiB.' },
            { status: 413 },
          )
        }

        let stored: { filename: string; url: string }
        try {
          stored = await processAvatar(Buffer.from(await file.arrayBuffer()))
        } catch (error) {
          const message =
            error instanceof AvatarError
              ? error.reason === 'too-large'
                ? 'The image is larger than 5 MiB.'
                : error.reason === 'too-many-pixels'
                  ? 'The image dimensions are too large.'
                  : 'Only valid JPEG, PNG, or WebP images are accepted.'
              : 'The image could not be processed.'
          return Response.json(
            { ok: false, message },
            { status: error instanceof AvatarError ? 400 : 500 },
          )
        }

        const previousAvatar = current.profile?.avatarUrl ?? null

        try {
          const updated = await db
            .update(profiles)
            .set({ avatarUrl: stored.url })
            .where(eq(profiles.userId, current.id))
            .returning({ userId: profiles.userId })

          if (updated.length === 0) {
            await deleteUploadedAvatar(stored.url)
            return Response.json(
              { ok: false, message: 'The profile could not be updated.' },
              { status: 500 },
            )
          }
        } catch {
          await deleteUploadedAvatar(stored.url)
          return Response.json(
            { ok: false, message: 'The avatar could not be saved.' },
            { status: 500 },
          )
        }

        if (previousAvatar && previousAvatar !== stored.url) {
          await deleteUploadedAvatar(previousAvatar)
        }

        return Response.json({ ok: true, avatarUrl: stored.url })
      },
    },
  },
})
