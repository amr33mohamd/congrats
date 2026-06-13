/**
 * StorageAdapter — abstracts file storage behind one interface so the rest of
 * the app never touches disk/R2 directly. Two logical buckets:
 *   - 'experience-media' : recipient photos (served to viewers via signed URLs)
 *   - 'payment-proofs'   : payment screenshots (reviewers only — never public)
 *
 * Dev/local: LocalDiskStorageAdapter writes under .data/uploads/<bucket>/...
 * Prod: an R2 adapter (same interface) is added later by the reviewer.
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';

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

/* ───────────────────── Local-disk dev adapter ─────────────────────── */

export class LocalDiskStorageAdapter implements StorageAdapter {
  constructor(private readonly root: string = process.env.LOCAL_STORAGE_ROOT ?? '.data/uploads') {}

  private resolve(bucket: StorageBucket, key: string): string {
    // Guard against path traversal in keys.
    const safeKey = key.replace(/\.\.(\/|\\)/g, '');
    return path.join(process.cwd(), this.root, bucket, safeKey);
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

/* ────────────────────────── Factory + helpers ─────────────────────── */

let _adapter: StorageAdapter | undefined;

export function getStorage(): StorageAdapter {
  if (_adapter) return _adapter;
  const driver = process.env.STORAGE_DRIVER ?? 'local';
  switch (driver) {
    case 'local':
    default:
      _adapter = new LocalDiskStorageAdapter();
      return _adapter;
    // case 'r2': _adapter = new R2StorageAdapter(); — added in prod by reviewer.
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
