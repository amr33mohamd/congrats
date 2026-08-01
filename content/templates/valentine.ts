/**
 * VALENTINE — two native templates, art-directed as one swoony, modern-romantic
 * piece in crimson + rose + cream. Hearts are the signature decoration, paired
 * with glow and sparkles; rich red/pink gradients and a few rose/bokeh photo
 * scenes carry the mood. A dreamy Quote scene anchors each.
 *
 * EN "Be Mine" (free, MVP): Dancing Script over Poppins, a glowing crimson
 *     cover, a hand-typed love note, our photo, a gallery of us, a blurred-in
 *     love quote, three reasons, a wrapped gift, a heart-confetti finale.
 * AR "يا قلبي" (paid): native Arabic affection — Aref Ruqaa display over Tajawal
 *     warmth, RTL, عامية endearments (يا قلبي / يا روحي) — never a literal
 *     "Valentine" calque.
 */
import type { CatalogTemplate } from './_helpers';
import { PRICE } from './_helpers';

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
    'Crimson-to-rose glow on cream, hand-script "Be Mine", floating hearts, soft bokeh.',
  thumbnailUrl:
    'https://images.unsplash.com/photo-1518621736915-f3b1c41bfd00?auto=format&fit=crop&w=800&q=70',
  mvp: true,
  definition: {
    version: 1,
    locale: 'en',
    direction: 'ltr',
    theme: {
      palette: ['#3B0A1A', '#D11A4B', '#FFF1F2', '#F4B6C2'],
      fontHeading: 'Dancing Script',
      fontBody: 'Poppins',
      accent: '#D11A4B',
      music: 'romantic-strings',
      textColor: '#FFF1F2',
      background: { type: 'gradient', colors: ['#3B0A1A', '#8C0E36', '#D11A4B'], angle: 160 },
      decoration: { effect: 'hearts', intensity: 'low', color: '#F4B6C2' },
    },
    scenes: [
      {
        id: 'cover',
        type: 'Cover',
        layout: 'centered-photo',
        transitionIn: { preset: 'glow', durationMs: 1100, delayMs: 0 },
        holdMs: 4000,
        background: {
          type: 'radial',
          colors: ['#D11A4B', '#8C0E36', '#3B0A1A'],
          angle: 150,
        },
        decoration: { effect: 'hearts', intensity: 'high', color: '#F4B6C2' },
        style: { headingSize: '2xl', headingColor: '#FFF1F2', textPosition: 'center', textAlign: 'center' },
        slots: [
          { key: 'heading', type: 'text', editable: true, required: true, maxLen: 40, defaultEn: 'For you, {recipient} ❤', animation: 'glow' },
          { key: 'subheading', type: 'text', editable: true, required: false, maxLen: 60, defaultEn: 'A little something, straight from the heart.', animation: 'float' },
          { key: 'coverImage', type: 'image', editable: true, required: false, aspect: '1:1', min: 0, max: 1, animation: 'bounce' },
        ],
      },
      {
        id: 'love-note',
        type: 'Letter',
        transitionIn: { preset: 'rise', durationMs: 1200, delayMs: 0 },
        holdMs: 5200,
        background: {
          type: 'gradient',
          colors: ['#FFF1F2', '#FFE2E7', '#F4B6C2'],
          angle: 165,
        },
        decoration: { effect: 'sparkles', intensity: 'low', color: '#D11A4B' },
        style: { headingColor: '#8C0E36', bodyColor: '#3B0A1A', textAlign: 'start', headingFont: 'Great Vibes' },
        slots: [
          { key: 'note', type: 'text', editable: true, required: true, maxLen: 200, defaultEn: 'Every ordinary day with you turns into the best kind of day. You are my favorite hello and my hardest goodbye.', animation: 'typewriter' },
        ],
      },
      {
        id: 'our-photo',
        type: 'PhotoReveal',
        layout: 'full-bleed',
        transitionIn: { preset: 'kenBurns', durationMs: 1100, delayMs: 0 },
        holdMs: 4400,
        background: {
          type: 'image',
          colors: ['#3B0A1A', '#8C0E36'],
          imageUrl: 'https://images.unsplash.com/photo-1494774157365-9e04c6720e47?auto=format&fit=crop&w=1200&q=70',
          overlay: 'linear-gradient(180deg, rgba(59,10,26,0.35), rgba(59,10,26,0.78))',
          kenBurns: true,
        },
        decoration: { effect: 'glow', intensity: 'medium', color: '#F4B6C2' },
        style: { imageStyle: 'polaroid', headingColor: '#FFF1F2' },
        slots: [
          { key: 'image', type: 'image', editable: true, required: true, aspect: '4:5', min: 1, max: 1, animation: 'kenBurns' },
          { key: 'caption', type: 'text', editable: true, required: false, maxLen: 40, defaultEn: 'just us.', animation: 'blurIn' },
        ],
      },
      {
        id: 'moments',
        type: 'Gallery',
        layout: 'grid',
        transitionIn: { preset: 'rise', durationMs: 900, delayMs: 0 },
        holdMs: 5000,
        background: {
          type: 'image',
          colors: ['#8C0E36', '#3B0A1A'],
          imageUrl: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1200&q=70',
          overlay: 'linear-gradient(180deg, rgba(59,10,26,0.74), rgba(140,14,54,0.82))',
        },
        decoration: { effect: 'hearts', intensity: 'low', color: '#F4B6C2' },
        style: { imageStyle: 'card', headingSize: 'lg', headingColor: '#FFF1F2' },
        slots: [
          { key: 'heading', type: 'text', editable: true, required: false, maxLen: 30, defaultEn: 'A few of my favorites', animation: 'rise' },
          { key: 'gallery', type: 'image', editable: true, required: true, min: 2, max: 6, aspect: '1:1', animation: 'zoom' },
        ],
      },
      {
        id: 'love-quote',
        type: 'Quote',
        transitionIn: { preset: 'blurIn', durationMs: 1300, delayMs: 0 },
        holdMs: 5400,
        background: { type: 'radial', colors: ['#8C0E36', '#3B0A1A'] },
        decoration: { effect: 'sparkles', intensity: 'medium', color: '#F4B6C2' },
        style: { headingColor: '#FFF1F2', headingSize: 'xl', textAlign: 'center', headingFont: 'Great Vibes' },
        slots: [
          { key: 'message', type: 'text', editable: true, required: true, maxLen: 200, defaultEn: 'In all the world, there is no heart for me like yours.', animation: 'blurIn' },
          { key: 'attribution', type: 'text', editable: true, required: false, maxLen: 40, defaultEn: 'and it always will be', animation: 'shimmer' },
        ],
      },
      {
        id: 'reasons',
        type: 'TextReveal',
        transitionIn: { preset: 'slideStart', durationMs: 850, delayMs: 0 },
        holdMs: 4800,
        background: {
          type: 'gradient',
          colors: ['#D11A4B', '#8C0E36'],
          angle: 200,
          pattern: 'dots',
        },
        decoration: { effect: 'hearts', intensity: 'medium', color: '#FFF1F2' },
        style: { headingColor: '#FFF1F2', bodyColor: '#FFF1F2', textAlign: 'start' },
        slots: [
          { key: 'reason1', type: 'text', editable: true, required: true, maxLen: 50, defaultEn: 'Your laugh, the loud unguarded one.', animation: 'slideStart' },
          { key: 'reason2', type: 'text', editable: true, required: false, maxLen: 50, defaultEn: 'How kind you are when no one is watching.', animation: 'slideStart' },
          { key: 'reason3', type: 'text', editable: true, required: false, maxLen: 50, defaultEn: 'The way you say my name.', animation: 'slideStart' },
        ],
      },
      {
        id: 'gift',
        type: 'GiftReveal',
        layout: 'centered',
        transitionIn: { preset: 'glow', durationMs: 1000, delayMs: 0 },
        holdMs: 4400,
        background: { type: 'radial', colors: ['#D11A4B', '#3B0A1A'] },
        decoration: { effect: 'emoji', emoji: '💝', intensity: 'low' },
        style: { headingColor: '#FFF1F2', headingFont: 'Great Vibes' },
        slots: [
          { key: 'heading', type: 'text', editable: true, required: true, maxLen: 40, defaultEn: 'Open me', animation: 'glow' },
          { key: 'body', type: 'text', editable: true, required: false, maxLen: 100, defaultEn: 'Consider this my heart, gift-wrapped.', animation: 'float' },
          { key: 'image', type: 'image', editable: true, required: false, aspect: '1:1', min: 0, max: 1, animation: 'zoom' },
        ],
      },
      {
        id: 'finale',
        type: 'Finale',
        transitionIn: { preset: 'glow', durationMs: 1100, delayMs: 0 },
        holdMs: 5800,
        background: {
          type: 'image',
          colors: ['#8C0E36', '#3B0A1A'],
          imageUrl: 'https://images.unsplash.com/photo-1612160172153-15bcf85fa44c?auto=format&fit=crop&w=1200&q=70',
          overlay: 'linear-gradient(180deg, rgba(209,26,75,0.45), rgba(59,10,26,0.85))',
        },
        decoration: { effect: 'hearts', intensity: 'high', color: '#F4B6C2' },
        style: { headingSize: '2xl', headingColor: '#FFF1F2', textAlign: 'center' },
        slots: [
          { key: 'heading', type: 'text', editable: true, required: true, maxLen: 40, defaultEn: 'Be mine, {recipient}?', animation: 'bounce' },
          { key: 'body', type: 'text', editable: true, required: false, maxLen: 80, defaultEn: 'Always yours. ❤', animation: 'glow' },
        ],
      },
    ],
  },
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
    'Deep crimson + rose glow, Aref Ruqaa "يا قلبي", a single red rose, floating hearts, RTL.',
  thumbnailUrl:
    'https://images.unsplash.com/photo-1520763185298-1b434c919102?auto=format&fit=crop&w=800&q=70',
  mvp: false,
  definition: {
    version: 1,
    locale: 'ar',
    direction: 'rtl',
    theme: {
      palette: ['#3B0A1A', '#D11A4B', '#FFF1F2', '#F4B6C2'],
      fontHeading: 'Aref Ruqaa',
      fontBody: 'Tajawal',
      accent: '#D11A4B',
      music: 'romantic-strings',
      textColor: '#FFF1F2',
      background: { type: 'gradient', colors: ['#3B0A1A', '#8C0E36', '#D11A4B'], angle: 200 },
      decoration: { effect: 'hearts', intensity: 'low', color: '#F4B6C2' },
    },
    scenes: [
      {
        id: 'cover',
        type: 'Cover',
        layout: 'centered-photo',
        transitionIn: { preset: 'glow', durationMs: 1100, delayMs: 0 },
        holdMs: 4000,
        background: {
          type: 'radial',
          colors: ['#D11A4B', '#8C0E36', '#3B0A1A'],
          angle: 150,
        },
        decoration: { effect: 'hearts', intensity: 'high', color: '#F4B6C2' },
        style: { headingSize: '2xl', headingColor: '#FFF1F2', textPosition: 'center', textAlign: 'center' },
        slots: [
          { key: 'heading', type: 'text', editable: true, required: true, maxLen: 40, defaultAr: 'ليكِ إنتِ يا {recipient} ❤', animation: 'glow' },
          { key: 'subheading', type: 'text', editable: true, required: false, maxLen: 60, defaultAr: 'حاجة صغيّرة.. جايالك من القلب', animation: 'float' },
          { key: 'coverImage', type: 'image', editable: true, required: false, aspect: '1:1', min: 0, max: 1, animation: 'bounce' },
        ],
      },
      {
        id: 'resala',
        type: 'Letter',
        transitionIn: { preset: 'rise', durationMs: 1200, delayMs: 0 },
        holdMs: 5200,
        background: {
          type: 'gradient',
          colors: ['#FFF1F2', '#FFE2E7', '#F4B6C2'],
          angle: 195,
        },
        decoration: { effect: 'sparkles', intensity: 'low', color: '#D11A4B' },
        style: { headingColor: '#8C0E36', bodyColor: '#3B0A1A', textAlign: 'start' },
        slots: [
          { key: 'note', type: 'text', editable: true, required: true, maxLen: 200, defaultAr: 'كل يوم عادي معاكي بيبقى أحلى يوم في الدنيا.. إنتِ أحلى صباح وأصعب وداع', animation: 'typewriter' },
        ],
      },
      {
        id: 'sora',
        type: 'PhotoReveal',
        layout: 'full-bleed',
        transitionIn: { preset: 'kenBurns', durationMs: 1100, delayMs: 0 },
        holdMs: 4400,
        background: {
          type: 'image',
          colors: ['#3B0A1A', '#8C0E36'],
          imageUrl: 'https://images.unsplash.com/photo-1494774157365-9e04c6720e47?auto=format&fit=crop&w=1200&q=70',
          overlay: 'linear-gradient(180deg, rgba(59,10,26,0.35), rgba(59,10,26,0.78))',
          kenBurns: true,
        },
        decoration: { effect: 'glow', intensity: 'medium', color: '#F4B6C2' },
        style: { imageStyle: 'polaroid', headingColor: '#FFF1F2' },
        slots: [
          { key: 'image', type: 'image', editable: true, required: true, aspect: '4:5', min: 1, max: 1, animation: 'kenBurns' },
          { key: 'caption', type: 'text', editable: true, required: false, maxLen: 40, defaultAr: 'إحنا.. بس', animation: 'blurIn' },
        ],
      },
      {
        id: 'lahazat',
        type: 'Gallery',
        layout: 'grid',
        transitionIn: { preset: 'rise', durationMs: 900, delayMs: 0 },
        holdMs: 5000,
        background: {
          type: 'image',
          colors: ['#8C0E36', '#3B0A1A'],
          imageUrl: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1200&q=70',
          overlay: 'linear-gradient(180deg, rgba(59,10,26,0.74), rgba(140,14,54,0.82))',
        },
        decoration: { effect: 'hearts', intensity: 'low', color: '#F4B6C2' },
        style: { imageStyle: 'card', headingSize: 'lg', headingColor: '#FFF1F2' },
        slots: [
          { key: 'heading', type: 'text', editable: true, required: false, maxLen: 30, defaultAr: 'أحلى لحظاتنا', animation: 'rise' },
          { key: 'gallery', type: 'image', editable: true, required: true, min: 2, max: 6, aspect: '1:1', animation: 'zoom' },
        ],
      },
      {
        id: 'eqtebas',
        type: 'Quote',
        transitionIn: { preset: 'blurIn', durationMs: 1300, delayMs: 0 },
        holdMs: 5400,
        background: { type: 'radial', colors: ['#8C0E36', '#3B0A1A'] },
        decoration: { effect: 'sparkles', intensity: 'medium', color: '#F4B6C2' },
        style: { headingColor: '#FFF1F2', headingSize: 'xl', textAlign: 'center' },
        slots: [
          { key: 'message', type: 'text', editable: true, required: true, maxLen: 200, defaultAr: 'في الدنيا كلها مفيش قلب يشبه قلبك بالنسبة لي', animation: 'blurIn' },
          { key: 'attribution', type: 'text', editable: true, required: false, maxLen: 40, defaultAr: 'وهيفضل كده على طول', animation: 'shimmer' },
        ],
      },
      {
        id: 'asbab',
        type: 'TextReveal',
        transitionIn: { preset: 'slideEnd', durationMs: 850, delayMs: 0 },
        holdMs: 4800,
        background: {
          type: 'gradient',
          colors: ['#D11A4B', '#8C0E36'],
          angle: 160,
          pattern: 'dots',
        },
        decoration: { effect: 'hearts', intensity: 'medium', color: '#FFF1F2' },
        style: { headingColor: '#FFF1F2', bodyColor: '#FFF1F2', textAlign: 'start' },
        slots: [
          { key: 'reason1', type: 'text', editable: true, required: true, maxLen: 50, defaultAr: 'ضحكتك اللي من غير حساب', animation: 'slideEnd' },
          { key: 'reason2', type: 'text', editable: true, required: false, maxLen: 50, defaultAr: 'طيبتك لما محدش بيشوف', animation: 'slideEnd' },
          { key: 'reason3', type: 'text', editable: true, required: false, maxLen: 50, defaultAr: 'لمّا بتنادي على اسمي', animation: 'slideEnd' },
        ],
      },
      {
        id: 'hadiya',
        type: 'GiftReveal',
        layout: 'centered',
        transitionIn: { preset: 'glow', durationMs: 1000, delayMs: 0 },
        holdMs: 4400,
        background: { type: 'radial', colors: ['#D11A4B', '#3B0A1A'] },
        decoration: { effect: 'emoji', emoji: '💝', intensity: 'low' },
        style: { headingColor: '#FFF1F2' },
        slots: [
          { key: 'heading', type: 'text', editable: true, required: true, maxLen: 40, defaultAr: 'افتحيني', animation: 'glow' },
          { key: 'body', type: 'text', editable: true, required: false, maxLen: 100, defaultAr: 'اعتبريها قلبي.. متغلّف ومتقدّم ليكي', animation: 'float' },
          { key: 'image', type: 'image', editable: true, required: false, aspect: '1:1', min: 0, max: 1, animation: 'zoom' },
        ],
      },
      {
        id: 'finale',
        type: 'Finale',
        transitionIn: { preset: 'glow', durationMs: 1100, delayMs: 0 },
        holdMs: 5800,
        background: {
          type: 'image',
          colors: ['#8C0E36', '#3B0A1A'],
          imageUrl: 'https://images.unsplash.com/photo-1612160172153-15bcf85fa44c?auto=format&fit=crop&w=1200&q=70',
          overlay: 'linear-gradient(180deg, rgba(209,26,75,0.45), rgba(59,10,26,0.85))',
        },
        decoration: { effect: 'hearts', intensity: 'high', color: '#F4B6C2' },
        style: { headingSize: '2xl', headingColor: '#FFF1F2', textAlign: 'center' },
        slots: [
          { key: 'heading', type: 'text', editable: true, required: true, maxLen: 40, defaultAr: 'تبقي بتاعتي يا {recipient}؟', animation: 'bounce' },
          { key: 'body', type: 'text', editable: true, required: false, maxLen: 80, defaultAr: 'ليكِ على طول ❤', animation: 'glow' },
        ],
      },
    ],
  },
};
