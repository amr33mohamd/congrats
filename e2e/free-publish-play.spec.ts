import { test, expect } from '@playwright/test';
import { login, userEmail, pickTemplate, assertPlayerPlays } from './helpers';

/**
 * Free template → create via the real builder UI → publish → open the share
 * link → assert the scrolling Player reads top to bottom.
 *
 * Create + publish are driven through the actual picker + wizard UI. The share
 * slug is then read from the authenticated dashboard API (the same slug the
 * ShareDialog shows) and PLAYBACK is verified on the real public page.
 */
test('free experience: build, publish, and play the share link', async ({ page }) => {
  const recipient = 'FreePlayPal';
  await login(page, userEmail('free'));

  // The API tells us which card is free; the picker card's accessible name is
  // the template title, so we click exactly that card.
  const free = await pickTemplate(page.request, { paid: false, locale: 'en' });

  await page.goto('/en/builder');
  await page.getByRole('heading', { name: 'Create a new experience' }).waitFor();
  await page.locator('#picker-recipient').fill(recipient);

  const card = page.getByTestId('template-card').and(page.getByRole('button', { name: free.name, exact: true }));
  await expect(card).toBeVisible({ timeout: 15_000 });
  await card.click();

  // Lands in the builder wizard (details step).
  await page.waitForURL(/\/en\/builder\/[0-9a-f-]+/, { timeout: 30_000 });
  const experienceId = page.url().match(/builder\/([0-9a-f-]+)/)![1];

  // The picker passes the typed recipient through on create.
  const recipientInput = page.getByRole('textbox', { name: "Recipient's name" });
  await expect(recipientInput).toHaveValue(recipient);

  // details → content → review. ("Next", exact, to avoid the Next.js dev-tools
  // button whose accessible name also contains "Next".)
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Personalize each scene' })).toBeVisible();
  // The builder's live preview embeds the real Player (no gate, already open).
  await expect(page.getByTestId('player-root').first()).toBeVisible();
  await page.getByRole('button', { name: 'Next', exact: true }).click();

  const publishBtn = page.getByRole('button', { name: 'Publish & get link' });
  await expect(publishBtn).toBeVisible({ timeout: 15_000 });
  await publishBtn.click();

  // Free publish routes back to the dashboard.
  await page.waitForURL(/\/en\/dashboard/, { timeout: 30_000 });

  const res = await page.request.post(`/api/dashboard/experiences/${experienceId}/share-link`);
  expect(res.ok()).toBeTruthy();
  const { slug } = await res.json();
  expect(slug).toBeTruthy();

  await assertPlayerPlays(page, slug);
  // The page title reflects the recipient (generateMetadata for unlocked links).
  await expect(page).toHaveTitle(new RegExp(recipient, 'i'));
});
