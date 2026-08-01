import { test, expect } from '@playwright/test';
import { login, userEmail } from './helpers';

test.describe('Auth gating (logged out)', () => {
  test('/en/dashboard redirects to login', async ({ page }) => {
    await page.goto('/en/dashboard');
    await page.waitForURL(/\/login/);
    expect(page.url()).toMatch(/\/login/);
  });

  test('/en/builder redirects to login', async ({ page }) => {
    await page.goto('/en/builder');
    await page.waitForURL(/\/login/);
    expect(page.url()).toMatch(/\/login/);
  });

  test('/en/admin redirects to login', async ({ page }) => {
    await page.goto('/en/admin');
    await page.waitForURL(/\/login/);
    expect(page.url()).toMatch(/\/login/);
  });

  test('dashboard API returns 401 unauthenticated', async ({ request }) => {
    const res = await request.get('/api/dashboard/experiences');
    expect(res.status()).toBe(401);
  });
});

test.describe('User login', () => {
  test('dev-login with a normal email lands on the dashboard', async ({ page }) => {
    await login(page, userEmail('login'));
    expect(page.url()).toMatch(/\/en\/dashboard/);
    // The experiences area renders (heading "My experiences").
    await expect(page.getByRole('heading', { name: 'My experiences' })).toBeVisible();
  });

  test('non-admin user is bounced from /admin to dashboard', async ({ page }) => {
    await login(page, userEmail('login'));
    await page.goto('/en/admin');
    await page.waitForURL(/\/dashboard/);
    expect(page.url()).toMatch(/\/dashboard/);
  });
});
