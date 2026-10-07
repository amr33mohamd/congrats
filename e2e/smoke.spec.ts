import { test, expect } from '@playwright/test';

test.describe('Smoke / i18n / RTL', () => {
  test('/ redirects to /ar even for an English browser', async ({ browser }) => {
    // Arabic is the main language: locale detection is off (i18n/routing), so
    // Accept-Language never sends a visitor to /en — only an explicit choice does.
    const ctx = await browser.newContext({ locale: 'en-US' });
    const page = await ctx.newPage();
    const res = await page.goto('/');
    await page.waitForURL(/\/ar(\/|$)/);
    expect(page.url()).toMatch(/\/ar(\/|$)/);
    expect(res?.status()).toBeLessThan(400);
    await ctx.close();
  });

  test('/ redirects to /ar when Arabic is the preferred language', async ({ browser }) => {
    // With an Arabic Accept-Language, the default locale (ar) is chosen.
    const ctx = await browser.newContext({ locale: 'ar-EG' });
    const page = await ctx.newPage();
    await page.goto('/');
    await page.waitForURL(/\/ar(\/|$)/);
    expect(page.url()).toMatch(/\/ar(\/|$)/);
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    await ctx.close();
  });

  test('/ar renders RTL', async ({ page }) => {
    await page.goto('/ar');
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    await expect(page.locator('html')).toHaveAttribute('lang', 'ar');
  });

  test('/en renders LTR with hero + occasions gallery', async ({ page }) => {
    await page.goto('/en');
    await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');

    // Hero heading.
    await expect(
      page.getByRole('heading', { name: "Send a moment they'll never forget" }),
    ).toBeVisible();

    // Occasion / category gallery section.
    await expect(
      page.getByRole('heading', { name: 'An experience for every occasion' }),
    ).toBeVisible();
    // Several occasion tiles linking into the app.
    const occasions = page.locator('#occasions a');
    expect(await occasions.count()).toBeGreaterThanOrEqual(8);
  });

  test('language can be switched EN ↔ AR from the header toggle', async ({ page }) => {
    await page.goto('/en');
    // The toggle to Arabic is labelled "ع".
    await page.getByRole('link', { name: 'ع' }).click();
    await page.waitForURL(/\/ar(\/|$)/);
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');

    // And back to English (labelled "EN").
    await page.getByRole('link', { name: 'EN' }).click();
    await page.waitForURL(/\/en(\/|$)/);
    await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
  });
});
