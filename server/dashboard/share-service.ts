/**
 * Share-link + publish + public-render services.
 *
 *  - `ensureShareLink`         : idempotently create/return the experience's
 *                                share slug (nanoid). One link per experience.
 *  - `publishExperience`       : FREE template → unlock immediately + activate
 *                                link; PAID template → create a `pending` order
 *                                (caller must then pay). Free unlock here is the
 *                                ONLY non-state-machine unlock and is allowed by
 *                                contract ("free template publishes directly").
 *  - `getPublicExperienceBySlug`: returns a BoundExperience ONLY when the gate
 *                                passes (link active + not disabled + not
 *                                expired + experience unlocked). Binds media rows
 *                                to signed URLs. Returns null otherwise — no
 *                                detail leakage. This mirrors F0's load-experience
 *                                gate but adds the media binding B1 owns.
 */
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import type { UserContext } from '@/server/db-context';
import { getDb } from '@/db';
import { shareLinks, experiences, templates, steps, media } from '@/db/schema';
import type { Media } from '@/db/schema';
import {
  parseTemplateDefinition,
  applyTokens,
  type BoundExperience,
  type BoundStep,
  type BoundMedia,
  type SceneDef,
} from '@/lib/template-contract';
import { createOrder, type CreatedOrder } from './orders-service';
import { signedUrlForMedia } from './media-service';
import { DashboardError } from './errors';
import * as repo from './repositories';

const SLUG_SIZE = 10;

export async function ensureShareLink(
  ctx: UserContext,
  experienceId: string,
): Promise<{ slug: string }> {
  const exp = await repo.getOwnedExperience(ctx.db, ctx.user.id, experienceId);
  if (!exp) throw DashboardError.notFound('experience not found');

  const existing = await repo.getShareLinkByExperience(ctx.db, experienceId);
  if (existing) return { slug: existing.slug };

  // Retry on the (astronomically unlikely) slug collision.
  for (let attempt = 0; attempt < 5; attempt++) {
    const slug = nanoid(SLUG_SIZE);
    try {
      const link = await repo.insertShareLink(ctx.db, {
        experienceId,
        slug,
        // A new experience's link starts INACTIVE until publish/approval unlocks it.
        isActive: false,
        visibility: 'public',
      });
      return { slug: link.slug };
    } catch (err) {
      // Unique violation on slug → retry; unique on experienceId → someone else
      // created it concurrently, return that one.
      const concurrent = await repo.getShareLinkByExperience(ctx.db, experienceId);
      if (concurrent) return { slug: concurrent.slug };
      if (attempt === 4) throw err;
    }
  }
  throw DashboardError.conflict('could not allocate a share slug');
}

export type PublishResult =
  | { kind: 'published'; slug: string }
  | { kind: 'payment_required'; order: CreatedOrder; slug: string };

