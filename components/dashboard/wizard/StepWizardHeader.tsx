'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/components/ui/cn';
import type { SaveState } from '../useAutosave';

type WizardStep = 'details' | 'content' | 'review';

export function StepWizardHeader({
  current,
  order,
  saveState,
  onExit,
  onStep,
}: {
  current: WizardStep;
  order: WizardStep[];
  saveState: SaveState;
  onExit: () => void;
  onStep: (s: WizardStep) => void;
}) {
  const t = useTranslations('dashboard.wizard');
  const currentIdx = order.indexOf(current);

  return (
    <div>
      <div className="flex items-center justify-between gap-token-4">
        <ol className="flex flex-1 items-center gap-token-2">
          {order.map((s, i) => {
            const done = i < currentIdx;
            const active = i === currentIdx;
            return (
              <li key={s} className="flex flex-1 items-center gap-token-2">
                <button
                  type="button"
                  onClick={() => (i <= currentIdx ? onStep(s) : undefined)}
                  disabled={i > currentIdx}
                  className={cn(
                    'flex items-center gap-token-2 rounded-pill px-token-2 py-token-1 text-sm font-medium transition-colors',
                    active
                      ? 'text-ink'
                      : done
                        ? 'text-brand-strong'
                        : 'text-muted',
                  )}
                >
                  <span
                    className={cn(
                      'flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold',
                      active
                        ? 'bg-brand text-white'
                        : done
                          ? 'bg-brand/15 text-brand-strong'
                          : 'bg-surface-2 text-muted',
                    )}
                  >
                    {done ? '✓' : i + 1}
                  </span>
                  <span className="hidden sm:inline">{t(`steps.${s}`)}</span>
                </button>
                {i < order.length - 1 ? (
                  <span
                    className={cn(
                      'h-px flex-1',
                      i < currentIdx ? 'bg-brand/40' : 'bg-border',
                    )}
                  />
                ) : null}
              </li>
            );
          })}
        </ol>

        <button
          type="button"
          onClick={onExit}
          className="shrink-0 rounded-md px-token-2 py-token-1 text-sm font-medium text-muted transition-colors hover:bg-surface hover:text-ink"
        >
          {t('exit')}
        </button>
      </div>

      <div className="mt-token-3 h-5">
        {saveState === 'saving' ? (
          <span className="text-xs text-muted">{t('saving')}</span>
        ) : saveState === 'error' ? (
          <span className="text-xs text-warning">{t('saveError')}</span>
        ) : saveState === 'saved' ? (
          <span className="text-xs text-success">{t('saved')}</span>
        ) : null}
      </div>
    </div>
  );
}
