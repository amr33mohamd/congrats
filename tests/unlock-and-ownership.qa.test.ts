/**
 * QA — DB-touching integration (PGlite, offline). Covers:
 *
 *  (2) Unlock gate: getPublicExperienceBySlug returns content for a free/published
 *      experience and refuses a paid+unapproved one. Crucially, it also proves that
 *      admin APPROVE (through the state machine + OrderEffects) is what flips the
 *      gate open for a paid experience.
 *  (3) Ownership scoping: user A cannot read/update/delete user B's experiences or
 *      orders, and cannot create an order on B's experience.
 *  (5) Payment-screenshot duplicate-hash flagging.
 */
import { beforeAll, describe, expect, it, vi } from 'vitest';

// Force offline PGlite (must run before importing @/db).
process.env.PGLITE_PATH = 'memory://';
delete process.env.DATABASE_URL;
process.env.LOCAL_STORAGE_ROOT = `.data/test-uploads-${Date.now()}`;

/**
 * The admin services transitively import `@/lib/auth`, which loads NextAuth v5.
 * Under vitest's node resolver, next-auth's internal `import 'next/server'`
 * (missing the `.js` extension) fails to resolve — a TEST-ENV-ONLY issue (the
 * Next bundler resolves it fine; the production build is green). We construct
 * the AdminContext by hand and call approve/reject directly, so the auth
 * SESSION helpers are never exercised here. Mock the module to break the
 * next-auth import chain while preserving the AuthError class the services use.
 */
vi.mock('@/lib/auth', () => {
  class AuthError extends Error {
    constructor(message: string, readonly code: 'UNAUTHENTICATED' | 'FORBIDDEN') {
      super(message);
      this.name = 'AuthError';
    }
  }
  return {
    AuthError,
    getSession: vi.fn(async () => null),
    requireUser: vi.fn(async () => {
      throw new AuthError('authentication required', 'UNAUTHENTICATED');
    }),
    requireAdmin: vi.fn(async () => {
      throw new AuthError('admin privileges required', 'FORBIDDEN');
    }),
    handlers: {},
    auth: vi.fn(),
    signIn: vi.fn(),
    signOut: vi.fn(),
  };
});

import { and, eq } from 'drizzle-orm';
import { getDb } from '@/db';
import { users, adminUsers, templates, categories, experiences, orders, auditLog, shareLinks } from '@/db/schema';
import type { UserContext, AdminContext } from '@/server/db-context';
import type { SessionUser } from '@/lib/auth';
import { parseTemplateDefinition } from '@/lib/template-contract';

import * as experiencesService from '@/server/dashboard/experiences-service';
import {
  publishExperience,
  getPublicExperienceBySlug,
  ensureShareLink,
} from '@/server/dashboard/share-service';
import { createOrder, submitPayment, getOrder } from '@/server/dashboard/orders-service';
import { uploadMedia } from '@/server/dashboard/media-service';
import { approveOrder, rejectOrder } from '@/server/admin/orders-service';

function userCtx(db: Awaited<ReturnType<typeof getDb>>, user: SessionUser): UserContext {
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
  theme: { palette: ['#fff', '#000'] },
  scenes: [
    { id: 'cover', type: 'Cover', holdMs: 3000, slots: [{ key: 'heading', type: 'text', editable: true, defaultEn: 'Hi {recipient}' }] },
    { id: 'finale', type: 'Finale', holdMs: 3000, slots: [{ key: 'heading', type: 'text', editable: true, defaultEn: 'Bye' }] },
  ],
});

const paidDef = parseTemplateDefinition({
  version: 1,
  locale: 'en',
  direction: 'ltr',
  theme: { palette: ['#fff'] },
  scenes: [{ id: 'cover', type: 'Cover', holdMs: 3000, slots: [{ key: 'heading', type: 'text', editable: true, defaultEn: 'Hi' }] }],
});

let db: Awaited<ReturnType<typeof getDb>>;
let ctxA: UserContext;
let ctxB: UserContext;
let adminCtx: AdminContext;
let freeTemplateId = '';
let paidTemplateId = '';

beforeAll(async () => {
  db = await getDb();

  const [u1] = await db.insert(users).values({ email: `a-${Date.now()}@qa.dev`, locale: 'en' }).returning();
  const [u2] = await db.insert(users).values({ email: `b-${Date.now()}@qa.dev`, locale: 'en' }).returning();
  const [u3] = await db.insert(users).values({ email: `admin-${Date.now()}@qa.dev`, locale: 'en' }).returning();
  const [adminRow] = await db.insert(adminUsers).values({ userId: u3.id, role: 'superadmin' }).returning();
  expect(adminRow.id).toBeTruthy();

  ctxA = userCtx(db, { id: u1.id, email: u1.email, isAdmin: false, role: null, locale: 'en' });
  ctxB = userCtx(db, { id: u2.id, email: u2.email, isAdmin: false, role: null, locale: 'en' });
  adminCtx = { db, admin: { id: u3.id, email: u3.email, isAdmin: true, role: 'superadmin', locale: 'en' } };

  const [cat] = await db
    .insert(categories)
    .values({ slug: `qa-cat-${Date.now()}`, nameEn: 'T', nameAr: 'ت' })
    .returning();
  const [free] = await db
    .insert(templates)
    .values({ slug: `qa-free-${Date.now()}`, categoryId: cat.id, locale: 'en', direction: 'ltr', isPaid: false, pricePiastres: 0, definition: freeDef, status: 'published' })
    .returning();
  const [paid] = await db
    .insert(templates)
    .values({ slug: `qa-paid-${Date.now()}`, categoryId: cat.id, locale: 'en', direction: 'ltr', isPaid: true, pricePiastres: 4900, currency: 'EGP', definition: paidDef, status: 'published' })
    .returning();
  freeTemplateId = free.id;
  paidTemplateId = paid.id;
});

