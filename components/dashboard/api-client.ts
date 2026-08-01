'use client';

/**
 * Thin fetch client for the FROZEN dashboard API (B1 implements under
 * app/api/dashboard/**). Contract-first: routes are called exactly as defined
 * in the Foundation handoff; if a route isn't live yet the calls reject and the
 * UI surfaces a friendly error.
 */
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
      const body = (await res.json()) as { error?: string; message?: string };
      detail = body.error ?? body.message ?? detail;
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
  }) =>
    request<{ experience?: EditorExperience; id?: string } & Partial<EditorExperience>>(
      '/api/dashboard/experiences',
      { method: 'POST', body: JSON.stringify(body) },
    ),

  getExperience: (id: string) =>
    request<EditorExperience>(`/api/dashboard/experiences/${id}`),

  patchExperience: (
    id: string,
    body: Partial<{ title: string; recipientName: string; locale: AppLocale }>,
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
 * Uploads a file to a signed target then confirms it, returning the persisted
 * media row. Handles both PUT (R2/local presigned) and POST (form) targets.
 */
export async function uploadAndConfirm(
  file: File,
  ctx: {
    kind: string;
    experienceId?: string;
    stepId?: string;
    // Stable scene id + image-slot key for experience photos (multi-slot / gallery).
    templateStepId?: string;
    slotKey?: string;
  },
): Promise<ConfirmedMedia> {
  const dims = await readImageDimensions(file).catch(() => ({ width: 0, height: 0 }));
  const target = await dashboardApi.signMedia({
    kind: ctx.kind,
    mime: file.type,
    bytes: file.size,
    experienceId: ctx.experienceId,
    stepId: ctx.stepId,
  });

  if (target.method === 'POST' && target.fields) {
    const form = new FormData();
    Object.entries(target.fields).forEach(([k, v]) => form.append(k, v));
    form.append('file', file);
    const up = await fetch(target.url, { method: 'POST', body: form });
    if (!up.ok) throw new ApiError('upload failed', up.status);
  } else {
    const up = await fetch(target.url, {
      method: 'PUT',
      headers: { 'Content-Type': file.type },
      body: file,
    });
    if (!up.ok) throw new ApiError('upload failed', up.status);
  }

  return dashboardApi.confirmMedia({
    bucket: target.bucket,
    key: target.key,
    mime: file.type,
    width: dims.width,
    height: dims.height,
    bytes: file.size,
    experienceId: ctx.experienceId,
    stepId: ctx.stepId,
    templateStepId: ctx.templateStepId,
    slotKey: ctx.slotKey,
  });
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
