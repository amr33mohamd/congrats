/**
 * WEDDING INVITATIONS — one skeleton, several art directions.
 *
 * Distinct from `wedding.ts`, which congratulates a couple AFTER the fact.
 * These are the invitation itself, sent BY the couple to a guest, so the copy
 * addresses the reader ("you are invited") and the scenes follow how an
 * invitation is read: who → the ask → the couple → when → where → moments →
 * RSVP.
 *
 * Every style shares that seven-scene spine and varies only its art direction
 * (palette, display face, ornament, photography). That is deliberate: the
 * structure is what makes an invitation legible, and duplicating it per style
 * would mean seven places to fix every time the wording changes.
 *
 * `{recipient}` is the GUEST here, not the couple.
 */
import type { CatalogTemplate } from './_helpers';
import { PRICE } from './_helpers';
import type { OrnamentKind, TemplateDefinitionInput } from '@/lib/template-contract';

/* ───────────────────────────── art directions ──────────────────────────── */

interface Style {
  key: string;
  /** [ground, ground-deep, paper, accent] */
  palette: [string, string, string, string];
  accent: string;
  /** Body/heading colour that reads on `ground`. */
  text: string;
  ornament: OrnamentKind;
  /** Brocade weave under the type. Only reads on a dark ground. */
  damask?: boolean;
  /**
   * Painted illustration files for this style (see docs/ART_BRIEF.md). Set a
   * path ONLY once the file exists in public/art/ — a path to a missing file
   * renders a broken image where the vector ornament would otherwise be.
   */
  art?: { corner?: string; divider?: string; frame?: string; texture?: string };
  fontEn: string;
  fontAr: string;
  /** Overlay strength over photo scenes — light grounds need far less. */
  scrim: [string, string];
  titleEn: string;
  titleAr: string;
  hint: string;
}

const STYLES: Style[] = [
  {
    key: 'ivory-arch',
    palette: ['#101A2E', '#0A1120', '#F7F2E8', '#D9B778'],
    accent: '#D9B778',
    text: '#F7F2E8',
    ornament: 'arch',
    damask: true,
    fontEn: 'Cormorant Garamond',
    fontAr: 'Amiri',
    scrim: ['rgba(10,17,32,0.30)', 'rgba(10,17,32,0.86)'],
    titleEn: 'Wedding Invitation — Ivory Arch',
    titleAr: 'دعوة زفاف — القوس العاجي',
    hint: 'Midnight navy, champagne-gold arch, Cormorant names over a thin gold rule, sparse stars.',
  },
  {
    key: 'baroque-noir',
    palette: ['#2A0E1B', '#160408', '#F5EFE6', '#C9A227'],
    accent: '#C9A227',
    text: '#F5EFE6',
    ornament: 'baroque',
    damask: true,
    fontEn: 'Playfair Display',
    fontAr: 'Aref Ruqaa',
    scrim: ['rgba(22,4,8,0.38)', 'rgba(22,4,8,0.88)'],
    titleEn: 'Wedding Invitation — Baroque Noir',
    titleAr: 'دعوة زفاف — باروك',
    hint: 'Deep burgundy and antique gold, engraved double rule, Playfair names, dense roses.',
  },
  {
    key: 'sage-garden',
    palette: ['#F7F4EC', '#E4E7DA', '#37402F', '#A98E4F'],
    accent: '#A98E4F',
    text: '#37402F',
    ornament: 'wreath',
    fontEn: 'Cormorant Garamond',
    fontAr: 'Amiri',
    scrim: ['rgba(55,64,47,0.18)', 'rgba(55,64,47,0.62)'],
    titleEn: 'Wedding Invitation — Sage Garden',
    titleAr: 'دعوة زفاف — حديقة',
    hint: 'Ivory paper, sage wreath, olive ink, muted gold rules — a botanical garden invitation.',
  },
  {
    key: 'blue-porcelain',
    palette: ['#F6F4EF', '#E6EAF2', '#1F3358', '#4A6FA5'],
    accent: '#4A6FA5',
    text: '#1F3358',
    ornament: 'florals',
    fontEn: 'Cormorant Garamond',
    fontAr: 'Reem Kufi',
    scrim: ['rgba(31,51,88,0.20)', 'rgba(31,51,88,0.66)'],
    titleEn: 'Wedding Invitation — Blue Porcelain',
    titleAr: 'دعوة زفاف — بورسلين أزرق',
    hint: 'Ivory with porcelain-blue florals in an oval crest, fine blue rules, gold hairline.',
  },
  {
    key: 'qasr-gold',
    palette: ['#F6EEDC', '#EADCBE', '#4A3418', '#B08A3E'],
    accent: '#9C7A34',
    text: '#4A3418',
    ornament: 'arch',
    fontEn: 'Cormorant Garamond',
    fontAr: 'Aref Ruqaa',
    scrim: ['rgba(74,52,24,0.15)', 'rgba(74,52,24,0.55)'],
    titleEn: 'Wedding Invitation — Qasr Gold',
    titleAr: 'دعوة زفاف — القصر الذهبي',
    hint: 'Warm cream paper, a gold palace arch, Aref Ruqaa names, a quiet gold rule.',
  },
];

