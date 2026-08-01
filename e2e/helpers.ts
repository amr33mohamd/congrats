import { expect, type Page, type APIRequestContext } from '@playwright/test';

/**
 * Shared helpers for the Congrats E2E suite.
 *
 * Auth: we log in through the REAL dev-login UI (Auth.js Credentials provider).
 * After login the browser context holds the session cookie, so `page.request`
 * (same context) is authenticated for the dashboard/admin JSON APIs — which we
 * use to set up state deterministically. The recipient PLAYING is always
 * verified through the real /p/<slug> page.
 */

export const EN = '/en';
export const ADMIN_EMAIL = 'admin@congrats.dev';
// Shared password for all E2E accounts. The seeded admin must use the same value
// — set SEED_ADMIN_PASSWORD to this in playwright.config's webServer env.
export const E2E_PASSWORD = 'e2e-password-123';

/** Stable per-test email (no Date.now/random → reruns are deterministic). */
export function userEmail(tag: string): string {
  return `e2e-${tag}@example.com`;
}

/** Register an account (idempotent: a 409 "already exists" is fine). */
export async function ensureAccount(page: Page, email: string): Promise<void> {
  const res = await page.request.post('/api/auth/register', {
    data: { email, password: E2E_PASSWORD, locale: 'en' },
  });
  const status = res.status();
  if (status !== 201 && status !== 409) {
    throw new Error(`register ${email} failed: ${status} ${await res.text()}`);
  }
}

/** Log in via the real email+password form. Lands on the dashboard on success. */
export async function login(page: Page, email: string): Promise<void> {
  // The seeded admin already exists; regular test accounts are created here.
  if (email !== ADMIN_EMAIL) await ensureAccount(page, email);

  await page.goto(`${EN}/login`);
  await page.getByPlaceholder('you@example.com').fill(email);
  await page.getByPlaceholder(/At least 8 characters/i).fill(E2E_PASSWORD);
  await page.getByRole('button', { name: 'Log in' }).click();
  // signIn redirects to the dashboard (locale-prefixed).
  await page.waitForURL(/\/(en|ar)\/dashboard/, { timeout: 30_000 });
}

/* ───────────────────────── API setup helpers ───────────────────────── */

type TemplateCard = {
  id: string;
  name: string;
  locale: 'ar' | 'en';
  isPaid: boolean;
  pricePiastres: number;
};

export async function listTemplates(req: APIRequestContext): Promise<TemplateCard[]> {
  const res = await req.get('/api/dashboard/templates');
  expect(res.ok(), `templates list failed: ${res.status()}`).toBeTruthy();
  const body = await res.json();
  return body.templates as TemplateCard[];
}

export async function pickTemplate(
  req: APIRequestContext,
  opts: { paid: boolean; locale?: 'ar' | 'en' },
): Promise<TemplateCard> {
  const all = await listTemplates(req);
  const match = all.find(
    (t) => t.isPaid === opts.paid && (opts.locale ? t.locale === opts.locale : true),
  );
  if (!match) throw new Error(`no ${opts.paid ? 'paid' : 'free'} template found`);
  return match;
}

/** Create an experience from a template (steps are cloned server-side). */
export async function createExperience(
  req: APIRequestContext,
  body: { templateId: string; locale: 'ar' | 'en'; recipientName: string },
): Promise<string> {
  const res = await req.post('/api/dashboard/experiences', {
    data: { ...body, title: `E2E ${body.recipientName}` },
  });
  expect(res.ok(), `create experience failed: ${res.status()} ${await res.text()}`).toBeTruthy();
  const json = await res.json();
  const id = json.experience?.id ?? json.id;
  expect(id, 'experience id missing').toBeTruthy();
  return id;
}

