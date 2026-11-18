import { createServerFn } from '@tanstack/react-start'
import type { Theme } from '~/lib/theme'
import { siteThemeSchema } from '~/lib/validation'
import type { ActionResult } from './errors.server'
import { getAdminUser } from './session.server'
import { getSiteTheme, saveSiteTheme } from './settings.server'

export const getSiteThemeFn = createServerFn({ method: 'GET' }).handler(
  async () => getSiteTheme(),
)

export const updateSiteThemeFn = createServerFn({ method: 'POST' })
  .validator(siteThemeSchema)
  .handler(async ({ data }): Promise<ActionResult<{ theme: Theme }>> => {
    const admin = await getAdminUser()
    if (!admin) {
      return {
        ok: false,
        message: 'Only administrators can change the site color theme.',
      }
    }

    try {
      await saveSiteTheme(data.theme)
      return { ok: true, theme: data.theme }
    } catch {
      return {
        ok: false,
        message: 'The site color theme could not be saved. Try again.',
      }
    }
  })
