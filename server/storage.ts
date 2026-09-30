/**
 * StorageAdapter — abstracts file storage behind one interface so the rest of
 * the app never touches disk/R2 directly. Two logical buckets:
 *   - 'experience-media' : recipient photos (served to viewers via signed URLs)
 *   - 'payment-proofs'   : payment screenshots (reviewers only — never public)
 *
 * Dev/local: LocalDiskStorageAdapter writes under .data/uploads/<bucket>/...
 * Vercel (STORAGE_DRIVER=vercel-blob): VercelBlobStorageAdapter, because a
 * serverless function has no disk that outlives the request.
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { put as blobPut, get as blobGet, head as blobHead, del as blobDel, BlobNotFoundError } from '@vercel/blob';

export type StorageBucket = 'experience-media' | 'payment-proofs';

export interface PutObjectInput {
  bucket: StorageBucket;
  /** Key WITHIN the bucket, e.g. `<userId>/<experienceId>/<nanoid>.jpg`. */
  key: string;
  data: Buffer | Uint8Array;
  contentType?: string;
}

export interface StoredObject {
  bucket: StorageBucket;
  key: string;
  bytes: number;
  contentType?: string;
}

export interface SignedUrl {
  url: string;
  expiresAt: Date;
}

export interface StorageAdapter {
  /** Persist bytes. Returns metadata (NOT a public URL). */
  put(input: PutObjectInput): Promise<StoredObject>;
  /** Read raw bytes (used by the signed-URL route to stream payment proofs). */
  get(bucket: StorageBucket, key: string): Promise<Buffer>;
  /** Remove an object (idempotent). */
  remove(bucket: StorageBucket, key: string): Promise<void>;
  /** Mint a short-lived signed-ish URL for reading the object. */
  getSignedUrl(
    bucket: StorageBucket,
    key: string,
    expiresInSeconds?: number,
  ): Promise<SignedUrl>;
  exists(bucket: StorageBucket, key: string): Promise<boolean>;
}

/**
 * Throws unless `key` is a plain relative key: no `..` segments, no
 * backslashes, no NUL bytes, no absolute path and no empty segments.
 */
export function assertSafeStorageKey(key: string): void {
  if (
    typeof key !== 'string' ||
    key.length === 0 ||
    key.length > 512 ||
    key.includes('\\') ||
    key.includes('\0') ||
    key.startsWith('/') ||
    key.split('/').some((seg) => seg === '' || seg === '.' || seg === '..')
  ) {
    throw new Error('invalid storage key');
  }
}

/** Strict shape of every key this app mints: `<uid>/<scope>/<fileId>.<ext>`. */
const MEDIA_KEY_RE = /^[A-Za-z0-9_-]+\/[A-Za-z0-9_-]+\/[A-Za-z0-9_-]+\.(jpg|png|webp|gif)$/;

/** True when `key` has exactly the shape minted by experienceMediaKey/paymentProofKey for `userId`. */
export function isWellFormedMediaKey(key: string, userId: string): boolean {
  return MEDIA_KEY_RE.test(key) && key.startsWith(`${userId}/`);
}

/* ───────────────────── Local-disk dev adapter ─────────────────────── */

export class LocalDiskStorageAdapter implements StorageAdapter {
  constructor(private readonly root: string = process.env.LOCAL_STORAGE_ROOT ?? '.data/uploads') {}

  private resolve(bucket: StorageBucket, key: string): string {
    // Guard against path traversal: reject suspicious keys outright, then
    // verify the resolved path is strictly inside the bucket directory.
    // (Never "sanitize" by stripping — `....//` collapses back into `../`.)
    assertSafeStorageKey(key);
    const base = path.resolve(process.cwd(), this.root, bucket);
    const full = path.resolve(base, key);
    if (!full.startsWith(base + path.sep)) {
      throw new Error('invalid storage key');
    }
    return full;
  }

  async put(input: PutObjectInput): Promise<StoredObject> {
    const full = this.resolve(input.bucket, input.key);
    await fs.mkdir(path.dirname(full), { recursive: true });
    const buf = Buffer.from(input.data);
    await fs.writeFile(full, buf);
    if (input.contentType) {
      await fs.writeFile(`${full}.meta`, JSON.stringify({ contentType: input.contentType }));
    }
    return {
      bucket: input.bucket,
      key: input.key,
      bytes: buf.byteLength,
      contentType: input.contentType,
    };
  }

