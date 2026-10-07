import { getLocale, getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { CATALOG_CATEGORIES } from '@/content/templates/categories';
import { supportWhatsappHref } from '@/lib/site';
import { WhatsAppButton } from './WhatsAppButton';

/**
 * Home-page sections. Linked as `/#id` (not a bare `#id`) because the footer
 * also renders on the gallery and legal pages, where a bare hash went nowhere.
 */
const sections = [
  { id: 'invitations', key: 'invitations' },
  { id: 'how', key: 'how' },
  { id: 'pricing', key: 'pricing' },
  { id: 'faq', key: 'faq' },
] as const;

const linkCls = 'text-muted transition-colors hover:text-ink';

export async function SiteFooter() {
  const t = await getTranslations('marketing');
  const locale = await getLocale();
  const isAr = locale === 'ar';
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-token-8 px-token-4 py-token-8 md:grid-cols-5">
        <div className="col-span-2 md:col-span-1">
          <div className="flex items-center gap-2 font-heading text-xl font-bold text-ink">
            <span aria-hidden className="text-2xl">🎉</span>
            Congrats
          </div>
          <p className="mt-token-3 max-w-xs text-sm text-muted">{t('footer.tagline')}</p>
        </div>

        <div>
          <h3 className="font-heading text-sm font-semibold text-ink">{t('footer.links')}</h3>
          <ul className="mt-token-3 flex flex-col gap-token-2 text-sm">
            <li>
              <Link href="/templates" className={linkCls}>
                {t('footer.templates')}
              </Link>
            </li>
            <li>
              <Link href="/products" className={linkCls}>
                {t('footer.products')}
              </Link>
            </li>
            <li>
              <Link href="/start" className={linkCls}>
                {t('nav.quiz')}
              </Link>
            </li>
            {sections.map((s) => (
              <li key={s.id}>
                <Link href={{ pathname: '/', hash: s.id }} className={linkCls}>
                  {t(`nav.${s.key}`)}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="md:col-span-2">
          <h3 className="font-heading text-sm font-semibold text-ink">{t('footer.occasionsTitle')}</h3>
          <ul className="mt-token-3 grid grid-cols-1 gap-token-2 text-sm sm:grid-cols-2">
            {CATALOG_CATEGORIES.map((c) => (
              <li key={c.slug}>
                <Link href={`/templates/${c.slug}`} className={linkCls}>
                  {isAr ? c.nameAr : c.nameEn}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="font-heading text-sm font-semibold text-ink">{t('footer.legal')}</h3>
          <ul className="mt-token-3 flex flex-col gap-token-2 text-sm">
            {(['privacy', 'terms', 'refunds', 'contact'] as const).map((p) => (
              <li key={p}>
                <Link href={`/${p}`} className={linkCls}>
                  {t(`footer.${p}`)}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-token-3 px-token-4 py-token-4 text-xs text-muted sm:flex-row">
          <span>
            © {year} Congrats. {t('footer.rights')} · {t('footer.made')}
          </span>
          <Link
            href="/dashboard"
            className="rounded-pill bg-brand px-token-4 py-token-2 text-sm font-semibold text-white transition-colors hover:bg-brand-hover"
          >
            {t('nav.start')}
          </Link>
        </div>
      </div>
      <WhatsAppButton href={supportWhatsappHref()} locale={locale} />
    </footer>
  );
}
