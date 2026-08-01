import { test, expect } from '@playwright/test';
import {
  login,
  userEmail,
  ADMIN_EMAIL,
  pickTemplate,
  createExperience,
  setStepText,
  publish,
  shareSlug,
  uploadPaymentScreenshot,
  submitOrder,
  assertPlayerPlays,
  assertLinkLocked,
} from './helpers';

/**
 * THE MONEY PATH. Paid template → publish creates an order → submit a payment
 * screenshot → share link stays LOCKED until an admin approves it through the
 * real admin queue UI → then it UNLOCKS and plays. A second order is rejected
 * and stays locked.
 *
 * Setup (create/order/submit/upload) goes through the authenticated dashboard
 * API; the LOCK/UNLOCK is always verified on the real public page, and the
 * APPROVE/REJECT is driven through the real admin Review drawer.
 */
test('paid experience stays locked until admin approves, then plays', async ({ page }) => {
  const recipient = 'MoneyPathApprove';
  await login(page, userEmail('paid-approve'));

  const paid = await pickTemplate(page.request, { paid: true, locale: 'en' });
  const expId = await createExperience(page.request, {
    templateId: paid.id,
    locale: 'en',
    recipientName: recipient,
  });
  await setStepText(page.request, expId, recipient);

  // Publish a PAID experience → 202 payment_required with an order.
  const pub = await publish(page.request, expId);
  expect(pub.status, `expected 202 payment_required, got ${pub.status}`).toBe(202);
  expect(pub.body.kind).toBe('payment_required');
  const orderId = pub.body.order.id;
  const orderRef = pub.body.order.orderRef as string;
  const slug = pub.body.slug ?? (await shareSlug(page.request, expId));
  expect(orderId).toBeTruthy();
  expect(orderRef).toBeTruthy();
  expect(slug).toBeTruthy();

  // Before payment is even submitted: link is LOCKED (neutral page, no content).
  await assertLinkLocked(page, slug);

  // Submit a payment screenshot.
  const mediaId = await uploadPaymentScreenshot(page.request, expId);
  await submitOrder(page.request, orderId, mediaId, 'INSTAPAY-REF-APPROVE');

  // Still LOCKED while the order is only submitted (not approved).
  await assertLinkLocked(page, slug);

  // ── Admin approves via the real queue UI ──────────────────────────────
  await login(page, ADMIN_EMAIL);
  await page.goto('/en/admin/queue');
  await expect(page.getByRole('heading', { name: 'Payment queue' })).toBeVisible();

  // Find OUR order's row by its unique orderRef (immune to leftover DB rows from
  // prior runs that share a recipient name) and open the review drawer.
  const row = page.locator('tr', { hasText: orderRef });
  await expect(row).toBeVisible({ timeout: 15_000 });
  await row.getByRole('button', { name: 'Review' }).click();

  // Approve in the drawer.
  const approveBtn = page.getByRole('button', { name: /Approve/ });
  await expect(approveBtn).toBeVisible();
  await approveBtn.click();

  // Drawer closes / queue reloads — our order should leave the submitted queue.
  await expect(page.locator('tr', { hasText: orderRef })).toHaveCount(0, {
    timeout: 15_000,
  });

  // ── Now the share link UNLOCKS and the Player plays ───────────────────
  await assertPlayerPlays(page, slug);
});

test('paid experience stays locked after admin rejects', async ({ page }) => {
  const recipient = 'MoneyPathReject';
  await login(page, userEmail('paid-reject'));

  const paid = await pickTemplate(page.request, { paid: true, locale: 'en' });
  const expId = await createExperience(page.request, {
    templateId: paid.id,
    locale: 'en',
    recipientName: recipient,
  });
  await setStepText(page.request, expId, recipient);

  const pub = await publish(page.request, expId);
  expect(pub.status).toBe(202);
  const orderId = pub.body.order.id;
  const orderRef = pub.body.order.orderRef as string;
  const slug = pub.body.slug ?? (await shareSlug(page.request, expId));

  const mediaId = await uploadPaymentScreenshot(page.request, expId);
  await submitOrder(page.request, orderId, mediaId, 'INSTAPAY-REF-REJECT');

  await assertLinkLocked(page, slug);

  // ── Admin rejects via the real queue UI ───────────────────────────────
  await login(page, ADMIN_EMAIL);
  await page.goto('/en/admin/queue');
  const row = page.locator('tr', { hasText: orderRef });
  await expect(row).toBeVisible({ timeout: 15_000 });
  await row.getByRole('button', { name: 'Review' }).click();

  // Open the reject sub-form (button label is "✕ Reject"), give a reason, confirm.
  await page.getByRole('button', { name: /Reject$/ }).click();
  await page.getByRole('textbox', { name: 'Reason for rejection' }).fill(
    'Payment proof unreadable (e2e)',
  );
  await page.getByRole('button', { name: 'Confirm rejection' }).click();

  await expect(page.locator('tr', { hasText: orderRef })).toHaveCount(0, {
    timeout: 15_000,
  });

  // Link MUST remain locked after a rejection.
  await assertLinkLocked(page, slug);
});
