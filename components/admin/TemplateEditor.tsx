'use client';

/**
 * Template editor drawer. Edits title (AR/EN), category, locale/direction,
 * isPaid + price, status, and the scene definition via a JSON editor validated
 * against the TemplateDefinition contract (safeParseTemplateDefinition).
 * Calls POST/PATCH /api/admin/templates.
 */
import * as React from 'react';
import { useTranslations } from 'next-intl';
import { Button, Input } from '@/components/ui';
import { Drawer, Field, Toggle } from './primitives';
import { apiFetch, ApiError } from './lib';
import {
  safeParseTemplateDefinition,
  type TemplateDefinition,
} from '@/lib/template-contract';
import type { CategoryRow, TemplateRow } from './types';

const STARTER_DEFINITION = {
  version: 1,
  locale: 'en',
  direction: 'ltr',
  theme: { palette: ['#F0436E', '#AE1F44'] },
  scenes: [
    {
      id: 'cover',
      type: 'Cover',
      holdMs: 4000,
      transitionIn: { preset: 'fade', durationMs: 800, delayMs: 0 },
      slots: [
        {
          key: 'title',
          type: 'text',
          editable: true,
          required: true,
          maxLen: 60,
          defaultEn: 'Congratulations, {recipient}!',
          animation: 'typewriter',
        },
      ],
    },
  ],
};

interface FormState {
  titleEn: string;
  titleAr: string;
  slug: string;
  categoryId: string;
  locale: 'ar' | 'en';
  direction: 'rtl' | 'ltr';
  status: string;
  isPaid: boolean;
  priceEgp: string;
  definitionText: string;
}

function toForm(tpl: TemplateRow | null): FormState {
  if (!tpl) {
    return {
      titleEn: '',
      titleAr: '',
      slug: '',
      categoryId: '',
      locale: 'en',
      direction: 'ltr',
      status: 'draft',
      isPaid: false,
      priceEgp: '',
      definitionText: JSON.stringify(STARTER_DEFINITION, null, 2),
    };
  }
  return {
    titleEn: tpl.titleEn ?? '',
    titleAr: tpl.titleAr ?? '',
    slug: tpl.slug ?? '',
    categoryId: tpl.categoryId ?? '',
    locale: (tpl.locale as 'ar' | 'en') ?? 'en',
    direction: (tpl.direction as 'rtl' | 'ltr') ?? 'ltr',
    status: tpl.status ?? 'draft',
    isPaid: Boolean(tpl.isPaid),
    priceEgp: tpl.pricePiastres ? String(tpl.pricePiastres / 100) : '',
    definitionText: JSON.stringify(tpl.definition ?? STARTER_DEFINITION, null, 2),
  };
}

