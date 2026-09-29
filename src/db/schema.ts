import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  bigint,
  date,
  real,
  jsonb,
  index,
  uniqueIndex,
  primaryKey,
} from 'drizzle-orm/pg-core'

// montos siempre en centavos (bigint) para no arrastrar errores de punto flotante
const cents = (name: string) => bigint(name, { mode: 'number' })

// ---------- autenticación ----------

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  passwordHash: text('password_hash').notNull(),
  currency: text('currency').notNull().default('ARS'),
  initialBalanceCents: cents('initial_balance_cents').notNull().default(0),
  microThresholdCents: cents('micro_threshold_cents').notNull().default(500_000),
  aiExternalEnabled: boolean('ai_external_enabled').notNull().default(true),
  onboardedAt: timestamp('onboarded_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const sessions = pgTable(
  'sessions',
  {
    // sha256 del token. el token en claro solo vive en la cookie
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    persistent: boolean('persistent').notNull().default(true),
    userAgent: text('user_agent'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('sessions_user_idx').on(t.userId)],
)

export const passwordResets = pgTable(
  'password_resets',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    tokenHash: text('token_hash').notNull().unique(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    usedAt: timestamp('used_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('password_resets_user_idx').on(t.userId)],
)

// ---------- datos financieros ----------

export const categories = pgTable(
  'categories',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    parentId: text('parent_id'),
    name: text('name').notNull(),
    kind: text('kind', { enum: ['expense', 'income'] }).notNull(),
    icon: text('icon').notNull().default('circle'),
    // slot fijo de la paleta categórica (1-8). null = se agrupa en "otros"
    colorSlot: integer('color_slot'),
    // grupo semántico para el motor de análisis (delivery, cafe, suscripciones...)
    group: text('group'),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('categories_user_idx').on(t.userId)],
)

export const transactions = pgTable(
  'transactions',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: text('type', { enum: ['expense', 'income'] }).notNull(),
    amountCents: cents('amount_cents').notNull(),
    date: date('date', { mode: 'string' }).notNull(),
    description: text('description').notNull().default(''),
    categoryId: text('category_id').references(() => categories.id, { onDelete: 'set null' }),
    subcategoryId: text('subcategory_id').references(() => categories.id, { onDelete: 'set null' }),
    paymentMethod: text('payment_method').notNull().default('debito'),
    recurrence: text('recurrence', { enum: ['none', 'weekly', 'monthly', 'yearly'] })
      .notNull()
      .default('none'),
    tags: jsonb('tags').$type<string[]>().notNull().default([]),
    source: text('source', { enum: ['manual', 'import', 'demo'] }).notNull().default('manual'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('transactions_user_date_idx').on(t.userId, t.date)],
)

export const budgets = pgTable(
  'budgets',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    // null = presupuesto general de gastos
    categoryId: text('category_id').references(() => categories.id, { onDelete: 'cascade' }),
    goalId: text('goal_id').references(() => goals.id, { onDelete: 'set null' }),
    period: text('period', { enum: ['weekly', 'monthly', 'yearly'] }).notNull().default('monthly'),
    amountCents: cents('amount_cents').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('budgets_user_idx').on(t.userId)],
)

export const goals = pgTable(
  'goals',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    kind: text('kind', { enum: ['purchase', 'travel', 'emergency', 'savings', 'investment'] }).notNull(),
    targetCents: cents('target_cents').notNull(),
    savedCents: cents('saved_cents').notNull().default(0),
    targetDate: date('target_date', { mode: 'string' }).notNull(),
    startDate: date('start_date', { mode: 'string' }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('goals_user_idx').on(t.userId)],
)

// ---------- integraciones (separadas de los datos manuales) ----------

export const integrations = pgTable(
  'integrations',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    provider: text('provider', { enum: ['gmail', 'gcal'] }).notNull(),
    status: text('status', { enum: ['connected', 'error'] }).notNull().default('connected'),
    isDemo: boolean('is_demo').notNull().default(false),
    scopes: text('scopes').notNull().default(''),
    accountEmail: text('account_email'),
    accessTokenEnc: text('access_token_enc'),
    refreshTokenEnc: text('refresh_token_enc'),
    tokenExpiresAt: timestamp('token_expires_at', { withTimezone: true }),
    lastSyncedAt: timestamp('last_synced_at', { withTimezone: true }),
    lastError: text('last_error'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex('integrations_user_provider_idx').on(t.userId, t.provider)],
)

export const integrationItems = pgTable(
  'integration_items',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    integrationId: text('integration_id')
      .notNull()
      .references(() => integrations.id, { onDelete: 'cascade' }),
    provider: text('provider', { enum: ['gmail', 'gcal'] }).notNull(),
    externalId: text('external_id').notNull(),
    kind: text('kind').notNull(),
    title: text('title').notNull(),
    merchant: text('merchant'),
    amountCents: cents('amount_cents'),
    currency: text('currency'),
    occursOn: date('occurs_on', { mode: 'string' }),
    endsOn: date('ends_on', { mode: 'string' }),
    confidence: real('confidence').notNull(),
    evidence: text('evidence').notNull().default(''),
    dismissed: boolean('dismissed').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('integration_items_ext_idx').on(t.userId, t.provider, t.externalId),
    index('integration_items_user_idx').on(t.userId, t.occursOn),
  ],
)

// ---------- estado de alertas e ia ----------

export const alertStates = pgTable(
  'alert_states',
  {
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    alertKey: text('alert_key').notNull(),
    status: text('status', { enum: ['dismissed', 'snoozed', 'seen'] }).notNull(),
    until: timestamp('until', { withTimezone: true }),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.alertKey] })],
)

export const aiReports = pgTable(
  'ai_reports',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    engine: text('engine').notNull(),
    inputHash: text('input_hash').notNull(),
    output: jsonb('output').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('ai_reports_user_idx').on(t.userId, t.createdAt)],
)

export type User = typeof users.$inferSelect
export type Category = typeof categories.$inferSelect
export type Transaction = typeof transactions.$inferSelect
export type Budget = typeof budgets.$inferSelect
export type Goal = typeof goals.$inferSelect
export type Integration = typeof integrations.$inferSelect
export type IntegrationItem = typeof integrationItems.$inferSelect
