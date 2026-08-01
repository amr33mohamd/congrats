'use client';

/**
 * Category CRUD. Consumes GET/POST/PATCH/DELETE /api/admin/categories.
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
import { useApi, apiFetch, ApiError, asList } from './lib';
import type { CategoryRow } from './types';

interface CatForm {
  nameEn: string;
  nameAr: string;
  slug: string;
  icon: string;
  sortOrder: string;
  isActive: boolean;
}

function toForm(c: CategoryRow | null): CatForm {
  return {
    nameEn: c?.nameEn ?? '',
    nameAr: c?.nameAr ?? '',
    slug: c?.slug ?? '',
    icon: c?.icon ?? '',
    sortOrder: c ? String(c.sortOrder ?? 0) : '0',
    isActive: c ? Boolean(c.isActive) : true,
  };
}

export function CategoriesClient() {
  const t = useTranslations('admin');
  const locale = useLocale();
  const { data, loading, error, reload } = useApi<unknown>('/api/admin/categories');

  const [editing, setEditing] = React.useState<CategoryRow | null>(null);
  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState<CatForm>(() => toForm(null));
  const [busy, setBusy] = React.useState(false);
  const [saveError, setSaveError] = React.useState<string | null>(null);

  const categories = React.useMemo(
    () => asList<CategoryRow>(data, 'categories'),
    [data],
  );

  const openEditor = (c: CategoryRow | null) => {
    setEditing(c);
    setForm(toForm(c));
    setSaveError(null);
    setOpen(true);
  };

  const set = <K extends keyof CatForm>(k: K, v: CatForm[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    setBusy(true);
    setSaveError(null);
    const payload = {
      nameEn: form.nameEn,
      nameAr: form.nameAr,
      slug: form.slug,
      icon: form.icon || null,
      sortOrder: parseInt(form.sortOrder, 10) || 0,
      isActive: form.isActive,
    };
    try {
      if (editing) {
        await apiFetch(`/api/admin/categories/${editing.id}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
      } else {
        await apiFetch('/api/admin/categories', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }
      reload();
      setOpen(false);
    } catch (e) {
      setSaveError(e instanceof ApiError ? e.message : t('categories.editor.saveError'));
    } finally {
      setBusy(false);
    }
  };

  const remove = async (c: CategoryRow) => {
    if (!window.confirm(t('categories.editor.deleteConfirm'))) return;
    try {
      await apiFetch(`/api/admin/categories/${c.id}`, { method: 'DELETE' });
      reload();
    } catch {
      /* no-op */
    }
  };

  const footer = (
    <div className="flex flex-col gap-token-2">
      {saveError ? <p className="text-sm text-danger">{saveError}</p> : null}
      <div className="flex items-center gap-token-2">
        <Button onClick={save} disabled={busy}>
          {busy ? t('common.saving') : t('categories.editor.save')}
        </Button>
        <Button variant="ghost" onClick={() => setOpen(false)} disabled={busy}>
          {t('common.cancel')}
        </Button>
      </div>
    </div>
  );

  return (
    <div>
      <PageHeader
        title={t('categories.title')}
        subtitle={t('categories.subtitle')}
        actions={<Button size="sm" onClick={() => openEditor(null)}>＋ {t('categories.new')}</Button>}
      />

      {loading ? (
        <LoadingState label={t('common.loading')} />
      ) : error ? (
        <ErrorState label={t('common.error')} onRetry={reload} />
      ) : categories.length === 0 ? (
        <EmptyState label={t('categories.empty')} />
      ) : (
        <Table>
          <THead>
            <TH>{t('categories.colName')}</TH>
            <TH>{t('categories.colSlug')}</TH>
            <TH>{t('categories.colSort')}</TH>
            <TH>{t('categories.colActive')}</TH>
            <TH />
          </THead>
          <TBody>
            {categories.map((c) => (
              <TR key={c.id} onClick={() => openEditor(c)}>
                <TD className="font-medium">
                  <span className="inline-flex items-center gap-token-2">
                    {c.icon ? <span aria-hidden>{c.icon}</span> : null}
                    {locale === 'ar' ? c.nameAr : c.nameEn}
                  </span>
                </TD>
                <TD className="font-mono text-xs">{c.slug}</TD>
                <TD>{c.sortOrder}</TD>
                <TD>
                  {c.isActive ? (
                    <Badge tone="success">{t('common.yesShort')}</Badge>
                  ) : (
                    <Badge tone="neutral">{t('common.noShort')}</Badge>
                  )}
                </TD>
                <TD>
                  <div className="flex items-center gap-token-1">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditor(c);
                      }}
                    >
                      {t('common.edit')}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        remove(c);
                      }}
                    >
                      🗑
                    </Button>
                  </div>
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      )}

      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? t('categories.editor.editTitle') : t('categories.editor.createTitle')}
        footer={footer}
      >
        <div className="flex flex-col gap-token-4">
          <div className="grid grid-cols-1 gap-token-4 sm:grid-cols-2">
            <Field label={t('categories.editor.nameEn')}>
              <Input value={form.nameEn} onChange={(e) => set('nameEn', e.target.value)} dir="ltr" />
            </Field>
            <Field label={t('categories.editor.nameAr')}>
              <Input value={form.nameAr} onChange={(e) => set('nameAr', e.target.value)} dir="rtl" />
            </Field>
          </div>
          <Field label={t('categories.editor.slug')}>
            <Input value={form.slug} onChange={(e) => set('slug', e.target.value)} dir="ltr" />
          </Field>
          <div className="grid grid-cols-1 gap-token-4 sm:grid-cols-2">
            <Field label={t('categories.editor.icon')} hint={t('categories.editor.iconHint')}>
              <Input value={form.icon} onChange={(e) => set('icon', e.target.value)} />
            </Field>
            <Field label={t('categories.editor.sortOrder')}>
              <Input
                type="number"
                value={form.sortOrder}
                onChange={(e) => set('sortOrder', e.target.value)}
                dir="ltr"
              />
            </Field>
          </div>
          <Toggle
            checked={form.isActive}
            onChange={(v) => set('isActive', v)}
            label={t('categories.editor.isActive')}
          />
        </div>
      </Drawer>
    </div>
  );
}
