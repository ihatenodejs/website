import { eq } from 'drizzle-orm'
import { DEFAULT_SITE_THEME, isTheme, type Theme } from '~/lib/theme'
import { db } from './db.server'
import { siteSettings } from './schema'

const SETTINGS_ID = 'site'

export async function getSiteTheme(): Promise<Theme> {
  const [row] = await db
    .select({ theme: siteSettings.theme })
    .from(siteSettings)
    .where(eq(siteSettings.id, SETTINGS_ID))
    .limit(1)
  return row && isTheme(row.theme) ? row.theme : DEFAULT_SITE_THEME
}

export async function saveSiteTheme(theme: Theme) {
  await db
    .insert(siteSettings)
    .values({ id: SETTINGS_ID, theme })
    .onConflictDoUpdate({
      target: siteSettings.id,
      set: { theme },
    })
}
