/** GET /api/admin/users — list users (search by q, filter by blocked). */
import type { NextRequest } from 'next/server';
import { adminRoute } from '@/server/admin/context';
import { listUsers } from '@/server/admin/users-service';
import { UserListQuerySchema } from '@/server/admin/schemas';
import { handle, json } from '@/server/admin/http';

export async function GET(req: NextRequest) {
  return handle(async () => {
    const { ctx } = await adminRoute(req);
    const params = UserListQuerySchema.parse(Object.fromEntries(req.nextUrl.searchParams));
    return json(await listUsers(ctx, params));
  });
}
