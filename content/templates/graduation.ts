/**
 * GRADUATION — one card, from caps in the air to the party.
 *
 * Deep navy and gold, banner bands at the two ends:
 *   cover → a letter → the grad (photo) → the journey → a line to keep → the
 *   years it took (gallery) → the countdown to the ceremony → the party →
 *   where → a gift → fireworks.
 *
 * EN "Caps in the Air" (free) — Bebas Neue over Montserrat.
 * AR "ألف مبروك التخرّج" (paid) — El Messiri over Tajawal, the spoken
 *   "ألف مبروك" pride, to him.
 *
 * The party and venue sections are what a graduate's family actually sends
 * around; clearing them drops them from the card. Scene ids that existed
 * before the one-page rewrite are kept; the AR card gains a quote (`kelma`)
 * to match the EN `tassel`.
 */
import type { TemplateDefinitionInput } from '@/lib/template-contract';
import type { CatalogTemplate } from './_helpers';
import { PRICE } from './_helpers';
import { LABEL, PLAIN, date, enter, frame, photo, text, theme, type Loc, type Look } from './_card';

const NAVY: Omit<Look, 'fontHeading' | 'fontBody'> = {
  palette: ['#0B1B2B', '#11294A', '#FFFFFF', '#E3B341'],
  ground: ['#0B1B2B', '#11294A', '#0B1B2B'],
  accent: '#E3B341',
  ink: '#FFFFFF',
  headingInk: '#FFFFFF',
  music: 'triumphant-soft',
  ornament: 'banner',
  pattern: 'noise',
  ambient: { effect: 'sparkles', intensity: 'low', color: '#E3B341' },
};

const LOOK: Record<Loc, Look> = {
  en: { ...NAVY, fontHeading: 'Bebas Neue', fontBody: 'Montserrat' },
  ar: { ...NAVY, fontHeading: 'El Messiri', fontBody: 'Tajawal' },
};

const IDS = {
  en: { photo: 'the-grad', lines: 'journey', quote: 'tassel', gallery: 'years', countdown: 'ceremony', gift: 'gift' },
  ar: { photo: 'el-khreeg', lines: 'el-rehla', quote: 'kelma', gallery: 'el-seneen', countdown: 'el-haflaa', gift: 'hadiya' },
} as const;

