/**
 * WEDDING (congratulations) — one card from a guest to the couple.
 *
 * Distinct from `invitation.ts`, which is the invitation the couple sends.
 * Ivory paper, sage and champagne gold, a botanical wreath at the two ends:
 *   cover → a letter to the two of you → the couple (photo) → a line to keep →
 *   moments (gallery) → the countdown to the day → a gift for the new home →
 *   sign-off.
 *
 * EN "Two Hearts" (paid) — Cormorant Garamond over Montserrat.
 * AR "مبروك الزواج" (paid) — Amiri over Tajawal; the traditional
 *   "بالرفاء والبنين" next to warm Egyptian wishes.
 *
 * `{recipient}` is the couple ("Omar & Nour"). The accent is a deeper gold
 * than the palette's champagne so it reads on ivory. Scene ids are unchanged
 * from before the one-page rewrite — only the order and copy moved.
 */
import type { TemplateDefinitionInput } from '@/lib/template-contract';
import type { CatalogTemplate } from './_helpers';
import { PRICE } from './_helpers';
import { LABEL, PLAIN, date, enter, frame, photo, text, theme, type Loc, type Look } from './_card';

const IVORY: Omit<Look, 'fontHeading' | 'fontBody'> = {
  palette: ['#FBF8F2', '#7C8A6B', '#3B4A36', '#C9A24B'],
  ground: ['#FBF8F2', '#F2F1E8', '#FBF8F2'],
  accent: '#9E7C2F',
  ink: '#3B4A36',
  headingInk: '#3B4A36',
  music: 'wedding-strings',
  ornament: 'wreath',
  angle: 180,
  ambient: { effect: 'petals', intensity: 'low' },
};

const LOOK: Record<Loc, Look> = {
  en: { ...IVORY, fontHeading: 'Cormorant Garamond', fontBody: 'Montserrat' },
  ar: { ...IVORY, fontHeading: 'Amiri', fontBody: 'Tajawal' },
};

const IDS = {
  en: { letter: 'blessing', photo: 'the-couple', quote: 'vow', gallery: 'gallery', countdown: 'countdown', gift: 'gift' },
  ar: { letter: 'doaa', photo: 'el-3roosain', quote: 'doaa-quote', gallery: 'maaak-bas', countdown: 'tanazol', gift: 'hadiya' },
} as const;

const COPY = {
  en: {
    heading: 'Congratulations, {recipient}',
    sub: 'Two hearts, one beautiful story.',
    dear: 'To the two of you,',
    letter:
      'Watching you find each other has been one of the loveliest things. May your home be full of laughter, your arguments short and your mornings slow. Here’s to a marriage that keeps choosing love, every single day.',
    sign: 'With all our love',
    caption: 'The two of you',
    quote: 'Whatever our souls are made of, yours and mine are the same.',
    quoteBy: 'and so it begins',
    galleryTitle: 'Moments we’ll never forget',
    countdown: 'Counting down to forever',
    countdownNote: 'We’ll be the ones crying in the second row.',
    giftTitle: 'A gift for your new home',
    giftNote: 'Something small to start your forever with.',
    finale: 'Wishing you forever, {recipient}',
    finaleBody: 'A lifetime of happiness, together.',
  },
  ar: {
    heading: 'ألف مبروك يا {recipient}',
    sub: 'قلبين بقوا حكاية واحدة',
    dear: 'للعروسين الحلوين،',
    letter:
      'فرحتنا بيكم ملهاش وصف. ربنا يعمر بيتكم بالضحك والبركة، ويجعل خناقاتكم قصيّرة وصباحاتكم هادية، ويجمع بينكم دايماً في خير.',
    sign: 'بكل حبنا',
    caption: 'أحلى اتنين',
    quote: 'وجعل بينكم مودّة ورحمة',
    quoteBy: 'سورة الروم',
    galleryTitle: 'لحظات مش هننساها',
    countdown: 'باقي على الفرح',
    countdownNote: 'وإحنا أول ناس هنعيّط في الصف التاني',
    giftTitle: 'هدية لبيتكم الجديد',
    giftNote: 'حاجة بسيطة على بداية العمر',
    finale: 'بالرفاء والبنين يا {recipient}',
    finaleBody: 'وعمر طويل مليان فرح',
  },
} satisfies Record<Loc, Record<string, string>>;

