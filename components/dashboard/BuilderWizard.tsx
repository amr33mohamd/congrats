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

  // Experience meta (title/recipient/locale) lives at the experience level.
  const experience = React.useMemo<EditorExperience>(
    () => ({
      ...initial,
      recipientName,
      title,
      locale: expLocale,
      direction: expLocale === 'ar' ? 'rtl' : 'ltr',
    }),
    [initial, recipientName, title, expLocale],
  );

  /* ── autosave: experience meta ── */
  const meta = React.useMemo(
    () => ({ title, recipientName, locale: expLocale }),
    [title, recipientName, expLocale],
  );
  const metaSave = useAutosave(meta, async (m) => {
    await dashboardApi.patchExperience(initial.id, {
      title: m.title,
      recipientName: m.recipientName,
      locale: m.locale,
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

  const flushAll = React.useCallback(async () => {
    await Promise.allSettled([metaSave.flush(), stepsSave.flush()]);
  }, [metaSave, stepsSave]);

  const updateStep = React.useCallback((stepId: string, updater: (s: LocalStep) => LocalStep) => {
    setSteps((prev) => prev.map((s) => (s.templateStepId === stepId ? updater(s) : s)));
  }, []);

  const goNext = async () => {
    const idx = ORDER.indexOf(step);
    if (idx < ORDER.length - 1) {
      await flushAll();
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
    await flushAll();
    router.push('/dashboard');
  };

  return (
    <div>
      <StepWizardHeader
        current={step}
        order={ORDER}
        saveState={saveState}
        onExit={exit}
        onStep={(s) => setStep(s)}
      />

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
