/**
 * Step reconciliation — keeps an experience's saved `steps` in line with the
 * CURRENT template definition.
 *
 * Templates evolve after users have built cards from them: scenes get added,
 * removed, renamed or reordered (the invitation catalog was rewritten wholesale).
 * A step row only references its scene by id, so without this an old card would
 * silently lose new sections (no step → never rendered or editable) and carry
 * dead rows for scenes that no longer exist.
 *
 * `reconcileSteps` is PURE: it decides the target shape and leaves persistence
 * to the caller. The editor persists the result (so new sections become
 * editable); the public share page applies it in memory only, because an
 * anonymous viewer must never cause writes to someone else's card.
 */
import type { Locale, SceneDef, TemplateDefinition } from '@/lib/template-contract';

/** The minimum a step needs for reconciliation (DB rows and payloads both fit). */
export interface StepLike {
  templateStepId: string;
  orderIndex: number;
}

export interface ReconciledStep<S extends StepLike> {
  scene: SceneDef;
  /** Target position = the scene's index in the definition. */
  orderIndex: number;
  /** The saved step for this scene, or null when the scene is new. */
  existing: S | null;
  /** Seeded slot defaults for a NEW scene; empty for existing steps. */
  defaultText: Record<string, string>;
}

export interface ReconcileResult<S extends StepLike> {
  /** One entry per scene, in definition order. */
  steps: ReconciledStep<S>[];
  /** Scene ids that had no saved step and were seeded. */
  added: string[];
  /**
   * Saved steps whose scene no longer exists (or duplicate rows for the same
   * scene). Never rendered or edited; returned so the caller can decide whether
   * to keep them out of the way or drop them.
   */
  orphans: S[];
  /**
   * True when persisting is needed to make the DB match `steps`: a scene was
   * added, a kept step sits at the wrong index, or an orphan occupies an index
   * a real scene needs (the (experience_id, order_index) pair is unique).
   */
  needsPersist: boolean;
}

/**
 * Build the default text map for a scene from its slot defaults. We store the
 * RAW default with the `{recipient}` token intact (not yet substituted) so that
 * later changes to the recipient name flow through — tokens are resolved at
 * render time (live preview, share page, order view) via `applyTokens`.
 */
export function defaultTextForScene(scene: SceneDef, locale: Locale): Record<string, string> {
  const out: Record<string, string> = {};
  for (const slot of scene.slots) {
    if (slot.type !== 'text' && slot.type !== 'date') continue;
    const def = locale === 'ar' ? slot.defaultAr : slot.defaultEn;
    if (def != null) out[slot.key] = def;
  }
  return out;
}

export function reconcileSteps<S extends StepLike>(
  definition: Pick<TemplateDefinition, 'scenes'>,
  saved: readonly S[],
  locale: Locale,
): ReconcileResult<S> {
  // Earliest saved row wins when a scene somehow has several (the unique key is
  // on order_index, not scene id, so duplicates are possible in legacy data).
  const byScene = new Map<string, S>();
  const orphans: S[] = [];
  const sceneIds = new Set(definition.scenes.map((s) => s.id));
  for (const step of [...saved].sort((a, b) => a.orderIndex - b.orderIndex)) {
    if (!sceneIds.has(step.templateStepId) || byScene.has(step.templateStepId)) {
      orphans.push(step);
    } else {
      byScene.set(step.templateStepId, step);
    }
  }

  const added: string[] = [];
  let needsPersist = false;
  const steps = definition.scenes.map((scene, index): ReconciledStep<S> => {
    const existing = byScene.get(scene.id) ?? null;
    if (!existing) {
      added.push(scene.id);
      needsPersist = true;
      return { scene, orderIndex: index, existing: null, defaultText: defaultTextForScene(scene, locale) };
    }
    if (existing.orderIndex !== index) needsPersist = true;
    return { scene, orderIndex: index, existing, defaultText: {} };
  });

  if (orphans.some((o) => o.orderIndex >= 0 && o.orderIndex < definition.scenes.length)) {
    needsPersist = true;
  }

  return { steps, added, orphans, needsPersist };
}

/* ───────────────────────── slot-level text reconciliation ───────────────── */

/**
 * Bring ONE step's saved text in line with its scene's CURRENT slots.
 *
 * `reconcileSteps` fixes which sections a card has; this fixes what is inside
 * them. Without it, a template that renamed a field (the invitation rewrite
 * turned `subheading` into `sub`) left old cards holding a key the scene no
 * longer declares — and because saving validated every section in one request,
 * that single stale key made EVERY edit on the card fail.
 *
 *  - a value saved under one of a slot's `formerKeys` moves to the slot's key;
 *  - keys the scene no longer declares (or now binds to a card-level field)
 *    are dropped;
 *  - editable text/date slots with no value get their default (the card's
 *    locale first, then the other one, so a required heading is never blank
 *    just because the template was authored in the other language).
 */
export function reconcileText(
  scene: SceneDef,
  text: Record<string, string> | null | undefined,
  locale: Locale,
): { text: Record<string, string>; changed: boolean } {
  const src = { ...(text ?? {}) };
  const out: Record<string, string> = {};
  for (const slot of scene.slots) {
    if (slot.type !== 'text' && slot.type !== 'date') continue;
    if (slot.bind) continue; // edited once, at card level
    let value = src[slot.key];
    if (value == null) {
      for (const former of slot.formerKeys ?? []) {
        if (src[former] != null) {
          value = src[former];
          break;
        }
      }
    }
    if (value == null) {
      const def = (locale === 'ar' ? slot.defaultAr : slot.defaultEn) ?? slot.defaultEn ?? slot.defaultAr;
      if (def != null) value = def;
    }
    if (value != null) out[slot.key] = String(value);
  }
  const changed =
    Object.keys(out).length !== Object.keys(src).length ||
    Object.entries(out).some(([k, v]) => src[k] !== v);
  return { text: out, changed };
}
