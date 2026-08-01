import { test, expect, type Page, type APIRequestContext } from '@playwright/test';
import { login, userEmail, listTemplates, tinyPng } from './helpers';
import { TEMPLATE_CATALOG } from '@/content/templates';
import type { ValidatedTemplate } from '@/content/templates';
import type { SceneDef } from '@/lib/template-contract';

/**
 * FULL FILLABILITY PROOF.
 *
 * 1. Builder exposes an upload affordance for EVERY image slot, and a multi-add
 *    UI for gallery slots (max > 1) — asserted in the real content-step UI.
 * 2. A sender can put ONE photo on a single-image slot and MULTIPLE photos on a
 *    gallery slot; ALL of them render in the played /p/<slug> under the right
 *    scenes (single scene → 1 img, gallery scene → N imgs).
 * 3. Per-scene user text still renders, and the recipient name shows.
 *
 * Photos are uploaded through the real media API (multipart route) carrying the
 * stable templateStepId + slotKey — the exact plumbing the builder uses — so the
 * binder's slot routing is exercised end-to-end.
 */

const RECIPIENT = 'PixelMuse';

/** A representative free template with single-image slots AND a gallery slot. */
const TARGET_SLUG = 'birthday-make-a-wish-en';

function targetTemplate(): ValidatedTemplate {
  const t = TEMPLATE_CATALOG.find((x) => x.slug === TARGET_SLUG);
  if (!t) throw new Error(`fixture template ${TARGET_SLUG} missing from catalog`);
  return t;
}

function imageSlots(scene: SceneDef) {
  return scene.slots.filter((s) => s.type === 'image' && s.editable);
}
function firstEditableTextSlot(scene: SceneDef) {
  return scene.slots.find((s) => s.type === 'text' && s.editable);
}

async function createExperience(req: APIRequestContext, templateId: string): Promise<string> {
  const res = await req.post('/api/dashboard/experiences', {
    data: { templateId, locale: 'en', recipientName: RECIPIENT, title: `QA ${RECIPIENT}` },
  });
  expect(res.ok(), `create failed: ${res.status()} ${await res.text()}`).toBeTruthy();
  const json = await res.json();
  return (json.experience?.id ?? json.id) as string;
}

