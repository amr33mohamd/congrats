import { test, expect, type Page, type APIRequestContext } from '@playwright/test';
import {
  login,
  userEmail,
  ADMIN_EMAIL,
  listTemplates,
  uploadPaymentScreenshot,
  submitOrder,
} from './helpers';
import { TEMPLATE_CATALOG } from '@/content/templates';
import type { ValidatedTemplate } from '@/content/templates';
import type { SceneDef, Slot, Locale } from '@/lib/template-contract';

/**
 * COMPREHENSIVE, DATA-DRIVEN template render proof.
 *
 * Iterates ALL 16 templates in TEMPLATE_CATALOG. For each one we:
 *   1. Dev-login a user, create an experience from that template (template's own locale).
 *   2. Stamp a UNIQUE sentinel into the FIRST editable text slot of EACH scene
 *      (keeping every other slot at its seeded default), plus a unique recipient
 *      sentinel so {recipient}/{name} token substitution is observable. Countdown
 *      scenes also get a future targetDate so the timer can render.
 *   3. Publish — FREE directly; PAID via the real money path (pay + admin-approve).
 *      The UI admin-approve is exercised EXHAUSTIVELY on a representative paid
 *      template; the rest of the paid templates approve via the admin API (same
 *      state machine + audit) to keep runtime sane. EVERY template — free or paid —
 *      is then PLAYED and asserted.
 *   4. Open /<locale>/p/<slug> in the template's own locale, tap to start, walk
 *      ALL scenes via progress dots, and assert per scene:
 *        - the player shows NON-EMPTY visible text (no blank scene),
 *        - the scene's injected sentinel is visible when active,
 *        - dot count == template scene count,
 *        - the recipient sentinel appears for token-bearing templates,
 *        - dir matches the template direction (rtl/ltr).
 *
 * This is the assertion that proves the slot-driven SceneRenderer fix: scenes
 * whose templates use non-standard slot keys (subheading, caption, lead, message,
 * line1/2/3, reason1/2/3, coverImage, targetDate, note, dua, name, weight, …)
 * render the user-entered text rather than coming up empty.
 */

/* ───────────────────────── helpers (local) ───────────────────────── */

/** Deterministic recipient sentinel (no Date.now/random → stable reruns). */
const RECIPIENT = 'ZephyrQA';

/** Per-(template,scene) deterministic text sentinel, short enough for any maxLen. */
function sentinel(tIdx: number, sIdx: number): string {
  // e.g. "Zq3s0" — alnum, <= 6 chars so it never trips a slot maxLen (min seen: 30).
  return `Zq${tIdx}s${sIdx}`;
}

/** The first editable TEXT slot on a scene (what the user would first type into). */
function firstEditableTextSlot(scene: SceneDef): Slot | undefined {
  return scene.slots.find((s) => s.type === 'text' && s.editable);
}

/** Does a scene declare an editable date slot (Countdown target)? */
function firstEditableDateSlot(scene: SceneDef): Slot | undefined {
  return scene.slots.find((s) => s.type === 'date' && s.editable);
}

/** Does the template's definition contain a {recipient}/{name} token anywhere? */
function usesRecipientToken(t: ValidatedTemplate): boolean {
  const s = JSON.stringify(t.definition);
  return s.includes('{recipient}') || s.includes('{name}');
}

type EditorView = {
  steps: Array<{ templateStepId: string; orderIndex: number; text: Record<string, string> }>;
};

/** Create an experience and return its id. */
async function createExperience(
  req: APIRequestContext,
  templateId: string,
  locale: Locale,
): Promise<string> {
  const res = await req.post('/api/dashboard/experiences', {
    data: { templateId, locale, recipientName: RECIPIENT, title: `QA ${RECIPIENT}` },
  });
  expect(res.ok(), `create experience failed: ${res.status()} ${await res.text()}`).toBeTruthy();
  const json = await res.json();
  const id = json.experience?.id ?? json.id;
  expect(id, 'experience id missing').toBeTruthy();
  return id as string;
}

/**
 * Stamp the per-scene sentinel into the first editable text slot of each scene,
 * a future date into any editable date slot, and preserve all seeded defaults.
 * Returns the sentinel string injected for each scene index (for later assertion).
 */
