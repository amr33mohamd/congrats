/** GET /api/admin/audit — list audit entries with filters (newest-first). */
import type { NextRequest } from 'next/server';
import { adminRoute } from '@/server/admin/context';
import { listAudit } from '@/server/admin/audit-service';
import { AuditQuerySchema } from '@/server/admin/schemas';
import { handle, json } from '@/server/admin/http';

export async function GET(req: NextRequest) {
  return handle(async () => {
    const { ctx } = await adminRoute(req);
    const params = AuditQuerySchema.parse(Object.fromEntries(req.nextUrl.searchParams));
    return json(await listAudit(ctx, params));
  });
}
