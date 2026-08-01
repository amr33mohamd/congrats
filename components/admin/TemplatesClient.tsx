'use client';

/**
 * Template management list. Consumes GET /api/admin/templates and
 * GET /api/admin/categories; create/edit via the editor drawer; delete via
 * DELETE /api/admin/templates/:id.
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
  TemplateStatusBadge,
} from './primitives';
import { TemplateEditor } from './TemplateEditor';
import { useApi, apiFetch, asList, formatPiastres } from './lib';
import type { CategoryRow, TemplateRow } from './types';

function title(tpl: TemplateRow, locale: string): string {
  const ar = tpl.titleAr;
  const en = tpl.titleEn;
  return (locale === 'ar' ? ar || en : en || ar) || tpl.slug;
}

function sceneCount(tpl: TemplateRow): number | null {
  const def = tpl.definition as { scenes?: unknown[] } | undefined;
  return Array.isArray(def?.scenes) ? def!.scenes!.length : null;
}

function statusLabel(status: string, t: (k: string) => string): string {
  if (status === 'published') return t('templates.statusPublished');
  if (status === 'archived') return t('templates.statusArchived');
  return t('templates.statusDraft');
}

export function TemplatesClient() {
  const t = useTranslations('admin');
  const locale = useLocale();
  const templatesApi = useApi<unknown>('/api/admin/templates');
  const categoriesApi = useApi<unknown>('/api/admin/categories');

  const [editing, setEditing] = React.useState<TemplateRow | null>(null);
  const [editorOpen, setEditorOpen] = React.useState(false);

  const templates = React.useMemo(
    () => asList<TemplateRow>(templatesApi.data, 'templates'),
    [templatesApi.data],
  );
  const categories = React.useMemo(
    () => asList<CategoryRow>(categoriesApi.data, 'categories'),
    [categoriesApi.data],
  );

  const openCreate = () => {
    setEditing(null);
    setEditorOpen(true);
  };
  const openEdit = (tpl: TemplateRow) => {
    setEditing(tpl);
    setEditorOpen(true);
  };

  const remove = async (tpl: TemplateRow) => {
    if (!window.confirm(t('templates.editor.deleteConfirm'))) return;
    try {
      await apiFetch(`/api/admin/templates/${tpl.id}`, { method: 'DELETE' });
      templatesApi.reload();
    } catch {
      /* surfaced via reload / no-op */
    }
  };

  const categoryName = (id: string | null | undefined): string => {
    if (!id) return '—';
    const c = categories.find((x) => x.id === id);
    if (!c) return '—';
    return locale === 'ar' ? c.nameAr : c.nameEn;
  };

  return (
    <div>
      <PageHeader
        title={t('templates.title')}
        subtitle={t('templates.subtitle')}
        actions={<Button size="sm" onClick={openCreate}>＋ {t('templates.new')}</Button>}
      />

      {templatesApi.loading ? (
        <LoadingState label={t('common.loading')} />
      ) : templatesApi.error ? (
        <ErrorState label={t('common.error')} onRetry={templatesApi.reload} />
      ) : templates.length === 0 ? (
        <EmptyState label={t('templates.empty')} />
      ) : (
        <Table>
          <THead>
            <TH>{t('templates.colTitle')}</TH>
            <TH>{t('templates.colCategory')}</TH>
            <TH>{t('templates.colLocale')}</TH>
            <TH>{t('templates.colPrice')}</TH>
            <TH>{t('templates.colScenes')}</TH>
            <TH>{t('templates.colStatus')}</TH>
            <TH />
          </THead>
          <TBody>
            {templates.map((tpl) => (
              <TR key={tpl.id} onClick={() => openEdit(tpl)}>
                <TD className="font-medium">{title(tpl, locale)}</TD>
                <TD>{categoryName(tpl.categoryId)}</TD>
                <TD className="uppercase">{tpl.locale}</TD>
                <TD>
                  {tpl.isPaid ? formatPiastres(tpl.pricePiastres, locale) : t('common.free')}
                </TD>
                <TD>{sceneCount(tpl) ?? '—'}</TD>
                <TD>
                  <TemplateStatusBadge status={tpl.status} label={statusLabel(tpl.status, t)} />
                </TD>
                <TD>
                  <div className="flex items-center gap-token-1">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={(e) => {
                        e.stopPropagation();
                        openEdit(tpl);
                      }}
                    >
                      {t('common.edit')}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        remove(tpl);
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

      <TemplateEditor
        template={editing}
        categories={categories}
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        onSaved={templatesApi.reload}
      />
    </div>
  );
}
