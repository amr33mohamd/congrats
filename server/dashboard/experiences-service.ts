/**
 * Experiences service — create/list/get/update/delete + step binding.
 *
 * Create clones a published template's scene defs into `steps` rows (one per
 * scene, in order) seeded with localized slot defaults. The bulk step upsert
 * validates every submitted step against the template's scene slots so the
 * editor can never persist content the Player can't render.
 *
 * Every method is ownership-scoped: it takes the `UserContext` and never trusts
 * a client-supplied userId.
 */
import type { UserContext } from '@/server/db-context';
import {
  parseTemplateDefinition,
  applyTokens,
  type TemplateDefinition,
  type SceneDef,
  type Locale,
  type Direction,
} from '@/lib/template-contract';
import type { Experience, Step, Media } from '@/db/schema';
import { DashboardError } from './errors';
import * as repo from './repositories';

export interface EditorStepPayload {
  id: string;
  templateStepId: string;
  orderIndex: number;
  text: Record<string, string>;
  animationConfig: Record<string, unknown>;
  media: Array<{ id: string; slot: string; url: null; width: number | null; height: number | null }>;
}

export interface EditorPayload {
  experience: Experience;
  template: {
    id: string;
    slug: string;
    isPaid: boolean;
    pricePiastres: number;
    currency: string;
    definition: TemplateDefinition;
  };
  steps: EditorStepPayload[];
  shareLink: { slug: string; isActive: boolean; visibility: string } | null;
}

/**
 * Build the default text map for a scene from its slot defaults. We store the
 * RAW default with the `{recipient}` token intact (not yet substituted) so that
 * later changes to the recipient name flow through — tokens are resolved at
 * render time (live preview, share page, order view) via `applyTokens`.
 */
function defaultTextForScene(scene: SceneDef, locale: Locale): Record<string, string> {
  const out: Record<string, string> = {};
  for (const slot of scene.slots) {
    if (slot.type !== 'text' && slot.type !== 'date') continue;
    const def = locale === 'ar' ? slot.defaultAr : slot.defaultEn;
    if (def != null) out[slot.key] = def;
  }
  return out;
}

export async function createExperience(
  ctx: UserContext,
  input: { templateId: string; locale?: Locale; recipientName?: string; title?: string },
): Promise<Experience> {
  const tpl = await repo.getTemplateById(ctx.db, input.templateId);
  if (!tpl) throw DashboardError.notFound('template not found');
  if (tpl.status !== 'published') {
    throw DashboardError.unprocessable('template is not available');
  }

  const def = parseTemplateDefinition(tpl.definition);

  // Locale defaults to the template's locale; direction follows the chosen locale
  // but falls back to the template's direction when they agree.
  const locale: Locale = input.locale ?? (tpl.locale as Locale);
  const direction: Direction = locale === tpl.locale ? (tpl.direction as Direction) : locale === 'ar' ? 'rtl' : 'ltr';

  const experience = await repo.insertExperience(ctx.db, {
    userId: ctx.user.id,
    templateId: tpl.id,
    title: input.title ?? tpl.titleEn ?? tpl.titleAr ?? null,
    recipientName: input.recipientName ?? null,
    locale,
    direction,
    status: 'draft',
    isUnlocked: false,
  });

  // Clone scene defs → steps seeded with localized defaults.
  const stepRows = def.scenes.map((scene, index) => ({
    experienceId: experience.id,
    templateStepId: scene.id,
    orderIndex: index,
    recipientName: input.recipientName ?? null,
    textContent: defaultTextForScene(scene, locale),
    animationConfig: {},
  }));
  await repo.replaceSteps(ctx.db, experience.id, stepRows);

  return experience;
}

export type ExperienceListEntry = Experience & { shareSlug: string | null };

export async function listExperiences(ctx: UserContext): Promise<ExperienceListEntry[]> {
  const rows = await repo.listExperiences(ctx.db, ctx.user.id);
  const links = await repo.listShareLinksForExperiences(
    ctx.db,
    rows.map((r) => r.id),
  );
  const slugByExperience = new Map(links.map((l) => [l.experienceId, l.slug]));
  return rows.map((r) => ({ ...r, shareSlug: slugByExperience.get(r.id) ?? null }));
}

async function requireOwnedExperience(ctx: UserContext, id: string): Promise<Experience> {
  const exp = await repo.getOwnedExperience(ctx.db, ctx.user.id, id);
  if (!exp) throw DashboardError.notFound('experience not found');
  return exp;
}

export async function getEditorPayload(ctx: UserContext, id: string): Promise<EditorPayload> {
  const experience = await requireOwnedExperience(ctx, id);
  const tpl = await repo.getTemplateById(ctx.db, experience.templateId);
  if (!tpl) throw DashboardError.notFound('template not found');
  const def = parseTemplateDefinition(tpl.definition);

  const stepRows = await repo.listSteps(ctx.db, experience.id);
  const mediaRows = await repo.listExperienceMedia(ctx.db, ctx.user.id, experience.id);
  const mediaByStep = new Map<string, Media[]>();
  for (const m of mediaRows) {
    if (!m.stepId) continue;
    const list = mediaByStep.get(m.stepId) ?? [];
    list.push(m);
    mediaByStep.set(m.stepId, list);
  }

  const steps: EditorStepPayload[] = stepRows.map((s: Step) => ({
    id: s.id,
    templateStepId: s.templateStepId,
    orderIndex: s.orderIndex,
    text: (s.textContent as Record<string, string> | null) ?? {},
    animationConfig: (s.animationConfig as Record<string, unknown> | null) ?? {},
    media: (mediaByStep.get(s.id) ?? []).map((m) => ({
      id: m.id,
      // Editor surfaces the storage slot via kind for now; URLs are minted lazily.
      slot: m.kind,
      url: null,
      width: m.width,
      height: m.height,
    })),
  }));

  const link = await repo.getShareLinkByExperience(ctx.db, experience.id);

  return {
    experience,
    template: {
      id: tpl.id,
      slug: tpl.slug,
      isPaid: tpl.isPaid,
      pricePiastres: tpl.pricePiastres,
      currency: tpl.currency,
      definition: def,
    },
    steps,
    shareLink: link ? { slug: link.slug, isActive: link.isActive, visibility: link.visibility } : null,
  };
}