/** Upload one photo to a (templateStepId, slotKey) via the real media route. */
async function uploadPhoto(
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

test.describe('Experiences are fully fillable (name + text + photos across scenes)', () => {
  test('builder exposes an upload for every image slot and multi-add for galleries', async ({
    page,
  }) => {
    await login(page, userEmail('fill-ui'));
    const template = targetTemplate();
    const cards = await listTemplates(page.request);
    const dbId = cards.find((c) => c.name === template.titleEn && c.locale === 'en')?.id;
    expect(dbId, 'seeded template id not found').toBeTruthy();

    const expId = await createExperience(page.request, dbId!);

    await page.goto(`/en/builder/${expId}?step=content`);
    const tablist = page.getByRole('tablist');
    await expect(tablist).toBeVisible({ timeout: 20_000 });
    const tabs = tablist.getByRole('tab');
    const sceneCount = template.definition.scenes.length;
    await expect(tabs).toHaveCount(sceneCount);

    // Walk every scene tab; assert each image slot surfaces an upload control,
    // and that gallery (max>1) slots show the multi-add affordance.
    let sawGalleryMultiAdd = false;
    for (let i = 0; i < sceneCount; i++) {
      const scene = template.definition.scenes[i];
      await tabs.nth(i).click();
      const slots = imageSlots(scene);
      if (slots.length === 0) continue;

      // At least one image control is present for the scene's image slot(s).
      const uploadButtons = page.getByRole('button', { name: /Upload photo|Add photo/ });
      await expect(uploadButtons.first()).toBeVisible({ timeout: 10_000 });

      if (slots.some((s) => (s.max ?? 1) > 1)) {
        await expect(page.getByRole('button', { name: 'Add photo' }).first()).toBeVisible();
        // The gallery counter ("0 of 6 photos") proves the multi-photo widget.
        await expect(page.getByText(/of \d+ photos/).first()).toBeVisible();
        sawGalleryMultiAdd = true;
      }
    }
    expect(sawGalleryMultiAdd, 'template has no gallery multi-add UI').toBeTruthy();
  });

  test('1 photo on a single slot + many on a gallery all render under the right scenes', async ({
    page,
  }) => {
    await login(page, userEmail('fill-render'));
    const template = targetTemplate();
    const cards = await listTemplates(page.request);
    const dbId = cards.find((c) => c.name === template.titleEn && c.locale === 'en')?.id;
    expect(dbId).toBeTruthy();
    const req = page.request;

    const expId = await createExperience(req, dbId!);

    // Stamp a per-scene text sentinel into the first editable text slot of each
    // scene (preserving seeded defaults) so user text + recipient render proof.
    const get = await req.get(`/api/dashboard/experiences/${expId}`);
    const view = (await get.json()) as {
      steps: Array<{ templateStepId: string; orderIndex: number; text: Record<string, string> }>;
    };
    const sceneById = new Map(template.definition.scenes.map((s, idx) => [s.id, { s, idx }]));
    const sentinelOf = (idx: number) => `Pix${idx}`;
    const payload = view.steps.map((st) => {
      const entry = sceneById.get(st.templateStepId)!;
      const text = { ...st.text };
      const slot = firstEditableTextSlot(entry.s);
      if (slot) text[slot.key] = `${sentinelOf(entry.idx)} {recipient}`;
      const dateSlot = entry.s.slots.find((x) => x.type === 'date' && x.editable);
      if (dateSlot) text[dateSlot.key] = '2030-01-01T00:00:00.000Z';
      return { templateStepId: st.templateStepId, orderIndex: st.orderIndex, text, animationConfig: {} };
    });
    const put = await req.put(`/api/dashboard/experiences/${expId}/steps`, { data: { steps: payload } });
    expect(put.ok(), `put steps failed: ${put.status()} ${await put.text()}`).toBeTruthy();

    // Identify the single-image PhotoReveal scene ('star') and the gallery scene.
    const singleScene = template.definition.scenes.find(
      (s) => s.type === 'PhotoReveal' && imageSlots(s).some((sl) => (sl.max ?? 1) === 1),
    )!;
    const singleSlot = imageSlots(singleScene).find((sl) => (sl.max ?? 1) === 1)!;
    const galleryScene = template.definition.scenes.find((s) => s.type === 'Gallery')!;
    const gallerySlot = imageSlots(galleryScene).find((sl) => (sl.max ?? 1) > 1)!;

    // ONE photo on the single slot; THREE on the gallery slot.
    await uploadPhoto(req, expId, singleScene.id, singleSlot.key);
    const GALLERY_N = 3;
    for (let i = 0; i < GALLERY_N; i++) await uploadPhoto(req, expId, galleryScene.id, gallerySlot.key);

    // Publish (free → direct) and play.
    const pub = await req.post(`/api/dashboard/experiences/${expId}/publish`);
    const body = await pub.json();
    expect(pub.status(), `publish: ${pub.status()}`).toBe(200);
    const slug = body.slug as string;

    await playAndAssertImages(page, slug, template, {
      singleSceneId: singleScene.id,
      gallerySceneId: galleryScene.id,
      galleryCount: GALLERY_N,
      sentinelOf,
    });
  });
});

/** Walk all scenes; assert per-scene image counts + sentinels + recipient. */
async function playAndAssertImages(
  page: Page,
  slug: string,
  template: ValidatedTemplate,
  opts: {
    singleSceneId: string;
    gallerySceneId: string;
    galleryCount: number;
    sentinelOf: (idx: number) => string;
  },
): Promise<void> {
  await page.goto(`/en/p/${slug}`);
  const player = page.getByTestId('player-root');
  await expect(player).toBeVisible({ timeout: 15_000 });
  await expect(player).toHaveAttribute('dir', template.direction);
  await player.click(); // start

  const scenes = template.definition.scenes;
  let sawRecipient = false;

  for (let i = 0; i < scenes.length; i++) {
    const scene = scenes[i];
    const mark = opts.sentinelOf(i);

    // Per-scene user text renders.
    await expect(player.getByText(mark, { exact: false })).toBeVisible({ timeout: 15_000 });

    // Per-scene image counts: single scene shows exactly 1; gallery shows N.
    if (scene.id === opts.singleSceneId) {
      await expect(player.locator('img')).toHaveCount(1);
    } else if (scene.id === opts.gallerySceneId) {
      await expect(player.locator('img')).toHaveCount(opts.galleryCount);
    }

    if (!sawRecipient && (await player.getByText(RECIPIENT, { exact: false }).count()) > 0) {
      sawRecipient = true;
    }

    if (i < scenes.length - 1) {
      await player.click();
      const next = opts.sentinelOf(i + 1);
      await expect(player.getByText(next, { exact: false })).toBeVisible({ timeout: 15_000 });
    }
  }

  expect(sawRecipient, 'recipient name never rendered').toBeTruthy();
}
