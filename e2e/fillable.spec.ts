import { test, expect, type Page, type APIRequestContext } from '@playwright/test';
import {
  login,
  userEmail,
  listTemplates,
  getSteps,
  putSteps,
  uploadStepPhoto,
  playerRoot,
  openGateIfPresent,
  sceneSection,
  expectSceneText,
  renderedSceneIds,
} from './helpers';
import { TEMPLATE_CATALOG } from '@/content/templates';
import type { ValidatedTemplate } from '@/content/templates';
import type { SceneDef } from '@/lib/template-contract';

/**
 * FULL FILLABILITY PROOF.
 *
 * 1. Builder exposes an upload affordance for EVERY image slot, and a multi-add
 *    UI for gallery slots (max > 1) — asserted in the real content-step UI.
 * 2. ONE photo on a single-image slot and MULTIPLE on a gallery slot all render
 *    in the played /p/<slug> under the right sections (single → 1, gallery → N).
 * 3. Per-scene user text still renders, and the recipient name shows.
 * 4. A photo scene left without a photo is dropped from the card entirely (the
 *    Player never shows a caption floating over nothing).
 *
 * Photos go through the real media API carrying the stable templateStepId +
 * slotKey — the exact plumbing the builder uses.
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

async function templateDbId(page: Page, template: ValidatedTemplate): Promise<string> {
  const cards = await listTemplates(page.request);
  const id = cards.find((c) => c.name === template.titleEn && c.locale === 'en')?.id;
  expect(id, 'seeded template id not found').toBeTruthy();
  return id!;
}

/** Stamp `Pix<idx> {recipient}` into each scene's first text slot. */
async function stampText(req: APIRequestContext, expId: string, template: ValidatedTemplate) {
  const steps = await getSteps(req, expId);
  const sceneById = new Map(template.definition.scenes.map((s, idx) => [s.id, { s, idx }]));
  await putSteps(
    req,
    expId,
    steps.map((st) => {
      const entry = sceneById.get(st.templateStepId)!;
      const text = { ...st.text };
      const slot = firstEditableTextSlot(entry.s);
      if (slot) text[slot.key] = `${sentinelOf(entry.idx)} {recipient}`;
      const dateSlot = entry.s.slots.find((x) => x.type === 'date' && x.editable);
      if (dateSlot) text[dateSlot.key] = '2030-01-01T00:00:00.000Z';
      return { ...st, text };
    }),
  );
}

const sentinelOf = (idx: number) => `Pix${idx}`;

/** Content images of a section, excluding decorative art (inside aria-hidden). */
async function contentImageCount(page: Page, sceneId: string): Promise<number> {
  return sceneSection(page, sceneId)
    .locator('img')
    .evaluateAll((imgs) => imgs.filter((i) => !i.closest('[aria-hidden="true"], [aria-hidden=""]')).length);
}

