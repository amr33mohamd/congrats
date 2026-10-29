'use client';

import * as React from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Dialog, Button, Spinner } from '@/components/ui';
import { dashboardApi } from './api-client';
import type { RsvpSummary } from './types';

/** The guests' replies to one card, with the totals the couple plans around. */
export function RsvpDialog({ experienceId, onClose }: { experienceId: string | null; onClose: () => void }) {
  const t = useTranslations('dashboard.rsvps');
  const locale = useLocale();
  const [data, setData] = React.useState<RsvpSummary | null>(null);
  const [failed, setFailed] = React.useState(false);

  React.useEffect(() => {
    if (!experienceId) return;
    setData(null);
    setFailed(false);
    dashboardApi
      .listRsvps(experienceId)
      .then(setData)
      .catch(() => setFailed(true));
  }, [experienceId]);

  const when = (iso: string) =>
    new Date(iso).toLocaleString(locale === 'ar' ? 'ar-EG' : 'en-GB', { dateStyle: 'medium', timeStyle: 'short' });

  return (
    <Dialog open={Boolean(experienceId)} onClose={onClose} title={t('title')}>
      {failed ? (
        <p className="text-sm text-danger">{t('failed')}</p>
      ) : !data ? (
        <div className="flex justify-center py-token-6">
          <Spinner size={24} />
        </div>
      ) : (
        <div className="flex flex-col gap-token-4">
          <div className="grid grid-cols-3 gap-token-2 text-center">
            {[
              [t('attending'), data.attending],
              [t('declined'), data.declined],
              [t('guests'), data.guests],
            ].map(([label, n]) => (
              <div key={label as string} className="rounded-md bg-surface-2 px-token-2 py-token-3">
                <div className="font-heading text-2xl font-bold text-ink">{n}</div>
                <div className="text-xs text-muted">{label}</div>
              </div>
            ))}
          </div>

          {data.replies.length === 0 ? (
            <p className="text-sm text-muted">{t('empty')}</p>
          ) : (
            <ul className="flex max-h-80 flex-col divide-y divide-border overflow-y-auto">
              {data.replies.map((r) => (
                <li key={r.id} className="flex flex-col gap-token-1 py-token-3">
                  <div className="flex items-center justify-between gap-token-2">
                    <span className="truncate font-semibold text-ink">{r.name}</span>
                    <span className={`shrink-0 text-sm font-medium ${r.attending ? 'text-success' : 'text-muted'}`}>
                      {r.attending ? `${t('coming')} · ${t('people', { count: r.guests })}` : t('notComing')}
                    </span>
                  </div>
                  {r.note ? <p className="text-sm text-muted">{r.note}</p> : null}
                  <span className="text-xs text-muted">{when(r.createdAt)}</span>
                </li>
              ))}
            </ul>
          )}

          <div className="flex justify-end">
            <Button variant="ghost" onClick={onClose}>
              {t('close')}
            </Button>
          </div>
        </div>
      )}
    </Dialog>
  );
}
