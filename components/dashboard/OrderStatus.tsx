'use client';

import * as React from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Button, Input, Spinner, Badge, Card } from '@/components/ui';
import { dashboardApi, uploadAndConfirm, ApiError } from './api-client';
import type { OrderInfo, AppLocale } from './types';
import { formatEgp } from './money';
import { CopyField } from './CopyField';
import { track } from '@/lib/track';

export function OrderStatus({ orderId }: { orderId: string }) {
  const t = useTranslations('dashboard');
  const tc = useTranslations('common');
  const locale = useLocale() as AppLocale;

  const [order, setOrder] = React.useState<OrderInfo | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    try {
      const o = await dashboardApi.getOrder(orderId);
      setOrder(o);
      setError(null);
    } catch (e) {
      setError(e instanceof ApiError && e.status === 404 ? t('errors.notFound') : t('errors.loadFailed'));
    }
  }, [orderId, t]);

  React.useEffect(() => {
    void load();
  }, [load]);

  // Poll while submitted (awaiting admin approval).
  React.useEffect(() => {
    if (order?.status !== 'submitted') return;
    const id = setInterval(() => void load(), 8000);
    return () => clearInterval(id);
  }, [order?.status, load]);

  if (error && !order) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-surface p-token-8 text-center text-muted">
        {error}
        <div className="mt-token-4">
          <Link href="/dashboard">
            <Button variant="secondary">{t('order.backToDashboard')}</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner size={28} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-token-6 flex items-center justify-between gap-token-3">
        <h1 className="font-heading text-2xl font-bold text-ink">{t('order.title')}</h1>
        <Badge tone={statusTone(order.status)}>{tc(`order.status.${order.status}`)}</Badge>
      </div>

      {order.status === 'pending' ? (
        <Checkout order={order} onSubmitted={load} />
      ) : (
        <StatusPanel order={order} locale={locale} onRefresh={load} />
      )}
    </div>
  );
}

function statusTone(s: OrderInfo['status']) {
  switch (s) {
    case 'approved':
      return 'success' as const;
    case 'rejected':
    case 'refunded':
      return 'danger' as const;
    case 'submitted':
      return 'brand' as const;
    default:
      return 'warning' as const;
  }
}

/* ─────────────────────────────── Checkout ──────────────────────────── */

function Checkout({ order, onSubmitted }: { order: OrderInfo; onSubmitted: () => void }) {
  const t = useTranslations('dashboard.checkout');
  const locale = useLocale() as AppLocale;

  const inputRef = React.useRef<HTMLInputElement>(null);
  const [screenshotId, setScreenshotId] = React.useState<string | null>(null);
  const [screenshotUrl, setScreenshotUrl] = React.useState<string | null>(null);
  const [paymentRef, setPaymentRef] = React.useState('');
  const [uploading, setUploading] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploading(true);
    setError(null);
    const preview = URL.createObjectURL(file);
    setScreenshotUrl(preview);
    try {
      const media = await uploadAndConfirm(file, {
        kind: 'payment_screenshot',
        experienceId: order.experienceId,
      });
      setScreenshotId(media.id);
    } catch {
      setError(t('error'));
      setScreenshotUrl(null);
    } finally {
      setUploading(false);
    }
  };

  const submit = async () => {
    if (!screenshotId) {
      setError(t('form.needScreenshot'));
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await dashboardApi.submitOrder(order.id, {
        screenshotMediaId: screenshotId,
        paymentRef: paymentRef.trim(),
      });
      track('payment_submitted', {
        orderId: order.id,
        experienceId: order.experienceId,
        value: order.amountPiastres / 100,
      });
      onSubmitted();
    } catch {
      setError(t('form.error'));
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-token-4">
      <Card className="p-token-6">
        <p className="text-sm text-muted">{t('subtitle')}</p>
        <div className="mt-token-4 flex items-baseline justify-between">
          <span className="text-sm text-muted">{t('amount')}</span>
          <span className="font-heading text-2xl font-bold text-ink">
            {formatEgp(order.amountPiastres, locale)}
          </span>
        </div>
        <div className="mt-token-4 flex flex-col gap-token-3">
          <CopyField label={t('instapayHandle')} value={order.instapayHandle} mono={false} />
          <CopyField label={t('orderRef')} value={order.orderRef} />
        </div>
      </Card>

      <Card className="p-token-6">
        <h2 className="font-heading text-base font-semibold text-ink">{t('steps.title')}</h2>
        <ol className="mt-token-3 flex flex-col gap-token-2 text-sm text-muted">
          {(['s1', 's2', 's3', 's4'] as const).map((s, i) => (
            <li key={s} className="flex gap-token-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand/10 text-xs font-bold text-brand-strong">
                {i + 1}
              </span>
              {t(`steps.${s}`)}
            </li>
          ))}
        </ol>
      </Card>

      <Card className="p-token-6">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={onFile}
        />
        <span className="mb-token-2 block text-sm font-medium text-ink">
          {t('form.screenshotLabel')}
        </span>
        {screenshotUrl ? (
          <div className="mb-token-4 flex items-center gap-token-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={screenshotUrl}
              alt=""
              className="h-20 w-20 rounded-lg border border-border object-cover"
            />
            <Button size="sm" variant="secondary" onClick={() => inputRef.current?.click()} disabled={uploading}>
              {t('form.upload')}
            </Button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="mb-token-4 flex w-full flex-col items-center gap-token-2 rounded-lg border border-dashed border-border bg-surface-2 p-token-6 text-muted transition-colors hover:border-brand hover:text-brand disabled:opacity-60"
          >
            {uploading ? <Spinner size={20} /> : <span aria-hidden className="text-2xl">📤</span>}
            <span className="text-sm font-medium">
              {uploading ? t('form.uploading') : t('form.upload')}
            </span>
          </button>
        )}

        <label htmlFor="payment-ref" className="mb-token-2 block text-sm font-medium text-ink">
          {t('form.refLabel')}
        </label>
        <Input
          id="payment-ref"
          value={paymentRef}
          onChange={(e) => setPaymentRef(e.target.value)}
          placeholder={t('form.refPlaceholder')}
          dir="ltr"
        />

        {error ? (
          <p className="mt-token-3 text-sm text-danger">{error}</p>
        ) : null}

        <Button className="mt-token-4 w-full" onClick={submit} disabled={submitting || uploading}>
          {submitting ? <Spinner size={18} /> : t('form.submit')}
        </Button>
      </Card>
    </div>
  );
}

