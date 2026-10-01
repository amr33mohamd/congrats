/**
 * Export every card in this database as a `congrats-cards/v1` bundle, for
 * Admin → Import cards on another install. Card content only — no accounts,
 * password hashes or orders.
 *
 *   npx tsx db/export-cards.ts <out.json>
 */
import { writeFileSync } from 'node:fs';
import { asc, eq } from 'drizzle-orm';
import { getDb } from './index';
import { experiences, steps, shareLinks, templates } from './schema';

async function main() {
  const out = process.argv[2];
  if (!out) throw new Error('usage: tsx db/export-cards.ts <out.json>');
  const db = await getDb();
  const rows = await db
    .select({ e: experiences, slug: templates.slug })
    .from(experiences)
    .innerJoin(templates, eq(templates.id, experiences.templateId))
    .orderBy(asc(experiences.createdAt));
  const cards = [];
  for (const { e, slug } of rows) {
    const st = await db.select().from(steps).where(eq(steps.experienceId, e.id)).orderBy(asc(steps.orderIndex));
    const link = (await db.select().from(shareLinks).where(eq(shareLinks.experienceId, e.id)).limit(1))[0];
    cards.push({
      id: e.id,
      templateSlug: slug,
      title: e.title,
      recipientName: e.recipientName,
      locale: e.locale,
      direction: e.direction,
      status: e.status,
      isUnlocked: e.isUnlocked,
      fields: e.fields ?? {},
      steps: st.map((s) => ({
        templateStepId: s.templateStepId,
        orderIndex: s.orderIndex,
        recipientName: s.recipientName,
        textContent: s.textContent as Record<string, string> | null,
        animationConfig: s.animationConfig as Record<string, unknown> | null,
      })),
      shareLink: link ? { slug: link.slug, visibility: link.visibility, isActive: link.isActive } : null,
    });
  }
  writeFileSync(out, JSON.stringify({ format: 'congrats-cards/v1', cards }, null, 1));
  console.log(`exported ${cards.length} cards (${cards.filter((c) => c.shareLink).length} with share links) → ${out}`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
