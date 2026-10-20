/**
 * Signed dev-URL streaming route (the one F0's StorageAdapter points its dev
 * "signed" URLs at). RE-CHECKS authorization before streaming bytes — a signed
 * URL alone is not trusted as a capability.
 *
 * Access rules:
 *  - 'experience-media' : readable by the OWNER (editor preview) OR by anyone
 *    when the object is bound to media of an UNLOCKED experience whose share
 *    link is active (public viewer). Recipient photos are meant to be shared.
 *  - 'payment-proofs'   : readable ONLY by the owning user or an admin — never
 *    public. (Admin review streaming is also covered here.)
 *
 * Keys are `<userId>/<...>/<file>`; the leading segment is the owner id, which we
 * cross-check against the session + the `media` row.
 */
import { eq, and } from 'drizzle-orm';
import { getDb } from '@/db';
import { media, experiences, shareLinks } from '@/db/schema';
import { getSession } from '@/lib/auth';
import { getStorage, type StorageBucket } from '@/server/storage';
import { hasAdminRow } from '@/server/db-context';
import { parseRange } from '@/lib/http-range';

export const runtime = 'nodejs';

type Params = { params: Promise<{ bucket: string; key: string[] }> };

const BUCKETS: StorageBucket[] = ['experience-media', 'payment-proofs'];

export async function GET(req: Request, { params }: Params) {
  const { bucket: bucketParam, key: keyParts } = await params;

  if (!BUCKETS.includes(bucketParam as StorageBucket)) {
    return new Response('not found', { status: 404 });
  }
  const bucket = bucketParam as StorageBucket;
  const key = (keyParts ?? []).map((p) => decodeURIComponent(p)).join('/');
  if (!key || key.includes('..')) {
    return new Response('bad request', { status: 400 });
  }

  const db = await getDb();
  const session = await getSession();

  // Resolve the media row by storage path to authorize against real ownership.
  const row = (
    await db.select().from(media).where(and(eq(media.bucket, bucket), eq(media.storagePath, key))).limit(1)
  )[0];

  const ownerId = key.split('/')[0];

  const authorized = await isAuthorized({ db, bucket, key, ownerId, row, session });
  if (!authorized) {
    return new Response('forbidden', { status: 403 });
  }

  const storage = getStorage();
  if (!(await storage.exists(bucket, key))) {
    return new Response('not found', { status: 404 });
  }

  let bytes: Buffer;
  try {
    bytes = await storage.get(bucket, key);
  } catch {
    return new Response('not found', { status: 404 });
  }

  const contentType = row?.mimeType ?? 'application/octet-stream';
  const headers: Record<string, string> = {
    'Content-Type': contentType,
    'Accept-Ranges': 'bytes',
    'Cache-Control': 'private, max-age=300',
    // Bytes are user-uploaded: never let a browser sniff them into something
    // executable (e.g. HTML smuggled in with an image extension).
    'X-Content-Type-Options': 'nosniff',
    'Content-Security-Policy': "default-src 'none'; img-src 'self'; media-src 'self'; style-src 'unsafe-inline'; sandbox",
  };

  // Video and audio: Safari will not play media unless the server answers
  // byte-range requests, and every browser seeks/loops with them.
  const range = parseRange(req.headers.get('range'), bytes.byteLength);
  if (range === 'unsatisfiable') {
    return new Response(null, {
      status: 416,
      headers: { ...headers, 'Content-Range': `bytes */${bytes.byteLength}` },
    });
  }
  if (range) {
    const chunk = bytes.subarray(range.start, range.end + 1);
    return new Response(new Uint8Array(chunk), {
      status: 206,
      headers: {
        ...headers,
        'Content-Length': String(chunk.byteLength),
        'Content-Range': `bytes ${range.start}-${range.end}/${bytes.byteLength}`,
      },
    });
  }

  return new Response(new Uint8Array(bytes), {
    status: 200,
    headers: { ...headers, 'Content-Length': String(bytes.byteLength) },
  });
}

async function isAuthorized(args: {
  db: Awaited<ReturnType<typeof getDb>>;
  bucket: StorageBucket;
  key: string;
  ownerId: string;
  row: typeof media.$inferSelect | undefined;
  session: Awaited<ReturnType<typeof getSession>>;
}): Promise<boolean> {
  const { db, bucket, ownerId, row, session } = args;

  // Owner (by media row userId, or by key prefix when no row yet) always allowed.
  const isOwner =
    Boolean(session) && (row ? row.userId === session!.id : ownerId === session!.id);
  if (isOwner) return true;

  // Admins may stream anything (payment-proof review). The JWT flag alone can
  // be stale after a role is revoked, so confirm against admin_users.
  if (session?.isAdmin && (await hasAdminRow(db, session.id))) return true;

  // payment-proofs are NEVER public.
  if (bucket === 'payment-proofs') return false;

  // experience-media: public IFF bound to an unlocked experience with an active
  // share link (so a recipient viewing the page can load the photos).
  if (!row?.experienceId) return false;

  const exp = (
    await db.select().from(experiences).where(eq(experiences.id, row.experienceId)).limit(1)
  )[0];
  if (!exp || !exp.isUnlocked) return false;

  const link = (
    await db.select().from(shareLinks).where(eq(shareLinks.experienceId, row.experienceId)).limit(1)
  )[0];
  if (!link || !link.isActive || link.visibility === 'disabled') return false;
  if (link.expiresAt && link.expiresAt.getTime() < Date.now()) return false;

  return true;
}