const COPY = {
  en: {
    heading: 'Congratulations, {recipient}!',
    sub: 'Caps in the air — you actually did it.',
    dear: 'Dear {recipient},',
    letter:
      'I watched you work for this — the early mornings, the all-nighters, the moments you wanted to quit and didn’t. Today belongs to you. Whatever you choose next, I already know you’ll give it everything.',
    sign: 'So proud of you',
    caption: 'Cap, gown and a whole future',
    line1: 'Every late night finally paid off.',
    line2: 'Every exam, every deadline — behind you now.',
    line3: 'And the whole world is ahead.',
    quote: 'The tassel was worth the hassle.',
    quoteBy: 'Class of forever',
    galleryTitle: 'The years it took',
    countdown: 'Counting down to graduation day',
    countdownNote: 'Front-row seats are taken — by us.',
    eventName: 'The graduation party',
    eventPlace: 'At ours — in the garden',
    eventWhen: 'Friday · 7 PM',
    venueTitle: 'How to get there',
    address: '5 Road 9, Maadi\nCairo',
    giftTitle: 'A gift, well earned',
    giftNote: 'For the grad who never stopped showing up.',
    finale: 'So proud of you, {recipient}!',
    finaleBody: 'This is only the beginning.',
  },
  ar: {
    heading: 'ألف مبروك يا {recipient}',
    sub: 'تعب السنين أهو جاب نتيجته',
    dear: 'يا بطل،',
    letter:
      'شفتك وإنت بتتعب علشان اليوم ده.. الصحيان بدري، والسهر، والمرات اللي كنت عايز تبطّل فيها وكمّلت. النهارده يومك إنت. وأياً كان اللي هتختاره بعد كده، أنا متأكد إنك هتديله كل اللي عندك.',
    sign: 'فخورين بيك',
    caption: 'الكاب والروب.. وبكرة كله قدّامك',
    line1: 'السهر كله جاب تمنه',
    line2: 'كل امتحان وكل تسليم.. بقى وراك',
    line3: 'والدنيا كلها قدّامك',
    quote: 'على قدر أهل العزم تأتي العزائم',
    quoteBy: 'المتنبي',
    galleryTitle: 'سنين التعب الحلوة',
    countdown: 'باقي على حفلة التخرّج',
    countdownNote: 'الصف الأول محجوز لينا',
    eventName: 'حفلة التخرّج',
    eventPlace: 'عندنا في الجنينة',
    eventWhen: 'الجمعة · الساعة ٧',
    venueTitle: 'الطريق لينا',
    address: '٥ شارع ٩، المعادي\nالقاهرة',
    giftTitle: 'هدية تستاهلها',
    giftNote: 'للبطل اللي عمره ما استسلم',
    finale: 'فخورين بيك يا {recipient}',
    finaleBody: 'ودي لسه البداية',
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
        decoration: { effect: 'confetti', intensity: 'medium' },
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
        transitionIn: enter('zoom', 1000),
        holdMs: 4500,
        ornament: PLAIN,
        style: { imageStyle: 'ornate', headingColor: look.accent, headingSize: 'md' },
        slots: [
          photo('image', LABEL.photo, { aspect: '4:5' }),
          t('caption', LABEL.caption, c.caption, { maxLen: 50, animation: 'rise' }),
        ],
      },
      {
        id: id.lines,
        type: 'TextReveal',
        transitionIn: enter('rise'),
        holdMs: 4600,
        ornament: PLAIN,
        style: { headingColor: look.headingInk, bodyColor: look.accent, headingSize: 'md' },
        slots: [
          t('line1', LABEL.line1, c.line1, { required: true, maxLen: 60 }),
          t('line2', LABEL.line2, c.line2, { maxLen: 60 }),
          t('line3', LABEL.line3, c.line3, { maxLen: 60 }),
        ],
      },
      {
        id: id.quote,
        type: 'Quote',
        transitionIn: enter('glow', 1000),
        holdMs: 5000,
        ornament: PLAIN,
        decoration: { effect: 'sparkles', intensity: 'low', color: look.accent },
        style: { headingColor: look.accent, bodyColor: look.ink, headingSize: 'lg' },
        slots: [
          t('message', LABEL.quote, c.quote, { required: true, maxLen: 120 }),
          t('attribution', LABEL.quoteBy, c.quoteBy, { maxLen: 40 }),
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
        id: id.countdown,
        type: 'Countdown',
        transitionIn: enter('rise', 900),
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
        decoration: { effect: 'sparkles', intensity: 'low', color: look.accent, emoji: '🎓' },
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
        decoration: { effect: 'fireworks', intensity: 'high' },
        style: { headingSize: 'xl', headingColor: look.accent, bodyColor: look.ink },
        slots: [
          t('heading', LABEL.finaleHeading, c.finale, { required: true, maxLen: 44, animation: 'bounce' }),
          t('body', LABEL.finaleBody, c.finaleBody, { maxLen: 90 }),
        ],
      },
    ],
  };
}

export const graduationEn: CatalogTemplate = {
  slug: 'graduation-cap-and-gown-en',
  category: 'graduation',
  titleEn: 'Graduation — Caps in the Air',
  titleAr: 'مبروك التخرّج',
  locale: 'en',
  direction: 'ltr',
  isPaid: false,
  pricePiastres: PRICE.free,
  currency: 'EGP',
  thumbnailHint:
    'Deep navy + gold, a thrown cap and gold tassel against confetti, bold Bebas-Neue "CONGRATS, GRAD", fireworks finale.',
  thumbnailUrl:
    'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=800&q=70',
  mvp: false,
  definition: definition('en'),
};

export const graduationAr: CatalogTemplate = {
  slug: 'graduation-mabrouk-ar',
  category: 'graduation',
  titleEn: 'Graduation — Congratulations',
  titleAr: 'ألف مبروك التخرّج',
  locale: 'ar',
  direction: 'rtl',
  isPaid: true,
  pricePiastres: PRICE.standard,
  currency: 'EGP',
  thumbnailHint:
    'Deep navy + gold, a thrown graduation cap and gold tassel over confetti, bold El-Messiri "ألف مبروك", fireworks, RTL.',
  thumbnailUrl:
    'https://images.unsplash.com/photo-1590012314607-cda9d9b699ae?auto=format&fit=crop&w=800&q=70',
  mvp: false,
  definition: definition('ar'),
};
