import 'server-only';
import { eq } from 'drizzle-orm';
import { getDb } from '@/db';
import { shareLinks, experiences, templates, steps } from '@/db/schema';
import { getStorage } from '@/server/storage';
import {
  parseTemplateDefinition,
  applyTokens,
  type BoundExperience,
  type BoundStep,
} from '@/lib/template-contract';

/**
 * Resolve a public slug → BoundExperience, ENFORCING the unlock gate server-side.
 * Returns null when the link is unavailable for ANY reason (no detail leakage).
 *
 * Gate order: link active + visibility != disabled + not expired + experience unlocked.
 * On success: mint short-lived signed media URLs and bump view_count.
 */
export async function loadPublicExperience(slug: string): Promise<BoundExperience | null> {
  const db = await getDb();

  const link = (await db.select().from(shareLinks).where(eq(shareLinks.slug, slug)).limit(1))[0];
  if (!link) return null;
  if (!link.isActive || link.visibility === 'disabled') return null;
  if (link.expiresAt && link.expiresAt.getTime() < Date.now()) return null;

  const exp = (await db.select().from(experiences).where(eq(experiences.id, link.experienceId)).limit(1))[0];
  if (!exp) return null;
  // THE unlock gate: a guessed slug for an unpaid/unapproved experience is useless.
  if (!exp.isUnlocked) return null;

  const tpl = (await db.select().from(templates).where(eq(templates.id, exp.templateId)).limit(1))[0];
  if (!tpl) return null;

  const def = parseTemplateDefinition(tpl.definition);

  const stepRows = (await db
    .select()
    .from(steps)
    .where(eq(steps.experienceId, exp.id))) as Array<typeof steps.$inferSelect>;
  stepRows.sort((a, b) => a.orderIndex - b.orderIndex);

  const storage = getStorage();

  const boundSteps: BoundStep[] = await Promise.all(
    stepRows.map(async (s) => {
      const text = (s.textContent as Record<string, string> | null) ?? {};
      const resolvedText = Object.fromEntries(
        Object.entries(text).map(([k, v]) => [k, applyTokens(String(v), exp.recipientName ?? '')]),
      );
      // NOTE: media binding (signed URLs from `media` rows) is wired by B1 when
      // it persists step media. Placeholder here keeps the gate + render path real.
      return {
        templateStepId: s.templateStepId,
        orderIndex: s.orderIndex,
        text: resolvedText,
        media: [],
        animationConfig: (s.animationConfig as Record<string, unknown> | null) ?? {},
      };
    }),
  );

  // best-effort view bump (non-blocking semantics in real impl)
  await db
    .update(shareLinks)
    .set({ viewCount: link.viewCount + 1, lastViewedAt: new Date() })
    .where(eq(shareLinks.id, link.id));

  void storage; // storage adapter available for media signing once B1 binds media

  return {
    experienceId: exp.id,
    templateId: exp.templateId,
    locale: exp.locale as 'ar' | 'en',
    direction: exp.direction as 'rtl' | 'ltr',
    recipientName: exp.recipientName ?? '',
    theme: def.theme,
    scenes: def.scenes,
    steps: boundSteps.length ? boundSteps : def.scenes.map((sc, i) => ({
      templateStepId: sc.id,
      orderIndex: i,
      text: {},
      media: [],
      animationConfig: {},
    })),
  };
}
