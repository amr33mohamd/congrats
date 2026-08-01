'use client';

import * as React from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';
import { Button } from '@/components/ui';
import { cn } from '@/components/ui/cn';

const sections = [
  { id: 'occasions', key: 'occasions' },
  { id: 'how', key: 'how' },
  { id: 'pricing', key: 'pricing' },
  { id: 'faq', key: 'faq' },
] as const;

export function SiteHeader({ isAuthed = false }: { isAuthed?: boolean }) {
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

  return (
    <header
      className={cn(
        'sticky top-0 z-40 w-full transition-colors',
        scrolled
          ? 'border-b border-border bg-surface/90 backdrop-blur'
          : 'bg-transparent',
      )}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-token-4 px-token-4">
        <Link href="/" className="flex items-center gap-2 font-heading text-xl font-bold text-ink">
          <span aria-hidden className="text-2xl">🎉</span>
          Congrats
        </Link>

        <nav className="hidden items-center gap-token-6 md:flex" aria-label="Primary">
          {sections.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className="text-sm font-medium text-muted transition-colors hover:text-ink"
            >
              {t(s.key)}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-token-2">
          <Link
            href={pathname}
            locale={otherLocale}
            className="rounded-pill px-token-3 py-token-1 text-sm font-semibold text-muted transition-colors hover:bg-surface-2 hover:text-ink"
            aria-label={otherLocale === 'ar' ? 'التبديل إلى العربية' : 'Switch to English'}
          >
            {otherLocale === 'ar' ? 'ع' : 'EN'}
          </Link>
          {isAuthed ? (
            <Link href="/dashboard" className="hidden sm:block">
              <Button size="sm" variant="primary">
                {tc('dashboard')}
              </Button>
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="hidden rounded-pill px-token-3 py-token-2 text-sm font-semibold text-ink transition-colors hover:bg-surface-2 sm:block"
              >
                {tc('login')}
              </Link>
              <Link href="/login" className="hidden sm:block">
                <Button size="sm" variant="primary">
                  {t('start')}
                </Button>
              </Link>
            </>
          )}
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-md text-ink md:hidden"
            aria-label="Menu"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            <span aria-hidden className="text-xl">{open ? '✕' : '☰'}</span>
          </button>
        </div>
      </div>

      {open ? (
        <div className="border-t border-border bg-surface px-token-4 py-token-4 md:hidden">
          <nav className="flex flex-col gap-token-1" aria-label="Mobile">
            {sections.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                onClick={() => setOpen(false)}
                className="rounded-md px-token-3 py-token-2 text-base font-medium text-ink hover:bg-surface-2"
              >
                {t(s.key)}
              </a>
            ))}
            {isAuthed ? (
              <Link href="/dashboard" onClick={() => setOpen(false)} className="mt-token-2">
                <Button className="w-full">{tc('dashboard')}</Button>
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
                <Link href="/login" onClick={() => setOpen(false)} className="mt-token-2">
                  <Button className="w-full">{t('start')}</Button>
                </Link>
              </>
            )}
          </nav>
        </div>
      ) : null}
    </header>
  );
}
