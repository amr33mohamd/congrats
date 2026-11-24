/**
 * WHITE BLOOM — a wedding invitation with its own player (theme.stage 'bloom').
 *
 * Every section is a full phone screen on painted artwork: white peonies and
 * ranunculus on white paper, alternating with the same flowers on deep
 * turquoise. Names in Great Vibes, small caps in Marcellus, running text in
 * Cormorant, pearls for every bullet and rule.
 *
 * The read: wreath cover (tap to open) → the verse → the invitation card the
 * guest unties → save the date → a countdown of hanging pearls → the order of
 * the day → the venue → RSVP → thank you.
 *
 * The artwork lives in public/art/bloom/. Each scene names its own panel as an
 * image background; the player picks light or dark type from the scene's
 * bodyColor, so the data says which panels are turquoise.
 *
 * `{recipient}` is the GUEST. The couple's names and the date are asked once
 * (card-level fields) and used on the cover, the card, the countdown, the
 * calendar button and the thank-you.
 */
import type { CatalogTemplate } from './_helpers';
import { PRICE } from './_helpers';
import type { TemplateDefinitionInput } from '@/lib/template-contract';

const ART = {
  wreath: '/art/bloom/wreath.webp',
  tealTop: '/art/bloom/teal-tl.webp',
  tealBottom: '/art/bloom/teal-br.webp',
  whiteTop: '/art/bloom/white-tr.webp',
  whiteBottom: '/art/bloom/white-bl.webp',
} as const;

/** Ink on the white panels and on the turquoise ones. */
const ON_WHITE = { headingColor: '#0B3F48', bodyColor: '#2C5B62' };
const ON_TEAL = { headingColor: '#F6FBFB', bodyColor: '#F6FBFB' };

/**
 * `edge` is the ground the art continues into: the player pins the art to its
 * flowers' corner at the column's width and fills the rest of the section
 * with this colour, so the flowers never grow over the type.
 */
const panel = (imageUrl: string, edge: string) => ({
  type: 'image' as const,
  imageUrl,
  colors: [edge, edge],
});
const WHITE = '#F4F5F2';
const EDGE = {
  tealTop: '#036270',
  tealBottom: '#1D7982',
  whiteTop: '#E0DFDA',
  whiteBottom: '#E9E9EA',
};

type Copy = Record<string, string>;

