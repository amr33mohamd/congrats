/**
 * ANNIVERSARY — two native templates.
 *
 * EN "Our Story" (free, MVP): timeless, editorial romance in deep wine + blush +
 *     antique gold, lit like candlelight. A cinematic 9-scene arc — Cover →
 *     first-meeting PhotoReveal → a romantic Quote → milestones TextReveal →
 *     memories Gallery → a handwritten Letter → a countdown → a keepsake
 *     GiftReveal → a soft glowing Finale. Playfair Display + Cormorant Garamond,
 *     petals & gentle glow, kenBurns on the photos. No confetti, no bounce.
 * AR "ذكرى حبّنا" (paid): native Arabic romance (NOT a translation) — Amiri
 *     display headings, Tajawal body, RTL slide directions, idiomatic عامية
 *     warmth on the same art-directed wine-and-gold arc.
 */
import type { CatalogTemplate } from './_helpers';
import { PRICE } from './_helpers';

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
    'Deep wine card lit like candlelight, a sunset couple silhouette, antique-gold Playfair "Our Story", drifting petals.',
  thumbnailUrl:
    'https://images.unsplash.com/photo-1518621736915-f3b1c41bfd00?auto=format&fit=crop&w=800&q=70',
  mvp: true,
  definition: {
    version: 1,
    locale: 'en',
    direction: 'ltr',
    theme: {
      palette: ['#2A0E1B', '#7A1E3A', '#FBF7F4', '#C68B59'],
      fontHeading: 'Playfair Display',
      fontBody: 'Cormorant Garamond',
      accent: '#C68B59',
      music: 'soft-piano',
      textColor: '#FBF7F4',
      background: { type: 'gradient', colors: ['#2A0E1B', '#5A1730'], angle: 160 },
      decoration: { effect: 'glow', intensity: 'low', color: '#C68B59' },
    },
    scenes: [
      {
        id: 'cover',
        type: 'Cover',
        layout: 'centered-photo',
        transitionIn: { preset: 'blurIn', durationMs: 1200, delayMs: 0 },
        holdMs: 4000,
        background: {
          type: 'image',
          imageUrl:
            'https://images.unsplash.com/photo-1518621736915-f3b1c41bfd00?auto=format&fit=crop&w=1200&q=70',
          colors: ['#2A0E1B', '#7A1E3A', '#C68B59'],
          angle: 160,
          overlay:
            'linear-gradient(180deg, rgba(42,14,27,0.55), rgba(42,14,27,0.82))',
          kenBurns: true,
        },
        decoration: { effect: 'glow', intensity: 'low', color: '#C68B59' },
        style: {
          headingSize: '2xl',
          headingColor: '#FBF7F4',
          bodyColor: '#FBF7F4',
          textPosition: 'center',
          textAlign: 'center',
        },
        slots: [
          { key: 'heading', type: 'text', editable: true, required: true, maxLen: 48, defaultEn: 'Happy Anniversary, {recipient}', animation: 'rise' },
          { key: 'subheading', type: 'text', editable: true, required: false, maxLen: 60, defaultEn: 'One more year of us — and so many more to come.', animation: 'blurIn' },
          { key: 'coverImage', type: 'image', editable: true, required: false, aspect: '3:4', min: 0, max: 1, animation: 'kenBurns' },
        ],
      },
      {
        id: 'the-day-we-met',
        type: 'PhotoReveal',
        layout: 'full-bleed',
        transitionIn: { preset: 'kenBurns', durationMs: 1200, delayMs: 0 },
        transitionOut: { preset: 'fade', durationMs: 600, delayMs: 0 },
        holdMs: 4600,
        background: {
          type: 'image',
          imageUrl:
            'https://images.unsplash.com/photo-1494774157365-9e04c6720e47?auto=format&fit=crop&w=1200&q=70',
          colors: ['#2A0E1B', '#7A1E3A'],
          angle: 165,
          overlay:
            'linear-gradient(180deg, rgba(42,14,27,0.35), rgba(42,14,27,0.78))',
          kenBurns: true,
        },
        decoration: { effect: 'petals', intensity: 'low' },
        style: { imageStyle: 'polaroid', headingColor: '#C68B59', textAlign: 'center' },
        slots: [
          { key: 'image', type: 'image', editable: true, required: true, aspect: '4:3', min: 1, max: 1, animation: 'kenBurns' },
          { key: 'caption', type: 'text', editable: true, required: false, maxLen: 48, defaultEn: 'The day everything began.', animation: 'rise' },
        ],
      },
      {
        id: 'vow',
        type: 'Quote',
        transitionIn: { preset: 'blurIn', durationMs: 1300, delayMs: 0 },
        holdMs: 5000,
        background: { type: 'radial', colors: ['#7A1E3A', '#2A0E1B'] },
        decoration: { effect: 'sparkles', intensity: 'low', color: '#C68B59' },
        style: { headingColor: '#FBF7F4', headingSize: 'xl', textAlign: 'center', headingFont: 'Cormorant Garamond' },
        slots: [
          { key: 'message', type: 'text', editable: true, required: true, maxLen: 180, defaultEn: 'In all the world, there is no heart for me like yours.', animation: 'blurIn' },
          { key: 'attribution', type: 'text', editable: true, required: false, maxLen: 40, defaultEn: '— and it always will be', animation: 'fade' },
        ],
      },
      {
        id: 'milestones',
        type: 'TextReveal',
        transitionIn: { preset: 'rise', durationMs: 900, delayMs: 0 },
        holdMs: 4600,
        background: { type: 'gradient', colors: ['#2A0E1B', '#7A1E3A'], angle: 200, pattern: 'noise' },
        decoration: { effect: 'glow', intensity: 'low', color: '#C68B59' },
        style: { headingColor: '#FBF7F4', textAlign: 'center', headingSize: 'lg' },
        slots: [
          { key: 'line1', type: 'text', editable: true, required: true, maxLen: 60, defaultEn: 'Our first trip, the wrong turns and all.', animation: 'rise' },
          { key: 'line2', type: 'text', editable: true, required: false, maxLen: 60, defaultEn: 'The tiny apartment that felt like everything.', animation: 'rise' },
          { key: 'line3', type: 'text', editable: true, required: false, maxLen: 60, defaultEn: 'Every quiet morning since.', animation: 'rise' },
        ],
      },
      {
        id: 'gallery',
        type: 'Gallery',
        layout: 'grid',
        transitionIn: { preset: 'rise', durationMs: 850, delayMs: 0 },
        holdMs: 5200,
        background: {
          type: 'image',
          imageUrl:
            'https://images.unsplash.com/photo-1457089328109-e5d9bd499191?auto=format&fit=crop&w=1200&q=70',
          colors: ['#2A0E1B', '#5A1730'],
          overlay:
            'linear-gradient(180deg, rgba(42,14,27,0.74), rgba(42,14,27,0.88))',
        },
        decoration: { effect: 'petals', intensity: 'low' },
        style: { imageStyle: 'card', headingSize: 'md', headingColor: '#C68B59', textAlign: 'center' },
        slots: [
          { key: 'heading', type: 'text', editable: true, required: false, maxLen: 30, defaultEn: 'Our favorite moments', animation: 'blurIn' },
          { key: 'gallery', type: 'image', editable: true, required: true, min: 2, max: 6, aspect: '1:1', animation: 'float' },
        ],
      },
      {
        id: 'letter',
        type: 'Letter',
        transitionIn: { preset: 'rise', durationMs: 1000, delayMs: 0 },
        holdMs: 5600,
        background: { type: 'gradient', colors: ['#3A1322', '#2A0E1B'], angle: 175 },
        decoration: { effect: 'glow', intensity: 'low', color: '#C68B59' },
        style: { headingColor: '#7A1E3A', bodyColor: '#5A1730', textAlign: 'start', headingFont: 'Playfair Display' },
        slots: [
          { key: 'heading', type: 'text', editable: true, required: true, maxLen: 40, defaultEn: 'My love,', animation: 'fade' },
          { key: 'body', type: 'text', editable: true, required: false, maxLen: 320, defaultEn: 'A whole year, and you still surprise me. Thank you for the small ordinary days — the coffees, the late talks, the way you reach for my hand without looking. I would choose this life, and you, again and again.', animation: 'rise' },
        ],
      },
      {
        id: 'countdown',
        type: 'Countdown',
        transitionIn: { preset: 'blurIn', durationMs: 900, delayMs: 0 },
        holdMs: 4200,
        background: {
          type: 'image',
          imageUrl:
            'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=1200&q=70',
          colors: ['#2A0E1B', '#7A1E3A'],
          overlay:
            'linear-gradient(180deg, rgba(42,14,27,0.4), rgba(42,14,27,0.8))',
          kenBurns: true,
        },
        decoration: { effect: 'sparkles', intensity: 'low', color: '#C68B59' },
        style: { headingColor: '#C68B59', headingSize: 'lg', textAlign: 'center' },
        slots: [
          { key: 'lead', type: 'text', editable: true, required: false, maxLen: 44, defaultEn: 'Counting down to our next chapter', animation: 'fade' },
          { key: 'targetDate', type: 'date', editable: true, required: false },
        ],
      },
      {
        id: 'keepsake',
        type: 'GiftReveal',
        layout: 'centered',
        transitionIn: { preset: 'glow', durationMs: 1000, delayMs: 0 },
        holdMs: 4600,
        background: { type: 'radial', colors: ['#7A1E3A', '#2A0E1B'] },
        decoration: { effect: 'glow', intensity: 'medium', color: '#C68B59' },
        style: { headingColor: '#FBF7F4', textAlign: 'center', imageStyle: 'rounded' },
        slots: [
          { key: 'heading', type: 'text', editable: true, required: true, maxLen: 40, defaultEn: 'A little something for you', animation: 'glow' },
          { key: 'body', type: 'text', editable: true, required: false, maxLen: 110, defaultEn: 'Open it slowly — it took a whole year to mean this much.', animation: 'fade' },
          { key: 'image', type: 'image', editable: true, required: false, aspect: '1:1', min: 0, max: 1, animation: 'float' },
        ],
      },
      {
        id: 'finale',
        type: 'Finale',
        transitionIn: { preset: 'blurIn', durationMs: 1100, delayMs: 0 },
        holdMs: 6000,
        background: {
          type: 'image',
          imageUrl:
            'https://images.unsplash.com/photo-1496861083958-175bb1bd5702?auto=format&fit=crop&w=1200&q=70',
          colors: ['#2A0E1B', '#7A1E3A', '#C68B59'],
          overlay:
            'linear-gradient(180deg, rgba(122,30,58,0.45), rgba(42,14,27,0.82))',
          kenBurns: true,
        },
        decoration: { effect: 'petals', intensity: 'medium' },
        style: { headingSize: '2xl', headingColor: '#FBF7F4', textAlign: 'center' },
        slots: [
          { key: 'heading', type: 'text', editable: true, required: true, maxLen: 48, defaultEn: "Here's to forever, {recipient}", animation: 'rise' },
          { key: 'body', type: 'text', editable: true, required: false, maxLen: 120, defaultEn: 'I love you — today, and every single year after.', animation: 'blurIn' },
        ],
      },
    ],
  },
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
    'Deep wine + antique-gold arabesque mood, a candle-lit couple, Amiri heading "ذكرى حبّنا", drifting petals, RTL.',
  thumbnailUrl:
    'https://images.unsplash.com/photo-1529634806980-85c3dd6d34ac?auto=format&fit=crop&w=800&q=70',
  mvp: false,
  definition: {
    version: 1,
    locale: 'ar',
    direction: 'rtl',
    theme: {
      palette: ['#2A0E1B', '#7A1E3A', '#FBF7F4', '#C68B59'],
      fontHeading: 'Amiri',
      fontBody: 'Tajawal',
      accent: '#C68B59',
      music: 'oud-romantic',
      textColor: '#FBF7F4',
      background: { type: 'gradient', colors: ['#2A0E1B', '#5A1730'], angle: 200 },
      decoration: { effect: 'glow', intensity: 'low', color: '#C68B59' },
    },
    scenes: [
      {
        id: 'cover',
        type: 'Cover',
        layout: 'centered-photo',
        transitionIn: { preset: 'blurIn', durationMs: 1200, delayMs: 0 },
        holdMs: 4000,
        background: {
          type: 'image',
          imageUrl:
            'https://images.unsplash.com/photo-1529634806980-85c3dd6d34ac?auto=format&fit=crop&w=1200&q=70',
          colors: ['#2A0E1B', '#7A1E3A', '#C68B59'],
          angle: 200,
          overlay:
            'linear-gradient(180deg, rgba(42,14,27,0.55), rgba(42,14,27,0.82))',
          kenBurns: true,
        },
        decoration: { effect: 'glow', intensity: 'low', color: '#C68B59' },
        style: {
          headingSize: '2xl',
          headingColor: '#FBF7F4',
          bodyColor: '#FBF7F4',
          textPosition: 'center',
          textAlign: 'center',
        },
        slots: [
          { key: 'heading', type: 'text', editable: true, required: true, maxLen: 48, defaultAr: 'كل سنة وإحنا مع بعض يا {recipient}', animation: 'rise' },
          { key: 'subheading', type: 'text', editable: true, required: false, maxLen: 60, defaultAr: 'سنة عدّت.. وعمر كامل لسه جاي', animation: 'blurIn' },
          { key: 'coverImage', type: 'image', editable: true, required: false, aspect: '3:4', min: 0, max: 1, animation: 'kenBurns' },
        ],
      },
      {
        id: 'awwel-youm',
        type: 'PhotoReveal',
        layout: 'full-bleed',
        transitionIn: { preset: 'kenBurns', durationMs: 1200, delayMs: 0 },
        transitionOut: { preset: 'fade', durationMs: 600, delayMs: 0 },
        holdMs: 4600,
        background: {
          type: 'image',
          imageUrl:
            'https://images.unsplash.com/photo-1494774157365-9e04c6720e47?auto=format&fit=crop&w=1200&q=70',
          colors: ['#2A0E1B', '#7A1E3A'],
          angle: 165,
          overlay:
            'linear-gradient(180deg, rgba(42,14,27,0.35), rgba(42,14,27,0.78))',
          kenBurns: true,
        },
        decoration: { effect: 'petals', intensity: 'low' },
        style: { imageStyle: 'polaroid', headingColor: '#C68B59', textAlign: 'center' },
        slots: [
          { key: 'image', type: 'image', editable: true, required: true, aspect: '4:3', min: 1, max: 1, animation: 'kenBurns' },
          { key: 'caption', type: 'text', editable: true, required: false, maxLen: 48, defaultAr: 'أول يوم بدأت فيه الحكاية', animation: 'rise' },
        ],
      },
      {
        id: 'kelma',
        type: 'Quote',
        transitionIn: { preset: 'blurIn', durationMs: 1300, delayMs: 0 },
        holdMs: 5000,
        background: { type: 'radial', colors: ['#7A1E3A', '#2A0E1B'] },
        decoration: { effect: 'sparkles', intensity: 'low', color: '#C68B59' },
        style: { headingColor: '#FBF7F4', headingSize: 'xl', textAlign: 'center', headingFont: 'Amiri' },
        slots: [
          { key: 'message', type: 'text', editable: true, required: true, maxLen: 180, defaultAr: 'في الدنيا كلها مفيش قلب يشبه قلبك بالنسبه لي', animation: 'blurIn' },
          { key: 'attribution', type: 'text', editable: true, required: false, maxLen: 40, defaultAr: '.. وهيفضل كده على طول', animation: 'fade' },
        ],
      },
      {
        id: 'hekayetna',
        type: 'TextReveal',
        transitionIn: { preset: 'rise', durationMs: 900, delayMs: 0 },
        holdMs: 4600,
        background: { type: 'gradient', colors: ['#2A0E1B', '#7A1E3A'], angle: 160, pattern: 'noise' },
        decoration: { effect: 'glow', intensity: 'low', color: '#C68B59' },
        style: { headingColor: '#FBF7F4', textAlign: 'center', headingSize: 'lg' },
        slots: [
          { key: 'line1', type: 'text', editable: true, required: true, maxLen: 60, defaultAr: 'أول سفرية لينا.. بكل لخبطتها', animation: 'rise' },
          { key: 'line2', type: 'text', editable: true, required: false, maxLen: 60, defaultAr: 'أول بيت صغير حسّينا إنه الدنيا كلها', animation: 'rise' },
          { key: 'line3', type: 'text', editable: true, required: false, maxLen: 60, defaultAr: 'وكل صباح هادي من يومها', animation: 'rise' },
        ],
      },
      {
        id: 'zekrayat',
        type: 'Gallery',
        layout: 'grid',
        transitionIn: { preset: 'rise', durationMs: 850, delayMs: 0 },
        holdMs: 5200,
        background: {
          type: 'image',
          imageUrl:
            'https://images.unsplash.com/photo-1457089328109-e5d9bd499191?auto=format&fit=crop&w=1200&q=70',
          colors: ['#2A0E1B', '#5A1730'],
          overlay:
            'linear-gradient(180deg, rgba(42,14,27,0.74), rgba(42,14,27,0.88))',
        },
        decoration: { effect: 'petals', intensity: 'low' },
        style: { imageStyle: 'card', headingSize: 'md', headingColor: '#C68B59', textAlign: 'center' },
        slots: [
          { key: 'heading', type: 'text', editable: true, required: false, maxLen: 30, defaultAr: 'أحلى لحظاتنا', animation: 'blurIn' },
          { key: 'gallery', type: 'image', editable: true, required: true, min: 2, max: 6, aspect: '1:1', animation: 'float' },
        ],
      },
      {
        id: 'gawab',
        type: 'Letter',
        transitionIn: { preset: 'rise', durationMs: 1000, delayMs: 0 },
        holdMs: 5600,
        background: { type: 'gradient', colors: ['#3A1322', '#2A0E1B'], angle: 185 },
        decoration: { effect: 'glow', intensity: 'low', color: '#C68B59' },
        style: { headingColor: '#7A1E3A', bodyColor: '#5A1730', textAlign: 'start', headingFont: 'Amiri' },
        slots: [
          { key: 'heading', type: 'text', editable: true, required: true, maxLen: 40, defaultAr: 'يا حبيبي،', animation: 'fade' },
          { key: 'body', type: 'text', editable: true, required: false, maxLen: 320, defaultAr: 'سنة كاملة ولسه بتفاجئني. شكراً على الأيام العادية الصغيّرة.. القهوة، الكلام بالليل، وإنك بتمسك إيدي من غير ما تبص. لو الدنيا رجعت تاني، كنت هختارك إنت.. وهختار العمر ده كله، مرة ومرة وألف مرة.', animation: 'rise' },
        ],
      },
      {
        id: 'tanazol',
        type: 'Countdown',
        transitionIn: { preset: 'blurIn', durationMs: 900, delayMs: 0 },
        holdMs: 4200,
        background: {
          type: 'image',
          imageUrl:
            'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=1200&q=70',
          colors: ['#2A0E1B', '#7A1E3A'],
          overlay:
            'linear-gradient(180deg, rgba(42,14,27,0.4), rgba(42,14,27,0.8))',
          kenBurns: true,
        },
        decoration: { effect: 'sparkles', intensity: 'low', color: '#C68B59' },
        style: { headingColor: '#C68B59', headingSize: 'lg', textAlign: 'center' },
        slots: [
          { key: 'lead', type: 'text', editable: true, required: false, maxLen: 44, defaultAr: 'باقي على فصلنا الجديد', animation: 'fade' },
          { key: 'targetDate', type: 'date', editable: true, required: false },
        ],
      },
      {
        id: 'hadiya',
        type: 'GiftReveal',
        layout: 'centered',
        transitionIn: { preset: 'glow', durationMs: 1000, delayMs: 0 },
        holdMs: 4600,
        background: { type: 'radial', colors: ['#7A1E3A', '#2A0E1B'] },
        decoration: { effect: 'glow', intensity: 'medium', color: '#C68B59' },
        style: { headingColor: '#FBF7F4', textAlign: 'center', imageStyle: 'rounded' },
        slots: [
          { key: 'heading', type: 'text', editable: true, required: true, maxLen: 40, defaultAr: 'حاجة صغيّرة ليكي', animation: 'glow' },
          { key: 'body', type: 'text', editable: true, required: false, maxLen: 110, defaultAr: 'افتحيها على مهلك.. سنة كاملة خلّتها بالمعنى ده', animation: 'fade' },
          { key: 'image', type: 'image', editable: true, required: false, aspect: '1:1', min: 0, max: 1, animation: 'float' },
        ],
      },
      {
        id: 'finale',
        type: 'Finale',
        transitionIn: { preset: 'blurIn', durationMs: 1100, delayMs: 0 },
        holdMs: 6000,
        background: {
          type: 'image',
          imageUrl:
            'https://images.unsplash.com/photo-1496861083958-175bb1bd5702?auto=format&fit=crop&w=1200&q=70',
          colors: ['#2A0E1B', '#7A1E3A', '#C68B59'],
          overlay:
            'linear-gradient(180deg, rgba(122,30,58,0.45), rgba(42,14,27,0.82))',
          kenBurns: true,
        },
        decoration: { effect: 'petals', intensity: 'medium' },
        style: { headingSize: '2xl', headingColor: '#FBF7F4', textAlign: 'center' },
        slots: [
          { key: 'heading', type: 'text', editable: true, required: true, maxLen: 48, defaultAr: 'لعمرٍ كامل معاكي يا {recipient}', animation: 'rise' },
          { key: 'body', type: 'text', editable: true, required: false, maxLen: 120, defaultAr: 'بحبك.. النهارده وكل سنة جاية', animation: 'blurIn' },
        ],
      },
    ],
  },
};
