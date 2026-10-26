/** Pure formatters usable from server and client components alike. */

/** Format integer piastres → localized EGP string (1 EGP = 100 piastres). */
export function formatPiastres(piastres: number | null | undefined, locale: string): string {
  const value = (piastres ?? 0) / 100;
  try {
    return new Intl.NumberFormat(locale === 'ar' ? 'ar-EG' : 'en-EG', {
      style: 'currency',
      currency: 'EGP',
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${value.toFixed(2)} EGP`;
  }
}
