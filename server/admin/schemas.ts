/**
 * Zod input schemas for all admin endpoints. Kept separate from services so
 * route handlers can `.parse()` request bodies/queries and services receive
 * already-validated, typed input.
 */
import { z } from 'zod';
import { TemplateDefinitionSchema } from '@/lib/template-contract';

/* ───────────────────────────── Orders ─────────────────────────────── */

export const OrderQueueQuerySchema = z.object({
  // Review queue defaults to 'submitted'; pending is also browsable.
  status: z.enum(['pending', 'submitted', 'approved', 'rejected', 'refunded']).default('submitted'),
  limit: z.coerce.number().int().positive().max(100).default(50),
  offset: z.coerce.number().int().nonnegative().default(0),
});
export type OrderQueueQuery = z.infer<typeof OrderQueueQuerySchema>;

export const RejectOrderSchema = z.object({
  rejectReason: z.string().trim().min(1, 'rejectReason is required').max(500),
});

/* ──────────────────────────── Templates ───────────────────────────── */

const LocaleEnum = z.enum(['ar', 'en']);
const DirectionEnum = z.enum(['rtl', 'ltr']);
const StatusEnum = z.enum(['draft', 'published', 'archived']);

export const CreateTemplateSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(1)
    .max(120)
    .regex(/^[a-z0-9-]+$/, 'slug must be kebab-case (a-z, 0-9, -)'),
  categoryId: z.string().uuid().nullish(),
  titleEn: z.string().trim().max(200).nullish(),
  titleAr: z.string().trim().max(200).nullish(),
  locale: LocaleEnum,
  direction: DirectionEnum,
  isPaid: z.boolean().default(false),
  pricePiastres: z.number().int().nonnegative().default(0),
  currency: z.string().trim().length(3).default('EGP'),
  thumbnailUrl: z.string().url().nullish(),
  previewLink: z.string().nullish(),
  // Validated against the frozen TemplateDefinition contract.
  definition: TemplateDefinitionSchema,
  status: StatusEnum.default('draft'),
});
export type CreateTemplateInput = z.infer<typeof CreateTemplateSchema>;

export const UpdateTemplateSchema = z
  .object({
    categoryId: z.string().uuid().nullish(),
    titleEn: z.string().trim().max(200).nullish(),
    titleAr: z.string().trim().max(200).nullish(),
    locale: LocaleEnum.optional(),
    direction: DirectionEnum.optional(),
    isPaid: z.boolean().optional(),
    pricePiastres: z.number().int().nonnegative().optional(),
    currency: z.string().trim().length(3).optional(),
    thumbnailUrl: z.string().url().nullish(),
    previewLink: z.string().nullish(),
    definition: TemplateDefinitionSchema.optional(),
    status: StatusEnum.optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: 'no fields to update' });
export type UpdateTemplateInput = z.infer<typeof UpdateTemplateSchema>;

export const TemplatePricingSchema = z
  .object({
    isPaid: z.boolean(),
    pricePiastres: z.number().int().nonnegative(),
    currency: z.string().trim().length(3).default('EGP'),
  })
  .refine((v) => !v.isPaid || v.pricePiastres > 0, {
    message: 'paid templates require pricePiastres > 0',
    path: ['pricePiastres'],
  });
export type TemplatePricingInput = z.infer<typeof TemplatePricingSchema>;

export const TemplateListQuerySchema = z.object({
  status: StatusEnum.optional(),
  categoryId: z.string().uuid().optional(),
  limit: z.coerce.number().int().positive().max(200).default(100),
  offset: z.coerce.number().int().nonnegative().default(0),
});

/* ──────────────────────────── Categories ──────────────────────────── */

export const CreateCategorySchema = z.object({
  slug: z
    .string()
    .trim()
    .min(1)
    .max(120)
    .regex(/^[a-z0-9-]+$/, 'slug must be kebab-case (a-z, 0-9, -)'),
  nameEn: z.string().trim().min(1).max(120),
  nameAr: z.string().trim().min(1).max(120),
  icon: z.string().trim().max(120).nullish(),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
});
export type CreateCategoryInput = z.infer<typeof CreateCategorySchema>;

export const UpdateCategorySchema = z
  .object({
    slug: z
      .string()
      .trim()
      .min(1)
      .max(120)
      .regex(/^[a-z0-9-]+$/, 'slug must be kebab-case (a-z, 0-9, -)')
      .optional(),
    nameEn: z.string().trim().min(1).max(120).optional(),
    nameAr: z.string().trim().min(1).max(120).optional(),
    icon: z.string().trim().max(120).nullish(),
    sortOrder: z.number().int().optional(),
    isActive: z.boolean().optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: 'no fields to update' });
export type UpdateCategoryInput = z.infer<typeof UpdateCategorySchema>;

/* ─────────────────────────────── Users ────────────────────────────── */

export const UserListQuerySchema = z.object({
  q: z.string().trim().max(200).optional(),
  blocked: z
    .enum(['true', 'false'])
    .transform((v) => v === 'true')
    .optional(),
  limit: z.coerce.number().int().positive().max(200).default(100),
  offset: z.coerce.number().int().nonnegative().default(0),
});

export const BlockUserSchema = z.object({
  isBlocked: z.boolean(),
});

export const AllAccessSchema = z.object({
  allAccess: z.boolean(),
});

/* ─────────────────────────────── Audit ────────────────────────────── */

export const AuditQuerySchema = z.object({
  actorType: z.enum(['user', 'admin', 'system']).optional(),
  entityType: z.string().trim().max(60).optional(),
  entityId: z.string().uuid().optional(),
  action: z.string().trim().max(120).optional(),
  limit: z.coerce.number().int().positive().max(200).default(100),
  offset: z.coerce.number().int().nonnegative().default(0),
});

/* ────────────────────────────── Share links ───────────────────────── */

export const UpdateShareLinkSchema = z
  .object({
    visibility: z.enum(['public', 'unlisted', 'disabled']).optional(),
    isActive: z.boolean().optional(),
  })
  .refine((v) => v.visibility !== undefined || v.isActive !== undefined, {
    message: 'provide visibility and/or isActive',
  });
export type UpdateShareLinkInput = z.infer<typeof UpdateShareLinkSchema>;
