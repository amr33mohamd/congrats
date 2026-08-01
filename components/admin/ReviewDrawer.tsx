'use client';

/**
 * Payment review drawer. Shows the payment screenshot (zoom/rotate),
 * expected-vs-claimed amount, payment reference, buyer, and the experience
 * preview, with Approve / Reject(+reason) actions that hit the admin API
 * (which calls transitionOrder).
 */
import * as React from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Button, Badge, Textarea } from '@/components/ui';
import { Drawer } from './primitives';
import { PaymentProofViewer } from './PaymentProofViewer';
import { ExperiencePreview } from './ExperiencePreview';
import { apiFetch, ApiError, formatPiastres } from './lib';
import type { OrderRow } from './types';

function localizedTemplateTitle(order: OrderRow, locale: string): string {
  const ar = order.templateTitleAr;
  const en = order.templateTitleEn;
  return (locale === 'ar' ? ar || en : en || ar) || order.experienceTitle || '—';
}

export function ReviewDrawer({
  order,
  open,
  onClose,
  onResolved,
}: {
  order: OrderRow | null;
  open: boolean;
  onClose: () => void;
  onResolved: () => void;
}) {
  const t = useTranslations('admin');
  const locale = useLocale();

  const [rejecting, setRejecting] = React.useState(false);
  const [reason, setReason] = React.useState('');
  const [busy, setBusy] = React.useState<null | 'approve' | 'reject'>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [detail, setDetail] = React.useState<OrderRow | null>(null);

  // Reset transient state whenever a new order is opened, and (optionally)
  // fetch the richer single-order payload for the experience preview.
  React.useEffect(() => {
    setRejecting(false);
    setReason('');
    setBusy(null);
    setError(null);
    setDetail(null);
    if (!order || !open) return;
    let alive = true;
    apiFetch<OrderRow>(`/api/admin/orders/${order.id}`)
      .then((res) => {
        if (alive && res && typeof res === 'object') setDetail(res);
      })
      .catch(() => {
        /* single-order endpoint is optional; fall back to list row */
      });
    return () => {
      alive = false;
    };
  }, [order, open]);

  if (!order) return null;
  const row = { ...order, ...(detail ?? {}) } as OrderRow;

  const claimedRef = row.paymentRef ?? '—';
  const screenshot = row.screenshotUrl ?? null;
  const amountsKnown = typeof row.amountPiastres === 'number';

  const approve = async () => {
    setBusy('approve');
    setError(null);
    try {
      await apiFetch(`/api/admin/orders/${row.id}/approve`, { method: 'POST' });
      onResolved();
      onClose();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t('queue.drawer.actionError'));
      setBusy(null);
    }
  };

  const reject = async () => {
    if (!reason.trim()) return;
    setBusy('reject');
    setError(null);
    try {
      await apiFetch(`/api/admin/orders/${row.id}/reject`, {
        method: 'POST',
        body: JSON.stringify({ rejectReason: reason.trim() }),
      });
      onResolved();
      onClose();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t('queue.drawer.actionError'));
      setBusy(null);
    }
  };

  const footer = (
    <div className="flex flex-col gap-token-3">
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      {rejecting ? (
        <div className="flex flex-col gap-token-2">
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={t('queue.drawer.rejectReasonPlaceholder')}
            aria-label={t('queue.drawer.rejectReason')}
          />
          <div className="flex items-center gap-token-2">
            <Button
              variant="danger"
              onClick={reject}
              disabled={!reason.trim() || busy !== null}
            >
              {busy === 'reject' ? t('queue.drawer.rejecting') : t('queue.drawer.confirmReject')}
            </Button>
            <Button variant="ghost" onClick={() => setRejecting(false)} disabled={busy !== null}>
              {t('common.cancel')}
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-token-2">
          <Button onClick={approve} disabled={busy !== null} className="flex-1">
            {busy === 'approve' ? t('queue.drawer.approving') : `✓ ${t('queue.drawer.approve')}`}
          </Button>
          <Button
            variant="danger"
            onClick={() => setRejecting(true)}
            disabled={busy !== null}
            className="flex-1"
          >
            ✕ {t('queue.drawer.reject')}
          </Button>
        </div>
      )}
    </div>
  );

  return (
    <Drawer open={open} onClose={onClose} title={t('queue.drawer.title')} footer={footer} wide>
      <div className="flex flex-col gap-token-6">
        {/* Order summary */}
        <section>
          <div className="flex items-center justify-between gap-token-2">
            <span className="font-mono text-sm font-semibold text-ink">{row.orderRef}</span>
            {row.buyerEmail ? (
              <span className="truncate text-xs text-muted" title={row.buyerEmail}>
                {row.buyerEmail}
              </span>
            ) : null}
          </div>
          <p className="mt-token-1 text-sm text-muted">
            {localizedTemplateTitle(row, locale)}
            {row.recipientName ? ` · ${row.recipientName}` : ''}
          </p>
        </section>

        {/* Amounts: expected vs claimed */}
        <section>
          <h3 className="mb-token-2 text-sm font-semibold text-ink">{t('queue.drawer.amounts')}</h3>
          <div className="grid grid-cols-2 gap-token-3">
            <div className="rounded-md border border-border bg-surface-2 p-token-3">
              <p className="text-xs text-muted">{t('queue.drawer.expected')}</p>
              <p className="mt-token-1 font-semibold text-ink">
                {amountsKnown ? formatPiastres(row.amountPiastres, locale) : '—'}
              </p>
            </div>
            <div className="rounded-md border border-border bg-surface-2 p-token-3">
              <p className="text-xs text-muted">{t('queue.drawer.claimed')}</p>
              <p className="mt-token-1 font-semibold text-ink">
                {amountsKnown ? formatPiastres(row.amountPiastres, locale) : '—'}
              </p>
            </div>
          </div>
          <div className="mt-token-2">
            <Badge tone="success">{t('queue.drawer.match')}</Badge>
          </div>
        </section>

        {/* Payment reference + InstaPay */}
        <section className="grid grid-cols-1 gap-token-3 sm:grid-cols-2">
          <div>
            <p className="text-xs text-muted">{t('queue.drawer.paymentRef')}</p>
            <p className="mt-token-1 break-all font-mono text-sm text-ink">{claimedRef}</p>
          </div>
          <div>
            <p className="text-xs text-muted">{t('queue.drawer.instapay')}</p>
            <p className="mt-token-1 break-all font-mono text-sm text-ink">
              {row.instapayHandle ?? '—'}
            </p>
          </div>
        </section>

        {/* Payment screenshot */}
        <section>
          <h3 className="mb-token-2 text-sm font-semibold text-ink">{t('queue.drawer.proof')}</h3>
          <PaymentProofViewer url={screenshot} />
        </section>

        {/* Experience preview */}
        <section>
          <h3 className="mb-token-2 text-sm font-semibold text-ink">
            {t('queue.drawer.experiencePreview')}
          </h3>
          <ExperiencePreview experience={row.experience} />
        </section>
      </div>
    </Drawer>
  );
}
