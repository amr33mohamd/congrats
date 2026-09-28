import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { setRequestLocale, getMessages } from 'next-intl/server';
import { Inter, Cairo, Tajawal } from 'next/font/google';
import { routing, dirFor } from '@/i18n/routing';
import { SITE_URL } from '@/lib/site';

const SEO = {
  en: {
    title: 'Congrats — Animated greetings, made personal',
    description:
      'Make one animated card that unfolds as they scroll — their name, your photos, your words — or a one-page wedding invitation, shared with a single link. Arabic & English.',
  },
  ar: {
    title: 'مبروك — تهاني متحركة بلمسة شخصية',
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
    icons: { icon: '/favicon.svg', apple: '/favicon.svg' },
    robots: { index: true, follow: true },
  };
}

// Per-locale fonts via next/font. AR → Cairo (headings) + Tajawal (body),
// EN → Inter for both. Exposed as the CSS variables tailwind.config references.
const inter = Inter({ subsets: ['latin'], variable: '--font-en', display: 'swap' });
const cairo = Cairo({ subsets: ['arabic'], variable: '--font-ar-heading', display: 'swap' });
const tajawal = Tajawal({
  subsets: ['arabic'],
  weight: ['400', '500', '700'],
  variable: '--font-ar-body',
  display: 'swap',
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
    ? `${cairo.variable} ${tajawal.variable}`
    : `${inter.variable}`;
  const fontStyle = isAr
    ? ({ ['--font-heading' as string]: 'var(--font-ar-heading)', ['--font-body' as string]: 'var(--font-ar-body)' } as React.CSSProperties)
    : ({ ['--font-heading' as string]: 'var(--font-en)', ['--font-body' as string]: 'var(--font-en)' } as React.CSSProperties);

  return (
    <html lang={locale} dir={dir} className={fontVars} style={fontStyle}>
      <body className="min-h-[100dvh] font-body antialiased">
        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
