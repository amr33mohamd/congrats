/**
 * CONGRATS TEMPLATE CATALOG.
 *
 * The single source of truth for occasion templates. Each entry is a
 * `CatalogTemplate` = a `templates` row (slug, category, titles, pricing,
 * thumbnail hint) + a `definition` that strictly satisfies the FROZEN
 * `TemplateDefinition` contract (lib/template-contract.ts).
 *
 * VALIDATION: at module load every definition is run through the contract's
 * own zod parser (`parseTemplateDefinition`). An invalid template therefore
 * throws at import time (during seed / build), never silently at render time.
 *
 * REVIEWER: import `CATALOG_CATEGORIES` + `TEMPLATE_CATALOG` into db/seed.ts.
 *   - Upsert categories first (idempotent on slug) → map slug -> id.
 *   - For each template: insert with categoryId = map[t.category], and store
 *     `t.definition` directly into templates.definition (already validated).
 *   - thumbnailUrl can be left null; `t.thumbnailHint` is art-direction only.
 */
import {
  parseTemplateDefinition,
  type TemplateDefinition,
} from '@/lib/template-contract';
import type { CatalogTemplate, CategorySlug } from './_helpers';

/**
 * A catalog entry AFTER validation: its `definition` is the canonical OUTPUT
 * `TemplateDefinition` (defaults applied), whereas authoring uses the looser
 * input shape on `CatalogTemplate`.
 */
export type ValidatedTemplate = Omit<CatalogTemplate, 'definition'> & {
  definition: TemplateDefinition;
};

import { CATALOG_CATEGORIES } from './categories';
import { anniversaryEn, anniversaryAr } from './anniversary';
import { valentineEn, valentineAr } from './valentine';
import { proposalEn, proposalAr } from './proposal';
import { eidAr, eidEn } from './eid';
import { birthdayEn, birthdayAr } from './birthday';
import { graduationEn, graduationAr } from './graduation';
import { newbornEn, newbornAr } from './newborn';
import { weddingEn, weddingAr } from './wedding';
import { INVITATION_TEMPLATES } from './invitation';

export type { CatalogTemplate, CatalogCategory, CategorySlug } from './_helpers';
export { CATALOG_CATEGORIES } from './categories';

/** All catalog entries, grouped by category for readability. */
const RAW_CATALOG: CatalogTemplate[] = [
  // Anniversary
  anniversaryEn,
  anniversaryAr,
  // Valentine
  valentineEn,
  valentineAr,
  // Proposal
  proposalEn,
  proposalAr,
  // Eid
  eidAr,
  eidEn,
  // Birthday
  birthdayEn,
  birthdayAr,
  // Graduation
  graduationEn,
  graduationAr,
  // Newborn
  newbornEn,
  newbornAr,
  // Wedding
  weddingEn,
  weddingAr,
  // Wedding invitations (sent BY the couple, not a congratulation)
  ...INVITATION_TEMPLATES,
];

/* ───────────────────── load-time integrity checks ────────────────────── */

const seenSlugs = new Set<string>();
const knownCategories = new Set<CategorySlug>(
  CATALOG_CATEGORIES.map((c) => c.slug),
);

/**
 * Validate + freeze every definition against the contract. Returns the same
 * entry with a re-parsed (canonical, defaults-applied) `definition`.
 */
function validateEntry(t: CatalogTemplate): ValidatedTemplate {
  if (seenSlugs.has(t.slug)) {
    throw new Error(`[catalog] duplicate template slug: "${t.slug}"`);
  }
  seenSlugs.add(t.slug);

  if (!knownCategories.has(t.category)) {
    throw new Error(
      `[catalog] template "${t.slug}" references unknown category "${t.category}"`,
    );
  }

  if (t.locale !== t.definition.locale || t.direction !== t.definition.direction) {
    throw new Error(
      `[catalog] template "${t.slug}" row locale/direction (${t.locale}/${t.direction}) ` +
        `disagrees with its definition (${t.definition.locale}/${t.definition.direction})`,
    );
  }

  if (t.isPaid && t.pricePiastres <= 0) {
    throw new Error(`[catalog] paid template "${t.slug}" must have pricePiastres > 0`);
  }
  if (!t.isPaid && t.pricePiastres !== 0) {
    throw new Error(`[catalog] free template "${t.slug}" must have pricePiastres === 0`);
  }

  // Contract validation — throws on any schema violation.
  const definition: TemplateDefinition = parseTemplateDefinition(t.definition);

  return { ...t, definition };
}

/** The validated catalog. Importing this module asserts every entry. */
export const TEMPLATE_CATALOG: ReadonlyArray<ValidatedTemplate> =
  RAW_CATALOG.map(validateEntry);

/* ─────────────────────────── lookup helpers ──────────────────────────── */

export function templatesByCategory(category: CategorySlug): ValidatedTemplate[] {
  return TEMPLATE_CATALOG.filter((t) => t.category === category);
}

export function templateBySlug(slug: string): ValidatedTemplate | undefined {
  return TEMPLATE_CATALOG.find((t) => t.slug === slug);
}

export function mvpTemplates(): ValidatedTemplate[] {
  return TEMPLATE_CATALOG.filter((t) => t.mvp);
}

/** Counts for handoff / sanity logging. */
export const CATALOG_STATS = {
  total: TEMPLATE_CATALOG.length,
  paid: TEMPLATE_CATALOG.filter((t) => t.isPaid).length,
  free: TEMPLATE_CATALOG.filter((t) => !t.isPaid).length,
  ar: TEMPLATE_CATALOG.filter((t) => t.locale === 'ar').length,
  en: TEMPLATE_CATALOG.filter((t) => t.locale === 'en').length,
  mvp: TEMPLATE_CATALOG.filter((t) => t.mvp).length,
  categories: CATALOG_CATEGORIES.length,
} as const;
