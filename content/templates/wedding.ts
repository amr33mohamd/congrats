/**
 * WEDDING — two native templates (engine v2, art-directed).
 *
 * EN "Two Hearts" (paid): an editorial, floral wedding piece — ivory + sage +
 *     champagne gold. Cormorant Garamond serif with a Great Vibes script accent
 *     over light ivory and dark floral-image scenes; petals + glow + sparkles,
 *     graceful blurIn / rise / float / kenBurns / shimmer motion. A cover photo,
 *     the-couple reveal, a love quote, a gallery, a countdown to the day, a
 *     handwritten blessing letter, a gift, and a luminous finale.
 * AR "مبروك الزواج" (paid): native Arabic wedding congratulations — Amiri /
 *     Tajawal, RTL, the spoken "ألف مبروك / بالرفاء والبنين" warmth, same luxe
 *     ivory-and-gold floral direction.
 */
import type { CatalogTemplate } from './_helpers';
import { PRICE } from './_helpers';

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
  definition: {
    version: 1,
    locale: 'en',
    direction: 'ltr',
    theme: {
      palette: ['#FBF8F2', '#7C8A6B', '#3B4A36', '#C9A24B'],
      fontHeading: 'Cormorant Garamond',
      fontBody: 'Montserrat',
      accent: '#C9A24B',
      ornament: { kind: 'wreath', opacity: 0.5, scale: 1 },
      music: 'wedding-strings',
      textColor: '#3B4A36',
      decoration: { effect: 'petals', intensity: 'low' },
    },
    scenes: [
      {
        id: 'cover',
        type: 'Cover',
        layout: 'centered-photo',
        transitionIn: { preset: 'blurIn', durationMs: 1300, delayMs: 0 },
        holdMs: 4600,
        background: {
          type: 'gradient',
          colors: ['#FBF8F2', '#EFEADD', '#DCE0CE'],
          angle: 165,
          pattern: 'noise',
        },
        decoration: { effect: 'petals', intensity: 'medium', color: '#C9A24B' },
        style: {
          headingSize: '2xl',
          headingFont: 'Great Vibes',
          headingColor: '#3B4A36',
          bodyColor: '#7C8A6B',
          textPosition: 'center',
        },
        slots: [
          { key: 'heading', type: 'text', editable: true, required: true, maxLen: 48, defaultEn: 'Congratulations, {recipient}', animation: 'blurIn' },
          { key: 'subheading', type: 'text', editable: true, required: false, maxLen: 60, defaultEn: 'Two hearts, one beautiful story.', animation: 'rise' },
          { key: 'coverImage', type: 'image', editable: true, required: false, aspect: '3:4', min: 0, max: 1, animation: 'kenBurns' },
        ],
      },
      {
        id: 'the-couple',
        type: 'PhotoReveal',
        layout: 'full-bleed',
        transitionIn: { preset: 'kenBurns', durationMs: 1400, delayMs: 0 },
        holdMs: 5000,
        background: {
          type: 'image',
          imageUrl: 'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=1200&q=70',
          colors: ['#3B4A36', '#2A331F'],
          overlay: 'linear-gradient(180deg, rgba(43,51,31,0.30), rgba(43,51,31,0.66))',
          kenBurns: true,
        },
        decoration: { effect: 'glow', intensity: 'low', color: '#C9A24B' },
        style: { imageStyle: 'polaroid', headingColor: '#FFFFFF', bodyColor: '#FBF8F2', headingFont: 'Great Vibes' },
        slots: [
          { key: 'image', type: 'image', editable: true, required: true, aspect: '4:5', min: 1, max: 1, animation: 'float' },
          { key: 'caption', type: 'text', editable: true, required: false, maxLen: 50, defaultEn: 'Better, together', animation: 'shimmer' },
        ],
      },
      {
        id: 'vow',
        type: 'Quote',
        transitionIn: { preset: 'blurIn', durationMs: 1500, delayMs: 0 },
        holdMs: 5400,
        background: {
          type: 'radial',
          colors: ['#FFFFFF', '#F2EEE0', '#DCE0CE'],
        },
        decoration: { effect: 'sparkles', intensity: 'low', color: '#C9A24B' },
        style: {
          headingSize: 'xl',
          headingFont: 'Great Vibes',
          headingColor: '#3B4A36',
          bodyColor: '#7C8A6B',
        },
        slots: [
          { key: 'message', type: 'text', editable: true, required: true, maxLen: 180, defaultEn: 'Whatever our souls are made of, yours and mine are the same.', animation: 'blurIn' },
          { key: 'attribution', type: 'text', editable: true, required: false, maxLen: 40, defaultEn: '— and so it begins', animation: 'rise' },
        ],
      },
      {
        id: 'gallery',
        type: 'Gallery',
        layout: 'grid',
        transitionIn: { preset: 'rise', durationMs: 900, delayMs: 0 },
        holdMs: 5000,
        background: {
          type: 'image',
          imageUrl: 'https://images.unsplash.com/photo-1490818387583-1baba5e638af?auto=format&fit=crop&w=1200&q=70',
          colors: ['#7C8A6B', '#3B4A36'],
          overlay: 'linear-gradient(180deg, rgba(43,51,31,0.62), rgba(43,51,31,0.80))',
        },
        decoration: { effect: 'petals', intensity: 'low', color: '#FBF8F2' },
        style: { imageStyle: 'card', headingSize: 'md', headingColor: '#FBF8F2', bodyColor: '#FBF8F2' },
        slots: [
          { key: 'heading', type: 'text', editable: true, required: false, maxLen: 30, defaultEn: 'The two of you', animation: 'rise' },
          { key: 'gallery', type: 'image', editable: true, required: true, min: 2, max: 6, aspect: '1:1', animation: 'float' },
        ],
      },
      {
        id: 'countdown',
        type: 'Countdown',
        transitionIn: { preset: 'glow', durationMs: 1000, delayMs: 0 },
        holdMs: 4400,
        background: {
          type: 'image',
          imageUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=70',
          colors: ['#3B4A36', '#2A331F'],
          overlay: 'linear-gradient(180deg, rgba(43,51,31,0.35), rgba(43,51,31,0.72))',
          kenBurns: true,
        },
        decoration: { effect: 'glow', intensity: 'medium', color: '#C9A24B' },
        style: { headingColor: '#C9A24B', headingSize: 'lg', bodyColor: '#FBF8F2', headingFont: 'Great Vibes' },
        slots: [
          { key: 'lead', type: 'text', editable: true, required: false, maxLen: 40, defaultEn: 'Counting down to forever', animation: 'shimmer' },
          { key: 'targetDate', type: 'date', editable: true, required: false },
        ],
      },
      {
        id: 'blessing',
        type: 'Letter',
        transitionIn: { preset: 'rise', durationMs: 1200, delayMs: 0 },
        holdMs: 5400,
        background: {
          type: 'gradient',
          colors: ['#FBF8F2', '#F2EEE0'],
          angle: 160,
          pattern: 'noise',
        },
        decoration: { effect: 'petals', intensity: 'low', color: '#C9A24B' },
        style: {
          textAlign: 'start',
          headingFont: 'Great Vibes',
          headingColor: '#3B4A36',
          bodyColor: '#5A6B49',
          headingSize: 'lg',
        },
        slots: [
          { key: 'heading', type: 'text', editable: true, required: false, maxLen: 40, defaultEn: 'A little blessing', animation: 'rise' },
          { key: 'message', type: 'text', editable: true, required: true, maxLen: 180, defaultEn: 'May your life together overflow with love, laughter, and endless tiny joys.', animation: 'blurIn' },
        ],
      },
      {
        id: 'gift',
        type: 'GiftReveal',
        layout: 'centered',
        transitionIn: { preset: 'float', durationMs: 1000, delayMs: 0 },
        holdMs: 4600,
        background: {
          type: 'gradient',
          colors: ['#DCE0CE', '#7C8A6B', '#3B4A36'],
          angle: 200,
        },
        decoration: { effect: 'sparkles', intensity: 'low', color: '#C9A24B' },
        style: { headingColor: '#FBF8F2', bodyColor: '#FBF8F2', headingFont: 'Great Vibes' },
        slots: [
          { key: 'heading', type: 'text', editable: true, required: true, maxLen: 40, defaultEn: 'With love, a gift', animation: 'glow' },
          { key: 'body', type: 'text', editable: true, required: false, maxLen: 100, defaultEn: 'A small token for the start of everything.', animation: 'rise' },
          { key: 'image', type: 'image', editable: true, required: false, aspect: '1:1', min: 0, max: 1, animation: 'float' },
        ],
      },
      {
        id: 'finale',
        type: 'Finale',
        transitionIn: { preset: 'shimmer', durationMs: 1200, delayMs: 0 },
        holdMs: 6000,
        background: {
          type: 'image',
          imageUrl: 'https://images.unsplash.com/photo-1522413452208-996ff3f3e740?auto=format&fit=crop&w=1200&q=70',
          colors: ['#3B4A36', '#2A331F'],
          overlay: 'linear-gradient(180deg, rgba(43,51,31,0.42), rgba(43,51,31,0.78))',
          kenBurns: true,
        },
        decoration: { effect: 'petals', intensity: 'high', color: '#C9A24B' },
        style: { headingSize: '2xl', headingColor: '#FFFFFF', bodyColor: '#FBF8F2', headingFont: 'Great Vibes' },
        slots: [
          { key: 'heading', type: 'text', editable: true, required: true, maxLen: 48, defaultEn: 'Wishing you forever, {recipient}', animation: 'shimmer' },
          { key: 'body', type: 'text', editable: true, required: false, maxLen: 90, defaultEn: 'With all our love.', animation: 'rise' },
        ],
      },
    ],
  },
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
  definition: {
    version: 1,
    locale: 'ar',
    direction: 'rtl',
    theme: {
      palette: ['#FBF8F2', '#7C8A6B', '#3B4A36', '#C9A24B'],
      fontHeading: 'Amiri',
      fontBody: 'Tajawal',
      accent: '#C9A24B',
      ornament: { kind: 'wreath', opacity: 0.5, scale: 1 },
      music: 'wedding-strings',
      textColor: '#3B4A36',
      decoration: { effect: 'petals', intensity: 'low' },
    },
    scenes: [
      {
        id: 'cover',
        type: 'Cover',
        layout: 'centered-photo',
        transitionIn: { preset: 'blurIn', durationMs: 1300, delayMs: 0 },
        holdMs: 4600,
        background: {
          type: 'gradient',
          colors: ['#FBF8F2', '#EFEADD', '#DCE0CE'],
          angle: 165,
          pattern: 'noise',
        },
        decoration: { effect: 'petals', intensity: 'medium', color: '#C9A24B' },
        style: {
          headingSize: '2xl',
          headingColor: '#3B4A36',
          bodyColor: '#7C8A6B',
          textPosition: 'center',
        },
        slots: [
          { key: 'heading', type: 'text', editable: true, required: true, maxLen: 48, defaultAr: 'ألف مبروك يا {recipient}', animation: 'blurIn' },
          { key: 'subheading', type: 'text', editable: true, required: false, maxLen: 60, defaultAr: 'قلبين بقوا حكاية واحدة', animation: 'rise' },
          { key: 'coverImage', type: 'image', editable: true, required: false, aspect: '3:4', min: 0, max: 1, animation: 'kenBurns' },
        ],
      },
      {
        id: 'el-3roosain',
        type: 'PhotoReveal',
        layout: 'full-bleed',
        transitionIn: { preset: 'kenBurns', durationMs: 1400, delayMs: 0 },
        holdMs: 5000,
        background: {
          type: 'image',
          imageUrl: 'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=1200&q=70',
          colors: ['#3B4A36', '#2A331F'],
          overlay: 'linear-gradient(180deg, rgba(43,51,31,0.30), rgba(43,51,31,0.66))',
          kenBurns: true,
        },
        decoration: { effect: 'glow', intensity: 'low', color: '#C9A24B' },
        style: { imageStyle: 'polaroid', headingColor: '#FFFFFF', bodyColor: '#FBF8F2' },
        slots: [
          { key: 'image', type: 'image', editable: true, required: true, aspect: '4:5', min: 1, max: 1, animation: 'float' },
          { key: 'caption', type: 'text', editable: true, required: false, maxLen: 50, defaultAr: 'مع بعض أحلى', animation: 'shimmer' },
        ],
      },
      {
        id: 'doaa-quote',
        type: 'Quote',
        transitionIn: { preset: 'blurIn', durationMs: 1500, delayMs: 0 },
        holdMs: 5400,
        background: {
          type: 'radial',
          colors: ['#FFFFFF', '#F2EEE0', '#DCE0CE'],
        },
        decoration: { effect: 'sparkles', intensity: 'low', color: '#C9A24B' },
        style: {
          headingSize: 'xl',
          headingColor: '#3B4A36',
          bodyColor: '#7C8A6B',
        },
        slots: [
          { key: 'message', type: 'text', editable: true, required: true, maxLen: 180, defaultAr: 'وجعل بينكم مودّة ورحمة', animation: 'blurIn' },
          { key: 'attribution', type: 'text', editable: true, required: false, maxLen: 40, defaultAr: 'وكل الحب اللي بيكمّل العمر', animation: 'rise' },
        ],
      },
      {
        id: 'maaak-bas',
        type: 'Gallery',
        layout: 'grid',
        transitionIn: { preset: 'rise', durationMs: 900, delayMs: 0 },
        holdMs: 5000,
        background: {
          type: 'image',
          imageUrl: 'https://images.unsplash.com/photo-1490818387583-1baba5e638af?auto=format&fit=crop&w=1200&q=70',
          colors: ['#7C8A6B', '#3B4A36'],
          overlay: 'linear-gradient(180deg, rgba(43,51,31,0.62), rgba(43,51,31,0.80))',
        },
        decoration: { effect: 'petals', intensity: 'low', color: '#FBF8F2' },
        style: { imageStyle: 'card', headingSize: 'md', headingColor: '#FBF8F2', bodyColor: '#FBF8F2' },
        slots: [
          { key: 'heading', type: 'text', editable: true, required: false, maxLen: 30, defaultAr: 'إنتوا الاتنين', animation: 'rise' },
          { key: 'gallery', type: 'image', editable: true, required: true, min: 2, max: 6, aspect: '1:1', animation: 'float' },
        ],
      },
      {
        id: 'tanazol',
        type: 'Countdown',
        transitionIn: { preset: 'glow', durationMs: 1000, delayMs: 0 },
        holdMs: 4400,
        background: {
          type: 'image',
          imageUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=70',
          colors: ['#3B4A36', '#2A331F'],
          overlay: 'linear-gradient(180deg, rgba(43,51,31,0.35), rgba(43,51,31,0.72))',
          kenBurns: true,
        },
        decoration: { effect: 'glow', intensity: 'medium', color: '#C9A24B' },
        style: { headingColor: '#C9A24B', headingSize: 'lg', bodyColor: '#FBF8F2' },
        slots: [
          { key: 'lead', type: 'text', editable: true, required: false, maxLen: 40, defaultAr: 'باقي على الفرح', animation: 'shimmer' },
          { key: 'targetDate', type: 'date', editable: true, required: false },
        ],
      },
      {
        id: 'doaa',
        type: 'Letter',
        transitionIn: { preset: 'rise', durationMs: 1200, delayMs: 0 },
        holdMs: 5400,
        background: {
          type: 'gradient',
          colors: ['#FBF8F2', '#F2EEE0'],
          angle: 160,
          pattern: 'noise',
        },
        decoration: { effect: 'petals', intensity: 'low', color: '#C9A24B' },
        style: {
          textAlign: 'start',
          headingColor: '#3B4A36',
          bodyColor: '#5A6B49',
          headingSize: 'lg',
        },
        slots: [
          { key: 'heading', type: 'text', editable: true, required: false, maxLen: 40, defaultAr: 'دعوة من القلب', animation: 'rise' },
          { key: 'message', type: 'text', editable: true, required: true, maxLen: 180, defaultAr: 'ربنا يتمّم بخير ويعمر بيتكم بالحب والضحك والسعادة', animation: 'blurIn' },
        ],
      },
      {
        id: 'hadiya',
        type: 'GiftReveal',
        layout: 'centered',
        transitionIn: { preset: 'float', durationMs: 1000, delayMs: 0 },
        holdMs: 4600,
        background: {
          type: 'gradient',
          colors: ['#DCE0CE', '#7C8A6B', '#3B4A36'],
          angle: 200,
        },
        decoration: { effect: 'sparkles', intensity: 'low', color: '#C9A24B' },
        style: { headingColor: '#FBF8F2', bodyColor: '#FBF8F2' },
        slots: [
          { key: 'heading', type: 'text', editable: true, required: true, maxLen: 40, defaultAr: 'هدية من القلب', animation: 'glow' },
          { key: 'body', type: 'text', editable: true, required: false, maxLen: 100, defaultAr: 'حاجة بسيطة على بداية العمر', animation: 'rise' },
          { key: 'image', type: 'image', editable: true, required: false, aspect: '1:1', min: 0, max: 1, animation: 'float' },
        ],
      },
      {
        id: 'finale',
        type: 'Finale',
        transitionIn: { preset: 'shimmer', durationMs: 1200, delayMs: 0 },
        holdMs: 6000,
        background: {
          type: 'image',
          imageUrl: 'https://images.unsplash.com/photo-1522413452208-996ff3f3e740?auto=format&fit=crop&w=1200&q=70',
          colors: ['#3B4A36', '#2A331F'],
          overlay: 'linear-gradient(180deg, rgba(43,51,31,0.42), rgba(43,51,31,0.78))',
          kenBurns: true,
        },
        decoration: { effect: 'petals', intensity: 'high', color: '#C9A24B' },
        style: { headingSize: '2xl', headingColor: '#FFFFFF', bodyColor: '#FBF8F2' },
        slots: [
          { key: 'heading', type: 'text', editable: true, required: true, maxLen: 48, defaultAr: 'بالرفاء والبنين يا {recipient}', animation: 'shimmer' },
          { key: 'body', type: 'text', editable: true, required: false, maxLen: 90, defaultAr: 'وعمر طويل مليان فرح', animation: 'rise' },
        ],
      },
    ],
  },
};
