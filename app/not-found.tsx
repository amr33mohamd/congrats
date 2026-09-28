/**
 * Global not-found boundary. Rendered for unmatched paths and for `notFound()`
 * thrown anywhere under [locale] (there is no nearer boundary), and always
 * OUTSIDE the next-intl provider — so it must not use it. It renders its own
 * <html>, reads the locale the middleware resolved, and shows both languages
 * with the visitor's first.
 *
 * Styling is inline on purpose: this has to look right even if the stylesheet
 * is what failed to load, and it is the one page with no layout around it.
 */
import Link from 'next/link';
import { cookies, headers } from 'next/headers';
import type { Metadata } from 'next';
import { SITE_URL } from '@/lib/site';

export const metadata: Metadata = {
  // No [locale] layout above this page, so it needs its own base URL.
  metadataBase: new URL(SITE_URL),
  title: '404 · Congrats',
  robots: { index: false, follow: true },
};

async function detectLocale(): Promise<'ar' | 'en'> {
  try {
    const h = await headers();
    const fromMiddleware = h.get('x-next-intl-locale');
    if (fromMiddleware === 'ar' || fromMiddleware === 'en') return fromMiddleware;
    const c = await cookies();
    if (c.get('NEXT_LOCALE')?.value === 'en') return 'en';
  } catch {
    /* outside a request (static render) — fall through to the default */
  }
  return 'ar';
}

const copy = {
  ar: {
    title: 'الصفحة دي مش موجودة',
    body: 'يمكن الرابط اتكتب غلط، أو الكارت اتشال أو لسه ما اتنشرش.',
    home: 'الرئيسية',
    templates: 'تصفّح القوالب',
  },
  en: {
    title: "This page doesn't exist",
    body: 'The link may be mistyped, or the card was removed or not published yet.',
    home: 'Home',
    templates: 'Browse templates',
  },
} as const;

export default async function NotFound() {
  const locale = await detectLocale();
  const other = locale === 'ar' ? 'en' : 'ar';
  const primary = copy[locale];
  const secondary = copy[other];

  return (
    <html lang={locale} dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      <body
        style={{
          margin: 0,
          minHeight: '100dvh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem 1rem',
          boxSizing: 'border-box',
          fontFamily: 'system-ui, -apple-system, "Segoe UI", Tahoma, sans-serif',
          color: '#F7F4F5',
          background:
            'radial-gradient(60% 45% at 50% 0%, rgba(240,67,110,0.28), transparent 70%), radial-gradient(40% 40% at 90% 100%, rgba(214,164,53,0.18), transparent 70%), #0C0A0B',
          textAlign: 'center',
        }}
      >
        <main style={{ maxWidth: 440, width: '100%' }}>
          <div
            aria-hidden
            style={{
              fontSize: 'clamp(4.5rem, 22vw, 7rem)',
              fontWeight: 800,
              lineHeight: 1,
              letterSpacing: '-0.04em',
              background: 'linear-gradient(135deg, #FF8FA8, #F0436E 45%, #E9C667)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent',
            }}
          >
            404
          </div>
          <h1 style={{ margin: '1.25rem 0 0', fontSize: '1.5rem', fontWeight: 700 }}>{primary.title}</h1>
          <p style={{ margin: '0.5rem 0 0', color: '#9E9498', lineHeight: 1.6 }}>{primary.body}</p>
          <p
            lang={other}
            dir={other === 'ar' ? 'rtl' : 'ltr'}
            style={{ margin: '1rem 0 0', color: '#6F6569', fontSize: '0.9rem', lineHeight: 1.6 }}
          >
            {secondary.title} — {secondary.body}
          </p>

          <div
            style={{
              marginTop: '2rem',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '0.75rem',
              justifyContent: 'center',
            }}
          >
            <Link
              href={`/${locale}/templates`}
              style={{
                background: '#F0436E',
                color: '#fff',
                padding: '0.75rem 1.5rem',
                borderRadius: 9999,
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              {primary.templates}
            </Link>
            <Link
              href={`/${locale}`}
              style={{
                border: '1px solid #30292D',
                background: '#1A1518',
                color: '#F7F4F5',
                padding: '0.75rem 1.5rem',
                borderRadius: 9999,
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              🎉 {primary.home}
            </Link>
          </div>
        </main>
      </body>
    </html>
  );
}
