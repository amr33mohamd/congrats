import type { BoundExperience } from '@/lib/template-contract';
import type { getGalleryTemplate } from '@/server/public/templates-gallery';
import { buildPreviewExperience } from '@/lib/template-preview';

type GalleryTemplate = NonNullable<Awaited<ReturnType<typeof getGalleryTemplate>>>;

/** `?names=` from a Messenger reply: the couple's names, tidied and capped. */
export function namesParam(raw: string | string[] | null | undefined): string | null {
  const v = (Array.isArray(raw) ? raw[0] : raw)?.replace(/\s+/g, ' ').trim();
  return v ? v.slice(0, 44) : null;
}

/**
 * The design's preview card, with the visitor's names on it when given. A
 * design asks for the names once, as the `couple` field; anything else
 * (greeting cards) shows them where it shows the recipient.
 */
export function namedPreview(
  tpl: GalleryTemplate,
  names: string | null,
  sampleName: string,
): { experience: BoundExperience; hasCouple: boolean } {
  const hasCouple = (tpl.definition.fields ?? []).some((f) => f.key === 'couple');
  const experience = buildPreviewExperience(tpl.definition, {
    templateId: tpl.id,
    category: tpl.categorySlug ?? undefined,
    recipientName: names && !hasCouple ? names : sampleName,
  });
  if (names && hasCouple) experience.fields = { ...experience.fields, couple: names };
  return { experience, hasCouple };
}
