import { userContext } from '@/server/db-context';
import { withErrors, json, created, readJson } from '@/server/dashboard/http';
import { createExperienceSchema } from '@/server/dashboard/schemas';
import * as experiencesService from '@/server/dashboard/experiences-service';

export const runtime = 'nodejs';

// GET /api/dashboard/experiences → list my experiences
export async function GET() {
  return withErrors(async () => {
    const ctx = await userContext();
    const items = await experiencesService.listExperiences(ctx);
    return json({ experiences: items });
  });
}

// POST /api/dashboard/experiences → create from a template
export async function POST(req: Request) {
  return withErrors(async () => {
    const ctx = await userContext();
    const input = await readJson(req, createExperienceSchema);
    const experience = await experiencesService.createExperience(ctx, input);
    return created({ experience });
  });
}
