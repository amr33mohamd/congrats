import { test, expect, type Page, type APIRequestContext } from '@playwright/test';
import {
  login,
  userEmail,
  ADMIN_EMAIL,
  COMPED_EMAIL,
  listTemplates,
  getSteps,
  putSteps,
  uploadStepPhoto,
  uploadPaymentScreenshot,
  submitOrder,
  playerRoot,
  openGateIfPresent,
  sceneSection,
  expectSceneText,
  renderedSceneIds,
} from './helpers';
import { TEMPLATE_CATALOG } from '@/content/templates';
import type { ValidatedTemplate } from '@/content/templates';
import type { SceneDef, Slot, Locale } from '@/lib/template-contract';

/**
 * COMPREHENSIVE, DATA-DRIVEN template render proof over the scrolling Player.
 *
 * For EVERY template in TEMPLATE_CATALOG:
 *   1. Create an experience from it (template's own locale).
 *   2. Stamp a UNIQUE sentinel + the {recipient} token into the first editable
 *      text slot of each scene, a future date into date slots, and upload one
 *      tiny photo to each photo scene (PhotoReveal/Gallery). Photo scenes with
 *      no media are deliberately left OUT of the card by the Player, so without
 *      the upload their section would not exist to assert on.
 *   3. Publish — free directly; paid: one representative through the FULL money
 *      path (pay → admin approves in the real queue UI), the rest via the comped
 *      (all_access) account, which publishes paid templates without an order.
 *   4. Open /<locale>/p/<slug>, open the gate, and for every scene scroll its
 *      `section[data-scene]` into view and assert its sentinel is visible and
 *      revealed. Also assert: one section per scene, dir, recipient rendered.
 */

const RECIPIENT = 'ZephyrQA';

/** Per-(template,scene) deterministic sentinel, short enough for any maxLen. */
function sentinel(tIdx: number, sIdx: number): string {
  return `Zq${tIdx}s${sIdx}`;
}

// Bound slots read a card-level field and are never stored on the step, so a
// sentinel written into one would never render — stamp the next slot instead.
function firstEditableTextSlot(scene: SceneDef): Slot | undefined {
  return scene.slots.find((s) => s.type === 'text' && s.editable && !s.bind);
}
function firstEditableDateSlot(scene: SceneDef): Slot | undefined {
  return scene.slots.find((s) => s.type === 'date' && s.editable && !s.bind);
}
function firstImageSlot(scene: SceneDef): Slot | undefined {
  return scene.slots.find((s) => s.type === 'image' && s.editable);
}
function isPhotoScene(scene: SceneDef): boolean {
  return scene.type === 'PhotoReveal' || scene.type === 'Gallery';
}

function usesRecipientToken(t: ValidatedTemplate): boolean {
  const s = JSON.stringify(t.definition);
  return s.includes('{recipient}') || s.includes('{name}');
}

/**
 * Fill the template's card-level fields (couple's names, wedding / party date)
 * the way the builder's Details step does. Sections that read a bound field —
 * the cover's names, the countdown's date — only show once these are set.
 */
async function fillCardFields(req: APIRequestContext, expId: string, template: ValidatedTemplate) {
  const fields: Record<string, string> = {};
  for (const f of template.definition.fields ?? []) {
    fields[f.key] = f.type === 'date' ? '2099-06-18T20:00' : `QA ${f.key}`;
  }
  if (Object.keys(fields).length === 0) return;
  const res = await req.patch(`/api/dashboard/experiences/${expId}`, { data: { fields } });
  expect(res.ok(), `set card fields failed: ${res.status()} ${await res.text()}`).toBeTruthy();
}

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

/** Stamp sentinels + dates, upload photos. Returns sentinel per scene index ('' = none). */
async function fillScenes(
  req: APIRequestContext,
  experienceId: string,
  template: ValidatedTemplate,
  tIdx: number,
): Promise<string[]> {
  const steps = await getSteps(req, experienceId);
  expect(steps.length, 'step count != scene count').toBe(template.definition.scenes.length);

  const sceneById = new Map<string, { scene: SceneDef; index: number }>();
  template.definition.scenes.forEach((scene, index) => sceneById.set(scene.id, { scene, index }));
  const sentinelByScene: string[] = new Array(template.definition.scenes.length).fill('');

  const next = steps.map((s) => {
    const entry = sceneById.get(s.templateStepId);
    expect(entry, `step ${s.templateStepId} not found in template def`).toBeTruthy();
    const { scene, index } = entry!;
    const text = { ...s.text };
    const slot = firstEditableTextSlot(scene);
    if (slot) {
      const mark = sentinel(tIdx, index);
      // Append {recipient} so token substitution stays observable on every scene.
      text[slot.key] = `${mark} {recipient}`;
      sentinelByScene[index] = mark;
    }
    const dateSlot = firstEditableDateSlot(scene);
    if (dateSlot) text[dateSlot.key] = '2030-01-01T00:00:00.000Z';
    return { ...s, text };
  });
  await putSteps(req, experienceId, next);

  for (const scene of template.definition.scenes) {
    const img = firstImageSlot(scene);
    if (img && isPhotoScene(scene)) await uploadStepPhoto(req, experienceId, scene.id, img.key);
  }
  return sentinelByScene;
}

