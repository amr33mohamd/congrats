/**
 * Orders / payment service.
 *
 *  - `createOrder`  : for a PAID experience, snapshot amount + currency +
 *                     instapay handle onto a `pending` order. Reuses an existing
 *                     actionable (pending/submitted) order instead of duplicating.
 *  - `submitPayment`: attach the payment screenshot + buyer reference, compute a
 *                     SHA-256 of the screenshot bytes to FLAG duplicate proofs,
 *                     then drive the authoritative `submit` transition through
 *                     `transitionOrder` (never set state by hand).
 *  - `getOrder`     : owner-scoped status poll.
 *
 * Unlock is NEVER performed here — that is the admin `approve` transition.
 */
import { createHash } from 'node:crypto';
import { nanoid } from 'nanoid';
import type { UserContext } from '@/server/db-context';
import { getStorage, type StorageBucket } from '@/server/storage';
import {
  transitionOrder,
  makeOrderRef,
  type OrderLike,
  type OrderState,
} from '@/lib/orders/state-machine';
import type { Order } from '@/db/schema';
import { DashboardError } from './errors';
import { makeOrderEffects } from './order-effects';
import * as repo from './repositories';

export interface CreatedOrder {
  id: string;
  orderRef: string;
  instapayHandle: string;
  amountPiastres: number;
  currency: string;
  status: Order['status'];
  experienceId: string;
}

function instapayHandle(): string {
  const handle = process.env.INSTAPAY_HANDLE?.trim();
  if (handle) return handle;
  // Never show a made-up account in production — a buyer would send real
  // money to it. Checkout stays closed until the owner sets the handle.
  if (process.env.NODE_ENV === 'production' || process.env.VERCEL) {
    throw DashboardError.unprocessable(
      'Paid checkout is not open yet — please try again soon. / الدفع لسه مش متاح، جرّب تاني قريب.',
    );
  }
  return 'congrats@instapay';
}

export async function createOrder(ctx: UserContext, experienceId: string): Promise<CreatedOrder> {
  const exp = await repo.getOwnedExperience(ctx.db, ctx.user.id, experienceId);
  if (!exp) throw DashboardError.notFound('experience not found');

  const tpl = await repo.getTemplateById(ctx.db, exp.templateId);
  if (!tpl) throw DashboardError.notFound('template not found');

  if (!tpl.isPaid || tpl.pricePiastres <= 0) {
    throw DashboardError.unprocessable('experience uses a free template; no order required');
  }
  if (exp.isUnlocked) {
    throw DashboardError.conflict('experience is already unlocked');
  }

  // Reuse an existing actionable order instead of creating a duplicate one.
  const existing = await repo.findReusableOrder(ctx.db, ctx.user.id, experienceId);
  if (existing && (existing.status === 'pending' || existing.status === 'submitted')) {
    return toCreatedOrder(existing);
  }

  const order = await repo.insertOrder(ctx.db, {
    userId: ctx.user.id,
    experienceId,
    templateId: tpl.id,
    amountPiastres: tpl.pricePiastres,
    currency: tpl.currency,
    orderRef: makeOrderRef(nanoid(8)),
    instapayHandle: instapayHandle(),
    status: 'pending',
  });

  // Move the experience into the awaiting-payment state for dashboard clarity.
  if (exp.status === 'draft') {
    await repo.updateOwnedExperience(ctx.db, ctx.user.id, experienceId, {
      status: 'awaiting_payment',
    });
  }

  return toCreatedOrder(order);
}

export interface SubmitResult {
  order: CreatedOrder;
  duplicateScreenshot: boolean;
}

