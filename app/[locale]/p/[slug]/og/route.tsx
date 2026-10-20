import { getPublicExperienceBySlug } from '@/server/dashboard/share-service';
import { getStorage } from '@/server/storage';
import { cardPreview } from '@/lib/card-preview';
import { renderCardOg, photoDataUri } from '@/components/marketing/card-og';

export const runtime = 'nodejs';

/**
 * GET /<locale>/p/<slug>/og — the shared card's link-preview image.
 *
 * Same unlock gate as the card page (a locked or dead link gets the brand
 * image instead), and it never counts as a view: share apps fetch it on their
 * own. The page links it with a ?v= content hash, so editing the card gives
 * WhatsApp a new URL to fetch rather than its cached picture.
 */
export async function GET(req: Request, { params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  const exp = await getPublicExperienceBySlug(slug, { countView: false });
  if (!exp) return Response.redirect(new URL(`/${locale === 'en' ? 'en' : 'ar'}/og`, req.url), 302);

  const preview = cardPreview(exp);
  const photo = preview.photo ? await readPhoto(preview.photo.url) : null;
  const jpg = await renderCardOg(preview, photo);

  return new Response(new Uint8Array(jpg), {
    headers: {
      'Content-Type': 'image/jpeg',
      'Content-Length': String(jpg.byteLength),
      // Versioned by ?v=; a day at the edge keeps repeat pastes cheap.
      'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800',
    },
  });
}

/** A bound media URL is /api/storage/experience-media/<key>?exp=…; read it straight from storage. */
async function readPhoto(url: string): Promise<string | null> {
  const prefix = '/api/storage/experience-media/';
  const path = url.split('?')[0];
  if (!path.startsWith(prefix)) return null;
  const key = path
    .slice(prefix.length)
    .split('/')
    .map((s) => decodeURIComponent(s))
    .join('/');
  try {
    return await photoDataUri(await getStorage().get('experience-media', key));
  } catch {
    return null;
  }
}