/* ───────────────────────────── Status panel ────────────────────────── */

function StatusPanel({
  order,
  locale,
  onRefresh,
}: {
  order: OrderInfo;
  locale: AppLocale;
  onRefresh: () => void;
}) {
  const t = useTranslations('dashboard.order');

  const config = {
    submitted: { emoji: '⏳', title: t('submittedTitle'), body: t('submittedBody') },
    approved: { emoji: '🎉', title: t('approvedTitle'), body: t('approvedBody') },
    rejected: { emoji: '⚠️', title: t('rejectedTitle'), body: t('rejectedBody') },
    refunded: { emoji: '↩️', title: t('rejectedTitle'), body: t('rejectedBody') },
    pending: { emoji: '💳', title: t('pendingTitle'), body: t('pendingBody') },
  }[order.status];

  return (
    <Card className="p-token-8 text-center">
      <div className="text-5xl" aria-hidden>
        {config.emoji}
      </div>
      <h2 className="mt-token-4 font-heading text-xl font-bold text-ink">{config.title}</h2>
      <p className="mx-auto mt-token-2 max-w-sm text-muted">{config.body}</p>

      {order.status === 'rejected' && order.rejectReason ? (
        <div className="mx-auto mt-token-4 max-w-sm rounded-md border border-danger/30 bg-danger/10 px-token-4 py-token-3 text-start text-sm text-danger">
          <strong className="block">{t('rejectedReason')}</strong>
          {order.rejectReason}
        </div>
      ) : null}

      <div className="mx-auto mt-token-6 flex max-w-sm flex-col gap-token-2 text-start">
        <div className="flex justify-between rounded-md bg-surface-2 px-token-3 py-token-2 text-sm">
          <span className="text-muted">{t('ref')}</span>
          <span className="font-mono font-medium text-ink" dir="ltr">
            {order.orderRef}
          </span>
        </div>
        <div className="flex justify-between rounded-md bg-surface-2 px-token-3 py-token-2 text-sm">
          <span className="text-muted">{t('amount')}</span>
          <span className="font-medium text-ink">{formatEgp(order.amountPiastres, locale)}</span>
        </div>
      </div>

      <div className="mt-token-6 flex flex-col items-stretch gap-token-2">
        {order.status === 'approved' ? (
          <Link href={`/builder/${order.experienceId}`}>
            <Button className="w-full">{t('openLink')}</Button>
          </Link>
        ) : null}
        {order.status === 'rejected' ? (
          <Link href={`/builder/${order.experienceId}?step=review`}>
            <Button className="w-full">{t('retry')}</Button>
          </Link>
        ) : null}
        {order.status === 'submitted' ? (
          <Button variant="secondary" className="w-full" onClick={onRefresh}>
            {t('refresh')}
          </Button>
        ) : null}
        <Link href="/dashboard">
          <Button variant="ghost" className="w-full">
            {t('backToDashboard')}
          </Button>
        </Link>
      </div>
    </Card>
  );
}
