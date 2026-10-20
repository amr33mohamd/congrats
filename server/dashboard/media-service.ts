/**
 * Media service — the two-phase upload flow + delete.
 *
 *  1. `signMedia`    : validate mime/size + ownership, mint an upload target
 *                      (bucket + key + signed PUT-ish URL) WITHOUT a DB row.
 *  2. `confirmMedia` : after the client uploads bytes to the key, persist the
 *                      `media` row (kind/dimensions/bytes). Re-verifies the
 *                      object exists + ownership before recording it.
 *
 * Buckets: experience photos → 'experience-media'; payment screenshots →
 * 'payment-proofs'. Ownership is enforced by deriving keys from the session
 * userId — a client can never write under another user's prefix.
 */
import { nanoid } from 'nanoid';
import type { UserContext } from '@/server/db-context';
import {
  getStorage,
  storageDriver,
  experienceMediaKey,
  paymentProofKey,
  isWellFormedMediaKey,
  type StorageBucket,
} from '@/server/storage';
import type { Media } from '@/db/schema';
import { DashboardError } from './errors';
import {
  ALLOWED_IMAGE_MIME,
  ALLOWED_VIDEO_MIME,
  ALLOWED_AUDIO_MIME,
  MAX_MEDIA_BYTES,
  MAX_VIDEO_BYTES,
  MAX_AUDIO_BYTES,
  type SignMediaInput,
  type ConfirmMediaInput,
} from './schemas';
import * as repo from './repositories';
import {
  sniffImageMime,
  sniffVideoMime,
  sniffAudioMime,
  type SniffedImageMime,
  type SniffedVideoMime,
  type SniffedAudioMime,
} from './image-sniff';

const EXT_BY_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'video/mp4': 'mp4',
  'video/quicktime': 'mov',
  'video/webm': 'webm',
  'audio/mpeg': 'mp3',
  'audio/mp4': 'm4a',
  'audio/aac': 'aac',
  'audio/ogg': 'ogg',
  'audio/wav': 'wav',
};

type MediaKind = SignMediaInput['kind'];
export type SniffedMediaMime = SniffedImageMime | SniffedVideoMime | SniffedAudioMime;

function bucketForKind(kind: MediaKind): StorageBucket {
  return kind === 'payment_screenshot' ? 'payment-proofs' : 'experience-media';
}

/** The types each kind may hold: a photo slot also takes video, music is audio only. */
function allowedMimeFor(kind: MediaKind): readonly string[] {
  if (kind === 'music') return ALLOWED_AUDIO_MIME;
  if (kind === 'step_image') return [...ALLOWED_IMAGE_MIME, ...ALLOWED_VIDEO_MIME];
  return ALLOWED_IMAGE_MIME;
}

/** Size cap for one file of this type. */
export function maxBytesFor(mime: string): number {
  if (mime.startsWith('video/')) return MAX_VIDEO_BYTES;
  if (mime.startsWith('audio/')) return MAX_AUDIO_BYTES;
  return MAX_MEDIA_BYTES;
}

/** Browsers and phones name some types differently; map them to ours. */
const MIME_ALIASES: Record<string, string> = {
  'audio/mp3': 'audio/mpeg',
  'audio/x-m4a': 'audio/mp4',
  'audio/m4a': 'audio/mp4',
  'audio/x-aac': 'audio/aac',
  'audio/x-wav': 'audio/wav',
  'audio/wave': 'audio/wav',
  'audio/vnd.wave': 'audio/wav',
  'image/jpg': 'image/jpeg',
};

export function normalizeMime(mime: string): string {
  const m = mime.trim().toLowerCase().split(';')[0];
  return MIME_ALIASES[m] ?? m;
}

function assertMime(mime: string, kind: MediaKind): void {
  const allowed = allowedMimeFor(kind);
  if (!allowed.includes(mime)) {
    throw DashboardError.validation(`unsupported mime '${mime}'; allowed: ${allowed.join(', ')}`);
  }
}

