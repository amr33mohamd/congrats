import { test, expect } from '@playwright/test';
import { login, userEmail, listTemplates } from './helpers';
import { TEMPLATE_CATALOG, CATALOG_CATEGORIES } from '@/content/templates';

/**
 * Template galleries: the builder picker (signed in) and the public
 * /templates shop window (signed out). Both render the SAME live-preview card
 * (data-testid="template-card", accessible name = template title).
 */
test.describe('Template gallery', () => {
  test('builder template picker lists every published template as a card', async ({ page }) => {
    await login(page, userEmail('gallery'));
    const templates = await listTemplates(page.request);

    await page.goto('/en/builder');
    await expect(page.getByRole('heading', { name: 'Create a new experience' })).toBeVisible();

    const cards = page.getByTestId('template-card');
    await expect(cards.first()).toBeVisible({ timeout: 15_000 });
    await expect(cards).toHaveCount(templates.length);
    // In the picker a card CREATES on click, so it is a button named after the template.
    await expect(page.getByRole('button', { name: templates[0].name, exact: true })).toBeVisible();
  });

  test('catalog exposes AR + EN and free + paid templates', async ({ page }) => {
    await login(page, userEmail('gallery'));
    const templates = await listTemplates(page.request);
    expect(templates.length).toBe(TEMPLATE_CATALOG.length);
    expect(templates.some((t) => t.locale === 'ar')).toBeTruthy();
    expect(templates.some((t) => t.locale === 'en')).toBeTruthy();
    expect(templates.some((t) => t.isPaid)).toBeTruthy();
    expect(templates.some((t) => !t.isPaid)).toBeTruthy();
  });
});

test.describe('Public /templates gallery', () => {
  test('renders every template and filters by occasion', async ({ page }) => {
    await page.goto('/en/templates');
    await expect(page.getByRole('heading', { level: 1, name: 'Handcrafted animated templates' })).toBeVisible();

    const cards = page.getByTestId('template-card');
    await expect(cards).toHaveCount(TEMPLATE_CATALOG.length);
    // Signed out, a card is a link into the builder (which bounces to login).
    await expect(cards.first()).toHaveAttribute('href', /\/builder/);

    const all = page.getByRole('button', { name: 'All occasions' });
    await expect(all).toHaveAttribute('aria-pressed', 'true');

    // Filter to invitations: exactly the invitation templates remain.
    const invitation = CATALOG_CATEGORIES.find((c) => c.slug === 'invitation')!;
    const invitationTitles = TEMPLATE_CATALOG.filter((t) => t.category === 'invitation').map((t) =>
      t.locale === 'ar' ? t.titleAr : t.titleEn,
    );
    const chip = page.getByRole('button', { name: invitation.nameEn, exact: true });
    await chip.click();
    await expect(chip).toHaveAttribute('aria-pressed', 'true');
    await expect(all).toHaveAttribute('aria-pressed', 'false');
    await expect(cards).toHaveCount(invitationTitles.length);
    const labels = await cards.evaluateAll((els) => els.map((e) => e.getAttribute('aria-label')));
    expect(labels.sort()).toEqual([...invitationTitles].sort());

    // Another occasion swaps the set; "All" restores it.
    const birthday = CATALOG_CATEGORIES.find((c) => c.slug === 'birthday')!;
    await page.getByRole('button', { name: birthday.nameEn, exact: true }).click();
    await expect(cards).toHaveCount(TEMPLATE_CATALOG.filter((t) => t.category === 'birthday').length);

    await all.click();
    await expect(cards).toHaveCount(TEMPLATE_CATALOG.length);
  });

  test('renders in Arabic, right to left', async ({ page }) => {
    await page.goto('/ar/templates');
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    await expect(page.getByTestId('template-card')).toHaveCount(TEMPLATE_CATALOG.length);
    const invitation = CATALOG_CATEGORIES.find((c) => c.slug === 'invitation')!;
    await page.getByRole('button', { name: invitation.nameAr, exact: true }).click();
    await expect(page.getByTestId('template-card')).toHaveCount(
      TEMPLATE_CATALOG.filter((t) => t.category === 'invitation').length,
    );
  });
});
