'use client';

import * as React from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { Button, Spinner, Badge } from '@/components/ui';
import type { EditorExperience, AppLocale } from '../types';
import type { LocalStep } from '../editor-state';
import { dashboardApi, ApiError } from '../api-client';
import { formatEgp } from '../money';
import { BuilderPreview } from '../BuilderPreview';

export function ReviewStep({
  experience,
  steps,
  recipientName,
  onBeforePublish,
}: {
  experience: EditorExperience;
  steps: LocalStep[];
  recipientName: string;
  onBeforePublish: () => Promise<void>;
}) {
  const t = useTranslations('dashboard.wizard.review');
  const td = useTranslations('dashboard.wizard.details');
  const locale = useLocale() as AppLocale;
  const router = useRouter();

  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const publish = async () => {
    setBusy(true);
    setError(null);
    try {
      await onBeforePublish();
      if (experience.isPaid) {
        // Create a pending order then route to checkout.
        const order = await dashboardApi.createOrder(experience.id);
        router.push(`/orders/${order.id}`);
        return;
      }
      const res = await dashboardApi.publish(experience.id);
      // Free template publishes directly; an order means a paid flow kicked in.
      if (res.order?.id) {
        router.push(`/orders/${res.order.id}`);
      } else {
        router.push('/dashboard');
      }
    } catch (e) {
      // Surface the server's specific reason when we have one (e.g. a real
      // validation message), otherwise the generic fallback.
      const msg = e instanceof ApiError && e.message && e.status !== 0 ? e.message : t('publishError');
      setError(msg);
      setBusy(false);
    }
  };

  return (
    <div className="grid gap-token-8 lg:grid-cols-[1fr_320px]">
      <div>
        <h2 className="font-heading text-2xl font-bold text-ink">{t('title')}</h2>
        <p className="mt-token-1 text-muted">{t('subtitle')}</p>

        <div className="mt-token-6 rounded-xl border border-border bg-surface p-token-6 shadow-[var(--shadow-card)]">
          <h3 className="font-heading text-sm font-semibold uppercase tracking-wide text-muted">
            {t('summary')}
          </h3>
          <dl className="mt-token-4 grid grid-cols-1 gap-token-3 sm:grid-cols-2">
            <Row label={t('recipient')} value={recipientName || '—'} />
            <Row
              label={t('language')}
              value={experience.locale === 'ar' ? td('localeAr') : td('localeEn')}
            />
            <Row label={t('scenes')} value={String(steps.length)} />
            <Row label={t('template')} value={experience.templateName ?? experience.templateId} />
            <div className="flex items-center justify-between gap-token-2 sm:col-span-2">
              <dt className="text-sm text-muted">{t('price')}</dt>
              <dd>
                {experience.isPaid ? (
                  <Badge tone="brand">{formatEgp(experience.pricePiastres, locale)}</Badge>
                ) : (
                  <Badge tone="success">{t('free')}</Badge>
                )}
              </dd>
            </div>
          </dl>
        </div>

        {error ? (
          <div className="mt-token-4 rounded-md border border-danger/30 bg-danger/10 px-token-4 py-token-3 text-sm text-danger">
            {error}
          </div>
        ) : null}

        <div className="mt-token-6 flex flex-col gap-token-3 sm:flex-row">
          <Button size="lg" className="w-full sm:w-auto" onClick={publish} disabled={busy}>
            {busy ? (
              <Spinner size={18} />
            ) : experience.isPaid ? (
              t('goCheckout')
            ) : (
              t('publishFree')
            )}
          </Button>
        </div>
      </div>

      <div className="lg:sticky lg:top-24 lg:self-start">
        <p className="mb-token-3 text-center text-sm font-medium text-ink">{t('previewFull')}</p>
        <BuilderPreview experience={experience} steps={steps} recipientName={recipientName} />
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-token-2">
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="truncate text-sm font-medium text-ink">{value}</dd>
    </div>
  );
}
