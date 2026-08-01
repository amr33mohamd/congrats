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
        width: m.width,
        height: m.height,
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
      const editable = scene.slots.filter((s) => s.editable !== false);
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
): BoundExperience {
  return {
    experienceId: exp.id,
    templateId: exp.templateId,
    locale: exp.locale,
    direction: exp.direction,
    recipientName,
    theme: exp.theme ?? {},
    scenes: exp.scenes,
    steps: steps
      .slice()
      .sort((a, b) => a.orderIndex - b.orderIndex)
      .map((s) => ({
        templateStepId: s.templateStepId,
        orderIndex: s.orderIndex,
        // Resolve {recipient} tokens for an accurate preview.
        text: Object.fromEntries(
          Object.entries(s.text).map(([k, v]) => [k, applyTokens(v ?? '', recipientName)]),
        ),
        media: s.media.map((m) => ({
          slot: m.slot,
          url: m.url,
          width: m.width,
          height: m.height,
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
