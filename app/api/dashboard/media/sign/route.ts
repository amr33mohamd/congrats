import { userContext } from '@/server/db-context';
import { withErrors, json, readJson } from '@/server/dashboard/http';
import { signMediaSchema } from '@/server/dashboard/schemas';
import { signMedia } from '@/server/dashboard/media-service';

export const runtime = 'nodejs';

// POST /api/dashboard/media/sign → returns an upload target (bucket/key/url)
export async function POST(req: Request) {
  return withErrors(async () => {
    const ctx = await userContext();
    const input = await readJson(req, signMediaSchema);
    const target = await signMedia(ctx, input);
    return json(target);
  });
}
