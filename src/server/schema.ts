import { sql } from 'drizzle-orm'
import {
  bigint,
  boolean,
  check,
  index,
  integer,
  pgTable,
  primaryKey,
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

export const agentUsage = pgTable(
  'agent_usage',
  {
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    provider: text('provider').notNull(),
    usageDate: text('usage_date').notNull(),
    model: text('model').notNull(),
    inputTokens: bigint('input_tokens', { mode: 'number' }).notNull(),
    outputTokens: bigint('output_tokens', { mode: 'number' }).notNull(),
    cacheCreationTokens: bigint('cache_creation_tokens', {
      mode: 'number',
    }).notNull(),
    cacheReadTokens: bigint('cache_read_tokens', { mode: 'number' }).notNull(),
    costMicros: bigint('cost_micros', { mode: 'number' }).notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    primaryKey({
      columns: [
        table.userId,
        table.provider,
        table.usageDate,
        table.model,
      ],
    }),
    index('agent_usage_user_model_idx').on(table.userId, table.model),
    check(
      'agent_usage_date_format',
      sql`${table.usageDate} ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'`,
    ),
    check(
      'agent_usage_provider_length',
      sql`char_length(${table.provider}) between 1 and 64`,
    ),
    check(
      'agent_usage_model_length',
      sql`char_length(${table.model}) between 1 and 200`,
    ),
    check('agent_usage_input_tokens', sql`${table.inputTokens} >= 0`),
    check('agent_usage_output_tokens', sql`${table.outputTokens} >= 0`),
    check(
      'agent_usage_cache_creation_tokens',
      sql`${table.cacheCreationTokens} >= 0`,
    ),
    check('agent_usage_cache_read_tokens', sql`${table.cacheReadTokens} >= 0`),
    check('agent_usage_cost_micros', sql`${table.costMicros} >= 0`),
  ],
)

export const agentConnections = pgTable('agent_connections', {
  userId: text('user_id')
    .primaryKey()
    .references(() => user.id, { onDelete: 'cascade' }),
  showModels: boolean('show_models').default(false).notNull(),
  lastSyncedAt: timestamp('last_synced_at', { withTimezone: true }),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
})

export const agentSyncRuns = pgTable(
  'agent_sync_runs',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    status: text('status').default('queued').notNull(),
    fileName: text('file_name').notNull(),
    insertedCount: integer('inserted_count').default(0).notNull(),
    updatedCount: integer('updated_count').default(0).notNull(),
    unchangedCount: integer('unchanged_count').default(0).notNull(),
    providerCount: integer('provider_count').default(0).notNull(),
    dayCount: integer('day_count').default(0).notNull(),
    modelCount: integer('model_count').default(0).notNull(),
    totalTokens: bigint('total_tokens', { mode: 'number' })
      .default(0)
      .notNull(),
    totalCostMicros: bigint('total_cost_micros', { mode: 'number' })
      .default(0)
      .notNull(),
    earliestDate: text('earliest_date'),
    latestDate: text('latest_date'),
    errorMessage: text('error_message'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    startedAt: timestamp('started_at', { withTimezone: true }),
    completedAt: timestamp('completed_at', { withTimezone: true }),
  },
  (table) => [
    index('agent_sync_runs_user_created_idx').on(table.userId, table.createdAt),
    check(
      'agent_sync_runs_status_valid',
      sql`${table.status} in ('queued', 'running', 'complete', 'failed')`,
    ),
    check('agent_sync_runs_inserted_count', sql`${table.insertedCount} >= 0`),
    check('agent_sync_runs_updated_count', sql`${table.updatedCount} >= 0`),
    check('agent_sync_runs_unchanged_count', sql`${table.unchangedCount} >= 0`),
    check('agent_sync_runs_provider_count', sql`${table.providerCount} >= 0`),
    check('agent_sync_runs_day_count', sql`${table.dayCount} >= 0`),
    check('agent_sync_runs_model_count', sql`${table.modelCount} >= 0`),
    check('agent_sync_runs_total_tokens', sql`${table.totalTokens} >= 0`),
    check(
      'agent_sync_runs_total_cost_micros',
      sql`${table.totalCostMicros} >= 0`,
    ),
    check(
      'agent_sync_runs_file_name_length',
      sql`char_length(${table.fileName}) between 1 and 120`,
    ),
    check(
      'agent_sync_runs_error_message_length',
      sql`${table.errorMessage} is null or char_length(${table.errorMessage}) <= 500`,
    ),
  ],
)

export const modelOverrides = pgTable(
  'model_overrides',
  {
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    model: text('model').notNull(),
    displayName: text('display_name').default('').notNull(),
    iconKey: text('icon_key'),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.model] }),
    check(
      'model_overrides_display_name_length',
      sql`char_length(${table.displayName}) <= 80`,
    ),
    check(
      'model_overrides_icon_key_length',
      sql`${table.iconKey} is null or char_length(${table.iconKey}) between 1 and 32`,
    ),
  ],
)

export const modelGroups = pgTable(
  'model_groups',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    alias: text('alias').notNull(),
    iconKey: text('icon_key'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex('model_groups_user_alias_unique').on(table.userId, table.alias),
    check(
      'model_groups_alias_length',
      sql`char_length(${table.alias}) between 1 and 80`,
    ),
    check(
      'model_groups_icon_key_length',
      sql`${table.iconKey} is null or char_length(${table.iconKey}) between 1 and 32`,
    ),
  ],
)

export const modelGroupMembers = pgTable(
  'model_group_members',
  {
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    groupId: text('group_id')
      .notNull()
      .references(() => modelGroups.id, { onDelete: 'cascade' }),
    model: text('model').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.model] }),
    index('model_group_members_group_idx').on(table.userId, table.groupId),
    check(
      'model_group_members_model_length',
      sql`char_length(${table.model}) between 1 and 200`,
    ),
  ],
)