/* ──────────────────────────────── the copy ─────────────────────────────── */

type Copy = Record<string, string>;

const COPY: Record<'en' | 'ar', Copy> = {
  en: {
    names: 'Omar & Nour',
    sub: 'are getting married',
    dear: 'Dear {recipient},',
    invite:
      'Together with our families, we would be honoured to have you with us as we begin our life together.',
    familiesHeading: 'The Families',
    groomLabel: "The groom's family",
    groomFamily: 'Mr. & Mrs.\nKhaled El-Sayed',
    brideLabel: "The bride's family",
    brideFamily: 'Mr. & Mrs.\nHany Farouk',
    ceremonyLabel: 'The Ceremony',
    ceremonyVenue: 'Al-Azhar Park — Lakeside Terrace',
    ceremonyWhen: 'Friday · 5:00 PM',
    receptionLabel: 'The Reception',
    receptionVenue: 'The Grand Nile Ballroom',
    receptionWhen: 'Friday · 8:00 PM',
    countdown: 'Counting down',
    countdownBody: 'Friday, 18 June 2027',
    caption: 'Where it all began',
    moments: 'A few of our favourites',
    venueHeading: 'Getting there',
    address: 'Corniche El Nil, Garden City\nCairo, Egypt',
    rsvpHeading: 'Will you join us?',
    rsvpBody: 'Kindly let us know by 1 May 2027.',
    giftHeading: 'A gift, if you wish',
    giftBody:
      "Your presence is the greatest gift. If you'd like to give something more, you can send it here.",
    finale: 'With love, Omar & Nour',
    finaleBody: "We can't wait to celebrate with you, {recipient}.",
  },
  ar: {
    names: 'عمر & نور',
    sub: 'يتشرّفان بدعوتكم',
    dear: 'عزيزنا {recipient}،',
    invite: 'بكل الحب والفرح، يسعدنا ويشرّفنا حضوركم حفل زفافنا ومشاركتنا بداية حياتنا الجديدة.',
    familiesHeading: 'أهل العروسين',
    groomLabel: 'أهل العريس',
    groomFamily: 'السيد/ خالد السيد\nوحرمه',
    brideLabel: 'أهل العروس',
    brideFamily: 'السيد/ هاني فاروق\nوحرمه',
    ceremonyLabel: 'عقد القران',
    ceremonyVenue: 'حديقة الأزهر — تراس البحيرة',
    ceremonyWhen: 'الجمعة · ٥:٠٠ مساءً',
    receptionLabel: 'حفل الزفاف',
    receptionVenue: 'قاعة النيل الكبرى',
    receptionWhen: 'الجمعة · ٨:٠٠ مساءً',
    countdown: 'باقي على الفرح',
    countdownBody: 'الجمعة ١٨ يونيو ٢٠٢٧',
    caption: 'من هنا بدأت الحكاية',
    moments: 'لحظات من حكايتنا',
    venueHeading: 'الطريق إلينا',
    address: 'كورنيش النيل، جاردن سيتي\nالقاهرة',
    rsvpHeading: 'هتشرّفنا؟',
    rsvpBody: 'نرجو تأكيد الحضور قبل ١ مايو ٢٠٢٧.',
    giftHeading: 'هدية منك',
    giftBody: 'وجودك معنا هو أجمل هدية، ولو حابب تهادينا ممكن تحوّل هنا.',
    finale: 'بكل حب، عمر & نور',
    finaleBody: 'مستنيينك يا {recipient}',
  },
};

