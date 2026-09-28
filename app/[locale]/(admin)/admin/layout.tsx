import type { ReactNode } from 'react';
import { setRequestLocale } from 'next-intl/server';
import { redirect } from '@/i18n/navigation';
import { getSession } from '@/lib/auth';
import { getDb } from '@/db';
import { hasAdminRow } from '@/server/db-context';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { LogoutButton } from './LogoutButton';

/**
 * Admin shell — auth-gated layout. Only admins may pass; everyone else is
 * redirected to /login. Renders a persistent sidebar + the page content.
 * NOTE: the outer [locale]/layout already provides <html>/<body>; this layout
 * only emits the in-page shell.
 */
export default async function AdminLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await getSession();
  if (!session) redirect({ href: '/login', locale });
  if (!session!.isAdmin) redirect({ href: '/dashboard', locale });
  // The JWT's admin flag can be stale (role revoked after sign-in); the DB is
  // the source of truth. The admin APIs enforce the same check.
  if (!(await hasAdminRow(await getDb(), session!.id))) redirect({ href: '/dashboard', locale });

  return (
    <div className="flex min-h-[100dvh] flex-col bg-surface-2 md:flex-row">
      <AdminSidebar
        email={session!.email}
        role={session!.role}
        onLogout={<LogoutButton />}
      />
      <main className="min-w-0 flex-1 px-token-4 py-token-6 md:px-token-8">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
    </div>
  );
}
