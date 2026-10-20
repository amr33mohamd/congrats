'use client';

/**
 * Thin fetch client for the FROZEN dashboard API (B1 implements under
 * app/api/dashboard/**). Contract-first: routes are called exactly as defined
 * in the Foundation handoff; if a route isn't live yet the calls reject and the
 * UI surfaces a friendly error.
 */
import type { QuizAnswers } from '@/lib/quiz/answers';
import type {
  ExperienceListItem,
  EditorExperience,
  TemplateCard,
  StepUpsert,
  OrderInfo,
  SignedUploadTarget,
  ConfirmedMedia,
  AppLocale,
} from './types';

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

const REQUEST_TIMEOUT_MS = 20_000;

async function request<T>(input: string, init?: RequestInit): Promise<T> {
  // Abort hung requests so the UI never spins forever on a dead network.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetch(input, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(init?.headers ?? {}),
      },
      cache: 'no-store',
      signal: init?.signal ?? controller.signal,
    });
  } catch (err) {
    clearTimeout(timer);
    const aborted = err instanceof DOMException && err.name === 'AbortError';
    throw new ApiError(aborted ? 'Request timed out. Check your connection.' : 'Network error. Please try again.', 0);
  }
  clearTimeout(timer);
  if (!res.ok) {
    let detail = res.statusText;
    try {
      // Server errors come back as { error: { code, message } } (dashboard/admin
      // HTTP helpers); older/simple ones as { error: string } or { message }.
      const body = (await res.json()) as {
        error?: string | { message?: string; code?: string };
        message?: string;
      };
      if (body.error && typeof body.error === 'object') {
        detail = body.error.message ?? detail;
      } else {
        detail = (body.error as string | undefined) ?? body.message ?? detail;
      }
    } catch {
      /* non-JSON error body */
    }
    throw new ApiError(detail, res.status);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

/* ───────────────────────────── Experiences ────────────────────────── */

export const dashboardApi = {
  listExperiences: () =>
    request<{ experiences: ExperienceListItem[] } | ExperienceListItem[]>(
      '/api/dashboard/experiences',
    ).then((r) => (Array.isArray(r) ? r : (r.experiences ?? []))),

  createExperience: (body: {
    templateId: string;
    locale: AppLocale;
    // Optional: the API rejects empty strings (min-length-1 when present), so
    // callers omit these when blank rather than sending ''.
    recipientName?: string;
    title?: string;
    /** /start questionnaire answers, validated again on the server. */
    prefill?: QuizAnswers;
  }) =>
    request<{ experience?: EditorExperience; id?: string } & Partial<EditorExperience>>(
      '/api/dashboard/experiences',
      { method: 'POST', body: JSON.stringify(body) },
    ),

  getExperience: (id: string) =>
    request<EditorExperience>(`/api/dashboard/experiences/${id}`),

  patchExperience: (
    id: string,
    body: Partial<{
      title: string | null;
      recipientName: string | null;
      locale: AppLocale;
      fields: Record<string, string>;
    }>,
  ) =>
    request<EditorExperience>(`/api/dashboard/experiences/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),

  deleteExperience: (id: string) =>
    request<void>(`/api/dashboard/experiences/${id}`, { method: 'DELETE' }),

  putSteps: (id: string, steps: StepUpsert[]) =>
    request<{ ok: true }>(`/api/dashboard/experiences/${id}/steps`, {
      method: 'PUT',
      body: JSON.stringify({ steps }),
    }),

  /* ─────────────────────────────── Media ──────────────────────────── */

  signMedia: (body: {
    kind: string;
    mime: string;
    bytes: number;
    experienceId?: string;
    stepId?: string;
  }) =>
    request<SignedUploadTarget>('/api/dashboard/media/sign', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  confirmMedia: (body: {
    bucket: string;
    key: string;
    mime: string;
    width: number;
    height: number;
    bytes: number;
    experienceId?: string;
    stepId?: string;
    templateStepId?: string;
    slotKey?: string;
  }) =>
    request<ConfirmedMedia>('/api/dashboard/media/confirm', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  deleteMedia: (id: string) =>
    request<void>(`/api/dashboard/media/${id}`, { method: 'DELETE' }),

  /* ─────────────────────────── Publish / orders ───────────────────── */

  publish: (id: string) =>
    request<{ status?: string; slug?: string; order?: OrderInfo }>(
      `/api/dashboard/experiences/${id}/publish`,
      { method: 'POST' },
    ),

  // B1 wraps order payloads under { order }. Unwrap to the flat OrderInfo the
  // checkout + status screens consume (tolerant of a flat body too).
  createOrder: (experienceId: string) =>
    request<{ order: OrderInfo } | OrderInfo>('/api/dashboard/orders', {
      method: 'POST',
      body: JSON.stringify({ experienceId }),
    }).then((r) => ('order' in r ? r.order : r)),

  submitOrder: (id: string, body: { screenshotMediaId: string; paymentRef: string }) =>
    request<{ order: OrderInfo; duplicateScreenshot?: boolean } | OrderInfo>(
      `/api/dashboard/orders/${id}/submit`,
      { method: 'POST', body: JSON.stringify(body) },
    ).then((r) => ('order' in r ? r.order : r)),

  getOrder: (id: string) =>
    request<{ order: OrderInfo } | OrderInfo>(`/api/dashboard/orders/${id}`).then((r) =>
      'order' in r ? r.order : r,
    ),

  shareLink: (id: string) =>
    request<{ slug: string }>(`/api/dashboard/experiences/${id}/share-link`, {
      method: 'POST',
    }),

  /**
   * Template catalog for the picker. Not strictly in the dashboard contract list
   * but needed by the create flow; B1/B2 expose a read endpoint. We try the
   * dashboard path first and fall back to the admin read route shape.
   */
  listTemplates: () =>
    request<{ templates: TemplateCard[] } | TemplateCard[]>(
      '/api/dashboard/templates',
    ).then((r) => (Array.isArray(r) ? r : (r.templates ?? []))),
};

type MediaRowWire = {
  id: string;
  bucket: string;
  storagePath: string;
  mimeType?: string | null;
  width?: number | null;
  height?: number | null;
};

/** What a picked file is, by its type or (phones often send none) its extension. */
export function mediaTypeOf(file: File): 'image' | 'video' | 'audio' | null {
  const t = file.type.toLowerCase();
  if (t.startsWith('image/')) return 'image';
  if (t.startsWith('video/')) return 'video';
  if (t.startsWith('audio/')) return 'audio';
  const ext = file.name.toLowerCase().split('.').pop() ?? '';
  if (['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext)) return 'image';
  if (['mp4', 'mov', 'webm', 'm4v'].includes(ext)) return 'video';
  if (['mp3', 'm4a', 'aac', 'ogg', 'oga', 'wav'].includes(ext)) return 'audio';
  return null;
}

/** The declared type the server checks first (the bytes have the final say). */
function declaredMime(file: File): string {
  if (file.type) return file.type;
  const ext = file.name.toLowerCase().split('.').pop() ?? '';
  const byExt: Record<string, string> = {
    mp4: 'video/mp4', m4v: 'video/mp4', mov: 'video/quicktime', webm: 'video/webm',
    mp3: 'audio/mpeg', m4a: 'audio/mp4', aac: 'audio/aac', ogg: 'audio/ogg', oga: 'audio/ogg', wav: 'audio/wav',
    jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', gif: 'image/gif',
  };
  return byExt[ext] ?? 'application/octet-stream';
}

/**
 * Largest file sent through POST /api/dashboard/media. A Vercel function
 * refuses request bodies over 4.5 MB, and the multipart wrapper adds a little.
 */
const MULTIPART_MAX_BYTES = 4 * 1024 * 1024;

type UploadKind = 'step_image' | 'payment_screenshot' | 'music';
type UploadCtx = {
  kind: UploadKind;
  experienceId?: string;
  stepId?: string;
  // Stable scene id + image-slot key for experience photos (multi-slot / gallery).
  templateStepId?: string;
  slotKey?: string;
};

/**
 * Upload one photo, video or song and return the stored media row.
 *
 * Photos (shrunk in the browser first) and small files go to POST
 * /api/dashboard/media, which checks the bytes, stores them (local disk or
 * Vercel Blob) and records the media row in one request. A video or song too
 * big for that request goes straight to Vercel Blob instead: /media/sign mints
 * the key, @vercel/blob/client uploads it with a token from
 * /media/client-upload, and /media/confirm checks the bytes and records the
 * row. Locally (no Blob store) sign answers `direct: false` and the multipart
 * route takes any size.
 *
 * `onProgress` reports 0–1 for the direct path (the multipart path has no
 * progress events in fetch).
 */
export async function uploadAndConfirm(
  file: File,
  ctx: UploadCtx,
  onProgress?: (fraction: number) => void,
): Promise<ConfirmedMedia> {
  const type = mediaTypeOf(file);
  let dims = { width: 0, height: 0 };
  if (type === 'image') {
    file = await shrinkForUpload(file);
    dims = await readImageDimensions(file).catch(() => dims);
  } else if (type === 'video') {
    dims = await readVideoDimensions(file).catch(() => dims);
  }

  let row: MediaRowWire;
  if (type !== 'image' && file.size > MULTIPART_MAX_BYTES) {
    const target = await postJson<{ bucket: string; key: string; direct: boolean }>('/api/dashboard/media/sign', {
      kind: ctx.kind,
      mime: declaredMime(file),
      bytes: file.size,
      experienceId: ctx.experienceId,
    });
    row = target.direct
      ? await uploadDirect(file, target, ctx, dims, onProgress)
      : await uploadMultipart(file, ctx, dims);
  } else {
    row = await uploadMultipart(file, ctx, dims);
  }

  return {
    id: row.id,
    // Served through the auth-checked storage route (owner preview / shared card).
    url: `/api/storage/${row.bucket}/${row.storagePath.split('/').map(encodeURIComponent).join('/')}`,
    width: row.width ?? dims.width,
    height: row.height ?? dims.height,
    mime: row.mimeType ?? undefined,
  };
}

async function uploadMultipart(file: File, ctx: UploadCtx, dims: { width: number; height: number }): Promise<MediaRowWire> {
  const form = new FormData();
  form.append('kind', ctx.kind);
  for (const [k, v] of Object.entries({
    experienceId: ctx.experienceId,
    stepId: ctx.stepId,
    templateStepId: ctx.templateStepId,
    slotKey: ctx.slotKey,
  })) {
    if (v) form.append(k, v);
  }
  if (dims.width) form.append('width', String(dims.width));
  if (dims.height) form.append('height', String(dims.height));
  form.append('file', file);

  let res: Response;
  try {
    // No Content-Type header: the browser sets the multipart boundary itself.
    res = await fetch('/api/dashboard/media', { method: 'POST', body: form, cache: 'no-store' });
  } catch {
    throw new ApiError('Network error. Please try again.', 0);
  }
  return readMediaResponse(res);
}

async function uploadDirect(
  file: File,
  target: { bucket: string; key: string },
  ctx: UploadCtx,
  dims: { width: number; height: number },
  onProgress?: (fraction: number) => void,
): Promise<MediaRowWire> {
  // Loaded on demand: only senders adding a big video or song need it.
  const { upload } = await import('@vercel/blob/client');
  try {
    await upload(`${target.bucket}/${target.key}`, file, {
      access: 'private',
      handleUploadUrl: '/api/dashboard/media/client-upload',
      contentType: declaredMime(file),
      multipart: file.size > 8 * 1024 * 1024,
      onUploadProgress: onProgress ? (p) => onProgress(p.percentage / 100) : undefined,
    });
  } catch (err) {
    throw new ApiError(err instanceof Error && err.message ? err.message : 'Upload failed. Please try again.', 0);
  }
  let res: Response;
  try {
    res = await fetch('/api/dashboard/media/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
      body: JSON.stringify({
        bucket: target.bucket,
        key: target.key,
        mime: declaredMime(file),
        bytes: file.size,
        kind: ctx.kind,
        experienceId: ctx.experienceId,
        templateStepId: ctx.templateStepId,
        slotKey: ctx.slotKey,
        ...(dims.width ? { width: dims.width } : {}),
        ...(dims.height ? { height: dims.height } : {}),
      }),
    });
  } catch {
    throw new ApiError('Network error. Please try again.', 0);
  }
  return readMediaResponse(res);
}

async function readMediaResponse(res: Response): Promise<MediaRowWire> {
  const body = (await res.json().catch(() => ({}))) as {
    media?: MediaRowWire;
    error?: { message?: string } | string;
    message?: string;
  };
  if (!res.ok || !body.media) {
    const msg = typeof body.error === 'object' ? body.error?.message : body.message;
    throw new ApiError(msg || 'Upload failed. Please try again.', res.status);
  }
  return body.media;
}

async function postJson<T>(url: string, payload: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
      body: JSON.stringify(payload),
    });
  } catch {
    throw new ApiError('Network error. Please try again.', 0);
  }
  const body = (await res.json().catch(() => ({}))) as T & { error?: { message?: string } | string; message?: string };
  if (!res.ok) {
    const msg = typeof body.error === 'object' ? body.error?.message : body.message;
    throw new ApiError(msg || 'Upload failed. Please try again.', res.status);
  }
  return body;
}

function readVideoDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const v = document.createElement('video');
    v.preload = 'metadata';
    v.muted = true;
    v.onloadedmetadata = () => {
      resolve({ width: v.videoWidth, height: v.videoHeight });
      URL.revokeObjectURL(url);
    };
    v.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('could not read video'));
    };
    v.src = url;
  });
}

/** Longest side kept for an uploaded photo — sharper than any phone screen needs. */
const MAX_UPLOAD_SIDE = 2400;
/** Re-encode anything above this. Vercel rejects request bodies over 4.5 MB. */
const SHRINK_ABOVE_BYTES = 3 * 1024 * 1024;

/**
 * Phone photos are routinely 5–12 MB. Downscale and re-encode large JPEG /
 * PNG / WebP images in the browser before they are sent: uploads stay under
 * the host's request limit and cards load faster for guests. GIFs are left
 * alone (re-encoding would drop the animation), as is anything that fails to
 * decode — the server's size check then has the final word.
 */
async function shrinkForUpload(file: File): Promise<File> {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type) || typeof createImageBitmap !== 'function') return file;
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    return file;
  }
  const scale = Math.min(1, MAX_UPLOAD_SIDE / Math.max(bitmap.width, bitmap.height));
  if (scale === 1 && file.size <= SHRINK_ABOVE_BYTES) {
    bitmap.close();
    return file;
  }
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d')?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  // WebP keeps a PNG's transparency; JPEG is smallest for photos.
  const type = file.type === 'image/jpeg' ? 'image/jpeg' : 'image/webp';
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, 0.86));
  if (!blob || blob.size >= file.size) return file;
  const name = file.name.replace(/\.[^.]+$/, '') + (type === 'image/jpeg' ? '.jpg' : '.webp');
  return new File([blob], name, { type });
}

function readImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) return resolve({ width: 0, height: 0 });
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
      URL.revokeObjectURL(url);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('could not read image'));
    };
    img.src = url;
  });
}
