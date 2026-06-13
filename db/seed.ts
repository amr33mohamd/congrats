/**
 * Seed: categories + 2 templates (EN 'Anniversary — Our Story', AR 'Eid Blessings')
 * + a demo admin user. Idempotent on slug/email. Run with: npm run db:seed
 *
 * Uses the same db client (PGlite locally). Template definitions validate against
 * lib/template-contract so the Player can render them out of the box.
 */
import { eq } from 'drizzle-orm';
import { getDb } from './index';
import { categories, templates, users, adminUsers } from './schema';
import {
  parseTemplateDefinition,
  type TemplateDefinition,
} from '@/lib/template-contract';

const anniversaryDef: TemplateDefinition = parseTemplateDefinition({
  version: 1,
  locale: 'en',
  direction: 'ltr',
  theme: { palette: ['#FFD6E0', '#7A1E3A', '#FFFFFF'], fontHeading: 'Inter', fontBody: 'Inter' },
  scenes: [
    {
      id: 'cover',
      type: 'Cover',
      layout: 'centered-photo',
      transitionIn: { preset: 'zoom', durationMs: 1100, delayMs: 0 },
      holdMs: 3800,
      slots: [
        { key: 'heading', type: 'text', editable: true, maxLen: 48, defaultEn: 'Happy Anniversary, {recipient}', animation: 'typewriter' },
        { key: 'body', type: 'text', editable: true, maxLen: 140, defaultEn: 'A year of us.' },
        { key: 'image', type: 'image', editable: true, required: false, aspect: '3:4', max: 1 },
      ],
    },
    {
      id: 'reveal',
      type: 'PhotoReveal',
      transitionIn: { preset: 'parallax', durationMs: 900, delayMs: 0 },
      holdMs: 4200,
      slots: [
        { key: 'image', type: 'image', editable: true, required: true, aspect: '4:3', max: 1 },
        { key: 'heading', type: 'text', editable: true, maxLen: 40, defaultEn: 'The day we met' },
      ],
    },
    {
      id: 'gallery',
      type: 'Gallery',
      transitionIn: { preset: 'slideStart', durationMs: 800, delayMs: 0 },
      holdMs: 5000,
      slots: [
        { key: 'heading', type: 'text', editable: true, maxLen: 30, defaultEn: 'Our memories' },
        { key: 'gallery', type: 'image', editable: true, min: 2, max: 6, aspect: '1:1' },
      ],
    },
    {
      id: 'finale',
      type: 'Finale',
      transitionIn: { preset: 'confettiBurst', durationMs: 900, delayMs: 0 },
      holdMs: 6000,
      slots: [
        { key: 'heading', type: 'text', editable: true, maxLen: 48, defaultEn: 'Here\'s to forever, {recipient}' },
        { key: 'body', type: 'text', editable: true, maxLen: 120, defaultEn: 'I love you.' },
      ],
    },
  ],
});

const eidDef: TemplateDefinition = parseTemplateDefinition({
  version: 1,
  locale: 'ar',
  direction: 'rtl',
  theme: { palette: ['#E8F5E9', '#1F8A6B', '#FFFFFF'], fontHeading: 'Cairo', fontBody: 'Tajawal' },
  scenes: [
    {
      id: 'cover',
      type: 'Cover',
      transitionIn: { preset: 'fade', durationMs: 1000, delayMs: 0 },
      holdMs: 3800,
      slots: [
        { key: 'heading', type: 'text', editable: true, maxLen: 48, defaultAr: 'كل سنة وإنت طيب يا {recipient}', animation: 'typewriter' },
        { key: 'body', type: 'text', editable: true, maxLen: 140, defaultAr: 'عيد سعيد' },
      ],
    },
    {
      id: 'blessing',
      type: 'TextReveal',
      transitionIn: { preset: 'slideEnd', durationMs: 900, delayMs: 0 },
      holdMs: 4500,
      slots: [
        { key: 'heading', type: 'text', editable: true, maxLen: 80, defaultAr: 'تقبل الله منا ومنكم صالح الأعمال' },
      ],
    },
    {
      id: 'gift',
      type: 'GiftReveal',
      transitionIn: { preset: 'flip', durationMs: 900, delayMs: 0 },
      holdMs: 4200,
      slots: [
        { key: 'heading', type: 'text', editable: true, maxLen: 40, defaultAr: 'هديتك' },
        { key: 'body', type: 'text', editable: true, maxLen: 120, defaultAr: 'كل عام وأنت بخير' },
      ],
    },
    {
      id: 'finale',
      type: 'Finale',
      transitionIn: { preset: 'confettiBurst', durationMs: 900, delayMs: 0 },
      holdMs: 6000,
      slots: [
        { key: 'heading', type: 'text', editable: true, maxLen: 48, defaultAr: 'عيد مبارك يا {recipient}' },
      ],
    },
  ],
});

