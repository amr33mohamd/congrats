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
  // Expressive types added in the engine rebuild:
  'Quote', // large stylized quote / verse with optional attribution
  'Letter', // a personal note rendered like handwritten stationery
  // Invitation sections (one-page scroll cards):
  'Families', // two columns — each family's names under a shared heading
  'Event', // one event block: label, venue, time, big date numeral
  'Venue', // address + a "get directions" link
  'Rsvp', // confirm attendance — opens WhatsApp with a prefilled message
  'Gift', // gift / transfer details, copyable
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
  // Added in the engine rebuild for richer, more distinct motion:
  'rise', // gently rises up while fading in
  'blurIn', // de-blurs into focus
  'glow', // scales up with a soft glow
  'bounce', // springy entrance
  'float', // drifts in with a buoyant overshoot
  'kenBurns', // slow cinematic zoom/pan (image scenes)
  'shimmer', // sheen sweep across the element
] as const;
export const AnimationPresetSchema = z.enum(ANIMATION_PRESETS);
export type AnimationPreset = (typeof ANIMATION_PRESETS)[number];

/* ─────────────────── Background / decoration / style ───────────────── */

/** A scene (or whole-experience) background. All fields optional → palette gradient fallback. */
export const BackgroundSchema = z.object({
  type: z.enum(['gradient', 'solid', 'radial', 'image', 'pattern']).default('gradient'),
  colors: z.array(z.string()).default([]), // gradient/solid/radial stops
  angle: z.number().default(160), // gradient angle (deg)
  imageUrl: z.string().optional(), // external image URL (e.g. Unsplash)
  /** Overlay painted OVER an image for text legibility (css color or gradient). */
  overlay: z.string().optional(),
  blurPx: z.number().nonnegative().optional(),
  /** Decorative CSS pattern layered over the base. */
  pattern: z.enum(['none', 'dots', 'grid', 'diagonal', 'confettiDots', 'noise', 'damask']).optional(),
  /** Slow cinematic zoom on an image background. */
  kenBurns: z.boolean().optional(),
});
export type Background = z.infer<typeof BackgroundSchema>;

/** Ambient particle / atmosphere layer for a scene. */
export const DecorationSchema = z.object({
  effect: z
    .enum([
      'none',
      'confetti',
      'hearts',
      'petals',
      'sparkles',
      'snow',
      'balloons',
      'stars',
      'bubbles',
      'fireworks',
      'glow',
      'emoji',
    ])
    .default('none'),
  intensity: z.enum(['low', 'medium', 'high']).default('medium'),
  color: z.string().optional(),
  /** Custom emoji used when effect === 'emoji'. */
  emoji: z.string().optional(),
});
export type Decoration = z.infer<typeof DecorationSchema>;

/** Per-scene typography & layout treatment. */
/* ───────────────────────────── Ornament ───────────────────────────── */

/**
 * Decorative line-work drawn around a scene's content: arches, wreaths,
 * engraved borders, corner florals. Distinct from `Decoration`, which is
 * ambient *motion* (falling petals, confetti); an ornament is static
 * architecture and is what gives a card its "printed invitation" feel.
 *
 * Additive and fully optional — a template that omits it renders exactly as
 * it did before.
 */
export const ORNAMENT_KINDS = [
  'none',
  'arch',        // arched window / mihrab outline
  'wreath',      // botanical ring around the content
  'engraved',    // inset double rule with corner flourishes
  'corners',     // floral clusters in opposing corners
  'banner',      // ornamental bands top and bottom
  'monogram',    // centred crest + rules, sits behind a heading
  'baroque',     // dense scrollwork + peony clusters, opposing corners, bleeds off
  'florals',     // vertical floral columns down both edges
  'theatre',     // velvet stage drapes, tasselled valance, gold pilasters, ouds
] as const;
export const OrnamentKindSchema = z.enum(ORNAMENT_KINDS);
export type OrnamentKind = (typeof ORNAMENT_KINDS)[number];

export const OrnamentSchema = z.object({
  kind: OrnamentKindSchema,
  /** Defaults to the theme accent. */
  color: z.string().optional(),
  opacity: z.number().min(0).max(1).default(0.85),
  /** Relative size of the motif, 0.5–1.5. */
  scale: z.number().min(0.5).max(1.5).default(1),
});
export type Ornament = z.infer<typeof OrnamentSchema>;

