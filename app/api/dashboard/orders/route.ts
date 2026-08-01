import { userContext } from '@/server/db-context';
import { withErrors, created, readJson } from '@/server/dashboard/http';
import { createOrderSchema } from '@/server/dashboard/schemas';
import { createOrder } from '@/server/dashboard/orders-service';

export const runtime = 'nodejs';

// POST /api/dashboard/orders → create a pending order for a paid experience
// Returns { orderRef, instapayHandle, amountPiastres, currency, ... }.
export async function POST(req: Request) {
  return withErrors(async () => {
    const ctx = await userContext();
    const { experienceId } = await readJson(req, createOrderSchema);
    const order = await createOrder(ctx, experienceId);
    return created({ order });
  });
}