function assertSize(bytes: number, max = MAX_MEDIA_BYTES): void {
  if (bytes > max) {
    throw DashboardError.validation(`file too large: ${bytes} bytes (max ${max})`);
  }
}

/**
 * Verify uploaded bytes are really one of the accepted image formats and return
 * the type the BYTES say (not what the client declared). A declared/actual
 * mismatch between two allowed types (a JPEG named .png) is harmless and we
 * simply record the real type; anything that is not a recognised image is
 * rejected. Also rejects empty and oversized payloads.
 */
export function assertImageBytes(data: Uint8Array): SniffedImageMime {
  if (data.byteLength === 0) throw DashboardError.validation('empty file');
  assertSize(data.byteLength);
  const sniffed = sniffImageMime(data);
  if (!sniffed || !(ALLOWED_IMAGE_MIME as readonly string[]).includes(sniffed)) {
    throw DashboardError.validation(
      `file is not a supported image; allowed: ${ALLOWED_IMAGE_MIME.join(', ')}`,
    );
  }
  return sniffed;
}

/**
 * The same check for every kind: what the bytes are, whether this kind may
 * hold that type, and the size cap for it. Photo slots take an image or a
 * video; music takes audio (an audio-only MP4 whose brand reads as video is
 * still audio here, since an <audio> element plays it either way).
 */
export function assertMediaBytes(data: Uint8Array, kind: MediaKind): SniffedMediaMime {
  if (data.byteLength === 0) throw DashboardError.validation('empty file');
  let sniffed: SniffedMediaMime | null;
  if (kind === 'music') {
    sniffed = sniffAudioMime(data) ?? (sniffVideoMime(data) === 'video/mp4' ? 'audio/mp4' : null);
  } else if (kind === 'step_image') {
    sniffed = sniffImageMime(data) ?? sniffVideoMime(data);
  } else {
    sniffed = sniffImageMime(data);
  }
  const allowed = allowedMimeFor(kind);
  if (!sniffed || !allowed.includes(sniffed)) {
    const what = kind === 'music' ? 'song' : kind === 'step_image' ? 'image or video' : 'image';
    throw DashboardError.validation(`file is not a supported ${what}; allowed: ${allowed.join(', ')}`);
  }
  assertSize(data.byteLength, maxBytesFor(sniffed));
  return sniffed;
}

export interface SignResult {
  bucket: StorageBucket;
  key: string;
  /** Dev: clients POST bytes to /api/dashboard/media (multipart) using this key,
   *  or the signed URL when a real object store is wired. */
  uploadUrl: string;
  expiresAt: Date;
  kind: SignMediaInput['kind'];
  /**
   * True when the browser may upload straight to the object store (Vercel
   * Blob) through /api/dashboard/media/client-upload. Large videos and songs
   * need this: a Vercel function rejects request bodies over 4.5 MB. False
   * locally, where the multipart route has no such limit.
   */
  direct: boolean;
}

export async function signMedia(ctx: UserContext, input: SignMediaInput): Promise<SignResult> {
  const mime = normalizeMime(input.mime);
  assertMime(mime, input.kind);
  assertSize(input.bytes, maxBytesFor(mime));

  // Ownership: if scoping to an experience, the caller must own it.
  if (input.experienceId) {
    const exp = await repo.getOwnedExperience(ctx.db, ctx.user.id, input.experienceId);
    if (!exp) throw DashboardError.notFound('experience not found');
  }

  const bucket = bucketForKind(input.kind);
  const ext = EXT_BY_MIME[mime];
  const fileId = nanoid(16);

  // Keys are derived from the session userId — never client-supplied.
  const key =
    bucket === 'payment-proofs'
      ? paymentProofKey(ctx.user.id, input.experienceId ?? 'order', fileId, ext)
      : experienceMediaKey(ctx.user.id, input.experienceId ?? 'unbound', fileId, ext);

  const storage = getStorage();
  const signed = await storage.getSignedUrl(bucket, key, 900);

  return {
    bucket,
    key,
    uploadUrl: signed.url,
    expiresAt: signed.expiresAt,
    kind: input.kind,
    direct: storageDriver() === 'vercel-blob',
  };
}

