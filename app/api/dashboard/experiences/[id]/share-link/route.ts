import { userContext } from '@/server/db-context';
import { withErrors, json } from '@/server/dashboard/http';
import { ensureShareLink } from '@/server/dashboard/share-service';

export const runtime = 'nodejs';

type Params = { params: Promise<{ id: string }> };

// POST /api/dashboard/experiences/:id/share-link → create/return { slug }
export async function POST(_req: Request, { params }: Params) {
  return withErrors(async () => {
    const { id } = await params;
    const ctx = await userContext();
    const link = await ensureShareLink(ctx, id);
    return json(link);
  });
}
