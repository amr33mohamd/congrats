/**
 * GET  /api/admin/templates       — list templates (filter by status/category)
 * POST /api/admin/templates       — create (definition validated vs contract)
 */
import type { NextRequest } from 'next/server';
import { adminRoute } from '@/server/admin/context';
import { listTemplates, createTemplate } from '@/server/admin/templates-service';
import { CreateTemplateSchema, TemplateListQuerySchema } from '@/server/admin/schemas';
import { handle, json, readJson } from '@/server/admin/http';

export async function GET(req: NextRequest) {
  return handle(async () => {
    const { ctx } = await adminRoute(req);
    const params = TemplateListQuerySchema.parse(Object.fromEntries(req.nextUrl.searchParams));
    return json(await listTemplates(ctx, params));
  });
}

export async function POST(req: NextRequest) {
  return handle(async () => {
    const { ctx, actor } = await adminRoute(req);
    const input = CreateTemplateSchema.parse(await readJson(req));
    const template = await createTemplate(ctx, input, actor);
    return json({ template }, 201);
  });
}
