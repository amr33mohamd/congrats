/**
 * GET    /api/admin/categories/:id
 * PATCH  /api/admin/categories/:id
 * DELETE /api/admin/categories/:id  (templates detached via ON DELETE SET NULL)
 */
import type { NextRequest } from 'next/server';
import { adminRoute } from '@/server/admin/context';
import {
  getCategory,
  updateCategory,
  deleteCategory,
} from '@/server/admin/categories-service';
import { UpdateCategorySchema } from '@/server/admin/schemas';
import { handle, json, readJson } from '@/server/admin/http';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const { ctx } = await adminRoute(req);
    const { id } = await params;
    return json({ category: await getCategory(ctx, id) });
  });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const { ctx, actor } = await adminRoute(req);
    const { id } = await params;
    const input = UpdateCategorySchema.parse(await readJson(req));
    return json({ category: await updateCategory(ctx, id, input, actor) });
  });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const { ctx, actor } = await adminRoute(req);
    const { id } = await params;
    await deleteCategory(ctx, id, actor);
    return json({ ok: true });
  });
}
