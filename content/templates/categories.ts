/**
 * Catalog categories. Superset of db/seed.ts's original 5 — adds graduation,
 * newborn, wedding so every catalog template has a valid FK target.
 *
 * The reviewer should upsert these (idempotent on slug) BEFORE inserting
 * templates, then map category slug -> category id for templates.categoryId.
 */
import type { CatalogCategory } from './_helpers';

export const CATALOG_CATEGORIES: CatalogCategory[] = [
  { slug: 'anniversary', nameEn: 'Anniversary', nameAr: 'ذكرى سنوية', icon: '💞', sortOrder: 1 },
  { slug: 'valentine', nameEn: 'Valentine', nameAr: 'عيد الحب', icon: '❤️', sortOrder: 2 },
  { slug: 'proposal', nameEn: 'Proposal', nameAr: 'طلب الزواج', icon: '💍', sortOrder: 3 },
  { slug: 'birthday', nameEn: 'Birthday', nameAr: 'عيد ميلاد', icon: '🎂', sortOrder: 4 },
  { slug: 'eid', nameEn: 'Eid', nameAr: 'العيد', icon: '🌙', sortOrder: 5 },
  { slug: 'graduation', nameEn: 'Graduation', nameAr: 'التخرّج', icon: '🎓', sortOrder: 6 },
  { slug: 'newborn', nameEn: 'Newborn', nameAr: 'مولود جديد', icon: '🍼', sortOrder: 7 },
  { slug: 'wedding', nameEn: 'Wedding', nameAr: 'زفاف', icon: '💐', sortOrder: 8 },
  { slug: 'invitation', nameEn: 'Wedding Invitation', nameAr: 'دعوة زفاف', icon: '💌', sortOrder: 9 },
];
