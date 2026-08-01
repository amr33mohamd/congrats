'use client';

/**
 * Pricing view. Lists templates with their paid/price status and edits pricing
 * via PATCH /api/admin/templates/:id/pricing {isPaid, pricePiastres, currency}.
 */
import * as React from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Badge, Button, Input } from '@/components/ui';
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
  Drawer,
  Field,
  Toggle,
} from './primitives';
import { useApi, apiFetch, ApiError, asList, formatPiastres } from './lib';
import type { CategoryRow, TemplateRow } from './types';

function title(tpl: TemplateRow, locale: string): string {
  const ar = tpl.titleAr;
  const en = tpl.titleEn;
  return (locale === 'ar' ? ar || en : en || ar) || tpl.slug;
}

export function PricingClient() {
  const t = useTranslations('admin');
  const locale = useLocale();
  const templatesApi = useApi<unknown>('/api/admin/templates');
  const categoriesApi = useApi<unknown>('/api/admin/categories');

  const [editing, setEditing] = React.useState<TemplateRow | null>(null);
  const [open, setOpen] = React.useState(false);
  const [isPaid, setIsPaid] = React.useState(false);
  const [priceEgp, setPriceEgp] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [saveError, setSaveError] = React.useState<string | null>(null);

  const templates = React.useMemo(
    () => asList<TemplateRow>(templatesApi.data, 'templates'),
    [templatesApi.data],
  );
  const categories = React.useMemo(
    () => asList<CategoryRow>(categoriesApi.data, 'categories'),
    [categoriesApi.data],
  );

  const categoryName = (id: string | null | undefined): string => {
    if (!id) return '—';
    const c = categories.find((x) => x.id === id);
    if (!c) return '—';
    return locale === 'ar' ? c.nameAr : c.nameEn;
  };

  const openEditor = (tpl: TemplateRow) => {
    setEditing(tpl);
    setIsPaid(Boolean(tpl.isPaid));
    setPriceEgp(tpl.pricePiastres ? String(tpl.pricePiastres / 100) : '');
    setSaveError(null);
    setOpen(true);
  };

  const save = async () => {
    if (!editing) return;
    setBusy(true);
    setSaveError(null);
    const pricePiastres = isPaid
      ? Math.max(0, Math.round((parseFloat(priceEgp) || 0) * 100))
      : 0;
    try {
      await apiFetch(`/api/admin/templates/${editing.id}/pricing`, {
        method: 'PATCH',
        body: JSON.stringify({ isPaid, pricePiastres, currency: 'EGP' }),
      });
      templatesApi.reload();
      setOpen(false);
    } catch (e) {
      setSaveError(e instanceof ApiError ? e.message : t('pricing.editor.saveError'));
    } finally {
      setBusy(false);
    }
  };

  const footer = (
    <div className="flex flex-col gap-token-2">
      {saveError ? <p className="text-sm text-danger">{saveError}</p> : null}
      <div className="flex items-center gap-token-2">
        <Button onClick={save} disabled={busy}>
          {busy ? t('common.saving') : t('pricing.editor.save')}
        </Button>
        <Button variant="ghost" onClick={() => setOpen(false)} disabled={busy}>
          {t('common.cancel')}
        </Button>
      </div>
    </div>
  );

  return (
    <div>
      <PageHeader title={t('pricing.title')} subtitle={t('pricing.subtitle')} />

      {templatesApi.loading ? (
        <LoadingState label={t('common.loading')} />
      ) : templatesApi.error ? (
        <ErrorState label={t('common.error')} onRetry={templatesApi.reload} />
      ) : templates.length === 0 ? (
        <EmptyState label={t('common.empty')} />
      ) : (
        <Table>
          <THead>
            <TH>{t('pricing.colTemplate')}</TH>
            <TH>{t('pricing.colCategory')}</TH>
            <TH>{t('pricing.colPaid')}</TH>
            <TH>{t('pricing.colPrice')}</TH>
            <TH />
          </THead>
          <TBody>
            {templates.map((tpl) => (
              <TR key={tpl.id} onClick={() => openEditor(tpl)}>
                <TD className="font-medium">{title(tpl, locale)}</TD>
                <TD>{categoryName(tpl.categoryId)}</TD>
                <TD>
                  {tpl.isPaid ? (
                    <Badge tone="brand">{t('pricing.paid')}</Badge>
                  ) : (
                    <Badge tone="neutral">{t('pricing.free')}</Badge>
                  )}
                </TD>
                <TD>
                  {tpl.isPaid ? formatPiastres(tpl.pricePiastres, locale) : t('common.free')}
                </TD>
                <TD>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={(e) => {
                      e.stopPropagation();
                      openEditor(tpl);
                    }}
                  >
                    {t('pricing.edit')}
                  </Button>
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      )}

      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        title={t('pricing.editor.title')}
        footer={footer}
      >
        {editing ? (
          <div className="flex flex-col gap-token-4">
            <p className="font-medium text-ink">{title(editing, locale)}</p>
            <Toggle
              checked={isPaid}
              onChange={setIsPaid}
              label={t('pricing.editor.isPaid')}
            />
            {isPaid ? (
              <Field label={t('pricing.editor.price')}>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={priceEgp}
                  onChange={(e) => setPriceEgp(e.target.value)}
                  dir="ltr"
                />
              </Field>
            ) : null}
            <Field label={t('pricing.editor.currency')}>
              <Input value="EGP" readOnly dir="ltr" />
            </Field>
          </div>
        ) : null}
      </Drawer>
    </div>
  );
}