/** Publish and return the live, unlocked slug. */
async function publishAndUnlock(
  page: Page,
  experienceId: string,
  template: ValidatedTemplate,
  via: 'free' | 'comped' | 'money-path',
): Promise<string> {
  const req = page.request;
  const pub = await req.post(`/api/dashboard/experiences/${experienceId}/publish`);
  const body = await pub.json();

  if (via !== 'money-path') {
    // Free templates, and paid templates for the comped account, publish directly.
    expect(pub.status(), `${via} publish should be 200, got ${pub.status()} ${JSON.stringify(body)}`).toBe(200);
    expect(body.kind).toBe('published');
    return body.slug as string;
  }

  expect(pub.status(), `paid publish should be 202, got ${pub.status()}`).toBe(202);
  expect(body.kind).toBe('payment_required');
  const orderId = body.order.id as string;
  const orderRef = body.order.orderRef as string;
  const slug = body.slug as string;

  const mediaId = await uploadPaymentScreenshot(req, experienceId);
  await submitOrder(req, orderId, mediaId, `QA-${template.slug}`);

  // Switch the SAME browser context to the admin and approve in the real UI.
  await login(page, ADMIN_EMAIL);
  await page.goto('/en/admin/queue');
  await expect(page.getByRole('heading', { name: 'Payment queue' })).toBeVisible();
  const row = page.locator('tr', { hasText: orderRef });
  await expect(row).toBeVisible({ timeout: 15_000 });
  await row.getByRole('button', { name: 'Review' }).click();
  const approveBtn = page.getByRole('button', { name: /Approve/ });
  await expect(approveBtn).toBeVisible();
  await approveBtn.click();
  await expect(page.locator('tr', { hasText: orderRef })).toHaveCount(0, { timeout: 15_000 });
  return slug;
}

async function playAndAssert(
  page: Page,
  slug: string,
  template: ValidatedTemplate,
  sentinelByScene: string[],
): Promise<void> {
  await page.goto(`/${template.locale}/p/${slug}`);
  const player = playerRoot(page);
  await expect(player, `player-root not visible for ${template.slug}`).toBeVisible({ timeout: 15_000 });
  await expect(player).toHaveAttribute('dir', template.direction);

  await openGateIfPresent(page);

  // Every scene is a section (photo scenes included — they all got a photo).
  const scenes = template.definition.scenes;
  expect(await renderedSceneIds(page)).toEqual(scenes.map((s) => s.id));

  // Walk EVERY section even after a failure, so one broken scene type does not
  // hide whether the rest of the card works; report all failures together.
  const failures: string[] = [];
  for (let i = 0; i < scenes.length; i++) {
    const mark = sentinelByScene[i];
    if (!mark) {
      // No text slot to stamp — still require the section to exist and scroll.
      await sceneSection(page, scenes[i].id).scrollIntoViewIfNeeded();
      continue;
    }
    const msg = `scene ${i} (${scenes[i].type} "${scenes[i].id}") sentinel "${mark}" not revealed for ${template.slug}`;
    try {
      await expectSceneText(page, scenes[i].id, mark, msg);
    } catch {
      failures.push(msg);
    }
  }
  expect(failures, failures.join('\n')).toEqual([]);

  if (usesRecipientToken(template)) {
    await expect(
      player.getByText(RECIPIENT, { exact: false }).first(),
      `recipient "${RECIPIENT}" never rendered for ${template.slug}`,
    ).toBeVisible();
  }
}

/* ─────────────────────────── the data-driven suite ─────────────────────────── */

// One representative paid template goes through the FULL pay → admin-approve UI;
// the rest publish through the comped account (money path is also covered in
// money-path.spec.ts, so repeating it 20+ times would only add runtime).
const PAID_UI_SAMPLE = TEMPLATE_CATALOG.find((t) => t.isPaid)?.slug;

test.describe('All templates render user-filled data in every section', () => {
  TEMPLATE_CATALOG.forEach((template, tIdx) => {
    const label = `${template.slug} (${template.locale}/${template.direction}, ${
      template.isPaid ? 'paid' : 'free'
    })`;

    test(`template ${label}`, async ({ page }) => {
      const via: 'free' | 'comped' | 'money-path' = !template.isPaid
        ? 'free'
        : template.slug === PAID_UI_SAMPLE
          ? 'money-path'
          : 'comped';
      await login(page, via === 'comped' ? COMPED_EMAIL : userEmail(`tpl-${tIdx}`));

      // The templates API does not expose slug; the localized title is unique
      // per template, plus locale + paid flag to disambiguate.
      const cards = await listTemplates(page.request);
      const expectedName = template.locale === 'ar' ? template.titleAr : template.titleEn;
      const dbId = cards.find(
        (c) => c.name === expectedName && c.locale === template.locale && c.isPaid === template.isPaid,
      )?.id;
      expect(dbId, `no seeded template for ${template.slug} ("${expectedName}")`).toBeTruthy();

      const expId = await createExperience(page.request, dbId!, template.locale);
      await fillCardFields(page.request, expId, template);
      const sentinelByScene = await fillScenes(page.request, expId, template, tIdx);
      const slug = await publishAndUnlock(page, expId, template, via);
      expect(slug, 'no slug after publish').toBeTruthy();

      await playAndAssert(page, slug, template, sentinelByScene);
    });
  });
});
