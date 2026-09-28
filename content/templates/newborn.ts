/**
 * NEWBORN — one soft card welcoming the baby home.
 *
 * Cream paper with mint and peach, floral corners at the two ends, DARK ink
 * throughout (pastel type on a pastel ground is unreadable):
 *   cover → a note to the little one → the baby (photo) → the birth details →
 *   first moments (gallery) → a blessing → come meet the baby (the Sebou') →
 *   where → a keepsake → sign-off.
 *
 * EN "Welcome Little One" (free) — Quicksand over Nunito.
 * AR "مبروك المولود" (free) — Harmattan over Tajawal; the Sebou' (السبوع)
 *   with its candles and sieve is the Egyptian welcome party.
 *
 * The accent is a deeper terracotta than the palette's peach so ornaments,
 * section titles and buttons actually read on cream. `{recipient}` is the
 * baby. Scene ids that existed before the one-page rewrite are kept; `sebou`
 * and `venue` are new.
 */
import type { TemplateDefinitionInput } from '@/lib/template-contract';
import type { CatalogTemplate } from './_helpers';
import { PRICE } from './_helpers';
import { LABEL, PLAIN, date, enter, frame, photo, text, theme, type Loc, type Look } from './_card';

const LOOK: Record<Loc, Look> = {
  en: {
    palette: ['#FFF6F0', '#9DC7C0', '#3A4A49', '#F4C7B5'],
    ground: ['#FFF6F0', '#FBEDE4', '#EAF4F1'],
    accent: '#B8735A',
    ink: '#3A4A49',
    headingInk: '#3A4A49',
    fontHeading: 'Quicksand',
    fontBody: 'Nunito',
    music: 'lullaby-soft',
    ornament: 'corners',
    angle: 180,
    ambient: { effect: 'bubbles', intensity: 'low', color: '#9DC7C0' },
  },
  ar: {
    palette: ['#FFF7EF', '#8FB9A8', '#3A4A49', '#E7B59B'],
    ground: ['#FFF7EF', '#F8ECE1', '#E8F2EC'],
    accent: '#A86E55',
    ink: '#3A4A49',
    headingInk: '#3A4A49',
    fontHeading: 'Harmattan',
    fontBody: 'Tajawal',
    music: 'lullaby-soft',
    ornament: 'corners',
    angle: 180,
    ambient: { effect: 'bubbles', intensity: 'low', color: '#8FB9A8' },
  },
};

const IDS = {
  en: { letter: 'letter', photo: 'the-baby', details: 'details', gallery: 'tiny-toes', quote: 'blessing', gift: 'keepsake' },
  ar: { letter: 'gawab', photo: 'el-baby', details: 'tafaseel', gallery: 'koraat', quote: 'doaa', gift: 'hadiya' },
} as const;

