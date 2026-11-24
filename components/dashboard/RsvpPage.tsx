'use client';

import * as React from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Button, Spinner, Card } from '@/components/ui';
import { dashboardApi, ApiError } from './api-client';
import type { RsvpSummary } from './types';

/**
 * A full page of one card's RSVP replies, reached from "الردود" in كروتي. The
 * same data the dialog showed, but a page the couple can open, refresh and
 * share with family — the totals they plan around, then every reply.
 */
export function RsvpPage({ experienceId }: { experienceId: string }) {
  const t = useTranslations('dashboard.rsvps');
  const td = useTranslations('dashboard');
  const locale = useLocale();
  const [data, setData] = React.useState<RsvpSummary | null>(null);
  const [state, setState] = React.useState<'loading' | 'ready' | 'notFound' | 'failed'>('loading');

  const load = React.useCallback(() => {
    setState('loading');
    dashboardApi
      .listRsvps(experienceId)
      .then((d) => {
        setData(d);
        setState('ready');
      })
      .catch((e) => setState(e instanceof ApiError && e.status === 404 ? 'notFound' : 'failed'));
  }, [experienceId]);

  React.useEffect(() => load(), [load]);

  const when = (iso: string) =>
    new Date(iso).toLocaleString(locale === 'ar' ? 'ar-EG' : 'en-GB', { dateStyle: 'medium', timeStyle: 'short' });

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-token-5">
      <div className="flex items-center justify-between gap-token-3">
        <div>
          <h1 className="font-heading text-xl font-bold text-ink">{t('title')}</h1>
          <p className="mt-token-1 text-sm text-muted">{t('subtitle')}</p>
        </div>
        <Link href="/dashboard">
          <Button variant="ghost" size="sm">
            {td('order.backToDashboard')}
          </Button>
        </Link>
      </div>

      {state === 'loading' ? (
        <div className="flex justify-center py-24">
          <Spinner size={28} />
        </div>
      ) : state === 'notFound' ? (
        <Card className="p-token-8 text-center text-muted">{td('errors.notFound')}</Card>
      ) : state === 'failed' ? (
        <Card className="flex flex-col items-center gap-token-4 p-token-8 text-center text-muted">
          {t('failed')}
          <Button variant="secondary" size="sm" onClick={load}>
            {t('retry')}
          </Button>
        </Card>
      ) : data ? (
        <>
          <div className="grid grid-cols-3 gap-token-3 text-center">
            {[
              [t('attending'), data.attending],
              [t('declined'), data.declined],
              [t('guests'), data.guests],
            ].map(([label, n]) => (
              <Card key={label as string} className="px-token-3 py-token-4">
                <div className="font-heading text-3xl font-bold text-ink">{n}</div>
                <div className="mt-token-1 text-xs text-muted">{label}</div>
              </Card>
            ))}
          </div>

          {data.replies.length === 0 ? (
            <Card className="p-token-8 text-center text-sm text-muted">{t('empty')}</Card>
          ) : (
            <div className="flex flex-col gap-token-3">
              {data.replies.map((r) => (
                <Card key={r.id} className="flex flex-col gap-token-2 p-token-4">
                  <div className="flex items-center justify-between gap-token-3">
                    <span className="truncate font-heading font-semibold text-ink">{r.name}</span>
                    <span
                      className={`shrink-0 rounded-full px-token-3 py-token-1 text-xs font-medium ${
                        r.attending ? 'bg-success/10 text-success' : 'bg-surface-2 text-muted'
                      }`}
                    >
                      {r.attending ? `${t('coming')} · ${t('people', { count: r.guests })}` : t('notComing')}
                    </span>
                  </div>
                  {r.note ? <p className="text-sm text-muted">{r.note}</p> : null}
                  <span className="text-xs text-muted">{when(r.createdAt)}</span>
                </Card>
              ))}
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}
