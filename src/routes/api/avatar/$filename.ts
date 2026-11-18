import { createFileRoute } from '@tanstack/react-router'
import { readAvatar } from '~/server/storage.server'

export const Route = createFileRoute('/api/avatar/$filename')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const filename = new URL(request.url).pathname.split('/').pop() ?? ''
        const file = await readAvatar(filename)
        if (!file) {
          return new Response('Avatar not found.', { status: 404 })
        }

        return new Response(file, {
          headers: {
            'Content-Type': 'image/webp',
            'X-Content-Type-Options': 'nosniff',
            'Cache-Control': 'public, max-age=31536000, immutable',
          },
        })
      },
    },
  },
})
