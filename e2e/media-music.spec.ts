import path from 'node:path';
import { test, expect } from '@playwright/test';
import {
  login,
  userEmail,
  listTemplates,
  createExperience,
  publish,
  shareSlug,
  playerRoot,
  openGateIfPresent,
  sceneSection,
  tinyPng,
} from './helpers';

/**
 * The sender's own media in the builder: a video in a photo slot, their own
 * song for the card, a line-break button for text, and a music switch on the
 * live preview. Then the published card plays the video (served with byte
 * ranges, which Safari needs) and the song.
 *
 * Fixtures are cut from this project's own renders and original tracks.
 */
const FIXTURES = path.join(path.dirname(new URL(import.meta.url).pathname), 'fixtures');
const CLIP = path.join(FIXTURES, 'clip.mp4');
const SONG = path.join(FIXTURES, 'tone.mp3');

type Slot = { key: string; type: string; max?: number; editable?: boolean; bind?: string };
type Scene = { id: string; type: string; slots: Slot[] };
type Step = { templateStepId: string; orderIndex: number };

test('video in a photo slot, own song, line breaks and the preview music switch', async ({ page }) => {
  await login(page, userEmail('media'));

  // A free English template with a single-photo slot on a scene that shows it.
  const templates = (await listTemplates(page.request)).filter((t) => !t.isPaid && t.locale === 'en');
  let experienceId = '';
  let target: { scene: Scene; slot: Slot; tabIndex: number } | null = null;
  for (const tpl of templates) {
    const id = await createExperience(page.request, { templateId: tpl.id, locale: 'en', recipientName: 'Sara' });
    const view = await (await page.request.get(`/api/dashboard/experiences/${id}`)).json();
    const scenes = view.scenes as Scene[];
    const order = new Map((view.steps as Step[]).map((s) => [s.templateStepId, s.orderIndex]));
    const sorted = [...scenes].sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
    const idx = sorted.findIndex(
      (sc) =>
        ['Cover', 'PhotoReveal', 'GiftReveal'].includes(sc.type) &&
        sc.slots.some((s) => s.type === 'image' && (s.max ?? 1) <= 1 && s.editable !== false && !s.bind),
    );
    if (idx >= 0) {
      const scene = sorted[idx];
      const slot = scene.slots.find((s) => s.type === 'image' && (s.max ?? 1) <= 1)!;
      experienceId = id;
      target = { scene, slot, tabIndex: idx };
      break;
    }
  }
  expect(target, 'no free template with a single photo slot').not.toBeNull();
  const { scene, tabIndex } = target!;

  await page.goto(`/en/builder/${experienceId}?step=content`);
  await page.getByRole('tab').nth(tabIndex).click();

  // ── Video in the photo slot ──
  await page.getByLabel('Upload photo or video').setInputFiles(CLIP);
  const previewVideo = sceneSection(page, scene.id).locator('video');
  await expect(previewVideo).toHaveCount(1, { timeout: 30_000 });
  await expect(previewVideo).toHaveAttribute('src', /^\/api\/storage\/experience-media\/.+\.mp4$/);

  // ── Own song ──
  await page.getByLabel('Upload your song').setInputFiles(SONG);
  await expect(page.getByText('Playing your song')).toBeVisible({ timeout: 30_000 });
  // The preview's own switch: stop / play, whichever state autoplay left it in.
  const musicSwitch = page.getByRole('button', { name: /^(Stop music|Play music)$/ });
  await expect(musicSwitch).toBeVisible();
  const before = await musicSwitch.getAttribute('aria-pressed');
  await musicSwitch.click();
  await expect(musicSwitch).not.toHaveAttribute('aria-pressed', before ?? '');
  const audioSrc = await page.locator('audio').first().getAttribute('src');
  expect(audioSrc).toMatch(/^\/api\/storage\/experience-media\/.+\.mp3$/);

  // ── Line break ──
  const textSlot = page.locator('[id^="slot-"]').first();
  if ((await textSlot.count()) > 0) {
    const key = (await textSlot.getAttribute('id'))!.slice('slot-'.length);
    await textSlot.fill('First');
    await textSlot.press('End');
    await page.getByRole('button', { name: 'Start a new line at the cursor' }).first().click();
    await page.keyboard.type('Second');
    await expect(page.locator(`#slot-${key}`)).toHaveValue('First\nSecond');

    // ── Darker text ── the preview's copy of this field turns a darker colour.
    const shown = sceneSection(page, scene.id).locator('h2, p').filter({ hasText: 'Second' }).first();
    await expect(shown).toBeVisible();
    const colorOf = () => shown.evaluate((el) => getComputedStyle(el).color);
    const lightness = (c: string) => c.match(/\d+/g)!.slice(0, 3).map(Number).reduce((a, b) => a + b, 0);
    const before = lightness(await colorOf());
    const darker = page.getByRole('button', { name: 'Darker' }).first();
    await darker.click();
    await expect(darker).toHaveAttribute('aria-pressed', 'true');
    await expect.poll(async () => lightness(await colorOf())).toBeLessThan(before);
  }

  // ── Published card ──
  const pub = await publish(page.request, experienceId);
  expect(pub.status, JSON.stringify(pub.body)).toBeLessThan(300);
  const slug = await shareSlug(page.request, experienceId);

  await page.goto(`/en/p/${slug}`);
  await expect(playerRoot(page)).toBeVisible();
  await openGateIfPresent(page);
  const cardVideo = sceneSection(page, scene.id).locator('video');
  await expect(cardVideo).toHaveCount(1);
  const videoSrc = (await cardVideo.getAttribute('src'))!;
  await expect(page.locator('audio')).toHaveAttribute('src', /\.mp3(\?|$)/);

  // Byte ranges for the video (iPhone Safari will not play without them).
  const ranged = await page.request.get(videoSrc, { headers: { Range: 'bytes=0-99' } });
  expect(ranged.status()).toBe(206);
  expect(ranged.headers()['content-range']).toMatch(/^bytes 0-99\/\d+$/);
  expect(ranged.headers()['content-type']).toBe('video/mp4');
  expect((await ranged.body()).byteLength).toBe(100);
});

test('upload routes refuse a song in a photo slot and a photo as music', async ({ page }) => {
  await login(page, userEmail('media-neg'));
  const tpl = (await listTemplates(page.request)).find((t) => !t.isPaid)!;
  const id = await createExperience(page.request, { templateId: tpl.id, locale: 'en', recipientName: 'Omar' });
  const fs = await import('node:fs');
  const song = await page.request.post('/api/dashboard/media', {
    multipart: { kind: 'step_image', experienceId: id, file: { name: 'a.png', mimeType: 'image/png', buffer: fs.readFileSync(SONG) } },
  });
  expect(song.status()).toBe(400);
  const photoAsMusic = await page.request.post('/api/dashboard/media', {
    multipart: { kind: 'music', experienceId: id, file: { name: 'a.mp3', mimeType: 'audio/mpeg', buffer: tinyPng() } },
  });
  expect(photoAsMusic.status()).toBe(400);
  // Locally there is no Blob store, so the browser-to-Blob token route says so.
  const token = await page.request.post('/api/dashboard/media/client-upload', { data: { type: 'blob.generate-client-token' } });
  expect(token.status()).toBe(409);
});
