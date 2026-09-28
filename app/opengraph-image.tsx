import { renderOgCard, ogAlt, ogSize } from '@/components/marketing/og-card';

// Default social-share card for routes outside a more specific one. Rendered
// by next/og — no binary asset to maintain.
export const runtime = 'nodejs';
export const alt = ogAlt;
export const size = ogSize;
export const contentType = 'image/png';

export default function OgImage() {
  return renderOgCard();
}
