'use client';

import * as React from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { useSearchParams } from 'next/navigation';
import { Spinner, Input } from '@/components/ui';
import { TemplateCard, type TemplateCardData } from '@/components/templates/TemplateCard';
import { buildPreviewExperience } from '@/lib/template-preview';
import { dashboardApi, ApiError } from './api-client';
import type { TemplateCard as TemplateRow, AppLocale } from './types';
import { formatEgp } from './money';
import { track } from '@/lib/track';

/**
 * Template chooser for the builder.
 *
 * Shares the public gallery's card so the template someone picked on the
 * marketing site is the same object they meet here — it previews the real
 * design and plays its scenes on hover, instead of a flat thumbnail.
 *
 * The preview binds to whatever recipient name is typed above, so the name is
 * already in the card before anything is created.
 */
export function TemplatePicker() {
  const t = useTranslations('dashboard');
  const tg = useTranslations('marketing.templates');
  const router = useRouter();
  const locale = useLocale() as AppLocale;

  const [templates, setTemplates] = React.useState<TemplateRow[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [recipient, setRecipient] = React.useState('');
  const [creatingId, setCreatingId] = React.useState<string | null>(null);
  // Arriving from a template's public preview: start that card right away.
  const preselect = useSearchParams().get('template');
  const autoStarted = React.useRef(false);

  React.useEffect(() => {
    (async () => {
      try {
        setTemplates(await dashboardApi.listTemplates());
      } catch (e) {
        setTemplates([]);
        if (e instanceof ApiError && e.status !== 404) setError(t('create.error'));
      }
    })();
  }, [t]);

  const create = async (tpl: TemplateRow) => {
    setCreatingId(tpl.id);
    setError(null);
    try {
      const trimmed = recipient.trim();
      const res = await dashboardApi.createExperience({
        templateId: tpl.id,
        locale: tpl.locale ?? locale,
        ...(trimmed ? { recipientName: trimmed } : {}),
      });
      const id = res.experience?.id ?? res.id;
      if (!id) throw new Error('no id');
      track('create_started', { templateId: tpl.id, experienceId: id, ...(tpl.categorySlug ? { category: tpl.categorySlug } : {}) });
      router.push(`/builder/${id}`);
    } catch {
      setError(t('create.error'));
      setCreatingId(null);
    }
  };

  React.useEffect(() => {
    if (!preselect || autoStarted.current || !templates) return;
    const row = templates.find((tpl) => tpl.id === preselect);
    if (!row) return;
    autoStarted.current = true;
    void create(row);
    // create is stable enough for a one-shot start; re-running would duplicate cards.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preselect, templates]);

  // Whatever is typed above shows up inside every preview; fall back to the
  // gallery's sample name so the cards are never addressed to nobody.
  const sampleName = recipient.trim() || tg('sampleName');

  const cards: (TemplateCardData & { row: TemplateRow })[] = React.useMemo(
    () =>
      (templates ?? [])
        .filter((tpl) => tpl.definition)
        .map((tpl) => ({
          row: tpl,
          slug: tpl.id,
          title: tpl.name,
          categorySlug: tpl.categorySlug ?? 'other',
          categoryLabel: tpl.categorySlug ?? '',
          locale: tpl.locale,
          isPaid: tpl.isPaid,
          priceLabel: tpl.isPaid ? formatEgp(tpl.pricePiastres, locale) : tg('free'),
          popular: tpl.isPaid,
          experience: buildPreviewExperience(tpl.definition!, {
            templateId: tpl.id,
            category: tpl.categorySlug ?? undefined,
            recipientName: sampleName,
          }),
        })),
    [templates, locale, sampleName, tg],
  );

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
      ) : cards.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-surface p-token-8 text-center text-muted">
          {t('create.noTemplates')}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-token-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {cards.map((card) => (
            <TemplateCard
              key={card.slug}
              data={card}
              popularLabel={tg('popular')}
              busy={creatingId === card.row.id}
              onSelect={() => void create(card.row)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
