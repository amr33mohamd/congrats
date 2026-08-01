/**
 * GET    /api/admin/templates/:id   — fetch one
 * PATCH  /api/admin/templates/:id   — update (revalidates definition if present)
 *                                      `status` may be 'published'|'archived' to publish/archive
 * DELETE /api/admin/templates/:id   — hard delete (blocked if in use)
 */
import type { NextRequest } from 'next/server';
import { adminRoute } from '@/server/admin/context';
import {
  getTemplate,
  updateTemplate,
  deleteTemplate,
} from '@/server/admin/templates-service';
import { UpdateTemplateSchema } from '@/server/admin/schemas';
import { handle, json, readJson } from '@/server/admin/http';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const { ctx } = await adminRoute(req);
    const { id } = await params;
    return json({ template: await getTemplate(ctx, id) });
  });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const { ctx, actor } = await adminRoute(req);
    const { id } = await params;
    const input = UpdateTemplateSchema.parse(await readJson(req));
    return json({ template: await updateTemplate(ctx, id, input, actor) });
  });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const { ctx, actor } = await adminRoute(req);
    const { id } = await params;
    await deleteTemplate(ctx, id, actor);
    return json({ ok: true });
  });
}
