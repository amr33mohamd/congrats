/** GET /api/admin/orders/:id — single order detail. */
import type { NextRequest } from 'next/server';
import { adminRoute } from '@/server/admin/context';
import { getOrderDetail } from '@/server/admin/orders-service';
import { toAdminOrderView } from '@/server/admin/order-view';
import { handle, json } from '@/server/admin/http';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const { ctx } = await adminRoute(req);
    const { id } = await params;
    const detail = await getOrderDetail(ctx, id);
    // REVIEWER INTEGRATION: D2's ReviewDrawer reads the single-order payload as a
    // FLAT OrderRow (res.experience, res.screenshotUrl). Flatten + bind the
    // experience (signed media URLs) so the in-drawer Player preview works.
    const order = await toAdminOrderView(detail, { db: ctx.db, bindExperience: true });
    return json(order);
  });
}
