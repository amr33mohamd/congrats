'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/components/ui/cn';

/**
 * The "darker" switch beside a text field: shows that field's text on the
 * card in a darker shade of its colour (Player: inkFor / darken), for text
 * that reads too light on its background.
 */
export function DarkerToggle({ on, onChange }: { on: boolean; onChange: (on: boolean) => void }) {
  const t = useTranslations('dashboard.wizard.content');
  return (
    <button
      type="button"
      // Keep focus in the field being typed in.
      onMouseDown={(e) => e.preventDefault()}
      onClick={() => onChange(!on)}
      aria-pressed={on}
      title={t('darkerHint')}
      className={cn(
        'inline-flex shrink-0 items-center gap-token-1 whitespace-nowrap rounded-md border px-token-2 py-0.5 text-xs font-medium transition-colors',
        on ? 'border-ink bg-ink text-surface' : 'border-border text-muted hover:border-brand hover:text-brand',
      )}
    >
      <span aria-hidden className="inline-block h-2.5 w-2.5 rounded-full bg-current" />
      {t('darker')}
    </button>
  );
}
