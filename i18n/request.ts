/**
 * next-intl request config. NAMESPACED MESSAGES: each locale's messages are
 * split into per-team namespace files merged here under their namespace key:
 *
 *   messages/<locale>/common.json     → t('common.*')   (owned by F0)
 *   messages/<locale>/marketing.json  → t('marketing.*')(owned by D1)
 *   messages/<locale>/dashboard.json  → t('dashboard.*')(owned by D1)
 *   messages/<locale>/admin.json      → t('admin.*')    (owned by D2)
 *
 * RULE: no two teams edit the same JSON file. Missing namespace files are
 * tolerated (so the app builds before D1/D2 add theirs).
 */
import { getRequestConfig } from 'next-intl/server';
import type { AbstractIntlMessages } from 'next-intl';
import { routing } from './routing';

const NAMESPACES = ['common', 'marketing', 'dashboard', 'admin', 'auth', 'quiz', 'products'] as const;

async function loadNamespace(locale: string, ns: string): Promise<AbstractIntlMessages> {
  try {
    const mod = await import(`../messages/${locale}/${ns}.json`);
    return (mod.default ?? mod) as AbstractIntlMessages;
  } catch {
    // Namespace not authored yet — skip gracefully.
    return {};
  }
}

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale =
    requested && routing.locales.includes(requested as (typeof routing.locales)[number])
      ? requested
      : routing.defaultLocale;

  const entries = await Promise.all(
    NAMESPACES.map(async (ns) => [ns, await loadNamespace(locale, ns)] as const),
  );

  return {
    locale,
    messages: Object.fromEntries(entries) as AbstractIntlMessages,
  };
});
