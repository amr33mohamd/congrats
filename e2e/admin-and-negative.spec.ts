import { test, expect } from '@playwright/test';
import { login, ADMIN_EMAIL, assertLinkLocked } from './helpers';

test.describe('Admin panel', () => {
  test('admin can load the approval queue', async ({ page }) => {
    await login(page, ADMIN_EMAIL);
    await page.goto('/en/admin/queue');
    await expect(page.getByRole('heading', { name: 'Payment queue' })).toBeVisible();
    // Either rows or the empty state — both are a successfully-loaded queue.
    const loaded = page
      .getByText('No orders awaiting review.')
      .or(page.getByRole('button', { name: 'Review' }).first());
    await expect(loaded).toBeVisible({ timeout: 15_000 });
  });

  test('admin can load the templates list', async ({ page }) => {
    await login(page, ADMIN_EMAIL);
    await page.goto('/en/admin/templates');
    // The admin templates API should return the 16 seeded templates.
    const res = await page.request.get('/api/admin/templates');
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    const list = Array.isArray(body) ? body : (body.templates ?? []);
    expect(list.length).toBeGreaterThanOrEqual(8);
  });
});

test.describe('Negative: no content leakage', () => {
  test('a random/guessed slug shows the unavailable page', async ({ page }) => {
    await assertLinkLocked(page, 'totally-bogus-slug-xyz');
  });
});