export async function publishExperience(
  ctx: UserContext,
  experienceId: string,
): Promise<PublishResult> {
  const exp = await repo.getOwnedExperience(ctx.db, ctx.user.id, experienceId);
  if (!exp) throw DashboardError.notFound('experience not found');

  const tpl = await repo.getTemplateById(ctx.db, exp.templateId);
  if (!tpl) throw DashboardError.notFound('template not found');

  // The experience must have at least one step to be playable.
  const stepRows = await repo.listSteps(ctx.db, experienceId);
  if (stepRows.length === 0) {
    throw DashboardError.unprocessable('experience has no steps to publish');
  }

  // Every REQUIRED image slot must have its minimum photos uploaded — otherwise
  // a user could pay for / publish a photo card with empty picture scenes.
  const def = parseTemplateDefinition(tpl.definition);
  const mediaRows = await repo.listExperienceMedia(ctx.db, ctx.user.id, experienceId);
  const mediaCount = (stepId: string, slotKey: string) =>
    mediaRows.filter((m) => m.templateStepId === stepId && m.slotKey === slotKey).length;
  for (const scene of def.scenes) {
    for (const slot of scene.slots) {
      if (slot.type !== 'image' || !slot.required) continue;
      const min = slot.min ?? 1;
      if (mediaCount(scene.id, slot.key) < min) {
        throw DashboardError.unprocessable(
          `add ${min} photo${min > 1 ? 's' : ''} to every required picture scene before publishing`,
        );
      }
    }
  }

  const { slug } = await ensureShareLink(ctx, experienceId);

  if (!tpl.isPaid || tpl.pricePiastres <= 0) {
    // FREE → publish directly: unlock + activate link. (Contract-sanctioned;
    // paid unlock always goes through the order state machine instead.)
    await repo.updateOwnedExperience(ctx.db, ctx.user.id, experienceId, {
      isUnlocked: true,
      status: 'published',
    });
    await ctx.db.update(shareLinks).set({ isActive: true }).where(eq(shareLinks.experienceId, experienceId));
    return { kind: 'published', slug };
  }

  if (exp.isUnlocked) {
    // Already paid/approved — just ensure the link is live.
    await ctx.db.update(shareLinks).set({ isActive: true }).where(eq(shareLinks.experienceId, experienceId));
    return { kind: 'published', slug };
  }

  // PAID → create (or reuse) a pending order; link stays inactive until approval.
  const order = await createOrder(ctx, experienceId);
  return { kind: 'payment_required', order, slug };
}

/* ───────────────────── Public render (gated) ──────────────────────────── */

/**
 * Resolve a public slug → BoundExperience, enforcing the unlock gate. Returns
 * null when unavailable for ANY reason (no leakage). Binds `media` rows to
 * short-lived signed URLs (the part F0's stub left to B1) and bumps view count.
 *
 * NB: uses a fresh `getDb()` (no user context) because the viewer is anonymous;
 * the gate itself is the authorization.
 */
