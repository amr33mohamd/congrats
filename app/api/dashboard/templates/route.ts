/**
 * GET /api/dashboard/templates → published template catalog for the builder
 * picker (D1 consumes). Not in the original FROZEN list but required by the
 * create flow; D1 flagged the gap and degrades to an empty state on 404 — this
 * route fulfils it. Authenticated (any signed-in user) and read-only.
 *
 * REVIEWER INTEGRATION: returns TemplateCard[] under { templates } matching
 * components/dashboard/types.ts (palette pulled from definition.theme).
 */
import { eq } from 'drizzle-orm';
import { userContext } from '@/server/db-context';
import { withErrors, json } from '@/server/dashboard/http';
import { templates, categories } from '@/db/schema';
import { safeParseTemplateDefinition } from '@/lib/template-contract';

export const runtime = 'nodejs';

export async function GET() {
  return withErrors(async () => {
    const ctx = await userContext();

    const rows = await ctx.db
      .select({
        id: templates.id,
        slug: templates.slug,
        titleEn: templates.titleEn,
        titleAr: templates.titleAr,
        locale: templates.locale,
        direction: templates.direction,
        isPaid: templates.isPaid,
        pricePiastres: templates.pricePiastres,
        currency: templates.currency,
        thumbnailUrl: templates.thumbnailUrl,
        definition: templates.definition,
        status: templates.status,
        categorySlug: categories.slug,
      })
      .from(templates)
      .leftJoin(categories, eq(templates.categoryId, categories.id))
      .where(eq(templates.status, 'published'));

    const cards = rows.map((r) => {
      const locale = (r.locale === 'ar' ? 'ar' : 'en') as 'ar' | 'en';
      const parsed = safeParseTemplateDefinition(r.definition);
      const palette = parsed.success ? parsed.data.theme.palette : undefined;
      // The picker renders the real template rather than a thumbnail, so it
      // needs the definition. Only ship it when it actually parses.
      const definition = parsed.success ? parsed.data : null;
      return {
        id: r.id,
        name: (locale === 'ar' ? r.titleAr : r.titleEn) ?? r.titleEn ?? r.titleAr ?? r.slug,
        description: null,
        categorySlug: r.categorySlug ?? null,
        locale,
        direction: (r.direction === 'rtl' ? 'rtl' : 'ltr') as 'rtl' | 'ltr',
        isPaid: r.isPaid,
        pricePiastres: r.pricePiastres,
        currency: r.currency,
        thumbnailUrl: r.thumbnailUrl,
        palette,
        definition,
      };
    });

    return json({ templates: cards });
  });
}
