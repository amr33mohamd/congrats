/**
 * What the bot does with each webhook event. Runs after the webhook has already
 * answered 200 (next/server `after()`), so a slow model never makes Meta retry.
 *
 * Safety switches (env):
 *  - MESSENGER_BOT_ENABLED=true  → the bot replies at all; otherwise it only logs.
 *  - MESSENGER_TEST_PSIDS=a,b    → while set, it replies only to these people and
 *                                  leaves comments alone (for testing on the live Page).
 */
import { and, desc, eq } from 'drizzle-orm';
import { getDb } from '@/db';
import { messengerMessages, messengerThreads, type MessengerThread } from '@/db/schema';
import { notifyAdmin, cairoTime } from '@/lib/admin-notify';
import {
  getProfileName,
  replyToComment,
  sendPrivateReply,
  sendText,
  sendTyping,
  splitReply,
  type InboundEvent,
} from '@/lib/messenger/meta';
import { normalizeTurns, runAgent, type ToolDef } from '@/server/agent/claude';
import { invitationCatalog, previewUrl } from '@/server/agent/catalog';
import { FACT_KEYS, systemPrompt, type Facts } from '@/server/agent/prompt';

const HUMAN_PAUSE_MS = 12 * 60 * 60 * 1000;
const DEBOUNCE_MS = 4000;
const HISTORY = 30;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function testPsids(): string[] {
  return (process.env.MESSENGER_TEST_PSIDS ?? '').split(',').map((s) => s.trim()).filter(Boolean);
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

async function onMessage(ev: Extract<InboundEvent, { kind: 'message' }>) {
  const thread = await threadFor(ev.psid);
  const body = [ev.text, ...ev.imageUrls.map((u) => `[صورة] ${u}`)].filter(Boolean).join('\n');
  const fresh = await record(thread.id, { mid: ev.mid, direction: 'in', kind: ev.imageUrls.length ? 'image' : 'text', body });
  if (!fresh) return;

  const db = await getDb();
  await db
    .update(messengerThreads)
    .set({ lastInboundAt: new Date(ev.at), updatedAt: new Date() })
    .where(eq(messengerThreads.id, thread.id));

  if (!botMayReply(ev.psid)) return;
  if (thread.pausedUntil && thread.pausedUntil > new Date()) return;

  // People often send several short messages in a row: answer once, after the last.
  await sleep(DEBOUNCE_MS);
  const [latest] = await db
    .select({ mid: messengerMessages.mid })
    .from(messengerMessages)
    .where(and(eq(messengerMessages.threadId, thread.id), eq(messengerMessages.direction, 'in')))
    .orderBy(desc(messengerMessages.createdAt))
    .limit(1);
  if (latest?.mid !== ev.mid) return;

  if (!thread.displayName) {
    const name = await getProfileName(ev.psid);
    if (name) {
      await db.update(messengerThreads).set({ displayName: name }).where(eq(messengerThreads.id, thread.id));
      thread.displayName = name;
    }
  }

  const result = await converse(thread, { fromComment: false });
  if (!result) return;
  await deliver(thread, ev.psid, result.parts);
}

async function onComment(ev: Extract<InboundEvent, { kind: 'comment' }>) {
  if (ev.isReply || !ev.commentId || !ev.text.trim()) return;
  const fresh = await record(null, { mid: `comment:${ev.commentId}`, direction: 'in', kind: 'comment', body: ev.text });
  if (!fresh) return;
  if (process.env.MESSENGER_BOT_ENABLED !== 'true' || testPsids().length > 0) return;

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
  await deliver(thread, first.psid, parts.slice(1));

  await replyToComment(
    ev.commentId,
    result.previewSent ? 'ألف مبروك 🤍 بعتنالك دعوتكم بأساميكم في رسالة 💌' : 'بعتنالك التفاصيل في رسالة 💌',
  ).catch((err) => console.error('[messenger] public reply failed', err));
}

const isLink = (s: string) => /^https?:\/\/\S+$/.test(s);

async function deliver(thread: MessengerThread, psid: string, parts: string[]) {
  for (const part of parts) {
    await sendTyping(psid);
    await sleep(Math.min(1200 + part.length * 25, 4500));
    const mid = await sendText(psid, part);
    await record(thread.id, { mid: mid || null, direction: 'out', kind: 'text', body: part });
  }
}

async function converse(
  thread: MessengerThread,
  opts: { fromComment: boolean; commentText?: string },
): Promise<{ parts: string[]; previewSent: boolean } | null> {
  const db = await getDb();
  const catalog = await invitationCatalog();
  const facts: Facts = { ...((thread.facts as Facts) ?? {}) };
  let previewSent = false;
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
    ...history.map((m) => ({
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
        "Returns the watermarked preview link of a design with the couple's names on it. Call it as soon as you know both names. Send the link alone on its own line.",
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
        return previewUrl(item.slug, names);
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
  const text = await runAgent({
    system: systemPrompt({
      catalog,
      facts,
      customerName: thread.displayName,
      cairoNow: cairoTime(now),
      isNight: isNightInCairo(now),
      instapayHandle: process.env.INSTAPAY_HANDLE?.trim() || null,
      fromComment: opts.fromComment,
    }),
    turns,
    tools,
  });

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

  if (!text || text.trim() === 'SKIP') return { parts: [], previewSent };
  return { parts: splitReply(text), previewSent };
}
