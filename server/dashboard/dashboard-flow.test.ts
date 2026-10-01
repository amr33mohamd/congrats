/**
 * Integration smoke test for the dashboard backend against in-process PGlite.
 * Exercises: create experience from a template (clones steps), step upsert with
 * slot validation, free publish unlock + public render gate, and paid order +
 * submit transition. Ownership scoping is asserted by building two user
 * contexts and confirming cross-user access fails.
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
import { publishExperience, getPublicExperienceBySlug, ensureShareLink } from './share-service';
import { createOrder, submitPayment } from './orders-service';
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

const freeDef = parseTemplateDefinition({
  version: 1,
  locale: 'en',
  direction: 'ltr',
  theme: { palette: ['#fff'] },
  scenes: [
    { id: 'cover', type: 'Cover', holdMs: 3000, slots: [{ key: 'heading', type: 'text', editable: true, maxLen: 20, defaultEn: 'Hi {recipient}' }] },
    { id: 'finale', type: 'Finale', holdMs: 3000, slots: [{ key: 'heading', type: 'text', editable: true, maxLen: 20, defaultEn: 'Bye' }] },
  ],
});

const paidDef = parseTemplateDefinition({
  version: 1,
  locale: 'en',
  direction: 'ltr',
  theme: { palette: ['#fff'] },
  scenes: [{ id: 'cover', type: 'Cover', holdMs: 3000, slots: [{ key: 'heading', type: 'text', editable: true, defaultEn: 'Hi' }] }],
});

// Mirrors the wedding invitation: names + date asked once at card level,
// the cover heading bound to the names, an event date that falls back to the
// wedding date, a slot renamed since cards were made, and a required greeting.
const inviteDef = parseTemplateDefinition({
  version: 1,
  locale: 'en',
  direction: 'ltr',
  theme: { palette: ['#fff'] },
  fields: [
    { key: 'couple', type: 'text', required: true, labelEn: "Couple's names", defaultEn: 'Omar & Nour' },
    { key: 'weddingDate', type: 'date', required: true, labelEn: 'Wedding date' },
  ],
  scenes: [
    {
      id: 'cover',
      type: 'Cover',
      holdMs: 3000,
      slots: [
        { key: 'heading', type: 'text', editable: true, bind: 'couple' },
        { key: 'subheading', type: 'text', editable: true, formerKeys: ['sub'], defaultEn: 'are getting married' },
      ],
    },
    {
      id: 'letter',
      type: 'Letter',
      holdMs: 3000,
      slots: [{ key: 'heading', type: 'text', editable: true, required: true, labelEn: 'Greeting', maxLen: 60 }],
    },
    {
      id: 'party',
      type: 'Event',
      holdMs: 3000,
      slots: [
        { key: 'label', type: 'text', editable: true, defaultEn: 'The Reception' },
        { key: 'date', type: 'date', editable: true, fallback: 'weddingDate' },
      ],
    },
    { id: 'finale', type: 'Finale', holdMs: 3000, slots: [{ key: 'heading', type: 'text', editable: true, defaultEn: 'With love, {couple}' }] },
  ],
});

let db: Awaited<ReturnType<typeof getDb>>;
let inviteTemplateId = '';
let ctxA: UserContext;
let ctxB: UserContext;
let freeTemplateId = '';
let paidTemplateId = '';

beforeAll(async () => {
  db = await getDb();

  const [u1] = await db.insert(users).values({ email: 'a@test.dev', locale: 'en' }).returning();
  const [u2] = await db.insert(users).values({ email: 'b@test.dev', locale: 'en' }).returning();
  ctxA = makeCtx(db, { id: u1.id, email: u1.email, isAdmin: false, role: null, locale: 'en' });
  ctxB = makeCtx(db, { id: u2.id, email: u2.email, isAdmin: false, role: null, locale: 'en' });

  const [cat] = await db.insert(categories).values({ slug: 'test-cat', nameEn: 'T', nameAr: 'ت' }).returning();
  const [free] = await db
    .insert(templates)
    .values({ slug: 'free-tpl', categoryId: cat.id, locale: 'en', direction: 'ltr', isPaid: false, pricePiastres: 0, definition: freeDef, status: 'published' })
    .returning();
  const [paid] = await db
    .insert(templates)
    .values({ slug: 'paid-tpl', categoryId: cat.id, locale: 'en', direction: 'ltr', isPaid: true, pricePiastres: 4900, currency: 'EGP', definition: paidDef, status: 'published' })
    .returning();
  freeTemplateId = free.id;
  paidTemplateId = paid.id;
  const [invite] = await db
    .insert(templates)
    .values({ slug: 'invite-tpl', categoryId: cat.id, locale: 'en', direction: 'ltr', isPaid: false, pricePiastres: 0, definition: inviteDef, status: 'published' })
    .returning();
  inviteTemplateId = invite.id;
});

describe('experiences', () => {
  it('creates an experience and clones template scenes into steps', async () => {
    const exp = await experiencesService.createExperience(ctxA, {
      templateId: freeTemplateId,
      recipientName: 'Sam',
      title: 'For Sam',
    });
    expect(exp.userId).toBe(ctxA.user.id);

    const payload = await experiencesService.getEditorPayload(ctxA, exp.id);
    expect(payload.steps).toHaveLength(2);
    // The editor payload keeps the RAW {recipient} token; substitution happens at
    // render time (toBoundExperience / SceneRenderer), so name changes flow through.
    expect(payload.steps[0].text.heading).toBe('Hi {recipient}');
  });

  it('enforces ownership on get (cross-user denied)', async () => {
    const exp = await experiencesService.createExperience(ctxA, { templateId: freeTemplateId });
    await expect(experiencesService.getEditorPayload(ctxB, exp.id)).rejects.toThrow();
  });

  it('rejects steps that violate slot rules', async () => {
    const exp = await experiencesService.createExperience(ctxA, { templateId: freeTemplateId });
    await expect(
      experiencesService.upsertSteps(ctxA, exp.id, [
        { templateStepId: 'cover', orderIndex: 0, text: { heading: 'way too long heading exceeding max' } },
      ]),
    ).rejects.toThrow(/maxLen/);

  });

  // Regression: one stale field used to reject the WHOLE save, so every edit on
  // the card was lost (the invitation rewrite renamed `subheading` → `sub`).
  it('a stale or renamed field never blocks saving the rest of the card', async () => {
    const exp = await experiencesService.createExperience(ctxA, { templateId: inviteTemplateId });
    const saved = await experiencesService.upsertSteps(ctxA, exp.id, [
      { templateStepId: 'cover', orderIndex: 0, text: { sub: 'renamed value', ghost: 'stale key' } },
      { templateStepId: 'letter', orderIndex: 1, text: { heading: 'Dear friend,' } },
      { templateStepId: 'gone', orderIndex: 2, text: { heading: 'section the template dropped' } },
    ]);
    const cover = saved.find((s) => s.templateStepId === 'cover')!;
    expect(cover.textContent).toEqual({ subheading: 'renamed value' }); // carried across, stale dropped
    expect(saved.find((s) => s.templateStepId === 'letter')!.textContent).toEqual({ heading: 'Dear friend,' });
    expect(saved.some((s) => s.templateStepId === 'gone')).toBe(false);
  });

  it('saves an unfinished draft; publish is what enforces required fields', async () => {
    const exp = await experiencesService.createExperience(ctxA, { templateId: inviteTemplateId });
    // Empty required greeting: the draft save must still succeed.
    await expect(
      experiencesService.upsertSteps(ctxA, exp.id, [
        { templateStepId: 'letter', orderIndex: 1, text: { heading: '' } },
      ]),
    ).resolves.toBeDefined();
    // …and publishing names what is missing, including the card-level date.
    await expect(publishExperience(ctxA, exp.id)).rejects.toThrow(/Greeting.*Wedding date|Wedding date.*Greeting/);
  });

  // Regression: a blank recipient failed the whole Details save, so the
  // couple's names and the wedding date saved with it were lost too.
  it('a blank recipient (one link for every guest) saves along with the card fields', async () => {
    const exp = await experiencesService.createExperience(ctxA, { templateId: inviteTemplateId, recipientName: 'X' });
    const updated = await experiencesService.updateExperience(ctxA, exp.id, {
      recipientName: null,
      fields: { couple: 'Amr & Walaa', weddingDate: '2027-12-15T19:00' },
    });
    expect(updated.recipientName).toBeNull();
    expect(updated.fields).toEqual({ couple: 'Amr & Walaa', weddingDate: '2027-12-15T19:00' });
  });

  it('card-level fields are asked once and flow into every section that uses them', async () => {
    const exp = await experiencesService.createExperience(ctxA, { templateId: inviteTemplateId, recipientName: 'Salma' });
    await experiencesService.updateExperience(ctxA, exp.id, {
      fields: { couple: 'Ali & Mona', weddingDate: '2027-09-10T19:00', notAField: 'dropped' },
    });
    await experiencesService.upsertSteps(ctxA, exp.id, [
      { templateStepId: 'letter', orderIndex: 1, text: { heading: 'Dear {recipient},' } },
    ]);
    const result = await publishExperience(ctxA, exp.id);
    expect(result.kind).toBe('published');

    const bound = (await getPublicExperienceBySlug((result as { slug: string }).slug))!;
    expect(bound.fields).toEqual({ couple: 'Ali & Mona', weddingDate: '2027-09-10T19:00' });
    const text = (id: string) => bound.steps.find((s) => s.templateStepId === id)!.text;
    // A bound slot is never stored on the step — the renderer reads the field.
    expect(text('cover').heading).toBeUndefined();
    // Tokens inside free text resolve to field values.
    expect(text('finale').heading).toBe('With love, Ali & Mona');
    expect(text('letter').heading).toBe('Dear Salma,');
  });
});

describe('publish + public gate', () => {
  it('free template publishes immediately and is publicly resolvable', async () => {
    const exp = await experiencesService.createExperience(ctxA, { templateId: freeTemplateId, recipientName: 'Lee' });
    const result = await publishExperience(ctxA, exp.id);
    expect(result.kind).toBe('published');
    const slug = (result as { slug: string }).slug;

    const bound = await getPublicExperienceBySlug(slug);
    expect(bound).not.toBeNull();
    expect(bound!.recipientName).toBe('Lee');
    expect(bound!.steps.length).toBeGreaterThan(0);
  });

  it('listExperiences exposes the share slug after publish (dashboard Share dialog)', async () => {
    const exp = await experiencesService.createExperience(ctxA, { templateId: freeTemplateId, recipientName: 'Mo' });
    await publishExperience(ctxA, exp.id);

    const list = await experiencesService.listExperiences(ctxA);
    const entry = list.find((e) => e.id === exp.id);
    expect(entry).toBeDefined();
    expect(entry!.shareSlug).toBeTruthy(); // the card/dialog needs this to render the link
    // and it must resolve to the live experience
    const bound = await getPublicExperienceBySlug(entry!.shareSlug!);
    expect(bound).not.toBeNull();
  });

  it('a locked (unpublished) experience is NOT publicly resolvable', async () => {
    const exp = await experiencesService.createExperience(ctxA, { templateId: paidTemplateId });
    const { slug } = await ensureShareLink(ctxA, exp.id);
    const bound = await getPublicExperienceBySlug(slug);
    expect(bound).toBeNull(); // not unlocked → gate closed
  });
});

describe('paid order flow', () => {
  it('creates a pending order and submits payment via the state machine', async () => {
    const exp = await experiencesService.createExperience(ctxA, { templateId: paidTemplateId });
    const pub = await publishExperience(ctxA, exp.id);
    expect(pub.kind).toBe('payment_required');
    const order = (pub as { order: { id: string; amountPiastres: number; orderRef: string } }).order;
    expect(order.amountPiastres).toBe(4900);
    expect(order.orderRef).toMatch(/^CG-/);

    // Upload a payment screenshot, then submit.
    const shot = await uploadMedia(ctxA, {
      kind: 'payment_screenshot',
      mime: 'image/png',
      data: pngBytes('fake-png-bytes'),
      experienceId: exp.id,
    });

    const res = await submitPayment(ctxA, order.id, { screenshotMediaId: shot.id, paymentRef: 'INSTA-123' });
    expect(res.order.status).toBe('submitted');

    // Experience must remain LOCKED — only admin approve unlocks.
    const fresh = await getEditorStatus(exp.id);
    expect(fresh).toBe(false);
  });

  it("blocks creating an order on someone else's experience", async () => {
    const exp = await experiencesService.createExperience(ctxA, { templateId: paidTemplateId });
    await expect(createOrder(ctxB, exp.id)).rejects.toThrow();
  });
});

async function getEditorStatus(experienceId: string): Promise<boolean> {
  const { experiences } = await import('@/db/schema');
  const row = (await db.select().from(experiences).where(eq(experiences.id, experienceId)).limit(1))[0];
  return row.isUnlocked;
}

describe('malformed ids', () => {
  it('a card id that is not a uuid is not found, not a server error', async () => {
    await expect(experiencesService.updateExperience(ctxA, 'undefined', { title: 'x' })).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });
});
