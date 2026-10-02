import { userContext } from '@/server/db-context';
import { withErrors, json, readJson } from '@/server/dashboard/http';
import { submitOrderSchema } from '@/server/dashboard/schemas';
import { submitPayment } from '@/server/dashboard/orders-service';
import { requestMeta } from '@/server/dashboard/request-meta';
import { after } from 'next/server';
import { notifyAdmin, cairoTime } from '@/lib/admin-notify';

export const runtime = 'nodejs';

type Params = { params: Promise<{ id: string }> };

// POST /api/dashboard/orders/:id/submit { screenshotMediaId, paymentRef }
// Drives the authoritative `submit` transition (pending → submitted).
export async function POST(req: Request, { params }: Params) {
  return withErrors(async () => {
    const { id } = await params;
    const ctx = await userContext();
    const input = await readJson(req, submitOrderSchema);
    const result = await submitPayment(ctx, id, input, requestMeta(req));
    const { order } = result;
    after(() =>
      notifyAdmin({
        subject: `Payment to approve: ${order.orderRef}`,
        rows: [
          ['Order', order.orderRef],
          ['Amount', `${(order.amountPiastres / 100).toFixed(2)} ${order.currency}`],
          ['Customer', ctx.user.email],
          ['InstaPay ref', input.paymentRef || '—'],
          ['Duplicate screenshot?', result.duplicateScreenshot ? 'YES — check carefully' : 'No'],
          ['Time (Cairo)', cairoTime()],
        ],
        actionPath: '/ar/admin/queue',
        actionLabel: 'Review payment',
      }),
    );
    return json(result);
  });
}
