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
import { defaultTextForScene, reconcileSteps, reconcileText } from './step-reconcile';
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
  /**
   * The caller's comped (`users.all_access`) flag, read from the DB. Display
   * only: the review step uses it to label the button "Publish" instead of
   * "Continue to payment". The server still decides entitlement at publish.
   */
  allAccess: boolean;
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

  const stepRows = await loadReconciledSteps(ctx, experience, def);
  const mediaRows = await repo.listExperienceMedia(ctx.db, ctx.user.id, experience.id);
  const mediaByStep = new Map<string, Media[]>();
  for (const m of mediaRows) {
    if (!m.stepId) continue;
    const list = mediaByStep.get(m.stepId) ?? [];
    list.push(m);
    mediaByStep.set(m.stepId, list);
  }

  const steps: EditorStepPayload[] = stepRows.map((s) => ({
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
  const allAccess = await repo.getUserAllAccess(ctx.db, ctx.user.id);

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
    allAccess,
  };
}

/**
 * The experience's steps, reconciled against the CURRENT template definition
 * (see step-reconcile.ts) and persisted when they drifted, so sections added to
 * the template after the card was created show up in the editor AND are saved
 * as real rows the user can edit. Orphaned rows (scene removed) are parked
 * after the live scenes rather than deleted — the next editor save replaces the
 * full step set anyway, and until then nothing is lost if a scene comes back.
 *
 * Persistence is best-effort: if a concurrent load wins the race (unique
 * order-index violation), we re-read what it wrote instead of failing the page.
 */
async function loadReconciledSteps(
  ctx: UserContext,
  experience: Experience,
  def: TemplateDefinition,
): Promise<Step[]> {
  const locale = experience.locale as Locale;
  const saved = await repo.listSteps(ctx.db, experience.id);
  const plan = reconcileSteps(def, saved, locale);

  // Inside each surviving section, carry renamed fields across and drop stale
  // ones — otherwise the next autosave is rejected for the whole card.
  const texts: Array<{ id: string; textContent: Record<string, string> }> = [];
  for (const s of plan.steps) {
    if (!s.existing) continue;
    const r = reconcileText(s.scene, s.existing.textContent as Record<string, string>, locale);
    if (r.changed) texts.push({ id: s.existing.id, textContent: r.text });
  }

  if (!plan.needsPersist && texts.length === 0) return plan.steps.map((s) => s.existing!);

  const moves: Array<{ id: string; orderIndex: number }> = [];
  for (const s of plan.steps) {
    if (s.existing && s.existing.orderIndex !== s.orderIndex) {
      moves.push({ id: s.existing.id, orderIndex: s.orderIndex });
    }
  }
  plan.orphans.forEach((o, i) => {
    const parked = def.scenes.length + i;
    if (o.orderIndex !== parked) moves.push({ id: o.id, orderIndex: parked });
  });
  const inserts = plan.steps
    .filter((s) => !s.existing)
    .map((s) => ({
      experienceId: experience.id,
      templateStepId: s.scene.id,
      orderIndex: s.orderIndex,
      recipientName: experience.recipientName ?? null,
      textContent: s.defaultText,
      animationConfig: {},
    }));

  try {
    await repo.applyStepPlan(ctx.db, experience.id, { moves, inserts, texts });
  } catch (err) {
    console.warn('[experiences] step reconciliation not persisted', {
      experienceId: experience.id,
      error: err instanceof Error ? err.message : String(err),
    });
  }

  // Re-read and keep only the live scenes, in definition order. Anything still
  // missing (persist failed and nobody else wrote it) is simply not editable
  // on this load; it will be retried on the next one.
  const fresh = reconcileSteps(def, await repo.listSteps(ctx.db, experience.id), locale);
  return fresh.steps.flatMap((s) => (s.existing ? [{ ...s.existing, orderIndex: s.orderIndex }] : []));
}

export async function updateExperience(
  ctx: UserContext,
  id: string,
  patch: {
    title?: string | null;
    recipientName?: string | null;
    locale?: Locale;
    fields?: Record<string, string>;
  },
): Promise<Experience> {
  const current = await requireOwnedExperience(ctx, id);
  const dbPatch: Record<string, unknown> = {};
  if (patch.fields !== undefined) {
    const tpl = await repo.getTemplateById(ctx.db, current.templateId);
    const def = tpl ? parseTemplateDefinition(tpl.definition) : null;
    const allowed = new Map((def?.fields ?? []).map((f) => [f.key, f]));
    const next: Record<string, string> = { ...((current.fields ?? {}) as Record<string, string>) };
    for (const [key, value] of Object.entries(patch.fields)) {
      const f = allowed.get(key);
      if (!f) continue; // unknown key — drop, never fail a draft save
      if (f.maxLen != null && value.length > f.maxLen) {
        throw DashboardError.validation(`field '${key}' exceeds maxLen ${f.maxLen}`);
      }
      next[key] = value;
    }
    dbPatch.fields = next;
  }
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

  // Autosave is a DRAFT save: it must never refuse the whole card because one
  // section is stale or unfinished. Sections the template no longer has are
  // skipped, unknown fields are dropped (reconcileText), and required fields
  // are enforced at publish — not here, where they blocked every keystroke on
  // a half-filled invitation.
  const accepted: IncomingStep[] = [];
  for (const step of incoming) {
    const scene = sceneById.get(step.templateStepId);
    if (!scene) continue; // editor opened before a template change; harmless
    if (seenStepIds.has(step.templateStepId)) {
      throw DashboardError.validation(`duplicate templateStepId '${step.templateStepId}'`);
    }
    seenStepIds.add(step.templateStepId);

    if (seenOrder.has(step.orderIndex)) {
      throw DashboardError.validation(`duplicate orderIndex ${step.orderIndex}`);
    }
    seenOrder.add(step.orderIndex);

    const text = sanitizeSceneText(scene, step.text ?? {}, locale);
    accepted.push({ ...step, text });
  }

  const rows = accepted.map((step) => ({
    experienceId,
    templateStepId: step.templateStepId,
    orderIndex: step.orderIndex,
    recipientName: experience.recipientName ?? null,
    textContent: step.text ?? {},
    animationConfig: step.animationConfig ?? {},
  }));

  return repo.replaceSteps(ctx.db, experienceId, rows);
}

/**
 * Clean one step's text for a draft save: stale/unknown or bound keys are
 * dropped (after carrying renamed keys across), values must be strings within
 * the slot's maxLen. Required-ness is NOT checked here — see publish.
 */
function sanitizeSceneText(
  scene: SceneDef,
  text: Record<string, unknown>,
  locale: Locale,
): Record<string, string> {
  const declared = new Map(
    scene.slots
      .filter((s) => (s.type === 'text' || s.type === 'date') && !s.bind && s.editable !== false)
      .map((s) => [s.key, s]),
  );
  const strings: Record<string, string> = {};
  for (const [key, value] of Object.entries(text)) {
    if (typeof value !== 'string') {
      throw DashboardError.validation(`slot '${key}' must be a string`);
    }
    strings[key] = value;
  }
  // Only keys the scene declares survive; renamed keys are carried across.
  const { text: reconciled } = reconcileText(scene, strings, locale);
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(reconciled)) {
    const slot = declared.get(key);
    if (!slot) continue;
    if (slot.maxLen != null && value.length > slot.maxLen) {
      throw DashboardError.validation(
        `slot '${key}' exceeds maxLen ${slot.maxLen} (got ${value.length})`,
      );
    }
    out[key] = value;
  }
  return out;
}
