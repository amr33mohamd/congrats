import { userContext } from '@/server/db-context';
import { withErrors, json } from '@/server/dashboard/http';
import { getOrder } from '@/server/dashboard/orders-service';

export const runtime = 'nodejs';

type Params = { params: Promise<{ id: string }> };

// GET /api/dashboard/orders/:id → status poll (owner-scoped)
export async function GET(_req: Request, { params }: Params) {
  return withErrors(async () => {
    const { id } = await params;
    const ctx = await userContext();
    const order = await getOrder(ctx, id);
    return json({ order });
  });
}
