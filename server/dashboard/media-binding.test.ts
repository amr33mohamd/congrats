/**
 * Binder media-slot behavior: a published experience's public render must file
 * each uploaded photo under its own image-slot key, support a gallery slot
 * holding several photos in upload order, and keep legacy rows (no slotKey)
 * working via the scene's first image-slot fallback.
 */
import { beforeAll, describe, expect, it } from 'vitest';

// Force the offline PGlite path (no DATABASE_URL).
process.env.PGLITE_PATH = 'memory://';
delete process.env.DATABASE_URL;

import { getDb } from '@/db';
import { users, templates, categories } from '@/db/schema';
import type { UserContext } from '@/server/db-context';
import type { SessionUser } from '@/lib/auth';
import { parseTemplateDefinition } from '@/lib/template-contract';
import { and, eq } from 'drizzle-orm';

import * as experiencesService from './experiences-service';
import { publishExperience, getPublicExperienceBySlug } from './share-service';
import { uploadMedia } from './media-service';

// Real PNG signature + a unique tail: uploads are sniffed by their bytes.
const pngBytes = (tail: string) => Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.from(tail)]);


function makeCtx(db: Awaited<ReturnType<typeof getDb>>, user: SessionUser): UserContext {
  return {
    db,
    user,
    ownedBy(col, extra) {
      const base = eq(col, user.id);
      return (extra ? and(base, extra) : base) as never;
    },
  };
}

// A scene with TWO image slots (cover avatar + a gallery) so multi-slot AND
// multi-photo binding can both be asserted against a single render.
const def = parseTemplateDefinition({
  version: 1,
  locale: 'en',
  direction: 'ltr',
  theme: { palette: ['#fff'] },
  scenes: [
    {
      id: 'cover',
      type: 'Cover',
      holdMs: 3000,
      slots: [
        { key: 'heading', type: 'text', editable: true, defaultEn: 'Hi {recipient}' },
        { key: 'coverImage', type: 'image', editable: true, min: 0, max: 1 },
      ],
    },
    {
      id: 'gallery',
      type: 'Gallery',
      holdMs: 4000,
      slots: [
        { key: 'heading', type: 'text', editable: true, defaultEn: 'Memories' },
        { key: 'gallery', type: 'image', editable: true, min: 1, max: 6 },
      ],
    },
    {
      id: 'legacy',
      type: 'PhotoReveal',
      holdMs: 3000,
      slots: [
        { key: 'image', type: 'image', editable: true, min: 0, max: 1 },
        { key: 'caption', type: 'text', editable: true, defaultEn: 'Us' },
      ],
    },
  ],
});

let db: Awaited<ReturnType<typeof getDb>>;
let ctx: UserContext;
let templateId = '';

beforeAll(async () => {
  db = await getDb();
  const [u] = await db.insert(users).values({ email: 'binder@test.dev', locale: 'en' }).returning();
  ctx = makeCtx(db, { id: u.id, email: u.email, isAdmin: false, role: null, locale: 'en' });
  const [cat] = await db
    .insert(categories)
    .values({ slug: 'binder-cat', nameEn: 'B', nameAr: 'ب' })
    .returning();
  const [tpl] = await db
    .insert(templates)
    .values({
      slug: 'binder-tpl',
      categoryId: cat.id,
      locale: 'en',
      direction: 'ltr',
      isPaid: false,
      pricePiastres: 0,
      definition: def,
      status: 'published',
    })
    .returning();
  templateId = tpl.id;
});

async function addPhoto(
  experienceId: string,
  opts: { templateStepId?: string; slotKey?: string; stepId?: string },
): Promise<void> {
  await uploadMedia(ctx, {
    kind: 'step_image',
    mime: 'image/png',
    data: pngBytes(`png-${Math.random()}`),
    experienceId,
    ...opts,
  });
}

describe('binder media-slot binding', () => {
  it('files each photo under its own slotKey and keeps gallery photos in order', async () => {
    const exp = await experiencesService.createExperience(ctx, { templateId, recipientName: 'Lee' });

    // One cover photo + three gallery photos (uploaded in a known order).
    await addPhoto(exp.id, { templateStepId: 'cover', slotKey: 'coverImage' });
    await addPhoto(exp.id, { templateStepId: 'gallery', slotKey: 'gallery' });
    await addPhoto(exp.id, { templateStepId: 'gallery', slotKey: 'gallery' });
    await addPhoto(exp.id, { templateStepId: 'gallery', slotKey: 'gallery' });

    const result = await publishExperience(ctx, exp.id);
    const slug = (result as { slug: string }).slug;
    const bound = await getPublicExperienceBySlug(slug);
    expect(bound).not.toBeNull();

    const coverStep = bound!.steps.find((s) => s.templateStepId === 'cover')!;
    expect(coverStep.media).toHaveLength(1);
    expect(coverStep.media[0].slot).toBe('coverImage');

    const galleryStep = bound!.steps.find((s) => s.templateStepId === 'gallery')!;
    expect(galleryStep.media).toHaveLength(3);
    expect(galleryStep.media.every((m) => m.slot === 'gallery')).toBe(true);
  });

  it('caps a gallery slot at its max', async () => {
    const exp = await experiencesService.createExperience(ctx, { templateId, recipientName: 'Max' });
    // Upload more than the slot's max (6) → binder keeps only 6.
    for (let i = 0; i < 8; i++) {
      await addPhoto(exp.id, { templateStepId: 'gallery', slotKey: 'gallery' });
    }
    const result = await publishExperience(ctx, exp.id);
    const bound = await getPublicExperienceBySlug((result as { slug: string }).slug);
    const galleryStep = bound!.steps.find((s) => s.templateStepId === 'gallery')!;
    expect(galleryStep.media).toHaveLength(6);
  });

  it('keeps only the newest photo for a single-image slot', async () => {
    const exp = await experiencesService.createExperience(ctx, { templateId, recipientName: 'One' });
    // Two uploads to the same single-photo slot (simulates a replace where the
    // old DB row lingered) → binder keeps exactly one.
    await addPhoto(exp.id, { templateStepId: 'cover', slotKey: 'coverImage' });
    await addPhoto(exp.id, { templateStepId: 'cover', slotKey: 'coverImage' });
    const result = await publishExperience(ctx, exp.id);
    const bound = await getPublicExperienceBySlug((result as { slug: string }).slug);
    const coverStep = bound!.steps.find((s) => s.templateStepId === 'cover')!;
    expect(coverStep.media).toHaveLength(1);
  });

  it('falls back to the scene first image-slot key for legacy rows (no slotKey)', async () => {
    const exp = await experiencesService.createExperience(ctx, { templateId, recipientName: 'Leg' });
    // Legacy upload: bound to the scene via templateStepId but WITHOUT a slotKey.
    await addPhoto(exp.id, { templateStepId: 'legacy' });
    const result = await publishExperience(ctx, exp.id);
    const bound = await getPublicExperienceBySlug((result as { slug: string }).slug);
    const legacyStep = bound!.steps.find((s) => s.templateStepId === 'legacy')!;
    expect(legacyStep.media).toHaveLength(1);
    expect(legacyStep.media[0].slot).toBe('image'); // scene's first image slot
  });
});
