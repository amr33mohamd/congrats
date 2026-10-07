'use client';

import * as React from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';
import { cn } from '@/components/ui/cn';

const sections = [
  { id: 'invitations', key: 'invitations' },
  { id: 'how', key: 'how' },
  { id: 'pricing', key: 'pricing' },
  { id: 'faq', key: 'faq' },
] as const;

// Primary CTAs are styled links rather than <Link><Button>, which nests a
// button inside an anchor (invalid HTML, two tab stops for one action).
const PRIMARY_SM = 'h-9 items-center justify-center rounded-pill bg-brand px-3 text-sm font-medium text-white shadow-[var(--shadow-card)] transition-colors hover:bg-brand-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2';
const PRIMARY_FULL = 'mt-token-2 inline-flex h-11 w-full items-center justify-center rounded-pill bg-brand px-5 text-base font-medium text-white transition-colors hover:bg-brand-hover';

export function SiteHeader({
  isAuthed = false,
  overDark = false,
}: {
  isAuthed?: boolean;
  /** True when the header floats over a dark hero — it then inverts until scroll. */
  overDark?: boolean;
}) {
  const t = useTranslations('marketing.nav');
  const tc = useTranslations('common.nav');
  const locale = useLocale();
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);
  const [scrolled, setScrolled] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const otherLocale = locale === 'ar' ? 'en' : 'ar';
  // Section links are home-page anchors. Elsewhere (gallery, legal pages) a
  // bare `#id` scrolls nowhere, so route back to home with the hash instead.
  const onHome = pathname === '/';
  const sectionHref = (id: string) => (onHome ? `#${id}` : { pathname: '/', hash: id });
  // Over the hero the bar is transparent on near-black, so everything in it has
  // to flip to white; once the page scrolls it lands on the light surface again.
  const onDark = overDark && !scrolled;

  return (
    <header
      className={cn(
        'top-0 z-40 w-full transition-colors',
        // Over a dark hero the bar has to leave the flow entirely, otherwise
        // `sticky` reserves 4rem of layout and the hero can never reach the top.
        overDark ? 'fixed' : 'sticky',
        scrolled
          ? 'border-b border-border bg-surface/90 backdrop-blur'
          : 'bg-transparent',
      )}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-token-4 px-token-4">
        <Link
          href="/"
          className={cn(
            'flex items-center gap-2 font-heading text-xl font-bold transition-colors',
            onDark ? 'text-white' : 'text-ink',
          )}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- static SVG brand mark */}
          <img src="/brand/logomark.svg" alt="" aria-hidden width={28} height={28} className="h-7 w-7" />
          Congrats
        </Link>

        <nav className="hidden items-center gap-token-6 md:flex" aria-label={t('primaryLabel')}>
          <Link
            href="/templates"
            className={cn(
              'text-sm font-medium transition-colors',
              onDark ? 'text-white/75 hover:text-white' : 'text-muted hover:text-ink',
            )}
          >
            {t('templates')}
          </Link>
          {sections.map((s) => (
            <Link
              key={s.id}
              href={sectionHref(s.id)}
              className={cn(
                'text-sm font-medium transition-colors',
                onDark ? 'text-white/75 hover:text-white' : 'text-muted hover:text-ink',
              )}
            >
              {t(s.key)}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-token-2">
          <Link
            href={pathname}
            locale={otherLocale}
            className={cn(
              'rounded-pill px-token-3 py-token-1 text-sm font-semibold transition-colors',
              onDark
                ? 'text-white/80 hover:bg-white/15 hover:text-white'
                : 'text-muted hover:bg-surface-2 hover:text-ink',
            )}
            aria-label={otherLocale === 'ar' ? 'التبديل إلى العربية' : 'Switch to English'}
          >
            {otherLocale === 'ar' ? 'ع' : 'EN'}
          </Link>
          {isAuthed ? (
            <Link href="/dashboard" className={cn('hidden sm:inline-flex', PRIMARY_SM)}>
              {tc('dashboard')}
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className={cn(
                  'hidden rounded-pill px-token-3 py-token-2 text-sm font-semibold transition-colors sm:block',
                  onDark ? 'text-white hover:bg-white/15' : 'text-ink hover:bg-surface-2',
                )}
              >
                {tc('login')}
              </Link>
              <Link href="/login" className={cn('hidden sm:inline-flex', PRIMARY_SM)}>
                {t('start')}
              </Link>
            </>
          )}
          <button
            type="button"
            className={cn(
              'inline-flex h-10 w-10 items-center justify-center rounded-md transition-colors md:hidden',
              onDark ? 'text-white' : 'text-ink',
            )}
            aria-label={locale === 'ar' ? 'القائمة' : 'Menu'}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            <span aria-hidden className="text-xl">{open ? '✕' : '☰'}</span>
          </button>
        </div>
      </div>

      {open ? (
        <div className="border-t border-border bg-surface px-token-4 py-token-4 md:hidden">
          <nav className="flex flex-col gap-token-1" aria-label={t('mobileLabel')}>
            <Link
              href="/templates"
              onClick={() => setOpen(false)}
              className="rounded-md px-token-3 py-token-2 text-base font-medium text-ink hover:bg-surface-2"
            >
              {t('templates')}
            </Link>
            {sections.map((s) => (
              <Link
                key={s.id}
                href={sectionHref(s.id)}
                onClick={() => setOpen(false)}
                className="rounded-md px-token-3 py-token-2 text-base font-medium text-ink hover:bg-surface-2"
              >
                {t(s.key)}
              </Link>
            ))}
            {isAuthed ? (
              <Link href="/dashboard" onClick={() => setOpen(false)} className={PRIMARY_FULL}>
                {tc('dashboard')}
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="rounded-md px-token-3 py-token-2 text-base font-medium text-ink hover:bg-surface-2"
                >
                  {tc('login')}
                </Link>
                <Link href="/login" onClick={() => setOpen(false)} className={PRIMARY_FULL}>
                  {t('start')}
                </Link>
              </>
            )}
          </nav>
        </div>
      ) : null}
    </header>
  );
}