test.describe('Experiences are fully fillable (name + text + photos across scenes)', () => {
  test('builder exposes an upload for every image slot and multi-add for galleries', async ({ page }) => {
    await login(page, userEmail('fill-ui'));
    const template = targetTemplate();
    const expId = await createExperience(page.request, await templateDbId(page, template));

    await page.goto(`/en/builder/${expId}?step=content`);
    const tablist = page.getByRole('tablist');
    await expect(tablist).toBeVisible({ timeout: 20_000 });
    const tabs = tablist.getByRole('tab');
    const sceneCount = template.definition.scenes.length;
    await expect(tabs).toHaveCount(sceneCount);

    let sawGalleryMultiAdd = false;
    for (let i = 0; i < sceneCount; i++) {
      const scene = template.definition.scenes[i];
      await tabs.nth(i).click();
      const slots = imageSlots(scene);
      if (slots.length === 0) continue;

      const uploadButtons = page.getByRole('button', { name: /Upload photo|Add photo/ });
      await expect(uploadButtons.first()).toBeVisible({ timeout: 10_000 });

      if (slots.some((s) => (s.max ?? 1) > 1)) {
        await expect(page.getByRole('button', { name: 'Add photo' }).first()).toBeVisible();
        await expect(page.getByText(/of \d+ photos/).first()).toBeVisible();
        sawGalleryMultiAdd = true;
      }
    }
    expect(sawGalleryMultiAdd, 'template has no gallery multi-add UI').toBeTruthy();
  });

  test('1 photo on a single slot + many on a gallery all render under the right sections', async ({ page }) => {
    await login(page, userEmail('fill-render'));
    const template = targetTemplate();
    const req = page.request;
    const expId = await createExperience(req, await templateDbId(page, template));
    await stampText(req, expId, template);

    const singleScene = template.definition.scenes.find(
      (s) => s.type === 'PhotoReveal' && imageSlots(s).some((sl) => (sl.max ?? 1) === 1),
    )!;
    const singleSlot = imageSlots(singleScene).find((sl) => (sl.max ?? 1) === 1)!;
    const galleryScene = template.definition.scenes.find((s) => s.type === 'Gallery')!;
    const gallerySlot = imageSlots(galleryScene).find((sl) => (sl.max ?? 1) > 1)!;

    // Fill EVERY photo scene so the whole card renders: 1 on each single slot,
    // 3 on the gallery.
    const GALLERY_N = 3;
    for (const scene of template.definition.scenes) {
      if (scene.type !== 'PhotoReveal' && scene.type !== 'Gallery') continue;
      const slot = imageSlots(scene)[0];
      if (!slot) continue;
      const n = scene.id === galleryScene.id ? GALLERY_N : 1;
      for (let k = 0; k < n; k++) {
        await uploadStepPhoto(req, expId, scene.id, scene.id === galleryScene.id ? gallerySlot.key : slot.key);
      }
    }
    expect(singleSlot).toBeTruthy();

    const pub = await req.post(`/api/dashboard/experiences/${expId}/publish`);
    expect(pub.status(), `publish: ${pub.status()}`).toBe(200);
    const slug = (await pub.json()).slug as string;

    await page.goto(`/en/p/${slug}`);
    const player = playerRoot(page);
    await expect(player).toBeVisible({ timeout: 15_000 });
    await expect(player).toHaveAttribute('dir', template.direction);
    await openGateIfPresent(page);

    const scenes = template.definition.scenes;
    expect(await renderedSceneIds(page)).toEqual(scenes.map((s) => s.id));

    for (let i = 0; i < scenes.length; i++) {
      if (firstEditableTextSlot(scenes[i])) {
        await expectSceneText(page, scenes[i].id, sentinelOf(i));
      }
      if (scenes[i].id === singleScene.id) {
        expect(await contentImageCount(page, singleScene.id)).toBe(1);
      } else if (scenes[i].id === galleryScene.id) {
        expect(await contentImageCount(page, galleryScene.id)).toBe(GALLERY_N);
      }
    }
    await expect(player.getByText(RECIPIENT, { exact: false }).first()).toBeVisible();
  });

  test('a photo scene without a photo is left out of the card', async ({ page }) => {
    await login(page, userEmail('fill-empty'));
    const template = targetTemplate();
    const req = page.request;
    const expId = await createExperience(req, await templateDbId(page, template));
    await stampText(req, expId, template);

    const pub = await req.post(`/api/dashboard/experiences/${expId}/publish`);
    expect(pub.status()).toBe(200);
    const slug = (await pub.json()).slug as string;

    await page.goto(`/en/p/${slug}`);
    await expect(playerRoot(page)).toBeVisible({ timeout: 15_000 });
    await openGateIfPresent(page);

    // Photo scenes whose ground is not itself an image are omitted when empty.
    const expected = template.definition.scenes
      .filter(
        (s) =>
          !((s.type === 'PhotoReveal' || s.type === 'Gallery') && s.background?.type !== 'image'),
      )
      .map((s) => s.id);
    expect(await renderedSceneIds(page)).toEqual(expected);
    for (const id of expected) {
      const idx = template.definition.scenes.findIndex((s) => s.id === id);
      if (firstEditableTextSlot(template.definition.scenes[idx])) {
        await expectSceneText(page, id, sentinelOf(idx));
      }
    }
  });
});
