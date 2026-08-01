'use client';

/**
 * Overview dashboard. Fetches the admin list endpoints to surface live counts:
 * orders awaiting review, templates, users, categories.
 */
import * as React from 'react';
import { useTranslations } from 'next-intl';
import { Card } from '@/components/ui';
import { Link } from '@/i18n/navigation';
import { PageHeader } from './primitives';
import { apiFetch, asList } from './lib';

interface Counts {
  queue: number | null;
  templates: number | null;
  users: number | null;
  categories: number | null;
}

export function OverviewClient() {
  const t = useTranslations('admin');
  const [counts, setCounts] = React.useState<Counts>({
    queue: null,
    templates: null,
    users: null,
    categories: null,
  });

  React.useEffect(() => {
    let alive = true;
    const load = async (url: string, key?: string) => {
      try {
        const res = await apiFetch(url);
        return asList(res, key).length;
      } catch {
        return null;
      }
    };
    Promise.all([
      load('/api/admin/orders?status=submitted', 'orders'),
      load('/api/admin/templates', 'templates'),
      load('/api/admin/users', 'users'),
      load('/api/admin/categories', 'categories'),
    ]).then(([queue, templates, users, categories]) => {
      if (alive) setCounts({ queue, templates, users, categories });
    });
    return () => {
      alive = false;
    };
  }, []);

  const stats: { label: string; value: number | null; href: string; accent?: boolean }[] = [
    { label: t('overview.pendingReview'), value: counts.queue, href: '/admin/queue', accent: true },
    { label: t('overview.templatesCount'), value: counts.templates, href: '/admin/templates' },
    { label: t('overview.usersCount'), value: counts.users, href: '/admin/users' },
    { label: t('overview.categoriesCount'), value: counts.categories, href: '/admin/categories' },
  ];

  return (
    <div>
      <PageHeader title={t('overview.title')} subtitle={t('overview.subtitle')} />
      <div className="grid grid-cols-2 gap-token-4 lg:grid-cols-4">
        {stats.map((s) => (
          <Link key={s.href} href={s.href} className="block">
            <Card
              className={
                s.accent && s.value
                  ? 'border-brand/30 transition-colors hover:border-brand'
                  : 'transition-colors hover:border-brand/40'
              }
            >
              <p className="text-sm text-muted">{s.label}</p>
              <p className="mt-token-2 font-heading text-3xl font-bold text-ink">
                {s.value ?? '—'}
              </p>
            </Card>
          </Link>
        ))}
      </div>

      <div className="mt-token-8">
        <h2 className="mb-token-3 font-heading text-lg font-semibold text-ink">
          {t('overview.quickLinks')}
        </h2>
        <Link
          href="/admin/queue"
          className="inline-flex items-center gap-token-2 rounded-pill bg-brand px-token-6 py-token-3 text-sm font-medium text-white shadow-[var(--shadow-card)] transition-colors hover:bg-brand-strong"
        >
          {t('overview.goToQueue')} →
        </Link>
      </div>
    </div>
  );
}
