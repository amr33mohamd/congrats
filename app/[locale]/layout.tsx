import type { ReactNode } from 'react';
import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { Inter, Cairo, Tajawal } from 'next/font/google';
import { routing, dirFor } from '@/i18n/routing';

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
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}