const COPY: Record<'en' | 'ar', Copy> = {
  en: {
    names: 'Omar & Nour',
    coverKicker: 'The wedding of',
    bismillah: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
    translation: 'In the name of Allah, the Most Gracious, the Most Merciful',
    verse:
      '“And among His signs is that He created for you spouses from among yourselves, that you may find tranquillity in them; and He placed between you affection and mercy.”',
    verseRef: 'Ar-Rum · 30:21',
    inviteKicker: 'Together with their families',
    inviteBody: 'request the honour of your presence at the celebration of their marriage',
    inviteTime: 'at seven o’clock in the evening',
    saveHeading: 'Save the Date',
    saveBody: 'The celebration will take place on',
    countKicker: 'Until we say I do',
    countHeading: 'Counting the Days',
    countNote: 'Every pearl a moment closer',
    progKicker: 'The Program',
    progHeading: 'Order of the Day',
    program: [
      '7:00 PM | Guests Arrival | Welcome drinks & music',
      '7:45 PM | The Zaffa | The couple’s grand entrance',
      '8:30 PM | First Dance | A moment for two',
      '9:30 PM | Dinner | Served in the pearl hall',
      '11:00 PM | Cake & Farewell | Sweet endings',
    ].join('\n'),
    venueHeading: 'The Venue',
    address: 'The Grand Pearl Hall\nCairo, Egypt',
    rsvpHeading: 'Will You Join Us?',
    rsvpBody: 'Kindly let us know if you can make it.',
    finale: 'Thank You',
    finaleBody: 'for being part of our story',
  },
  ar: {
    names: 'عمر & نور',
    coverKicker: 'حفل زفاف',
    bismillah: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
    translation: '',
    verse: '﴿وَمِنْ آيَاتِهِ أَنْ خَلَقَ لَكُم مِّنْ أَنفُسِكُمْ أَزْوَاجًا لِّتَسْكُنُوا إِلَيْهَا وَجَعَلَ بَيْنَكُم مَّوَدَّةً وَرَحْمَةً﴾',
    verseRef: 'سورة الروم · ٢١',
    inviteKicker: 'بحضور العائلتين',
    inviteBody: 'يتشرّفان بدعوتكم لحضور حفل زفافهما ومشاركتهما فرحة العمر',
    inviteTime: 'في تمام الساعة السابعة مساءً',
    saveHeading: 'احفظ الموعد',
    saveBody: 'الفرح هيكون يوم',
    countKicker: 'باقي على ليلة العمر',
    countHeading: 'بنعدّ الأيام',
    countNote: 'كل لؤلؤة بتقرّبنا لحظة',
    progKicker: 'البرنامج',
    progHeading: 'فقرات الليلة',
    program: [
      '٧:٠٠ م | استقبال الضيوف | مشروبات ترحيب وموسيقى',
      '٧:٤٥ م | الزفة | دخول العروسين',
      '٨:٣٠ م | الرقصة الأولى | لحظة ليهم هما الاتنين',
      '٩:٣٠ م | العشاء | في قاعة اللؤلؤ',
      '١١:٠٠ م | التورتة والوداع | ختامها مسك',
    ].join('\n'),
    venueHeading: 'مكان الفرح',
    address: 'قاعة اللؤلؤ الكبرى\nالقاهرة',
    rsvpHeading: 'هتشرّفنا؟',
    rsvpBody: 'نرجو تأكيد الحضور.',
    finale: 'شكراً',
    finaleBody: 'إنكم جزء من حكايتنا',
  },
};

function slot(
  key: string,
  locale: 'ar' | 'en',
  value: string,
  label: [string, string],
  opts: { maxLen?: number; required?: boolean } = {},
) {
  return {
    key,
    type: 'text' as const,
    editable: true,
    required: opts.required ?? false,
    maxLen: opts.maxLen ?? 60,
    labelEn: label[0],
    labelAr: label[1],
    ...(locale === 'ar' ? { defaultAr: value } : { defaultEn: value }),
  };
}

const date = {
  key: 'date',
  type: 'date' as const,
  editable: true,
  required: false,
  bind: 'weddingDate',
};
const rise = { preset: 'rise' as const, durationMs: 900, delayMs: 0 };

