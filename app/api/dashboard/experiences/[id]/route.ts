import { userContext } from '@/server/db-context';
import { withErrors, json, noContent, readJson } from '@/server/dashboard/http';
import { updateExperienceSchema } from '@/server/dashboard/schemas';
import * as experiencesService from '@/server/dashboard/experiences-service';
import { toEditorExperienceView } from '@/server/dashboard/editor-view';

export const runtime = 'nodejs';

type Params = { params: Promise<{ id: string }> };

// GET /api/dashboard/experiences/:id → flat editor payload (owner-only).
// REVIEWER INTEGRATION: B1's service returns a nested {experience,template,steps,
// shareLink}; D1's wizard consumes a flat EditorExperience with scenes/theme/
// pricing inline + steps as BoundStep[] (signed media URLs). toEditorExperienceView
// bridges the two so neither team's internals had to change.
export async function GET(_req: Request, { params }: Params) {
  return withErrors(async () => {
    const { id } = await params;
    const ctx = await userContext();
    const payload = await experiencesService.getEditorPayload(ctx, id);
    const view = await toEditorExperienceView(ctx, payload);
    return json(view);
  });
}

// PATCH /api/dashboard/experiences/:id → update metadata
export async function PATCH(req: Request, { params }: Params) {
  return withErrors(async () => {
    const { id } = await params;
    const ctx = await userContext();
    const input = await readJson(req, updateExperienceSchema);
    const experience = await experiencesService.updateExperience(ctx, id, input);
    return json({ experience });
  });
}

// DELETE /api/dashboard/experiences/:id → delete draft
export async function DELETE(_req: Request, { params }: Params) {
  return withErrors(async () => {
    const { id } = await params;
    const ctx = await userContext();
    await experiencesService.deleteExperience(ctx, id);
    return noContent();
  });
}
