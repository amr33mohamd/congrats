import type { ExperienceStatus } from './types';

type Tone = 'neutral' | 'brand' | 'success' | 'danger' | 'warning';

export const statusTone: Record<ExperienceStatus, Tone> = {
  draft: 'neutral',
  awaiting_payment: 'warning',
  locked: 'brand',
  published: 'success',
  rejected: 'danger',
};

/**
 * Derive a UI status from whatever the backend returns. Backends may already
 * send a `status` string; otherwise we infer from paid/unlocked/order fields.
 */
export function deriveStatus(item: {
  status?: string | null;
  isPaid?: boolean;
  isUnlocked?: boolean;
  shareSlug?: string | null;
  slug?: string | null;
  orderId?: string | null;
}): ExperienceStatus {
  const known: ExperienceStatus[] = [
    'draft',
    'awaiting_payment',
    'locked',
    'published',
    'rejected',
  ];
  if (item.status && (known as string[]).includes(item.status)) {
    return item.status as ExperienceStatus;
  }
  const hasLink = Boolean(item.shareSlug ?? item.slug);
  if (item.isUnlocked && hasLink) return 'published';
  if (!item.isPaid && hasLink) return 'published';
  if (item.orderId) return 'locked';
  return 'draft';
}

export function isShareable(status: ExperienceStatus): boolean {
  return status === 'published';
}
