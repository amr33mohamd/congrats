/**
 * BIRTHDAY — one card, a party from the first balloon to the last confetti.
 *
 * Banner bands at the two ends, confetti-dot ground:
 *   cover → a letter → the birthday star (photo) → favourite memories → a
 *   wish → the countdown to the day → the birthday dinner → where → a gift →
 *   confetti finale.
 *
 * EN "Make a Wish" (free, MVP) — midnight violet + marigold, Fredoka/Poppins.
 * AR "كل سنة وإنت طيّب" (free) — deep teal + amber, Lalezar/Tajawal, the
 *   spoken Egyptian birthday voice, to a friend.
 *
 * The dinner/venue sections are a plan the sender made; clearing them removes
 * them from the card. Scene ids that existed before the one-page rewrite are
 * kept; `letter`, `party` and `venue` are new.
 */
import type { TemplateDefinitionInput } from '@/lib/template-contract';
import type { CatalogTemplate } from './_helpers';
import { PRICE } from './_helpers';
import { LABEL, PLAIN, date, enter, frame, photo, text, theme, type Loc, type Look } from './_card';

const LOOK: Record<Loc, Look> = {
  en: {
    palette: ['#2E1065', '#7C3AED', '#FFFFFF', '#FBBF24'],
    ground: ['#2E1065', '#4C1D95', '#2E1065'],
    accent: '#FBBF24',
    ink: '#FFFFFF',
    headingInk: '#FFFFFF',
    fontHeading: 'Fredoka',
    fontBody: 'Poppins',
    music: 'happy-birthday-uplift',
    ornament: 'banner',
    pattern: 'confettiDots',
  },
  ar: {
    palette: ['#063D3A', '#0F766E', '#FFFFFF', '#F59E0B'],
    ground: ['#063D3A', '#0B5550', '#063D3A'],
    accent: '#F59E0B',
    ink: '#FFFFFF',
    headingInk: '#FFFFFF',
    fontHeading: 'Lalezar',
    fontBody: 'Tajawal',
    music: 'happy-birthday-uplift',
    ornament: 'banner',
    pattern: 'confettiDots',
  },
};

const IDS = {
  en: { photo: 'star', gallery: 'memories', quote: 'wish-message', countdown: 'countdown', gift: 'gift' },
  ar: { photo: 'negm', gallery: 'zekrayat', quote: 'omneya', countdown: 'tanazol', gift: 'hadiya' },
} as const;

