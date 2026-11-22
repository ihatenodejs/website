import { createFileRoute } from '@tanstack/react-router'
import { AGENT_EXPORT_MAX_BYTES } from '~/lib/validation'
import { createAgentSyncRun, mergeAgentExport } from '~/server/connections.server'
import { AgentExportError, parseAgentExport } from '~/server/agent-export.server'
import { env } from '~/server/env.server'
import { getCurrentUser } from '~/server/session.server'

export const Route = createFileRoute('/api/agent-export')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const fail = (message: string, status: number) =>
          Response.json({ ok: false, message }, { status })

        if (request.headers.get('origin') !== env.APP_ORIGIN) {
          return fail('Cross-origin upload rejected.', 403)
        }

        const current = await getCurrentUser()
        if (!current) return fail('Sign in to upload usage.', 401)

        const contentLength = Number(request.headers.get('content-length'))
        if (
          Number.isFinite(contentLength) &&
          contentLength > AGENT_EXPORT_MAX_BYTES + 1024 * 1024
        ) {
          return fail('The file is larger than 10 MiB.', 413)
        }

        let form: FormData
        try {
          form = await request.formData()
        } catch {
          return fail('The upload could not be read.', 400)
        }

        const file = form.get('file')
        if (!(file instanceof File) || file.size === 0) {
          return fail('Choose an agent-exporter JSON file.', 400)
        }
        if (file.size > AGENT_EXPORT_MAX_BYTES) {
          return fail('The file is larger than 10 MiB.', 413)
        }

        let rows
        try {
          rows = parseAgentExport(JSON.parse(await file.text()))
        } catch (error) {
          if (error instanceof AgentExportError) return fail(error.message, 400)
          if (error instanceof SyntaxError) {
            return fail('The file is not valid JSON.', 400)
          }
          return fail('The export could not be read.', 500)
        }

        let run
        try {
          run = await createAgentSyncRun(current.id, file.name)
        } catch {
          return fail('The sync could not be started.', 500)
        }

        void mergeAgentExport(current.id, run.id, rows).catch((error) =>
          console.error('Agent export merge failed', error),
        )

        return Response.json({ ok: true, run }, { status: 202 })
      },
    },
  },
})
