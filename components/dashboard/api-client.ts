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

/**
 * Upload one image and return the stored media row.
 *
 * Sends the file to POST /api/dashboard/media, which checks the bytes, stores
 * them (local disk or Vercel Blob) and records the media row in one request.
 * The older sign → PUT → confirm path never worked from the browser: the sign
 * response names its URL `uploadUrl` (the client read `url`, so every upload
 * went to "undefined"), nothing accepted the PUT, and the kinds the client
 * sent ('experience-media', 'payment-proof') were not valid media kinds.
 */
export async function uploadAndConfirm(
  file: File,
  ctx: {
    kind: 'step_image' | 'payment_screenshot';
    experienceId?: string;
    stepId?: string;
    // Stable scene id + image-slot key for experience photos (multi-slot / gallery).
    templateStepId?: string;
    slotKey?: string;
  },
): Promise<ConfirmedMedia> {
  file = await shrinkForUpload(file);
  const dims = await readImageDimensions(file).catch(() => ({ width: 0, height: 0 }));
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
  const body = (await res.json().catch(() => ({}))) as {
    media?: { id: string; bucket: string; storagePath: string; width?: number | null; height?: number | null };
    error?: { message?: string } | string;
    message?: string;
  };
  if (!res.ok || !body.media) {
    const msg = typeof body.error === 'object' ? body.error?.message : body.message;
    throw new ApiError(msg || 'Upload failed. Please try again.', res.status);
  }
  const m = body.media;
  return {
    id: m.id,
    // Served through the auth-checked storage route (owner preview / shared card).
    url: `/api/storage/${m.bucket}/${m.storagePath.split('/').map(encodeURIComponent).join('/')}`,
    width: m.width ?? dims.width,
    height: m.height ?? dims.height,
  };
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