const COPY = {
  en: {
    heading: 'Happy Birthday, {recipient}!',
    sub: 'Make a wish — this whole card is for you.',
    dear: 'Dear {recipient},',
    letter:
      'Another trip around the sun, and somehow you got even better. Thank you for the laughs, the late-night calls and the way you show up for everyone. I hope this year is kind to you and loud with good news.',
    sign: 'Love you lots',
    caption: 'The birthday star',
    galleryTitle: 'A few favourite memories',
    wish: 'Here’s to the year you get everything you’ve been quietly hoping for.',
    wishBy: 'Make it count',
    countdown: 'Counting down to your big day',
    countdownNote: 'Clear your calendar — it’s all about you.',
    eventName: 'Your birthday dinner',
    eventPlace: 'We booked a table — just show up',
    eventWhen: 'Saturday · 8 PM',
    venueTitle: 'Where to find us',
    address: '26th of July Street, Zamalek\nCairo',
    giftTitle: 'A gift for you',
    giftNote: 'Something small for someone who deserves the world.',
    finale: "Here's to you, {recipient}!",
    finaleBody: 'Here’s to your best year yet.',
  },
  ar: {
    heading: 'كل سنة وإنت طيب يا {recipient}',
    sub: 'اتمنّى أمنية.. الكارت ده كله علشانك',
    dear: 'يا أغلى صاحب،',
    letter:
      'سنة كمان عدّت وإنت كل سنة بتحلو. شكراً على الضحك، والمكالمات اللي بتطوّل بالليل، وإنك دايماً موجود لكل الناس. يا رب السنة دي تبقى حلوة عليك ومليانة أخبار تفرّح.',
    sign: 'بحبك يا صاحبي',
    caption: 'نجم الليلة',
    galleryTitle: 'أحلى ذكرياتنا',
    wish: 'عقبال ما كل اللي بتتمنّاه في سرّك يتحقق السنة دي',
    wishBy: 'من القلب',
    countdown: 'باقي على يومك',
    countdownNote: 'فضّي نفسك.. اليوم ده بتاعك',
    eventName: 'عشا عيد ميلادك',
    eventPlace: 'حاجزين ترابيزة.. تعالى بس',
    eventWhen: 'السبت · الساعة ٨',
    venueTitle: 'هتلاقينا هنا',
    address: 'شارع ٢٦ يوليو، الزمالك\nالقاهرة',
    giftTitle: 'هديتك',
    giftNote: 'حاجة صغيّرة لحد يستاهل الدنيا كلها',
    finale: 'سنة سعيدة يا {recipient}',
    finaleBody: 'وعقبال مية سنة',
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
    // Asked once: the countdown and the party section both use this date.
    fields: [
      {
        key: 'partyDate',
        type: 'date',
        required: false,
        labelEn: 'Party date & time (optional)',
        labelAr: 'تاريخ ووقت الحفلة (اختياري)',
      },
    ],
    scenes: [
      {
        id: 'cover',
        type: 'Cover',
        transitionIn: enter('bounce', 1000),
        holdMs: 4000,
        ornament: frame(look, 0.85),
        decoration: { effect: 'balloons', intensity: 'medium' },
        style: { headingSize: 'xl', headingColor: look.headingInk, bodyColor: look.accent },
        slots: [
          t('heading', LABEL.coverHeading, c.heading, { required: true, maxLen: 44, animation: 'bounce' }),
          t('subheading', LABEL.coverSub, c.sub, { maxLen: 60 }),
          photo('coverImage', LABEL.coverPhoto, { aspect: '1:1' }),
        ],
      },
      {
        id: 'letter',
        type: 'Letter',
        transitionIn: enter('rise', 1000),
        holdMs: 6000,
        ornament: PLAIN,
        slots: [
          t('heading', LABEL.letterOpening, c.dear, { maxLen: 40 }),
          t('body', LABEL.letterBody, c.letter, { maxLen: 420 }),
          t('signoff', LABEL.letterSign, c.sign, { maxLen: 40 }),
        ],
      },
      {
        id: id.photo,
        type: 'PhotoReveal',
        transitionIn: enter('bounce', 1000),
        holdMs: 4500,
        ornament: PLAIN,
        decoration: { effect: 'sparkles', intensity: 'low', color: look.accent },
        style: { imageStyle: 'polaroid', headingColor: look.accent, headingSize: 'md' },
        slots: [
          photo('image', LABEL.photo, { aspect: '4:5' }),
          t('caption', LABEL.caption, c.caption, { maxLen: 48, animation: 'rise' }),
        ],
      },
      {
        id: id.gallery,
        type: 'Gallery',
        transitionIn: enter('rise', 850),
        holdMs: 5200,
        ornament: PLAIN,
        style: { imageStyle: 'tilt', headingSize: 'md', headingColor: look.accent },
        slots: [
          t('heading', LABEL.galleryTitle, c.galleryTitle, { maxLen: 36 }),
          photo('gallery', LABEL.gallery, { aspect: '1:1', max: 6 }),
        ],
      },
      {
        id: id.quote,
        type: 'Quote',
        transitionIn: enter('blurIn', 1100),
        holdMs: 5000,
        ornament: PLAIN,
        decoration: { effect: 'sparkles', intensity: 'low', color: look.accent },
        style: { headingColor: look.headingInk, bodyColor: look.accent, headingSize: 'lg' },
        slots: [
          t('message', ['Your wish for them', 'أمنيتك ليه'], c.wish, { required: true, maxLen: 200 }),
          t('attribution', LABEL.quoteBy, c.wishBy, { maxLen: 40 }),
        ],
      },
      {
        id: id.countdown,
        type: 'Countdown',
        transitionIn: enter('bounce', 900),
        holdMs: 4500,
        ornament: PLAIN,
        style: { headingColor: look.accent, bodyColor: look.ink, headingSize: 'md' },
        slots: [
          t('lead', LABEL.countdownTitle, c.countdown, { maxLen: 44 }),
          { ...date('targetDate', LABEL.countdownDate), bind: 'partyDate' },
          t('body', LABEL.countdownNote, c.countdownNote, { maxLen: 80 }),
        ],
      },
      {
        id: 'party',
        type: 'Event',
        transitionIn: enter('rise'),
        holdMs: 5000,
        ornament: PLAIN,
        style: info,
        slots: [
          t('label', LABEL.eventName, c.eventName, { maxLen: 48 }),
          t('venue', LABEL.eventPlace, c.eventPlace, { maxLen: 60 }),
          t('when', LABEL.eventWhen, c.eventWhen, { maxLen: 48 }),
          { ...date('date', LABEL.eventDate), bind: 'partyDate' },
        ],
      },
      {
        id: 'venue',
        type: 'Venue',
        transitionIn: enter('rise'),
        holdMs: 5000,
        ornament: PLAIN,
        style: info,
        slots: [
          t('heading', LABEL.venueTitle, c.venueTitle, { maxLen: 40 }),
          t('address', LABEL.venueAddress, c.address, { maxLen: 140 }),
          t('mapUrl', LABEL.venueMap, '', { maxLen: 200 }),
        ],
      },
      {
        id: id.gift,
        type: 'GiftReveal',
        transitionIn: enter('flip', 1000),
        holdMs: 4500,
        ornament: PLAIN,
        decoration: { effect: 'emoji', intensity: 'low', emoji: '🎁' },
        style: { headingColor: look.accent, bodyColor: look.ink, headingSize: 'lg', imageStyle: 'card' },
        slots: [
          t('heading', LABEL.giftTitle, c.giftTitle, { required: true, maxLen: 40 }),
          t('body', LABEL.giftNote, c.giftNote, { maxLen: 100 }),
          photo('image', LABEL.giftPhoto, { aspect: '1:1' }),
        ],
      },
      {
        id: 'finale',
        type: 'Finale',
        transitionIn: enter('bounce', 1000),
        holdMs: 6000,
        ornament: frame(look, 0.85),
        decoration: { effect: 'confetti', intensity: 'high' },
        style: { headingSize: 'xl', headingColor: look.headingInk, bodyColor: look.accent },
        slots: [
          t('heading', LABEL.finaleHeading, c.finale, { required: true, maxLen: 44, animation: 'bounce' }),
          t('body', LABEL.finaleBody, c.finaleBody, { maxLen: 100 }),
        ],
      },
    ],
  };
}

