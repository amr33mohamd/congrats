/**
 * TEMPLATE ENGINE CONTRACT — THE FROZEN INTERFACE.
 *
 * Designers/content authors produce a `TemplateDefinition` (stored in
 * templates.definition jsonb). Backends bind user content to it and produce a
 * `BoundExperience`, which the shared Player renders generically.
 *
 * Anything consuming templates MUST import types/validators from here.
 */
import { z } from 'zod';

/* ───────────────────────────── Scenes ─────────────────────────────── */

export const SCENE_TYPES = [
  'Cover',
  'PhotoReveal',
  'TextReveal',
  'Countdown',
  'Gallery',
  'GiftReveal',
  'Finale',
] as const;
export const SceneTypeSchema = z.enum(SCENE_TYPES);
export type SceneType = (typeof SCENE_TYPES)[number];

/* ───────────────────────── Animation presets ──────────────────────── */

export const ANIMATION_PRESETS = [
  'fade',
  'slideStart', // enters from the inline-start edge (mirrors in RTL)
  'slideEnd', // enters from the inline-end edge (mirrors in RTL)
  'typewriter',
  'zoom',
  'parallax',
  'confettiBurst',
  'flip',
] as const;
export const AnimationPresetSchema = z.enum(ANIMATION_PRESETS);
export type AnimationPreset = (typeof ANIMATION_PRESETS)[number];

export const DirectionSchema = z.enum(['rtl', 'ltr']);
export type Direction = z.infer<typeof DirectionSchema>;

export const LocaleSchema = z.enum(['ar', 'en']);
export type Locale = z.infer<typeof LocaleSchema>;

/* ─────────────────────── Editable field slots ─────────────────────── */

/**
 * A slot is an editable (or static) field the user fills in the builder.
 * `key` is referenced by the bound step's text/media; `type` drives the editor UI.
 */
export const SlotSchema = z.object({
  key: z.string().min(1),
  type: z.enum(['text', 'image', 'date']),
  editable: z.boolean().default(true),
  required: z.boolean().default(false),
  maxLen: z.number().int().positive().optional(),
  // image slots
  min: z.number().int().nonnegative().optional(),
  max: z.number().int().positive().optional(),
  aspect: z.string().optional(), // '1:1' | '3:4' | '16:9' ...
  // localized defaults; {recipient} token is substituted at render time
  defaultEn: z.string().optional(),
  defaultAr: z.string().optional(),
  // which animation preset drives this slot inside the scene
  animation: AnimationPresetSchema.optional(),
});
export type Slot = z.infer<typeof SlotSchema>;

/* ───────────────────────── Transition params ──────────────────────── */

export const TransitionSchema = z.object({
  preset: AnimationPresetSchema,
  durationMs: z.number().int().positive().default(800),
  delayMs: z.number().int().nonnegative().default(0),
});
export type Transition = z.infer<typeof TransitionSchema>;

/* ──────────────────────────── Scene def ───────────────────────────── */

export const SceneDefSchema = z.object({
  id: z.string().min(1), // referenced by steps.template_step_id
  type: SceneTypeSchema,
  layout: z.string().optional(), // free-form layout hint, e.g. 'centered-photo'
  transitionIn: TransitionSchema.optional(),
  transitionOut: TransitionSchema.optional(),
  holdMs: z.number().int().positive().default(4000), // autoplay dwell time
  slots: z.array(SlotSchema).default([]),
});
export type SceneDef = z.infer<typeof SceneDefSchema>;

/* ───────────────────────── Template theme ─────────────────────────── */

export const TemplateThemeSchema = z.object({
  palette: z.array(z.string()).default([]),
  fontHeading: z.string().optional(),
  fontBody: z.string().optional(),
  music: z.string().optional(),
  accent: z.string().optional(),
});
export type TemplateTheme = z.infer<typeof TemplateThemeSchema>;

/* ──────────────────── TemplateDefinition (frozen) ──────────────────── */

export const TemplateDefinitionSchema = z.object({
  version: z.number().int().positive().default(1),
  locale: LocaleSchema,
  direction: DirectionSchema,
  theme: TemplateThemeSchema.default({}),
  scenes: z.array(SceneDefSchema).min(1), // ORDERED scene defs
});
export type TemplateDefinition = z.infer<typeof TemplateDefinitionSchema>;

/* ─────────────── BoundExperience (what the Player plays) ───────────── */

export const BoundMediaSchema = z.object({
  slot: z.string().min(1),
  url: z.string(), // signed/short-lived URL minted server-side
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
});
export type BoundMedia = z.infer<typeof BoundMediaSchema>;

export const BoundStepSchema = z.object({
  templateStepId: z.string().min(1), // FK into TemplateDefinition.scenes[].id
  orderIndex: z.number().int().nonnegative(),
  text: z.record(z.string()).default({}), // slot.key -> resolved string
  media: z.array(BoundMediaSchema).default([]),
  // Per-step overrides merged over the scene def (holdMs, transition durations…).
  animationConfig: z.record(z.unknown()).default({}),
});
export type BoundStep = z.infer<typeof BoundStepSchema>;

export const BoundExperienceSchema = z.object({
  experienceId: z.string().min(1),
  templateId: z.string().min(1),
  locale: LocaleSchema,
  direction: DirectionSchema,
  recipientName: z.string().default(''),
  theme: TemplateThemeSchema.default({}),
  // The TemplateDefinition scenes the steps bind to (so the Player is self-contained).
  scenes: z.array(SceneDefSchema).min(1),
  steps: z.array(BoundStepSchema).min(1),
});
export type BoundExperience = z.infer<typeof BoundExperienceSchema>;

/* ───────────────────────────── Validators ─────────────────────────── */

export function parseTemplateDefinition(input: unknown): TemplateDefinition {
  return TemplateDefinitionSchema.parse(input);
}
export function safeParseTemplateDefinition(input: unknown) {
  return TemplateDefinitionSchema.safeParse(input);
}
export function parseBoundExperience(input: unknown): BoundExperience {
  return BoundExperienceSchema.parse(input);
}
export function safeParseBoundExperience(input: unknown) {
  return BoundExperienceSchema.safeParse(input);
}

/** Substitute {recipient} (and {name}) tokens in any default/resolved string. */
export function applyTokens(text: string, recipientName: string): string {
  return text
    .replaceAll('{recipient}', recipientName)
    .replaceAll('{name}', recipientName);
}

/** Resolve a scene def by a bound step's templateStepId. */
export function sceneForStep(
  def: Pick<BoundExperience, 'scenes'>,
  step: Pick<BoundStep, 'templateStepId'>,
): SceneDef | undefined {
  return def.scenes.find((s) => s.id === step.templateStepId);
}