/* ─────────────────────────── Unlock gate (2) ──────────────────────────── */

describe('unlock gate', () => {
  it('free + published is publicly resolvable with bound content', async () => {
    const exp = await experiencesService.createExperience(ctxA, { templateId: freeTemplateId, recipientName: 'Lena' });
    const res = await publishExperience(ctxA, exp.id);
    expect(res.kind).toBe('published');
    const slug = (res as { slug: string }).slug;

    const bound = await getPublicExperienceBySlug(slug);
    expect(bound).not.toBeNull();
    expect(bound!.recipientName).toBe('Lena');
    expect(bound!.steps.length).toBeGreaterThan(0);
    // token resolution flowed through the gate.
    expect(bound!.steps.find((s) => s.text.heading)?.text.heading).toBe('Hi Lena');
  });

  it('paid + unapproved is locked (gate returns null even with a known slug)', async () => {
    const exp = await experiencesService.createExperience(ctxA, { templateId: paidTemplateId });
    const { slug } = await ensureShareLink(ctxA, exp.id);
    expect(await getPublicExperienceBySlug(slug)).toBeNull();
  });

  it('a disabled link is refused even when the experience is unlocked', async () => {
    const exp = await experiencesService.createExperience(ctxA, { templateId: freeTemplateId, recipientName: 'X' });
    const res = await publishExperience(ctxA, exp.id);
    const slug = (res as { slug: string }).slug;
    expect(await getPublicExperienceBySlug(slug)).not.toBeNull();

    await db.update(shareLinks).set({ visibility: 'disabled' }).where(eq(shareLinks.experienceId, exp.id));
    expect(await getPublicExperienceBySlug(slug)).toBeNull();
  });

  it('an expired link is refused', async () => {
    const exp = await experiencesService.createExperience(ctxA, { templateId: freeTemplateId, recipientName: 'Y' });
    const res = await publishExperience(ctxA, exp.id);
    const slug = (res as { slug: string }).slug;
    await db.update(shareLinks).set({ expiresAt: new Date(Date.now() - 1000) }).where(eq(shareLinks.experienceId, exp.id));
    expect(await getPublicExperienceBySlug(slug)).toBeNull();
  });

  it('admin APPROVE is the gate-opener for a paid experience (full flow)', async () => {
    const exp = await experiencesService.createExperience(ctxA, { templateId: paidTemplateId, recipientName: 'Omar' });
    const pub = await publishExperience(ctxA, exp.id);
    expect(pub.kind).toBe('payment_required');
    const { order, slug } = pub as { order: { id: string }; slug: string };

    // Locked until approval.
    expect(await getPublicExperienceBySlug(slug)).toBeNull();

    const shot = await uploadMedia(ctxA, {
      kind: 'payment_screenshot',
      mime: 'image/png',
      data: Buffer.from('approve-flow-bytes'),
      experienceId: exp.id,
    });
    await submitPayment(ctxA, order.id, { screenshotMediaId: shot.id, paymentRef: 'INSTA-APPROVE' });

    // Still locked after submit.
    expect(await getPublicExperienceBySlug(slug)).toBeNull();

    const result = await approveOrder(adminCtx, order.id, {});
    expect(result.to).toBe('approved');

    // NOW the gate is open.
    const bound = await getPublicExperienceBySlug(slug);
    expect(bound).not.toBeNull();
    expect(bound!.recipientName).toBe('Omar');

    // And it flowed through the audit log.
    const audits = await db.select().from(auditLog).where(eq(auditLog.entityId, order.id));
    expect(audits.map((a) => a.action)).toContain('order.approve');

    // The experience row really is unlocked.
    const fresh = (await db.select().from(experiences).where(eq(experiences.id, exp.id)).limit(1))[0];
    expect(fresh.isUnlocked).toBe(true);
  });

  it('admin REJECT keeps the gate closed', async () => {
    const exp = await experiencesService.createExperience(ctxA, { templateId: paidTemplateId });
    const pub = await publishExperience(ctxA, exp.id);
    const { order, slug } = pub as { order: { id: string }; slug: string };
    const shot = await uploadMedia(ctxA, {
      kind: 'payment_screenshot',
      mime: 'image/png',
      data: Buffer.from('reject-flow-bytes'),
      experienceId: exp.id,
    });
    await submitPayment(ctxA, order.id, { screenshotMediaId: shot.id, paymentRef: 'INSTA-REJECT' });

    const result = await rejectOrder(adminCtx, order.id, 'payment not received', {});
    expect(result.to).toBe('rejected');
    expect(await getPublicExperienceBySlug(slug)).toBeNull();
    const fresh = (await db.select().from(experiences).where(eq(experiences.id, exp.id)).limit(1))[0];
    expect(fresh.isUnlocked).toBe(false);
  });
});

