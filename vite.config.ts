import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import { nitro } from 'nitro/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    port: 3000,
  },
  resolve: {
    tsconfigPaths: true,
  },
  plugins: [
    tanstackStart({
      importProtection: {
        client: {
          files: ['**/*.server.ts', '**/*.server.tsx'],
          specifiers: [
            'pg',
            'sharp',
            'drizzle-orm',
            'drizzle-orm/node-postgres',
            '@better-auth/drizzle-adapter',
          ],
        },
      },
    }),
    nitro({ preset: 'bun' }),
    viteReact(),
  ],
})
