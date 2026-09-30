'use client';

import * as React from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Input, Textarea, Badge } from '@/components/ui';
import { cn } from '@/components/ui/cn';
import type { EditorExperience } from '../types';
import {
  editableScenes,
  type LocalStep,
  type LocalMedia,
} from '../editor-state';
import { isStepHidden } from '@/lib/template-contract';
import { ImageUpload } from '../ImageUpload';
import { MultiImageUpload } from '../MultiImageUpload';
import { BuilderPreview } from '../BuilderPreview';

export function ContentStep({
  experience,
  steps,
  recipientName,
  onUpdateStep,
}: {
  experience: EditorExperience;
  steps: LocalStep[];
  recipientName: string;
  onUpdateStep: (stepId: string, updater: (s: LocalStep) => LocalStep) => void;
}) {
  const t = useTranslations('dashboard.wizard.content');
  const tScene = useTranslations('dashboard.sceneTypes');
  const uiLocale = useLocale();
  const slotLabel = (slot: { labelEn?: string; labelAr?: string }, fallback: string) =>
    (uiLocale === 'ar' ? slot.labelAr : slot.labelEn) ?? slot.labelEn ?? slot.labelAr ?? fallback;
  // Scene type ids ("Families", "Rsvp") are engine names, not copy.
  const sceneName = (type: string) => (tScene.has(type) ? tScene(type) : type);
  const scenes = React.useMemo(() => editableScenes(experience, steps), [experience, steps]);
  const [activeIdx, setActiveIdx] = React.useState(0);

  const active = scenes[activeIdx];
  if (!active) return null;

  const hidden = isStepHidden(active.step);
  const setHidden = (value: boolean) =>
    onUpdateStep(active.scene.id, (s) => ({
      ...s,
      animationConfig: { ...s.animationConfig, hidden: value },
    }));

  const setText = (key: string, value: string) =>
    onUpdateStep(active.scene.id, (s) => ({ ...s, text: { ...s.text, [key]: value } }));

  // Single-image slot: at most one media under the slot key (replace semantics).
  const setMedia = (slotKey: string, media: LocalMedia | null) =>
    onUpdateStep(active.scene.id, (s) => ({
      ...s,
      media: media
        ? [...s.media.filter((m) => m.slot !== slotKey), media]
        : s.media.filter((m) => m.slot !== slotKey),
    }));

  // Multi-image (gallery) slot: append one media, preserving the others.
  const addMedia = (media: LocalMedia) =>
    onUpdateStep(active.scene.id, (s) => ({ ...s, media: [...s.media, media] }));

  // Remove a single media from a multi-image slot by its position within the slot.
  const removeMediaAt = (slotKey: string, indexInSlot: number) =>
    onUpdateStep(active.scene.id, (s) => {
      let seen = -1;
      return {
        ...s,
        media: s.media.filter((m) => {
          if (m.slot !== slotKey) return true;
          seen += 1;
          return seen !== indexInSlot;
        }),
      };
    });

  return (
    <div>
      <div className="mb-token-4">
        <h2 className="font-heading text-2xl font-bold text-ink">{t('title')}</h2>
        <p className="mt-token-1 text-muted">{t('subtitle')}</p>
      </div>

      <div className="grid gap-token-8 lg:grid-cols-[1fr_320px]">
        {/* ── Editor column ── */}
        <div>
          {/* scene tabs */}
          <div className="mb-token-4 flex flex-wrap gap-token-2" role="tablist">
            {scenes.map((sc, i) => (
              <button
                key={sc.scene.id}
                role="tab"
                aria-selected={i === activeIdx}
                onClick={() => setActiveIdx(i)}
                title={isStepHidden(sc.step) ? t('sectionHidden') : undefined}
                className={cn(
                  'rounded-pill border px-token-3 py-token-1 text-sm font-medium transition-colors',
                  i === activeIdx
                    ? 'border-brand bg-brand text-white'
                    : 'border-border bg-surface text-muted hover:border-brand/40',
                  isStepHidden(sc.step) && 'line-through opacity-50',
                )}
              >
                {i + 1}
              </button>
            ))}
          </div>

          <div className="rounded-xl border border-border bg-surface p-token-6 shadow-[var(--shadow-card)]">
            <p className="text-xs font-medium uppercase tracking-wide text-muted">
              {t('stepLabel', { index: activeIdx + 1, total: scenes.length })}
            </p>
            <div className="mt-token-1 flex items-center justify-between gap-token-3">
              <h3 className="font-heading text-lg font-semibold text-ink">
                {sceneName(active.scene.type)}
              </h3>
              <label className="flex shrink-0 cursor-pointer items-center gap-token-2 text-sm text-muted">
                <input
                  type="checkbox"
                  role="switch"
                  className="h-4 w-4 accent-[var(--color-brand)]"
                  checked={!hidden}
                  onChange={(e) => setHidden(!e.target.checked)}
                />
                {t('showSection')}
              </label>
            </div>

            {hidden ? (
              <p className="mt-token-4 rounded-md bg-surface-2 px-token-3 py-token-2 text-sm text-muted">
                {t('sectionHiddenHint')}
              </p>
            ) : null}

            <div className={cn('mt-token-6 flex flex-col gap-token-6', hidden && 'pointer-events-none opacity-40')} aria-disabled={hidden || undefined}>
              {active.textSlots.map((slot) => {
                const value = active.step.text[slot.key] ?? '';
                const remaining = slot.maxLen ? slot.maxLen - value.length : null;
                const multiline = (slot.maxLen ?? 0) > 60 || slot.key === 'body';
                return (
                  <div key={slot.key}>
                    <div className="mb-token-2 flex items-center justify-between">
                      <label
                        htmlFor={`slot-${slot.key}`}
                        className="text-sm font-medium text-ink"
                      >
                        {slotLabel(slot, t('textLabel'))}
                        {slot.required ? (
                          <Badge tone="neutral" className="ms-token-2">
                            {t('required')}
                          </Badge>
                        ) : null}
                      </label>
                      {remaining != null ? (
                        <span
                          className={cn(
                            'text-xs',
                            remaining < 0 ? 'text-danger' : 'text-muted',
                          )}
                        >
                          {t('charsLeft', { count: remaining })}
                        </span>
                      ) : null}
                    </div>
                    {multiline ? (
                      <Textarea
                        id={`slot-${slot.key}`}
                        value={value}
                        maxLength={slot.maxLen}
                        onChange={(e) => setText(slot.key, e.target.value)}
                      />
                    ) : (
                      <Input
                        id={`slot-${slot.key}`}
                        value={value}
                        maxLength={slot.maxLen}
                        onChange={(e) => setText(slot.key, e.target.value)}
                      />
                    )}
                  </div>
                );
              })}

              {active.dateSlots.map((slot) => (
                <div key={slot.key}>
                  <label
                    htmlFor={`slot-${slot.key}`}
                    className="mb-token-2 block text-sm font-medium text-ink"
                  >
                    {slotLabel(slot, t('dateLabel'))}
                  </label>
                  <Input
                    id={`slot-${slot.key}`}
                    type="datetime-local"
                    value={active.step.text[slot.key] ?? ''}
                    onChange={(e) => setText(slot.key, e.target.value)}
                  />
                </div>
              ))}

              {active.imageSlots.map((slot) => {
                // An image slot with max > 1 is a gallery: multiple photos under
                // the same slot key. Otherwise it's a single-photo slot.
                const isMulti = (slot.max ?? 1) > 1;
                const slotMedia = active.step.media.filter((m) => m.slot === slot.key);
                return (
                  <div key={slot.key}>
                    <span className="mb-token-2 block text-sm font-medium text-ink">
                      {t('imageLabel')}
                      {slot.required ? (
                        <Badge tone="neutral" className="ms-token-2">
                          {t('required')}
                        </Badge>
                      ) : null}
                    </span>
                    {isMulti ? (
                      <MultiImageUpload
                        values={slotMedia}
                        experienceId={experience.id}
                        templateStepId={active.scene.id}
                        slotKey={slot.key}
                        aspect={slot.aspect}
                        max={slot.max ?? 6}
                        onAdd={addMedia}
                        onRemoveAt={(i) => removeMediaAt(slot.key, i)}
                      />
                    ) : (
                      <ImageUpload
                        value={slotMedia[0]}
                        experienceId={experience.id}
                        templateStepId={active.scene.id}
                        slotKey={slot.key}
                        aspect={slot.aspect}
                        onChange={(m) => setMedia(slot.key, m)}
                      />
                    )}
                  </div>
                );
              })}

              {active.textSlots.length === 0 &&
              active.imageSlots.length === 0 &&
              active.dateSlots.length === 0 ? (
                <p className="text-sm text-muted">{sceneName(active.scene.type)}</p>
              ) : null}

              {active.textSlots.length > 0 ? (
                <p className="rounded-md bg-surface-2 px-token-3 py-token-2 text-xs text-muted">
                  {t('tokenHint')}
                </p>
              ) : null}
            </div>
          </div>
        </div>

        {/* ── Live preview column ── */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <p className="mb-token-3 text-center text-sm font-medium text-ink">
            {t('previewTitle')}
          </p>
          <BuilderPreview
            experience={experience}
            steps={steps}
            recipientName={recipientName}
            focusStepId={active.scene.id}
          />
          <p className="mt-token-3 text-center text-xs text-muted">{t('previewHint')}</p>
        </div>
      </div>
    </div>
  );
}
