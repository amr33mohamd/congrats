/** RSVP replies against in-process PGlite: the share-link gate and owner-only reads. */
import { beforeAll, describe, expect, it } from 'vitest';

process.env.PGLITE_PATH = 'memory://';
delete process.env.DATABASE_URL;

import { and, eq } from 'drizzle-orm';
import { getDb } from '@/db';
import { users, templates, categories, experiences, shareLinks } from '@/db/schema';
import type { UserContext } from '@/server/db-context';
import type { SessionUser } from '@/lib/auth';
import { parseTemplateDefinition } from '@/lib/template-contract';
import { createExperience, listExperiences } from '@/server/dashboard/experiences-service';
import { submitRsvp, listRsvps, rsvpInput } from './rsvp-service';

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

const def = parseTemplateDefinition({
  version: 1,
  locale: 'ar',
  direction: 'rtl',
  theme: { palette: ['#fff'] },
  scenes: [{ id: 'cover', type: 'Cover', holdMs: 3000, slots: [{ key: 'heading', type: 'text', editable: true, defaultAr: 'أهلاً' }] }],
});

let db: Awaited<ReturnType<typeof getDb>>;
let ctxA: UserContext;
let ctxB: UserContext;
let expId = '';

beforeAll(async () => {
  db = await getDb();
  const [u1] = await db.insert(users).values({ email: 'rsvp-a@test.dev', locale: 'ar' }).returning();
  const [u2] = await db.insert(users).values({ email: 'rsvp-b@test.dev', locale: 'ar' }).returning();
  ctxA = makeCtx(db, { id: u1.id, email: u1.email, isAdmin: false, role: null, locale: 'ar' });
  ctxB = makeCtx(db, { id: u2.id, email: u2.email, isAdmin: false, role: null, locale: 'ar' });
  const [cat] = await db.insert(categories).values({ slug: 'rsvp-cat', nameEn: 'T', nameAr: 'ت' }).returning();
  const [tpl] = await db
    .insert(templates)
    .values({ slug: 'rsvp-tpl', categoryId: cat.id, locale: 'ar', direction: 'rtl', isPaid: false, pricePiastres: 0, definition: def, status: 'published' })
    .returning();
  const exp = await createExperience(ctxA, { templateId: tpl.id });
  expId = exp.id;
  await db.insert(shareLinks).values({ experienceId: expId, slug: 'live-card' });
});

const reply = (o: Partial<Parameters<typeof submitRsvp>[0]> = {}) =>
  rsvpInput.parse({ slug: 'live-card', name: 'أحمد', attending: true, guests: 3, ...o });

describe('rsvp', () => {
  it('refuses a locked card and an unknown link', async () => {
    expect(await submitRsvp(reply())).toBe(false);
    await db.update(experiences).set({ isUnlocked: true }).where(eq(experiences.id, expId));
    expect(await submitRsvp(reply({ slug: 'nope' }))).toBe(false);
  });

  it('saves replies and totals them for the owner only', async () => {
    expect(await submitRsvp(reply())).toBe(true);
    expect(await submitRsvp(reply({ name: 'سارة', attending: false, guests: 5 }))).toBe(true);

    const s = await listRsvps(ctxA, expId);
    expect(s).not.toBeNull();
    expect(s!.replies).toHaveLength(2);
    expect(s!.attending).toBe(1);
    expect(s!.declined).toBe(1);
    // Not coming counts no one, whatever was sent.
    expect(s!.guests).toBe(3);

    expect(await listRsvps(ctxB, expId)).toBeNull();
    const mine = await listExperiences(ctxA);
    expect(mine.find((e) => e.id === expId)?.rsvpCount).toBe(2);
  });

  it('stops taking replies once the link is turned off', async () => {
    await db.update(shareLinks).set({ isActive: false }).where(eq(shareLinks.slug, 'live-card'));
    expect(await submitRsvp(reply())).toBe(false);
  });

  it('validates input', () => {
    expect(rsvpInput.safeParse({ slug: 'x', name: 'a', attending: true, guests: 1 }).success).toBe(false);
    expect(rsvpInput.safeParse({ slug: 'x', name: 'أحمد', attending: true, guests: 50 }).success).toBe(false);
  });
});
