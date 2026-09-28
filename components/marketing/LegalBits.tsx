import { Link } from '@/i18n/navigation';
import { site, supportWhatsappHref } from '@/lib/site';

/**
 * Small building blocks the legal pages share, so a detail the owner has not
 * configured yet disappears cleanly instead of printing a "[placeholder]".
 */

type L = { locale: 'ar' | 'en' };

/**
 * "Congrats" as the subject of a legal sentence — with the legal entity named
 * alongside it once one is configured.
 */
export function Operator({ locale }: L) {
  if (!site.companyName) return <strong>{site.brand}</strong>;
  return locale === 'ar' ? (
    <>
      <strong>{site.companyName}</strong> (&laquo;{site.brand}&raquo;، &laquo;نحن&raquo;)
    </>
  ) : (
    <>
      <strong>{site.companyName}</strong> (&ldquo;{site.brand},&rdquo; &ldquo;we,&rdquo; &ldquo;us&rdquo;)
    </>
  );
}

/** The legal entity's name if configured, otherwise the brand. */
export function OwnerName() {
  return <strong>{site.companyName ?? site.brand}</strong>;
}

/**
 * The best way to reach support, inline: email first, then WhatsApp, and
 * finally the contact page — so every "contact us at …" sentence always ends
 * somewhere real.
 */
export function SupportContact({ locale }: L) {
  if (site.supportEmail) {
    return <a href={`mailto:${site.supportEmail}`}>{site.supportEmail}</a>;
  }
  const wa = supportWhatsappHref();
  if (wa) {
    return (
      <a href={wa} target="_blank" rel="noopener noreferrer">
        {locale === 'ar' ? 'واتساب' : 'WhatsApp'}
      </a>
    );
  }
  return <Link href="/contact">{locale === 'ar' ? 'صفحة التواصل' : 'our contact page'}</Link>;
}

/** ", or write to us at <address>" — rendered only when an address is set. */
export function PostalClause({ locale }: L) {
  if (!site.businessAddress) return null;
  return locale === 'ar' ? (
    <>، أو عبر العنوان: {site.businessAddress}</>
  ) : (
    <>, or write to us at {site.businessAddress}</>
  );
}
