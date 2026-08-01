/**
 * Catalog authoring helpers.
 *
 * A `CatalogTemplate` is the DESIGN-TIME shape the reviewer wires into
 * `db/seed.ts`. It carries the row metadata (slug, category, title AR/EN,
 * pricing, thumbnail hint) plus a `definition` that strictly satisfies the
 * frozen `TemplateDefinition` contract in `lib/template-contract.ts`.
 *
 * Nothing here invents new contract fields — `definition` is parsed by the
 * contract's own zod schema at module load (see ./index.ts) so an invalid
 * template fails fast at import time, never silently at render time.
 */
import {
  type TemplateDefinitionInput,
  type Direction,
  type Locale,
} from '@/lib/template-contract';

/** Category slugs the catalog references. Must line up with CATALOG_CATEGORIES. */
export type CategorySlug =
  | 'anniversary'
  | 'valentine'
  | 'proposal'
  | 'birthday'
  | 'eid'
  | 'graduation'
  | 'newborn'
  | 'wedding';

/** A category row the reviewer seeds before templates (FK target). */
export interface CatalogCategory {
  slug: CategorySlug;
  nameEn: string;
  nameAr: string;
  icon: string;
  sortOrder: number;
}

/**
 * One catalog entry = a `templates` row + its validated `definition` jsonb.
 * Field names mirror `db/schema.ts` `templates` so the reviewer can spread
 * most of it directly into the insert.
 */
export interface CatalogTemplate {
  /** unique templates.slug */
  slug: string;
  /** which CatalogCategory.slug this belongs to (reviewer maps slug -> id) */
  category: CategorySlug;
  titleEn: string;
  titleAr: string;
  locale: Locale;
  direction: Direction;
  isPaid: boolean;
  /** integer piastres (1 EGP = 100). 0 for free templates. */
  pricePiastres: number;
  currency: 'EGP';
  /**
   * Thumbnail hint — a short art-direction note for whoever generates the
   * preview image. NOT a URL; the reviewer may leave thumbnailUrl null.
   */
  thumbnailHint: string;
  /** Optional preview image URL (e.g. Unsplash) shown in the template picker. */
  thumbnailUrl?: string;
  /** MVP-first templates are flagged so the reviewer can prioritise seeding. */
  mvp: boolean;
  /** TemplateDefinition authoring shape (defaults optional; parsed in ./index.ts) */
  definition: TemplateDefinitionInput;
}

/** Shared EGP price points so paid templates stay consistent. */
export const PRICE = {
  free: 0,
  standard: 4900, // 49.00 EGP
  premium: 7900, // 79.00 EGP
} as const;