/* ─────────────────────────── Ownership (3) ─────────────────────────────── */

describe('ownership scoping', () => {
  it('user B cannot read user A\'s experience editor payload', async () => {
    const exp = await experiencesService.createExperience(ctxA, { templateId: freeTemplateId });
    await expect(experiencesService.getEditorPayload(ctxB, exp.id)).rejects.toThrow();
  });

  it('user B cannot update user A\'s experience', async () => {
    const exp = await experiencesService.createExperience(ctxA, { templateId: freeTemplateId, title: 'A-owned' });
    await expect(
      experiencesService.updateExperience(ctxB, exp.id, { title: 'hijacked' }),
    ).rejects.toThrow();
    const fresh = (await db.select().from(experiences).where(eq(experiences.id, exp.id)).limit(1))[0];
    expect(fresh.title).toBe('A-owned');
  });

  it('user B cannot delete user A\'s experience', async () => {
    const exp = await experiencesService.createExperience(ctxA, { templateId: freeTemplateId });
    await expect(experiencesService.deleteExperience(ctxB, exp.id)).rejects.toThrow();
    const stillThere = (await db.select().from(experiences).where(eq(experiences.id, exp.id)).limit(1))[0];
    expect(stillThere).toBeTruthy();
  });

  it('user B cannot create an order on user A\'s experience', async () => {
    const exp = await experiencesService.createExperience(ctxA, { templateId: paidTemplateId });
    await expect(createOrder(ctxB, exp.id)).rejects.toThrow();
  });

  it('user B cannot poll user A\'s order', async () => {
    const exp = await experiencesService.createExperience(ctxA, { templateId: paidTemplateId });
    const order = await createOrder(ctxA, exp.id);
    await expect(getOrder(ctxB, order.id)).rejects.toThrow();
    // owner CAN read it.
    const ownRead = await getOrder(ctxA, order.id);
    expect(ownRead.id).toBe(order.id);
  });

  it('user B cannot ensure a share link on user A\'s experience', async () => {
    const exp = await experiencesService.createExperience(ctxA, { templateId: freeTemplateId });
    await expect(ensureShareLink(ctxB, exp.id)).rejects.toThrow();
  });
});

/* ─────────────────── Duplicate screenshot flagging (5) ─────────────────── */

describe('payment screenshot duplicate-hash flagging', () => {
  it('flags a reused screenshot (identical bytes) and leaves a fresh one unflagged', async () => {
    // Two separate paid experiences/orders for the same user.
    const expDup = await experiencesService.createExperience(ctxA, { templateId: paidTemplateId });
    const order1 = await createOrder(ctxA, expDup.id);

    const exp2 = await experiencesService.createExperience(ctxA, { templateId: paidTemplateId });
    const order2 = await createOrder(ctxA, exp2.id);

    const sameBytes = Buffer.from('the-exact-same-proof-image');

    // First submission: this is the only proof with these bytes → NOT a dup.
    const shot1 = await uploadMedia(ctxA, {
      kind: 'payment_screenshot',
      mime: 'image/png',
      data: sameBytes,
      experienceId: expDup.id,
    });
    const sub1 = await submitPayment(ctxA, order1.id, { screenshotMediaId: shot1.id, paymentRef: 'REF-1' });
    expect(sub1.duplicateScreenshot).toBe(false);

    // Second submission reuses the SAME image bytes (recycled proof) → flagged.
    const shot2 = await uploadMedia(ctxA, {
      kind: 'payment_screenshot',
      mime: 'image/png',
      data: sameBytes,
      experienceId: exp2.id,
    });
    const sub2 = await submitPayment(ctxA, order2.id, { screenshotMediaId: shot2.id, paymentRef: 'REF-2' });
    expect(sub2.duplicateScreenshot).toBe(true);

    // A flagged duplicate writes an extra audit row.
    const dupAudits = await db
      .select()
      .from(auditLog)
      .where(eq(auditLog.action, 'order.duplicate_screenshot_flagged'));
    expect(dupAudits.length).toBeGreaterThanOrEqual(1);
  });

  it('a unique screenshot is not flagged', async () => {
    const exp = await experiencesService.createExperience(ctxA, { templateId: paidTemplateId });
    const order = await createOrder(ctxA, exp.id);
    const shot = await uploadMedia(ctxA, {
      kind: 'payment_screenshot',
      mime: 'image/png',
      data: Buffer.from(`unique-bytes-${Date.now()}-${Math.random()}`),
      experienceId: exp.id,
    });
    const sub = await submitPayment(ctxA, order.id, { screenshotMediaId: shot.id, paymentRef: 'REF-UNIQUE' });
    expect(sub.duplicateScreenshot).toBe(false);
  });
});
