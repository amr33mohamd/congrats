/**
 * REVIEWER INTEGRATION ADAPTER (full-stack reviewer owned).
 *
 * Bridges B1's nested editor payload ({experience, template, steps, shareLink})
 * to the flat `EditorExperience` shape D1's builder wizard + live preview expect
 * (scenes/theme/pricing inline, steps as BoundStep[] with signed media URLs).
 *
 * Keeping this in one place means neither B1's service nor D1's client had to be
 * rewritten to agree on the wire shape.
 */
import type { UserContext } from '@/server/db-context';
import type { EditorPayload } from './experiences-service';
import type { Media } from '@/db/schema';
import type { SceneDef, BoundStep } from '@/lib/template-contract';
import { signedUrlForMedia } from './media-service';
import * as repo from './repositories';

export interface EditorExperienceView {
  id: string;
  templateId: string;
  title: string | null;
  recipientName: string | null;
  locale: 'ar' | 'en';
  direction: 'rtl' | 'ltr';
  status: string;
  isPaid: boolean;
  isUnlocked: boolean;
  pricePiastres: number;
  currency: string;
  theme: EditorPayload['template']['definition']['theme'];
  scenes: SceneDef[];
  steps: BoundStep[];
  templateName: string | null;
  shareSlug: string | null;
  orderId: string | null;
}

export async function toEditorExperienceView(
  ctx: UserContext,
  payload: EditorPayload,
): Promise<EditorExperienceView> {
  const { experience, template, steps, shareLink } = payload;
  const def = template.definition;
  const sceneById = new Map<string, SceneDef>(def.scenes.map((s) => [s.id, s]));

  // Owner-scoped media for this experience → signed URLs, grouped by the STABLE
  // templateStepId (scene id) so saved photos re-hydrate even after step rows
  // were replaced. Stable order (created_at then id) preserves gallery order.
  const mediaRows = await repo.listExperienceMedia(ctx.db, ctx.user.id, experience.id);
  mediaRows.sort((a, b) => {
    const t = (a.createdAt?.getTime() ?? 0) - (b.createdAt?.getTime() ?? 0);
    return t !== 0 ? t : a.id.localeCompare(b.id);
  });
  const stepUuidToTemplateId = new Map(steps.map((s) => [s.id, s.templateStepId]));
  const mediaByScene = new Map<string, Media[]>();
  for (const m of mediaRows) {
    if (m.kind !== 'step_image') continue;
    const sceneId =
      m.templateStepId ?? (m.stepId ? stepUuidToTemplateId.get(m.stepId) : undefined);
    if (!sceneId) continue;
    const list = mediaByScene.get(sceneId) ?? [];
    list.push(m);
    mediaByScene.set(sceneId, list);
  }

  const boundSteps: BoundStep[] = await Promise.all(
    steps.map(async (s): Promise<BoundStep> => {
      const scene = sceneById.get(s.templateStepId);
      const fallbackSlotKey = scene?.slots.find((sl) => sl.type === 'image')?.key ?? 'image';
      const rows = mediaByScene.get(s.templateStepId) ?? [];
      const media = await Promise.all(
        rows.map(async (m) => ({
          slot: m.slotKey ?? fallbackSlotKey,
          url: await signedUrlForMedia(m),
          width: m.width ?? undefined,
          height: m.height ?? undefined,
        })),
      );
      return {
        templateStepId: s.templateStepId,
        orderIndex: s.orderIndex,
        text: s.text,
        media,
        animationConfig: s.animationConfig,
      };
    }),
  );

  // Surface the most recent order id so the dashboard can deep-link to status.
  const order = await repo.findReusableOrder(ctx.db, ctx.user.id, experience.id);

  return {
    id: experience.id,
    templateId: experience.templateId,
    title: experience.title ?? null,
    recipientName: experience.recipientName ?? null,
    locale: experience.locale as 'ar' | 'en',
    direction: experience.direction as 'rtl' | 'ltr',
    status: experience.status,
    isPaid: template.isPaid,
    isUnlocked: experience.isUnlocked,
    pricePiastres: template.pricePiastres,
    currency: template.currency,
    theme: def.theme,
    scenes: def.scenes,
    steps: boundSteps,
    templateName: template.slug,
    shareSlug: shareLink?.slug ?? null,
    orderId: order?.id ?? null,
  };
}
