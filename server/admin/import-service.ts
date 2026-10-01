/**
 * Card import — moves cards made on another install (e.g. a laptop running
 * PGlite) into this one, owned by the importing admin.
 *
 * Deliberately carries NO accounts or password hashes: only card content.
 * Templates are matched by slug (ids differ between installs). Each card keeps
 * its original id and share-link slug, so a published card keeps its URL and
 * re-running the same import is a no-op for cards already present.
 */
import { eq, inArray } from 'drizzle-orm';
import { z } from 'zod';
import type { DbClient } from '@/db';
import { experiences, steps, shareLinks, templates } from '@/db/schema';
import { appendAdminAudit, type AuditActor } from './audit';

const StepSchema = z.object({
  templateStepId: z.string().min(1).max(80),
  orderIndex: z.number().int().min(0).max(200),
  recipientName: z.string().max(120).nullable().optional(),
  textContent: z.record(z.string().max(2000)).nullable().optional(),
  animationConfig: z.record(z.unknown()).nullable().optional(),
});

const CardSchema = z.object({
  id: z.string().uuid(),
  templateSlug: z.string().min(1).max(120),
  title: z.string().max(160).nullable(),
  recipientName: z.string().max(120).nullable(),
  locale: z.enum(['ar', 'en']),
  direction: z.enum(['rtl', 'ltr']),
  status: z.enum(['draft', 'awaiting_payment', 'locked', 'published']),
  isUnlocked: z.boolean(),
  fields: z.record(z.string().max(500)).default({}),
  steps: z.array(StepSchema).max(60),
  shareLink: z
    .object({
      slug: z.string().regex(/^[A-Za-z0-9_-]{4,64}$/),
      visibility: z.enum(['public', 'unlisted', 'disabled']),
      isActive: z.boolean(),
    })
    .nullable(),
});

export const ImportBundleSchema = z.object({
  format: z.literal('congrats-cards/v1'),
  cards: z.array(CardSchema).max(500),
});
export type ImportBundle = z.infer<typeof ImportBundleSchema>;

export interface ImportResult {
  imported: number;
  skippedExisting: number;
  skippedUnknownTemplate: string[];
  linksKept: number;
  linksDropped: number;
}

export async function importCards(
  db: DbClient,
  actor: AuditActor,
  bundle: ImportBundle,
): Promise<ImportResult> {
  const slugs = [...new Set(bundle.cards.map((c) => c.templateSlug))];
  const tplRows = slugs.length
    ? await db.select({ id: templates.id, slug: templates.slug }).from(templates).where(inArray(templates.slug, slugs))
    : [];
  const tplBySlug = new Map(tplRows.map((t) => [t.slug, t.id]));

  const result: ImportResult = { imported: 0, skippedExisting: 0, skippedUnknownTemplate: [], linksKept: 0, linksDropped: 0 };

  for (const card of bundle.cards) {
    const templateId = tplBySlug.get(card.templateSlug);
    if (!templateId) {
      result.skippedUnknownTemplate.push(card.title ?? card.id);
      continue;
    }
    const exists = await db.select({ id: experiences.id }).from(experiences).where(eq(experiences.id, card.id)).limit(1);
    if (exists[0]) {
      result.skippedExisting++;
      continue;
    }

    await db.insert(experiences).values({
      id: card.id,
      userId: actor.userId,
      templateId,
      title: card.title,
      recipientName: card.recipientName,
      locale: card.locale,
      direction: card.direction,
      status: card.status,
      isUnlocked: card.isUnlocked,
      fields: card.fields,
    });
    if (card.steps.length) {
      await db.insert(steps).values(
        card.steps.map((s) => ({
          experienceId: card.id,
          templateStepId: s.templateStepId,
          orderIndex: s.orderIndex,
          recipientName: s.recipientName ?? null,
          textContent: s.textContent ?? {},
          animationConfig: s.animationConfig ?? {},
        })),
      );
    }
    if (card.shareLink) {
      // A slug already taken here belongs to someone else's card — never steal it.
      const taken = await db.select({ id: shareLinks.id }).from(shareLinks).where(eq(shareLinks.slug, card.shareLink.slug)).limit(1);
      if (taken[0]) {
        result.linksDropped++;
      } else {
        await db.insert(shareLinks).values({ experienceId: card.id, ...card.shareLink });
        result.linksKept++;
      }
    }
    result.imported++;
  }

  await appendAdminAudit(db, actor, {
    action: 'cards.import',
    entityType: 'experience',
    metadata: { ...result, total: bundle.cards.length },
  });
  return result;
}
