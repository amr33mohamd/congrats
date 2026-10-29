/**
 * POST /api/rsvp — a guest's reply from an invitation's RSVP section.
 * Anonymous; the share link is the gate (see server/rsvp/rsvp-service).
 */
import { NextResponse } from 'next/server';
import { clientIp, rateLimit } from '@/lib/rate-limit';
import { rsvpInput, submitRsvp } from '@/server/rsvp/rsvp-service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const fail = (status: number, code: string) => NextResponse.json({ error: { code } }, { status });

export async function POST(req: Request) {
  if (!rateLimit(`rsvp:${clientIp(req)}`, 10, 10 * 60_000).ok) return fail(429, 'RATE_LIMITED');

  let parsed;
  try {
    parsed = rsvpInput.safeParse(await req.json());
  } catch {
    return fail(400, 'VALIDATION');
  }
  if (!parsed.success) return fail(400, 'VALIDATION');

  try {
    if (!(await submitRsvp(parsed.data))) return fail(404, 'NOT_FOUND');
  } catch (err) {
    console.error('[rsvp] insert failed', err);
    return fail(500, 'INTERNAL');
  }
  return NextResponse.json({ ok: true }, { status: 201 });
}
