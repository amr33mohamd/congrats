/**
 * Integration tests (in-process PGlite) for behaviour that only shows up once a
 * template changes under an existing card, plus the comped publish path and the
 * upload byte checks:
 *  - the editor persists steps for scenes added after creation (keeping the
 *    existing rows' UUIDs) and hides orphans;
 *  - the public render reconciles in memory WITHOUT writing;
 *  - comped accounts publish paid templates free, and the editor payload
 *    exposes the flag so the review step can say so;
 *  - uploads are identified by their bytes, not the declared type.
 */
import { beforeAll, describe, expect, it } from 'vitest';

process.env.PGLITE_PATH = 'memory://';
delete process.env.DATABASE_URL;

import { and, eq } from 'drizzle-orm';
import { getDb } from '@/db';
import { users, templates, categories, steps } from '@/db/schema';
import type { UserContext } from '@/server/db-context';
import type { SessionUser } from '@/lib/auth';
import { parseTemplateDefinition, type TemplateDefinition } from '@/lib/template-contract';
import { getStorage } from '@/server/storage';

import * as experiencesService from './experiences-service';
import { publishExperience, getPublicExperienceBySlug } from './share-service';
import { assertImageBytes, confirmMedia } from './media-service';
import { sniffImageMime } from './image-sniff';

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

const scene = (id: string, heading: string) => ({
  id,
  type: 'Cover' as const,
  holdMs: 3000,
  slots: [{ key: 'heading', type: 'text' as const, editable: true, defaultEn: heading }],
});

const v1 = parseTemplateDefinition({
  version: 1,
  locale: 'en',
  direction: 'ltr',
  theme: { palette: ['#fff'] },
  scenes: [scene('cover', 'Hi {recipient}'), scene('old', 'Old section'), scene('finale', 'Bye')],
});

// v2: `old` removed, `rsvp` added in the middle, order otherwise kept.
const v2 = parseTemplateDefinition({
  ...v1,
  scenes: [scene('cover', 'Hi {recipient}'), scene('rsvp', 'Please reply'), scene('finale', 'Bye')],
});

let db: Awaited<ReturnType<typeof getDb>>;
let ctxA: UserContext;
let ctxComped: UserContext;
let catId = '';

const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0x10]);
const GIF = Buffer.from('GIF89a....', 'latin1');
const WEBP = Buffer.concat([Buffer.from('RIFF', 'latin1'), Buffer.from([1, 2, 3, 4]), Buffer.from('WEBPVP8 ', 'latin1')]);

async function makeTemplate(slug: string, def: TemplateDefinition, paid = false) {
  const [tpl] = await db
    .insert(templates)
    .values({
      slug,
      categoryId: catId,
      locale: 'en',
      direction: 'ltr',
      isPaid: paid,
      pricePiastres: paid ? 4900 : 0,
      currency: 'EGP',
      definition: def,
      status: 'published',
    })
    .returning();
  return tpl;
}

async function setDefinition(templateId: string, def: TemplateDefinition) {
  await db.update(templates).set({ definition: def }).where(eq(templates.id, templateId));
}

async function stepRows(experienceId: string) {
  return db.select().from(steps).where(eq(steps.experienceId, experienceId)).orderBy(steps.orderIndex);
}

beforeAll(async () => {
  db = await getDb();
  const [a] = await db.insert(users).values({ email: 'recon-a@test.dev', locale: 'en' }).returning();
  const [c] = await db
    .insert(users)
    .values({ email: 'recon-comped@test.dev', locale: 'en', allAccess: true })
    .returning();
  ctxA = makeCtx(db, { id: a.id, email: a.email, isAdmin: false, role: null, locale: 'en' });
  ctxComped = makeCtx(db, { id: c.id, email: c.email, isAdmin: false, role: null, locale: 'en' });
  const [cat] = await db.insert(categories).values({ slug: 'recon-cat', nameEn: 'R', nameAr: 'ر' }).returning();
  catId = cat.id;
});