/* ──────────────────────────────── the factory ──────────────────────────── */

/**
 * One slot. `label` is what the builder shows next to the field — without it
 * every field on a five-field section reads just "Text".
 */
function slot(
  key: string,
  locale: 'ar' | 'en',
  value: string,
  label: [string, string],
  opts: { required?: boolean; maxLen?: number; type?: 'text' | 'date' } = {},
) {
  return {
    key,
    type: opts.type ?? ('text' as const),
    editable: true,
    required: opts.required ?? false,
    ...(opts.type === 'date' ? {} : { maxLen: opts.maxLen ?? 60 }),
    labelEn: label[0],
    labelAr: label[1],
    ...(locale === 'ar' ? { defaultAr: value } : { defaultEn: value }),
  };
}

const rise = (ms = 900) => ({ preset: 'rise' as const, durationMs: ms, delayMs: 0 });

function buildDefinition(s: Style, locale: 'ar' | 'en'): TemplateDefinitionInput {
  const c = COPY[locale];
  const dir = locale === 'ar' ? 'rtl' : 'ltr';
  const [ground, groundDeep, paper, accentSlot] = s.palette;
  const f = (key: keyof typeof c, label: [string, string], opts?: Parameters<typeof slot>[4]) =>
    slot(key === 'names' ? 'heading' : key, locale, c[key], label, opts);
  const info = { headingColor: s.accent, bodyColor: s.text };

  return {
    version: 1,
    locale,
    direction: dir,
    theme: {
      palette: [ground, groundDeep, paper, accentSlot],
      fontHeading: locale === 'ar' ? s.fontAr : s.fontEn,
      fontBody: locale === 'ar' ? 'Tajawal' : 'Montserrat',
      accent: s.accent,
      ornament: { kind: s.ornament, opacity: 0.55, scale: 1 },
      music: 'wedding-strings',
      textColor: s.text,
      background: {
        type: 'gradient',
        colors: [ground, groundDeep],
        angle: 170,
        ...(s.damask ? { pattern: 'damask' as const } : {}),
      },
      decoration: { effect: 'sparkles', intensity: 'low', color: s.accent },
      ...(s.art ? { art: s.art } : {}),
    },
    // One continuous card, read top to bottom: who → the ask → families →
    // when & where → the countdown → the couple → moments → directions →
    // RSVP → gift → sign-off. Ornaments sit at the two ends; the sections in
    // between carry their own flourished headings, which is enough frame.
    scenes: [
      {
        id: 'cover',
        type: 'Cover',
        transitionIn: { preset: 'blurIn', durationMs: 1200, delayMs: 0 },
        holdMs: 5000,
        ornament: { kind: s.ornament, opacity: 0.8, scale: 1 },
        // `xl`, not `2xl`: the names have to sit INSIDE the arch/frame ornament.
        style: { headingSize: 'xl', headingColor: s.accent, bodyColor: s.text },
        slots: [
          { ...f('names', ['Couple names', 'اسم العروسين'], { required: true, maxLen: 44 }), animation: 'blurIn' as const },
          f('sub', ['Line under the names', 'سطر تحت الأسماء'], { maxLen: 48 }),
        ],
      },
      {
        id: 'invite',
        type: 'Letter',
        transitionIn: rise(1100),
        holdMs: 6000,
        ornament: { kind: 'none' },
        style: { headingSize: 'md', textAlign: 'center' },
        slots: [
          f('dear', ['Greeting', 'التحية'], { required: true }),
          f('invite', ['Invitation wording', 'نص الدعوة'], { maxLen: 200 }),
        ],
      },
      {
        id: 'families',
        type: 'Families',
        transitionIn: rise(),
        holdMs: 5000,
        ornament: { kind: 'none' },
        style: info,
        slots: [
          f('familiesHeading', ['Section title', 'عنوان القسم']),
          f('groomLabel', ["Groom's side label", 'عنوان أهل العريس']),
          f('groomFamily', ["Groom's family names", 'أسماء أهل العريس'], { maxLen: 120 }),
          f('brideLabel', ["Bride's side label", 'عنوان أهل العروس']),
          f('brideFamily', ["Bride's family names", 'أسماء أهل العروس'], { maxLen: 120 }),
        ],
      },
      {
        id: 'ceremony',
        type: 'Event',
        transitionIn: rise(),
        holdMs: 5000,
        ornament: { kind: 'none' },
        style: info,
        slots: [
          { ...f('ceremonyLabel', ['Event name', 'اسم الحفل']), key: 'label' },
          { ...f('ceremonyVenue', ['Place', 'المكان']), key: 'venue' },
          { ...f('ceremonyWhen', ['Day & time', 'اليوم والوقت']), key: 'when' },
          slot('date', locale, '2027-06-18T17:00', ['Date', 'التاريخ'], { type: 'date' }),
        ],
      },
      {
        id: 'reception',
        type: 'Event',
        transitionIn: rise(),
        holdMs: 5000,
        ornament: { kind: 'none' },
        style: info,
        slots: [
          { ...f('receptionLabel', ['Event name', 'اسم الحفل']), key: 'label' },
          { ...f('receptionVenue', ['Place', 'المكان']), key: 'venue' },
          { ...f('receptionWhen', ['Day & time', 'اليوم والوقت']), key: 'when' },
          slot('date', locale, '2027-06-18T20:00', ['Date', 'التاريخ'], { type: 'date' }),
        ],
      },
      {
        id: 'countdown',
        type: 'Countdown',
        transitionIn: { preset: 'glow', durationMs: 1000, delayMs: 0 },
        holdMs: 5000,
        ornament: { kind: 'none' },
        style: { headingColor: s.accent, headingSize: 'lg', bodyColor: s.text },
        slots: [
          { ...f('countdown', ['Title', 'العنوان']), key: 'heading' },
          slot('date', locale, '2027-06-18T20:00', ['Counts down to', 'العدّ حتى'], { type: 'date' }),
          { ...f('countdownBody', ['Date as text', 'التاريخ كنص']), key: 'body' },
        ],
      },
      {
        id: 'couple',
        type: 'PhotoReveal',
        transitionIn: rise(1100),
        holdMs: 5000,
        ornament: { kind: 'none' },
        style: { imageStyle: 'arch', headingColor: s.accent, headingSize: 'lg' },
        slots: [
          { key: 'image', type: 'image', editable: true, required: false, aspect: '3:4', min: 0, max: 1, labelEn: 'Couple photo', labelAr: 'صورة العروسين' },
          { ...f('caption', ['Caption', 'تعليق'], { maxLen: 44 }), animation: 'rise' as const },
        ],
      },
      {
        id: 'moments',
        type: 'Gallery',
        transitionIn: rise(),
        holdMs: 5000,
        ornament: { kind: 'none' },
        style: { imageStyle: 'ornate', headingSize: 'md', headingColor: s.accent },
        slots: [
          { ...f('moments', ['Title', 'العنوان'], { maxLen: 36 }), key: 'heading' },
          { key: 'gallery', type: 'image', editable: true, required: false, min: 0, max: 8, aspect: '3:4', labelEn: 'Gallery photos', labelAr: 'صور المعرض' },
        ],
      },
      {
        id: 'venue',
        type: 'Venue',
        transitionIn: rise(),
        holdMs: 5000,
        ornament: { kind: 'none' },
        style: info,
        slots: [
          { ...f('venueHeading', ['Title', 'العنوان']), key: 'heading' },
          { ...f('address', ['Address', 'العنوان بالتفصيل'], { maxLen: 140 }), key: 'address' },
          slot('mapUrl', locale, '', ['Google Maps link (optional)', 'رابط جوجل ماب (اختياري)'], { maxLen: 200 }),
        ],
      },
      {
        id: 'rsvp',
        type: 'Rsvp',
        transitionIn: rise(),
        holdMs: 5000,
        ornament: { kind: 'none' },
        style: info,
        slots: [
          { ...f('rsvpHeading', ['Title', 'العنوان']), key: 'heading' },
          { ...f('rsvpBody', ['Note', 'ملاحظة'], { maxLen: 120 }), key: 'body' },
          slot('phone', locale, '', ['WhatsApp number, with country code', 'رقم واتساب مع كود الدولة'], { maxLen: 20 }),
        ],
      },
      {
        id: 'gift',
        type: 'Gift',
        transitionIn: rise(),
        holdMs: 5000,
        ornament: { kind: 'none' },
        style: info,
        slots: [
          { ...f('giftHeading', ['Title', 'العنوان']), key: 'heading' },
          { ...f('giftBody', ['Note', 'ملاحظة'], { maxLen: 160 }), key: 'body' },
          slot('account', locale, '', ['Transfer details (InstaPay, wallet…)', 'بيانات التحويل (إنستاباي، محفظة…)'], { maxLen: 60 }),
        ],
      },
      {
        id: 'finale',
        type: 'Finale',
        transitionIn: { preset: 'glow', durationMs: 1200, delayMs: 0 },
        holdMs: 6000,
        ornament: { kind: s.ornament, opacity: 0.7, scale: 1 },
        decoration: { effect: 'sparkles', intensity: 'medium', color: s.accent },
        // The sign-off is longer than the names, so one size smaller keeps it in the arch.
        style: { headingSize: 'lg', headingColor: s.accent, bodyColor: s.text },
        slots: [
          { ...f('finale', ['Sign-off', 'الختام'], { required: true, maxLen: 56 }), key: 'heading', animation: 'glow' as const },
          { ...f('finaleBody', ['Last line', 'السطر الأخير'], { maxLen: 110 }), key: 'body' },
        ],
      },
    ],
  };
}

function makeInvitation(s: Style, locale: 'ar' | 'en'): CatalogTemplate {
  return {
    slug: `invitation-${s.key}-${locale}`,
    category: 'invitation',
    titleEn: s.titleEn,
    titleAr: s.titleAr,
    locale,
    direction: locale === 'ar' ? 'rtl' : 'ltr',
    isPaid: true,
    pricePiastres: PRICE.premium,
    currency: 'EGP',
    thumbnailHint: s.hint,
    thumbnailUrl:
      'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=800&q=70',
    // Lead the category with the two strongest directions.
    mvp: s.key === 'ivory-arch' || s.key === 'sage-garden',
    definition: buildDefinition(s, locale),
  };
}

/** Every invitation style, in both languages. */
export const INVITATION_TEMPLATES: CatalogTemplate[] = STYLES.flatMap((s) => [
  makeInvitation(s, 'en'),
  makeInvitation(s, 'ar'),
]);
