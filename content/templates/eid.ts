/**
 * EID — one card, a serene festive night from top to bottom.
 *
 * Emerald and gold on a faint arabesque weave, a gold arch at the two ends:
 *   cover → a letter → the blessing → lanterns (photo) → the family gathering
 *   (gallery) → Eid lunch at ours → how to find us → the Eidiyya → sign-off.
 *
 * AR "بركات العيد" (paid, MVP) — Aref Ruqaa over Tajawal; spoken warmth
 *   (كل سنة وانتو طيبين) next to the classic فصحى blessing.
 * EN "Eid Mubarak" (free) — Marcellus over Poppins, for English speakers and
 *   the diaspora.
 *
 * The gathering sections are the Eid visit every family actually plans; a
 * sender who isn't hosting clears them and they drop out of the card.
 * Scene ids that existed before the one-page rewrite are kept.
 */
import type { TemplateDefinitionInput } from '@/lib/template-contract';
import type { CatalogTemplate } from './_helpers';
import { PRICE } from './_helpers';
import { LABEL, PLAIN, date, enter, frame, photo, text, theme, type Loc, type Look } from './_card';

const EMERALD: Omit<Look, 'fontHeading' | 'fontBody'> = {
  palette: ['#06281F', '#1F8A6B', '#FFFDF6', '#D4AF37'],
  ground: ['#06281F', '#0B3B2B', '#06281F'],
  accent: '#D4AF37',
  ink: '#FFFDF6',
  headingInk: '#FFFDF6',
  music: 'eid-takbir-soft',
  ornament: 'arch',
  pattern: 'damask',
  ambient: { effect: 'stars', intensity: 'low', color: '#D4AF37' },
};

const LOOK: Record<Loc, Look> = {
  en: { ...EMERALD, fontHeading: 'Marcellus', fontBody: 'Poppins' },
  ar: { ...EMERALD, fontHeading: 'Aref Ruqaa', fontBody: 'Tajawal' },
};

/**
 * Stable ids. The two languages were authored separately and their existing
 * ids differ; the EN letter is new (the AR card already had one, `doaa`).
 */
const IDS = {
  en: { letter: 'letter', photo: 'photo', gallery: 'gathering', blessingBy: 'attribution' },
  ar: { letter: 'doaa', photo: 'lanterns', gallery: 'lamma', blessingBy: 'dua' },
} as const;