const COPY = {
  en: {
    heading: 'Welcome to the world, {recipient}',
    sub: 'A tiny miracle has arrived.',
    dear: 'A note for you, little one',
    letter:
      'We waited so long for you, and now that you’re here the whole house feels brighter. We promise to keep you safe, to read you stories until you fall asleep, and to love you a little more every single day.',
    sign: 'Your family',
    caption: 'Hello, little one',
    name: 'Name: {recipient}',
    weight: 'Weight: 3.4 kg',
    galleryTitle: 'First little moments',
    blessing: 'May your days be soft, your nights be gentle, and your life be long and full.',
    blessingBy: 'with all our love',
    eventName: 'Come meet the baby',
    eventPlace: 'A small welcome party at home',
    eventWhen: 'Friday · 5 PM',
    venueTitle: 'Where to find us',
    address: 'Fifth Settlement, New Cairo',
    giftTitle: 'A little something',
    giftNote: 'For the newest, most loved arrival.',
    finale: 'Welcome, {recipient}',
    finaleBody: 'So loved already.',
  },
  ar: {
    heading: 'أهلاً بيك في الدنيا يا {recipient}',
    sub: 'وصلت أحلى هدية',
    dear: 'كلمتين لأحلى مولود',
    letter:
      'استنيناك كتير، ودلوقتي وإنت معانا البيت كله نوّر. وعدناك نحافظ عليك، ونحكيلك حواديت لحد ما تنام، ونحبك أكتر كل يوم. نوّرت الدنيا يا حبيبنا.',
    sign: 'عيلتك',
    caption: 'يا أهلاً بالصغير',
    name: 'الاسم: {recipient}',
    weight: 'الوزن: ٣٫٤ كيلو',
    galleryTitle: 'أول لحظات صغيّرة',
    blessing: 'ربنا يجعله من مواليد السعادة ويتربّى في عزّكم',
    blessingBy: 'بكل الحب',
    eventName: 'السبوع',
    eventPlace: 'في البيت.. بالشموع والغربال',
    eventWhen: 'الجمعة · الساعة ٥',
    venueTitle: 'هتلاقونا هنا',
    address: 'التجمع الخامس، القاهرة الجديدة',
    giftTitle: 'حاجة صغيّرة',
    giftNote: 'لأجدد وأحلى واحد في العيلة',
    finale: 'ربنا يخليه ويباركلكم فيه',
    finaleBody: 'حبيبنا من قبل ما يوصل',
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
        transitionIn: enter('float', 1200),
        holdMs: 4500,
        ornament: frame(look, 0.7),
        style: { headingSize: 'xl', headingColor: look.headingInk, bodyColor: look.accent, imageStyle: 'circle' },
        slots: [
          t('heading', LABEL.coverHeading, c.heading, { required: true, maxLen: 44, animation: 'blurIn' }),
          t('subheading', LABEL.coverSub, c.sub, { maxLen: 50, animation: 'fade' }),
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
        transitionIn: enter('float', 1100),
        holdMs: 4500,
        ornament: PLAIN,
        style: { imageStyle: 'arch', headingColor: look.headingInk, headingSize: 'md' },
        slots: [
          photo('image', LABEL.photo, { aspect: '3:4' }),
          t('caption', LABEL.caption, c.caption, { maxLen: 50, animation: 'rise' }),
        ],
      },
      {
        id: id.details,
        type: 'TextReveal',
        transitionIn: enter('rise'),
        holdMs: 4500,
        ornament: PLAIN,
        style: { headingColor: look.headingInk, bodyColor: look.accent, headingSize: 'md' },
        slots: [
          t('name', ['Baby’s name', 'اسم المولود'], c.name, { maxLen: 40 }),
          t('weight', ['Weight', 'الوزن'], c.weight, { maxLen: 40 }),
          date('date', ['Date of birth', 'تاريخ الميلاد']),
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
        decoration: { effect: 'stars', intensity: 'low', color: look.accent },
        style: { headingColor: look.headingInk, bodyColor: look.accent, headingSize: 'lg' },
        slots: [
          t('message', ['The blessing', 'الدعاء'], c.blessing, { maxLen: 140 }),
          t('attribution', LABEL.quoteBy, c.blessingBy, { maxLen: 40 }),
        ],
      },
      {
        id: 'sebou',
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
        transitionIn: enter('float', 1000),
        holdMs: 4500,
        ornament: PLAIN,
        decoration: { effect: 'bubbles', intensity: 'low', color: look.palette[1], emoji: '🧸' },
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
        transitionIn: enter('blurIn', 1200),
        holdMs: 6000,
        ornament: frame(look, 0.7),
        decoration: { effect: 'stars', intensity: 'medium', color: look.accent },
        style: { headingSize: 'xl', headingColor: look.headingInk, bodyColor: look.accent },
        slots: [
          t('heading', LABEL.finaleHeading, c.finale, { required: true, maxLen: 44, animation: 'blurIn' }),
          t('body', LABEL.finaleBody, c.finaleBody, { maxLen: 90 }),
        ],
      },
    ],
  };
}

export const newbornEn: CatalogTemplate = {
  slug: 'newborn-welcome-little-one-en',
  category: 'newborn',
  titleEn: 'Newborn — Welcome Little One',
  titleAr: 'أهلاً بالصغير',
  locale: 'en',
  direction: 'ltr',
  isPaid: false,
  pricePiastres: PRICE.free,
  currency: 'EGP',
  thumbnailHint:
    'Soft mint + peach pastel, tiny footprints, rounded script "Welcome, Little One", cloud + star.',
  thumbnailUrl:
    'https://images.unsplash.com/photo-1511948374796-056e8f289f34?auto=format&fit=crop&w=800&q=70',
  mvp: false,
  definition: definition('en'),
};

export const newbornAr: CatalogTemplate = {
  slug: 'newborn-mabrouk-elmawloud-ar',
  category: 'newborn',
  titleEn: 'Newborn — Congratulations',
  titleAr: 'مبروك المولود',
  locale: 'ar',
  direction: 'rtl',
  isPaid: false,
  pricePiastres: PRICE.free,
  currency: 'EGP',
  thumbnailHint:
    'Soft cream + sage pastel, crescent + tiny star, Harmattan "مبروك المولود", little footprints, RTL.',
  thumbnailUrl:
    'https://images.unsplash.com/photo-1544126592-807ade215a0b?auto=format&fit=crop&w=800&q=70',
  mvp: false,
  definition: definition('ar'),
};
