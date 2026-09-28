'use client';

/**
 * In-drawer experience preview. Reuses the shared Player. Because the Player is
 * a full-screen surface, we render it inside an opt-in fullscreen overlay so the
 * reviewer can play through the exact experience the buyer built.
 */
import * as React from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui';
import { Player } from '@/components/player';
import { safeParseBoundExperience, type BoundExperience } from '@/lib/template-contract';

export function ExperiencePreview({ experience }: { experience: unknown }) {
  const t = useTranslations('admin');
  const [open, setOpen] = React.useState(false);

  const parsed = React.useMemo(() => {
    const res = safeParseBoundExperience(experience);
    return res.success ? (res.data as BoundExperience) : null;
  }, [experience]);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  if (!parsed) {
    return (
      <div className="flex h-32 items-center justify-center rounded-md border border-dashed border-border bg-surface-2 text-sm text-muted">
        {t('common.none')}
      </div>
    );
  }

  return (
    <div>
      <p className="mb-token-2 text-xs text-muted">{t('queue.drawer.previewHint')}</p>
      <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>
        ▶ {t('queue.drawer.openPreview')}
      </Button>

      {open ? (
        <div className="fixed inset-0 z-[60] bg-black">
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label={t('common.close')}
            className="absolute top-0 end-0 z-40 m-token-4 rounded-pill border border-border bg-surface/90 px-token-4 py-token-2 text-sm font-medium text-ink backdrop-blur-sm shadow-[var(--shadow-pop)]"
          >
            ✕
          </button>
          {/* Embedded: the one-page card scrolls inside this overlay instead of
              pinning its fixed layers to the window behind it. */}
          <Player experience={parsed} startPaused embedded />
        </div>
      ) : null}
    </div>
  );
}