  async get(bucket: StorageBucket, key: string): Promise<Buffer> {
    return fs.readFile(this.resolve(bucket, key));
  }

  async remove(bucket: StorageBucket, key: string): Promise<void> {
    const full = this.resolve(bucket, key);
    await fs.rm(full, { force: true });
    await fs.rm(`${full}.meta`, { force: true });
  }

  async getSignedUrl(
    bucket: StorageBucket,
    key: string,
    expiresInSeconds = 3600,
  ): Promise<SignedUrl> {
    const expiresAt = new Date(Date.now() + expiresInSeconds * 1000);
    // Dev "signed" URL: route through an API handler that re-checks ownership.
    // (B1/B2 own the actual /api/.../media/[...] streaming route.)
    const exp = Math.floor(expiresAt.getTime() / 1000);
    const url = `/api/storage/${bucket}/${encodeURIComponent(key)}?exp=${exp}`;
    return { url, expiresAt };
  }

  async exists(bucket: StorageBucket, key: string): Promise<boolean> {
    try {
      await fs.access(this.resolve(bucket, key));
      return true;
    } catch {
      return false;
    }
  }
}

/* ───────────────────── Vercel Blob adapter ─────────────────────── */

/**
 * Objects live in a PRIVATE Blob store (payment screenshots must never be
 * public), under `<bucket>/<key>`. Readers still go through
 * /api/storage/<bucket>/<key>, which checks who may see the object and then
 * streams it from here — the same URL shape as the local adapter.
 * Auth comes from BLOB_READ_WRITE_TOKEN, which Vercel sets when a Blob store
 * is connected to the project.
 */
export class VercelBlobStorageAdapter implements StorageAdapter {
  private pathname(bucket: StorageBucket, key: string): string {
    assertSafeStorageKey(key);
    return `${bucket}/${key}`;
  }

  async put(input: PutObjectInput): Promise<StoredObject> {
    const buf = Buffer.from(input.data);
    await blobPut(this.pathname(input.bucket, input.key), buf, {
      access: 'private',
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: input.contentType,
    });
    return { bucket: input.bucket, key: input.key, bytes: buf.byteLength, contentType: input.contentType };
  }

  async get(bucket: StorageBucket, key: string): Promise<Buffer> {
    const res = await blobGet(this.pathname(bucket, key), { access: 'private' });
    if (!res || !res.stream) throw new Error('not found');
    return Buffer.from(await new Response(res.stream).arrayBuffer());
  }

  async remove(bucket: StorageBucket, key: string): Promise<void> {
    await blobDel(this.pathname(bucket, key));
  }

  async getSignedUrl(bucket: StorageBucket, key: string, expiresInSeconds = 3600): Promise<SignedUrl> {
    // Same auth-checked route as local; the Blob URL itself is never handed out.
    return new LocalDiskStorageAdapter().getSignedUrl(bucket, key, expiresInSeconds);
  }

  async exists(bucket: StorageBucket, key: string): Promise<boolean> {
    try {
      await blobHead(this.pathname(bucket, key));
      return true;
    } catch (err) {
      if (err instanceof BlobNotFoundError) return false;
      throw err;
    }
  }
}

/* ────────────────────────── Factory + helpers ─────────────────────── */

let _adapter: StorageAdapter | undefined;

export function getStorage(): StorageAdapter {
  if (_adapter) return _adapter;
  const driver = process.env.STORAGE_DRIVER ?? 'local';
  switch (driver) {
    case 'vercel-blob':
      _adapter = new VercelBlobStorageAdapter();
      return _adapter;
    case 'local':
    default:
      _adapter = new LocalDiskStorageAdapter();
      return _adapter;
  }
}

/** Build a conventional storage key for experience media. */
export function experienceMediaKey(userId: string, experienceId: string, fileId: string, ext: string) {
  return `${userId}/${experienceId}/${fileId}.${ext}`;
}

/** Build a conventional storage key for payment proofs. */
export function paymentProofKey(userId: string, orderId: string, fileId: string, ext: string) {
  return `${userId}/${orderId}/${fileId}.${ext}`;
}
