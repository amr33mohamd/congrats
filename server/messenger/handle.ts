/**
 * What the bot does with each webhook event. Runs after the webhook has already
 * answered 200 (next/server `after()`), so a slow model never makes Meta retry.
 *
 * Safety switches (env):
 *  - MESSENGER_BOT_ENABLED=true  → the bot replies at all; otherwise it only logs.
 *  - MESSENGER_TEST_PSIDS=a,b    → while set, it replies only to these people and
 *                                  leaves comments alone (for testing on the live Page).
 *  - MESSENGER_COMMENTS_ENABLED=true → also answers comments on the Page's posts.
 */
import { and, desc, eq, gte, inArray, lte } from 'drizzle-orm';
import { getDb } from '@/db';
import { messengerMessages, messengerThreads, type MessengerThread } from '@/db/schema';
import { notifyAdmin, cairoTime } from '@/lib/admin-notify';
import {
  getProfileName,
  replyToComment,
  sendPrivateReply,
  sendCard,
  sendText,
  sendTyping,
  splitReply,
  type InboundEvent,
  type LinkCard,
} from '@/lib/messenger/meta';
import { normalizeTurns, runAgent, withImages, withoutImages, type ToolDef } from '@/server/agent/claude';
import { invitationCatalog, previewImageUrl, previewUrl } from '@/server/agent/catalog';
import { FACT_KEYS, systemPrompt, type Facts } from '@/server/agent/prompt';

const HUMAN_PAUSE_MS = 12 * 60 * 60 * 1000;
const DEBOUNCE_MS = 4000;
const HISTORY = 30;

const log = (what: string) => console.info(`[messenger] ${what}`);
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function commentsEnabled(env: Record<string, string | undefined> = process.env): boolean {
  const testing = (env.MESSENGER_TEST_PSIDS ?? '').trim() !== '';
  return env.MESSENGER_BOT_ENABLED === 'true' && env.MESSENGER_COMMENTS_ENABLED === 'true' && !testing;
}

export function botMayReply(psid: string | null, env: Record<string, string | undefined> = process.env): boolean {
  if (env.MESSENGER_BOT_ENABLED !== 'true') return false;
  const allow = (env.MESSENGER_TEST_PSIDS ?? '').split(',').map((s) => s.trim()).filter(Boolean);
  if (allow.length === 0) return true;
  return psid !== null && allow.includes(psid);
}

function isNightInCairo(d = new Date()): boolean {
  const h = Number(new Intl.DateTimeFormat('en-GB', { timeZone: 'Africa/Cairo', hour: '2-digit', hour12: false }).format(d));
  return h >= 23 || h < 8;
}

async function threadFor(psid: string): Promise<MessengerThread> {
  const db = await getDb();
  const [row] = await db
    .insert(messengerThreads)
    .values({ psid })
    .onConflictDoUpdate({ target: messengerThreads.psid, set: { updatedAt: new Date() } })
    .returning();
  return row;
}

/** Stores a message once; false when Meta already delivered this one. */
async function record(threadId: string | null, m: { mid: string | null; direction: 'in' | 'out'; kind: string; body: string }) {
  const db = await getDb();
  const rows = await db
    .insert(messengerMessages)
    .values({ threadId, mid: m.mid, direction: m.direction, kind: m.kind, body: m.body })
    .onConflictDoNothing({ target: messengerMessages.mid })
    .returning({ id: messengerMessages.id });
  return rows.length > 0;
}

export async function handleEvents(events: InboundEvent[]): Promise<void> {
  for (const ev of events) {
    try {
      if (ev.kind === 'message') await onMessage(ev);
      else if (ev.kind === 'echo') await onEcho(ev);
      else await onComment(ev);
    } catch (err) {
      console.error('[messenger] event failed', ev.kind, err);
    }
  }
}

async function onEcho(ev: Extract<InboundEvent, { kind: 'echo' }>) {
  if (ev.fromThisApp) return; // our own message coming back
  // Someone on the team replied from Business Suite: they have the chat now.
  const thread = await threadFor(ev.psid);
  await record(thread.id, { mid: ev.mid, direction: 'out', kind: 'human', body: ev.text });
  const db = await getDb();
  await db
    .update(messengerThreads)
    .set({ pausedUntil: new Date(Date.now() + HUMAN_PAUSE_MS), updatedAt: new Date() })
    .where(eq(messengerThreads.id, thread.id));
}

