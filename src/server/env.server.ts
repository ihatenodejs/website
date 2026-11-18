import { z } from 'zod'

const rawEnvSchema = z.object({
  NODE_ENV: z.string().default('development'),
  APP_ORIGIN: z.url('APP_ORIGIN must be an absolute URL.'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required.'),
  BETTER_AUTH_SECRET: z
    .string()
    .min(32, 'BETTER_AUTH_SECRET must be at least 32 characters.'),
  BOOTSTRAP_SECRET: z
    .string()
    .min(16, 'BOOTSTRAP_SECRET must be at least 16 characters.'),
  HOME_USERNAME: z.string().trim().default(''),
  TURNSTILE_SITE_KEY: z.string().min(1, 'TURNSTILE_SITE_KEY is required.'),
  TURNSTILE_SECRET_KEY: z
    .string()
    .min(1, 'TURNSTILE_SECRET_KEY is required.'),
  UPLOAD_DIR: z.string().min(1, 'UPLOAD_DIR is required.'),
})

const parsed = rawEnvSchema.safeParse(process.env)

if (!parsed.success) {
  const fields = parsed.error.issues
    .map((issue) => `${issue.path.join('.') || 'environment'}: ${issue.message}`)
    .join('\n')
  throw new Error(`Invalid environment configuration:\n${fields}`)
}

if (
  parsed.data.HOME_USERNAME !== '' &&
  !/^[a-z0-9_]{3,24}$/.test(parsed.data.HOME_USERNAME)
) {
  throw new Error(
    'Invalid environment configuration:\nHOME_USERNAME must be 3 to 24 lowercase letters, digits, or underscores.',
  )
}

export const env = {
  ...parsed.data,
  APP_ORIGIN: parsed.data.APP_ORIGIN.replace(/\/+$/, ''),
  isProduction: parsed.data.NODE_ENV === 'production',
}
