/** POST /api/admin/orders/:id/approve — unlocks experience + share link. */
import type { NextRequest } from 'next/server';
import { adminRoute } from '@/server/admin/context';
import { approveOrder } from '@/server/admin/orders-service';
import { handle, json } from '@/server/admin/http';
import { requestMeta } from '@/server/admin/audit';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const { ctx } = await adminRoute(req);
    const { id } = await params;
    const result = await approveOrder(ctx, id, requestMeta(req));
    return json({ order: result.order, from: result.from, to: result.to });
  });
}
