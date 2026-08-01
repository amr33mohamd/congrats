/**
 * Template catalog service (admin). Every template's `definition` is validated
 * against the frozen TemplateDefinition contract before persisting (the route
 * does this via zod's TemplateDefinitionSchema; we re-validate at the service
 * boundary as defense-in-depth). Publish/archive are status transitions.
 */
import { and, desc, eq } from 'drizzle-orm';
import { templates, categories } from '@/db/schema';
import type { Template } from '@/db/schema';
import { safeParseTemplateDefinition } from '@/lib/template-contract';
import type { AdminContext } from '@/server/db-context';
import { appendAdminAudit, type AuditActor } from './audit';
import { notFound, conflict, unprocessable } from './http';
import type {
  CreateTemplateInput,
  UpdateTemplateInput,
  TemplatePricingInput,
} from './schemas';

async function ensureCategoryExists(ctx: AdminContext, categoryId: string | null | undefined) {
  if (!categoryId) return;
  const rows = await ctx.db
    .select({ id: categories.id })
    .from(categories)
    .where(eq(categories.id, categoryId))
    .limit(1);
  if (!rows[0]) throw unprocessable('categoryId does not reference an existing category');
}

async function slugTaken(ctx: AdminContext, slug: string, exceptId?: string): Promise<boolean> {
  const rows = await ctx.db
    .select({ id: templates.id })
    .from(templates)
    .where(eq(templates.slug, slug))
    .limit(1);
  const found = rows[0];
  return Boolean(found && found.id !== exceptId);
}

export async function listTemplates(
  ctx: AdminContext,
  params: { status?: 'draft' | 'published' | 'archived'; categoryId?: string; limit: number; offset: number },
): Promise<{ templates: Template[] }> {
  const where = [];
  if (params.status) where.push(eq(templates.status, params.status));
  if (params.categoryId) where.push(eq(templates.categoryId, params.categoryId));
  const rows = await ctx.db
    .select()
    .from(templates)
    .where(where.length ? and(...where) : undefined)
    .orderBy(desc(templates.updatedAt))
    .limit(params.limit)
    .offset(params.offset);
  return { templates: rows };
}

export async function getTemplate(ctx: AdminContext, id: string): Promise<Template> {
  const rows = await ctx.db.select().from(templates).where(eq(templates.id, id)).limit(1);
  if (!rows[0]) throw notFound('template not found');
  return rows[0];
}

export async function createTemplate(
  ctx: AdminContext,
  input: CreateTemplateInput,
  actor: AuditActor,
): Promise<Template> {
  // Defense-in-depth: ensure the definition still parses cleanly.
  const parsed = safeParseTemplateDefinition(input.definition);
  if (!parsed.success) throw unprocessable('invalid TemplateDefinition');

  if (input.isPaid && input.pricePiastres <= 0) {
    throw unprocessable('paid templates require pricePiastres > 0');
  }
  await ensureCategoryExists(ctx, input.categoryId);
  if (await slugTaken(ctx, input.slug)) throw conflict(`slug '${input.slug}' already exists`);

  const rows = await ctx.db
    .insert(templates)
    .values({
      slug: input.slug,
      categoryId: input.categoryId ?? null,
      titleEn: input.titleEn ?? null,
      titleAr: input.titleAr ?? null,
      locale: input.locale,
      direction: input.direction,
      isPaid: input.isPaid,
      pricePiastres: input.pricePiastres,
      currency: input.currency,
      thumbnailUrl: input.thumbnailUrl ?? null,
      previewLink: input.previewLink ?? null,
      definition: parsed.data,
      status: input.status,
      createdBy: actor.adminUserId ?? null,
    })
    .returning();

  const created = rows[0];
  await appendAdminAudit(ctx.db, actor, {
    action: 'template.create',
    entityType: 'template',
    entityId: created.id,
    metadata: { slug: created.slug, status: created.status, isPaid: created.isPaid },
  });
  return created;
}

