'use client';

import * as React from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { Button, Badge, Spinner, Input } from '@/components/ui';
import { dashboardApi, ApiError } from './api-client';
import type { TemplateCard, AppLocale } from './types';
import { formatEgp } from './money';

export function TemplatePicker() {
  const t = useTranslations('dashboard');
  const router = useRouter();
  const locale = useLocale() as AppLocale;

  const [templates, setTemplates] = React.useState<TemplateCard[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [selected, setSelected] = React.useState<TemplateCard | null>(null);
  const [recipient, setRecipient] = React.useState('');
  const [creating, setCreating] = React.useState(false);

  React.useEffect(() => {
    (async () => {
      try {
        const list = await dashboardApi.listTemplates();
        setTemplates(list);
      } catch (e) {
        // Endpoint may not be live yet — show an empty, non-broken state.
        setTemplates([]);
        if (e instanceof ApiError && e.status !== 404) setError(t('create.error'));
      }
    })();
  }, [t]);

  const create = async (template: TemplateCard) => {
    setCreating(true);
    setError(null);
    try {
      // Only send optional fields when non-empty: the API schema requires
      // `recipientName`/`title` to be min-length-1 WHEN present, so sending an
      // empty string would 400 the request and break creation entirely.
      const trimmedRecipient = recipient.trim();
      const res = await dashboardApi.createExperience({
        templateId: template.id,
        locale: template.locale ?? locale,
        ...(trimmedRecipient ? { recipientName: trimmedRecipient } : {}),
      });
      const id = res.experience?.id ?? res.id ?? (res as { id?: string }).id;
      if (!id) throw new Error('no id');
      router.push(`/builder/${id}`);
    } catch {
      setError(t('create.error'));
      setCreating(false);
    }
  };

  return (
    <div>
      <div className="mb-token-6">
        <h1 className="font-heading text-2xl font-bold text-ink md:text-3xl">{t('create.title')}</h1>
        <p className="mt-token-1 text-muted">{t('create.subtitle')}</p>
      </div>

      <div className="mb-token-6 max-w-sm">
        <label htmlFor="picker-recipient" className="mb-token-2 block text-sm font-medium text-ink">
          {t('wizard.details.recipientLabel')}
        </label>
        <Input
          id="picker-recipient"
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
          placeholder={t('wizard.details.recipientPlaceholder')}
        />
      </div>

      {error ? (
        <div className="mb-token-4 rounded-md border border-danger/30 bg-danger/10 px-token-4 py-token-3 text-sm text-danger">
          {error}
        </div>
      ) : null}

      {templates === null ? (
        <div className="flex items-center justify-center py-16">
          <Spinner size={28} />
        </div>
      ) : templates.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-surface p-token-8 text-center text-muted">
          {t('create.noTemplates')}
        </div>
      ) : (
        <div className="grid gap-token-4 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((tpl) => {
            const palette = tpl.palette?.length ? tpl.palette : ['#F0436E', '#AE1F44'];
            const isSel = selected?.id === tpl.id;
            return (
              <div
                key={tpl.id}
                className={`flex flex-col overflow-hidden rounded-xl border bg-surface shadow-[var(--shadow-card)] transition-all ${
                  isSel ? 'border-brand ring-2 ring-brand/30' : 'border-border'
                }`}
              >
                <div
                  className="relative aspect-[4/3] w-full"
                  style={{ background: `linear-gradient(150deg, ${palette[0]}, ${palette[1] ?? palette[0]})` }}
                >
                  {tpl.thumbnailUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={tpl.thumbnailUrl}
                      alt=""
                      className="h-full w-full object-cover"
                      // Degrade gracefully to the palette gradient if the image fails.
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  ) : (
                    <span className="absolute inset-0 flex items-center justify-center text-5xl" aria-hidden>
                      🎉
                    </span>
                  )}
                  <span className="absolute inset-inline-start-token-3 top-token-3">
                    <Badge tone={tpl.isPaid ? 'brand' : 'success'}>
                      {tpl.isPaid ? formatEgp(tpl.pricePiastres, locale) : t('create.free')}
                    </Badge>
                  </span>
                </div>
                <div className="flex flex-1 flex-col p-token-4">
                  <h3 className="font-heading text-base font-semibold text-ink">{tpl.name}</h3>
                  {tpl.description ? (
                    <p className="mt-token-1 line-clamp-2 text-sm text-muted">{tpl.description}</p>
                  ) : null}
                  <div className="mt-token-4 flex-1" />
                  <Button
                    className="w-full"
                    disabled={creating}
                    onClick={() => {
                      setSelected(tpl);
                      void create(tpl);
                    }}
                  >
                    {creating && isSel ? <Spinner size={16} /> : t('create.use')}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