async function stampScenes(
  req: APIRequestContext,
  experienceId: string,
  template: ValidatedTemplate,
  tIdx: number,
): Promise<{ sentinelByScene: string[] }> {
  const get = await req.get(`/api/dashboard/experiences/${experienceId}`);
  expect(get.ok(), `get experience failed: ${get.status()}`).toBeTruthy();
  const view = (await get.json()) as EditorView;
  expect(view.steps.length, 'experience has no steps').toBe(template.definition.scenes.length);

  // Map templateStepId -> scene def + its index in the (ordered) definition.
  const sceneById = new Map<string, { scene: SceneDef; index: number }>();
  template.definition.scenes.forEach((scene, index) => sceneById.set(scene.id, { scene, index }));

  const sentinelByScene: string[] = new Array(template.definition.scenes.length).fill('');

  const payload = view.steps.map((s) => {
    const entry = sceneById.get(s.templateStepId);
    expect(entry, `step ${s.templateStepId} not found in template def`).toBeTruthy();
    const { scene, index } = entry!;
    const text = { ...s.text };

    const slot = firstEditableTextSlot(scene);
    if (slot) {
      const mark = sentinel(tIdx, index);
      // Append the {recipient} token so token substitution stays observable on
      // EVERY scene (the first editable slot is often the one that carried a
      // {recipient} default we'd otherwise clobber). Stored form is short
      // (e.g. "Zq15s4 {recipient}" = 18 chars) so it never trips a slot maxLen.
      text[slot.key] = `${mark} {recipient}`;
      sentinelByScene[index] = mark;
    }

    // Give Countdown scenes a far-future target so the timer renders something.
    const dateSlot = firstEditableDateSlot(scene);
    if (dateSlot) text[dateSlot.key] = '2030-01-01T00:00:00.000Z';

    return {
      templateStepId: s.templateStepId,
      orderIndex: s.orderIndex,
      text,
      animationConfig: {},
    };
  });

  const put = await req.put(`/api/dashboard/experiences/${experienceId}/steps`, {
    data: { steps: payload },
  });
  expect(put.ok(), `put steps failed: ${put.status()} ${await put.text()}`).toBeTruthy();

  return { sentinelByScene };
}

/** Publish a free OR paid template and return the live, unlocked slug. */
async function publishAndUnlock(
  page: Page,
  experienceId: string,
  template: ValidatedTemplate,
  approveVia: 'ui' | 'api',
): Promise<string> {
  const req = page.request;
  const pub = await req.post(`/api/dashboard/experiences/${experienceId}/publish`);
  const body = await pub.json();

  if (!template.isPaid) {
    expect(pub.status(), `free publish should be 200, got ${pub.status()}`).toBe(200);
    expect(body.kind).toBe('published');
    return body.slug as string;
  }

  // PAID → 202 payment_required with an order; pay then admin-approve.
  expect(pub.status(), `paid publish should be 202, got ${pub.status()}`).toBe(202);
  expect(body.kind).toBe('payment_required');
  const orderId = body.order.id as string;
  const orderRef = body.order.orderRef as string;
  const slug = body.slug as string;
  expect(orderId && orderRef && slug).toBeTruthy();

  const mediaId = await uploadPaymentScreenshot(req, experienceId);
  await submitOrder(req, orderId, mediaId, `QA-${template.slug}`);

  // Admin approves. Switch the SAME browser context to the admin session.
  await login(page, ADMIN_EMAIL);

  if (approveVia === 'ui') {
    // Exhaustively drive the real admin Review drawer (the money path UI).
    await page.goto('/en/admin/queue');
    await expect(page.getByRole('heading', { name: 'Payment queue' })).toBeVisible();
    const row = page.locator('tr', { hasText: orderRef });
    await expect(row).toBeVisible({ timeout: 15_000 });
    await row.getByRole('button', { name: 'Review' }).click();
    const approveBtn = page.getByRole('button', { name: /Approve/ });
    await expect(approveBtn).toBeVisible();
    await approveBtn.click();
    await expect(page.locator('tr', { hasText: orderRef })).toHaveCount(0, { timeout: 15_000 });
  } else {
    // Same state machine + audit, driven through the admin API (admin session cookie).
    const res = await page.request.post(`/api/admin/orders/${orderId}/approve`);
    expect(res.ok(), `admin approve failed: ${res.status()} ${await res.text()}`).toBeTruthy();
  }

  return slug;
}

/**
 * Open the player at the template's OWN locale, tap-start, and walk every scene.
 * Asserts non-empty text, the per-scene sentinel, dot count, recipient token, dir.
 */
