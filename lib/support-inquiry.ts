/**
 * The "Got a question? WhatsApp us" message quotes the page the visitor was
 * on, so the owner can answer without asking "which one?".
 */

/** Absolute URL of a local path on the site, for quoting it in the message. */
export function absolutePageUrl(siteUrl: string, locale: string, path: string): string {
  const origin = siteUrl.replace(/\/$/, '');
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${origin}/${locale}${p === '/' ? '' : p}`;
}
