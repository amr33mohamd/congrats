import { test, expect } from '@playwright/test';
import { login, userEmail, listTemplates } from './helpers';

test.describe('Template gallery', () => {
  test('builder template picker lists several templates', async ({ page }) => {
    await login(page, userEmail('gallery'));
    await page.goto('/en/builder');
    await expect(page.getByRole('heading', { name: 'Create a new experience' })).toBeVisible();

    // Each card has a "Use this template" button.
    const useButtons = page.getByRole('button', { name: 'Use this template' });
    await expect(useButtons.first()).toBeVisible({ timeout: 15_000 });
    expect(await useButtons.count()).toBeGreaterThanOrEqual(4);
  });

  test('catalog exposes both AR and EN templates across the 16 seeded', async ({ page }) => {
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