/** A Page reply this close to a customer message is an automation (instant reply, away message), not a person. */
export const AUTOMATION_WINDOW_MS = 15_000;

export function looksAutomated(pageReplyAt: Date, nearestInboundAt: Date | null): boolean {
  return !!nearestInboundAt && Math.abs(pageReplyAt.getTime() - nearestInboundAt.getTime()) < AUTOMATION_WINDOW_MS;
}

/**
 * Business Suite automations echo exactly like a person replying from the
 * inbox, so a pause only counts when it came from a handoff or from a Page
 * reply that was not sent right after the customer wrote.
 */
async function pauseIsReal(threadId: string): Promise<boolean> {
  const db = await getDb();
  const [last] = await db
    .select({ kind: messengerMessages.kind, createdAt: messengerMessages.createdAt })
    .from(messengerMessages)
    .where(and(eq(messengerMessages.threadId, threadId), inArray(messengerMessages.kind, ['human', 'system'])))
    .orderBy(desc(messengerMessages.createdAt))
    .limit(1);
  if (!last || last.kind === 'system') return true;
  const from = new Date(last.createdAt.getTime() - AUTOMATION_WINDOW_MS);
  const to = new Date(last.createdAt.getTime() + AUTOMATION_WINDOW_MS);
  const [near] = await db
    .select({ createdAt: messengerMessages.createdAt })
    .from(messengerMessages)
    .where(
      and(
        eq(messengerMessages.threadId, threadId),
        eq(messengerMessages.direction, 'in'),
        gte(messengerMessages.createdAt, from),
        lte(messengerMessages.createdAt, to),
      ),
    )
    .limit(1);
  return !looksAutomated(last.createdAt, near?.createdAt ?? null);
}

async function onMessage(ev: Extract<InboundEvent, { kind: 'message' }>) {
  const thread = await threadFor(ev.psid);
  const body = [ev.text, ...ev.imageUrls.map((u) => `[صورة] ${u}`)].filter(Boolean).join('\n');
  const fresh = await record(thread.id, { mid: ev.mid, direction: 'in', kind: ev.imageUrls.length ? 'image' : 'text', body });
  if (!fresh) return log('message: already handled');

  const db = await getDb();
  await db
    .update(messengerThreads)
    .set({ lastInboundAt: new Date(ev.at), updatedAt: new Date() })
    .where(eq(messengerThreads.id, thread.id));

  if (!botMayReply(ev.psid)) return log('message: bot is off for this person');
  if (thread.pausedUntil && thread.pausedUntil > new Date()) {
    if (await pauseIsReal(thread.id)) return log('message: chat paused for a person');
    await db.update(messengerThreads).set({ pausedUntil: null }).where(eq(messengerThreads.id, thread.id));
    log('message: pause came from a Business Suite automation, ignoring it');
  }

  // People often send several short messages in a row: answer once, after the last.
  await sleep(DEBOUNCE_MS);
  const [latest] = await db
    .select({ mid: messengerMessages.mid })
    .from(messengerMessages)
    .where(and(eq(messengerMessages.threadId, thread.id), eq(messengerMessages.direction, 'in')))
    .orderBy(desc(messengerMessages.createdAt))
    .limit(1);
  if (latest?.mid !== ev.mid) return log('message: a newer message will be answered');

  if (!thread.displayName) {
    const name = await getProfileName(ev.psid);
    if (name) {
      await db.update(messengerThreads).set({ displayName: name }).where(eq(messengerThreads.id, thread.id));
      thread.displayName = name;
    }
  }

  const result = await converse(thread, { fromComment: false });
  if (!result) return log('message: nothing to answer');
  if (result.parts.length === 0) return log('message: the agent chose not to reply');
  await deliver(thread, ev.psid, result.parts, result.card);
  log(`message: replied with ${result.parts.length} message(s)`);
}

