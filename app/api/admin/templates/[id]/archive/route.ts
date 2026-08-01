/** POST /api/admin/templates/:id/archive — any → archived. */
import type { NextRequest } from 'next/server';
import { adminRoute } from '@/server/admin/context';
import { archiveTemplate } from '@/server/admin/templates-service';
import { handle, json } from '@/server/admin/http';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const { ctx, actor } = await adminRoute(req);
    const { id } = await params;
    return json({ template: await archiveTemplate(ctx, id, actor) });
  });
}
