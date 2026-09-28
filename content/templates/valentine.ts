/**
 * VALENTINE — one card, a love note from top to bottom.
 *
 * Deep rose and blush, floral corners at the two ends:
 *   cover → the love note → my favourite view (photo) → reasons I love you →
 *   us, lately → a line to keep → our date → a gift → sign-off.
 *
 * EN "Be Mine" (free, MVP) — Dancing Script over Poppins.
 * AR "يا قلبي" (paid) — Aref Ruqaa over Tajawal, playful Egyptian Arabic,
 *   addressed to her.
 *
 * The accent is blush, not the crimson in the palette: crimson section titles
 * on a wine ground were barely readable. Scene ids that existed before the
 * one-page rewrite are kept; `date-night` is new.
 */
import type { TemplateDefinitionInput } from '@/lib/template-contract';
import type { CatalogTemplate } from './_helpers';
import { PRICE } from './_helpers';
import { LABEL, PLAIN, date, enter, frame, photo, text, theme, type Loc, type Look } from './_card';

const ROSE: Omit<Look, 'fontHeading' | 'fontBody'> = {
  palette: ['#3B0A1A', '#D11A4B', '#FFF1F2', '#F4B6C2'],
  ground: ['#3B0A1A', '#5E0F2A', '#3B0A1A'],
  accent: '#F4B6C2',
  ink: '#FFF1F2',
  headingInk: '#FFF1F2',
  music: 'romantic-strings',
  ornament: 'corners',
  pattern: 'noise',
  ambient: { effect: 'hearts', intensity: 'low', color: '#F4B6C2' },
};

const LOOK: Record<Loc, Look> = {
  en: { ...ROSE, fontHeading: 'Dancing Script', fontBody: 'Poppins' },
  ar: { ...ROSE, fontHeading: 'Aref Ruqaa', fontBody: 'Tajawal' },
};

const IDS = {
  en: { letter: 'love-note', photo: 'our-photo', gallery: 'moments', quote: 'love-quote', lines: 'reasons', gift: 'gift' },
  ar: { letter: 'resala', photo: 'sora', gallery: 'lahazat', quote: 'eqtebas', lines: 'asbab', gift: 'hadiya' },
} as const;

