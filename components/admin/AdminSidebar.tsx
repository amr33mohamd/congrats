'use client';

/**
 * Admin shell sidebar: brand, locale-aware nav with active highlighting,
 * signed-in admin identity, logout + view-site links. Collapses to a top
 * bar with a slide-down menu on mobile. RTL-safe via logical properties.
 */
import * as React from 'react';
import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';
import { cn } from '@/components/ui';

interface NavItem {
  href: string;
  key: 'overview' | 'queue' | 'templates' | 'categories' | 'pricing' | 'users' | 'audit';
  icon: string;
}

const NAV: NavItem[] = [
  { href: '/admin', key: 'overview', icon: '◳' },
  { href: '/admin/queue', key: 'queue', icon: '✓' },
  { href: '/admin/templates', key: 'templates', icon: '▤' },
  { href: '/admin/categories', key: 'categories', icon: '☰' },
  { href: '/admin/pricing', key: 'pricing', icon: '₤' },
  { href: '/admin/users', key: 'users', icon: '◍' },
  { href: '/admin/audit', key: 'audit', icon: '⎙' },
];

export function AdminSidebar({
  email,
  role,
  onLogout,
}: {
  email: string;
  role: string | null;
  onLogout: React.ReactNode;
}) {
  const t = useTranslations('admin');
  const pathname = usePathname(); // locale-stripped path, e.g. /admin/queue
  const [openMobile, setOpenMobile] = React.useState(false);

  const isActive = (href: string) =>
    href === '/admin' ? pathname === '/admin' : pathname.startsWith(href);

  const links = (
    <nav className="flex flex-col gap-token-1">
      {NAV.map((item) => {
        const active = isActive(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setOpenMobile(false)}
            className={cn(
              'flex items-center gap-token-3 rounded-md px-token-3 py-token-2 text-sm font-medium transition-colors',
              active
                ? 'bg-brand text-white shadow-[var(--shadow-card)]'
                : 'text-ink hover:bg-surface-2',
            )}
          >
            <span aria-hidden className="w-5 text-center text-base opacity-80">
              {item.icon}
            </span>
            {t(`nav.${item.key}`)}
          </Link>
        );
      })}
    </nav>
  );

  const identity = (
    <div className="border-t border-border pt-token-4">
      <p className="truncate text-xs text-muted">{t('shell.signedInAs')}</p>
      <p className="truncate text-sm font-medium text-ink" title={email}>
        {email}
      </p>
      {role ? (
        <p className="mt-token-1 text-xs uppercase tracking-wide text-brand-strong">{role}</p>
      ) : null}
      <div className="mt-token-3 flex flex-col gap-token-2">
        <Link
          href="/dashboard"
          className="text-sm text-muted underline-offset-2 hover:text-ink hover:underline"
        >
          {t('shell.viewSite')}
        </Link>
        {onLogout}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-[100dvh] w-64 shrink-0 flex-col border-e border-border bg-surface px-token-4 py-token-6 md:flex">
        <div className="mb-token-6">
          <p className="font-heading text-lg font-bold text-ink">{t('shell.title')}</p>
          <p className="text-xs text-muted">{t('shell.subtitle')}</p>
        </div>
        <div className="flex-1">{links}</div>
        {identity}
      </aside>

      {/* Mobile top bar */}
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-surface px-token-4 py-token-3 md:hidden">
        <p className="font-heading text-base font-bold text-ink">{t('shell.title')}</p>
        <button
          type="button"
          aria-label={t('shell.menu')}
          aria-expanded={openMobile}
          onClick={() => setOpenMobile((v) => !v)}
          className="rounded-md border border-border px-token-3 py-token-1 text-ink"
        >
          ☰
        </button>
      </div>
      {openMobile ? (
        <div className="sticky top-[3.25rem] z-20 border-b border-border bg-surface px-token-4 py-token-4 md:hidden">
          {links}
          <div className="mt-token-4">{identity}</div>
        </div>
      ) : null}
    </>
  );
}
