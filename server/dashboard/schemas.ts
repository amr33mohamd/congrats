/**
 * Zod input schemas for every dashboard endpoint. Centralised so request
 * validation is consistent and the service layer receives already-typed input.
 *
 * These validate the *shape* of the request. Deeper, template-aware validation
 * (e.g. that a step's slot keys exist on the scene def) lives in the services.
 */
import { z } from 'zod';
import { LocaleSchema } from '@/lib/template-contract';
import { QuizAnswersSchema } from '@/lib/quiz/answers';

const uuid = z.string().uuid();

/* ───────────────────────────── Experiences ────────────────────────────── */

export const createExperienceSchema = z.object({
  templateId: uuid,
  locale: LocaleSchema.optional(),
  recipientName: z.string().trim().min(1).max(120).optional(),
  title: z.string().trim().min(1).max(160).optional(),
  // Answers from the /start questionnaire. Applied once, at creation, through
  // lib/quiz/personalize (whitelisted slots, each capped at its maxLen).
  prefill: QuizAnswersSchema.optional(),
});
export type CreateExperienceInput = z.infer<typeof createExperienceSchema>;

/**
 * Trimmed, and an empty string means "none" (null). A blank recipient is a real
 * choice — one invitation link sent to every guest — and rejecting it used to
 * fail the whole Details autosave, taking the couple's names and the wedding
 * date down with it.
 */
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((v) => (v === '' ? null : v))
    .nullable()
    .optional();

export const updateExperienceSchema = z
  .object({
    title: optionalText(160),
    recipientName: optionalText(120),
    locale: LocaleSchema.optional(),
    // Card-level details (couple's names, wedding date). Keys are validated
    // against the template's fields in the service.
    fields: z.record(z.string().max(500)).optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: 'no fields to update' });
export type UpdateExperienceInput = z.infer<typeof updateExperienceSchema>;

/* ─────────────────────────────── Steps ────────────────────────────────── */

export const putStepsSchema = z.object({
  steps: z
    .array(
      z.object({
        templateStepId: z.string().min(1),
        orderIndex: z.number().int().nonnegative(),
        // slot.key -> resolved string
        text: z.record(z.string()).default({}),
        animationConfig: z.record(z.unknown()).default({}),
      }),
    )
    .min(1),
});
export type PutStepsInput = z.infer<typeof putStepsSchema>;

/* ─────────────────────────────── Media ────────────────────────────────── */

// 'step_image' fills a scene's photo slot and may also be a short video;
// 'music' is the card's own soundtrack, replacing the template's track.
export const MEDIA_KINDS = ['step_image', 'payment_screenshot', 'thumbnail', 'music'] as const;
export const MediaKindSchema = z.enum(MEDIA_KINDS);

export const signMediaSchema = z.object({
  kind: MediaKindSchema,
  mime: z.string().min(1),
  bytes: z.number().int().positive(),
  experienceId: uuid.optional(),
  stepId: uuid.optional(),
});
export type SignMediaInput = z.infer<typeof signMediaSchema>;

export const confirmMediaSchema = z.object({
  bucket: z.enum(['experience-media', 'payment-proofs']),
  key: z.string().min(1),
  mime: z.string().min(1),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  bytes: z.number().int().positive(),
  experienceId: uuid.optional(),
  stepId: uuid.optional(),
  // Stable scene id + image-slot key (NOT UUIDs) so multi-slot / multi-photo
  // scenes bind correctly and survive step-row replacement.
  templateStepId: z.string().min(1).optional(),
  slotKey: z.string().min(1).optional(),
  kind: MediaKindSchema.optional(),
});
export type ConfirmMediaInput = z.infer<typeof confirmMediaSchema>;

/* ─────────────────────────────── Orders ───────────────────────────────── */

export const createOrderSchema = z.object({
  experienceId: uuid,
});
export type CreateOrderInput = z.infer<typeof createOrderSchema>;

export const submitOrderSchema = z.object({
  screenshotMediaId: uuid,
  paymentRef: z.string().trim().min(1).max(120),
});
export type SubmitOrderInput = z.infer<typeof submitOrderSchema>;

/* ──────────────────────── Constraints (media policy) ───────────────────── */

/** Allowed image MIME types for experience media + payment screenshots. */
export const ALLOWED_IMAGE_MIME = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
] as const;

/** Max upload size per image: 8 MiB. */
export const MAX_MEDIA_BYTES = 8 * 1024 * 1024;

/** Video a sender may put in a photo slot (plays muted, looping). */
export const ALLOWED_VIDEO_MIME = ['video/mp4', 'video/quicktime', 'video/webm'] as const;

/** Audio a sender may upload as the card's music. */
export const ALLOWED_AUDIO_MIME = ['audio/mpeg', 'audio/mp4', 'audio/aac', 'audio/ogg', 'audio/wav'] as const;

/** Max upload size per video: 30 MiB (about a minute of phone video). */
export const MAX_VIDEO_BYTES = 30 * 1024 * 1024;

/** Max upload size per song: 15 MiB (a full song at a high bitrate). */
export const MAX_AUDIO_BYTES = 15 * 1024 * 1024;

/** The largest file any upload route accepts. */
export const MAX_ANY_MEDIA_BYTES = Math.max(MAX_MEDIA_BYTES, MAX_VIDEO_BYTES, MAX_AUDIO_BYTES);
