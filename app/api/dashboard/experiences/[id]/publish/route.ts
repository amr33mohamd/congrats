import { userContext } from '@/server/db-context';
import { withErrors, json } from '@/server/dashboard/http';
import { publishExperience } from '@/server/dashboard/share-service';

export const runtime = 'nodejs';

type Params = { params: Promise<{ id: string }> };

// POST /api/dashboard/experiences/:id/publish
//   free template → publishes directly (200);
//   paid template → creates a pending order (202, payment required).
export async function POST(_req: Request, { params }: Params) {
  return withErrors(async () => {
    const { id } = await params;
    const ctx = await userContext();
    const result = await publishExperience(ctx, id);
    if (result.kind === 'payment_required') {
      return json(result, 202);
    }
    return json(result);
  });
}
