import { beforeAll, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { getDb } from '@/db';
import { users, templates, experiences, steps, shareLinks } from '@/db/schema';
import { parseTemplateDefinition } from '@/lib/template-contract';
import { ImportBundleSchema, importCards } from './import-service';

let db: Awaited<ReturnType<typeof getDb>>;
let adminId = '';
let otherId = '';

const def = parseTemplateDefinition({
  version: 1,
  locale: 'en',
  direction: 'ltr',
  theme: { palette: ['#fff'] },
  scenes: [{ id: 'cover', type: 'Cover', holdMs: 3000, slots: [{ key: 'heading', type: 'text', editable: true }] }],
});

const card = (id: string, slug: string | null, templateSlug = 'import-tpl') => ({
  id,
  templateSlug,
  title: 'Amr walaa wedding',
  recipientName: null,
  locale: 'en' as const,
  direction: 'ltr' as const,
  status: 'published' as const,
  isUnlocked: true,
  fields: { couple: 'Amr & Walaa' },
  steps: [{ templateStepId: 'cover', orderIndex: 0, textContent: { heading: 'Hi' }, animationConfig: { hidden: false } }],
  shareLink: slug ? { slug, visibility: 'public' as const, isActive: true } : null,
});

beforeAll(async () => {
  db = await getDb();
  [{ id: adminId }] = await db.insert(users).values({ email: 'importer@test.dev', locale: 'en' }).returning();
  [{ id: otherId }] = await db.insert(users).values({ email: 'other@test.dev', locale: 'en' }).returning();
  await db.insert(templates).values({ slug: 'import-tpl', locale: 'en', direction: 'ltr', definition: def, status: 'published' });
});

describe('importCards', () => {
  it('adds cards to the importer, keeps ids and share links, and is safe to re-run', async () => {
    const bundle = ImportBundleSchema.parse({
      format: 'congrats-cards/v1',
      cards: [card('11111111-1111-4111-8111-111111111111', 'keepMe01'), card('22222222-2222-4222-8222-222222222222', null, 'no-such-tpl')],
    });
    const first = await importCards(db, { userId: adminId }, bundle);
    expect(first).toMatchObject({ imported: 1, skippedExisting: 0, linksKept: 1, skippedUnknownTemplate: ['Amr walaa wedding'] });

    const [exp] = await db.select().from(experiences).where(eq(experiences.id, '11111111-1111-4111-8111-111111111111'));
    expect(exp.userId).toBe(adminId);
    expect(exp.fields).toEqual({ couple: 'Amr & Walaa' });
    expect(await db.select().from(steps).where(eq(steps.experienceId, exp.id))).toHaveLength(1);

    const again = await importCards(db, { userId: adminId }, bundle);
    expect(again).toMatchObject({ imported: 0, skippedExisting: 1 });
  });

  it("never takes over another card's share link", async () => {
    const [mine] = await db
      .insert(experiences)
      .values({ userId: otherId, templateId: (await db.select().from(templates).where(eq(templates.slug, 'import-tpl')))[0].id, locale: 'en', direction: 'ltr' })
      .returning();
    await db.insert(shareLinks).values({ experienceId: mine.id, slug: 'takenSlug' });
    const res = await importCards(db, { userId: adminId }, ImportBundleSchema.parse({ format: 'congrats-cards/v1', cards: [card('33333333-3333-4333-8333-333333333333', 'takenSlug')] }));
    expect(res).toMatchObject({ imported: 1, linksDropped: 1 });
    const [link] = await db.select().from(shareLinks).where(eq(shareLinks.slug, 'takenSlug'));
    expect(link.experienceId).toBe(mine.id);
  });

  it('rejects a bundle carrying anything but cards', () => {
    expect(ImportBundleSchema.safeParse({ format: 'other', cards: [] }).success).toBe(false);
  });
});
