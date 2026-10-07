import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { setRequestLocale, getMessages } from 'next-intl/server';
import { Inter, Cairo, IBM_Plex_Sans_Arabic, Fredoka, Aref_Ruqaa } from 'next/font/google';
import { routing, dirFor } from '@/i18n/routing';
import { SITE_URL } from '@/lib/site';
import { Tracker } from '@/components/analytics/Tracker';

const SEO = {
  en: {
    title: 'Congrats — Animated greetings, made personal',
    description:
      'Make one animated card that unfolds as they scroll — their name, your photos, your words — or a one-page wedding invitation, shared with a single link. Arabic & English.',
  },
  ar: {
    title: 'Congrats تهاني ودعوات — فرحتك في لينك واحد',
    description:
      'اعمل كارت تهنئة متحرك يتكشّف مع كل سحبة — باسمهم وصورك وكلماتك — أو دعوة فرح في صفحة واحدة، وشاركها برابط واحد. بالعربي والإنجليزي.',
  },
} as const;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const l = locale === 'ar' ? 'ar' : 'en';
  const seo = SEO[l];
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: seo.title, template: '%s · Congrats' },
    description: seo.description,
    applicationName: 'Congrats',
    alternates: {
      canonical: `/${l}`,
      languages: { en: '/en', ar: '/ar', 'x-default': '/ar' },
    },
    openGraph: {
      type: 'website',
      siteName: 'Congrats',
      title: seo.title,
      description: seo.description,
      url: `/${l}`,
      locale: l === 'ar' ? 'ar_EG' : 'en_US',
      alternateLocale: l === 'ar' ? 'en_US' : 'ar_EG',
      images: [{ url: `/${l}/og`, width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      title: seo.title,
      description: seo.description,
      images: [`/${l}/og`],
    },
    icons: {
      icon: [
        { url: '/favicon.svg', type: 'image/svg+xml' },
        { url: '/brand/png/favicon-32.png', sizes: '32x32', type: 'image/png' },
      ],
      apple: '/apple-touch-icon.png',
    },
    robots: { index: true, follow: true },
  };
}

// Per-locale fonts via next/font (brand identity: docs/brand/brand-guide.md).
// AR → Cairo (headings) + IBM Plex Sans Arabic (body) + Aref Ruqaa (display,
// short festive phrases only). EN → Fredoka (headings/display) + Inter (body).
// Exposed as the CSS variables tailwind.config references.
const inter = Inter({ subsets: ['latin'], variable: '--font-en', display: 'swap' });
const fredoka = Fredoka({ subsets: ['latin'], variable: '--font-en-heading', display: 'swap' });
const cairo = Cairo({ subsets: ['arabic', 'latin'], variable: '--font-ar-heading', display: 'swap' });
const plexArabic = IBM_Plex_Sans_Arabic({
  subsets: ['arabic', 'latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-ar-body',
  display: 'swap',
});
// Display face is opt-in (`font-display`); don't preload it on every page.
const arefRuqaa = Aref_Ruqaa({
  subsets: ['arabic'],
  weight: ['400', '700'],
  variable: '--font-ar-display',
  display: 'swap',
  preload: false,
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) notFound();

  setRequestLocale(locale);
  // Pass the merged namespace messages to the client provider so CLIENT
  // components (useTranslations) resolve keys during SSR/prerender. Without
  // this, next-intl throws "No messages were configured on the provider".
  const messages = await getMessages();
  const dir = dirFor(locale);
  const isAr = locale === 'ar';

  // Bind --font-heading / --font-body to the locale-appropriate families.
  const fontVars = isAr
    ? `${cairo.variable} ${plexArabic.variable} ${arefRuqaa.variable}`
    : `${inter.variable} ${fredoka.variable}`;
  const fontStyle = isAr
    ? ({
        ['--font-heading' as string]: 'var(--font-ar-heading)',
        ['--font-body' as string]: 'var(--font-ar-body)',
        ['--font-display' as string]: 'var(--font-ar-display)',
      } as React.CSSProperties)
    : ({
        ['--font-heading' as string]: 'var(--font-en-heading)',
        ['--font-body' as string]: 'var(--font-en)',
        ['--font-display' as string]: 'var(--font-en-heading)',
      } as React.CSSProperties);

  return (
    <html lang={locale} dir={dir} className={fontVars} style={fontStyle}>
      <body className="min-h-[100dvh] font-body antialiased">
        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
        </NextIntlClientProvider>
        <Tracker />
      </body>
    </html>
  );
}
