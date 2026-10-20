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
  darkSlots,
  withDarkSlots,
} from './editor-state';
import { useAutosave } from './useAutosave';
import type { CardMusic } from './MusicUpload';
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
  // The sender's own song. Saved by its upload (a media row), not by autosave.
  const [music, setMusic] = React.useState<CardMusic | null>(() =>
    initial.musicUrl && initial.musicMediaId ? { url: initial.musicUrl, mediaId: initial.musicMediaId } : null,
  );

  // Experience meta (title/recipient/locale) lives at the experience level.
  const experience = React.useMemo<EditorExperience>(
    () => ({
      ...initial,
      recipientName,
      title,
      locale: expLocale,
      direction: expLocale === 'ar' ? 'rtl' : 'ltr',
      fields,
      musicUrl: music?.url ?? null,
      musicMediaId: music?.mediaId ?? null,
    }),
    [initial, recipientName, title, expLocale, fields, music],
  );

  /* ── autosave: experience meta ── */
  const meta = React.useMemo(
    () => ({ title, recipientName, locale: expLocale, fields }),
    [title, recipientName, expLocale, fields],
  );
  const metaSave = useAutosave(meta, async (m) => {
    await dashboardApi.patchExperience(initial.id, {
      title: m.title.trim() || null,
      recipientName: m.recipientName.trim() || null,
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

  /**
   * Switching the card's language rewrites every piece of text the sender has
   * not touched into the new language's default (edited text is theirs and is
   * kept). Without this, picking Arabic flipped the layout to right-to-left
   * and left the English wording in it.
   */
  const changeLocale = (next: AppLocale) => {
    if (next === expLocale) return;
    const pick = (x: { defaultAr?: string; defaultEn?: string }, l: AppLocale) =>
      l === 'ar' ? x.defaultAr : x.defaultEn;
    const swap = (value: string | undefined, x: { defaultAr?: string; defaultEn?: string }) => {
      const to = pick(x, next);
      if (to == null) return value;
      return value == null || value === '' || value === pick(x, expLocale) ? to : value;
    };
    const sceneById = new Map(initial.scenes.map((sc) => [sc.id, sc]));
    setSteps((prev) =>
      prev.map((s) => {
        const scene = sceneById.get(s.templateStepId);
        if (!scene) return s;
        const text = { ...s.text };
        for (const slot of scene.slots) {
          if (slot.type !== 'text' || slot.bind) continue;
          const v = swap(text[slot.key], slot);
          if (v != null) text[slot.key] = v;
        }
        return { ...s, text };
      }),
    );
    setFields((prev) => {
      const out = { ...prev };
      for (const f of initial.fieldDefs ?? []) {
        if (f.type !== 'text') continue;
        const v = swap(out[f.key], f);
        if (v != null) out[f.key] = v;
      }
      return out;
    });
    setExpLocale(next);
  };

  const updateStep = React.useCallback((stepId: string, updater: (s: LocalStep) => LocalStep) => {
    setSteps((prev) => prev.map((s) => (s.templateStepId === stepId ? updater(s) : s)));
  }, []);

  /**
   * A card-level field (the couple's names…) shows wherever a scene slot binds
   * to it, so its "darker" switch flips every one of those slots. A field is
   * shown as darker when all its slots are; a field no slot binds (or a date)
   * gets no switch.
   */
  const fieldSlots = React.useMemo(() => {
    const map = new Map<string, Array<{ sceneId: string; key: string }>>();
    for (const sc of initial.scenes) {
      for (const sl of sc.slots) {
        if (sl.type !== 'text' || !sl.bind) continue;
        const list = map.get(sl.bind) ?? [];
        list.push({ sceneId: sc.id, key: sl.key });
        map.set(sl.bind, list);
      }
    }
    return map;
  }, [initial.scenes]);
  const darkFields = React.useMemo(() => {
    const out: Record<string, boolean | null> = {};
    const stepById = new Map(steps.map((s) => [s.templateStepId, s]));
    for (const f of initial.fieldDefs ?? []) {
      const slots = fieldSlots.get(f.key);
      if (f.type !== 'text' || !slots?.length) {
        out[f.key] = null;
        continue;
      }
      out[f.key] = slots.every(({ sceneId, key }) => {
        const st = stepById.get(sceneId);
        return st ? darkSlots(st).includes(key) : false;
      });
    }
    return out;
  }, [initial.fieldDefs, fieldSlots, steps]);
  const setFieldDark = (fieldKey: string, on: boolean) => {
    const slots = fieldSlots.get(fieldKey) ?? [];
    setSteps((prev) =>
      prev.map((s) => {
        const keys = slots.filter((x) => x.sceneId === s.templateStepId).map((x) => x.key);
        return keys.length ? withDarkSlots(s, keys, on) : s;
      }),
    );
  };

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
            onLocale={changeLocale}
            fieldDefs={initial.fieldDefs ?? []}
            isInvitation={initial.scenes.some((sc) => sc.type === 'Rsvp' || sc.type === 'Families')}
            fields={fields}
            onField={(key, value) => setFields((prev) => ({ ...prev, [key]: value }))}
            darkFields={darkFields}
            onFieldDark={setFieldDark}
          />
        ) : null}

        {step === 'content' ? (
          <ContentStep
            experience={experience}
            steps={steps}
            recipientName={recipientName}
            onUpdateStep={updateStep}
            music={music}
            onMusic={setMusic}
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
