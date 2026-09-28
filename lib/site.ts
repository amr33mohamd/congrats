/**
 * Public business details, in one place.
 *
 * Legal pages, the footer and page metadata all read from here so the owner
 * fills in real details ONCE (via env) instead of hunting placeholders across
 * four bilingual pages.
 *
 * Every value is `NEXT_PUBLIC_*` because these render in server AND client
 * components and are public by nature (they are printed on the contact page).
 * Next inlines `NEXT_PUBLIC_*` values at BUILD time (server and client
 * bundles alike), so they must be set when `next build` runs — changing one
 * needs a rebuild. SITE_URL additionally falls back to AUTH_URL, which is read
 * at runtime.
 *
 * Fallback policy: identity facts (legal entity, email, address, phone) have NO
 * invented default — an unset value is `null` and the UI omits that line rather
 * than printing something made up. Policy numbers (response time, refund
 * window…) DO have defaults, because they are promises the owner sets, not
 * facts about the world; the defaults are the conservative ones the legal
 * drafts already suggested.
 */

// Each variable is read as a literal `process.env.NEXT_PUBLIC_…` below — never
// `process.env[name]` — because Next only inlines literal accesses into client
// bundles; a computed key would silently be undefined in the browser.
function clean(v: string | undefined): string | null {
  return v && v.trim() ? v.trim() : null;
}

/** Positive integer from env, or the fallback if unset/garbled. */
function positiveInt(v: string | undefined, fallback: number): number {
  const n = Number.parseInt(clean(v) ?? '', 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

type Localized = { en: string; ar: string };

/** Canonical origin, no trailing slash. AUTH_URL is already required in prod. */
export const SITE_URL = (
  clean(process.env.NEXT_PUBLIC_SITE_URL) ??
  process.env.AUTH_URL ??
  'http://localhost:3000'
).replace(/\/$/, '');

const refundDays = positiveInt(process.env.NEXT_PUBLIC_REFUND_WINDOW_DAYS, 7);

/** Arabic-Indic digits for Arabic copy, matching the rest of the AR UI. */
function arNum(n: number): string {
  return new Intl.NumberFormat('ar-EG').format(n);
}

export const site = {
  /** Trading name shown to users. */
  brand: 'Congrats',

  /**
   * The legal operator (person or company). `null` until the owner sets it —
   * the legal pages then speak as "Congrats" rather than naming an entity that
   * may not exist.
   */
  companyName: clean(process.env.NEXT_PUBLIC_COMPANY_NAME),
  supportEmail: clean(process.env.NEXT_PUBLIC_SUPPORT_EMAIL),
  businessAddress: clean(process.env.NEXT_PUBLIC_BUSINESS_ADDRESS),
  /** International format, digits only or with +, e.g. +2010xxxxxxxx. */
  supportWhatsapp: clean(process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP),

  /* ── policy defaults (owner-adjustable) ── */
  responseTime: {
    en: clean(process.env.NEXT_PUBLIC_RESPONSE_TIME_EN) ?? '1–2 business days',
    ar: clean(process.env.NEXT_PUBLIC_RESPONSE_TIME_AR) ?? 'يوم إلى يومَي عمل',
  } satisfies Localized,
  reviewWindow: {
    en: clean(process.env.NEXT_PUBLIC_REVIEW_WINDOW_EN) ?? '24 hours',
    ar: clean(process.env.NEXT_PUBLIC_REVIEW_WINDOW_AR) ?? '٢٤ ساعة',
  } satisfies Localized,
  refundWindow: {
    en: `${refundDays} days`,
    ar: `${arNum(refundDays)} أيام`,
  } satisfies Localized,
  refundProcessing: {
    en: clean(process.env.NEXT_PUBLIC_REFUND_PROCESSING_EN) ?? '5–7 business days',
    ar: clean(process.env.NEXT_PUBLIC_REFUND_PROCESSING_AR) ?? '٥ إلى ٧ أيام عمل',
  } satisfies Localized,
  governingLaw: {
    en: clean(process.env.NEXT_PUBLIC_GOVERNING_LAW_EN) ?? 'the Arab Republic of Egypt',
    ar: clean(process.env.NEXT_PUBLIC_GOVERNING_LAW_AR) ?? 'جمهورية مصر العربية',
  } satisfies Localized,
} as const;

/** Who "we" are in legal copy: the legal entity if configured, else the brand. */
export function operatorName(): string {
  return site.companyName ?? site.brand;
}

/** wa.me link for the support WhatsApp number, or null when unset/invalid. */
export function supportWhatsappHref(): string | null {
  const digits = (site.supportWhatsapp ?? '').replace(/\D/g, '');
  return digits.length >= 8 ? `https://wa.me/${digits}` : null;
}

/**
 * True once the details a legal page actually depends on are real. Until then
 * the legal pages keep their "draft — review before launch" notice, because
 * the policies have no reachable operator behind them.
 */
export function legalDetailsComplete(): boolean {
  return Boolean(site.companyName && site.supportEmail && site.businessAddress);
}

/* ─────────────────────────── metadata helpers ─────────────────────────── */

export type SiteLocale = 'ar' | 'en';

/**
 * Canonical + hreflang for a locale-prefixed path ('' for home, '/templates'…).
 *
 * Arabic is the default locale (see i18n/routing), so x-default points there.
 * Paths are relative; the locale layout sets `metadataBase` to the origin.
 */
export function localeAlternates(locale: SiteLocale, path: string) {
  return {
    canonical: `/${locale}${path}`,
    languages: {
      ar: `/ar${path}`,
      en: `/en${path}`,
      'x-default': `/ar${path}`,
    },
  };
}

/**
 * Standard metadata for an indexable marketing page. A page that sets its own
 * `openGraph` replaces the layout's whole object (Next merges metadata one
 * level deep), so this rebuilds it fully rather than patching title only.
 */
export function marketingMetadata({
  locale,
  path,
  title,
  description,
}: {
  locale: SiteLocale;
  path: string;
  title: string;
  description: string;
}) {
  // Stable, locale-prefixed share card (app/[locale]/(marketing)/og/route.tsx).
  // Listed explicitly because a page-level `openGraph` drops inherited images.
  const image = {
    url: `/${locale}/og`,
    width: 1200,
    height: 630,
    alt: 'Congrats — Animated greeting cards & wedding invitations',
  };
  return {
    title,
    description,
    alternates: localeAlternates(locale, path),
    openGraph: {
      type: 'website' as const,
      siteName: site.brand,
      title,
      description,
      url: `/${locale}${path}`,
      locale: locale === 'ar' ? 'ar_EG' : 'en_US',
      alternateLocale: locale === 'ar' ? 'en_US' : 'ar_EG',
      images: [image],
    },
    twitter: { card: 'summary_large_image' as const, title, description, images: [image.url] },
  };
}
