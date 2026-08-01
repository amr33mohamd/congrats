/** POST /api/admin/orders/:id/reject { rejectReason } — records reason, no unlock. */
import type { NextRequest } from 'next/server';
import { adminRoute } from '@/server/admin/context';
import { rejectOrder } from '@/server/admin/orders-service';
import { RejectOrderSchema } from '@/server/admin/schemas';
import { handle, json, readJson } from '@/server/admin/http';
import { requestMeta } from '@/server/admin/audit';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const { ctx } = await adminRoute(req);
    const { id } = await params;
    const { rejectReason } = RejectOrderSchema.parse(await readJson(req));
    const result = await rejectOrder(ctx, id, rejectReason, requestMeta(req));
    return json({ order: result.order, from: result.from, to: result.to });
  });
}
