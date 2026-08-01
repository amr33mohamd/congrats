import type { ReactNode } from 'react';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { Link, redirect } from '@/i18n/navigation';
import { getSession } from '@/lib/auth';

export default async function DashboardLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  // Auth gate: dashboard requires a signed-in user (F0 owns auth; reviewer wires
  // the gate here so all (dashboard) routes redirect anonymous users to /login).
  const session = await getSession();
  if (!session) redirect({ href: '/login', locale });

  const t = await getTranslations('dashboard.nav');
  const tc = await getTranslations('common');

  return (
    <div className="flex min-h-[100dvh] flex-col bg-surface-2">
      <header className="sticky top-0 z-30 border-b border-border bg-surface/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-token-4 px-token-4">
          <Link href="/" className="flex items-center gap-2 font-heading text-lg font-bold text-ink">
            <span aria-hidden className="text-xl">🎉</span>
            Congrats
          </Link>
          <nav className="flex items-center gap-token-3" aria-label="Dashboard">
            <Link
              href="/dashboard"
              className="text-sm font-medium text-muted transition-colors hover:text-ink"
            >
              {t('experiences')}
            </Link>
            <Link
              href="/profile"
              className="text-sm font-medium text-muted transition-colors hover:text-ink"
            >
              {tc('profile.menu')}
            </Link>
            <Link
              href="/"
              className="hidden text-sm font-medium text-muted transition-colors hover:text-ink sm:inline"
            >
              {t('backToSite')}
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-token-4 py-token-8">{children}</main>
      <footer className="border-t border-border py-token-4 text-center text-xs text-muted">
        Congrats · {tc('app.tagline')}
      </footer>
    </div>
  );
}
