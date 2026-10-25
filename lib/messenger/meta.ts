/**
 * Meta Messenger Platform: webhook signature check, event parsing and the
 * Graph API calls the bot makes (send, typing, private reply, comment reply).
 *
 * Secrets come only from env (META_APP_SECRET, META_PAGE_ACCESS_TOKEN) and are
 * never logged. Parsing is pure so it is unit-tested without the network.
 */
import { createHmac, timingSafeEqual } from 'node:crypto';

const GRAPH = `https://graph.facebook.com/${process.env.META_GRAPH_VERSION || 'v23.0'}`;

/** `X-Hub-Signature-256: sha256=<hex>` over the raw body, keyed by the app secret. */
export function verifySignature(rawBody: string, header: string | null, appSecret: string | undefined): boolean {
  if (!appSecret || !header?.startsWith('sha256=')) return false;
  const expected = createHmac('sha256', appSecret).update(rawBody, 'utf8').digest();
  let given: Buffer;
  try {
    given = Buffer.from(header.slice('sha256='.length), 'hex');
  } catch {
    return false;
  }
  return given.length === expected.length && timingSafeEqual(given, expected);
}

export type InboundEvent =
  | { kind: 'message'; psid: string; mid: string; text: string; imageUrls: string[]; at: number }
  // The Page itself sent a message: from this app (ignored) or a person in Business Suite (takeover).
  | { kind: 'echo'; psid: string; mid: string; text: string; fromThisApp: boolean; at: number }
  | { kind: 'comment'; commentId: string; postId: string; fromId: string; fromName: string; text: string; isReply: boolean; at: number };

type Json = Record<string, unknown>;
const obj = (v: unknown): Json => (v && typeof v === 'object' ? (v as Json) : {});
const str = (v: unknown): string => (typeof v === 'string' ? v : typeof v === 'number' ? String(v) : '');

/** Flattens a webhook payload into the events the bot acts on. Unknown shapes are skipped. */
export function parseWebhook(body: unknown, opts: { pageId?: string; appId?: string } = {}): InboundEvent[] {
  const root = obj(body);
  if (root.object !== 'page' || !Array.isArray(root.entry)) return [];
  const out: InboundEvent[] = [];

  for (const e of root.entry) {
    const entry = obj(e);

    for (const m of Array.isArray(entry.messaging) ? entry.messaging : []) {
      const ev = obj(m);
      const msg = obj(ev.message);
      if (!msg.mid) continue;
      const at = Number(ev.timestamp) || Date.now();
      const attachments = Array.isArray(msg.attachments) ? msg.attachments.map(obj) : [];
      if (msg.is_echo) {
        const psid = str(obj(ev.recipient).id);
        if (!psid) continue;
        out.push({
          kind: 'echo',
          psid,
          mid: str(msg.mid),
          text: str(msg.text),
          fromThisApp: !!opts.appId && str(msg.app_id) === opts.appId,
          at,
        });
        continue;
      }
      const psid = str(obj(ev.sender).id);
      if (!psid || psid === opts.pageId) continue;
      out.push({
        kind: 'message',
        psid,
        mid: str(msg.mid),
        text: str(msg.text),
        imageUrls: attachments
          .filter((a) => a.type === 'image')
          .map((a) => str(obj(a.payload).url))
          .filter(Boolean),
        at,
      });
    }

    for (const c of Array.isArray(entry.changes) ? entry.changes : []) {
      const change = obj(c);
      const v = obj(change.value);
      if (change.field !== 'feed' || v.item !== 'comment' || v.verb !== 'add') continue;
      const from = obj(v.from);
      const fromId = str(from.id);
      if (!fromId || fromId === opts.pageId) continue;
      const postId = str(v.post_id);
      const parentId = str(v.parent_id);
      out.push({
        kind: 'comment',
        commentId: str(v.comment_id),
        postId,
        fromId,
        fromName: str(from.name),
        text: str(v.message),
        // A reply under another comment, not a comment on the post itself.
        isReply: !!parentId && parentId !== postId,
        at: (Number(v.created_time) || Date.now() / 1000) * 1000,
      });
    }
  }
  return out;
}

/**
 * Splits the agent's reply into Messenger messages: paragraphs become separate
 * messages and a link always travels alone, so its preview card shows.
 */
export function splitReply(text: string, max = 4): string[] {
  const parts: string[] = [];
  for (const para of text.split(/\n\s*\n/)) {
    let buf: string[] = [];
    for (const line of para.split('\n')) {
      const t = line.trim();
      if (!t) continue;
      if (/^https?:\/\/\S+$/.test(t) || t === '[[LINK]]') {
        if (buf.length) parts.push(buf.join('\n'));
        buf = [];
        parts.push(t);
      } else {
        buf.push(t);
      }
    }
    if (buf.length) parts.push(buf.join('\n'));
  }
  return parts.slice(0, max);
}

class GraphError extends Error {
  constructor(message: string, readonly code?: number) {
    super(message);
  }
}

async function graph(path: string, body: Json): Promise<Json> {
  const token = process.env.META_PAGE_ACCESS_TOKEN;
  if (!token) throw new GraphError('META_PAGE_ACCESS_TOKEN is not set');
  const res = await fetch(`${GRAPH}${path}?access_token=${encodeURIComponent(token)}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = obj(await res.json().catch(() => ({})));
  if (!res.ok) {
    const err = obj(json.error);
    throw new GraphError(`Graph ${path} failed: ${str(err.message) || res.status}`, Number(err.code) || undefined);
  }
  return json;
}

export async function sendText(psid: string, text: string): Promise<string> {
  const r = await graph('/me/messages', {
    recipient: { id: psid },
    messaging_type: 'RESPONSE',
    message: { text },
  });
  return str(r.message_id);
}

export async function sendTyping(psid: string): Promise<void> {
  await graph('/me/messages', { recipient: { id: psid }, sender_action: 'typing_on' }).catch(() => {});
}

/** Meta allows one private reply per comment. Returns the commenter's PSID for later messages. */
export async function sendPrivateReply(commentId: string, text: string): Promise<{ psid: string; mid: string }> {
  const r = await graph('/me/messages', { recipient: { comment_id: commentId }, message: { text } });
  return { psid: str(r.recipient_id), mid: str(r.message_id) };
}

/** Public reply under a comment, as the Page. */
export async function replyToComment(commentId: string, message: string): Promise<void> {
  await graph(`/${encodeURIComponent(commentId)}/comments`, { message });
}

export async function getProfileName(psid: string): Promise<string | null> {
  const token = process.env.META_PAGE_ACCESS_TOKEN;
  if (!token) return null;
  try {
    const res = await fetch(`${GRAPH}/${encodeURIComponent(psid)}?fields=first_name,name&access_token=${encodeURIComponent(token)}`);
    if (!res.ok) return null;
    const j = obj(await res.json());
    return str(j.first_name) || str(j.name) || null;
  } catch {
    return null;
  }
}