export const SceneStyleSchema = z.object({
  textAlign: z.enum(['start', 'center', 'end']).default('center'),
  textPosition: z.enum(['center', 'top', 'bottom']).default('center'),
  headingColor: z.string().optional(),
  bodyColor: z.string().optional(),
  headingSize: z.enum(['sm', 'md', 'lg', 'xl', '2xl']).optional(),
  /** Per-scene heading font override (otherwise theme.fontHeading). */
  headingFont: z.string().optional(),
  /** How an image in this scene is framed. */
  imageStyle: z
    .enum(['rounded', 'circle', 'full', 'polaroid', 'card', 'tilt', 'arch', 'ornate', 'taped'])
    .optional(),
});
export type SceneStyle = z.infer<typeof SceneStyleSchema>;

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
  // Field label shown in the builder ("Groom's family", "Reception venue").
  // Without it every field reads just "Text", which is unusable on a section
  // with five of them.
  labelEn: z.string().optional(),
  labelAr: z.string().optional(),
  /**
   * Keys this slot was saved under in earlier versions of the template. When a
   * template renames a field, saved cards still hold the old key; listing it
   * here lets reconciliation carry the value across instead of the card
   * failing validation (which used to block every save on that card).
   */
  formerKeys: z.array(z.string()).optional(),
  /**
   * Defaults this slot shipped with in earlier versions. A saved value equal to
   * one of them was never typed by the sender, so reconciliation swaps it for
   * the current default ("Friday · 5:00 PM" became just "5:00 PM" once the
   * day came from the wedding date).
   */
  formerDefaults: z.array(z.string()).optional(),
  /**
   * Take the value from a card-level field (TemplateDefinition.fields) instead
   * of asking for it here. The builder does not show a bound slot at all —
   * that is how a card asks for the wedding date once, not three times.
   */
  bind: z.string().optional(),
  /**
   * Like `bind`, but the slot stays editable: an empty slot falls back to the
   * field. For "same as the wedding date, unless this event is another day".
   */
  fallback: z.string().optional(),
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
  // Visual customization (all optional → fall back to theme/palette defaults):
  background: BackgroundSchema.optional(),
  decoration: DecorationSchema.optional(),
  ornament: OrnamentSchema.optional(),
  style: SceneStyleSchema.optional(),
});
export type SceneDef = z.infer<typeof SceneDefSchema>;

/* ───────────────────────── Template theme ─────────────────────────── */

export const TemplateThemeSchema = z.object({
  palette: z.array(z.string()).default([]),
  fontHeading: z.string().optional(),
  fontBody: z.string().optional(),
  /**
   * The fonts for each language, for a card switched to the language it was
   * not designed in (an English display face has no Arabic glyphs).
   */
  localeFonts: z
    .record(z.enum(['ar', 'en']), z.object({ heading: z.string().optional(), body: z.string().optional() }))
    .optional(),
  music: z.string().optional(),
  accent: z.string().optional(),
  /** Default background for every scene that doesn't declare its own. */
  background: BackgroundSchema.optional(),
  /** Default ambient decoration for the whole experience. */
  decoration: DecorationSchema.optional(),
  /** Default ornament for every scene that doesn't declare its own. */
  ornament: OrnamentSchema.optional(),
  /**
   * Illustration files (painted florals, frames) that upgrade the vector
   * ornaments. Every field is optional; anything missing falls back to the
   * SVG ornament, so a style works before its art exists.
   */
  art: z
    .object({
      /** Top-corner cluster; mirrored for the opposite corner. */
      corner: z.string().optional(),
      /** Horizontal flourish drawn between sections and under headings. */
      divider: z.string().optional(),
      /** Full-card border frame, stretched to the section. */
      frame: z.string().optional(),
      /** Tileable paper/texture for the continuous surface. */
      texture: z.string().optional(),
    })
    .optional(),
  /** Default text color for scenes that don't override (defaults to white). */
  textColor: z.string().optional(),
});
export type TemplateTheme = z.infer<typeof TemplateThemeSchema>;

/* ──────────────────── TemplateDefinition (frozen) ──────────────────── */

/**
 * A detail that belongs to the whole card — the couple's names, the wedding
 * date — asked once in the builder's first step. Scenes use it through slot
 * `bind`/`fallback` or as a `{key}` token inside any text.
 */
export const FieldSchema = z.object({
  key: z.string().regex(/^[a-zA-Z][a-zA-Z0-9]*$/),
  type: z.enum(['text', 'date']).default('text'),
  required: z.boolean().default(false),
  maxLen: z.number().int().positive().optional(),
  labelEn: z.string().optional(),
  labelAr: z.string().optional(),
  defaultEn: z.string().optional(),
  defaultAr: z.string().optional(),
});
export type Field = z.infer<typeof FieldSchema>;

export const TemplateDefinitionSchema = z.object({
  version: z.number().int().positive().default(1),
  locale: LocaleSchema,
  direction: DirectionSchema,
  theme: TemplateThemeSchema.default({}),
  /** Card-level details, asked once (see FieldSchema). */
  fields: z.array(FieldSchema).default([]),
  scenes: z.array(SceneDefSchema).min(1), // ORDERED scene defs
});
export type TemplateDefinition = z.infer<typeof TemplateDefinitionSchema>;
/**
 * Authoring shape (INPUT): fields with zod `.default()` (delayMs, textAlign,
 * angle, colors, …) are optional here, so content authors only specify what
 * they want. Validated/normalised to `TemplateDefinition` by the schema.
 */
