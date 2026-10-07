import { defineRouting } from 'next-intl/routing';

export const locales = ['ar', 'en'] as const;
export type AppLocale = (typeof locales)[number];
export const defaultLocale: AppLocale = 'ar';

export function dirFor(locale: string): 'rtl' | 'ltr' {
  return locale === 'ar' ? 'rtl' : 'ltr';
}

export const routing = defineRouting({
  locales,
  defaultLocale,
  // 'ar' (default) is also prefixed → predictable [locale] paths for both.
  localePrefix: 'always',
  // Arabic is the main language: every visitor without a locale in the URL
  // ("/", "/templates", …) lands on /ar, whatever their browser's
  // Accept-Language or a leftover NEXT_LOCALE cookie says. English stays one
  // tap away (/en, the EN toggle in the header).
  localeDetection: false,
});