/**
 * Persist bytes directly (dev/local multipart path) AND the media row in one
 * call. Used by the POST /api/dashboard/media route which accepts a file.
 */
export async function uploadMedia(
  ctx: UserContext,
  input: {
    kind: SignMediaInput['kind'];
    mime: string;
    data: Buffer;
    experienceId?: string;
    stepId?: string;
    templateStepId?: string;
    slotKey?: string;
    width?: number;
    height?: number;
  },
): Promise<Media> {
  // Every caller gets the byte check, not only the HTTP route: the stored and
  // recorded type is what the bytes say, never the declared one.
  const mime = assertMediaBytes(input.data, input.kind);

  if (input.experienceId) {
    const exp = await repo.getOwnedExperience(ctx.db, ctx.user.id, input.experienceId);
    if (!exp) throw DashboardError.notFound('experience not found');
  }

  const bucket = bucketForKind(input.kind);
  const ext = EXT_BY_MIME[mime];
  const fileId = nanoid(16);
  const key =
    bucket === 'payment-proofs'
      ? paymentProofKey(ctx.user.id, input.experienceId ?? 'order', fileId, ext)
      : experienceMediaKey(ctx.user.id, input.experienceId ?? 'unbound', fileId, ext);

  const storage = getStorage();
  const stored = await storage.put({ bucket, key, data: input.data, contentType: mime });

  return repo.insertMedia(ctx.db, {
    userId: ctx.user.id,
    experienceId: input.experienceId ?? null,
    stepId: input.stepId ?? null,
    templateStepId: input.templateStepId ?? null,
    slotKey: input.slotKey ?? null,
    kind: input.kind,
    storagePath: key,
    bucket,
    mimeType: mime,
    width: input.width ?? null,
    height: input.height ?? null,
    bytes: stored.bytes,
  });
}

/**
 * Authorise one browser-to-Blob upload (the client-upload token route).
 * The pathname must be a key minted by signMedia for THIS user (so a token
 * can never write under someone else's prefix or overwrite an arbitrary
 * object), and the experience in it must be theirs. Only video and audio go
 * this way: they are the files too large for the multipart route on Vercel.
 * The bytes are checked again by confirmMedia once the upload lands.
 */
export async function authorizeClientUpload(
  ctx: UserContext,
  pathname: string,
): Promise<{ allowedContentTypes: string[]; maximumSizeInBytes: number }> {
  const prefix = 'experience-media/';
  const key = pathname.startsWith(prefix) ? pathname.slice(prefix.length) : '';
  if (!isWellFormedMediaKey(key, ctx.user.id)) {
    throw DashboardError.forbidden('upload path does not belong to the current user');
  }
  const experienceId = key.split('/')[1];
  if (experienceId !== 'unbound') {
    const exp = await repo.getOwnedExperience(ctx.db, ctx.user.id, experienceId).catch(() => null);
    if (!exp) throw DashboardError.notFound('experience not found');
  }
  const ext = key.slice(key.lastIndexOf('.') + 1);
  const mime = Object.entries(EXT_BY_MIME).find(([, e]) => e === ext)?.[0];
  if (!mime || !(mime.startsWith('video/') || mime.startsWith('audio/'))) {
    throw DashboardError.validation('only video and audio upload directly');
  }
  return {
    // Phones label the same file differently (audio/x-m4a, audio/mp3…); the
    // real type is decided by the bytes at confirm time.
    allowedContentTypes: mime.startsWith('video/') ? ['video/*'] : ['audio/*', 'video/mp4'],
    maximumSizeInBytes: maxBytesFor(mime),
  };
}