function buildDefinition(locale: 'ar' | 'en'): TemplateDefinitionInput {
  const c = COPY[locale];
  const ar = locale === 'ar';
  const s = (key: string, label: [string, string], opts?: Parameters<typeof slot>[4]) =>
    slot(key, locale, c[key], label, opts);
  const names = ar ? 'Aref Ruqaa' : 'Great Vibes';

  return {
    version: 1,
    locale,
    direction: ar ? 'rtl' : 'ltr',
    theme: {
      palette: [WHITE, '#E8F2F2', '#0B3F48', '#B8975A'],
      fontHeading: names,
      fontBody: ar ? 'Amiri' : 'Cormorant Garamond',
      localeFonts: {
        en: { heading: 'Great Vibes', body: 'Cormorant Garamond' },
        ar: { heading: 'Aref Ruqaa', body: 'Amiri' },
      },
      accent: '#B8975A',
      textColor: '#0B3F48',
      ornament: { kind: 'none', opacity: 0, scale: 1 },
      music: 'white-bloom',
      background: { type: 'solid', colors: [WHITE], angle: 160 },
      decoration: { effect: 'none', intensity: 'low' },
      stage: 'bloom',
    },
    fields: [
      {
        key: 'couple',
        type: 'text',
        required: true,
        maxLen: 44,
        labelEn: "Couple's names",
        labelAr: 'اسم العروسين',
        ...(ar ? { defaultAr: c.names } : { defaultEn: c.names }),
      },
      // No default: a fixed sample date goes stale (lib/template-preview fills one).
      {
        key: 'weddingDate',
        type: 'date',
        required: true,
        labelEn: 'Wedding date & time',
        labelAr: 'تاريخ ووقت الفرح',
      },
    ],
    scenes: [
      {
        id: 'cover',
        type: 'Cover',
        transitionIn: { preset: 'blurIn', durationMs: 1200, delayMs: 0 },
        holdMs: 5000,
        background: panel(ART.wreath, WHITE),
        ornament: { kind: 'none' },
        style: { ...ON_WHITE, headingSize: 'xl', headingFont: names },
        slots: [
          {
            key: 'heading',
            type: 'text' as const,
            editable: true,
            required: false,
            bind: 'couple',
            animation: 'blurIn' as const,
          },
          s('coverKicker', ['Line above the names', 'السطر فوق الأسماء'], {
            maxLen: 32,
          }),
          date,
        ],
      },
      {
        id: 'verse',
        type: 'Quote',
        transitionIn: rise,
        holdMs: 6000,
        background: panel(ART.tealTop, EDGE.tealTop),
        ornament: { kind: 'none' },
        style: { ...ON_TEAL, textPosition: 'bottom', headingSize: 'md' },
        slots: [
          // The verse comes first: the gallery thumbnail and the plain card read it as the quote.
          s('verse', ['Verse', 'الآية'], { maxLen: 260 }),
          s('verseRef', ['Reference', 'السورة'], { maxLen: 40 }),
          s('bismillah', ['Opening line', 'البسملة'], { maxLen: 60 }),
          ...(ar ? [] : [s('translation', ['Translation', 'الترجمة'], { maxLen: 90 })]),
        ],
      },
      {
        id: 'invite',
        type: 'Letter',
        transitionIn: rise,
        holdMs: 6000,
        background: panel(ART.whiteTop, EDGE.whiteTop),
        ornament: { kind: 'none' },
        style: { ...ON_WHITE, textPosition: 'bottom', headingSize: 'md' },
        slots: [
          s('inviteKicker', ['Line above the names', 'السطر فوق الأسماء'], {
            maxLen: 48,
          }),
          s('inviteBody', ['Invitation wording', 'نص الدعوة'], { maxLen: 160 }),
          s('inviteTime', ['Time, in words', 'الوقت'], { maxLen: 60 }),
          {
            key: 'names',
            type: 'text' as const,
            editable: true,
            required: false,
            bind: 'couple',
          },
          date,
        ],
      },
      {
        id: 'savedate',
        type: 'TextReveal',
        transitionIn: rise,
        holdMs: 5000,
        background: panel(ART.tealBottom, EDGE.tealBottom),
        ornament: { kind: 'none' },
        style: {
          ...ON_TEAL,
          textPosition: 'top',
          headingSize: 'lg',
          headingFont: names,
        },
        slots: [
          s('saveHeading', ['Title', 'العنوان'], { maxLen: 32 }),
          s('saveBody', ['Line under the title', 'سطر تحت العنوان'], {
            maxLen: 60,
          }),
          date,
        ],
      },
      {
        id: 'countdown',
        type: 'Countdown',
        transitionIn: { preset: 'glow', durationMs: 1000, delayMs: 0 },
        holdMs: 5000,
        background: panel(ART.whiteBottom, EDGE.whiteBottom),
        ornament: { kind: 'none' },
        style: {
          ...ON_WHITE,
          textPosition: 'top',
          headingSize: 'lg',
          headingFont: names,
        },
        slots: [
          s('countHeading', ['Title', 'العنوان'], { maxLen: 32 }),
          s('countKicker', ['Line above the title', 'السطر فوق العنوان'], {
            maxLen: 40,
          }),
          s('countNote', ['Line under the countdown', 'سطر تحت العداد'], {
            maxLen: 60,
          }),
          date,
        ],
      },
      {
        id: 'program',
        type: 'TextReveal',
        transitionIn: rise,
        holdMs: 6000,
        background: panel(ART.tealTop, EDGE.tealTop),
        ornament: { kind: 'none' },
        style: {
          ...ON_TEAL,
          textPosition: 'bottom',
          headingSize: 'lg',
          headingFont: names,
        },
        slots: [
          s('progHeading', ['Title', 'العنوان'], { maxLen: 32 }),
          s('progKicker', ['Line above the title', 'السطر فوق العنوان'], {
            maxLen: 32,
          }),
          s(
            'program',
            ['Program — one line each: time | title | note', 'الفقرات — كل فقرة في سطر: الوقت | الفقرة | وصف'],
            { maxLen: 600 },
          ),
        ],
      },
      {
        id: 'venue',
        type: 'Venue',
        transitionIn: rise,
        holdMs: 5000,
        background: panel(ART.whiteTop, EDGE.whiteTop),
        ornament: { kind: 'none' },
        style: {
          ...ON_WHITE,
          textPosition: 'bottom',
          headingSize: 'lg',
          headingFont: names,
        },
        slots: [
          { ...s('venueHeading', ['Title', 'العنوان']), key: 'heading' },
          {
            ...s('address', ['Hall name, then the address', 'اسم القاعة ثم العنوان'], { maxLen: 140 }),
            key: 'address',
          },
          slot('mapUrl', locale, '', ['Google Maps link (optional)', 'رابط جوجل ماب (اختياري)'], { maxLen: 200 }),
        ],
      },
      {
        id: 'rsvp',
        type: 'Rsvp',
        transitionIn: rise,
        holdMs: 5000,
        background: panel(ART.tealBottom, EDGE.tealBottom),
        ornament: { kind: 'none' },
        style: {
          ...ON_TEAL,
          textPosition: 'top',
          headingSize: 'lg',
          headingFont: names,
        },
        slots: [
          { ...s('rsvpHeading', ['Title', 'العنوان']), key: 'heading' },
          {
            ...s('rsvpBody', ['Note', 'ملاحظة'], { maxLen: 120 }),
            key: 'body',
          },
          slot('phone', locale, '', ['WhatsApp number, with country code', 'رقم واتساب مع كود الدولة'], { maxLen: 20 }),
        ],
      },
      {
        id: 'finale',
        type: 'Finale',
        transitionIn: { preset: 'glow', durationMs: 1200, delayMs: 0 },
        holdMs: 6000,
        background: panel(ART.whiteBottom, EDGE.whiteBottom),
        ornament: { kind: 'none' },
        decoration: { effect: 'none', intensity: 'low' },
        style: {
          ...ON_WHITE,
          textPosition: 'top',
          headingSize: 'xl',
          headingFont: names,
        },
        slots: [
          {
            ...s('finale', ['Sign-off', 'الختام'], {
              required: true,
              maxLen: 40,
            }),
            key: 'heading',
          },
          {
            ...s('finaleBody', ['Last line', 'السطر الأخير'], { maxLen: 80 }),
            key: 'body',
          },
          {
            key: 'names',
            type: 'text' as const,
            editable: true,
            required: false,
            bind: 'couple',
          },
          date,
        ],
      },
    ],
  };
}

function make(locale: 'ar' | 'en'): CatalogTemplate {
  return {
    slug: `invitation-white-bloom-${locale}`,
    category: 'invitation',
    titleEn: 'Wedding Invitation — White Bloom',
    titleAr: 'دعوة زفاف — الورد الأبيض',
    locale,
    direction: locale === 'ar' ? 'rtl' : 'ltr',
    isPaid: true,
    pricePiastres: PRICE.invitationPremium,
    currency: 'EGP',
    thumbnailHint:
      'White peonies on white paper and on deep turquoise, a full floral wreath on the cover, Great Vibes names, pearls for every rule; the guest unties a turquoise ribbon to open the card.',
    thumbnailUrl: ART.wreath,
    mvp: true,
    definition: buildDefinition(locale),
  };
}

export const BLOOM_TEMPLATES: CatalogTemplate[] = [make('en'), make('ar')];
