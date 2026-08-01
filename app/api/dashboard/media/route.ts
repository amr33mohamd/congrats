import { userContext } from '@/server/db-context';
import { withErrors, created } from '@/server/dashboard/http';
import { DashboardError } from '@/server/dashboard/errors';
import { MediaKindSchema, MAX_MEDIA_BYTES } from '@/server/dashboard/schemas';
import { uploadMedia } from '@/server/dashboard/media-service';

export const runtime = 'nodejs';

/**
 * POST /api/dashboard/media (multipart/form-data) — direct upload path.
 * Fields: file (Blob), kind, experienceId?, stepId?, width?, height?
 *
 * This is the dev/local convenience that accepts the bytes, stores them via the
 * StorageAdapter, and persists the media row in one step. The contract's
 * sign/confirm pair (separate routes) supports object-store uploads in prod.
 */
export async function POST(req: Request) {
  return withErrors(async () => {
    const ctx = await userContext();

    const form = await req.formData().catch(() => {
      throw DashboardError.validation('expected multipart/form-data');
    });

    const file = form.get('file');
    if (!(file instanceof Blob)) {
      throw DashboardError.validation('missing file');
    }
    if (file.size > MAX_MEDIA_BYTES) {
      throw DashboardError.validation(`file too large (max ${MAX_MEDIA_BYTES} bytes)`);
    }

    const kindParsed = MediaKindSchema.safeParse(form.get('kind') ?? 'step_image');
    if (!kindParsed.success) throw DashboardError.validation('invalid kind');

    const mime = file.type || 'application/octet-stream';
    const experienceId = strOrUndefined(form.get('experienceId'));
    const stepId = strOrUndefined(form.get('stepId'));
    // Stable scene id + image-slot key for experience photos (non-UUID).
    const templateStepId = strOrUndefined(form.get('templateStepId'));
    const slotKey = strOrUndefined(form.get('slotKey'));
    const width = numOrUndefined(form.get('width'));
    const height = numOrUndefined(form.get('height'));

    const data = Buffer.from(await file.arrayBuffer());

    const media = await uploadMedia(ctx, {
      kind: kindParsed.data,
      mime,
      data,
      experienceId,
      stepId,
      templateStepId,
      slotKey,
      width,
      height,
    });

    return created({ media });
  });
}

function strOrUndefined(v: FormDataEntryValue | null): string | undefined {
  return typeof v === 'string' && v.length > 0 ? v : undefined;
}
function numOrUndefined(v: FormDataEntryValue | null): number | undefined {
  if (typeof v !== 'string' || v.length === 0) return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}