describe('step reconciliation — editor', () => {
  it('persists steps for new scenes, parks orphans, and keeps existing step ids', async () => {
    const tpl = await makeTemplate('recon-editor', v1);
    const exp = await experiencesService.createExperience(ctxA, { templateId: tpl.id, recipientName: 'Nour' });
    await experiencesService.upsertSteps(ctxA, exp.id, [
      { templateStepId: 'cover', orderIndex: 0, text: { heading: 'Custom cover' } },
      { templateStepId: 'old', orderIndex: 1, text: { heading: 'Old text' } },
      { templateStepId: 'finale', orderIndex: 2, text: { heading: 'Custom bye' } },
    ]);
    const before = await stepRows(exp.id);
    const idByScene = new Map(before.map((s) => [s.templateStepId, s.id]));

    await setDefinition(tpl.id, v2);
    const payload = await experiencesService.getEditorPayload(ctxA, exp.id);

    // Editor sees exactly the live scenes, in definition order.
    expect(payload.steps.map((s) => [s.templateStepId, s.orderIndex])).toEqual([
      ['cover', 0],
      ['rsvp', 1],
      ['finale', 2],
    ]);
    // User text survives; the new scene is seeded with its default.
    expect(payload.steps[0].text.heading).toBe('Custom cover');
    expect(payload.steps[1].text.heading).toBe('Please reply');
    expect(payload.steps[2].text.heading).toBe('Custom bye');
    // Existing rows were moved, not replaced (legacy media binds by step id).
    expect(payload.steps[0].id).toBe(idByScene.get('cover'));
    expect(payload.steps[2].id).toBe(idByScene.get('finale'));

    // Persisted: the new step is a real row; the orphan is parked, not deleted.
    const after = await stepRows(exp.id);
    expect(after.map((s) => [s.templateStepId, s.orderIndex])).toEqual([
      ['cover', 0],
      ['rsvp', 1],
      ['finale', 2],
      ['old', 3],
    ]);

    // Idempotent: a second load changes nothing.
    await experiencesService.getEditorPayload(ctxA, exp.id);
    expect((await stepRows(exp.id)).map((s) => s.id)).toEqual(after.map((s) => s.id));

    // The reconciled set round-trips through the editor's save.
    await expect(
      experiencesService.upsertSteps(
        ctxA,
        exp.id,
        payload.steps.map((s) => ({ templateStepId: s.templateStepId, orderIndex: s.orderIndex, text: s.text })),
      ),
    ).resolves.toHaveLength(3);
  });

  it('handles a pure reorder despite the unique (experience, order) key', async () => {
    const tpl = await makeTemplate('recon-reorder', v1);
    const exp = await experiencesService.createExperience(ctxA, { templateId: tpl.id });
    await setDefinition(tpl.id, { ...v1, scenes: [...v1.scenes].reverse() });
    const payload = await experiencesService.getEditorPayload(ctxA, exp.id);
    expect(payload.steps.map((s) => s.templateStepId)).toEqual(['finale', 'old', 'cover']);
    expect((await stepRows(exp.id)).map((s) => s.templateStepId)).toEqual(['finale', 'old', 'cover']);
  });
});

describe('step reconciliation — public render', () => {
  it('renders new scenes with defaults and skips orphans, without writing', async () => {
    const tpl = await makeTemplate('recon-public', v1);
    const exp = await experiencesService.createExperience(ctxA, { templateId: tpl.id, recipientName: 'Omar' });
    const pub = await publishExperience(ctxA, exp.id);
    expect(pub.kind).toBe('published');
    const before = await stepRows(exp.id);

    await setDefinition(tpl.id, v2);
    const bound = await getPublicExperienceBySlug(pub.slug);
    expect(bound).not.toBeNull();
    expect(bound!.steps.map((s) => [s.templateStepId, s.orderIndex])).toEqual([
      ['cover', 0],
      ['rsvp', 1],
      ['finale', 2],
    ]);
    expect(bound!.steps[0].text.heading).toBe('Hi Omar');
    expect(bound!.steps[1].text.heading).toBe('Please reply');

    // Anonymous viewing never mutates the owner's steps.
    const after = await stepRows(exp.id);
    expect(after.map((s) => [s.id, s.templateStepId, s.orderIndex])).toEqual(
      before.map((s) => [s.id, s.templateStepId, s.orderIndex]),
    );
  });
});

