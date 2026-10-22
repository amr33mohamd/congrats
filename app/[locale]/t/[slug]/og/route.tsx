import { getGalleryTemplate } from '@/server/public/templates-gallery';
import { cardPreview } from '@/lib/card-preview';
import { renderCardOg } from '@/components/marketing/card-og';
import { namedPreview, namesParam } from '../named';

export const runtime = 'nodejs';

/**
 * GET /<locale>/t/<slug>/og?names=… — the link-preview image for a design
 * shown with someone's names, so the Messenger/WhatsApp card already reads
 * "دعوة فرح علا وعمرو". Without names it's the brand image. Each names value
 * is its own URL, so share apps never serve one couple's picture for another.
 */
export async function GET(req: Request, { params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  const names = namesParam(new URL(req.url).searchParams.get('names'));
  const tpl = names ? await getGalleryTemplate(slug) : null;
  if (!tpl || !names) return Response.redirect(new URL(`/${locale === 'en' ? 'en' : 'ar'}/og`, req.url), 302);

  // No sample recipient ("لـ ليلى") and no sample date: only what they told us.
  const { experience } = namedPreview(tpl, names, '');
  const jpg = await renderCardOg({ ...cardPreview(experience), date: '' }, null);

  return new Response(new Uint8Array(jpg), {
    headers: {
      'Content-Type': 'image/jpeg',
      'Content-Length': String(jpg.byteLength),
      'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800',
    },
  });
}
