import { userContext } from '@/server/db-context';
import { withErrors, json, readJson } from '@/server/dashboard/http';
import { putStepsSchema } from '@/server/dashboard/schemas';
import * as experiencesService from '@/server/dashboard/experiences-service';

export const runtime = 'nodejs';

type Params = { params: Promise<{ id: string }> };

// PUT /api/dashboard/experiences/:id/steps → bulk upsert bound step content
export async function PUT(req: Request, { params }: Params) {
  return withErrors(async () => {
    const { id } = await params;
    const ctx = await userContext();
    const { steps } = await readJson(req, putStepsSchema);
    const saved = await experiencesService.upsertSteps(ctx, id, steps);
    return json({ steps: saved });
  });
}