/** Ensure at least one step has editable text so publish has playable content. */
export async function setStepText(
  req: APIRequestContext,
  experienceId: string,
  recipientName: string,
): Promise<void> {
  // Pull the editor payload to learn the template's first scene + its text slots.
  const res = await req.get(`/api/dashboard/experiences/${experienceId}`);
  expect(res.ok(), `get experience failed: ${res.status()}`).toBeTruthy();
  const exp = await res.json();
  const steps = exp.steps as Array<{
    templateStepId: string;
    orderIndex: number;
    text: Record<string, string>;
  }>;
  expect(steps.length, 'experience has no steps').toBeGreaterThan(0);

  // Reuse the existing (default-seeded) text but stamp a recognizable heading on
  // the first step. The server validates slot keys, so only touch keys present.
  const first = steps[0];
  const text = { ...first.text };
  if ('heading' in text) text.heading = `Congrats ${recipientName}!`;
  else if ('body' in text) text.body = `A message for ${recipientName}`;

  const payload = steps.map((s, i) => ({
    templateStepId: s.templateStepId,
    orderIndex: s.orderIndex ?? i,
    text: i === 0 ? text : s.text,
    animationConfig: {},
  }));

  const put = await req.put(`/api/dashboard/experiences/${experienceId}/steps`, {
    data: { steps: payload },
  });
  expect(put.ok(), `put steps failed: ${put.status()} ${await put.text()}`).toBeTruthy();
}

/** Publish. Free → { kind:'published', slug }. Paid → 202 { kind:'payment_required', order, slug }. */
export async function publish(
  req: APIRequestContext,
  experienceId: string,
): Promise<{ status: number; body: any }> {
  const res = await req.post(`/api/dashboard/experiences/${experienceId}/publish`);
  const body = await res.json();
  return { status: res.status(), body };
}

/** Ensure a share slug exists (idempotent). */
export async function shareSlug(req: APIRequestContext, experienceId: string): Promise<string> {
  const res = await req.post(`/api/dashboard/experiences/${experienceId}/share-link`);
  expect(res.ok(), `share-link failed: ${res.status()}`).toBeTruthy();
  const body = await res.json();
  return body.slug as string;
}

/** A tiny valid PNG (1x1) as a Buffer — used for payment screenshots. */
export function tinyPng(): Buffer {
  return Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    'base64',
  );
}

/** Upload a payment screenshot via the dev multipart route → media id. */
export async function uploadPaymentScreenshot(
  req: APIRequestContext,
  experienceId: string,
): Promise<string> {
  const res = await req.post('/api/dashboard/media', {
    multipart: {
      kind: 'payment_screenshot',
      experienceId,
      file: { name: 'proof.png', mimeType: 'image/png', buffer: tinyPng() },
    },
  });
  expect(res.ok(), `media upload failed: ${res.status()} ${await res.text()}`).toBeTruthy();
  const body = await res.json();
  const id = body.media?.id ?? body.id;
  expect(id, 'media id missing').toBeTruthy();
  return id;
}

/** Submit payment for an order (pending → submitted). */
export async function submitOrder(
  req: APIRequestContext,
  orderId: string,
  screenshotMediaId: string,
  paymentRef: string,
): Promise<void> {
  const res = await req.post(`/api/dashboard/orders/${orderId}/submit`, {
    data: { screenshotMediaId, paymentRef },
  });
  expect(res.ok(), `submit order failed: ${res.status()} ${await res.text()}`).toBeTruthy();
}

/* ───────────────────────── Player assertions ───────────────────────── */

/**
 * Open a share link and assert the Player renders + plays. Handles the start
 * overlay tap. Returns once the first scene is visible.
 */
export async function assertPlayerPlays(page: Page, slug: string): Promise<void> {
  await page.goto(`${EN}/p/${slug}`);
  const player = page.getByTestId('player-root');
  await expect(player).toBeVisible({ timeout: 15_000 });
  // Tap the start overlay to begin playback.
  await player.click();
  // Progress dots exist (one per step) and a scene becomes active.
  await expect(player.locator('span.rounded-pill').first()).toBeVisible();
}

/** Assert a slug shows the neutral "unavailable" page (no content). */
export async function assertLinkLocked(page: Page, slug: string): Promise<void> {
  await page.goto(`${EN}/p/${slug}`);
  await expect(page.getByTestId('player-root')).toHaveCount(0);
  await expect(page.getByText("This link isn't available")).toBeVisible();
}
