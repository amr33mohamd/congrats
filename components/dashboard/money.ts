/** Format integer piastres as a localized EGP price. 1 EGP = 100 piastres. */
export function formatEgp(piastres: number, locale: 'ar' | 'en'): string {
  const egp = piastres / 100;
  const formatted = new Intl.NumberFormat(locale === 'ar' ? 'ar-EG' : 'en-EG', {
    minimumFractionDigits: egp % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(egp);
  return locale === 'ar' ? `${formatted} جنيه` : `${formatted} EGP`;
}
