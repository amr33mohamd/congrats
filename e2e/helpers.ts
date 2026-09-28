import { expect, type Page, type APIRequestContext, type Locator } from '@playwright/test';

/**
 * Shared helpers for the Congrats E2E suite.
 *
 * Auth: we log in through the REAL login UI (Auth.js Credentials provider).
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
/**
 * Comped account (users.all_access). Created by `db/seed.ts` because
 * playwright.config sets SEED_TESTER=1 with this email + E2E_PASSWORD. There is
 * no admin API to grant all_access, and the test process must never open the
 * PGlite directory the dev server owns, so the pre-server seed is the only safe
 * place to create it.
 */
export const COMPED_EMAIL = 'e2e-comped@example.com';

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
  // Seeded accounts (admin, comped) already exist; the rest are created here.
  if (email !== ADMIN_EMAIL && email !== COMPED_EMAIL) await ensureAccount(page, email);

  await page.goto(`${EN}/login`);
  await page.getByPlaceholder('you@example.com').fill(email);
  await page.getByPlaceholder(/At least 8 characters/i).fill(E2E_PASSWORD);
  await page.getByRole('button', { name: 'Log in' }).click();
  // signIn redirects to the dashboard (locale-prefixed).
  await page.waitForURL(/\/(en|ar)\/dashboard/, { timeout: 30_000 });
}

/* ───────────────────────── API setup helpers ───────────────────────── */

export type TemplateCard = {
  id: string;
  name: string;
  locale: 'ar' | 'en';
  isPaid: boolean;
  pricePiastres: number;
  categorySlug: string | null;
};

export async function listTemplates(req: APIRequestContext): Promise<TemplateCard[]> {
  const res = await req.get('/api/dashboard/templates');
  expect(res.ok(), `templates list failed: ${res.status()}`).toBeTruthy();
  const body = await res.json();
  return body.templates as TemplateCard[];
}

