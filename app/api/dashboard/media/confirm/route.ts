import { userContext } from '@/server/db-context';
import { withErrors, created, readJson } from '@/server/dashboard/http';
import { confirmMediaSchema } from '@/server/dashboard/schemas';
import { confirmMedia } from '@/server/dashboard/media-service';

export const runtime = 'nodejs';

// POST /api/dashboard/media/confirm → persist a media row after upload
export async function POST(req: Request) {
  return withErrors(async () => {
    const ctx = await userContext();
    const input = await readJson(req, confirmMediaSchema);
    const media = await confirmMedia(ctx, input);
    return created({ media });
  });
}