const COPY = {
  en: {
    heading: 'Eid Mubarak, {recipient}',
    sub: 'May your Eid be blessed and full of light.',
    dear: 'Dear {recipient},',
    letter:
      'Eid never feels complete until I’ve said this to you: thank you for being part of my year. May this Eid bring you rest after the long days, a full table, and the people you love close by.',
    sign: 'With love and duas',
    blessing: 'May Allah accept from us and from you.',
    blessingBy: 'Taqabbal Allahu minna wa minkum',
    caption: 'Lanterns lit, together again',
    galleryTitle: 'Our Eid gathering',
    eventName: 'Eid lunch at ours',
    eventPlace: 'At the family house',
    eventWhen: 'First day of Eid · 2 PM',
    venueTitle: 'Find us',
    address: '12 El-Nasr Street, Heliopolis\nCairo',
    giftTitle: 'A little Eidiyya',
    giftNote: 'A small gift for the celebration — spend it on something that makes you smile.',
    finale: 'Eid Mubarak, {recipient}!',
    finaleBody: 'From my heart to yours — and to many more Eids together.',
  },
  ar: {
    heading: 'عيد سعيد يا {recipient}',
    sub: 'كل سنة وانتو طيبين',
    dear: 'إلى أغلى الناس،',
    letter:
      'العيد ما بيكملش غير لما أقولك الكلمتين دول: ربنا يديم عليك الفرحة ولمّة الحبايب، ويجعل أيامك كلها أعياد. وحشتني القعدة والضحك، ومستنّي نتلمّ سوا.',
    sign: 'بكل حب ودعوات',
    blessing: 'تقبّل الله منا ومنكم صالح الأعمال',
    blessingBy: 'وكل عام وأنتم إلى الله أقرب',
    caption: 'فوانيس العيد منوّرة الليلة',
    galleryTitle: 'لمّة العيد',
    eventName: 'غدا العيد عندنا',
    eventPlace: 'في بيت العيلة',
    eventWhen: 'أول يوم العيد · الساعة ٢',
    venueTitle: 'هتلاقونا هنا',
    address: '١٢ شارع النصر، مصر الجديدة\nالقاهرة',
    giftTitle: 'العيدية',
    giftNote: 'عيديتك وصلت.. اصرفها على حاجة تفرّحك',
    finale: 'عيد مبارك يا {recipient}',
    finaleBody: 'من قلبي.. وعقبال أعياد كتير مع بعض',
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
        transitionIn: enter('glow', 1200),
        holdMs: 4500,
        ornament: frame(look),
        decoration: { effect: 'glow', intensity: 'low', color: look.accent },
        style: { headingSize: 'xl', headingColor: look.accent, bodyColor: look.ink },
        slots: [
          t('heading', LABEL.coverHeading, c.heading, { required: true, maxLen: 48, animation: 'glow' }),
          t('subheading', LABEL.coverSub, c.sub, { maxLen: 60 }),
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
          t('message', LABEL.letterBody, c.letter, { maxLen: 420 }),
          t('signoff', LABEL.letterSign, c.sign, { maxLen: 40 }),
        ],
      },
      {
        id: 'blessing',
        type: 'Quote',
        transitionIn: enter('blurIn', 1200),
        holdMs: 5000,
        ornament: PLAIN,
        decoration: { effect: 'sparkles', intensity: 'low', color: look.accent },
        style: { headingColor: look.accent, bodyColor: look.ink, headingSize: 'lg' },
        slots: [
          t('heading', ['The blessing', 'الدعاء'], c.blessing, { required: true, maxLen: 90 }),
          t(id.blessingBy, ['Line under the blessing', 'سطر تحت الدعاء'], c.blessingBy, { maxLen: 100 }),
        ],
      },
      {
        id: id.photo,
        type: 'PhotoReveal',
        transitionIn: enter('rise', 1100),
        holdMs: 4500,
        ornament: PLAIN,
        style: { imageStyle: 'arch', headingColor: look.accent, headingSize: 'md' },
        slots: [
          photo('image', LABEL.photo, { aspect: '3:4' }),
          t('caption', LABEL.caption, c.caption, { maxLen: 48, animation: 'rise' }),
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
          photo('gallery', LABEL.gallery, { aspect: '1:1', max: 6 }),
        ],
      },
      {
        id: 'eid-lunch',
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
        id: 'gift',
        type: 'GiftReveal',
        transitionIn: enter('flip', 1000),
        holdMs: 4500,
        ornament: PLAIN,
        decoration: { effect: 'sparkles', intensity: 'low', color: look.accent, emoji: '🌙' },
        style: { headingColor: look.accent, bodyColor: look.ink, headingSize: 'lg', imageStyle: 'ornate' },
        slots: [
          t('heading', LABEL.giftTitle, c.giftTitle, { required: true, maxLen: 40 }),
          t('body', LABEL.giftNote, c.giftNote, { maxLen: 120 }),
          photo('image', LABEL.giftPhoto, { aspect: '1:1' }),
        ],
      },
      {
        id: 'finale',
        type: 'Finale',
        transitionIn: enter('glow', 1200),
        holdMs: 6000,
        ornament: frame(look),
        decoration: { effect: 'sparkles', intensity: 'medium', color: look.accent },
        style: { headingSize: 'xl', headingColor: look.accent, bodyColor: look.ink },
        slots: [
          t('heading', LABEL.finaleHeading, c.finale, { required: true, maxLen: 48, animation: 'glow' }),
          t('body', LABEL.finaleBody, c.finaleBody, { maxLen: 90 }),
        ],
      },
    ],
  };
}

export const eidAr: CatalogTemplate = {
  slug: 'eid-blessings-ar',
  category: 'eid',
  titleEn: 'Eid Blessings',
  titleAr: 'بركات العيد',
  locale: 'ar',
  direction: 'rtl',
  isPaid: true,
  pricePiastres: PRICE.standard,
  currency: 'EGP',
  thumbnailHint:
    'Emerald-green night with gold crescent + hanging fanous lanterns, Aref Ruqaa "عيد مبارك", arabesque glow, RTL.',
  thumbnailUrl:
    'https://images.unsplash.com/photo-1577214407836-1f3a0604ecb2?auto=format&fit=crop&w=800&q=70',
  mvp: true,
  definition: definition('ar'),
};

export const eidEn: CatalogTemplate = {
  slug: 'eid-mubarak-en',
  category: 'eid',
  titleEn: 'Eid Mubarak',
  titleAr: 'عيد مبارك',
  locale: 'en',
  direction: 'ltr',
  isPaid: false,
  pricePiastres: PRICE.free,
  currency: 'EGP',
  thumbnailHint:
    'Deep emerald night with a gold crescent moon and lantern silhouettes, Marcellus "Eid Mubarak", soft glow.',
  thumbnailUrl:
    'https://images.unsplash.com/photo-1590092794015-bce5431c83f4?auto=format&fit=crop&w=800&q=70',
  mvp: false,
  definition: definition('en'),
};