async function playAndAssert(
  page: Page,
  slug: string,
  template: ValidatedTemplate,
  sentinelByScene: string[],
): Promise<void> {
  const localePrefix = `/${template.locale}`;
  await page.goto(`${localePrefix}/p/${slug}`);

  const player = page.getByTestId('player-root');
  await expect(player, `player-root not visible for ${template.slug}`).toBeVisible({
    timeout: 15_000,
  });

  // Direction matches the template (RTL templates render under dir="rtl").
  await expect(player).toHaveAttribute('dir', template.direction);

  // Progress dots == scene count.
  const sceneCount = template.definition.scenes.length;
  const dots = player.locator('span.rounded-pill');
  await expect(dots).toHaveCount(sceneCount);

  // Tap the start overlay to begin playback (scene 0 becomes active).
  await player.click();

  let sawRecipient = false;

  for (let i = 0; i < sceneCount; i++) {
    const mark = sentinelByScene[i];

    // The active scene's injected sentinel must be visible (proves user data renders).
    if (mark) {
      await expect(
        player.getByText(mark, { exact: false }),
        `scene ${i} sentinel "${mark}" not visible for ${template.slug}`,
      ).toBeVisible({ timeout: 15_000 });
    }

    // The active scene must show SOME non-empty heading/body text (no blank scene).
    // The sentinel itself is non-empty visible text; assert a real heading node too.
    const headings = player.locator('h1');
    await expect(
      headings.first(),
      `scene ${i} has no visible heading for ${template.slug}`,
    ).toBeVisible({ timeout: 15_000 });

    // Recipient-token proof: the unique recipient appears somewhere during the run.
    if (!sawRecipient && (await player.getByText(RECIPIENT, { exact: false }).count()) > 0) {
      sawRecipient = true;
    }

    // Advance to the next scene (tap), except after the last one.
    if (i < sceneCount - 1) {
      await player.click();
      // Wait for AnimatePresence mode="wait" to settle on the next sentinel.
      const next = sentinelByScene[i + 1];
      if (next) {
        await expect(player.getByText(next, { exact: false })).toBeVisible({ timeout: 15_000 });
      }
    }
  }

  if (usesRecipientToken(template)) {
    expect(
      sawRecipient,
      `recipient sentinel "${RECIPIENT}" never rendered for token-bearing template ${template.slug}`,
    ).toBeTruthy();
  }
}

/* ─────────────────────────── the data-driven suite ─────────────────────────── */

// One representative paid template is approved through the FULL admin UI; the
// rest of the paid templates approve via the admin API (same service + audit).
const PAID_UI_SAMPLE = TEMPLATE_CATALOG.find((t) => t.isPaid)?.slug;

test.describe('All templates render user-filled data with no empty scenes', () => {
  TEMPLATE_CATALOG.forEach((template, tIdx) => {
    const label = `${template.slug} (${template.locale}/${template.direction}, ${
      template.isPaid ? 'paid' : 'free'
    })`;

    test(`template ${label}`, async ({ page }) => {
      // 1. Login as a per-template user (deterministic email → stable reruns).
      await login(page, userEmail(`tpl-${tIdx}`));

      // Resolve this catalog template → seeded DB template id. The templates API
      // does NOT expose slug, so match on the localized title (unique per template)
      // plus locale + paid flag to disambiguate.
      const cards = await listTemplates(page.request);
      const expectedName = template.locale === 'ar' ? template.titleAr : template.titleEn;
      const dbId = cards.find(
        (c) =>
          c.name === expectedName &&
          c.locale === template.locale &&
          c.isPaid === template.isPaid,
      )?.id;
      expect(dbId, `no seeded template found for ${template.slug} (name "${expectedName}")`).toBeTruthy();

      // 2. Create + stamp sentinels.
      const expId = await createExperience(page.request, dbId!, template.locale);
      const { sentinelByScene } = await stampScenes(page.request, expId, template, tIdx);

      // 3. Publish + unlock (free direct; paid pay+approve).
      const approveVia = template.slug === PAID_UI_SAMPLE ? 'ui' : 'api';
      const slug = await publishAndUnlock(page, expId, template, approveVia);
      expect(slug, 'no slug after publish').toBeTruthy();

      // 4. Play through every scene and assert.
      await playAndAssert(page, slug, template, sentinelByScene);
    });
  });
});
