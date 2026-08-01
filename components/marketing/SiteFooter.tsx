import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';

const links = [
  { id: 'occasions', key: 'occasions' },
  { id: 'how', key: 'how' },
  { id: 'pricing', key: 'pricing' },
  { id: 'faq', key: 'faq' },
] as const;

export async function SiteFooter() {
  const t = await getTranslations('marketing');
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto grid max-w-6xl gap-token-8 px-token-4 py-token-8 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-2 font-heading text-xl font-bold text-ink">
            <span aria-hidden className="text-2xl">🎉</span>
            Congrats
          </div>
          <p className="mt-token-3 max-w-xs text-sm text-muted">{t('footer.tagline')}</p>
        </div>

        <div>
          <h3 className="font-heading text-sm font-semibold text-ink">{t('footer.links')}</h3>
          <ul className="mt-token-3 flex flex-col gap-token-2 text-sm">
            {links.map((l) => (
              <li key={l.id}>
                <a href={`#${l.id}`} className="text-muted transition-colors hover:text-ink">
                  {t(`nav.${l.key}`)}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="font-heading text-sm font-semibold text-ink">{t('footer.legal')}</h3>
          <ul className="mt-token-3 flex flex-col gap-token-2 text-sm">
            {(['privacy', 'terms', 'refunds', 'contact'] as const).map((p) => (
              <li key={p}>
                <Link href={`/${p}`} className="text-muted transition-colors hover:text-ink">
                  {t(`footer.${p}`)}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="md:text-end">
          <Link href="/dashboard">
            <span className="inline-flex items-center gap-2 rounded-pill bg-brand px-token-4 py-token-2 text-sm font-semibold text-white shadow-[var(--shadow-card)] transition-colors hover:bg-brand-strong">
              {t('nav.start')}
            </span>
          </Link>
          <p className="mt-token-4 text-sm text-muted">{t('footer.made')}</p>
        </div>
      </div>
      <div className="border-t border-border py-token-4 text-center text-xs text-muted">
        © {year} Congrats. {t('footer.rights')}
      </div>
    </footer>
  );
}