export async function submitPayment(
  ctx: UserContext,
  orderId: string,
  input: { screenshotMediaId: string; paymentRef: string },
  meta?: { ip?: string; userAgent?: string },
): Promise<SubmitResult> {
  const order = await repo.getOwnedOrder(ctx.db, ctx.user.id, orderId);
  if (!order) throw DashboardError.notFound('order not found');

  // The screenshot media must be owned by the caller + be a payment proof.
  const screenshot = await repo.getOwnedMedia(ctx.db, ctx.user.id, input.screenshotMediaId);
  if (!screenshot) throw DashboardError.notFound('screenshot media not found');
  if (screenshot.kind !== 'payment_screenshot' || screenshot.bucket !== 'payment-proofs') {
    throw DashboardError.validation('referenced media is not a payment screenshot');
  }

  // Compute a content hash to FLAG duplicate proofs (e.g. same screenshot reused
  // across orders). We don't block — admins review the flag.
  const duplicateScreenshot = await isDuplicateScreenshot(ctx, screenshot);

  const orderLike: OrderLike = {
    id: order.id,
    // DB stores status as text (CHECK-constrained to the same union) → narrow it.
    status: order.status as OrderState,
    userId: order.userId,
    experienceId: order.experienceId,
    amountPiastres: order.amountPiastres,
  };

  const effects = makeOrderEffects(ctx.db);

  // Authoritative transition — throws OrderTransitionError on bad state/input.
  await transitionOrder(
    orderLike,
    'submit',
    { type: 'user', id: ctx.user.id, ip: meta?.ip, userAgent: meta?.userAgent },
    effects,
    { screenshotMediaId: input.screenshotMediaId, paymentRef: input.paymentRef },
  );

  if (duplicateScreenshot) {
    await effects.appendAudit({
      actorId: ctx.user.id,
      actorType: 'user',
      action: 'order.duplicate_screenshot_flagged',
      entityType: 'order',
      entityId: order.id,
      metadata: { screenshotMediaId: input.screenshotMediaId },
      ip: meta?.ip,
      userAgent: meta?.userAgent,
    });
  }

  const fresh = await repo.getOwnedOrder(ctx.db, ctx.user.id, orderId);
  return { order: toCreatedOrder(fresh ?? order), duplicateScreenshot };
}

export async function getOrder(ctx: UserContext, orderId: string): Promise<Order> {
  const order = await repo.getOwnedOrder(ctx.db, ctx.user.id, orderId);
  if (!order) throw DashboardError.notFound('order not found');
  return order;
}

/* ─────────────────────────── Duplicate detection ──────────────────────── */

/**
 * Hash the screenshot bytes (SHA-256) and compare against the user's OTHER
 * payment screenshots. Returns true when an identical image was already
 * submitted (a recycled proof). This is advisory — admins still review.
 *
 * Scoped to the current user: a cross-user reuse scan is an admin/cron concern
 * (B2) and is intentionally out of the user-scoped data layer.
 */
async function isDuplicateScreenshot(
  ctx: UserContext,
  screenshot: { id: string; bucket: string; storagePath: string },
): Promise<boolean> {
  let thisHash: string;
  try {
    const bytes = await getStorage().get(screenshot.bucket as StorageBucket, screenshot.storagePath);
    thisHash = sha256(bytes);
  } catch {
    return false; // can't read bytes → don't false-positive
  }

  const others = await repo.listOtherPaymentScreenshots(ctx.db, ctx.user.id, screenshot.id);
  for (const m of others) {
    try {
      const bytes = await getStorage().get(m.bucket as StorageBucket, m.storagePath);
      if (sha256(bytes) === thisHash) return true;
    } catch {
      /* ignore unreadable */
    }
  }
  return false;
}

function sha256(buf: Buffer): string {
  return createHash('sha256').update(buf).digest('hex');
}

function toCreatedOrder(order: Order): CreatedOrder {
  return {
    id: order.id,
    orderRef: order.orderRef,
    instapayHandle: order.instapayHandle ?? instapayHandle(),
    amountPiastres: order.amountPiastres,
    currency: order.currency,
    status: order.status,
    experienceId: order.experienceId,
  };
}