export type TemplateDefinitionInput = z.input<typeof TemplateDefinitionSchema>;

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
  /** Values of the card-level fields, keyed by field key. */
  fields: z.record(z.string()).default({}),
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
export function applyTokens(
  text: string,
  recipientName: string,
  fields?: Record<string, string>,
): string {
  let out = text.replaceAll('{recipient}', recipientName).replaceAll('{name}', recipientName);
  if (!recipientName.trim() && /\{(recipient|name)\}/.test(text)) out = tidyWithoutName(out);
  if (fields) {
    for (const [key, value] of Object.entries(fields)) {
      if (value) out = out.replaceAll(`{${key}}`, value);
    }
  }
  return out;
}

/**
 * Copy written around a name ("Dear {recipient},", "مستنيينك يا {recipient}")
 * must still read naturally when the sender leaves the name blank — e.g. one
 * invitation link for every guest. Drops the vocative "يا" left with no name,
 * spaces left before punctuation, and a comma stranded against other
 * punctuation ("Happy Birthday, !" → "Happy Birthday!").
 */
function tidyWithoutName(s: string): string {
  return s
    // "يا" with nothing after it but punctuation, an emoji or the end.
    .replace(/\s*يا\s*(?=[^\p{L}\p{N}\s]|$)/gu, ' ')
    // A comma whose only follower is a symbol/emoji ("For you, ❤").
    .replace(/[،,](?=\s*[^\p{L}\p{N}\s،,.!؟?]+\s*$)/u, '')
    // An English salutation left with no name reads as addressing everyone.
    .replace(/^Dear\s*,/, 'Dear friends,')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\s+([،,.!؟?])/g, '$1')
    .replace(/[،,](?=[.!؟?])/g, '')
    .replace(/^[\s،,.]+/, '') // the name opened the line: "{recipient}, there's…"
    .trim()
    // A trailing comma survives only on a salutation ("Dear friends," / "عزيزنا،").
    .replace(/[،,]$/, (c, _i, str: string) => (/^(Dear|عزيز)/.test(str) ? c : ''))
    .replace(/^[a-z]/, (c) => c.toUpperCase());
}

/**
 * The experience as it should look in ITS language. A card switched away from
 * the language its template was designed in takes the sibling template's
 * fonts, and drops per-section heading faces picked for the other script.
 */
export function withLocaleFonts(exp: BoundExperience): BoundExperience {
  const fonts = exp.theme?.localeFonts?.[exp.locale];
  if (!fonts?.heading || fonts.heading === exp.theme.fontHeading) return exp;
  return {
    ...exp,
    theme: { ...exp.theme, fontHeading: fonts.heading, fontBody: fonts.body ?? exp.theme.fontBody },
    scenes: exp.scenes.map((sc) =>
      sc.style?.headingFont ? { ...sc, style: { ...sc.style, headingFont: undefined } } : sc,
    ),
  };
}

/**
 * The sender turned this section off in the builder. Stored on the step's
 * animationConfig (which already travels editor → DB → player) so hiding a
 * section needs no schema change and keeps everything typed into it.
 */
export function isStepHidden(step: { animationConfig?: Record<string, unknown> | null }): boolean {
  return step.animationConfig?.hidden === true;
}

/**
 * The value a scene should show for one slot, honouring `bind` (always the
 * card-level field) and `fallback` (the slot, or the field when empty). Raw —
 * tokens are not substituted here.
 */
export function slotValue(
  scene: Pick<SceneDef, 'slots'>,
  step: Pick<BoundStep, 'text'>,
  key: string,
  fields: Record<string, string> = {},
): string {
  const slot = scene.slots.find((s) => s.key === key);
  if (slot?.bind) return fields[slot.bind] ?? '';
  const own = step.text?.[key] ?? '';
  if (!own.trim() && slot?.fallback) return fields[slot.fallback] ?? '';
  return own;
}

/** Field values with each field's default filled in where none is saved. */
export function resolveFields(
  def: Pick<TemplateDefinition, 'fields'>,
  saved: Record<string, string> | null | undefined,
  locale: Locale,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const f of def.fields ?? []) {
    const value = saved?.[f.key];
    const fallback = (locale === 'ar' ? f.defaultAr : f.defaultEn) ?? f.defaultEn ?? f.defaultAr ?? '';
    out[f.key] = value != null && value !== '' ? value : fallback;
  }
  return out;
}

/** Resolve a scene def by a bound step's templateStepId. */
export function sceneForStep(
  def: Pick<BoundExperience, 'scenes'>,
  step: Pick<BoundStep, 'templateStepId'>,
): SceneDef | undefined {
  return def.scenes.find((s) => s.id === step.templateStepId);
}
