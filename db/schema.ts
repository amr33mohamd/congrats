/**
 * Congrats — Drizzle (Postgres dialect) schema. FROZEN single source of truth.
 *
 * Conventions:
 *  - Money is integer **piastres** (1 EGP = 100 piastres) in `amountPiastres`/`pricePiastres`.
 *  - Enums are modeled as text + CHECK constraints (portable across PGlite & Neon).
 *  - jsonb columns: templates.definition, steps.textContent, steps.animationConfig, audit_log.metadata.
 *  - No RLS (Auth.js, not Supabase) → every query MUST be ownership-scoped in the data layer.
 */
import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
  check,
  unique,
  index,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

const id = () => uuid('id').primaryKey().defaultRandom();
const createdAt = () => timestamp('created_at', { withTimezone: true }).notNull().defaultNow();
const updatedAt = () => timestamp('updated_at', { withTimezone: true }).notNull().defaultNow();

/* ───────────────────────────── IDENTITY ───────────────────────────── */

export const users = pgTable(
  'users',
  {
    id: id(),
    email: text('email').notNull().unique(),
    passwordHash: text('password_hash'),
    displayName: text('display_name'),
    locale: text('locale').notNull().default('ar'),
    avatarUrl: text('avatar_url'),
    isBlocked: boolean('is_blocked').notNull().default(false),
    /**
     * Comped account: publishes paid templates without going through the
     * InstaPay order flow. For reviewers, press, and internal QA — it skips
     * payment, NOT ownership, so every other scoping rule still applies.
     */
    allAccess: boolean('all_access').notNull().default(false),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [check('users_locale_chk', sql`${t.locale} in ('ar','en')`)],
);

export const adminUsers = pgTable(
  'admin_users',
  {
    id: id(),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }).unique(),
    role: text('role').notNull(),
    createdAt: createdAt(),
  },
  (t) => [check('admin_role_chk', sql`${t.role} in ('reviewer','admin','superadmin')`)],
);

/* ─────────────────────────── TEMPLATE CATALOG ─────────────────────── */