async function onComment(ev: Extract<InboundEvent, { kind: 'comment' }>) {
  if (ev.isReply || !ev.commentId || !ev.text.trim()) return;
  const fresh = await record(null, { mid: `comment:${ev.commentId}`, direction: 'in', kind: 'comment', body: ev.text });
  if (!fresh) return;
  if (!commentsEnabled()) return;

  // The commenter has no Messenger thread yet: the agent answers the comment alone.
  const scratch = {
    id: '',
    psid: '',
    displayName: ev.fromName.split(' ')[0] || null,
    stage: 'new',
    facts: {},
    pausedUntil: null,
    lastInboundAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as MessengerThread;
  const result = await converse(scratch, { fromComment: true, commentText: ev.text });
  if (!result || result.parts.length === 0) return;

  // The link goes first: it is the part that matters if Meta refuses the follow-up.
  const parts = [...result.parts.filter(isLink), ...result.parts.filter((p) => !isLink(p))];
  const first = await sendPrivateReply(ev.commentId, parts[0]);
  if (!first.psid) return;

  const thread = await threadFor(first.psid);
  const db = await getDb();
  await db
    .update(messengerThreads)
    .set({ displayName: scratch.displayName, facts: scratch.facts, stage: scratch.stage, updatedAt: new Date() })
    .where(eq(messengerThreads.id, thread.id));
  await db
    .update(messengerMessages)
    .set({ threadId: thread.id })
    .where(eq(messengerMessages.mid, `comment:${ev.commentId}`));
  await record(thread.id, { mid: first.mid || null, direction: 'out', kind: 'text', body: parts[0] });
  await deliver(thread, first.psid, parts.slice(1), result.card);

  await replyToComment(
    ev.commentId,
    result.previewSent ? 'ألف مبروك 🤍 بعتنالك دعوتكم بأساميكم في رسالة 💌' : 'بعتنالك التفاصيل في رسالة 💌',
  ).catch((err) => console.error('[messenger] public reply failed', err));
}

/**
 * The agent writes [[LINK]] and the exact URL is put in here: a model retyping a
 * long percent-encoded link tends to corrupt it. A link the agent forgot goes
 * after its first message, alone, as always.
 */
export function placeLink(parts: string[], link: string | null): string[] {
  const out = parts
    .map((p) => p.replace(/\[\[LINK\]\]/g, link ?? '').trim())
    .filter(Boolean)
    .filter((p) => !/^https?:\/\//.test(p) || p === link); // never pass on a link the model typed itself
  if (link && !out.includes(link)) out.splice(Math.min(1, out.length), 0, link);
  return out;
}

const isLink = (s: string) => /^https?:\/\/\S+$/.test(s);

async function deliver(thread: MessengerThread, psid: string, parts: string[], card: LinkCard | null = null) {
  for (const part of parts) {
    await sendTyping(psid);
    await sleep(Math.min(1200 + part.length * 25, 4500));
    let mid: string;
    if (card && part === card.url) {
      // The preview goes as a card with a button; the plain link is the fallback.
      mid = await sendCard(psid, card).catch((err) => {
        console.warn('[messenger] card failed, sending the link as text', String((err as Error).message).slice(0, 200));
        return sendText(psid, part);
      });
    } else {
      mid = await sendText(psid, part);
    }
    await record(thread.id, { mid: mid || null, direction: 'out', kind: 'text', body: part });
  }
}

async function converse(
  thread: MessengerThread,
  opts: { fromComment: boolean; commentText?: string },
): Promise<{ parts: string[]; previewSent: boolean; card: LinkCard | null } | null> {
  const db = await getDb();
  const catalog = await invitationCatalog();
  const facts: Facts = { ...((thread.facts as Facts) ?? {}) };
  let previewSent = false;
  let previewLink: string | null = null;
  let card: LinkCard | null = null;
  let handedOff: string | null = null;

  const history = thread.id
    ? (
        await db
          .select({ direction: messengerMessages.direction, kind: messengerMessages.kind, body: messengerMessages.body })
          .from(messengerMessages)
          .where(eq(messengerMessages.threadId, thread.id))
          .orderBy(desc(messengerMessages.createdAt))
          .limit(HISTORY)
      ).reverse()
    : [];
  const turns = normalizeTurns([
    ...history.filter((m) => m.kind !== 'system').map((m) => ({
      role: m.direction === 'in' ? ('user' as const) : ('assistant' as const),
      text: m.kind === 'comment' ? `[تعليق على إعلاننا]: ${m.body}` : m.body,
    })),
    ...(opts.commentText ? [{ role: 'user' as const, text: `[تعليق على إعلاننا]: ${opts.commentText}` }] : []),
  ]);
  if (turns.length === 0) return null;

  const tools: ToolDef[] = [
    {
      name: 'make_preview',
      description:
        "Prepares the watermarked preview of a design with the couple's names on it. Call it as soon as you know both names. Then write the token [[LINK]] alone on its own line where the link goes; never type a link yourself.",
      input_schema: {
        type: 'object',
        properties: {
          names: { type: 'string', description: 'The couple, e.g. "أحمد وسارة"' },
          slug: { type: 'string', description: 'Design slug from the list; omit for the default design' },
        },
        required: ['names'],
      },
      run: async (input) => {
        const names = String(input.names ?? '').trim();
        if (!names) throw new Error('names is required');
        const item = catalog.find((c) => c.slug === input.slug) ?? catalog.find((c) => c.slug.includes('ivory-arch')) ?? catalog[0];
        if (!item) throw new Error('no design available: hand off');
        facts.names = names;
        facts.template = item.slug;
        previewSent = true;
        previewLink = previewUrl(item.slug, names);
        card = {
          url: previewLink,
          title: `دعوة فرح ${names}`,
          subtitle: 'افتحها وشوفها بتتفتح قدامك ✨',
          imageUrl: previewImageUrl(item.slug, names),
          button: 'افتح الدعوة 💌',
        };
        return 'Ready. Put [[LINK]] alone on its own line in your reply; it becomes the link.';
      },
    },
    {
      name: 'remember',
      description: 'Saves details the customer gave (names, design slug, wedding date, start time, venue, location link, notes) so you never ask twice.',
      input_schema: {
        type: 'object',
        properties: Object.fromEntries(FACT_KEYS.map((k) => [k, { type: 'string' }])),
      },
      run: async (input) => {
        for (const k of FACT_KEYS) {
          const v = input[k];
          if (typeof v === 'string' && v.trim()) facts[k] = v.trim().slice(0, 200);
        }
        return 'saved';
      },
    },
    {
      name: 'handoff',
      description: 'Passes the chat to a person on the team and pauses you in this chat. Use for: a person requested, complaints, refunds, custom designs, payment screenshots, anything you cannot answer.',
      input_schema: {
        type: 'object',
        properties: { reason: { type: 'string' } },
        required: ['reason'],
      },
      run: async (input) => {
        handedOff = String(input.reason ?? 'handoff').slice(0, 200);
        return 'The team is notified. Tell the customer warmly that someone will reply.';
      },
    },
  ];

  const now = new Date();
  const system = systemPrompt({
    catalog,
    facts,
    customerName: thread.displayName,
    cairoNow: cairoTime(now),
    isNight: isNightInCairo(now),
    instapayHandle: process.env.INSTAPAY_HANDLE?.trim() || null,
    fromComment: opts.fromComment,
  });
  let text: string;
  try {
    text = await runAgent({ system, turns: withImages(turns), tools });
  } catch (err) {
    // Usually an image Meta no longer serves: answer from the text alone.
    console.warn('[messenger] retrying without images', String((err as Error).message).slice(0, 200));
    text = await runAgent({ system, turns: withoutImages(turns), tools });
  }

  thread.facts = facts;
  if (previewSent && thread.stage === 'new') thread.stage = 'previewed';
  if (thread.id) {
    await db
      .update(messengerThreads)
      .set({
        facts,
        stage: thread.stage,
        pausedUntil: handedOff ? new Date(Date.now() + HUMAN_PAUSE_MS) : thread.pausedUntil,
        updatedAt: new Date(),
      })
      .where(eq(messengerThreads.id, thread.id));
  }
  if (handedOff) {
    if (thread.id) await record(thread.id, { mid: null, direction: 'out', kind: 'system', body: `handoff: ${handedOff}` });
    const lastIn = history.filter((m) => m.direction === 'in').at(-1)?.body ?? opts.commentText ?? '';
    await notifyAdmin({
      subject: `Messenger: ${thread.displayName ?? 'a customer'} needs you`,
      rows: [
        ['Reason', handedOff],
        ['Last message', lastIn.slice(0, 300)],
        ['Names', facts.names ?? '—'],
        ['Date / venue', [facts.date, facts.time, facts.venue].filter(Boolean).join(' · ') || '—'],
        ['Time (Cairo)', cairoTime(now)],
      ],
    });
  }

  if (handedOff && (!text || text.trim() === 'SKIP')) {
    // The customer must never be left without an answer after a handoff.
    text = isNightInCairo(now)
      ? 'تمام، وصلني 🤍 حد من الفريق هيرد عليك الصبح بإذن الله'
      : 'تمام، وصلني 🤍 حد من الفريق هيرد عليك حالًا';
  }
  if (!text || text.trim() === 'SKIP') return { parts: [], previewSent, card };
  return { parts: placeLink(splitReply(text), previewLink), previewSent, card };
}
