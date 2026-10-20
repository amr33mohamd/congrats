import {
  applyTokens,
  type BoundExperience,
  type SceneDef,
  type Slot,
} from '@/lib/template-contract';
import type { EditorExperience, StepUpsert } from './types';

/** In-memory editor representation of a bound step. */
export interface LocalMedia {
  slot: string;
  url: string;
  mediaId?: string;
  width?: number;
  height?: number;
  /** A video in a photo slot. */
  video?: boolean;
}

export interface LocalStep {
  templateStepId: string;
  orderIndex: number;
  text: Record<string, string>;
  media: LocalMedia[];
  animationConfig: Record<string, unknown>;
}

/** A scene paired with its bound step + the editable slots, for the editor UI. */
export interface EditableScene {
  scene: SceneDef;
  step: LocalStep;
  textSlots: Slot[];
  imageSlots: Slot[];
  dateSlots: Slot[];
}

/**
 * Seed local editor steps from the backend editor payload. Ensures there is a
 * step for every scene (in order), pre-filling slot defaults where empty so the
 * preview always has something to render.
 */
export function seedSteps(exp: EditorExperience): LocalStep[] {
  const byScene = new Map(exp.steps.map((s) => [s.templateStepId, s]));
  return exp.scenes
    .slice()
    .map((scene, i) => {
      const existing = byScene.get(scene.id);
      const text: Record<string, string> = { ...(existing?.text ?? {}) };
      // Fill defaults for editable text slots so first render isn't empty.
      for (const slot of scene.slots) {
        if (slot.type === 'text' && text[slot.key] == null) {
          const def = exp.locale === 'ar' ? slot.defaultAr : slot.defaultEn;
          if (def != null) text[slot.key] = def;
        }
      }
      const media: LocalMedia[] = (existing?.media ?? []).map((m) => ({
        slot: m.slot,
        url: m.url,
        // The editor view adds the row id so replacing a photo can delete the old one.
        mediaId: (m as { mediaId?: string }).mediaId,
        width: m.width,
        height: m.height,
        ...(m.video ? { video: true } : {}),
      }));
      return {
        templateStepId: scene.id,
        orderIndex: existing?.orderIndex ?? i,
        text,
        media,
        animationConfig: existing?.animationConfig ?? {},
      };
    })
    .sort((a, b) => a.orderIndex - b.orderIndex);
}

/** Build the editable-scene view models for the content step of the wizard. */
export function editableScenes(exp: EditorExperience, steps: LocalStep[]): EditableScene[] {
  const stepById = new Map(steps.map((s) => [s.templateStepId, s]));
  return exp.scenes
    .slice()
    .sort((a, b) => {
      const ai = stepById.get(a.id)?.orderIndex ?? 0;
      const bi = stepById.get(b.id)?.orderIndex ?? 0;
      return ai - bi;
    })
    .map((scene) => {
      const step =
        stepById.get(scene.id) ?? {
          templateStepId: scene.id,
          orderIndex: 0,
          text: {},
          media: [],
          animationConfig: {},
        };
      // A slot bound to a card-level field is asked once in the Details step,
      // so it never appears in the per-scene editor.
      const editable = scene.slots.filter((s) => s.editable !== false && !s.bind);
      return {
        scene,
        step,
        textSlots: editable.filter((s) => s.type === 'text'),
        imageSlots: editable.filter((s) => s.type === 'image'),
        dateSlots: editable.filter((s) => s.type === 'date'),
      };
    });
}

/** Convert editor state into a Player-ready BoundExperience for live preview. */
export function toBoundExperience(
  exp: EditorExperience,
  steps: LocalStep[],
  recipientName: string,
  fields: Record<string, string> = exp.fields ?? {},
): BoundExperience {
  return {
    experienceId: exp.id,
    templateId: exp.templateId,
    locale: exp.locale,
    direction: exp.direction,
    recipientName,
    fields,
    theme: exp.theme ?? {},
    ...(exp.musicUrl ? { musicUrl: exp.musicUrl } : {}),
    scenes: exp.scenes,
    steps: steps
      .slice()
      .sort((a, b) => a.orderIndex - b.orderIndex)
      .map((s) => ({
        templateStepId: s.templateStepId,
        orderIndex: s.orderIndex,
        // Resolve {recipient} and card-field tokens for an accurate preview.
        text: Object.fromEntries(
          Object.entries(s.text).map(([k, v]) => [k, applyTokens(v ?? '', recipientName, fields)]),
        ),
        media: s.media.map((m) => ({
          slot: m.slot,
          url: m.url,
          width: m.width,
          height: m.height,
          ...(m.video ? { video: true } : {}),
        })),
        animationConfig: s.animationConfig ?? {},
      })),
  };
}

/** Convert editor state into the PUT /steps upsert payload (raw text, tokens preserved). */
export function toStepUpserts(steps: LocalStep[]): StepUpsert[] {
  return steps
    .slice()
    .sort((a, b) => a.orderIndex - b.orderIndex)
    .map((s) => ({
      templateStepId: s.templateStepId,
      orderIndex: s.orderIndex,
      text: s.text,
      // Carry media references inside animationConfig so the backend can re-bind
      // them; backends that persist media via /media/confirm can ignore this.
      animationConfig: {
        ...s.animationConfig,
        media: s.media.map((m) => ({
          slot: m.slot,
          mediaId: m.mediaId,
          url: m.url,
          width: m.width,
          height: m.height,
        })),
      },
    }));
}

/** The slot keys switched to "darker" on a step (read by the Player's isDarkSlot). */
export function darkSlots(step: LocalStep): string[] {
  const list = step.animationConfig?.darkText;
  return Array.isArray(list) ? list.filter((k): k is string => typeof k === 'string') : [];
}

/** Switch some of a step's text slots to (or back from) the darker shade. */
export function withDarkSlots(step: LocalStep, keys: string[], on: boolean): LocalStep {
  const set = new Set(darkSlots(step));
  for (const k of keys) {
    if (on) set.add(k);
    else set.delete(k);
  }
  const { darkText: _drop, ...rest } = step.animationConfig ?? {};
  void _drop;
  return { ...step, animationConfig: set.size ? { ...rest, darkText: [...set] } : rest };
}
