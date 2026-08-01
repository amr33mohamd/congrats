/**
 * BIRTHDAY — two native templates.
 *
 * EN "Make a Wish" (free, MVP): bright confetti palette, playful 7-scene party —
 *     cover with a photo, a star-of-the-day PhotoReveal, a memories Gallery,
 *     a wish message, a candle countdown, a gift, confetti finale.
 * AR "كل سنة وإنت طيب" (free): native Arabic birthday — the actual phrase
 *     Egyptians say, Cairo/Tajawal, festive, RTL. Warm spoken greeting, not a
 *     "عيد ميلاد سعيد" calque.
 */
import type { CatalogTemplate } from './_helpers';
import { PRICE } from './_helpers';

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
  definition: {
    version: 1,
    locale: 'en',
    direction: 'ltr',
    theme: {
      palette: ['#2E1065', '#7C3AED', '#FFFFFF', '#FBBF24'],
      fontHeading: 'Fredoka',
      fontBody: 'Poppins',
      accent: '#FBBF24',
      music: 'happy-birthday-uplift',
      textColor: '#FFFFFF',
    },
    scenes: [
      {
        id: 'cover',
        type: 'Cover',
        layout: 'centered-photo',
        transitionIn: { preset: 'bounce', durationMs: 900 },
        holdMs: 3800,
        background: {
          type: 'gradient',
          colors: ['#7C3AED', '#DB2777', '#FBBF24'],
          angle: 155,
          pattern: 'confettiDots',
        },
        decoration: { effect: 'balloons', intensity: 'medium' },
        style: { headingSize: '2xl', headingColor: '#FFFFFF', textPosition: 'center' },
        slots: [
          { key: 'heading', type: 'text', editable: true, required: true, maxLen: 40, defaultEn: 'Happy Birthday, {recipient}!', animation: 'bounce' },
          { key: 'subheading', type: 'text', editable: true, required: false, maxLen: 50, defaultEn: 'Today, the whole world is about you.' },
          { key: 'coverImage', type: 'image', editable: true, required: false, aspect: '1:1', min: 0, max: 1, animation: 'zoom' },
        ],
      },
      {
        id: 'star',
        type: 'PhotoReveal',
        layout: 'full-bleed',
        transitionIn: { preset: 'parallax', durationMs: 900 },
        holdMs: 4200,
        background: { type: 'gradient', colors: ['#1E1B4B', '#4C1D95'], angle: 165 },
        decoration: { effect: 'sparkles', intensity: 'low' },
        style: { imageStyle: 'polaroid', headingColor: '#FBBF24' },
        slots: [
          { key: 'image', type: 'image', editable: true, required: true, aspect: '4:5', min: 1, max: 1, animation: 'parallax' },
          { key: 'caption', type: 'text', editable: true, required: false, maxLen: 40, defaultEn: 'The star of the day ⭐', animation: 'slideStart' },
        ],
      },
      {
        id: 'memories',
        type: 'Gallery',
        layout: 'grid',
        transitionIn: { preset: 'rise', durationMs: 800 },
        holdMs: 5000,
        background: {
          type: 'image',
          imageUrl: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=70',
          overlay: 'linear-gradient(180deg, rgba(46,16,101,0.72), rgba(46,16,101,0.86))',
        },
        style: { imageStyle: 'card', headingSize: 'md' },
        slots: [
          { key: 'heading', type: 'text', editable: true, required: false, maxLen: 30, defaultEn: 'Good times, on repeat' },
          { key: 'gallery', type: 'image', editable: true, required: true, min: 2, max: 6, aspect: '1:1', animation: 'zoom' },
        ],
      },
      {
        id: 'wish-message',
        type: 'Quote',
        transitionIn: { preset: 'blurIn', durationMs: 1200 },
        holdMs: 5200,
        background: { type: 'radial', colors: ['#4C1D95', '#1E1B4B'] },
        decoration: { effect: 'sparkles', intensity: 'medium', color: '#FBBF24' },
        style: { headingColor: '#FFFFFF', headingSize: 'xl' },
        slots: [
          { key: 'message', type: 'text', editable: true, required: true, maxLen: 200, defaultEn: 'Wishing you a year stuffed with laughter, plot twists, and everything you love.', animation: 'blurIn' },
          { key: 'attribution', type: 'text', editable: true, required: false, maxLen: 40, defaultEn: 'with all my heart' },
        ],
      },
      {
        id: 'countdown',
        type: 'Countdown',
        transitionIn: { preset: 'zoom', durationMs: 800 },
        holdMs: 3800,
        background: {
          type: 'image',
          imageUrl: 'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?auto=format&fit=crop&w=1200&q=70',
          overlay: 'linear-gradient(180deg, rgba(0,0,0,0.35), rgba(46,16,101,0.7))',
          kenBurns: true,
        },
        style: { headingColor: '#FBBF24', headingSize: 'lg' },
        slots: [
          { key: 'lead', type: 'text', editable: true, required: false, maxLen: 40, defaultEn: 'Blow out the candles in…', animation: 'fade' },
          { key: 'targetDate', type: 'date', editable: true, required: false },
        ],
      },
      {
        id: 'gift',
        type: 'GiftReveal',
        layout: 'centered',
        transitionIn: { preset: 'glow', durationMs: 950 },
        holdMs: 4400,
        background: { type: 'gradient', colors: ['#DB2777', '#7C3AED'], angle: 200 },
        decoration: { effect: 'emoji', emoji: '🎁', intensity: 'low' },
        style: { headingColor: '#FFFFFF' },
        slots: [
          { key: 'heading', type: 'text', editable: true, required: true, maxLen: 40, defaultEn: 'Something for you', animation: 'glow' },
          { key: 'body', type: 'text', editable: true, required: false, maxLen: 100, defaultEn: 'Unwrap it — you earned every bit of it.' },
          { key: 'image', type: 'image', editable: true, required: false, aspect: '1:1', min: 0, max: 1, animation: 'zoom' },
        ],
      },
      {
        id: 'finale',
        type: 'Finale',
        transitionIn: { preset: 'glow', durationMs: 1000 },
        holdMs: 6000,
        background: {
          type: 'image',
          imageUrl: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=1200&q=70',
          overlay: 'linear-gradient(180deg, rgba(124,58,237,0.55), rgba(46,16,101,0.8))',
        },
        decoration: { effect: 'confetti', intensity: 'high' },
        style: { headingSize: '2xl', headingColor: '#FFFFFF' },
        slots: [
          { key: 'heading', type: 'text', editable: true, required: true, maxLen: 40, defaultEn: 'Make a wish, {recipient}!', animation: 'glow' },
          { key: 'body', type: 'text', editable: true, required: false, maxLen: 80, defaultEn: 'Here’s to your best year yet!' },
        ],
      },
    ],
  },
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
  definition: {
    version: 1,
    locale: 'ar',
    direction: 'rtl',
    theme: {
      palette: ['#063D3A', '#0F766E', '#FFFFFF', '#F59E0B'],
      fontHeading: 'Lalezar',
      fontBody: 'Tajawal',
      accent: '#F59E0B',
      music: 'happy-birthday-uplift',
      textColor: '#FFFFFF',
    },
    scenes: [
      {
        id: 'cover',
        type: 'Cover',
        layout: 'centered-photo',
        transitionIn: { preset: 'bounce', durationMs: 950, delayMs: 0 },
        holdMs: 3700,
        background: {
          type: 'gradient',
          colors: ['#0F766E', '#063D3A', '#F59E0B'],
          angle: 200,
          pattern: 'confettiDots',
        },
        decoration: { effect: 'balloons', intensity: 'medium' },
        style: { headingSize: '2xl', headingColor: '#FFFFFF', headingFont: 'Lalezar', textPosition: 'center' },
        slots: [
          { key: 'heading', type: 'text', editable: true, required: true, maxLen: 40, defaultAr: 'كل سنة وإنت طيّب يا {recipient}', animation: 'bounce' },
          { key: 'subheading', type: 'text', editable: true, required: false, maxLen: 50, defaultAr: 'النهارده الدنيا كلها ليك إنت' },
          { key: 'coverImage', type: 'image', editable: true, required: false, aspect: '1:1', min: 0, max: 1, animation: 'zoom' },
        ],
      },
      {
        id: 'negm',
        type: 'PhotoReveal',
        layout: 'full-bleed',
        transitionIn: { preset: 'rise', durationMs: 900, delayMs: 0 },
        holdMs: 4200,
        background: {
          type: 'image',
          imageUrl: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=1200&q=70',
          colors: ['#063D3A', '#0F766E'],
          overlay: 'linear-gradient(180deg, rgba(6,61,58,0.55), rgba(6,61,58,0.82))',
        },
        decoration: { effect: 'sparkles', intensity: 'low', color: '#F59E0B' },
        style: { imageStyle: 'polaroid', headingColor: '#F59E0B', headingFont: 'Cairo' },
        slots: [
          { key: 'image', type: 'image', editable: true, required: true, aspect: '4:5', min: 1, max: 1, animation: 'parallax' },
          { key: 'caption', type: 'text', editable: true, required: false, maxLen: 40, defaultAr: 'نجم اليوم ⭐', animation: 'slideEnd' },
        ],
      },
      {
        id: 'zekrayat',
        type: 'Gallery',
        layout: 'grid',
        transitionIn: { preset: 'rise', durationMs: 800, delayMs: 0 },
        holdMs: 5000,
        background: {
          type: 'image',
          imageUrl: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=70',
          colors: ['#063D3A', '#0F766E'],
          overlay: 'linear-gradient(180deg, rgba(6,61,58,0.74), rgba(15,118,110,0.86))',
        },
        decoration: { effect: 'balloons', intensity: 'low' },
        style: { imageStyle: 'card', headingSize: 'md', headingColor: '#FFFFFF' },
        slots: [
          { key: 'heading', type: 'text', editable: true, required: false, maxLen: 30, defaultAr: 'أحلى لحظات مع بعض' },
          { key: 'gallery', type: 'image', editable: true, required: true, min: 2, max: 6, aspect: '1:1', animation: 'zoom' },
        ],
      },
      {
        id: 'omneya',
        type: 'Quote',
        transitionIn: { preset: 'blurIn', durationMs: 1200, delayMs: 0 },
        holdMs: 5200,
        background: { type: 'radial', colors: ['#0F766E', '#063D3A'], pattern: 'dots' },
        decoration: { effect: 'sparkles', intensity: 'medium', color: '#F59E0B' },
        style: { headingColor: '#FFFFFF', headingSize: 'xl', headingFont: 'Cairo' },
        slots: [
          { key: 'message', type: 'text', editable: true, required: true, maxLen: 200, defaultAr: 'أتمنالك سنة مليانة ضحك وفرحة وكل اللي بتحبه وأكتر', animation: 'blurIn' },
          { key: 'attribution', type: 'text', editable: true, required: false, maxLen: 40, defaultAr: 'من كل قلبي' },
        ],
      },
      {
        id: 'tanazol',
        type: 'Countdown',
        transitionIn: { preset: 'glow', durationMs: 800, delayMs: 0 },
        holdMs: 3800,
        background: {
          type: 'image',
          imageUrl: 'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?auto=format&fit=crop&w=1200&q=70',
          colors: ['#063D3A', '#0F766E'],
          overlay: 'linear-gradient(180deg, rgba(6,61,58,0.45), rgba(6,61,58,0.78))',
          kenBurns: true,
        },
        decoration: { effect: 'sparkles', intensity: 'low', color: '#F59E0B' },
        style: { headingColor: '#F59E0B', headingSize: 'lg' },
        slots: [
          { key: 'lead', type: 'text', editable: true, required: false, maxLen: 40, defaultAr: 'نطفّي الشمع كمان..', animation: 'fade' },
          { key: 'targetDate', type: 'date', editable: true, required: false },
        ],
      },
      {
        id: 'hadiya',
        type: 'GiftReveal',
        layout: 'centered',
        transitionIn: { preset: 'glow', durationMs: 950, delayMs: 0 },
        holdMs: 4400,
        background: { type: 'gradient', colors: ['#F59E0B', '#0F766E'], angle: 210 },
        decoration: { effect: 'emoji', emoji: '🎁', intensity: 'low' },
        style: { headingColor: '#FFFFFF', headingFont: 'Lalezar' },
        slots: [
          { key: 'heading', type: 'text', editable: true, required: true, maxLen: 40, defaultAr: 'حاجة ليك إنت', animation: 'glow' },
          { key: 'body', type: 'text', editable: true, required: false, maxLen: 100, defaultAr: 'افتحها.. إنت تستاهل كل خير في الدنيا' },
          { key: 'image', type: 'image', editable: true, required: false, aspect: '1:1', min: 0, max: 1, animation: 'zoom' },
        ],
      },
      {
        id: 'finale',
        type: 'Finale',
        transitionIn: { preset: 'glow', durationMs: 1000, delayMs: 0 },
        holdMs: 6000,
        background: {
          type: 'image',
          imageUrl: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=1200&q=70',
          colors: ['#0F766E', '#063D3A'],
          overlay: 'linear-gradient(180deg, rgba(15,118,110,0.55), rgba(6,61,58,0.82))',
        },
        decoration: { effect: 'confetti', intensity: 'high', color: '#F59E0B' },
        style: { headingSize: '2xl', headingColor: '#FFFFFF', headingFont: 'Lalezar' },
        slots: [
          { key: 'heading', type: 'text', editable: true, required: true, maxLen: 40, defaultAr: 'اتمنى أمنية يا {recipient}!', animation: 'glow' },
          { key: 'body', type: 'text', editable: true, required: false, maxLen: 80, defaultAr: 'وكل سنة وإنت بألف خير وصحة وسعادة' },
        ],
      },
    ],
  },
};