export function TemplateEditor({
  template,
  categories,
  open,
  onClose,
  onSaved,
}: {
  template: TemplateRow | null;
  categories: CategoryRow[];
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const t = useTranslations('admin');
  const [form, setForm] = React.useState<FormState>(() => toForm(template));
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [jsonError, setJsonError] = React.useState<string | null>(null);
  const isEdit = Boolean(template);

  React.useEffect(() => {
    setForm(toForm(template));
    setError(null);
    setJsonError(null);
  }, [template, open]);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const validateDefinition = (): TemplateDefinition | null => {
    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(form.definitionText);
    } catch {
      setJsonError(t('templates.editor.invalidJson'));
      return null;
    }
    const result = safeParseTemplateDefinition(parsedJson);
    if (!result.success) {
      const first = result.error.issues[0];
      setJsonError(
        `${t('templates.editor.invalidDefinition')} ${first?.path.join('.')} — ${first?.message}`,
      );
      return null;
    }
    setJsonError(null);
    return result.data;
  };

  const formatJson = () => {
    try {
      const obj = JSON.parse(form.definitionText);
      set('definitionText', JSON.stringify(obj, null, 2));
      setJsonError(null);
    } catch {
      setJsonError(t('templates.editor.invalidJson'));
    }
  };

  const save = async () => {
    const def = validateDefinition();
    if (!def) return;
    setBusy(true);
    setError(null);
    const pricePiastres = form.isPaid
      ? Math.max(0, Math.round((parseFloat(form.priceEgp) || 0) * 100))
      : 0;
    const payload = {
      titleEn: form.titleEn || null,
      titleAr: form.titleAr || null,
      slug: form.slug,
      categoryId: form.categoryId || null,
      locale: form.locale,
      direction: form.direction,
      status: form.status,
      isPaid: form.isPaid,
      pricePiastres,
      currency: 'EGP',
      definition: def,
    };
    try {
      if (isEdit && template) {
        await apiFetch(`/api/admin/templates/${template.id}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
      } else {
        await apiFetch('/api/admin/templates', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }
      onSaved();
      onClose();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t('templates.editor.saveError'));
    } finally {
      setBusy(false);
    }
  };

  const footer = (
    <div className="flex flex-col gap-token-2">
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      <div className="flex items-center gap-token-2">
        <Button onClick={save} disabled={busy}>
          {busy ? t('common.saving') : t('templates.editor.save')}
        </Button>
        <Button variant="ghost" onClick={onClose} disabled={busy}>
          {t('common.cancel')}
        </Button>
      </div>
    </div>
  );

  return (
    <Drawer
      open={open}
      onClose={onClose}
      wide
      title={isEdit ? t('templates.editor.editTitle') : t('templates.editor.createTitle')}
      footer={footer}
    >
      <div className="flex flex-col gap-token-4">
        <div className="grid grid-cols-1 gap-token-4 sm:grid-cols-2">
          <Field label={t('templates.editor.titleEn')}>
            <Input value={form.titleEn} onChange={(e) => set('titleEn', e.target.value)} dir="ltr" />
          </Field>
          <Field label={t('templates.editor.titleAr')}>
            <Input value={form.titleAr} onChange={(e) => set('titleAr', e.target.value)} dir="rtl" />
          </Field>
        </div>

        <Field label={t('templates.editor.slug')} hint={t('templates.editor.slugHint')}>
          <Input
            value={form.slug}
            onChange={(e) => set('slug', e.target.value)}
            dir="ltr"
            placeholder="anniversary-our-story-en"
          />
        </Field>

        <div className="grid grid-cols-1 gap-token-4 sm:grid-cols-3">
          <Field label={t('templates.editor.category')}>
            <select
              value={form.categoryId}
              onChange={(e) => set('categoryId', e.target.value)}
              className="h-11 w-full rounded-md border border-border bg-surface px-3 text-ink"
            >
              <option value="">{t('common.none')}</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nameEn} / {c.nameAr}
                </option>
              ))}
            </select>
          </Field>
          <Field label={t('templates.editor.locale')}>
            <select
              value={form.locale}
              onChange={(e) => set('locale', e.target.value as 'ar' | 'en')}
              className="h-11 w-full rounded-md border border-border bg-surface px-3 text-ink"
            >
              <option value="en">{t('common.en')}</option>
              <option value="ar">{t('common.ar')}</option>
            </select>
          </Field>
          <Field label={t('templates.editor.direction')}>
            <select
              value={form.direction}
              onChange={(e) => set('direction', e.target.value as 'rtl' | 'ltr')}
              className="h-11 w-full rounded-md border border-border bg-surface px-3 text-ink"
            >
              <option value="ltr">{t('common.ltr')}</option>
              <option value="rtl">{t('common.rtl')}</option>
            </select>
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-token-4 sm:grid-cols-2">
          <Field label={t('templates.editor.status')}>
            <select
              value={form.status}
              onChange={(e) => set('status', e.target.value)}
              className="h-11 w-full rounded-md border border-border bg-surface px-3 text-ink"
            >
              <option value="draft">{t('templates.statusDraft')}</option>
              <option value="published">{t('templates.statusPublished')}</option>
              <option value="archived">{t('templates.statusArchived')}</option>
            </select>
          </Field>
          <div className="flex flex-col justify-end gap-token-2">
            <Toggle
              checked={form.isPaid}
              onChange={(v) => set('isPaid', v)}
              label={t('templates.editor.isPaid')}
            />
            {form.isPaid ? (
              <Field label={t('templates.editor.price')} hint={t('templates.editor.priceHint')}>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.priceEgp}
                  onChange={(e) => set('priceEgp', e.target.value)}
                  dir="ltr"
                />
              </Field>
            ) : null}
          </div>
        </div>

        <Field
          label={t('templates.editor.definition')}
          hint={t('templates.editor.definitionHint')}
        >
          <div className="mb-token-2 flex justify-end">
            <Button type="button" variant="ghost" size="sm" onClick={formatJson}>
              {t('templates.editor.format')}
            </Button>
          </div>
          <textarea
            value={form.definitionText}
            onChange={(e) => set('definitionText', e.target.value)}
            onBlur={() => validateDefinition()}
            spellCheck={false}
            dir="ltr"
            rows={18}
            className="w-full rounded-md border border-border bg-backdrop px-3 py-2 font-mono text-xs leading-relaxed text-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          />
          {jsonError ? <p className="mt-token-2 text-sm text-danger">{jsonError}</p> : null}
        </Field>
      </div>
    </Drawer>
  );
}
