import { asc, eq } from 'drizzle-orm';
import { getDb } from '@/db';
import { templates, categories } from '@/db/schema';
import {
  safeParseTemplateDefinition,
  type TemplateDefinition,
} from '@/lib/template-contract';

/**
 * Published templates for the PUBLIC gallery.
 *
 * Deliberately not scoped by user: templates are catalog data, not user data,
 * and this only ever reads rows already marked `published`. It reads the DB
 * rather than the content catalog so an admin archiving a template actually
 * removes it from the shop window.
 */
export interface GalleryTemplate {
  id: string;
  slug: string;
  titleEn: string | null;
  titleAr: string | null;
  locale: 'ar' | 'en';
  isPaid: boolean;
  pricePiastres: number;
  categorySlug: string | null;
  categoryNameEn: string | null;
  categoryNameAr: string | null;
  definition: TemplateDefinition;
}

export async function listGalleryTemplates(): Promise<GalleryTemplate[]> {
  const db = await getDb();
  const rows = await db
    .select({
      id: templates.id,
      slug: templates.slug,
      titleEn: templates.titleEn,
      titleAr: templates.titleAr,
      locale: templates.locale,
      isPaid: templates.isPaid,
      pricePiastres: templates.pricePiastres,
      categorySlug: categories.slug,
      categoryNameEn: categories.nameEn,
      categoryNameAr: categories.nameAr,
      categorySort: categories.sortOrder,
      definition: templates.definition,
    })
    .from(templates)
    .leftJoin(categories, eq(templates.categoryId, categories.id))
    .where(eq(templates.status, 'published'))
    .orderBy(asc(categories.sortOrder), asc(templates.slug));

  const out: GalleryTemplate[] = [];
  for (const r of rows) {
    // A row whose definition no longer satisfies the contract is skipped rather
    // than crashing the page — one bad template must not take down the gallery.
    const parsed = safeParseTemplateDefinition(r.definition);
    if (!parsed.success) continue;
    out.push({
      id: r.id,
      slug: r.slug,
      titleEn: r.titleEn,
      titleAr: r.titleAr,
      locale: r.locale === 'ar' ? 'ar' : 'en',
      isPaid: r.isPaid,
      pricePiastres: r.pricePiastres,
      categorySlug: r.categorySlug,
      categoryNameEn: r.categoryNameEn,
      categoryNameAr: r.categoryNameAr,
      definition: parsed.data,
    });
  }
  return out;
}
