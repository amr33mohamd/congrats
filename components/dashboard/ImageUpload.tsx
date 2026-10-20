'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { Button, Spinner } from '@/components/ui';
import { uploadAndConfirm, dashboardApi, mediaTypeOf } from './api-client';
import type { LocalMedia } from './editor-state';

/** Matches MAX_VIDEO_BYTES on the server (server/dashboard/schemas.ts). */
const MAX_VIDEO_MB = 30;

/**
 * Single-photo slot uploader. The uploaded media is tagged with the stable
 * scene id (`templateStepId`) + `slotKey` so the binder files it under the
 * right slot and it survives step-row replacement. Replacing/removing a photo
 * best-effort deletes the previous media row so a slot never accrues orphans.
 *
 * With `allowVideo` the slot also takes a short video, which the card plays
 * muted and looping in place of the photo.
 */
export function ImageUpload({
  value,
  experienceId,
  templateStepId,
  slotKey,
  aspect,
  allowVideo = false,
  onChange,
}: {
  value?: LocalMedia;
  experienceId: string;
  templateStepId: string;
  slotKey: string;
  aspect?: string;
  allowVideo?: boolean;
  onChange: (media: LocalMedia | null) => void;
}) {
  const t = useTranslations('dashboard.wizard.content');
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState(false);
  const [localUrl, setLocalUrl] = React.useState<string | null>(null);
  const [localIsVideo, setLocalIsVideo] = React.useState(false);
  const [progress, setProgress] = React.useState<number | null>(null);

  const pick = () => inputRef.current?.click();

  const deletePrevious = async (mediaId?: string) => {
    if (!mediaId) return;
    try {
      await dashboardApi.deleteMedia(mediaId);
    } catch {
      /* orphan rows are harmless; the new media binds under the same slot */
    }
  };

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const type = mediaTypeOf(file);
    if (type !== 'image' && !(allowVideo && type === 'video')) {
      setError(true);
      return;
    }
    const isVideo = type === 'video';
    if (isVideo && file.size > MAX_VIDEO_MB * 1024 * 1024) {
      setError(true);
      return;
    }
    setError(false);
    setBusy(true);
    setProgress(null);
    // Optimistic local preview.
    const preview = URL.createObjectURL(file);
    setLocalUrl(preview);
    setLocalIsVideo(isVideo);
    const previousMediaId = value?.mediaId;
    try {
      const media = await uploadAndConfirm(
        file,
        {
          kind: 'step_image',
          experienceId,
          templateStepId,
          slotKey,
        },
        setProgress,
      );
      await deletePrevious(previousMediaId);
      onChange({
        slot: slotKey,
        url: media.url,
        mediaId: media.id,
        width: media.width,
        height: media.height,
        ...((media.mime ? media.mime.startsWith('video/') : isVideo) ? { video: true } : {}),
      });
    } catch {
      // The upload failed, so the card would not have it: say so and keep
      // whatever was in the slot before.
      setLocalUrl(null);
      setError(true);
    } finally {
      setBusy(false);
      setProgress(null);
    }
  };

  const shown = value?.url ?? localUrl;
  const shownIsVideo = value ? Boolean(value.video) : localIsVideo;
  const aspectClass = aspect === '1:1' ? 'aspect-square' : aspect === '16:9' ? 'aspect-video' : 'aspect-[3/4]';

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept={allowVideo ? 'image/*,video/mp4,video/quicktime,video/webm' : 'image/*'}
        className="sr-only"
        onChange={onFile}
        aria-label={allowVideo ? t('uploadMedia') : t('upload')}
      />
      {shown ? (
        <div className="flex items-start gap-token-3">
          <div className={`relative w-24 overflow-hidden rounded-lg border border-border ${aspectClass}`}>
            {shownIsVideo ? (
              <video src={shown} className="h-full w-full object-cover" autoPlay muted loop playsInline />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={shown} alt="" className="h-full w-full object-cover" />
            )}
            {busy ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-token-1 bg-black/40 text-xs text-white">
                <Spinner size={18} />
                {progress != null ? <span>{Math.round(progress * 100)}%</span> : null}
              </div>
            ) : null}
          </div>
          <div className="flex flex-col gap-token-2">
            <Button size="sm" variant="secondary" onClick={pick} disabled={busy}>
              {t('replace')}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                void deletePrevious(value?.mediaId);
                setLocalUrl(null);
                onChange(null);
              }}
              disabled={busy}
            >
              {t('remove')}
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={pick}
          disabled={busy}
          className="flex w-full flex-col items-center justify-center gap-token-2 rounded-lg border border-dashed border-border bg-surface-2 p-token-6 text-muted transition-colors hover:border-brand hover:text-brand disabled:opacity-60"
        >
          {busy ? <Spinner size={20} /> : <span aria-hidden className="text-2xl">{allowVideo ? '🖼️🎬' : '🖼️'}</span>}
          <span className="text-sm font-medium">
            {busy
              ? progress != null
                ? t('uploadProgress', { percent: Math.round(progress * 100) })
                : t('uploading')
              : allowVideo
                ? t('uploadMedia')
                : t('upload')}
          </span>
        </button>
      )}
      {allowVideo ? <p className="mt-token-2 text-xs text-muted">{t('videoHint', { mb: MAX_VIDEO_MB })}</p> : null}
      {error ? (
        <p role="alert" className="mt-token-2 text-xs text-danger">
          {t('uploadFailed')}
        </p>
      ) : null}
    </div>
  );
}
