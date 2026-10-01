/**
 * Tracking end to end against in-process PGlite: the collector (POST /api/t)
 * accepts known events, drops junk and bots, scrubs card slugs; the admin
 * analytics roll-up builds the funnel and credits approved revenue to the
 * ad that brought the buyer.
 */
import { beforeAll, describe, expect, it } from 'vitest';

process.env.PGLITE_PATH = 'memory://';
delete process.env.DATABASE_URL;

import { getDb } from '@/db';
import { events, users, templates, experiences, orders } from '@/db/schema';
import { POST } from '@/app/api/t/route';
import { getAnalytics } from './analytics-service';

let db: Awaited<ReturnType<typeof getDb>>;

const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)';
let ip = 0;
const send = (body: unknown, ua = UA) =>
  POST(
    new Request('http://local/api/t', {
      method: 'POST',
      // Fresh IP per call so the collector's rate limit never interferes.
      headers: { 'user-agent': ua, 'x-forwarded-for': `10.0.0.${++ip}` },
      body: typeof body === 'string' ? body : JSON.stringify(body),
    }),
  );

const fb = { source: 'facebook', medium: 'paid', campaign: 'wedding-oct' };

beforeAll(async () => {
  db = await getDb();
});

describe('POST /api/t', () => {
  it('stores a known event with attribution and a scrubbed card path', async () => {
    const res = await send({ n: 'page_view', v: 'visitor-aaaa1111', p: '/ar/p/ahmed-and-sara', utm: fb });
    expect(res.status).toBe(204);
    const rows = await db.select().from(events);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      name: 'page_view',
      path: '/ar/p/:card',
      utmSource: 'facebook',
      utmCampaign: 'wedding-oct',
      device: 'mobile',
    });
  });

  it('drops unknown events, bad ids, oversized props, bots and garbage — still 204', async () => {
    const before = (await db.select().from(events)).length;
    expect((await send({ n: 'hack', v: 'visitor-aaaa1111' })).status).toBe(204);
    expect((await send({ n: 'share', v: 'x' })).status).toBe(204);
    const props = Object.fromEntries(Array.from({ length: 9 }, (_, i) => [`k${i}`, i]));
    expect((await send({ n: 'share', v: 'visitor-aaaa1111', props })).status).toBe(204);
    expect((await send({ n: 'share', v: 'visitor-aaaa1111' }, 'Googlebot/2.1')).status).toBe(204);
    expect((await send('not json')).status).toBe(204);
    expect((await db.select().from(events)).length).toBe(before);
  });
});

describe('getAnalytics', () => {
  it('builds the funnel and credits approved revenue to the ad source', async () => {
    const [u] = await db.insert(users).values({ email: 'an-buyer@test.dev', locale: 'ar' }).returning();
    const [tpl] = await db
      .insert(templates)
      .values({ slug: 'an-tpl', titleEn: 'T', locale: 'ar', direction: 'rtl', definition: {} })
      .returning();
    const [exp] = await db
      .insert(experiences)
      .values({ userId: u.id, templateId: tpl.id, locale: 'ar', direction: 'rtl' })
      .returning();
    const [order] = await db
      .insert(orders)
      .values({ userId: u.id, experienceId: exp.id, templateId: tpl.id, amountPiastres: 14900, orderRef: 'CG-AN0001', status: 'approved' })
      .returning();

    const v = 'visitor-aaaa1111';
    await send({ n: 'create_started', v, utm: fb, props: { experienceId: exp.id } });
    await send({ n: 'payment_submitted', v, utm: fb, props: { orderId: order.id, value: 149 } });
    await send({ n: 'page_view', v: 'visitor-bbbb2222', p: '/en' });

    const a = await getAnalytics(db, 7);
    const step = (n: string) => a.funnel.find((f) => f.name === n)?.visitors;
    expect(step('page_view')).toBe(2);
    expect(step('create_started')).toBe(1);
    expect(step('payment_submitted')).toBe(1);

    const ad = a.sources.find((s) => s.source === 'facebook');
    expect(ad).toMatchObject({ campaign: 'wedding-oct', visitors: 1, created: 1, paid: 1, revenuePiastres: 14900 });
    expect(a.sources.find((s) => s.source === 'direct')).toMatchObject({ visitors: 1, revenuePiastres: 0 });
    expect(a.daily.length).toBeGreaterThan(0);
    expect(a.pages.map((p) => p.path)).toContain('/ar/p/:card');
  });
});
