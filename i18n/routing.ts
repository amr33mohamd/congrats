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
});