function definition(loc: Loc): TemplateDefinitionInput {
  const look = LOOK[loc];
  const c = COPY[loc];
  const id = IDS[loc];
  const t = (key: string, label: readonly [string, string], value: string, opts?: Parameters<typeof text>[4]) =>
    text(loc, key, label, value, opts);

  return {
    version: 1,
    locale: loc,
    direction: loc === 'ar' ? 'rtl' : 'ltr',
    theme: theme(look),
    scenes: [
      {
        id: 'cover',
        type: 'Cover',
        transitionIn: enter('blurIn', 1300),
        holdMs: 4500,
        ornament: frame(look),
        style: { headingSize: 'xl', headingColor: look.headingInk, bodyColor: look.accent, imageStyle: 'arch' },
        slots: [
          t('heading', LABEL.coverHeading, c.heading, { required: true, maxLen: 48, animation: 'blurIn' }),
          t('subheading', LABEL.coverSub, c.sub, { maxLen: 60 }),
          photo('coverImage', LABEL.coverPhoto, { aspect: '1:1' }),
        ],
      },
      {
        id: id.letter,
        type: 'Letter',
        transitionIn: enter('rise', 1000),
        holdMs: 6000,
        ornament: PLAIN,
        slots: [
          t('heading', LABEL.letterOpening, c.dear, { maxLen: 40 }),
          t('message', LABEL.letterBody, c.letter, { required: true, maxLen: 420 }),
          t('signoff', LABEL.letterSign, c.sign, { maxLen: 40 }),
        ],
      },
      {
        id: id.photo,
        type: 'PhotoReveal',
        transitionIn: enter('rise', 1100),
        holdMs: 4600,
        ornament: PLAIN,
        style: { imageStyle: 'arch', headingColor: look.accent, headingSize: 'md' },
        slots: [
          photo('image', LABEL.photo, { aspect: '3:4' }),
          t('caption', LABEL.caption, c.caption, { maxLen: 50, animation: 'rise' }),
        ],
      },
      {
        id: id.quote,
        type: 'Quote',
        transitionIn: enter('blurIn', 1200),
        holdMs: 5000,
        ornament: PLAIN,
        style: { headingColor: look.headingInk, bodyColor: look.accent, headingSize: 'lg' },
        slots: [
          t('message', LABEL.quote, c.quote, { required: true, maxLen: 180 }),
          t('attribution', LABEL.quoteBy, c.quoteBy, { maxLen: 40 }),
        ],
      },
      {
        id: id.gallery,
        type: 'Gallery',
        transitionIn: enter('rise', 850),
        holdMs: 5200,
        ornament: PLAIN,
        style: { imageStyle: 'ornate', headingSize: 'md', headingColor: look.accent },
        slots: [
          t('heading', LABEL.galleryTitle, c.galleryTitle, { maxLen: 36 }),
          photo('gallery', LABEL.gallery, { aspect: '3:4', max: 6 }),
        ],
      },
      {
        id: id.countdown,
        type: 'Countdown',
        transitionIn: enter('rise', 900),
        holdMs: 4500,
        ornament: PLAIN,
        style: { headingColor: look.accent, bodyColor: look.ink, headingSize: 'md' },
        slots: [
          t('lead', LABEL.countdownTitle, c.countdown, { maxLen: 44 }),
          date('targetDate', LABEL.countdownDate),
          t('body', LABEL.countdownNote, c.countdownNote, { maxLen: 80 }),
        ],
      },
      {
        id: id.gift,
        type: 'GiftReveal',
        transitionIn: enter('glow', 1000),
        holdMs: 4500,
        ornament: PLAIN,
        decoration: { effect: 'petals', intensity: 'low', emoji: '💐' },
        style: { headingColor: look.headingInk, bodyColor: look.accent, headingSize: 'lg', imageStyle: 'rounded' },
        slots: [
          t('heading', LABEL.giftTitle, c.giftTitle, { required: true, maxLen: 40 }),
          t('body', LABEL.giftNote, c.giftNote, { maxLen: 100 }),
          photo('image', LABEL.giftPhoto, { aspect: '1:1' }),
        ],
      },
      {
        id: 'finale',
        type: 'Finale',
        transitionIn: enter('glow', 1200),
        holdMs: 6000,
        ornament: frame(look),
        decoration: { effect: 'petals', intensity: 'medium' },
        style: { headingSize: 'lg', headingColor: look.headingInk, bodyColor: look.accent },
        slots: [
          t('heading', LABEL.finaleHeading, c.finale, { required: true, maxLen: 48, animation: 'glow' }),
          t('body', LABEL.finaleBody, c.finaleBody, { maxLen: 100 }),
        ],
      },
    ],
  };
}

export const weddingEn: CatalogTemplate = {
  slug: 'wedding-two-hearts-en',
  category: 'wedding',
  titleEn: 'Wedding — Two Hearts',
  titleAr: 'قلبان',
  locale: 'en',
  direction: 'ltr',
  isPaid: true,
  pricePiastres: PRICE.premium,
  currency: 'EGP',
  thumbnailHint:
    'Ivory + sage + champagne gold, a floral arch, Great Vibes script "Two Hearts", olive sprig, falling petals.',
  thumbnailUrl:
    'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=800&q=70',
  mvp: false,
  definition: definition('en'),
};

export const weddingAr: CatalogTemplate = {
  slug: 'wedding-mabrouk-elzawag-ar',
  category: 'wedding',
  titleEn: 'Wedding — Congratulations',
  titleAr: 'مبروك الزواج',
  locale: 'ar',
  direction: 'rtl',
  isPaid: true,
  pricePiastres: PRICE.premium,
  currency: 'EGP',
  thumbnailHint:
    'Ivory + sage + champagne gold, a floral arch, Amiri "ألف مبروك"، olive + jasmine, falling petals, RTL.',
  thumbnailUrl:
    'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=800&q=70',
  mvp: false,
  definition: definition('ar'),
};