export async function pickTemplate(
  req: APIRequestContext,
  opts: { paid: boolean; locale?: 'ar' | 'en'; category?: string },
): Promise<TemplateCard> {
  const all = await listTemplates(req);
  const match = all.find(
    (t) =>
      t.isPaid === opts.paid &&
      (opts.locale ? t.locale === opts.locale : true) &&
      (opts.category ? t.categorySlug === opts.category : true),
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

export type EditorStep = {
  templateStepId: string;
  orderIndex: number;
  text: Record<string, string>;
};

/** Read the experience's steps as the builder sees them. */
export async function getSteps(req: APIRequestContext, experienceId: string): Promise<EditorStep[]> {
  const res = await req.get(`/api/dashboard/experiences/${experienceId}`);
  expect(res.ok(), `get experience failed: ${res.status()}`).toBeTruthy();
  const exp = await res.json();
  return exp.steps as EditorStep[];
}

/** Replace all steps' text (the builder's autosave payload). */
export async function putSteps(
  req: APIRequestContext,
  experienceId: string,
  steps: EditorStep[],
): Promise<void> {
  const put = await req.put(`/api/dashboard/experiences/${experienceId}/steps`, {
    data: {
      steps: steps.map((s, i) => ({
        templateStepId: s.templateStepId,
        orderIndex: s.orderIndex ?? i,
        text: s.text,
        animationConfig: {},
      })),
    },
  });
  expect(put.ok(), `put steps failed: ${put.status()} ${await put.text()}`).toBeTruthy();
}

/** Ensure at least one step has editable text so publish has playable content. */
export async function setStepText(
  req: APIRequestContext,
  experienceId: string,
  recipientName: string,
): Promise<void> {
  const steps = await getSteps(req, experienceId);
  expect(steps.length, 'experience has no steps').toBeGreaterThan(0);

  // Reuse the existing (default-seeded) text but stamp a recognizable heading on
  // the first step. The server validates slot keys, so only touch keys present.
  const first = steps[0];
  const text = { ...first.text };
  if ('heading' in text) text.heading = `Congrats ${recipientName}!`;
  else if ('body' in text) text.body = `A message for ${recipientName}`;

  await putSteps(
    req,
    experienceId,
    steps.map((s, i) => (i === 0 ? { ...s, text } : s)),
  );
}

/** Publish. Free/comped → { kind:'published', slug }. Paid → 202 { kind:'payment_required', order, slug }. */
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

/** A tiny valid PNG (1x1) as a Buffer — used for payment screenshots and photos. */
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

/** Upload one photo to a (templateStepId, slotKey) via the real media route. */
export async function uploadStepPhoto(
  req: APIRequestContext,
  experienceId: string,
  templateStepId: string,
  slotKey: string,
): Promise<void> {
  const res = await req.post('/api/dashboard/media', {
    multipart: {
      kind: 'step_image',
      experienceId,
      templateStepId,
      slotKey,
      file: { name: 'photo.png', mimeType: 'image/png', buffer: tinyPng() },
    },
  });
  expect(res.ok(), `photo upload failed: ${res.status()} ${await res.text()}`).toBeTruthy();
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
 * The Player is ONE continuous scrolling card: every scene is a
 * `<section data-scene="<templateStepId>">` whose content rises in the first
 * time it scrolls into view. On the public /p route (`startPaused`) an open
 * gate sits over the card; tapping it is also what lets the soundtrack play.
 * The gate label follows the EXPERIENCE's locale, not the route's, so accept both.
 */
export const GATE_BUTTON = /^(Open|افتح الدعوة)$/;

export function playerRoot(page: Page): Locator {
  return page.getByTestId('player-root');
}

/** Tap the open gate if one is showing, and wait for it to go away. */
export async function openGateIfPresent(page: Page): Promise<void> {
  const gate = playerRoot(page).getByRole('button', { name: GATE_BUTTON });
  if ((await gate.count()) === 0) return;
  await gate.click();
  await expect(gate).toHaveCount(0);
}

/** One scene section by its stable template step id. */
export function sceneSection(page: Page, sceneId: string): Locator {
  return playerRoot(page).locator(`section[data-scene="${sceneId}"]`);
}

/**
 * Effective opacity: the product of an element's and all its ancestors'
 * computed opacity. Playwright's `toBeVisible` counts `opacity: 0` as visible,
 * so this is what proves the reveal-on-scroll animation actually ran.
 */
async function effectiveOpacity(el: Locator): Promise<number> {
  return el.evaluate((node) => {
    let o = 1;
    for (let n: Element | null = node; n; n = n.parentElement) {
      o *= parseFloat(getComputedStyle(n).opacity || '1');
    }
    return o;
  });
}

/**
 * Scroll a scene into view and assert `text` inside it is visible AND has
 * finished revealing (effective opacity ~1), not merely present in the DOM.
 */
export async function expectSceneText(
  page: Page,
  sceneId: string,
  text: string,
  message?: string,
): Promise<void> {
  const section = sceneSection(page, sceneId);
  await expect(section, message ?? `section "${sceneId}" missing`).toHaveCount(1);
  await section.scrollIntoViewIfNeeded();
  const node = section.getByText(text, { exact: false }).first();
  await expect(node, message ?? `"${text}" not visible in section "${sceneId}"`).toBeVisible();
  await expect
    .poll(() => effectiveOpacity(node), {
      message: message ?? `"${text}" in section "${sceneId}" never revealed`,
      timeout: 10_000,
    })
    .toBeGreaterThan(0.9);
}

/** Rendered scene ids, in document order. */
export async function renderedSceneIds(page: Page): Promise<string[]> {
  return playerRoot(page)
    .locator('section[data-scene]')
    .evaluateAll((els) => els.map((e) => e.getAttribute('data-scene') ?? ''));
}

/**
 * Open a share link and assert the card actually reads: the gate opens, at
 * least one section renders, and scrolling top → bottom every section shows
 * some revealed text (no blank sections). Returns the rendered scene ids.
 */
export async function assertPlayerPlays(
  page: Page,
  slug: string,
  locale: 'ar' | 'en' = 'en',
): Promise<string[]> {
  await page.goto(`/${locale}/p/${slug}`);
  const player = playerRoot(page);
  await expect(player).toBeVisible({ timeout: 15_000 });
  await openGateIfPresent(page);

  await expect(player.locator('section[data-scene]').first()).toBeVisible();
  const ids = await renderedSceneIds(page);
  expect(ids.length, 'player rendered no sections').toBeGreaterThan(0);

  for (const id of ids) {
    const section = sceneSection(page, id);
    await section.scrollIntoViewIfNeeded();
    await expect
      .poll(
        () =>
          section.evaluate((el) =>
            Array.from(el.querySelectorAll('h1,h2,p,span,a')).some((n) => {
              if (!(n.textContent ?? '').trim()) return false;
              let o = 1;
              for (let x: Element | null = n; x; x = x.parentElement) {
                o *= parseFloat(getComputedStyle(x).opacity || '1');
              }
              const r = n.getBoundingClientRect();
              return o > 0.9 && r.width > 0 && r.height > 0;
            }),
          ),
        { message: `section "${id}" never showed any revealed text`, timeout: 10_000 },
      )
      .toBe(true);
  }
  return ids;
}

/** Assert a slug shows the neutral "unavailable" page (no content). */
export async function assertLinkLocked(page: Page, slug: string): Promise<void> {
  await page.goto(`${EN}/p/${slug}`);
  await expect(page.getByTestId('player-root')).toHaveCount(0);
  await expect(page.getByText("This link isn't available")).toBeVisible();
}