export async function updateTemplate(
  ctx: AdminContext,
  id: string,
  input: UpdateTemplateInput,
  actor: AuditActor,
): Promise<Template> {
  const existing = await getTemplate(ctx, id);

  if (input.definition) {
    const parsed = safeParseTemplateDefinition(input.definition);
    if (!parsed.success) throw unprocessable('invalid TemplateDefinition');
  }
  if (input.categoryId !== undefined) await ensureCategoryExists(ctx, input.categoryId);

  const nextIsPaid = input.isPaid ?? existing.isPaid;
  const nextPrice = input.pricePiastres ?? existing.pricePiastres;
  if (nextIsPaid && nextPrice <= 0) {
    throw unprocessable('paid templates require pricePiastres > 0');
  }

  const patch: Record<string, unknown> = { updatedAt: new Date() };
  if (input.categoryId !== undefined) patch.categoryId = input.categoryId ?? null;
  if (input.titleEn !== undefined) patch.titleEn = input.titleEn ?? null;
  if (input.titleAr !== undefined) patch.titleAr = input.titleAr ?? null;
  if (input.locale !== undefined) patch.locale = input.locale;
  if (input.direction !== undefined) patch.direction = input.direction;
  if (input.isPaid !== undefined) patch.isPaid = input.isPaid;
  if (input.pricePiastres !== undefined) patch.pricePiastres = input.pricePiastres;
  if (input.currency !== undefined) patch.currency = input.currency;
  if (input.thumbnailUrl !== undefined) patch.thumbnailUrl = input.thumbnailUrl ?? null;
  if (input.previewLink !== undefined) patch.previewLink = input.previewLink ?? null;
  if (input.definition !== undefined) patch.definition = input.definition;
  if (input.status !== undefined) patch.status = input.status;

  const rows = await ctx.db.update(templates).set(patch).where(eq(templates.id, id)).returning();
  const updated = rows[0];
  await appendAdminAudit(ctx.db, actor, {
    action: 'template.update',
    entityType: 'template',
    entityId: id,
    metadata: { changed: Object.keys(patch).filter((k) => k !== 'updatedAt') },
  });
  return updated;
}

/** Publish a template (draft/archived → published). */
export async function publishTemplate(
  ctx: AdminContext,
  id: string,
  actor: AuditActor,
): Promise<Template> {
  return setTemplateStatus(ctx, id, 'published', actor);
}

/** Archive a template (any → archived). */
export async function archiveTemplate(
  ctx: AdminContext,
  id: string,
  actor: AuditActor,
): Promise<Template> {
  return setTemplateStatus(ctx, id, 'archived', actor);
}

async function setTemplateStatus(
  ctx: AdminContext,
  id: string,
  status: 'draft' | 'published' | 'archived',
  actor: AuditActor,
): Promise<Template> {
  const existing = await getTemplate(ctx, id);
  // Publishing requires a structurally valid definition.
  if (status === 'published') {
    const parsed = safeParseTemplateDefinition(existing.definition);
    if (!parsed.success) throw unprocessable('cannot publish: definition is invalid');
  }
  const rows = await ctx.db
    .update(templates)
    .set({ status, updatedAt: new Date() })
    .where(eq(templates.id, id))
    .returning();
  await appendAdminAudit(ctx.db, actor, {
    action: `template.${status === 'published' ? 'publish' : 'archive'}`,
    entityType: 'template',
    entityId: id,
    metadata: { from: existing.status, to: status },
  });
  return rows[0];
}

export async function deleteTemplate(ctx: AdminContext, id: string, actor: AuditActor): Promise<void> {
  await getTemplate(ctx, id); // 404 if missing
  // FK from experiences/orders is ON DELETE RESTRICT → block hard-delete if used.
  try {
    await ctx.db.delete(templates).where(eq(templates.id, id));
  } catch {
    throw conflict('template is in use by experiences/orders; archive it instead');
  }
  await appendAdminAudit(ctx.db, actor, {
    action: 'template.delete',
    entityType: 'template',
    entityId: id,
  });
}

export async function updatePricing(
  ctx: AdminContext,
  id: string,
  input: TemplatePricingInput,
  actor: AuditActor,
): Promise<Template> {
  await getTemplate(ctx, id);
  const rows = await ctx.db
    .update(templates)
    .set({
      isPaid: input.isPaid,
      pricePiastres: input.pricePiastres,
      currency: input.currency,
      updatedAt: new Date(),
    })
    .where(eq(templates.id, id))
    .returning();
  await appendAdminAudit(ctx.db, actor, {
    action: 'template.pricing',
    entityType: 'template',
    entityId: id,
    metadata: { isPaid: input.isPaid, pricePiastres: input.pricePiastres, currency: input.currency },
  });
  return rows[0];
}
