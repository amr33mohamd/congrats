import { test, expect } from '@playwright/test';
import {
  login,
  userEmail,
  pickTemplate,
  assertPlayerPlays,
} from './helpers';

/**
 * Free template → create via the real builder UI → publish → open the share
 * link → assert the Player plays.
 *
 * The create + publish are driven through the actual wizard UI. We then read the
 * share slug from the authenticated dashboard API (the ExperienceCard share
 * dialog uses the same slug) and verify PLAYBACK on the real public page.
 */
test('free experience: build, publish, and play the share link', async ({ page }) => {
  const recipient = 'FreePlayPal';
  await login(page, userEmail('free'));

  // Find a free template id (to disambiguate the picker card we click).
  const free = await pickTemplate(page.request, { paid: false, locale: 'en' });

  // Drive the picker UI: set recipient, then "Use this template" on the chosen card.
  await page.goto('/en/builder');
  await page.getByRole('heading', { name: 'Create a new experience' }).waitFor();
  await page.locator('#picker-recipient').fill(recipient);

  // Click the matching template's "Use this template" button (by id lookup we
  // know it's free; click the first free card's button — the API confirmed one
  // exists and the picker only shows published templates).
  const useButtons = page.getByRole('button', { name: 'Use this template' });
  await expect(useButtons.first()).toBeVisible({ timeout: 15_000 });

  // We need to click a FREE card. Cards are the direct children of the grid;
  // a free card carries a "Free" badge.
  const freeCard = page
    .locator('.grid > div')
    .filter({ hasText: 'Free' })
    .first();
  await expect(freeCard).toBeVisible();
  await freeCard.getByRole('button', { name: 'Use this template' }).click();

  // Lands in the builder wizard (details step).
  await page.waitForURL(/\/en\/builder\/[0-9a-f-]+/, { timeout: 30_000 });
  const experienceId = page.url().match(/builder\/([0-9a-f-]+)/)![1];

  // Make sure recipient is set on the details step (picker may pre-fill it).
  const recipientInput = page.getByRole('textbox', { name: "Recipient's name" });
  await recipientInput.waitFor();
  if ((await recipientInput.inputValue()).trim().length === 0) {
    await recipientInput.fill(recipient);
  }

  // Advance: details → content → review. ("Next", exact, to avoid the Next.js
  // dev-tools button whose a11y name also contains "Next".)
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Personalize each scene' })).toBeVisible();
  // Touch a text field on the content step so there is at least one edited step.
  const firstText = page.locator('main textarea, main input[type="text"]').first();
  if (await firstText.count()) {
    await firstText.click();
    // leave default content; just ensure a step exists (seeded defaults suffice).
  }
  await page.getByRole('button', { name: 'Next', exact: true }).click();

  // Review step → publish.
  await expect(page.getByRole('button', { name: 'Publish & get link' })).toBeVisible({
    timeout: 15_000,
  });
  await page.getByRole('button', { name: 'Publish & get link' }).click();

  // Free publish routes back to the dashboard.
  await page.waitForURL(/\/en\/dashboard/, { timeout: 30_000 });

  // Read the share slug from the authenticated API (same slug the UI shares).
  const res = await page.request.post(
    `/api/dashboard/experiences/${experienceId}/share-link`,
  );
  expect(res.ok()).toBeTruthy();
  const { slug } = await res.json();
  expect(slug).toBeTruthy();

  // PLAY: open the real public page and assert the Player renders + advances.
  await assertPlayerPlays(page, slug);

  // The page title reflects the recipient (set in generateMetadata for unlocked).
  await expect(page).toHaveTitle(new RegExp(recipient, 'i'));
});
