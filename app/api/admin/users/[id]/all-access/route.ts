/**
 * PATCH /api/admin/users/:id/all-access { allAccess } — grant / revoke comped
 * access (publish paid templates without paying). Admin-only; audited.
 */
import type { NextRequest } from 'next/server';
import { adminRoute } from '@/server/admin/context';
import { setUserAllAccess } from '@/server/admin/users-service';
import { AllAccessSchema } from '@/server/admin/schemas';
import { handle, json, readJson } from '@/server/admin/http';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const { ctx, actor } = await adminRoute(req);
    const { id } = await params;
    const { allAccess } = AllAccessSchema.parse(await readJson(req));
    return json({ user: await setUserAllAccess(ctx, id, allAccess, actor) });
  });
}
