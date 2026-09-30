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
  resolveFields,
  slotValue,
  isStepHidden,
  type TemplateDefinition,
  type BoundExperience,
  type BoundStep,
  type BoundMedia,
  type SceneDef,
} from '@/lib/template-contract';
import { createOrder, type CreatedOrder } from './orders-service';
import { signedUrlForMedia } from './media-service';
import { DashboardError } from './errors';
import { reconcileSteps, reconcileText } from './step-reconcile';
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

/**
 * Labels of required fields that are still empty — card-level fields and
 * section slots alike. A bound slot is satisfied by its field; a fallback slot
 * by either itself or its field.
 */
export function missingRequired(
  def: TemplateDefinition,
  stepRows: Array<{ templateStepId: string; textContent: unknown; animationConfig?: unknown }>,
  fields: Record<string, string>,
  locale: 'ar' | 'en',
): string[] {
  const label = (x: { labelAr?: string; labelEn?: string; key: string }) =>
    (locale === 'ar' ? x.labelAr : x.labelEn) ?? x.labelEn ?? x.labelAr ?? x.key;
  const resolved = resolveFields(def, fields, locale);
  const out: string[] = [];
  for (const f of def.fields ?? []) {
    if (f.required && !resolved[f.key]?.trim()) out.push(label(f));
  }
  // A section the sender turned off is not on the card, so it asks for nothing.
  const shown = stepRows.filter((r) => !isStepHidden({ animationConfig: r.animationConfig as Record<string, unknown> | null }));
  const byScene = new Map(shown.map((r) => [r.templateStepId, (r.textContent ?? {}) as Record<string, string>]));
  for (const scene of def.scenes) {
    const text = byScene.get(scene.id);
    if (!text) continue;
    for (const slot of scene.slots) {
      if (!slot.required || (slot.type !== 'text' && slot.type !== 'date') || slot.bind) continue;
      if (!slotValue(scene, { text }, slot.key, resolved).trim()) out.push(label(slot));
    }
  }
  return [...new Set(out)];
}

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

  // Required text is enforced HERE, at publish, not on every autosave (where it
  // refused to save a half-finished draft). The message names each missing
  // field in the card's language so the builder can show it as-is.
  const missing = missingRequired(
    parseTemplateDefinition(tpl.definition),
    stepRows,
    (exp.fields ?? {}) as Record<string, string>,
    exp.locale === 'ar' ? 'ar' : 'en',
  );
  if (missing.length > 0) {
    throw DashboardError.unprocessable(
      exp.locale === 'ar'
        ? `أكمل الحقول المطلوبة قبل النشر: ${missing.join('، ')}`
        : `Fill in the required fields before publishing: ${missing.join(', ')}`,
    );
  }

  // NOTE: we intentionally do NOT hard-block publishing when photo slots are
  // empty. The player degrades gracefully (a picture scene with no photo shows
  // its text + background), so a text-only card is valid. Requiring photos was
  // over-strict and blocked legitimate cards. The builder still nudges users to
  // add photos, but it's their choice.

  const { slug } = await ensureShareLink(ctx, experienceId);

  // A comped account publishes paid templates as if they were free. Read from
  // the DB, never the session: `all_access` must be revocable without waiting
  // for a stateless JWT to expire.
  const comped = await repo.getUserAllAccess(ctx.db, ctx.user.id);

  if (!tpl.isPaid || tpl.pricePiastres <= 0 || comped) {
    // FREE (or comped) → publish directly: unlock + activate link.
    // (Contract-sanctioned; paid unlock always goes through the order state
    // machine instead.)
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

  // Reconcile against the CURRENT definition in memory only: sections added to
  // the template since the card was made render with their defaults, and rows
  // for removed scenes are skipped. No write here — an anonymous viewer must
  // never mutate someone else's card (the editor persists on next open).
  const locale = exp.locale === 'ar' ? 'ar' : 'en';
  const plan = reconcileSteps(def, stepRows, locale);
  // Card-level details (couple's names, wedding date), defaults filled in.
  const cardFields = resolveFields(def, (exp.fields ?? {}) as Record<string, string>, locale);

  const boundSteps: BoundStep[] = await Promise.all(
    plan.steps.map(async ({ scene, orderIndex, existing, defaultText }): Promise<BoundStep> => {
      // Same slot-level reconciliation the editor persists (renamed keys carried
      // across, stale keys dropped, missing slots defaulted) — in memory here.
      const saved = existing ? (existing.textContent as Record<string, string> | null) : defaultText;
      const { text: rawText } = reconcileText(scene, saved ?? {}, locale);
      const text: Record<string, string> = {};
      for (const [k, v] of Object.entries(rawText)) text[k] = applyTokens(String(v), recipient, cardFields);

      // Bind media → signed URLs. Each media files under its own slotKey (so a
      // scene with several image slots — avatar + photo — and gallery slots with
      // many photos all land in the right place). Legacy rows without a slotKey
      // fall back to the scene's first image-slot key. Per-slot capacity is
      // enforced (single-photo slots keep only the NEWEST; galleries keep up to
      // `max`, oldest-first) so a replaced photo can't double-bind.
      const mediaForScene = capMediaPerSlot(scene, mediaByScene.get(scene.id) ?? []);
      const boundMedia: BoundMedia[] = await Promise.all(
        mediaForScene.map(async ({ row, slot }) => ({
          slot,
          url: await signedUrlForMedia(row),
          width: row.width ?? undefined,
          height: row.height ?? undefined,
        })),
      );

      return {
        templateStepId: scene.id,
        orderIndex,
        text,
        media: boundMedia,
        animationConfig: (existing?.animationConfig as Record<string, unknown> | null) ?? {},
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
    fields: cardFields,
    theme: def.theme,
    scenes: def.scenes,
    steps: boundSteps,
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