const CATEGORIES = [
  { slug: 'anniversary', nameEn: 'Anniversary', nameAr: 'ذكرى سنوية', icon: '💞', sortOrder: 1 },
  { slug: 'valentine', nameEn: 'Valentine', nameAr: 'عيد الحب', icon: '❤️', sortOrder: 2 },
  { slug: 'proposal', nameEn: 'Proposal', nameAr: 'طلب زواج', icon: '💍', sortOrder: 3 },
  { slug: 'birthday', nameEn: 'Birthday', nameAr: 'عيد ميلاد', icon: '🎂', sortOrder: 4 },
  { slug: 'eid', nameEn: 'Eid', nameAr: 'عيد', icon: '🌙', sortOrder: 5 },
];

async function upsertCategory(db: Awaited<ReturnType<typeof getDb>>, c: (typeof CATEGORIES)[number]) {
  const existing = await db.select().from(categories).where(eq(categories.slug, c.slug)).limit(1);
  if (existing[0]) return existing[0];
  const [row] = await db.insert(categories).values(c).returning();
  return row;
}

export async function seed() {
  const db = await getDb();

  // Categories
  const catRows: Record<string, string> = {};
  for (const c of CATEGORIES) {
    const row = await upsertCategory(db, c);
    catRows[c.slug] = row.id;
  }

  // Demo admin user
  const adminEmail = (process.env.SEED_ADMIN_EMAIL ?? 'admin@congrats.dev').toLowerCase();
  let admin = (await db.select().from(users).where(eq(users.email, adminEmail)).limit(1))[0];
  if (!admin) {
    [admin] = await db.insert(users).values({ email: adminEmail, displayName: 'Demo Admin', locale: 'ar' }).returning();
  }
  let adminRow = (await db.select().from(adminUsers).where(eq(adminUsers.userId, admin.id)).limit(1))[0];
  if (!adminRow) {
    [adminRow] = await db.insert(adminUsers).values({ userId: admin.id, role: 'superadmin' }).returning();
  }

  // Templates
  const tpls = [
    {
      slug: 'anniversary-our-story-en',
      categoryId: catRows['anniversary'],
      titleEn: 'Anniversary — Our Story',
      titleAr: 'ذكرانا',
      locale: 'en' as const,
      direction: 'ltr' as const,
      isPaid: false,
      pricePiastres: 0,
      definition: anniversaryDef,
      status: 'published' as const,
      createdBy: adminRow.id,
    },
    {
      slug: 'eid-blessings-ar',
      categoryId: catRows['eid'],
      titleEn: 'Eid Blessings',
      titleAr: 'بركات العيد',
      locale: 'ar' as const,
      direction: 'rtl' as const,
      isPaid: true,
      pricePiastres: 4900, // 49.00 EGP
      currency: 'EGP',
      definition: eidDef,
      status: 'published' as const,
      createdBy: adminRow.id,
    },
  ];

  for (const t of tpls) {
    const existing = await db.select().from(templates).where(eq(templates.slug, t.slug)).limit(1);
    if (!existing[0]) {
      await db.insert(templates).values(t);
    }
  }

  return {
    categories: Object.keys(catRows).length,
    admin: admin.email,
    templates: tpls.map((t) => t.slug),
  };
}

// Allow running directly: `npm run db:seed`.
const isMain = import.meta.url === `file://${process.argv[1]}`;
if (isMain) {
  seed()
    .then((r) => {
      console.log('Seed complete:', r);
      process.exit(0);
    })
    .catch((e) => {
      console.error('Seed failed:', e);
      process.exit(1);
    });
}
