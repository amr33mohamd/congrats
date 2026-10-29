import { userContext } from '@/server/db-context';
import { withErrors, json } from '@/server/dashboard/http';
import { DashboardError } from '@/server/dashboard/errors';
import { listRsvps } from '@/server/rsvp/rsvp-service';

export const runtime = 'nodejs';

type Params = { params: Promise<{ id: string }> };

// GET /api/dashboard/experiences/:id/rsvps → the guests' replies to my card
export async function GET(_req: Request, { params }: Params) {
  return withErrors(async () => {
    const { id } = await params;
    const ctx = await userContext();
    const summary = await listRsvps(ctx, id);
    if (!summary) throw DashboardError.notFound('experience not found');
    return json(summary);
  });
}
