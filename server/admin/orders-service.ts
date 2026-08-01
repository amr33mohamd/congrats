/**
 * Admin order review service — the approval queue + approve/reject.
 *
 * Approve/Reject NEVER mutate unlock state directly: they call the shared
 * `transitionOrder` state machine with a DB-backed OrderEffects adapter, which
 * persists the order, flips experience.isUnlocked + share_link.isActive, and
 * writes the audit row. We resolve the admin's admin_users.id first so the
 * order's reviewed_by FK and the audit actor are correct.
 */
import { asc, eq, sql } from 'drizzle-orm';
import type { DbClient } from '@/db';
import { orders, experiences, templates, media, users } from '@/db/schema';
import {
  transitionOrder,
  type OrderLike,
  type OrderState,
} from '@/lib/orders/state-machine';
import { makeAdminOrderEffects } from './order-effects';
import { resolveAdminUserId } from './audit';
import { notFound } from './http';
import type { AdminContext } from '@/server/db-context';

export interface QueueRow {
  id: string;
  orderRef: string;
  status: OrderState;
  amountPiastres: number;
  currency: string;
  paymentRef: string | null;
  instapayHandle: string | null;
  createdAt: Date;
  buyer: { id: string; email: string; displayName: string | null };
  experience: { id: string; title: string | null; recipientName: string | null };
  template: { id: string; titleEn: string | null; titleAr: string | null };
  screenshot:
    | { id: string; bucket: string; storagePath: string; mimeType: string | null }
    | null;
  /** True when another order's payment screenshot points at the same stored file. */
  duplicateScreenshot: boolean;
}

const screenshot = {
  id: media.id,
  bucket: media.bucket,
  storagePath: media.storagePath,
  mimeType: media.mimeType,
};

function baseSelect() {
  return {
    id: orders.id,
    orderRef: orders.orderRef,
    status: orders.status,
    amountPiastres: orders.amountPiastres,
    currency: orders.currency,
    paymentRef: orders.paymentRef,
    instapayHandle: orders.instapayHandle,
    rejectReason: orders.rejectReason,
    reviewedAt: orders.reviewedAt,
    createdAt: orders.createdAt,
    buyerId: users.id,
    buyerEmail: users.email,
    buyerName: users.displayName,
    buyerBlocked: users.isBlocked,
    expId: experiences.id,
    expTitle: experiences.title,
    expRecipient: experiences.recipientName,
    expUnlocked: experiences.isUnlocked,
    tplId: templates.id,
    tplTitleEn: templates.titleEn,
    tplTitleAr: templates.titleAr,
    ssId: screenshot.id,
    ssBucket: screenshot.bucket,
    ssPath: screenshot.storagePath,
    ssMime: screenshot.mimeType,
  };
}

/**
 * Find storage paths that are referenced by more than one payment screenshot —
 * a strong signal of a reused/forged proof. (The media table has no content
 * hash column; storage_path is the available fingerprint of the stored object.)
 */
async function duplicateScreenshotPaths(db: DbClient): Promise<Set<string>> {
  const dupes = await db
    .select({ path: media.storagePath })
    .from(media)
    .where(eq(media.kind, 'payment_screenshot'))
    .groupBy(media.storagePath)
    .having(sql`count(*) > 1`);
  return new Set(dupes.map((d) => d.path));
}

type SelectedRow = Record<string, any>;

function toQueueRow(r: SelectedRow, dupePaths: Set<string>): QueueRow {
  return {
    id: r.id,
    orderRef: r.orderRef,
    status: r.status as OrderState,
    amountPiastres: r.amountPiastres,
    currency: r.currency,
    paymentRef: r.paymentRef ?? null,
    instapayHandle: r.instapayHandle ?? null,
    createdAt: r.createdAt,
    buyer: { id: r.buyerId, email: r.buyerEmail, displayName: r.buyerName ?? null },
    experience: { id: r.expId, title: r.expTitle ?? null, recipientName: r.expRecipient ?? null },
    template: { id: r.tplId, titleEn: r.tplTitleEn ?? null, titleAr: r.tplTitleAr ?? null },
    screenshot: r.ssId
      ? { id: r.ssId, bucket: r.ssBucket, storagePath: r.ssPath, mimeType: r.ssMime ?? null }
      : null,
    duplicateScreenshot: r.ssPath ? dupePaths.has(r.ssPath) : false,
  };
}

