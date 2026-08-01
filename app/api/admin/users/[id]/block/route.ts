/** PATCH /api/admin/users/:id/block { isBlocked } — block / unblock a user. */
import type { NextRequest } from 'next/server';
import { adminRoute } from '@/server/admin/context';
import { setUserBlocked } from '@/server/admin/users-service';
import { BlockUserSchema } from '@/server/admin/schemas';
import { handle, json, readJson } from '@/server/admin/http';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const { ctx, actor } = await adminRoute(req);
    const { id } = await params;
    const { isBlocked } = BlockUserSchema.parse(await readJson(req));
    return json({ user: await setUserBlocked(ctx, id, isBlocked, actor) });
  });
}