export async function getPublicExperienceBySlug(slug: string): Promise<BoundExperience | null> {
  const db = await getDb();

  const link = (await db.select().from(shareLinks).where(eq(shareLinks.slug, slug)).limit(1))[0];
  if (!link) return null;
  if (!link.isActive || link.visibility === 'disabled') return null;
  if (link.expiresAt && link.expiresAt.getTime() < Date.now()) return null;

  const exp = (await db.select().from(experiences).where(eq(experiences.id, link.experienceId)).limit(1))[0];
  if (!exp) return null;
  // THE unlock gate.
  if (!exp.isUnlocked) return null;

  const tpl = (await db.select().from(templates).where(eq(templates.id, exp.templateId)).limit(1))[0];
  if (!tpl) return null;

  const def = parseTemplateDefinition(tpl.definition);
  const sceneById = new Map<string, SceneDef>(def.scenes.map((s) => [s.id, s]));

  const stepRows = await db.select().from(steps).where(eq(steps.experienceId, exp.id));
  stepRows.sort((a, b) => a.orderIndex - b.orderIndex);

  // Media for this experience, grouped by the STABLE templateStepId (scene id).
  // Falls back to the steps-row UUID for legacy rows that predate that column.
  // Stable order (created_at then id) keeps gallery photos in upload order.
  const mediaRows = await db.select().from(media).where(eq(media.experienceId, exp.id));
  mediaRows.sort((a, b) => {
    const t = (a.createdAt?.getTime() ?? 0) - (b.createdAt?.getTime() ?? 0);
    return t !== 0 ? t : a.id.localeCompare(b.id);
  });
  const stepUuidToTemplateId = new Map(stepRows.map((s) => [s.id, s.templateStepId]));
  const mediaByScene = new Map<string, typeof mediaRows>();
  for (const m of mediaRows) {
    if (m.kind !== 'step_image') continue;
    const sceneId =
      m.templateStepId ?? (m.stepId ? stepUuidToTemplateId.get(m.stepId) : undefined);
    if (!sceneId) continue;
    const list = mediaByScene.get(sceneId) ?? [];
    list.push(m);
    mediaByScene.set(sceneId, list);
  }

  const recipient = exp.recipientName ?? '';

  const boundSteps: BoundStep[] = await Promise.all(
    stepRows.map(async (s): Promise<BoundStep> => {
      const scene = sceneById.get(s.templateStepId);
      const rawText = (s.textContent as Record<string, string> | null) ?? {};
      const text: Record<string, string> = {};
      for (const [k, v] of Object.entries(rawText)) text[k] = applyTokens(String(v), recipient);
      // Fill any unset text slots from scene defaults so the Player always has copy.
      if (scene) {
        for (const slot of scene.slots) {
          if (slot.type === 'text' || slot.type === 'date') {
            if (text[slot.key] == null) {
              const d = exp.locale === 'ar' ? slot.defaultAr : slot.defaultEn;
              if (d != null) text[slot.key] = applyTokens(d, recipient);
            }
          }
        }
      }

      // Bind media → signed URLs. Each media files under its own slotKey (so a
      // scene with several image slots — avatar + photo — and gallery slots with
      // many photos all land in the right place). Legacy rows without a slotKey
      // fall back to the scene's first image-slot key. Per-slot capacity is
      // enforced (single-photo slots keep only the NEWEST; galleries keep up to
      // `max`, oldest-first) so a replaced photo can't double-bind.
      const mediaForScene = capMediaPerSlot(scene, mediaByScene.get(s.templateStepId) ?? []);
      const boundMedia: BoundMedia[] = await Promise.all(
        mediaForScene.map(async ({ row, slot }) => ({
          slot,
          url: await signedUrlForMedia(row),
          width: row.width ?? undefined,
          height: row.height ?? undefined,
        })),
      );

      return {
        templateStepId: s.templateStepId,
        orderIndex: s.orderIndex,
        text,
        media: boundMedia,
        animationConfig: (s.animationConfig as Record<string, unknown> | null) ?? {},
      };
    }),
  );

  // Best-effort view bump.
  await db
    .update(shareLinks)
    .set({ viewCount: link.viewCount + 1, lastViewedAt: new Date() })
    .where(eq(shareLinks.id, link.id));

  return {
    experienceId: exp.id,
    templateId: exp.templateId,
    locale: exp.locale as 'ar' | 'en',
    direction: exp.direction as 'rtl' | 'ltr',
    recipientName: recipient,
    theme: def.theme,
    scenes: def.scenes,
    steps: boundSteps.length
      ? boundSteps
      : def.scenes.map((sc, i) => ({
          templateStepId: sc.id,
          orderIndex: i,
          text: {},
          media: [],
          animationConfig: {},
        })),
  };
}

/**
 * Resolve each media row's target slot key (its own slotKey, else the scene's
 * first image slot) and enforce the slot's photo capacity. `media` arrives
 * oldest-first; for single-photo slots we keep only the NEWEST upload (so a
 * replaced photo doesn't double-bind even when the old DB row lingers), and for
 * gallery slots we keep up to `max` photos in their original (oldest-first) order.
 */
function capMediaPerSlot(
  scene: SceneDef | undefined,
  rows: Media[],
): Array<{ row: Media; slot: string }> {
  const fallbackSlotKey = scene?.slots.find((sl) => sl.type === 'image')?.key ?? 'image';
  const maxBySlot = new Map<string, number>(
    (scene?.slots ?? [])
      .filter((sl) => sl.type === 'image')
      .map((sl) => [sl.key, sl.max ?? 1]),
  );

  // Group rows (oldest-first) by their resolved slot key.
  const bySlot = new Map<string, Media[]>();
  for (const row of rows) {
    const slot = row.slotKey ?? fallbackSlotKey;
    const list = bySlot.get(slot) ?? [];
    list.push(row);
    bySlot.set(slot, list);
  }

  const out: Array<{ row: Media; slot: string }> = [];
  for (const [slot, list] of bySlot) {
    const max = maxBySlot.get(slot) ?? 1;
    // Single-photo slot → newest wins; gallery → first `max`, oldest-first.
    const kept = max <= 1 ? [list[list.length - 1]] : list.slice(0, max);
    for (const row of kept) out.push({ row, slot });
  }
  return out;
}
