import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { setRequestLocale, getMessages } from 'next-intl/server';
import { Inter, Cairo, Tajawal } from 'next/font/google';
import { routing, dirFor } from '@/i18n/routing';

const SITE_URL = (process.env.AUTH_URL ?? 'http://localhost:3000').replace(/\/$/, '');

const SEO = {
  en: {
    title: 'Congrats — Animated greetings, made personal',
    description:
      'Craft a step-by-step animated congratulations — their name, your photos, your words — and share it with a single link. Works on every phone, Arabic & English.',
  },
  ar: {
    title: 'مبروك — تهاني متحركة بلمسة شخصية',
    description:
      'اصنع تهنئة متحركة خطوة بخطوة — باسمهم وصورك وكلماتك — وشاركها برابط واحد. تعمل على كل هاتف، بالعربية والإنجليزية.',
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
      languages: { en: '/en', ar: '/ar', 'x-default': '/en' },
    },
    openGraph: {
      type: 'website',
      siteName: 'Congrats',
      title: seo.title,
      description: seo.description,
      url: `/${l}`,
      locale: l === 'ar' ? 'ar_EG' : 'en_US',
      alternateLocale: l === 'ar' ? 'en_US' : 'ar_EG',
    },
    twitter: { card: 'summary_large_image', title: seo.title, description: seo.description },
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
