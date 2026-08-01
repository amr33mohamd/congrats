/**
 * GRADUATION — two native templates.
 *
 * EN "Caps in the Air" (free): triumphant deep-navy + gold, a bold modern
 *     8-scene achievement arc — a Bebas-Neue cover, the-grad PhotoReveal on a
 *     stage shot, a "the tassel was worth the hassle" Quote, a TextReveal
 *     journey, a gallery of years, a countdown to the ceremony, a gift, and a
 *     fireworks + confetti finale. Caps thrown skyward.
 * AR "ألف مبروك التخرّج" (paid): native Arabic pride — El Messiri / Tajawal,
 *     RTL, the spoken "ألف مبروك" warmth, bold and dignified with the same
 *     navy + gold triumph, confetti, sparkles, and a fireworks finale.
 */
import type { CatalogTemplate } from './_helpers';
import { PRICE } from './_helpers';

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
    'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=800&q=70',
  mvp: false,
  definition: {
    version: 1,
    locale: 'en',
    direction: 'ltr',
    theme: {
      palette: ['#0B1B2B', '#11294A', '#FFFFFF', '#E3B341'],
      fontHeading: 'Bebas Neue',
      fontBody: 'Montserrat',
      accent: '#E3B341',
      music: 'triumphant-soft',
      textColor: '#FFFFFF',
      background: { type: 'gradient', colors: ['#0B1B2B', '#11294A'], angle: 160 },
      decoration: { effect: 'sparkles', intensity: 'low', color: '#E3B341' },
    },
    scenes: [
      {
        id: 'cover',
        type: 'Cover',
        layout: 'centered-photo',
        transitionIn: { preset: 'rise', durationMs: 1000, delayMs: 0 },
        holdMs: 4000,
        background: {
          type: 'gradient',
          colors: ['#0B1B2B', '#11294A', '#1E3A8A'],
          angle: 150,
          pattern: 'confettiDots',
        },
        decoration: { effect: 'confetti', intensity: 'high', color: '#E3B341' },
        style: { headingSize: '2xl', headingColor: '#E3B341', textPosition: 'center', textAlign: 'center' },
        slots: [
          { key: 'heading', type: 'text', editable: true, required: true, maxLen: 44, defaultEn: 'CONGRATULATIONS, {recipient}!', animation: 'bounce' },
          { key: 'subheading', type: 'text', editable: true, required: false, maxLen: 50, defaultEn: 'Caps in the air — you actually did it.' },
          { key: 'coverImage', type: 'image', editable: true, required: false, aspect: '3:4', min: 0, max: 1, animation: 'rise' },
        ],
      },
      {
        id: 'the-grad',
        type: 'PhotoReveal',
        layout: 'full-bleed',
        transitionIn: { preset: 'parallax', durationMs: 950, delayMs: 0 },
        holdMs: 4500,
        background: {
          type: 'image',
          colors: ['#0B1B2B', '#11294A'],
          imageUrl: 'https://images.unsplash.com/photo-1627556704302-624286467c65?auto=format&fit=crop&w=1200&q=70',
          overlay: 'linear-gradient(180deg, rgba(11,27,43,0.45), rgba(11,27,43,0.82))',
          kenBurns: true,
        },
        decoration: { effect: 'sparkles', intensity: 'medium', color: '#E3B341' },
        style: { imageStyle: 'tilt', headingColor: '#E3B341', headingSize: 'lg' },
        slots: [
          { key: 'image', type: 'image', editable: true, required: true, aspect: '3:4', min: 1, max: 1, animation: 'parallax' },
          { key: 'caption', type: 'text', editable: true, required: false, maxLen: 50, defaultEn: 'Cap, gown, and a whole future', animation: 'rise' },
        ],
      },
      {
        id: 'tassel',
        type: 'Quote',
        transitionIn: { preset: 'glow', durationMs: 1100, delayMs: 0 },
        holdMs: 4800,
        background: { type: 'radial', colors: ['#11294A', '#0B1B2B'] },
        decoration: { effect: 'sparkles', intensity: 'high', color: '#E3B341' },
        style: { headingColor: '#FFFFFF', headingSize: 'xl', textAlign: 'center' },
        slots: [
          { key: 'message', type: 'text', editable: true, required: true, maxLen: 120, defaultEn: 'The tassel was worth the hassle.', animation: 'glow' },
          { key: 'attribution', type: 'text', editable: true, required: false, maxLen: 40, defaultEn: 'Class of forever' },
        ],
      },
      {
        id: 'journey',
        type: 'TextReveal',
        transitionIn: { preset: 'rise', durationMs: 850, delayMs: 0 },
        holdMs: 4800,
        background: { type: 'gradient', colors: ['#0B1B2B', '#11294A'], angle: 175 },
        decoration: { effect: 'glow', intensity: 'low', color: '#E3B341' },
        style: { headingColor: '#FFFFFF', headingSize: 'lg', textAlign: 'center' },
        slots: [
          { key: 'line1', type: 'text', editable: true, required: true, maxLen: 60, defaultEn: 'Every late night finally paid off.', animation: 'rise' },
          { key: 'line2', type: 'text', editable: true, required: false, maxLen: 60, defaultEn: 'Every exam, every deadline — behind you now.' },
          { key: 'line3', type: 'text', editable: true, required: false, maxLen: 60, defaultEn: 'And the whole world is ahead.' },
        ],
      },
      {
        id: 'years',
        type: 'Gallery',
        layout: 'grid',
        transitionIn: { preset: 'shimmer', durationMs: 900, delayMs: 0 },
        holdMs: 5000,
        background: {
          type: 'image',
          colors: ['#0B1B2B', '#11294A'],
          imageUrl: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=1200&q=70',
          overlay: 'linear-gradient(180deg, rgba(11,27,43,0.78), rgba(11,27,43,0.9))',
        },
        decoration: { effect: 'sparkles', intensity: 'low', color: '#E3B341' },
        style: { imageStyle: 'card', headingSize: 'md', headingColor: '#E3B341' },
        slots: [
          { key: 'heading', type: 'text', editable: true, required: false, maxLen: 30, defaultEn: 'The years it took' },
          { key: 'gallery', type: 'image', editable: true, required: true, min: 2, max: 6, aspect: '1:1', animation: 'shimmer' },
        ],
      },
      {
        id: 'ceremony',
        type: 'Countdown',
        transitionIn: { preset: 'zoom', durationMs: 850, delayMs: 0 },
        holdMs: 4000,
        background: {
          type: 'image',
          colors: ['#11294A', '#0B1B2B'],
          imageUrl: 'https://images.unsplash.com/photo-1592280771190-3e2e4d571952?auto=format&fit=crop&w=1200&q=70',
          overlay: 'linear-gradient(180deg, rgba(11,27,43,0.5), rgba(11,27,43,0.85))',
          kenBurns: true,
        },
        decoration: { effect: 'glow', intensity: 'low', color: '#E3B341' },
        style: { headingColor: '#E3B341', headingSize: 'lg', textAlign: 'center' },
        slots: [
          { key: 'lead', type: 'text', editable: true, required: false, maxLen: 40, defaultEn: 'Counting down to the big day', animation: 'fade' },
          { key: 'targetDate', type: 'date', editable: true, required: false },
        ],
      },
      {
        id: 'gift',
        type: 'GiftReveal',
        layout: 'centered',
        transitionIn: { preset: 'glow', durationMs: 950, delayMs: 0 },
        holdMs: 4400,
        background: { type: 'gradient', colors: ['#11294A', '#1E3A8A'], angle: 200 },
        decoration: { effect: 'emoji', emoji: '🎓', intensity: 'low' },
        style: { headingColor: '#E3B341', headingSize: 'lg', textAlign: 'center' },
        slots: [
          { key: 'heading', type: 'text', editable: true, required: true, maxLen: 40, defaultEn: 'A gift, well earned', animation: 'glow' },
          { key: 'body', type: 'text', editable: true, required: false, maxLen: 100, defaultEn: 'For the grad who never stopped showing up.' },
          { key: 'image', type: 'image', editable: true, required: false, aspect: '1:1', min: 0, max: 1, animation: 'zoom' },
        ],
      },
      {
        id: 'finale',
        type: 'Finale',
        transitionIn: { preset: 'glow', durationMs: 1000, delayMs: 0 },
        holdMs: 5500,
        background: {
          type: 'gradient',
          colors: ['#0B1B2B', '#11294A', '#1E3A8A'],
          angle: 160,
          pattern: 'confettiDots',
        },
        decoration: { effect: 'fireworks', intensity: 'high', color: '#E3B341' },
        style: { headingSize: '2xl', headingColor: '#E3B341', textAlign: 'center' },
        slots: [
          { key: 'heading', type: 'text', editable: true, required: true, maxLen: 44, defaultEn: 'SO PROUD OF YOU, {recipient}!', animation: 'bounce' },
          { key: 'body', type: 'text', editable: true, required: false, maxLen: 90, defaultEn: 'This is only the beginning.' },
        ],
      },
    ],
  },
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
    'https://images.unsplash.com/photo-1564981797816-1043664bf78d?auto=format&fit=crop&w=800&q=70',
  mvp: false,
  definition: {
    version: 1,
    locale: 'ar',
    direction: 'rtl',
    theme: {
      palette: ['#0B1B2B', '#11294A', '#FFFFFF', '#E3B341'],
      fontHeading: 'El Messiri',
      fontBody: 'Tajawal',
      accent: '#E3B341',
      music: 'triumphant-soft',
      textColor: '#FFFFFF',
      background: { type: 'gradient', colors: ['#0B1B2B', '#11294A'], angle: 160 },
      decoration: { effect: 'sparkles', intensity: 'low', color: '#E3B341' },
    },
    scenes: [
      {
        id: 'cover',
        type: 'Cover',
        layout: 'centered-photo',
        transitionIn: { preset: 'rise', durationMs: 1000, delayMs: 0 },
        holdMs: 4000,
        background: {
          type: 'gradient',
          colors: ['#0B1B2B', '#11294A', '#1E3A8A'],
          angle: 150,
          pattern: 'confettiDots',
        },
        decoration: { effect: 'confetti', intensity: 'high', color: '#E3B341' },
        style: { headingSize: '2xl', headingColor: '#E3B341', textPosition: 'center', textAlign: 'center' },
        slots: [
          { key: 'heading', type: 'text', editable: true, required: true, maxLen: 44, defaultAr: 'ألف مبروك يا {recipient}', animation: 'bounce' },
          { key: 'subheading', type: 'text', editable: true, required: false, maxLen: 50, defaultAr: 'تعب السنين أهو جاب نتيجته' },
          { key: 'coverImage', type: 'image', editable: true, required: false, aspect: '3:4', min: 0, max: 1, animation: 'rise' },
        ],
      },
      {
        id: 'el-khreeg',
        type: 'PhotoReveal',
        layout: 'full-bleed',
        transitionIn: { preset: 'parallax', durationMs: 950, delayMs: 0 },
        holdMs: 4500,
        background: {
          type: 'image',
          colors: ['#0B1B2B', '#11294A'],
          imageUrl: 'https://images.unsplash.com/photo-1627556704302-624286467c65?auto=format&fit=crop&w=1200&q=70',
          overlay: 'linear-gradient(180deg, rgba(11,27,43,0.45), rgba(11,27,43,0.82))',
          kenBurns: true,
        },
        decoration: { effect: 'sparkles', intensity: 'medium', color: '#E3B341' },
        style: { imageStyle: 'tilt', headingColor: '#E3B341', headingSize: 'lg' },
        slots: [
          { key: 'image', type: 'image', editable: true, required: true, aspect: '3:4', min: 1, max: 1, animation: 'parallax' },
          { key: 'caption', type: 'text', editable: true, required: false, maxLen: 50, defaultAr: 'الكاب والروب وبكرة كله قدّامك', animation: 'rise' },
        ],
      },
      {
        id: 'el-rehla',
        type: 'TextReveal',
        transitionIn: { preset: 'rise', durationMs: 850, delayMs: 0 },
        holdMs: 4800,
        background: { type: 'gradient', colors: ['#0B1B2B', '#11294A'], angle: 175 },
        decoration: { effect: 'glow', intensity: 'low', color: '#E3B341' },
        style: { headingColor: '#FFFFFF', headingSize: 'lg', textAlign: 'center' },
        slots: [
          { key: 'line1', type: 'text', editable: true, required: true, maxLen: 60, defaultAr: 'السهر كله جاب تمنه', animation: 'rise' },
          { key: 'line2', type: 'text', editable: true, required: false, maxLen: 60, defaultAr: 'كل امتحان وكل تسليم.. بقى وراك' },
          { key: 'line3', type: 'text', editable: true, required: false, maxLen: 60, defaultAr: 'والدنيا كلها قدّامك' },
        ],
      },
      {
        id: 'el-seneen',
        type: 'Gallery',
        layout: 'grid',
        transitionIn: { preset: 'shimmer', durationMs: 900, delayMs: 0 },
        holdMs: 5000,
        background: {
          type: 'image',
          colors: ['#0B1B2B', '#11294A'],
          imageUrl: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=1200&q=70',
          overlay: 'linear-gradient(180deg, rgba(11,27,43,0.78), rgba(11,27,43,0.9))',
        },
        decoration: { effect: 'sparkles', intensity: 'low', color: '#E3B341' },
        style: { imageStyle: 'card', headingSize: 'md', headingColor: '#E3B341' },
        slots: [
          { key: 'heading', type: 'text', editable: true, required: false, maxLen: 30, defaultAr: 'سنين التعب الحلوة' },
          { key: 'gallery', type: 'image', editable: true, required: true, min: 2, max: 6, aspect: '1:1', animation: 'shimmer' },
        ],
      },
      {
        id: 'el-haflaa',
        type: 'Countdown',
        transitionIn: { preset: 'zoom', durationMs: 850, delayMs: 0 },
        holdMs: 4000,
        background: {
          type: 'image',
          colors: ['#11294A', '#0B1B2B'],
          imageUrl: 'https://images.unsplash.com/photo-1592280771190-3e2e4d571952?auto=format&fit=crop&w=1200&q=70',
          overlay: 'linear-gradient(180deg, rgba(11,27,43,0.5), rgba(11,27,43,0.85))',
          kenBurns: true,
        },
        decoration: { effect: 'glow', intensity: 'low', color: '#E3B341' },
        style: { headingColor: '#E3B341', headingSize: 'lg', textAlign: 'center' },
        slots: [
          { key: 'lead', type: 'text', editable: true, required: false, maxLen: 40, defaultAr: 'باقي على يوم التخرّج', animation: 'fade' },
          { key: 'targetDate', type: 'date', editable: true, required: false },
        ],
      },
      {
        id: 'hadiya',
        type: 'GiftReveal',
        layout: 'centered',
        transitionIn: { preset: 'glow', durationMs: 950, delayMs: 0 },
        holdMs: 4400,
        background: { type: 'gradient', colors: ['#11294A', '#1E3A8A'], angle: 200 },
        decoration: { effect: 'emoji', emoji: '🎓', intensity: 'low' },
        style: { headingColor: '#E3B341', headingSize: 'lg', textAlign: 'center' },
        slots: [
          { key: 'heading', type: 'text', editable: true, required: true, maxLen: 40, defaultAr: 'هدية تستاهلها', animation: 'glow' },
          { key: 'body', type: 'text', editable: true, required: false, maxLen: 100, defaultAr: 'للخريج اللي ماستسلمش أبداً' },
          { key: 'image', type: 'image', editable: true, required: false, aspect: '1:1', min: 0, max: 1, animation: 'zoom' },
        ],
      },
      {
        id: 'finale',
        type: 'Finale',
        transitionIn: { preset: 'glow', durationMs: 1000, delayMs: 0 },
        holdMs: 5500,
        background: {
          type: 'gradient',
          colors: ['#0B1B2B', '#11294A', '#1E3A8A'],
          angle: 160,
          pattern: 'confettiDots',
        },
        decoration: { effect: 'fireworks', intensity: 'high', color: '#E3B341' },
        style: { headingSize: '2xl', headingColor: '#E3B341', textAlign: 'center' },
        slots: [
          { key: 'heading', type: 'text', editable: true, required: true, maxLen: 44, defaultAr: 'فخورين بيك يا {recipient}', animation: 'bounce' },
          { key: 'body', type: 'text', editable: true, required: false, maxLen: 90, defaultAr: 'وده بس البداية' },
        ],
      },
    ],
  },
};
