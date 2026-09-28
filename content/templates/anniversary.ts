/**
 * ANNIVERSARY — one card, read top to bottom like a love letter by candlelight.
 *
 * Deep wine and antique gold, an engraved frame around the two ends:
 *   cover → the letter → where it began (photo) → our milestones → favourite
 *   moments → a line to keep → tonight's plan → a keepsake → sign-off.
 *
 * EN "Our Story" (free, MVP) — Playfair Display over Cormorant Garamond.
 * AR "ذكرى حبّنا" (paid) — Amiri over Tajawal, written in warm Egyptian Arabic
 *   (not a translation of the English), addressed to her.
 *
 * Scene ids that existed before the one-page rewrite are kept (saved cards
 * bind to them). `date-night` is new; the old countdown was dropped — "the
 * next chapter" had no date anyone could fill in.
 */
import type { TemplateDefinitionInput } from '@/lib/template-contract';
import type { CatalogTemplate } from './_helpers';
import { PRICE } from './_helpers';
import { LABEL, PLAIN, date, enter, frame, photo, text, theme, type Loc, type Look } from './_card';

const WINE: Omit<Look, 'fontHeading' | 'fontBody' | 'music'> = {
  palette: ['#2A0E1B', '#7A1E3A', '#FBF7F4', '#C68B59'],
  ground: ['#2A0E1B', '#4A1427', '#2A0E1B'],
  accent: '#C68B59',
  ink: '#FBF7F4',
  headingInk: '#FBF7F4',
  ornament: 'engraved',
  pattern: 'noise',
  ambient: { effect: 'glow', intensity: 'low', color: '#C68B59' },
};

const LOOK: Record<Loc, Look> = {
  en: { ...WINE, fontHeading: 'Playfair Display', fontBody: 'Cormorant Garamond', music: 'soft-piano' },
  ar: { ...WINE, fontHeading: 'Amiri', fontBody: 'Tajawal', music: 'oud-romantic' },
};

/** Stable scene ids per language (saved cards reference these). */
const IDS = {
  en: { photo: 'the-day-we-met', quote: 'vow', lines: 'milestones', gallery: 'gallery', letter: 'letter', gift: 'keepsake' },
  ar: { photo: 'awwel-youm', quote: 'kelma', lines: 'hekayetna', gallery: 'zekrayat', letter: 'gawab', gift: 'hadiya' },
} as const;

const COPY = {
  en: {
    heading: 'Happy Anniversary, {recipient}',
    sub: 'Another year of us — and all the ones still to come.',
    dear: 'My love,',
    letter:
      'Another year, and you still surprise me. Thank you for the ordinary days — the coffees, the late talks, the way you reach for my hand without looking. I would choose this life, and you, again and again.',
    sign: 'Always yours',
    caption: 'The day everything began',
    line1: 'Our first trip — wrong turns and all.',
    line2: 'The tiny flat that felt like everything.',
    line3: 'And every quiet morning since.',
    galleryTitle: 'A few of our favourite moments',
    quote: 'In all the world, there is no heart for me like yours.',
    quoteBy: 'Maya Angelou',
    eventName: 'Tonight, it’s just us',
    eventPlace: 'A table for two by the Nile',
    eventWhen: 'Dress up · 8:30 PM',
    giftTitle: 'A little something for you',
    giftNote: 'Open it slowly — it took a whole year to mean this much.',
    finale: 'Here’s to forever, {recipient}',
    finaleBody: 'I love you — today, and every year after.',
  },
  ar: {
    heading: 'كل سنة وإحنا سوا يا {recipient}',
    sub: 'سنة كمان عدّت.. والعمر كله لسه قدّامنا',
    dear: 'حبيبتي،',
    letter:
      'سنة كاملة ولسه بتفاجئيني. شكراً على الأيام العادية الصغيّرة.. فنجان القهوة، والكلام لحد الفجر، وإيدك اللي بتدوّر على إيدي من غير ما تبصّي. لو رجع بيّا الزمن، هختارك إنتِ.. مرة ومرة وألف مرة.',
    sign: 'حبيبك على طول',
    caption: 'أول يوم بدأت فيه حكايتنا',
    line1: 'أول سفرية لينا.. بكل لخبطتها',
    line2: 'أول بيت صغيّر حسّيناه الدنيا كلها',
    line3: 'وكل صباح هادي من يومها',
    galleryTitle: 'أحلى لحظاتنا',
    quote: 'مفيش في الدنيا قلب يشبه قلبك عندي',
    quoteBy: 'وهيفضل كده على طول',
    eventName: 'سهرتنا الليلة',
    eventPlace: 'ترابيزة لاتنين على النيل',
    eventWhen: 'البسي حلو · الساعة ٨:٣٠',
    giftTitle: 'حاجة صغيّرة ليكي',
    giftNote: 'افتحيها على مهلك.. سنة كاملة هي اللي خلّتها تعني كده',
    finale: 'لعمر كامل معاكي يا {recipient}',
    finaleBody: 'بحبك.. النهارده وكل سنة جاية',
  },
} satisfies Record<Loc, Record<string, string>>;

