/**
 * REVIEWER INTEGRATION ADAPTER (full-stack reviewer owned).
 *
 * Bridges B2's nested admin QueueRow → the FLAT OrderRow shape D2's review queue
 * + drawer consume (components/admin/types.ts). It also:
 *   - mints a signed `screenshotUrl` from the screenshot media (admins may stream
 *     payment-proofs via the /api/storage route), and
 *   - for the single-order detail, binds the buyer's experience to a
 *     `BoundExperience` (with signed media URLs) so the in-drawer Player preview
 *     works regardless of unlock state (admins are pre-unlock reviewers).
 */
import { eq } from 'drizzle-orm';
import type { DbClient } from '@/db';
import { experiences, templates, steps, media } from '@/db/schema';
import { getStorage } from '@/server/storage';
import {
  parseTemplateDefinition,
  applyTokens,
  type BoundExperience,
  type BoundStep,
  type BoundMedia,
  type SceneDef,
  resolveFields,
} from '@/lib/template-contract';
import { reconcileText } from '@/server/dashboard/step-reconcile';
import type { QueueRow } from './orders-service';

export interface AdminOrderView {
  id: string;
  orderRef: string;
  status: string;
  amountPiastres: number;
  currency: string;
  instapayHandle: string | null;
  paymentRef: string | null;
  rejectReason?: string | null;
  createdAt: string | null;
  reviewedAt?: string | null;
  recipientName: string | null;
  experienceId: string | null;
  experienceTitle: string | null;
  templateTitleEn: string | null;
  templateTitleAr: string | null;
  buyerEmail: string | null;
  buyerBlocked?: boolean;
  experienceUnlocked?: boolean;
  duplicateScreenshot: boolean;
  screenshotMediaId: string | null;
  screenshotUrl: string | null;
  experience: BoundExperience | null;
}

async function signedUrl(bucket: string, key: string): Promise<string> {
  const { url } = await getStorage().getSignedUrl(bucket as never, key, 900);
  return url;
}

/** Flatten one queue/detail row → the flat OrderRow D2 renders. */
export async function toAdminOrderView(
  row: QueueRow & {
    rejectReason?: string | null;
    reviewedAt?: Date | null;
    buyerBlocked?: boolean;
    experienceUnlocked?: boolean;
  },
  opts: { db?: DbClient; bindExperience?: boolean } = {},
): Promise<AdminOrderView> {
  const screenshotUrl = row.screenshot
    ? await signedUrl(row.screenshot.bucket, row.screenshot.storagePath)
    : null;

  let experience: BoundExperience | null = null;
  if (opts.bindExperience && opts.db) {
    experience = await bindExperienceForReview(opts.db, row.experience.id).catch(() => null);
  }

  return {
    id: row.id,
    orderRef: row.orderRef,
    status: row.status,
    amountPiastres: row.amountPiastres,
    currency: row.currency,
    instapayHandle: row.instapayHandle ?? null,
    paymentRef: row.paymentRef ?? null,
    rejectReason: row.rejectReason ?? null,
    createdAt: row.createdAt ? new Date(row.createdAt).toISOString() : null,
    reviewedAt: row.reviewedAt ? new Date(row.reviewedAt).toISOString() : null,
    recipientName: row.experience.recipientName ?? null,
    experienceId: row.experience.id ?? null,
    experienceTitle: row.experience.title ?? null,
    templateTitleEn: row.template.titleEn ?? null,
    templateTitleAr: row.template.titleAr ?? null,
    buyerEmail: row.buyer.email ?? null,
    buyerBlocked: row.buyerBlocked,
    experienceUnlocked: row.experienceUnlocked,
    duplicateScreenshot: row.duplicateScreenshot,
    screenshotMediaId: row.screenshot?.id ?? null,
    screenshotUrl,
    experience,
  };
}

/**
 * Bind a buyer's experience → BoundExperience for the admin preview. Unlike the
 * public render path this does NOT enforce the unlock gate (the admin is the
 * gate). Media → signed URLs; text slots fall back to scene defaults.
 */
async function bindExperienceForReview(
  db: DbClient,
  experienceId: string,
): Promise<BoundExperience | null> {
  const exp = (await db.select().from(experiences).where(eq(experiences.id, experienceId)).limit(1))[0];
  if (!exp) return null;
  const tpl = (await db.select().from(templates).where(eq(templates.id, exp.templateId)).limit(1))[0];
  if (!tpl) return null;

  const def = parseTemplateDefinition(tpl.definition);
  const sceneById = new Map<string, SceneDef>(def.scenes.map((s) => [s.id, s]));

  const stepRows = await db.select().from(steps).where(eq(steps.experienceId, exp.id));
  stepRows.sort((a, b) => a.orderIndex - b.orderIndex);

  const mediaRows = await db.select().from(media).where(eq(media.experienceId, exp.id));
  const mediaByStep = new Map<string, typeof mediaRows>();
  for (const m of mediaRows) {
    if (!m.stepId || m.kind !== 'step_image') continue;
    const list = mediaByStep.get(m.stepId) ?? [];
    list.push(m);
    mediaByStep.set(m.stepId, list);
  }

  const recipient = exp.recipientName ?? '';
  const locale = exp.locale === 'ar' ? 'ar' : 'en';
  // The admin reviews exactly what the recipient will see: same slot-level
  // reconciliation and card-level fields as the public render.
  const cardFields = resolveFields(def, (exp.fields ?? {}) as Record<string, string>, locale);

  const boundSteps: BoundStep[] = await Promise.all(
    stepRows.map(async (s): Promise<BoundStep> => {
      const scene = sceneById.get(s.templateStepId);
      const saved = (s.textContent as Record<string, string> | null) ?? {};
      const rawText = scene ? reconcileText(scene, saved, locale).text : saved;
      const text: Record<string, string> = {};
      for (const [k, v] of Object.entries(rawText)) text[k] = applyTokens(String(v), recipient, cardFields);
      const imageSlotKey = scene?.slots.find((sl) => sl.type === 'image')?.key ?? 'image';
      const boundMedia: BoundMedia[] = await Promise.all(
        (mediaByStep.get(s.id) ?? []).map(async (m) => ({
          slot: imageSlotKey,
          url: await signedUrl(m.bucket, m.storagePath),
          width: m.width ?? undefined,
          height: m.height ?? undefined,
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

  return {
    experienceId: exp.id,
    templateId: exp.templateId,
    locale: exp.locale as 'ar' | 'en',
    direction: exp.direction as 'rtl' | 'ltr',
    recipientName: recipient,
    fields: cardFields,
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
