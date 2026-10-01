'use client';

import * as React from 'react';
import { remainingUntil } from '@/lib/countdown';
import { useLocale, useTranslations } from 'next-intl';
import type { Field } from '@/lib/template-contract';
import { Input } from '@/components/ui';
import { cn } from '@/components/ui/cn';
import type { AppLocale } from '../types';

export function DetailsStep({
  recipientName,
  title,
  locale,
  isPaidTemplate,
  onRecipient,
  onTitle,
  onLocale,
  fieldDefs = [],
  fields = {},
  onField,
  isInvitation = false,
}: {
  recipientName: string;
  title: string;
  locale: AppLocale;
  isPaidTemplate: boolean;
  onRecipient: (v: string) => void;
  onTitle: (v: string) => void;
  onLocale: (v: AppLocale) => void;
  /** Card-level details — asked here once instead of in every section. */
  fieldDefs?: Field[];
  fields?: Record<string, string>;
  onField?: (key: string, value: string) => void;
  /**
   * On an invitation the "recipient" is the GUEST, and leaving it blank is a
   * real choice (one link for every guest), so it is labelled that way.
   */
  isInvitation?: boolean;
}) {
  const t = useTranslations('dashboard.wizard.details');
  const uiLocale = useLocale();
  const label = (f: Field) =>
    (uiLocale === 'ar' ? f.labelAr : f.labelEn) ?? f.labelEn ?? f.labelAr ?? f.key;

  return (
    <div className="mx-auto max-w-xl">
      <h2 className="font-heading text-2xl font-bold text-ink">{t('title')}</h2>
      <p className="mt-token-1 text-muted">{t('subtitle')}</p>

      <div className="mt-token-6 flex flex-col gap-token-6">
        <div>
          <label htmlFor="w-recipient" className="mb-token-2 block text-sm font-medium text-ink">
            {isInvitation ? t('guestLabel') : t('recipientLabel')}
          </label>
          <Input
            id="w-recipient"
            value={recipientName}
            onChange={(e) => onRecipient(e.target.value)}
            placeholder={isInvitation ? t('guestPlaceholder') : t('recipientPlaceholder')}
            autoFocus
          />
          {isInvitation ? <p className="mt-token-2 text-xs text-muted">{t('guestHint')}</p> : null}
        </div>

        {fieldDefs.length > 0 ? (
          <fieldset className="flex flex-col gap-token-6 rounded-xl border border-border bg-surface p-token-6">
            <legend className="px-token-2 text-sm font-semibold text-ink">{t('cardDetails')}</legend>
            <p className="-mt-token-3 text-xs text-muted">{t('cardDetailsHint')}</p>
            {fieldDefs.map((f) => (
              <div key={f.key}>
                <label htmlFor={`w-field-${f.key}`} className="mb-token-2 block text-sm font-medium text-ink">
                  {label(f)}
                  {f.required ? <span className="ms-token-1 text-danger">*</span> : null}
                </label>
                <Input
                  id={`w-field-${f.key}`}
                  type={f.type === 'date' ? 'datetime-local' : 'text'}
                  value={fields[f.key] ?? ''}
                  maxLength={f.maxLen}
                  onChange={(e) => onField?.(f.key, e.target.value)}
                  dir={f.type === 'date' ? 'ltr' : undefined}
                  aria-describedby={f.type === 'date' ? `w-field-${f.key}-when` : undefined}
                />
                {f.type === 'date' ? <DateDistance id={`w-field-${f.key}-when`} value={fields[f.key] ?? ''} /> : null}
              </div>
            ))}
          </fieldset>
        ) : null}

        <div>
          <label htmlFor="w-title" className="mb-token-2 block text-sm font-medium text-ink">
            {t('titleLabel')}
          </label>
          <Input
            id="w-title"
            value={title}
            onChange={(e) => onTitle(e.target.value)}
            placeholder={t('titlePlaceholder')}
          />
        </div>

        <div>
          <span className="mb-token-2 block text-sm font-medium text-ink">{t('localeLabel')}</span>
          <div className="grid grid-cols-2 gap-token-3">
            {(['ar', 'en'] as AppLocale[]).map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => onLocale(l)}
                className={cn(
                  'rounded-lg border px-token-4 py-token-3 text-start text-sm font-medium transition-colors',
                  locale === l
                    ? 'border-brand bg-brand/5 text-ink ring-1 ring-brand/30'
                    : 'border-border bg-surface text-muted hover:border-brand/40',
                )}
                aria-pressed={locale === l}
              >
                {l === 'ar' ? t('localeAr') : t('localeEn')}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * "In 78 days" under a date field. The input shows 15/12/2027 and 15/12/2026
 * almost alike; the distance makes a wrong year obvious before publishing.
 */
function DateDistance({ id, value }: { id: string; value: string }) {
  const t = useTranslations('dashboard.wizard.details');
  if (!value) return null;
  const left = remainingUntil(value);
  let text: string;
  let warn = false;
  if (!left) {
    text = t('datePast');
    warn = true;
  } else if (left.d === 0) {
    text = t('dateToday');
  } else {
    text = t('dateIn', { days: left.d });
    warn = left.d > 365;
  }
  return (
    <p id={id} className={`mt-token-2 text-xs ${warn ? 'text-warning' : 'text-muted'}`}>
      {text}
      {warn && left ? ` · ${t('dateCheckYear')}` : null}
    </p>
  );
}
