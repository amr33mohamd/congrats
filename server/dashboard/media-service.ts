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
  experienceMediaKey,
  paymentProofKey,
  isWellFormedMediaKey,
  type StorageBucket,
} from '@/server/storage';
import type { Media } from '@/db/schema';
import { DashboardError } from './errors';
import { ALLOWED_IMAGE_MIME, MAX_MEDIA_BYTES, type SignMediaInput, type ConfirmMediaInput } from './schemas';
import * as repo from './repositories';
import { sniffImageMime, type SniffedImageMime } from './image-sniff';

const EXT_BY_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

function bucketForKind(kind: SignMediaInput['kind']): StorageBucket {
  return kind === 'payment_screenshot' ? 'payment-proofs' : 'experience-media';
}

function assertImageMime(mime: string): asserts mime is keyof typeof EXT_BY_MIME {
  if (!(ALLOWED_IMAGE_MIME as readonly string[]).includes(mime)) {
    throw DashboardError.validation(
      `unsupported mime '${mime}'; allowed: ${ALLOWED_IMAGE_MIME.join(', ')}`,
    );
  }
}

function assertSize(bytes: number): void {
  if (bytes > MAX_MEDIA_BYTES) {
    throw DashboardError.validation(
      `file too large: ${bytes} bytes (max ${MAX_MEDIA_BYTES})`,
    );
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

export interface SignResult {
  bucket: StorageBucket;
  key: string;
  /** Dev: clients POST bytes to /api/dashboard/media (multipart) using this key,
   *  or the signed URL when a real object store is wired. */
  uploadUrl: string;
  expiresAt: Date;
  kind: SignMediaInput['kind'];
}

export async function signMedia(ctx: UserContext, input: SignMediaInput): Promise<SignResult> {
  assertImageMime(input.mime);
  assertSize(input.bytes);

  // Ownership: if scoping to an experience, the caller must own it.
  if (input.experienceId) {
    const exp = await repo.getOwnedExperience(ctx.db, ctx.user.id, input.experienceId);
    if (!exp) throw DashboardError.notFound('experience not found');
  }

  const bucket = bucketForKind(input.kind);
  const ext = EXT_BY_MIME[input.mime];
  const fileId = nanoid(16);

  // Keys are derived from the session userId — never client-supplied.
  const key =
    bucket === 'payment-proofs'
      ? paymentProofKey(ctx.user.id, input.experienceId ?? 'order', fileId, ext)
      : experienceMediaKey(ctx.user.id, input.experienceId ?? 'unbound', fileId, ext);

  const storage = getStorage();
  const signed = await storage.getSignedUrl(bucket, key, 900);

  return { bucket, key, uploadUrl: signed.url, expiresAt: signed.expiresAt, kind: input.kind };
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
  assertImageMime(input.mime);
  // Every caller gets the byte check, not only the HTTP route: the stored and
  // recorded type is what the bytes say, never the declared one.
  const mime = assertImageBytes(input.data);

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

export async function confirmMedia(ctx: UserContext, input: ConfirmMediaInput): Promise<Media> {
  assertImageMime(input.mime);
  assertSize(input.bytes);

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
  let actualMime: SniffedImageMime;
  try {
    actualMime = assertImageBytes(stored);
  } catch (err) {
    await storage.remove(input.bucket, input.key).catch(() => undefined);
    throw err;
  }

  const kind =
    input.kind ?? (input.bucket === 'payment-proofs' ? 'payment_screenshot' : 'step_image');

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
