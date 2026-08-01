/** PATCH /api/admin/share-links/:id { visibility?, isActive? } — moderate links. */
import type { NextRequest } from 'next/server';
import { adminRoute } from '@/server/admin/context';
import { updateShareLink } from '@/server/admin/share-links-service';
import { UpdateShareLinkSchema } from '@/server/admin/schemas';
import { handle, json, readJson } from '@/server/admin/http';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const { ctx, actor } = await adminRoute(req);
    const { id } = await params;
    const input = UpdateShareLinkSchema.parse(await readJson(req));
    return json({ shareLink: await updateShareLink(ctx, id, input, actor) });
  });
}