export async function updateExperience(
  ctx: UserContext,
  id: string,
  patch: { title?: string | null; recipientName?: string | null; locale?: Locale },
): Promise<Experience> {
  await requireOwnedExperience(ctx, id);
  const dbPatch: Record<string, unknown> = {};
  if (patch.title !== undefined) dbPatch.title = patch.title;
  if (patch.recipientName !== undefined) dbPatch.recipientName = patch.recipientName;
  if (patch.locale !== undefined) {
    dbPatch.locale = patch.locale;
    dbPatch.direction = patch.locale === 'ar' ? 'rtl' : 'ltr';
  }
  const updated = await repo.updateOwnedExperience(ctx.db, ctx.user.id, id, dbPatch);
  if (!updated) throw DashboardError.notFound('experience not found');
  return updated;
}

export async function deleteExperience(ctx: UserContext, id: string): Promise<void> {
  const exp = await requireOwnedExperience(ctx, id);
  // Only drafts (never published/unlocked) may be deleted by the user.
  if (exp.isUnlocked || exp.status === 'published') {
    throw DashboardError.conflict('a published experience cannot be deleted');
  }
  const ok = await repo.deleteOwnedExperience(ctx.db, ctx.user.id, id);
  if (!ok) throw DashboardError.notFound('experience not found');
}

/* ─────────────────────────── Step bulk upsert ─────────────────────────── */

export interface IncomingStep {
  templateStepId: string;
  orderIndex: number;
  // Optional on input (zod fills defaults post-parse); normalised below.
  text?: Record<string, string>;
  animationConfig?: Record<string, unknown>;
}

/**
 * Validate + persist the full step set for an experience against its template's
 * scene slots. Rejects unknown scene ids, unknown/non-editable slot keys,
 * over-length text, missing required text slots, and duplicate order indexes.
 */
export async function upsertSteps(
  ctx: UserContext,
  experienceId: string,
  incoming: IncomingStep[],
): Promise<Step[]> {
  const experience = await requireOwnedExperience(ctx, experienceId);
  const tpl = await repo.getTemplateById(ctx.db, experience.templateId);
  if (!tpl) throw DashboardError.notFound('template not found');
  const def = parseTemplateDefinition(tpl.definition);

  const sceneById = new Map<string, SceneDef>(def.scenes.map((s) => [s.id, s]));
  const locale = experience.locale as Locale;

  const seenStepIds = new Set<string>();
  const seenOrder = new Set<number>();

  for (const step of incoming) {
    const scene = sceneById.get(step.templateStepId);
    if (!scene) {
      throw DashboardError.validation(`unknown templateStepId '${step.templateStepId}'`);
    }
    if (seenStepIds.has(step.templateStepId)) {
      throw DashboardError.validation(`duplicate templateStepId '${step.templateStepId}'`);
    }
    seenStepIds.add(step.templateStepId);

    if (seenOrder.has(step.orderIndex)) {
      throw DashboardError.validation(`duplicate orderIndex ${step.orderIndex}`);
    }
    seenOrder.add(step.orderIndex);

    validateSceneText(scene, step.text ?? {}, locale);
  }

  const rows = incoming.map((step) => ({
    experienceId,
    templateStepId: step.templateStepId,
    orderIndex: step.orderIndex,
    recipientName: experience.recipientName ?? null,
    textContent: step.text ?? {},
    animationConfig: step.animationConfig ?? {},
  }));

  return repo.replaceSteps(ctx.db, experienceId, rows);
}

function validateSceneText(scene: SceneDef, text: Record<string, string>, locale: Locale): void {
  const textSlots = new Map(scene.slots.filter((s) => s.type === 'text' || s.type === 'date').map((s) => [s.key, s]));

  for (const [key, value] of Object.entries(text)) {
    const slot = textSlots.get(key);
    if (!slot) {
      throw DashboardError.validation(`scene '${scene.id}' has no text slot '${key}'`);
    }
    if (!slot.editable) {
      throw DashboardError.validation(`slot '${key}' in scene '${scene.id}' is not editable`);
    }
    if (typeof value !== 'string') {
      throw DashboardError.validation(`slot '${key}' must be a string`);
    }
    if (slot.maxLen != null && value.length > slot.maxLen) {
      throw DashboardError.validation(
        `slot '${key}' exceeds maxLen ${slot.maxLen} (got ${value.length})`,
      );
    }
  }

  // Required text slots must have a non-empty value (after token substitution a
  // {recipient} placeholder still counts as provided).
  for (const slot of textSlots.values()) {
    if (!slot.required) continue;
    const v = text[slot.key];
    if (v == null || v.trim().length === 0) {
      const fallback = locale === 'ar' ? slot.defaultAr : slot.defaultEn;
      if (fallback == null || fallback.trim().length === 0) {
        throw DashboardError.unprocessable(
          `required slot '${slot.key}' in scene '${scene.id}' is empty`,
        );
      }
    }
  }
}
