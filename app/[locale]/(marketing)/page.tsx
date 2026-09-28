import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { getSession } from '@/lib/auth';
import { SiteHeader } from '@/components/marketing/SiteHeader';
import { Hero } from '@/components/marketing/Hero';
import { Invitations } from '@/components/marketing/Invitations';
import { Occasions } from '@/components/marketing/Occasions';
import { HowItWorks } from '@/components/marketing/HowItWorks';
import { Pricing } from '@/components/marketing/Pricing';
import { Faq } from '@/components/marketing/Faq';
import { SiteFooter } from '@/components/marketing/SiteFooter';
import { listGalleryTemplates } from '@/server/public/templates-gallery';
import { buildPreviewExperience } from '@/lib/template-preview';
import type { BoundExperience } from '@/lib/template-contract';
import { marketingMetadata } from '@/lib/site';

// Always rendered per request: the header reflects the visitor's session and
// the templates come from the live catalog, so a build-time prerender would
// freeze both. Stated explicitly rather than relying on getSession() happening
// to read request headers.
export const dynamic = 'force-dynamic';

const SEO = {
  en: {
    title: 'Congrats — Animated greeting cards & wedding invitations, sent as a link',
    description:
      'Make a personalized animated card or a one-page wedding invitation — their name, your photos, your words — and share it with one link. No app needed. Arabic & English.',
  },
  ar: {
    title: 'Congrats | تهاني متحركة ودعوات أفراح بالاسم والصور',
    description:
      'اعمل تهنئة متحركة أو دعوة فرح من صفحة واحدة — باسمهم وصورك وكلماتك — وابعتها لينك واحد. من غير تطبيق، بالعربي والإنجليزي.',
  },
} as const;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const l = locale === 'ar' ? 'ar' : 'en';
  const base = marketingMetadata({ locale: l, path: '', ...SEO[l] });
  // `absolute` skips the layout's "%s · Congrats" template — the brand is
  // already in this title.
  return { ...base, title: { absolute: SEO[l].title } };
}

/**
 * A published invitation in the visitor's language, bound with sample copy,
 * for the invitations spotlight. Decorative: any failure (DB down, nothing
 * published yet) just drops the preview — it must never take the home page down.
 */
async function invitationPreview(locale: 'ar' | 'en', guest: string): Promise<BoundExperience | null> {
  try {
    const rows = await listGalleryTemplates();
    const inv = rows.filter((r) => r.categorySlug === 'invitation');
    const pick = inv.find((r) => r.locale === locale) ?? inv[0];
    if (!pick) return null;
    return buildPreviewExperience(pick.definition, {
      templateId: pick.id,
      category: 'invitation',
      recipientName: guest,
    });
  } catch (err) {
    console.warn('[home] invitation preview unavailable', err);
    return null;
  }
}

export default async function MarketingHome({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const typed = (locale === 'ar' ? 'ar' : 'en') as 'ar' | 'en';
  const t = await getTranslations('marketing.invitations');
  const [session, preview] = await Promise.all([
    getSession(),
    invitationPreview(typed, t('sampleGuest')),
  ]);

  return (
    <div className="min-h-[100dvh] bg-surface-2">
      <SiteHeader isAuthed={Boolean(session)} overDark />
      <main>
        <Hero locale={typed} />
        <Invitations preview={preview} />
        <Occasions />
        <HowItWorks />
        <Pricing />
        <Faq />
      </main>
      <SiteFooter />
    </div>
  );
}