export const categories = pgTable('categories', {
  id: id(),
  slug: text('slug').notNull().unique(),
  nameEn: text('name_en').notNull(),
  nameAr: text('name_ar').notNull(),
  icon: text('icon'),
  sortOrder: integer('sort_order').notNull().default(0),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const templates = pgTable(
  'templates',
  {
    id: id(),
    categoryId: uuid('category_id').references(() => categories.id, { onDelete: 'set null' }),
    slug: text('slug').notNull().unique(),
    titleEn: text('title_en'),
    titleAr: text('title_ar'),
    locale: text('locale').notNull(),
    direction: text('direction').notNull(),
    isPaid: boolean('is_paid').notNull().default(false),
    pricePiastres: integer('price_piastres').notNull().default(0),
    currency: text('currency').notNull().default('EGP'),
    thumbnailUrl: text('thumbnail_url'),
    previewLink: text('preview_link'),
    // TemplateDefinition (see lib/template-contract.ts) — ordered scene defs + animation params.
    definition: jsonb('definition').notNull(),
    status: text('status').notNull().default('draft'),
    createdBy: uuid('created_by').references(() => adminUsers.id, { onDelete: 'set null' }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    check('templates_locale_chk', sql`${t.locale} in ('ar','en')`),
    check('templates_dir_chk', sql`${t.direction} in ('rtl','ltr')`),
    check('templates_status_chk', sql`${t.status} in ('draft','published','archived')`),
    index('templates_category_idx').on(t.categoryId),
  ],
);

/* ───────────────────────── USER-CREATED INSTANCES ─────────────────── */

export const experiences = pgTable(
  'experiences',
  {
    id: id(),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    templateId: uuid('template_id').notNull().references(() => templates.id, { onDelete: 'restrict' }),
    title: text('title'),
    recipientName: text('recipient_name'),
    locale: text('locale').notNull(),
    direction: text('direction').notNull(),
    status: text('status').notNull().default('draft'),
    // Server-set ONLY by order approval (or free templates). The unlock gate reads this.
    isUnlocked: boolean('is_unlocked').notNull().default(false),
    // Card-level details asked once (couple's names, wedding date…), keyed by
    // the template's field keys. See TemplateDefinition.fields.
    fields: jsonb('fields').$type<Record<string, string>>().notNull().default({}),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    check('experiences_locale_chk', sql`${t.locale} in ('ar','en')`),
    check('experiences_dir_chk', sql`${t.direction} in ('rtl','ltr')`),
    check(
      'experiences_status_chk',
      sql`${t.status} in ('draft','awaiting_payment','locked','published')`,
    ),
    index('experiences_user_idx').on(t.userId),
  ],
);

export const steps = pgTable(
  'steps',
  {
    id: id(),
    experienceId: uuid('experience_id').notNull().references(() => experiences.id, { onDelete: 'cascade' }),
    templateStepId: text('template_step_id').notNull(),
    orderIndex: integer('order_index').notNull(),
    recipientName: text('recipient_name'),
    textContent: jsonb('text_content'),
    animationConfig: jsonb('animation_config'),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    unique('steps_experience_order_uq').on(t.experienceId, t.orderIndex),
    index('steps_experience_idx').on(t.experienceId),
  ],
);

export const media = pgTable(
  'media',
  {
    id: id(),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    experienceId: uuid('experience_id').references(() => experiences.id, { onDelete: 'cascade' }),
    stepId: uuid('step_id').references(() => steps.id, { onDelete: 'set null' }),
    // Stable scene reference (TemplateDefinition.scenes[].id). Survives step-row
    // churn (PUT /steps fully replaces step rows → new UUIDs), so media stays
    // bound to its scene even after edits. Nullable for legacy/payment rows.
    templateStepId: text('template_step_id'),
    // Which image slot on the scene this media fills (e.g. 'coverImage',
    // 'gallery'). Lets one scene carry multiple image slots and a gallery slot
    // hold multiple photos. Nullable → binder falls back to the scene's first
    // image-slot key for legacy rows.
    slotKey: text('slot_key'),
    kind: text('kind').notNull(),
    storagePath: text('storage_path').notNull(),
    bucket: text('bucket').notNull(),
    mimeType: text('mime_type'),
    width: integer('width'),
    height: integer('height'),
    bytes: integer('bytes'),
    createdAt: createdAt(),
  },
  (t) => [
    check('media_kind_chk', sql`${t.kind} in ('step_image','payment_screenshot','thumbnail')`),
    check('media_bucket_chk', sql`${t.bucket} in ('experience-media','payment-proofs')`),
    index('media_user_idx').on(t.userId),
    index('media_experience_idx').on(t.experienceId),
  ],
);

/* ───────────────────────────── MANUAL PAYMENT ─────────────────────── */

export const orders = pgTable(
  'orders',
  {
    id: id(),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    experienceId: uuid('experience_id').notNull().references(() => experiences.id, { onDelete: 'cascade' }),
    templateId: uuid('template_id').notNull().references(() => templates.id, { onDelete: 'restrict' }),
    amountPiastres: integer('amount_piastres').notNull(),
    currency: text('currency').notNull().default('EGP'),
    // Human-friendly reference shown to the buyer, e.g. CG-AB12CD.
    orderRef: text('order_ref').notNull().unique(),
    // Snapshot of the InstaPay handle shown at order time.
    instapayHandle: text('instapay_handle'),
    status: text('status').notNull().default('pending'),
    // Buyer-entered InstaPay transaction reference.
    paymentRef: text('payment_ref'),
    screenshotMediaId: uuid('screenshot_media_id').references(() => media.id, { onDelete: 'set null' }),
    reviewedBy: uuid('reviewed_by').references(() => adminUsers.id, { onDelete: 'set null' }),
    reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
    rejectReason: text('reject_reason'),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    check(
      'orders_status_chk',
      sql`${t.status} in ('pending','submitted','approved','rejected','refunded')`,
    ),
    index('orders_user_idx').on(t.userId),
    index('orders_status_idx').on(t.status),
    index('orders_experience_idx').on(t.experienceId),
  ],
);

/* ───────────────────────────── SHAREABLE LINK ─────────────────────── */

export const shareLinks = pgTable(
  'share_links',
  {
    id: id(),
    experienceId: uuid('experience_id').notNull().references(() => experiences.id, { onDelete: 'cascade' }).unique(),
    slug: text('slug').notNull().unique(),
    visibility: text('visibility').notNull().default('public'),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    viewCount: integer('view_count').notNull().default(0),
    lastViewedAt: timestamp('last_viewed_at', { withTimezone: true }),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: createdAt(),
  },
  (t) => [
    check('share_links_visibility_chk', sql`${t.visibility} in ('public','unlisted','disabled')`),
    index('share_links_slug_idx').on(t.slug),
  ],
);

/* ───────────────────────────── GOVERNANCE ─────────────────────────── */

export const auditLog = pgTable(
  'audit_log',
  {
    id: id(),
    actorId: uuid('actor_id'),
    actorType: text('actor_type'),
    action: text('action').notNull(),
    entityType: text('entity_type'),
    entityId: uuid('entity_id'),
    metadata: jsonb('metadata'),
    ip: text('ip'),
    userAgent: text('user_agent'),
    createdAt: createdAt(),
  },
  (t) => [
    check('audit_actor_type_chk', sql`${t.actorType} in ('user','admin','system')`),
    index('audit_entity_idx').on(t.entityType, t.entityId),
  ],
);

/* ─────────────────────────── PASSWORD RESET ───────────────────────── */

export const passwordResetTokens = pgTable(
  'password_reset_tokens',
  {
    id: id(),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    // Only a SHA-256 hash of the token is stored; the raw token lives in the email link.
    tokenHash: text('token_hash').notNull().unique(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    usedAt: timestamp('used_at', { withTimezone: true }),
    createdAt: createdAt(),
  },
  (t) => [index('password_reset_user_idx').on(t.userId)],
);

/* ───────────────────────────── INFERRED TYPES ─────────────────────── */

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type AdminUser = typeof adminUsers.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Template = typeof templates.$inferSelect;
export type NewTemplate = typeof templates.$inferInsert;
export type Experience = typeof experiences.$inferSelect;
export type NewExperience = typeof experiences.$inferInsert;
export type Step = typeof steps.$inferSelect;
export type Media = typeof media.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;
export type ShareLink = typeof shareLinks.$inferSelect;
export type AuditLogRow = typeof auditLog.$inferSelect;
export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;

export const schema = {
  users,
  adminUsers,
  categories,
  templates,
  experiences,
  steps,
  media,
  orders,
  shareLinks,
  auditLog,
  passwordResetTokens,
};
