import { after } from 'next/server';
import { parseWebhook, verifySignature } from '@/lib/messenger/meta';
import { handleEvents } from '@/server/messenger/handle';

export const runtime = 'nodejs';
// The agent replies after the 200 is sent (typing pauses, the model call).
export const maxDuration = 60;

// GET /api/messenger/webhook — Meta's one-time subscription handshake.
export async function GET(req: Request) {
  const q = new URL(req.url).searchParams;
  const expected = process.env.META_VERIFY_TOKEN;
  if (q.get('hub.mode') === 'subscribe' && expected && q.get('hub.verify_token') === expected) {
    return new Response(q.get('hub.challenge') ?? '', { status: 200, headers: { 'content-type': 'text/plain' } });
  }
  return new Response('forbidden', { status: 403 });
}

// POST /api/messenger/webhook — messages, echoes and Page comments.
export async function POST(req: Request) {
  const raw = await req.text();
  if (!verifySignature(raw, req.headers.get('x-hub-signature-256'), process.env.META_APP_SECRET)) {
    return new Response('bad signature', { status: 401 });
  }
  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return new Response('bad json', { status: 400 });
  }
  const events = parseWebhook(body, { pageId: process.env.META_PAGE_ID, appId: process.env.META_APP_ID });
  if (events.length) after(() => handleEvents(events));
  return new Response('EVENT_RECEIVED', { status: 200 });
}
