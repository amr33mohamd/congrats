'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { Button, Spinner } from '@/components/ui';
import { uploadAndConfirm, dashboardApi, mediaTypeOf } from './api-client';

/** Matches MAX_AUDIO_BYTES on the server (server/dashboard/schemas.ts). */
const MAX_AUDIO_MB = 15;

export interface CardMusic {
  url: string;
  mediaId: string;
}

/**
 * The card's own song. Uploading one replaces the template's music for the
 * whole card (the newest 'music' media row wins, see latestMusic); removing it
 * goes back to the template's track. A replaced song's row is deleted
 * best-effort so the card never carries stale uploads.
 */
export function MusicUpload({
  experienceId,
  value,
  templateHasMusic,
  onChange,
}: {
  experienceId: string;
  value: CardMusic | null;
  templateHasMusic: boolean;
  onChange: (music: CardMusic | null) => void;
}) {
  const t = useTranslations('dashboard.wizard.content');
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [busy, setBusy] = React.useState(false);
  const [progress, setProgress] = React.useState<number | null>(null);
  const [error, setError] = React.useState(false);

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (mediaTypeOf(file) !== 'audio' || file.size > MAX_AUDIO_MB * 1024 * 1024) {
      setError(true);
      return;
    }
    setError(false);
    setBusy(true);
    setProgress(null);
    const previous = value?.mediaId;
    try {
      const media = await uploadAndConfirm(file, { kind: 'music', experienceId }, setProgress);
      if (previous) await dashboardApi.deleteMedia(previous).catch(() => undefined);
      onChange({ url: media.url, mediaId: media.id });
    } catch {
      setError(true);
    } finally {
      setBusy(false);
      setProgress(null);
    }
  };

  const remove = () => {
    if (value?.mediaId) dashboardApi.deleteMedia(value.mediaId).catch(() => undefined);
    onChange(null);
  };

  const status = value ? t('musicYours') : templateHasMusic ? t('musicTemplate') : t('musicNone');

  return (
    <div className="mb-token-4 rounded-xl border border-border bg-surface p-token-4 shadow-[var(--shadow-card)]">
      <input
        ref={inputRef}
        type="file"
        accept="audio/*,.mp3,.m4a,.aac,.ogg,.wav"
        className="sr-only"
        onChange={onFile}
        aria-label={t('musicUpload')}
      />
      <div className="flex flex-wrap items-center justify-between gap-token-3">
        <div>
          <p className="text-sm font-semibold text-ink">
            <span aria-hidden>🎵 </span>
            {t('musicTitle')}
          </p>
          <p className="text-xs text-muted">{status}</p>
        </div>
        <div className="flex flex-wrap gap-token-2">
          <Button size="sm" variant="secondary" onClick={() => inputRef.current?.click()} disabled={busy}>
            {busy ? (
              <span className="flex items-center gap-token-2">
                <Spinner size={14} />
                {progress != null ? t('uploadProgress', { percent: Math.round(progress * 100) }) : t('uploading')}
              </span>
            ) : value ? (
              t('musicReplace')
            ) : (
              t('musicUpload')
            )}
          </Button>
          {value ? (
            <Button size="sm" variant="ghost" onClick={remove} disabled={busy}>
              {templateHasMusic ? t('musicRemove') : t('remove')}
            </Button>
          ) : null}
        </div>
      </div>
      <p className="mt-token-2 text-xs text-muted">{t('musicHint', { mb: MAX_AUDIO_MB })}</p>
      {error ? (
        <p role="alert" className="mt-token-2 text-xs text-danger">
          {t('uploadFailed')}
        </p>
      ) : null}
    </div>
  );
}
