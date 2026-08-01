/**
 * Category CRUD (admin). Categories group templates in the catalog.
 */
import { asc, eq } from 'drizzle-orm';
import { categories, templates } from '@/db/schema';
import type { Category } from '@/db/schema';
import type { AdminContext } from '@/server/db-context';
import { appendAdminAudit, type AuditActor } from './audit';
import { notFound, conflict } from './http';
import type { CreateCategoryInput, UpdateCategoryInput } from './schemas';

async function slugTaken(ctx: AdminContext, slug: string, exceptId?: string): Promise<boolean> {
  const rows = await ctx.db
    .select({ id: categories.id })
    .from(categories)
    .where(eq(categories.slug, slug))
    .limit(1);
  const found = rows[0];
  return Boolean(found && found.id !== exceptId);
}

export async function listCategories(ctx: AdminContext): Promise<{ categories: Category[] }> {
  const rows = await ctx.db
    .select()
    .from(categories)
    .orderBy(asc(categories.sortOrder), asc(categories.nameEn));
  return { categories: rows };
}

export async function getCategory(ctx: AdminContext, id: string): Promise<Category> {
  const rows = await ctx.db.select().from(categories).where(eq(categories.id, id)).limit(1);
  if (!rows[0]) throw notFound('category not found');
  return rows[0];
}

export async function createCategory(
  ctx: AdminContext,
  input: CreateCategoryInput,
  actor: AuditActor,
): Promise<Category> {
  if (await slugTaken(ctx, input.slug)) throw conflict(`slug '${input.slug}' already exists`);
  const rows = await ctx.db
    .insert(categories)
    .values({
      slug: input.slug,
      nameEn: input.nameEn,
      nameAr: input.nameAr,
      icon: input.icon ?? null,
      sortOrder: input.sortOrder,
      isActive: input.isActive,
    })
    .returning();
  const created = rows[0];
  await appendAdminAudit(ctx.db, actor, {
    action: 'category.create',
    entityType: 'category',
    entityId: created.id,
    metadata: { slug: created.slug },
  });
  return created;
}

export async function updateCategory(
  ctx: AdminContext,
  id: string,
  input: UpdateCategoryInput,
  actor: AuditActor,
): Promise<Category> {
  await getCategory(ctx, id);
  if (input.slug && (await slugTaken(ctx, input.slug, id))) {
    throw conflict(`slug '${input.slug}' already exists`);
  }
  const patch: Record<string, unknown> = { updatedAt: new Date() };
  if (input.slug !== undefined) patch.slug = input.slug;
  if (input.nameEn !== undefined) patch.nameEn = input.nameEn;
  if (input.nameAr !== undefined) patch.nameAr = input.nameAr;
  if (input.icon !== undefined) patch.icon = input.icon ?? null;
  if (input.sortOrder !== undefined) patch.sortOrder = input.sortOrder;
  if (input.isActive !== undefined) patch.isActive = input.isActive;

  const rows = await ctx.db.update(categories).set(patch).where(eq(categories.id, id)).returning();
  await appendAdminAudit(ctx.db, actor, {
    action: 'category.update',
    entityType: 'category',
    entityId: id,
    metadata: { changed: Object.keys(patch).filter((k) => k !== 'updatedAt') },
  });
  return rows[0];
}

export async function deleteCategory(ctx: AdminContext, id: string, actor: AuditActor): Promise<void> {
  await getCategory(ctx, id);
  // templates.category_id is ON DELETE SET NULL, so deletion is safe but we
  // surface how many templates were detached for the audit trail.
  const detached = await ctx.db
    .select({ id: templates.id })
    .from(templates)
    .where(eq(templates.categoryId, id));
  await ctx.db.delete(categories).where(eq(categories.id, id));
  await appendAdminAudit(ctx.db, actor, {
    action: 'category.delete',
    entityType: 'category',
    entityId: id,
    metadata: { detachedTemplates: detached.length },
  });
}