const COPY = {
  en: {
    heading: 'For you, {recipient} ❤',
    sub: 'A little something, straight from the heart.',
    dear: 'To my favourite person,',
    note:
      'Every ordinary day with you turns into the best kind of day. I don’t need a special date to love you — but I’ll take any excuse to say it out loud. You are my safe place and my best adventure, my favourite hello and my hardest goodbye.',
    sign: 'Always yours',
    caption: 'My favourite view',
    reason1: 'Your laugh, the loud unguarded one.',
    reason2: 'How kind you are when no one is watching.',
    reason3: 'The way you say my name.',
    galleryTitle: 'Us, lately',
    quote: 'I love you not only for what you are, but for what I am when I am with you.',
    quoteBy: 'Roy Croft',
    eventName: 'Our Valentine’s date',
    eventPlace: 'Dinner somewhere with candles',
    eventWhen: '14 February · 8 PM',
    giftTitle: 'Open me',
    giftNote: 'Consider this my heart, gift-wrapped.',
    finale: 'Be mine, {recipient}?',
    finaleBody: 'Today, tomorrow and every day after — it’s you.',
  },
  ar: {
    heading: 'ليكِ إنتِ يا {recipient} ❤',
    sub: 'حاجة صغيّرة.. جايالك من القلب',
    dear: 'لأحلى حد في حياتي،',
    note:
      'كل يوم عادي معاكي بيبقى أحلى يوم في الدنيا. مش محتاج يوم مخصوص علشان أحبك، بس أي حجّة أقولها فيها بصوت عالي هاخدها. إنتِ أماني وأحلى مغامرة في عمري.. أحلى صباح وأصعب وداع.',
    sign: 'قلبي كله ليكِ',
    caption: 'أحلى منظر شفته',
    reason1: 'ضحكتك اللي من غير حساب',
    reason2: 'طيبتك لما محدش بيشوف',
    reason3: 'ولمّا بتنادي على اسمي',
    galleryTitle: 'حكايتنا بالصور',
    quote: 'الحبّ في الأرض بعضٌ من تخيّلنا.. لو لم نجدْه عليها لاخترعناه',
    quoteBy: 'نزار قباني',
    eventName: 'خروجة عيد الحب',
    eventPlace: 'عشا على ضوء الشموع',
    eventWhen: '١٤ فبراير · الساعة ٨',
    giftTitle: 'افتحيني',
    giftNote: 'اعتبريها قلبي.. متغلّف ومتقدّم ليكِ',
    finale: 'تبقي بتاعتي يا {recipient}؟',
    finaleBody: 'النهارده وبكرة وكل يوم.. إنتِ',
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
        transitionIn: enter('bounce', 1000),
        holdMs: 4000,
        ornament: frame(look),
        decoration: { effect: 'hearts', intensity: 'medium', color: look.accent },
        style: { headingSize: 'xl', headingColor: look.headingInk, bodyColor: look.accent },
        slots: [
          t('heading', LABEL.coverHeading, c.heading, { required: true, maxLen: 44, animation: 'bounce' }),
          t('subheading', LABEL.coverSub, c.sub, { maxLen: 60, animation: 'fade' }),
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
          t('note', LABEL.letterBody, c.note, { required: true, maxLen: 420 }),
          t('signoff', LABEL.letterSign, c.sign, { maxLen: 40 }),
        ],
      },
      {
        id: id.photo,
        type: 'PhotoReveal',
        transitionIn: enter('zoom', 1100),
        holdMs: 4500,
        ornament: PLAIN,
        style: { imageStyle: 'taped', headingColor: look.accent, headingSize: 'md' },
        slots: [
          photo('image', LABEL.photo, { aspect: '4:5' }),
          t('caption', LABEL.caption, c.caption, { maxLen: 48, animation: 'rise' }),
        ],
      },
      {
        id: id.lines,
        type: 'TextReveal',
        transitionIn: enter('rise'),
        holdMs: 5000,
        ornament: PLAIN,
        style: { headingColor: look.headingInk, bodyColor: look.accent, headingSize: 'md' },
        slots: [
          t('reason1', LABEL.line1, c.reason1, { required: true, maxLen: 60 }),
          t('reason2', LABEL.line2, c.reason2, { maxLen: 60 }),
          t('reason3', LABEL.line3, c.reason3, { maxLen: 60 }),
        ],
      },
      {
        id: id.gallery,
        type: 'Gallery',
        transitionIn: enter('rise', 850),
        holdMs: 5200,
        ornament: PLAIN,
        style: { imageStyle: 'polaroid', headingSize: 'md', headingColor: look.accent },
        slots: [
          t('heading', LABEL.galleryTitle, c.galleryTitle, { maxLen: 36 }),
          photo('gallery', LABEL.gallery, { aspect: '1:1', max: 6 }),
        ],
      },
      {
        id: id.quote,
        type: 'Quote',
        transitionIn: enter('blurIn', 1200),
        holdMs: 5000,
        ornament: PLAIN,
        decoration: { effect: 'sparkles', intensity: 'low', color: look.accent },
        style: { headingColor: look.headingInk, bodyColor: look.accent, headingSize: 'lg' },
        slots: [
          t('message', LABEL.quote, c.quote, { required: true, maxLen: 200 }),
          t('attribution', LABEL.quoteBy, c.quoteBy, { maxLen: 40 }),
        ],
      },
      {
        id: 'date-night',
        type: 'Event',
        transitionIn: enter('rise'),
        holdMs: 5000,
        ornament: PLAIN,
        style: { headingColor: look.accent, bodyColor: look.ink },
        slots: [
          t('label', LABEL.eventName, c.eventName, { maxLen: 48 }),
          t('venue', LABEL.eventPlace, c.eventPlace, { maxLen: 60 }),
          t('when', LABEL.eventWhen, c.eventWhen, { maxLen: 48 }),
          date('date', LABEL.eventDate),
        ],
      },
      {
        id: id.gift,
        type: 'GiftReveal',
        transitionIn: enter('flip', 1000),
        holdMs: 4500,
        ornament: PLAIN,
        decoration: { effect: 'hearts', intensity: 'low', color: look.accent, emoji: '🌹' },
        style: { headingColor: look.headingInk, bodyColor: look.ink, headingSize: 'lg', imageStyle: 'card' },
        slots: [
          t('heading', LABEL.giftTitle, c.giftTitle, { required: true, maxLen: 40 }),
          t('body', LABEL.giftNote, c.giftNote, { maxLen: 110 }),
          photo('image', LABEL.giftPhoto, { aspect: '1:1' }),
        ],
      },
      {
        id: 'finale',
        type: 'Finale',
        transitionIn: enter('glow', 1100),
        holdMs: 6000,
        ornament: frame(look),
        decoration: { effect: 'hearts', intensity: 'high', color: look.accent },
        style: { headingSize: 'xl', headingColor: look.headingInk, bodyColor: look.accent },
        slots: [
          t('heading', LABEL.finaleHeading, c.finale, { required: true, maxLen: 44, animation: 'glow' }),
          t('body', LABEL.finaleBody, c.finaleBody, { maxLen: 110 }),
        ],
      },
    ],
  };
}

export const valentineEn: CatalogTemplate = {
  slug: 'valentine-be-mine-en',
  category: 'valentine',
  titleEn: 'Valentine — Be Mine',
  titleAr: 'كن لي',
  locale: 'en',
  direction: 'ltr',
  isPaid: false,
  pricePiastres: PRICE.free,
  currency: 'EGP',
  thumbnailHint:
    'Deep rose card, blush floral corners, Dancing Script "For you ❤", floating hearts, a blush love-note sheet below.',
  thumbnailUrl:
    'https://images.unsplash.com/photo-1518709779341-56cf4535e94b?auto=format&fit=crop&w=800&q=70',
  mvp: true,
  definition: definition('en'),
};

export const valentineAr: CatalogTemplate = {
  slug: 'valentine-ya-albi-ar',
  category: 'valentine',
  titleEn: 'Valentine — My Heart',
  titleAr: 'يا قلبي',
  locale: 'ar',
  direction: 'rtl',
  isPaid: true,
  pricePiastres: PRICE.standard,
  currency: 'EGP',
  thumbnailHint:
    'Deep rose and blush, floral corners, Aref Ruqaa "ليكِ إنتِ ❤", floating hearts, RTL.',
  thumbnailUrl:
    'https://images.unsplash.com/photo-1520763185298-1b434c919102?auto=format&fit=crop&w=800&q=70',
  mvp: false,
  definition: definition('ar'),
};