describe('comped (all_access) accounts', () => {
  it('publishes a paid template without an order and exposes allAccess to the editor', async () => {
    const tpl = await makeTemplate('recon-paid', v1, true);
    const exp = await experiencesService.createExperience(ctxComped, { templateId: tpl.id });

    const payload = await experiencesService.getEditorPayload(ctxComped, exp.id);
    expect(payload.allAccess).toBe(true);

    const res = await publishExperience(ctxComped, exp.id);
    expect(res.kind).toBe('published');
    expect(await getPublicExperienceBySlug(res.slug)).not.toBeNull();
  });

  it('a regular account on the same paid template still owes payment', async () => {
    const tpl = await makeTemplate('recon-paid-2', v1, true);
    const exp = await experiencesService.createExperience(ctxA, { templateId: tpl.id });
    expect((await experiencesService.getEditorPayload(ctxA, exp.id)).allAccess).toBe(false);
    expect((await publishExperience(ctxA, exp.id)).kind).toBe('payment_required');
  });

  it('revoking all_access takes effect on the next publish (DB, not session)', async () => {
    const tpl = await makeTemplate('recon-paid-3', v1, true);
    const exp = await experiencesService.createExperience(ctxComped, { templateId: tpl.id });
    await db.update(users).set({ allAccess: false }).where(eq(users.id, ctxComped.user.id));
    try {
      expect((await publishExperience(ctxComped, exp.id)).kind).toBe('payment_required');
    } finally {
      await db.update(users).set({ allAccess: true }).where(eq(users.id, ctxComped.user.id));
    }
  });
});

describe('upload byte checks', () => {
  it('sniffs the four accepted formats and nothing else', () => {
    expect(sniffImageMime(PNG)).toBe('image/png');
    expect(sniffImageMime(JPEG)).toBe('image/jpeg');
    expect(sniffImageMime(GIF)).toBe('image/gif');
    expect(sniffImageMime(WEBP)).toBe('image/webp');
    expect(sniffImageMime(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"/>'))).toBeNull();
    expect(sniffImageMime(Buffer.from('<html><script>alert(1)</script>'))).toBeNull();
    expect(sniffImageMime(new Uint8Array())).toBeNull();
  });

  it('assertImageBytes rejects non-images, empty and oversized payloads', () => {
    expect(assertImageBytes(JPEG)).toBe('image/jpeg');
    expect(() => assertImageBytes(Buffer.from('not an image'))).toThrow(/not a supported image/);
    expect(() => assertImageBytes(new Uint8Array())).toThrow(/empty/);
    const huge = Buffer.alloc(8 * 1024 * 1024 + 1);
    PNG.copy(huge);
    expect(() => assertImageBytes(huge)).toThrow(/too large/);
  });

  it('confirmMedia records the real type/size and deletes a disguised object', async () => {
    const storage = getStorage();
    const goodKey = `${ctxA.user.id}/order/recon-good.png`;
    await storage.put({ bucket: 'payment-proofs', key: goodKey, data: JPEG });
    const row = await confirmMedia(ctxA, {
      bucket: 'payment-proofs',
      key: goodKey,
      mime: 'image/png', // declared wrong; bytes are a JPEG
      bytes: 999_999, // declared wrong
    });
    expect(row.mimeType).toBe('image/jpeg');
    expect(row.bytes).toBe(JPEG.byteLength);

    const badKey = `${ctxA.user.id}/order/recon-bad.png`;
    await storage.put({ bucket: 'payment-proofs', key: badKey, data: Buffer.from('<html>') });
    await expect(
      confirmMedia(ctxA, { bucket: 'payment-proofs', key: badKey, mime: 'image/png', bytes: 6 }),
    ).rejects.toThrow(/not a supported image/);
    expect(await storage.exists('payment-proofs', badKey)).toBe(false);
    await storage.remove('payment-proofs', goodKey);
  });
});