export async function confirmMedia(ctx: UserContext, input: ConfirmMediaInput): Promise<Media> {
  const kind =
    input.kind ?? (input.bucket === 'payment-proofs' ? 'payment_screenshot' : 'step_image');
  if (bucketForKind(kind) !== input.bucket) throw DashboardError.validation('kind does not match bucket');
  const declared = normalizeMime(input.mime);
  assertMime(declared, kind);
  assertSize(input.bytes, maxBytesFor(declared));

  // Defensive: the key MUST live under the caller's userId prefix.
  // Strict shape check BEFORE any storage call: rejects traversal tricks
  // like `<uid>/....//....//file` that a prefix check alone lets through.
  if (!isWellFormedMediaKey(input.key, ctx.user.id)) {
    throw DashboardError.forbidden('key does not belong to the current user');
  }

  if (input.experienceId) {
    const exp = await repo.getOwnedExperience(ctx.db, ctx.user.id, input.experienceId);
    if (!exp) throw DashboardError.notFound('experience not found');
  }

  const storage = getStorage();
  const exists = await storage.exists(input.bucket, input.key);
  if (!exists) throw DashboardError.unprocessable('uploaded object not found for key');

  // The client uploaded straight to storage, so its declared mime/bytes are
  // unverified claims. Check the object itself: real size, real image type. A
  // bad object is removed so it can't be served later by key.
  const stored = await storage.get(input.bucket, input.key);
  let actualMime: SniffedMediaMime;
  try {
    actualMime = assertMediaBytes(stored, kind);
  } catch (err) {
    await storage.remove(input.bucket, input.key).catch(() => undefined);
    throw err;
  }

  return repo.insertMedia(ctx.db, {
    userId: ctx.user.id,
    experienceId: input.experienceId ?? null,
    stepId: input.stepId ?? null,
    templateStepId: input.templateStepId ?? null,
    slotKey: input.slotKey ?? null,
    kind,
    storagePath: input.key,
    bucket: input.bucket,
    mimeType: actualMime,
    width: input.width ?? null,
    height: input.height ?? null,
    bytes: stored.byteLength,
  });
}

export async function deleteMedia(ctx: UserContext, id: string): Promise<void> {
  const row = await repo.deleteOwnedMedia(ctx.db, ctx.user.id, id);
  if (!row) throw DashboardError.notFound('media not found');
  // Best-effort blob removal — the row is the source of truth, orphan bytes are
  // harmless and the storage adapter's remove is idempotent.
  try {
    await getStorage().remove(row.bucket as StorageBucket, row.storagePath);
  } catch {
    /* ignore */
  }
}

/**
 * Mint a short-lived signed URL for an owned media row. Used by the public
 * render path (via getPublicExperienceBySlug) and the editor preview.
 */
export async function signedUrlForMedia(media: Pick<Media, 'bucket' | 'storagePath'>): Promise<string> {
  const { url } = await getStorage().getSignedUrl(
    media.bucket as StorageBucket,
    media.storagePath,
    3600,
  );
  return url;
}

/** True when a photo-slot media row is a video (the Player renders <video>). */
export function isVideoMedia(row: Pick<Media, 'mimeType'>): boolean {
  return Boolean(row.mimeType?.startsWith('video/'));
}

/** The card's own song: the newest 'music' row, if any (older ones are replaced). */
export function latestMusic<T extends Pick<Media, 'kind' | 'createdAt' | 'id'>>(rows: T[]): T | undefined {
  let best: T | undefined;
  for (const r of rows) {
    if (r.kind !== 'music') continue;
    const newer =
      !best ||
      (r.createdAt?.getTime() ?? 0) > (best.createdAt?.getTime() ?? 0) ||
      ((r.createdAt?.getTime() ?? 0) === (best.createdAt?.getTime() ?? 0) && r.id > best.id);
    if (newer) best = r;
  }
  return best;
}
