/**
 * Guest replies from an invitation's RSVP section. Submitting is anonymous
 * and gated like the card itself (active link, unlocked card); reading is
 * owner-only through the user context.
 */
import { and, count, desc, eq, inArray } from 'drizzle-orm';
import { z } from 'zod';
import { getDb } from '@/db';
import { experiences, rsvps, shareLinks, type Rsvp } from '@/db/schema';
import type { UserContext } from '@/server/db-context';

export const rsvpInput = z.object({
  slug: z.string().trim().min(1).max(64),
  name: z.string().trim().min(2).max(80),
  attending: z.boolean(),
  guests: z.number().int().min(0).max(20),
  note: z.string().trim().max(300).optional(),
});
export type RsvpInput = z.infer<typeof rsvpInput>;

/** Saves a reply. Returns false when the link does not lead to a live card. */
export async function submitRsvp(input: RsvpInput): Promise<boolean> {
  const db = await getDb();
  const row = (
    await db
      .select({ experienceId: experiences.id, isUnlocked: experiences.isUnlocked, link: shareLinks })
      .from(shareLinks)
      .innerJoin(experiences, eq(experiences.id, shareLinks.experienceId))
      .where(eq(shareLinks.slug, input.slug))
      .limit(1)
  )[0];
  if (!row || !row.isUnlocked) return false;
  const { link } = row;
  if (!link.isActive || link.visibility === 'disabled') return false;
  if (link.expiresAt && link.expiresAt.getTime() < Date.now()) return false;

  await db.insert(rsvps).values({
    experienceId: row.experienceId,
    name: input.name,
    attending: input.attending,
    // Someone who is not coming brings no one.
    guests: input.attending ? Math.max(1, input.guests) : 0,
    note: input.note || null,
  });
  return true;
}

export interface RsvpSummary {
  replies: Pick<Rsvp, 'id' | 'name' | 'attending' | 'guests' | 'note' | 'createdAt'>[];
  attending: number;
  declined: number;
  guests: number;
}

/** The owner's replies for one card, newest first. Null when the card is not theirs. */
export async function listRsvps(ctx: UserContext, experienceId: string): Promise<RsvpSummary | null> {
  if (!/^[0-9a-f-]{36}$/i.test(experienceId)) return null;
  const own = await ctx.db
    .select({ id: experiences.id })
    .from(experiences)
    .where(ctx.ownedBy(experiences.userId, eq(experiences.id, experienceId)))
    .limit(1);
  if (!own[0]) return null;
  const replies = await ctx.db
    .select({
      id: rsvps.id,
      name: rsvps.name,
      attending: rsvps.attending,
      guests: rsvps.guests,
      note: rsvps.note,
      createdAt: rsvps.createdAt,
    })
    .from(rsvps)
    .where(eq(rsvps.experienceId, experienceId))
    .orderBy(desc(rsvps.createdAt));
  const yes = replies.filter((r) => r.attending);
  return {
    replies,
    attending: yes.length,
    declined: replies.length - yes.length,
    guests: yes.reduce((n, r) => n + r.guests, 0),
  };
}

/** Reply counts per card, for the dashboard list. */
export async function countRsvps(ctx: UserContext, experienceIds: string[]): Promise<Map<string, number>> {
  if (experienceIds.length === 0) return new Map();
  const rows = await ctx.db
    .select({ experienceId: rsvps.experienceId, n: count() })
    .from(rsvps)
    .innerJoin(experiences, eq(experiences.id, rsvps.experienceId))
    .where(and(eq(experiences.userId, ctx.user.id), inArray(rsvps.experienceId, experienceIds)))
    .groupBy(rsvps.experienceId);
  return new Map(rows.map((r) => [r.experienceId, Number(r.n)]));
}

