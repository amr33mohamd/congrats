/** PATCH /api/admin/templates/:id/pricing { isPaid, pricePiastres, currency }. */
import type { NextRequest } from 'next/server';
import { adminRoute } from '@/server/admin/context';
import { updatePricing } from '@/server/admin/templates-service';
import { TemplatePricingSchema } from '@/server/admin/schemas';
import { handle, json, readJson } from '@/server/admin/http';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const { ctx, actor } = await adminRoute(req);
    const { id } = await params;
    const input = TemplatePricingSchema.parse(await readJson(req));
    return json({ template: await updatePricing(ctx, id, input, actor) });
  });
}
