import { test, expect } from '@playwright/test';
import { login, userEmail, listTemplates } from './helpers';

test.describe('Template gallery', () => {
  test('builder template picker lists several templates', async ({ page }) => {
    await login(page, userEmail('gallery'));
    await page.goto('/en/builder');
    await expect(page.getByRole('heading', { name: 'Create a new experience' })).toBeVisible();

    // Each card IS the button, and is named after its template rather than
    // repeating "Use this template" a dozen times — so assert on the cards
    // themselves via the test id they expose.
    const cards = page.getByTestId('template-card');
    await expect(cards.first()).toBeVisible({ timeout: 15_000 });
    expect(await cards.count()).toBeGreaterThanOrEqual(4);

    // A card must carry an accessible name, or the grid is unusable by keyboard
    // and screen reader alike.
    await expect(cards.first()).toHaveAttribute('aria-label', /\S/);
  });

  test('catalog exposes both AR and EN templates across the seeded catalog', async ({ page }) => {
    await login(page, userEmail('gallery'));
    const templates = await listTemplates(page.request);
    expect(templates.length).toBeGreaterThanOrEqual(8);
    expect(templates.some((t) => t.locale === 'ar')).toBeTruthy();
    expect(templates.some((t) => t.locale === 'en')).toBeTruthy();
    // Both free and paid exist.
    expect(templates.some((t) => t.isPaid)).toBeTruthy();
    expect(templates.some((t) => !t.isPaid)).toBeTruthy();
  });
});
