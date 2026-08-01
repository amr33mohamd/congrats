import { userContext } from '@/server/db-context';
import { withErrors, noContent } from '@/server/dashboard/http';
import { deleteMedia } from '@/server/dashboard/media-service';

export const runtime = 'nodejs';

type Params = { params: Promise<{ id: string }> };

// DELETE /api/dashboard/media/:id
export async function DELETE(_req: Request, { params }: Params) {
  return withErrors(async () => {
    const { id } = await params;
    const ctx = await userContext();
    await deleteMedia(ctx, id);
    return noContent();
  });
}
