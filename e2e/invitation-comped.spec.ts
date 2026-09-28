import { test, expect } from '@playwright/test';
import {
  login,
  userEmail,
  COMPED_EMAIL,
  listTemplates,
  createExperience,
  getSteps,
  putSteps,
  publish,
  assertPlayerPlays,
  playerRoot,
  openGateIfPresent,
  GATE_BUTTON,
  sceneSection,
  expectSceneText,
} from './helpers';
import { TEMPLATE_CATALOG } from '@/content/templates';

/**
 * Comped accounts + one-page wedding invitations.
 *
 * The comped account (users.all_access) is created by the seed — see
 * COMPED_EMAIL in helpers.ts for why it cannot be granted from the test.
 */

function invitation(slug: string) {
  const t = TEMPLATE_CATALOG.find((x) => x.slug === slug);
  if (!t) throw new Error(`invitation template ${slug} missing from catalog`);
  return t;
}

test.describe('Comped account (all_access)', () => {
  test('publishes a PAID invitation from the builder UI with no payment step', async ({ page }) => {
    const tpl = invitation('invitation-ivory-arch-en');
    expect(tpl.isPaid, 'fixture must be a paid template').toBeTruthy();
    await login(page, COMPED_EMAIL);

    await page.goto('/en/builder');
    await page.locator('#picker-recipient').fill('CompedGuest');
    const card = page.getByRole('button', { name: tpl.titleEn, exact: true });
    await expect(card).toBeVisible({ timeout: 15_000 });
    await card.click();
    await page.waitForURL(/\/en\/builder\/[0-9a-f-]+/, { timeout: 30_000 });
    const experienceId = page.url().match(/builder\/([0-9a-f-]+)/)![1];

    await page.getByRole('button', { name: 'Next', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Personalize each scene' })).toBeVisible();
    await page.getByRole('button', { name: 'Next', exact: true }).click();

    // The review button is labelled for a paid template, but the SERVER decides:
    // a comped publish returns `published` and the wizard routes to the
    // dashboard instead of /orders/<id>.
    const cta = page.getByRole('button', { name: /Continue to payment|Publish & get link/ });
    await expect(cta).toBeVisible({ timeout: 15_000 });
    await cta.click();
    await page.waitForURL(/\/en\/(dashboard|orders)/, { timeout: 30_000 });
    expect(page.url(), 'comped publish was sent to checkout').toMatch(/\/en\/dashboard/);

    // Unlocked outright — not parked behind an order awaiting approval.
    const exp = await (await page.request.get(`/api/dashboard/experiences/${experienceId}`)).json();
    expect(exp.status).toBe('published');
    expect(exp.isUnlocked).toBe(true);
    expect(exp.orderId, 'comped publish created an order').toBeNull();

    const share = await page.request.post(`/api/dashboard/experiences/${experienceId}/share-link`);
    const { slug } = await share.json();
    await assertPlayerPlays(page, slug);
  });

  test('the same paid template still requires payment for a normal account', async ({ page }) => {
    await login(page, userEmail('not-comped'));
    const tpl = invitation('invitation-ivory-arch-en');
    const row = (await listTemplates(page.request)).find((c) => c.name === tpl.titleEn && c.locale === 'en')!;
    const expId = await createExperience(page.request, { templateId: row.id, locale: 'en', recipientName: 'Payer' });
    const pub = await publish(page.request, expId);
    expect(pub.status).toBe(202);
    expect(pub.body.kind).toBe('payment_required');
  });
});

/* ──────────────────────── invitation sections ──────────────────────── */

const CASES = [
  {
    slug: 'invitation-ivory-arch-ar',
    guest: 'ضيف الاختبار',
    couple: 'عمر & نور',
    families: { heading: 'أهل العروسين', groom: 'خالد السيد', bride: 'هاني فاروق' },
    ceremony: { venue: 'حديقة الأزهر — تراس البحيرة', day: '١٨', month: 'يونيو' },
    reception: { venue: 'قاعة النيل الكبرى' },
    venue: { address: 'جاردن سيتي', link: 'الموقع على الخريطة' },
    rsvp: { link: 'تأكيد الحضور' },
    gift: { copy: 'نسخ' },
  },
  {
    slug: 'invitation-sage-garden-en',
    guest: 'Test Guest',
    couple: 'Omar & Nour',
    families: { heading: 'The Families', groom: 'Khaled El-Sayed', bride: 'Hany Farouk' },
    ceremony: { venue: 'Al-Azhar Park — Lakeside Terrace', day: '18', month: 'June' },
    reception: { venue: 'The Grand Nile Ballroom' },
    venue: { address: 'Garden City', link: 'Get directions' },
    rsvp: { link: 'Confirm attendance' },
    gift: { copy: 'Copy' },
  },
] as const;

const PHONE = '201001234567';
const ACCOUNT = 'e2e@instapay';

test.describe('Invitation card sections', () => {
  for (const c of CASES) {
    test(`${c.slug}: families, events, venue, RSVP and gift render`, async ({ page }) => {
      const tpl = invitation(c.slug);
      await login(page, COMPED_EMAIL);
      const row = (await listTemplates(page.request)).find(
        (r) => r.name === (tpl.locale === 'ar' ? tpl.titleAr : tpl.titleEn) && r.locale === tpl.locale,
      );
      expect(row, `seeded ${c.slug} not found`).toBeTruthy();

      const expId = await createExperience(page.request, {
        templateId: row!.id,
        locale: tpl.locale,
        recipientName: c.guest,
      });
      // Fill the optional contact fields so the action links render.
      const steps = await getSteps(page.request, expId);
      await putSteps(
        page.request,
        expId,
        steps.map((s) => {
          if (s.templateStepId === 'rsvp') return { ...s, text: { ...s.text, phone: PHONE } };
          if (s.templateStepId === 'gift') return { ...s, text: { ...s.text, account: ACCOUNT } };
          return s;
        }),
      );
      const pub = await publish(page.request, expId);
      expect(pub.status, `comped publish: ${JSON.stringify(pub.body)}`).toBe(200);
      const slug = pub.body.slug as string;

      await page.goto(`/${tpl.locale}/p/${slug}`);
      const player = playerRoot(page);
      await expect(player).toHaveAttribute('dir', tpl.direction);

      // The gate carries the couple and the invited guest.
      const gateBtn = player.getByRole('button', { name: GATE_BUTTON });
      await expect(gateBtn).toBeVisible();
      await expect(gateBtn).toHaveText(tpl.locale === 'ar' ? 'افتح الدعوة' : 'Open');
      await expect(player.getByText(c.couple).first()).toBeVisible();
      await expect(player.getByText(c.guest).first()).toBeVisible();
      await openGateIfPresent(page);

      // Families
      await expectSceneText(page, 'families', c.families.groom);
      await expectSceneText(page, 'families', c.families.bride);

      // Event (ceremony + reception) — venue plus the date set as a numeral.
      await expectSceneText(page, 'ceremony', c.ceremony.venue);
      await expectSceneText(page, 'ceremony', c.ceremony.month);
      await expect(sceneSection(page, 'ceremony').getByText(c.ceremony.day, { exact: true })).toBeVisible();
      await expectSceneText(page, 'reception', c.reception.venue);

      // Venue — address + a maps link.
      await expectSceneText(page, 'venue', c.venue.address);
      const maps = sceneSection(page, 'venue').getByRole('link', { name: c.venue.link });
      await expect(maps).toHaveAttribute('href', /^https:\/\/www\.google\.com\/maps\/search\//);
      await expect(maps).toHaveAttribute('target', '_blank');

      // RSVP — WhatsApp deep link to the couple's number, message prefilled with the guest.
      await sceneSection(page, 'rsvp').scrollIntoViewIfNeeded();
      const rsvp = sceneSection(page, 'rsvp').getByRole('link', { name: c.rsvp.link });
      await expect(rsvp).toBeVisible();
      const href = await rsvp.getAttribute('href');
      expect(href).toMatch(new RegExp(`^https://wa\\.me/${PHONE}\\?text=`));
      expect(decodeURIComponent(href!.split('text=')[1])).toContain(c.guest);

      // Gift — transfer details + a copy button.
      await expectSceneText(page, 'gift', ACCOUNT);
      await expect(sceneSection(page, 'gift').getByRole('button', { name: c.gift.copy })).toBeVisible();

      // Photo sections were not given photos, so they are left out of the card.
      await expect(sceneSection(page, 'couple')).toHaveCount(0);
      await expect(sceneSection(page, 'moments')).toHaveCount(0);

      // Checked last so every other section is proven first. The template stores
      // this title under slot key `familiesHeading`, while FamiliesScene reads
      // `heading` — so the sender's section title never shows.
      await expectSceneText(
        page,
        'families',
        c.families.heading,
        'Families section heading not rendered (slot "familiesHeading" vs renderer key "heading")',
      );
    });
  }
});
