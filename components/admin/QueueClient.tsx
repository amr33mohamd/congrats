'use client';

/**
 * Payment approval queue. Lists submitted orders oldest-first and opens the
 * review drawer. Consumes GET /api/admin/orders?status=submitted.
 */
import * as React from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Button } from '@/components/ui';
import {
  PageHeader,
  LoadingState,
  ErrorState,
  EmptyState,
  Table,
  THead,
  TH,
  TBody,
  TR,
  TD,
  OrderStatusBadge,
} from './primitives';
import { ReviewDrawer } from './ReviewDrawer';
import { useApi, asList, formatPiastres, formatDate } from './lib';
import type { OrderRow } from './types';

function templateTitle(o: OrderRow, locale: string): string {
  const ar = o.templateTitleAr;
  const en = o.templateTitleEn;
  return (locale === 'ar' ? ar || en : en || ar) || o.experienceTitle || '—';
}

export function QueueClient() {
  const t = useTranslations('admin');
  const locale = useLocale();
  const { data, loading, error, reload } = useApi<unknown>(
    '/api/admin/orders?status=submitted',
  );
  const [active, setActive] = React.useState<OrderRow | null>(null);

  const orders = React.useMemo(() => {
    const list = asList<OrderRow>(data, 'orders');
    // Oldest-first by createdAt.
    return [...list].sort((a, b) => {
      const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return ta - tb;
    });
  }, [data]);

  return (
    <div>
      <PageHeader
        title={t('queue.title')}
        subtitle={t('queue.subtitle')}
        actions={
          <Button variant="secondary" size="sm" onClick={reload}>
            ↻ {t('common.refresh')}
          </Button>
        }
      />

      {loading ? (
        <LoadingState label={t('common.loading')} />
      ) : error ? (
        <ErrorState label={t('common.error')} onRetry={reload} />
      ) : orders.length === 0 ? (
        <EmptyState label={t('queue.empty')} />
      ) : (
        <Table>
          <THead>
            <TH>{t('queue.colRef')}</TH>
            <TH>{t('queue.colRecipient')}</TH>
            <TH>{t('queue.colTemplate')}</TH>
            <TH>{t('queue.colAmount')}</TH>
            <TH>{t('queue.colPaymentRef')}</TH>
            <TH>{t('queue.colSubmitted')}</TH>
            <TH />
          </THead>
          <TBody>
            {orders.map((o) => (
              <TR key={o.id} onClick={() => setActive(o)}>
                <TD className="font-mono text-xs font-semibold">{o.orderRef}</TD>
                <TD>{o.recipientName ?? '—'}</TD>
                <TD className="max-w-[14rem] truncate">{templateTitle(o, locale)}</TD>
                <TD>{formatPiastres(o.amountPiastres, locale)}</TD>
                <TD className="font-mono text-xs">{o.paymentRef ?? '—'}</TD>
                <TD className="whitespace-nowrap text-xs text-muted">
                  {formatDate(o.createdAt, locale)}
                </TD>
                <TD>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActive(o);
                    }}
                  >
                    {t('queue.review')}
                  </Button>
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      )}

      <ReviewDrawer
        order={active}
        open={active !== null}
        onClose={() => setActive(null)}
        onResolved={reload}
      />
    </div>
  );
}