/** Review queue: orders in a given status, OLDEST first (FIFO review). */
export async function listOrderQueue(
  ctx: AdminContext,
  params: { status: OrderState; limit: number; offset: number },
): Promise<{ orders: QueueRow[] }> {
  const { db } = ctx;
  const rows = await db
    .select(baseSelect())
    .from(orders)
    .innerJoin(users, eq(orders.userId, users.id))
    .innerJoin(experiences, eq(orders.experienceId, experiences.id))
    .innerJoin(templates, eq(orders.templateId, templates.id))
    .leftJoin(media, eq(orders.screenshotMediaId, media.id))
    .where(eq(orders.status, params.status))
    .orderBy(asc(orders.createdAt))
    .limit(params.limit)
    .offset(params.offset);

  const dupePaths = await duplicateScreenshotPaths(db);
  return { orders: rows.map((r) => toQueueRow(r as SelectedRow, dupePaths)) };
}

/** Single order detail (any status) with joined entities + duplicate flag. */
export async function getOrderDetail(ctx: AdminContext, orderId: string): Promise<QueueRow & {
  rejectReason: string | null;
  reviewedAt: Date | null;
  buyerBlocked: boolean;
  experienceUnlocked: boolean;
}> {
  const { db } = ctx;
  const rows = await db
    .select(baseSelect())
    .from(orders)
    .innerJoin(users, eq(orders.userId, users.id))
    .innerJoin(experiences, eq(orders.experienceId, experiences.id))
    .innerJoin(templates, eq(orders.templateId, templates.id))
    .leftJoin(media, eq(orders.screenshotMediaId, media.id))
    .where(eq(orders.id, orderId))
    .limit(1);

  const r = rows[0] as SelectedRow | undefined;
  if (!r) throw notFound('order not found');

  const dupePaths = await duplicateScreenshotPaths(db);
  return {
    ...toQueueRow(r, dupePaths),
    rejectReason: r.rejectReason ?? null,
    reviewedAt: r.reviewedAt ?? null,
    buyerBlocked: Boolean(r.buyerBlocked),
    experienceUnlocked: Boolean(r.expUnlocked),
  };
}

/** Load the minimal OrderLike the state machine needs (throws 404 if missing). */
async function loadOrderLike(db: DbClient, orderId: string): Promise<OrderLike> {
  const rows = await db
    .select({
      id: orders.id,
      status: orders.status,
      userId: orders.userId,
      experienceId: orders.experienceId,
      amountPiastres: orders.amountPiastres,
    })
    .from(orders)
    .where(eq(orders.id, orderId))
    .limit(1);
  const o = rows[0];
  if (!o) throw notFound('order not found');
  return { ...o, status: o.status as OrderState };
}

/** Approve an order → unlocks the experience + activates its share link. */
export async function approveOrder(
  ctx: AdminContext,
  orderId: string,
  meta: { ip?: string; userAgent?: string },
) {
  const { db, admin } = ctx;
  const order = await loadOrderLike(db, orderId);
  const adminUserId = await resolveAdminUserId(db, admin.id);
  const effects = makeAdminOrderEffects(db);

  const result = await transitionOrder(
    order,
    'approve',
    { type: 'admin', id: adminUserId, ip: meta.ip, userAgent: meta.userAgent },
    effects,
    { reviewedBy: adminUserId },
  );
  return result;
}

/** Reject an order with a reason → records reason, no unlock. */
export async function rejectOrder(
  ctx: AdminContext,
  orderId: string,
  rejectReason: string,
  meta: { ip?: string; userAgent?: string },
) {
  const { db, admin } = ctx;
  const order = await loadOrderLike(db, orderId);
  const adminUserId = await resolveAdminUserId(db, admin.id);
  const effects = makeAdminOrderEffects(db);

  const result = await transitionOrder(
    order,
    'reject',
    { type: 'admin', id: adminUserId, ip: meta.ip, userAgent: meta.userAgent },
    effects,
    { rejectReason, reviewedBy: adminUserId },
  );
  return result;
}
