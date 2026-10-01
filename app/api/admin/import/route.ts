/** POST /api/admin/import — import a cards bundle into the calling admin's account. */
import { adminRoute } from '@/server/admin/context';
import { ImportBundleSchema, importCards } from '@/server/admin/import-service';
import { badRequest, handle, json, readJson } from '@/server/admin/http';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  return handle(async () => {
    const { ctx, actor } = await adminRoute(req);
    const parsed = ImportBundleSchema.safeParse(await readJson(req));
    if (!parsed.success) throw badRequest(`not a cards export: ${parsed.error.issues[0]?.message ?? 'invalid'}`);
    return json(await importCards(ctx.db, actor, parsed.data));
  });
}