function definition(loc: Loc): TemplateDefinitionInput {
  const look = LOOK[loc];
  const c = COPY[loc];
  const id = IDS[loc];
  const t = (key: string, label: readonly [string, string], value: string, opts?: Parameters<typeof text>[4]) =>
    text(loc, key, label, value, opts);
  const info = { headingColor: look.accent, bodyColor: look.ink };

  return {
    version: 1,
    locale: loc,
    direction: loc === 'ar' ? 'rtl' : 'ltr',
    theme: theme(look),
    scenes: [
      {
        id: 'cover',
        type: 'Cover',
        transitionIn: enter('blurIn', 1200),
        holdMs: 4500,
        ornament: frame(look),
        style: { headingSize: 'xl', headingColor: look.headingInk, bodyColor: look.accent },
        slots: [
          t('heading', LABEL.coverHeading, c.heading, { required: true, maxLen: 48, animation: 'rise' }),
          t('subheading', LABEL.coverSub, c.sub, { maxLen: 70, animation: 'blurIn' }),
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
          t('heading', LABEL.letterOpening, c.dear, { required: true, maxLen: 40 }),
          t('body', LABEL.letterBody, c.letter, { maxLen: 420 }),
          t('signoff', LABEL.letterSign, c.sign, { maxLen: 40 }),
        ],
      },
      {
        id: id.photo,
        type: 'PhotoReveal',
        transitionIn: enter('rise', 1100),
        holdMs: 4600,
        ornament: PLAIN,
        decoration: { effect: 'petals', intensity: 'low' },
        style: { imageStyle: 'polaroid', headingColor: look.accent, headingSize: 'md' },
        slots: [
          photo('image', LABEL.photo, { aspect: '4:3' }),
          t('caption', LABEL.caption, c.caption, { maxLen: 48, animation: 'rise' }),
        ],
      },
      {
        id: id.lines,
        type: 'TextReveal',
        transitionIn: enter('rise'),
        holdMs: 4600,
        ornament: PLAIN,
        style: { headingColor: look.headingInk, bodyColor: look.ink, headingSize: 'md' },
        slots: [
          t('line1', LABEL.line1, c.line1, { required: true, maxLen: 60 }),
          t('line2', LABEL.line2, c.line2, { maxLen: 60 }),
          t('line3', LABEL.line3, c.line3, { maxLen: 60 }),
        ],
      },
      {
        id: id.gallery,
        type: 'Gallery',
        transitionIn: enter('rise', 850),
        holdMs: 5200,
        ornament: PLAIN,
        style: { imageStyle: 'card', headingSize: 'md', headingColor: look.accent },
        slots: [
          t('heading', LABEL.galleryTitle, c.galleryTitle, { maxLen: 36 }),
          photo('gallery', LABEL.gallery, { aspect: '1:1', max: 6 }),
        ],
      },
      {
        id: id.quote,
        type: 'Quote',
        transitionIn: enter('blurIn', 1300),
        holdMs: 5000,
        ornament: PLAIN,
        decoration: { effect: 'sparkles', intensity: 'low', color: look.accent },
        style: { headingColor: look.headingInk, bodyColor: look.accent, headingSize: 'lg' },
        slots: [
          t('message', LABEL.quote, c.quote, { required: true, maxLen: 180 }),
          t('attribution', LABEL.quoteBy, c.quoteBy, { maxLen: 40 }),
        ],
      },
      {
        id: 'date-night',
        type: 'Event',
        transitionIn: enter('rise'),
        holdMs: 5000,
        ornament: PLAIN,
        style: info,
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
        transitionIn: enter('glow', 1000),
        holdMs: 4600,
        ornament: PLAIN,
        decoration: { effect: 'glow', intensity: 'medium', color: look.accent, emoji: '💝' },
        style: { headingColor: look.headingInk, bodyColor: look.ink, headingSize: 'lg', imageStyle: 'ornate' },
        slots: [
          t('heading', LABEL.giftTitle, c.giftTitle, { required: true, maxLen: 40 }),
          t('body', LABEL.giftNote, c.giftNote, { maxLen: 110 }),
          photo('image', LABEL.giftPhoto, { aspect: '1:1' }),
        ],
      },
      {
        id: 'finale',
        type: 'Finale',
        transitionIn: enter('blurIn', 1100),
        holdMs: 6000,
        ornament: frame(look),
        decoration: { effect: 'petals', intensity: 'medium' },
        style: { headingSize: 'lg', headingColor: look.headingInk, bodyColor: look.accent },
        slots: [
          t('heading', LABEL.finaleHeading, c.finale, { required: true, maxLen: 48, animation: 'rise' }),
          t('body', LABEL.finaleBody, c.finaleBody, { maxLen: 120 }),
        ],
      },
    ],
  };
}

export const anniversaryEn: CatalogTemplate = {
  slug: 'anniversary-our-story-en',
  category: 'anniversary',
  titleEn: 'Anniversary — Our Story',
  titleAr: 'قصتنا',
  locale: 'en',
  direction: 'ltr',
  isPaid: false,
  pricePiastres: PRICE.free,
  currency: 'EGP',
  thumbnailHint:
    'Deep wine card lit like candlelight, an engraved gold frame, Playfair "Happy Anniversary", a cream letter sheet below.',
  thumbnailUrl:
    'https://images.unsplash.com/photo-1518621736915-f3b1c41bfd00?auto=format&fit=crop&w=800&q=70',
  mvp: true,
  definition: definition('en'),
};

export const anniversaryAr: CatalogTemplate = {
  slug: 'anniversary-hobbna-ar',
  category: 'anniversary',
  titleEn: 'Anniversary — Story of Our Love',
  titleAr: 'ذكرى حبّنا',
  locale: 'ar',
  direction: 'rtl',
  isPaid: true,
  pricePiastres: PRICE.standard,
  currency: 'EGP',
  thumbnailHint:
    'Deep wine and antique gold, an engraved frame, Amiri "كل سنة وإحنا سوا", a cream letter sheet, RTL.',
  thumbnailUrl:
    'https://images.unsplash.com/photo-1529634806980-85c3dd6d34ac?auto=format&fit=crop&w=800&q=70',
  mvp: false,
  definition: definition('ar'),
};
