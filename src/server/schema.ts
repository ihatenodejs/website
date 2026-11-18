import { sql } from 'drizzle-orm'
import {
  check,
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core'
import { user } from './auth-schema'

export * from './auth-schema'

export const appState = pgTable('app_state', {
  key: text('key').primaryKey(),
  completedAt: timestamp('completed_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  homeUserId: text('home_user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'restrict' }),
})

export const siteSettings = pgTable(
  'site_settings',
  {
    id: text('id').primaryKey(),
    theme: text('theme').default('night').notNull(),
  },
  (table) => [
    check(
      'site_settings_theme_valid',
      sql`${table.theme} in ('night', 'blue', 'pink')`,
    ),
  ],
)

export const profiles = pgTable(
  'profiles',
  {
    userId: text('user_id')
      .primaryKey()
      .references(() => user.id, { onDelete: 'cascade' }),
    username: text('username').notNull(),
    displayName: text('display_name').notNull(),
    tagline: text('tagline').default('').notNull(),
    bio: text('bio').default('').notNull(),
    contactDiscord: text('contact_discord').default('').notNull(),
    contactX: text('contact_x').default('').notNull(),
    contactEmail: text('contact_email').default('').notNull(),
    contactTelegram: text('contact_telegram').default('').notNull(),
    contactGithub: text('contact_github').default('').notNull(),
    contactInstagram: text('contact_instagram').default('').notNull(),
    avatarUrl: text('avatar_url'),
    theme: text('theme').default('blue').notNull(),
    preferredTheme: text('preferred_theme'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex('profiles_username_unique').on(table.username),
    check(
      'profiles_username_format',
      sql`${table.username} ~ '^[a-z0-9_]{3,24}$'`,
    ),
    check(
      'profiles_theme_valid',
      sql`${table.theme} in ('night', 'blue', 'pink')`,
    ),
    check(
      'profiles_preferred_theme_valid',
      sql`${table.preferredTheme} is null or ${table.preferredTheme} in ('night', 'blue', 'pink')`,
    ),
    check(
      'profiles_display_name_length',
      sql`char_length(${table.displayName}) between 1 and 80`,
    ),
    check('profiles_bio_length', sql`char_length(${table.bio}) <= 2000`),
    check('profiles_tagline_length', sql`char_length(${table.tagline}) <= 160`),
    check(
      'profiles_contact_discord_length',
      sql`char_length(${table.contactDiscord}) <= 32`,
    ),
    check(
      'profiles_contact_x_length',
      sql`char_length(${table.contactX}) <= 15`,
    ),
    check(
      'profiles_contact_email_length',
      sql`char_length(${table.contactEmail}) <= 254`,
    ),
    check(
      'profiles_contact_telegram_length',
      sql`char_length(${table.contactTelegram}) <= 32`,
    ),
    check(
      'profiles_contact_github_length',
      sql`char_length(${table.contactGithub}) <= 39`,
    ),
    check(
      'profiles_contact_instagram_length',
      sql`char_length(${table.contactInstagram}) <= 30`,
    ),
  ],
)

export const comments = pgTable(
  'comments',
  {
    id: text('id').primaryKey(),
    authorId: text('author_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    targetUserId: text('target_user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    body: text('body').notNull(),
    status: text('status').default('pending').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('comments_target_status_created_idx').on(
      table.targetUserId,
      table.status,
      table.createdAt,
    ),
    index('comments_status_created_idx').on(table.status, table.createdAt),
    index('comments_author_created_idx').on(table.authorId, table.createdAt),
    check(
      'comments_status_valid',
      sql`${table.status} in ('pending', 'approved')`,
    ),
    check(
      'comments_body_length',
      sql`char_length(${table.body}) between 1 and 500`,
    ),
  ],
)