export const birthdayEn: CatalogTemplate = {
  slug: 'birthday-make-a-wish-en',
  category: 'birthday',
  titleEn: 'Birthday — Make a Wish',
  titleAr: 'تمنّى أمنية',
  locale: 'en',
  direction: 'ltr',
  isPaid: false,
  pricePiastres: PRICE.free,
  currency: 'EGP',
  thumbnailHint:
    'Confetti burst on lilac, a candle-lit cake, bubbly rounded "Make a Wish", balloons.',
  thumbnailUrl:
    'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=800&q=70',
  mvp: true,
  definition: definition('en'),
};

export const birthdayAr: CatalogTemplate = {
  slug: 'birthday-kol-sana-ar',
  category: 'birthday',
  titleEn: 'Birthday — Many Happy Returns',
  titleAr: 'كل سنة وإنت طيّب',
  locale: 'ar',
  direction: 'rtl',
  isPaid: false,
  pricePiastres: PRICE.free,
  currency: 'EGP',
  thumbnailHint:
    'Festive teal + gold confetti, a cake with candles, Lalezar "كل سنة وإنت طيب", balloons, RTL.',
  thumbnailUrl:
    'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?auto=format&fit=crop&w=800&q=70',
  mvp: false,
  definition: definition('ar'),
};
