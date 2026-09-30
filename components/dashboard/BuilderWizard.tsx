'use client';

import * as React from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { Button, Input, Spinner } from '@/components/ui';
import { dashboardApi } from './api-client';
import type { EditorExperience, AppLocale } from './types';
import {
  seedSteps,
  type LocalStep,
  toStepUpserts,
} from './editor-state';
import { useAutosave } from './useAutosave';
import { StepWizardHeader } from './wizard/StepWizardHeader';
import { DetailsStep } from './wizard/DetailsStep';
import { ContentStep } from './wizard/ContentStep';
import { ReviewStep } from './wizard/ReviewStep';

type WizardStep = 'details' | 'content' | 'review';
const ORDER: WizardStep[] = ['details', 'content', 'review'];

export function BuilderWizard({
  experience: initial,
  initialStep = 'details',
}: {
  experience: EditorExperience;
  initialStep?: WizardStep;
}) {
  const t = useTranslations('dashboard.wizard');
  const router = useRouter();
  const locale = useLocale() as AppLocale;

  const [step, setStep] = React.useState<WizardStep>(initialStep);
  const [recipientName, setRecipientName] = React.useState(initial.recipientName ?? '');
  const [title, setTitle] = React.useState(initial.title ?? '');
  const [expLocale, setExpLocale] = React.useState<AppLocale>(initial.locale);
  const [steps, setSteps] = React.useState<LocalStep[]>(() => seedSteps(initial));
  // Card-level details (couple's names, wedding date…), asked once.
  const [fields, setFields] = React.useState<Record<string, string>>(() => initial.fields ?? {});
  const [saveError, setSaveError] = React.useState<string | null>(null);

  // Experience meta (title/recipient/locale) lives at the experience level.
  const experience = React.useMemo<EditorExperience>(
    () => ({
      ...initial,
      recipientName,
      title,
      locale: expLocale,
      direction: expLocale === 'ar' ? 'rtl' : 'ltr',
      fields,
    }),
    [initial, recipientName, title, expLocale, fields],
  );

  /* ── autosave: experience meta ── */
  const meta = React.useMemo(
    () => ({ title, recipientName, locale: expLocale, fields }),
    [title, recipientName, expLocale, fields],
  );
  const metaSave = useAutosave(meta, async (m) => {
    await dashboardApi.patchExperience(initial.id, {
      title: m.title,
      recipientName: m.recipientName,
      locale: m.locale,
      ...(Object.keys(m.fields).length ? { fields: m.fields } : {}),
    });
  });

  /* ── autosave: steps ── */
  const stepsSave = useAutosave(steps, async (s) => {
    await dashboardApi.putSteps(initial.id, toStepUpserts(s));
  });

  const saveState =
    metaSave.state === 'saving' || stepsSave.state === 'saving'
      ? 'saving'
      : metaSave.state === 'error' || stepsSave.state === 'error'
        ? 'error'
        : 'saved';

  /**
   * Save everything, and THROW if any of it failed. Previously this used
   * allSettled and swallowed failures, so Next / Save & exit / Publish carried
   * on as if the edits were saved — they were not.
   */
  const flushAll = React.useCallback(async () => {
    const [a, b] = await Promise.all([metaSave.flush(), stepsSave.flush()]);
    if (!a || !b) {
      const message = t('saveFailed');
      setSaveError(message);
      throw new Error(message);
    }
    setSaveError(null);
  }, [metaSave, stepsSave, t]);

  // Surface a background autosave failure too, not only the ones on Next.
  const bgError = metaSave.state === 'error' || stepsSave.state === 'error';
  const shownError = saveError ?? (bgError ? t('saveFailed') : null);

  const updateStep = React.useCallback((stepId: string, updater: (s: LocalStep) => LocalStep) => {
    setSteps((prev) => prev.map((s) => (s.templateStepId === stepId ? updater(s) : s)));
  }, []);

  const goNext = async () => {
    const idx = ORDER.indexOf(step);
    if (idx < ORDER.length - 1) {
      try {
        await flushAll();
      } catch {
        return; // stay put — the error banner explains why
      }
      setStep(ORDER[idx + 1]);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };
  const goBack = () => {
    const idx = ORDER.indexOf(step);
    if (idx > 0) {
      setStep(ORDER[idx - 1]);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const exit = async () => {
    try {
      await flushAll();
    } catch {
      return;
    }
    router.push('/dashboard');
  };

  const jumpTo = async (target: WizardStep) => {
    try {
      await flushAll();
    } catch {
      return;
    }
    setStep(target);
  };

  return (
    <div>
      <StepWizardHeader
        current={step}
        order={ORDER}
        saveState={saveState}
        onExit={exit}
        onStep={(s) => void jumpTo(s)}
      />

      {shownError ? (
        <div
          role="alert"
          className="mt-token-4 flex items-center justify-between gap-token-3 rounded-lg border border-danger/40 bg-danger/10 px-token-4 py-token-3 text-sm text-danger"
        >
          <span>{shownError}</span>
          <Button size="sm" variant="secondary" onClick={() => void flushAll().catch(() => {})}>
            {t('retrySave')}
          </Button>
        </div>
      ) : null}

      <div className="mt-token-6">
        {step === 'details' ? (
          <DetailsStep
            recipientName={recipientName}
            title={title}
            locale={expLocale}
            isPaidTemplate={initial.isPaid}
            onRecipient={setRecipientName}
            onTitle={setTitle}
            onLocale={setExpLocale}
            fieldDefs={initial.fieldDefs ?? []}
            fields={fields}
            onField={(key, value) => setFields((prev) => ({ ...prev, [key]: value }))}
          />
        ) : null}

        {step === 'content' ? (
          <ContentStep
            experience={experience}
            steps={steps}
            recipientName={recipientName}
            onUpdateStep={updateStep}
          />
        ) : null}

        {step === 'review' ? (
          <ReviewStep
            experience={experience}
            steps={steps}
            recipientName={recipientName}
            onBeforePublish={flushAll}
          />
        ) : null}
      </div>

      {step !== 'review' ? (
        <div className="sticky bottom-0 mt-token-8 flex items-center justify-between gap-token-3 border-t border-border bg-surface-2/90 py-token-4 backdrop-blur">
          <Button
            variant="ghost"
            onClick={goBack}
            disabled={ORDER.indexOf(step) === 0}
          >
            {t('back')}
          </Button>
          <div className="flex items-center gap-token-3">
            {saveState === 'saving' ? (
              <span className="flex items-center gap-token-2 text-xs text-muted">
                <Spinner size={14} /> {t('saving')}
              </span>
            ) : null}
            <Button onClick={goNext}>{t('next')}</Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
