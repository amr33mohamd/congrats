/**
 * GET  /api/admin/categories  — list (sorted)
 * POST /api/admin/categories  — create
 */
import type { NextRequest } from 'next/server';
import { adminRoute } from '@/server/admin/context';
import { listCategories, createCategory } from '@/server/admin/categories-service';
import { CreateCategorySchema } from '@/server/admin/schemas';
import { handle, json, readJson } from '@/server/admin/http';

export async function GET(req: NextRequest) {
  return handle(async () => {
    const { ctx } = await adminRoute(req);
    return json(await listCategories(ctx));
  });
}

export async function POST(req: NextRequest) {
  return handle(async () => {
    const { ctx, actor } = await adminRoute(req);
    const input = CreateCategorySchema.parse(await readJson(req));
    return json({ category: await createCategory(ctx, input, actor) }, 201);
  });
}
