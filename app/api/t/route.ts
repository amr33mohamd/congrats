/**
 * POST /api/t — anonymous event collector for lib/track.ts (sendBeacon).
 * Always answers 204 so a blocked or malformed beacon never surfaces in the
 * page; bad input is simply dropped.
 */
import { z } from 'zod';
import { getDb } from '@/db';
import { events } from '@/db/schema';
import { clientIp, rateLimit } from '@/lib/rate-limit';
import { EVENT_NAMES, scrubPath } from '@/lib/track-events';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const short = z.string().trim().max(100).optional();

const Body = z.object({
  n: z.enum(EVENT_NAMES),
  v: z.string().regex(/^[A-Za-z0-9-]{8,64}$/),
  p: z.string().max(300).optional(),
  r: short,
  props: z
    .record(z.string().max(40), z.union([z.string().max(100), z.number().finite(), z.boolean()]))
    .refine((o) => Object.keys(o).length <= 8)
    .optional(),
  utm: z
    .object({ source: short, medium: short, campaign: short, content: short })
    .partial()
    .optional(),
});

const BOT = /bot|crawl|spider|slurp|facebookexternalhit|preview|headless|lighthouse/i;

const noContent = () => new Response(null, { status: 204 });

export async function POST(req: Request) {
  const ua = req.headers.get('user-agent') ?? '';
  if (BOT.test(ua)) return noContent();
  if (!rateLimit(`t:${clientIp(req)}`, 120, 60_000).ok) return noContent();

  let parsed;
  try {
    parsed = Body.safeParse(JSON.parse(await req.text()));
  } catch {
    return noContent();
  }
  if (!parsed.success) return noContent();
  const b = parsed.data;

  try {
    const db = await getDb();
    await db.insert(events).values({
      name: b.n,
      visitorId: b.v,
      path: b.p ? scrubPath(b.p) : null,
      props: b.props ?? null,
      utmSource: b.utm?.source || null,
      utmMedium: b.utm?.medium || null,
      utmCampaign: b.utm?.campaign || null,
      utmContent: b.utm?.content || null,
      referrer: b.r || null,
      device: /mobile|android|iphone|ipad/i.test(ua) ? 'mobile' : 'desktop',
      country: req.headers.get('x-vercel-ip-country')?.slice(0, 2) || null,
    });
  } catch (err) {
    console.error('[track] insert failed', err);
  }
  return noContent();
}
