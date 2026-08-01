/** GET /api/admin/orders?status=submitted — review queue (oldest-first). */
import type { NextRequest } from 'next/server';
import { adminRoute } from '@/server/admin/context';
import { listOrderQueue } from '@/server/admin/orders-service';
import { toAdminOrderView } from '@/server/admin/order-view';
import { OrderQueueQuerySchema } from '@/server/admin/schemas';
import { handle, json } from '@/server/admin/http';

export async function GET(req: NextRequest) {
  return handle(async () => {
    const { ctx } = await adminRoute(req);
    const params = OrderQueueQuerySchema.parse(
      Object.fromEntries(req.nextUrl.searchParams),
    );
    const result = await listOrderQueue(ctx, params);
    // REVIEWER INTEGRATION: flatten B2's nested QueueRow → the flat OrderRow D2
    // renders, minting a signed screenshotUrl per row. (No experience binding in
    // the list — the drawer fetches the detail for the Player preview.)
    const orders = await Promise.all(result.orders.map((r) => toAdminOrderView(r)));
    return json({ orders });
  });
}
