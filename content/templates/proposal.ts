/**
 * PROPOSAL — two native templates.
 *
 * EN "Will You Marry Me" (paid, MVP): a cinematic night-sky proposal — midnight
 *     navy + champagne gold + ivory. Stars and sparkles drift over deep radial
 *     skies, a starry-sky PhotoReveal and city-lights gallery set the scene, a
 *     ring GiftReveal glows, the big question lands as a stylized Quote, and the
 *     whole thing closes on a fireworks Finale. Cormorant Garamond + Montserrat,
 *     slow cinematic holds, heavy kenBurns / blurIn / glow / float.
 * AR "اتجوزيني" (paid): same breath-holding night-sky drama, fully native —
 *     Reem Kufi display, Tajawal body, RTL, warm عامية ("تتجوزيني؟") that lands
 *     like a real spoken proposal under the stars.
 */
import type { CatalogTemplate } from './_helpers';
import { PRICE } from './_helpers';

export const proposalEn: CatalogTemplate = {
  slug: 'proposal-marry-me-en',
  category: 'proposal',
  titleEn: 'Proposal — Will You Marry Me?',
  titleAr: 'هل تتزوجينني؟',
  locale: 'en',
  direction: 'ltr',
  isPaid: true,
  pricePiastres: PRICE.premium,
  currency: 'EGP',
  thumbnailHint:
    'Midnight-navy night sky, champagne-gold serif, a glowing ring box mid-open, starfield with sparkles.',
  thumbnailUrl:
    'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?auto=format&fit=crop&w=800&q=70',
  mvp: true,
  definition: {
    version: 1,
    locale: 'en',
    direction: 'ltr',
    theme: {
      palette: ['#0E1A33', '#E7C36B', '#F6F1E7', '#243A66'],
      fontHeading: 'Cormorant Garamond',
      fontBody: 'Montserrat',
      accent: '#E7C36B',
      music: 'cinematic-swell',
      textColor: '#F6F1E7',
      background: { type: 'radial', colors: ['#243A66', '#0E1A33'] },
      decoration: { effect: 'stars', intensity: 'medium' },
    },
    scenes: [
      {
        id: 'cover',
        type: 'Cover',
        layout: 'centered',
        transitionIn: { preset: 'blurIn', durationMs: 1400, delayMs: 0 },
        holdMs: 4800,
        background: {
          type: 'radial',
          colors: ['#243A66', '#0E1A33'],
          pattern: 'noise',
        },
        decoration: { effect: 'stars', intensity: 'high' },
        style: {
          headingSize: '2xl',
          headingColor: '#F6F1E7',
          textPosition: 'center',
          textAlign: 'center',
        },
        slots: [
          { key: 'heading', type: 'text', editable: true, required: true, maxLen: 52, defaultEn: '{recipient}, there’s something I need to say', animation: 'blurIn' },
          { key: 'subheading', type: 'text', editable: true, required: false, maxLen: 60, defaultEn: 'Just look up with me for a moment.' },
        ],
      },
      {
        id: 'journey',
        type: 'PhotoReveal',
        layout: 'full-bleed',
        transitionIn: { preset: 'kenBurns', durationMs: 1600, delayMs: 0 },
        holdMs: 5200,
        background: {
          type: 'image',
          colors: ['#0E1A33', '#243A66'],
          imageUrl: 'https://images.unsplash.com/photo-1444703686981-a3abbc4d4fe3?auto=format&fit=crop&w=1200&q=70',
          overlay: 'linear-gradient(180deg, rgba(14,26,51,0.45), rgba(14,26,51,0.82))',
          kenBurns: true,
        },
        decoration: { effect: 'sparkles', intensity: 'low', color: '#E7C36B' },
        style: { imageStyle: 'full', headingColor: '#E7C36B' },
        slots: [
          { key: 'image', type: 'image', editable: true, required: true, aspect: '4:5', min: 1, max: 1, animation: 'kenBurns' },
          { key: 'caption', type: 'text', editable: true, required: false, maxLen: 60, defaultEn: 'From the very first night, I knew.', animation: 'blurIn' },
        ],
      },
      {
        id: 'us',
        type: 'Gallery',
        layout: 'grid',
        transitionIn: { preset: 'rise', durationMs: 1000, delayMs: 0 },
        holdMs: 5000,
        background: {
          type: 'image',
          colors: ['#0E1A33', '#243A66'],
          imageUrl: 'https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=1200&q=70',
          overlay: 'linear-gradient(180deg, rgba(14,26,51,0.78), rgba(14,26,51,0.9))',
          kenBurns: true,
        },
        decoration: { effect: 'glow', intensity: 'low', color: '#E7C36B' },
        style: { imageStyle: 'card', headingSize: 'lg', headingColor: '#F6F1E7' },
        slots: [
          { key: 'heading', type: 'text', editable: true, required: false, maxLen: 30, defaultEn: 'Every chapter, us', animation: 'float' },
          { key: 'gallery', type: 'image', editable: true, required: true, min: 2, max: 6, aspect: '1:1', animation: 'float' },
        ],
      },
      {
        id: 'truth',
        type: 'Letter',
        transitionIn: { preset: 'blurIn', durationMs: 1500, delayMs: 0 },
        holdMs: 5400,
        background: {
          type: 'radial',
          colors: ['#243A66', '#0E1A33'],
        },
        decoration: { effect: 'sparkles', intensity: 'medium', color: '#E7C36B' },
        style: {
          headingFont: 'Marcellus',
          headingColor: '#E7C36B',
          bodyColor: '#F6F1E7',
          headingSize: 'lg',
          textAlign: 'center',
        },
        slots: [
          { key: 'heading', type: 'text', editable: true, required: false, maxLen: 40, defaultEn: 'My whole heart', animation: 'glow' },
          { key: 'message', type: 'text', editable: true, required: true, maxLen: 180, defaultEn: 'I’ve pictured every ordinary tomorrow — quiet mornings, long drives, growing old — and you’re in every single one of them.', animation: 'blurIn' },
        ],
      },
      {
        id: 'countdown',
        type: 'Countdown',
        transitionIn: { preset: 'glow', durationMs: 1000, delayMs: 0 },
        holdMs: 4500,
        background: {
          type: 'image',
          colors: ['#0E1A33', '#243A66'],
          imageUrl: 'https://images.unsplash.com/photo-1492136344046-866c85e0bf04?auto=format&fit=crop&w=1200&q=70',
          overlay: 'linear-gradient(180deg, rgba(14,26,51,0.55), rgba(14,26,51,0.85))',
          kenBurns: true,
        },
        decoration: { effect: 'sparkles', intensity: 'low', color: '#E7C36B' },
        style: { headingColor: '#E7C36B', headingSize: 'lg' },
        slots: [
          { key: 'lead', type: 'text', editable: true, required: false, maxLen: 40, defaultEn: 'So… here it goes', animation: 'glow' },
          { key: 'targetDate', type: 'date', editable: true, required: false },
        ],
      },
      {
        id: 'the-ring',
        type: 'GiftReveal',
        layout: 'centered',
        transitionIn: { preset: 'glow', durationMs: 1200, delayMs: 0 },
        holdMs: 5200,
        background: {
          type: 'image',
          colors: ['#0E1A33', '#243A66'],
          imageUrl: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=1200&q=70',
          overlay: 'radial-gradient(circle at center, rgba(14,26,51,0.3), rgba(14,26,51,0.88))',
        },
        decoration: { effect: 'glow', intensity: 'high', color: '#E7C36B' },
        style: { imageStyle: 'circle', headingColor: '#F6F1E7', headingSize: 'lg' },
        slots: [
          { key: 'heading', type: 'text', editable: true, required: true, maxLen: 40, defaultEn: 'I had this made for you', animation: 'glow' },
          { key: 'image', type: 'image', editable: true, required: false, aspect: '1:1', min: 0, max: 1, animation: 'glow' },
        ],
      },
      {
        id: 'the-question',
        type: 'Quote',
        transitionIn: { preset: 'blurIn', durationMs: 1600, delayMs: 0 },
        holdMs: 6000,
        background: {
          type: 'radial',
          colors: ['#243A66', '#0E1A33'],
          pattern: 'noise',
        },
        decoration: { effect: 'sparkles', intensity: 'high', color: '#E7C36B' },
        style: {
          headingFont: 'Cormorant Garamond',
          headingColor: '#E7C36B',
          headingSize: '2xl',
          textAlign: 'center',
        },
        slots: [
          { key: 'message', type: 'text', editable: true, required: true, maxLen: 48, defaultEn: 'Will you marry me, {recipient}?', animation: 'blurIn' },
          { key: 'attribution', type: 'text', editable: true, required: false, maxLen: 40, defaultEn: 'and stay mine forever' },
        ],
      },
      {
        id: 'finale',
        type: 'Finale',
        transitionIn: { preset: 'glow', durationMs: 1200, delayMs: 0 },
        holdMs: 6000,
        background: {
          type: 'image',
          colors: ['#0E1A33', '#243A66'],
          imageUrl: 'https://images.unsplash.com/photo-1467810563316-b5476525c0f9?auto=format&fit=crop&w=1200&q=70',
          overlay: 'linear-gradient(180deg, rgba(14,26,51,0.5), rgba(14,26,51,0.82))',
          kenBurns: true,
        },
        decoration: { effect: 'fireworks', intensity: 'high', color: '#E7C36B' },
        style: { headingSize: '2xl', headingColor: '#F6F1E7', textAlign: 'center' },
        slots: [
          { key: 'heading', type: 'text', editable: true, required: false, maxLen: 48, defaultEn: 'Forever starts now.', animation: 'glow' },
          { key: 'body', type: 'text', editable: true, required: false, maxLen: 100, defaultEn: 'I can’t wait to spend my whole life with you — beneath every star.' },
        ],
      },
    ],
  },
};

export const proposalAr: CatalogTemplate = {
  slug: 'proposal-etgawezini-ar',
  category: 'proposal',
  titleEn: 'Proposal — Marry Me',
  titleAr: 'اتجوزيني؟',
  locale: 'ar',
  direction: 'rtl',
  isPaid: true,
  pricePiastres: PRICE.premium,
  currency: 'EGP',
  thumbnailHint:
    'Midnight-navy night sky + champagne gold, Reem Kufi "اتجوزيني؟", a glowing ring box under the stars, sparkles, RTL.',
  thumbnailUrl:
    'https://images.unsplash.com/photo-1532978379173-523e16f371f9?auto=format&fit=crop&w=800&q=70',
  mvp: false,
  definition: {
    version: 1,
    locale: 'ar',
    direction: 'rtl',
    theme: {
      palette: ['#0E1A33', '#E7C36B', '#F6F1E7', '#243A66'],
      fontHeading: 'Reem Kufi',
      fontBody: 'Tajawal',
      accent: '#E7C36B',
      music: 'cinematic-swell',
      textColor: '#F6F1E7',
      background: { type: 'radial', colors: ['#243A66', '#0E1A33'] },
      decoration: { effect: 'stars', intensity: 'medium' },
    },
    scenes: [
      {
        id: 'cover',
        type: 'Cover',
        layout: 'centered',
        transitionIn: { preset: 'blurIn', durationMs: 1400, delayMs: 0 },
        holdMs: 4800,
        background: {
          type: 'radial',
          colors: ['#243A66', '#0E1A33'],
          pattern: 'noise',
        },
        decoration: { effect: 'stars', intensity: 'high' },
        style: {
          headingSize: '2xl',
          headingColor: '#F6F1E7',
          textPosition: 'center',
          textAlign: 'center',
        },
        slots: [
          { key: 'heading', type: 'text', editable: true, required: true, maxLen: 52, defaultAr: 'يا {recipient}.. في كلمة لازم أقولهالك', animation: 'blurIn' },
          { key: 'subheading', type: 'text', editable: true, required: false, maxLen: 60, defaultAr: 'بُص للسما معايا لحظة' },
        ],
      },
      {
        id: 'rehletna',
        type: 'PhotoReveal',
        layout: 'full-bleed',
        transitionIn: { preset: 'kenBurns', durationMs: 1600, delayMs: 0 },
        holdMs: 5200,
        background: {
          type: 'image',
          colors: ['#0E1A33', '#243A66'],
          imageUrl: 'https://images.unsplash.com/photo-1444703686981-a3abbc4d4fe3?auto=format&fit=crop&w=1200&q=70',
          overlay: 'linear-gradient(180deg, rgba(14,26,51,0.45), rgba(14,26,51,0.82))',
          kenBurns: true,
        },
        decoration: { effect: 'sparkles', intensity: 'low', color: '#E7C36B' },
        style: { imageStyle: 'full', headingColor: '#E7C36B' },
        slots: [
          { key: 'image', type: 'image', editable: true, required: true, aspect: '4:5', min: 1, max: 1, animation: 'kenBurns' },
          { key: 'caption', type: 'text', editable: true, required: false, maxLen: 60, defaultAr: 'من أول ليلة.. وأنا متأكد', animation: 'blurIn' },
        ],
      },
      {
        id: 'ehna',
        type: 'Gallery',
        layout: 'grid',
        transitionIn: { preset: 'rise', durationMs: 1000, delayMs: 0 },
        holdMs: 5000,
        background: {
          type: 'image',
          colors: ['#0E1A33', '#243A66'],
          imageUrl: 'https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=1200&q=70',
          overlay: 'linear-gradient(180deg, rgba(14,26,51,0.78), rgba(14,26,51,0.9))',
          kenBurns: true,
        },
        decoration: { effect: 'glow', intensity: 'low', color: '#E7C36B' },
        style: { imageStyle: 'card', headingSize: 'lg', headingColor: '#F6F1E7' },
        slots: [
          { key: 'heading', type: 'text', editable: true, required: false, maxLen: 30, defaultAr: 'كل حكاية.. وإحنا فيها', animation: 'float' },
          { key: 'gallery', type: 'image', editable: true, required: true, min: 2, max: 6, aspect: '1:1', animation: 'float' },
        ],
      },
      {
        id: 'haqiqa',
        type: 'Letter',
        transitionIn: { preset: 'blurIn', durationMs: 1500, delayMs: 0 },
        holdMs: 5400,
        background: {
          type: 'radial',
          colors: ['#243A66', '#0E1A33'],
        },
        decoration: { effect: 'sparkles', intensity: 'medium', color: '#E7C36B' },
        style: {
          headingColor: '#E7C36B',
          bodyColor: '#F6F1E7',
          headingSize: 'lg',
          textAlign: 'center',
        },
        slots: [
          { key: 'heading', type: 'text', editable: true, required: false, maxLen: 40, defaultAr: 'من كل قلبي', animation: 'glow' },
          { key: 'message', type: 'text', editable: true, required: true, maxLen: 180, defaultAr: 'تخيّلت كل بكرة عادي.. الصبح الهادي، السكة الطويلة، إننا نكبر مع بعض.. ولقيتك في كله', animation: 'blurIn' },
        ],
      },
      {
        id: 'tanazol',
        type: 'Countdown',
        transitionIn: { preset: 'glow', durationMs: 1000, delayMs: 0 },
        holdMs: 4500,
        background: {
          type: 'image',
          colors: ['#0E1A33', '#243A66'],
          imageUrl: 'https://images.unsplash.com/photo-1492136344046-866c85e0bf04?auto=format&fit=crop&w=1200&q=70',
          overlay: 'linear-gradient(180deg, rgba(14,26,51,0.55), rgba(14,26,51,0.85))',
          kenBurns: true,
        },
        decoration: { effect: 'sparkles', intensity: 'low', color: '#E7C36B' },
        style: { headingColor: '#E7C36B', headingSize: 'lg' },
        slots: [
          { key: 'lead', type: 'text', editable: true, required: false, maxLen: 40, defaultAr: 'يلا.. هقولها', animation: 'glow' },
          { key: 'targetDate', type: 'date', editable: true, required: false },
        ],
      },
      {
        id: 'el-khatem',
        type: 'GiftReveal',
        layout: 'centered',
        transitionIn: { preset: 'glow', durationMs: 1200, delayMs: 0 },
        holdMs: 5200,
        background: {
          type: 'image',
          colors: ['#0E1A33', '#243A66'],
          imageUrl: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=1200&q=70',
          overlay: 'radial-gradient(circle at center, rgba(14,26,51,0.3), rgba(14,26,51,0.88))',
        },
        decoration: { effect: 'glow', intensity: 'high', color: '#E7C36B' },
        style: { imageStyle: 'circle', headingColor: '#F6F1E7', headingSize: 'lg' },
        slots: [
          { key: 'heading', type: 'text', editable: true, required: true, maxLen: 40, defaultAr: 'عملته مخصوص علشانك', animation: 'glow' },
          { key: 'image', type: 'image', editable: true, required: false, aspect: '1:1', min: 0, max: 1, animation: 'glow' },
        ],
      },
      {
        id: 'el-soaal',
        type: 'Quote',
        transitionIn: { preset: 'blurIn', durationMs: 1600, delayMs: 0 },
        holdMs: 6000,
        background: {
          type: 'radial',
          colors: ['#243A66', '#0E1A33'],
          pattern: 'noise',
        },
        decoration: { effect: 'sparkles', intensity: 'high', color: '#E7C36B' },
        style: {
          headingColor: '#E7C36B',
          headingSize: '2xl',
          textAlign: 'center',
        },
        slots: [
          { key: 'message', type: 'text', editable: true, required: true, maxLen: 48, defaultAr: 'تتجوزيني يا {recipient}؟', animation: 'blurIn' },
          { key: 'attribution', type: 'text', editable: true, required: false, maxLen: 40, defaultAr: 'وتفضلي ليّا للأبد' },
        ],
      },
      {
        id: 'finale',
        type: 'Finale',
        transitionIn: { preset: 'glow', durationMs: 1200, delayMs: 0 },
        holdMs: 6000,
        background: {
          type: 'image',
          colors: ['#0E1A33', '#243A66'],
          imageUrl: 'https://images.unsplash.com/photo-1467810563316-b5476525c0f9?auto=format&fit=crop&w=1200&q=70',
          overlay: 'linear-gradient(180deg, rgba(14,26,51,0.5), rgba(14,26,51,0.82))',
          kenBurns: true,
        },
        decoration: { effect: 'fireworks', intensity: 'high', color: '#E7C36B' },
        style: { headingSize: '2xl', headingColor: '#F6F1E7', textAlign: 'center' },
        slots: [
          { key: 'heading', type: 'text', editable: true, required: false, maxLen: 48, defaultAr: 'العمر كله يبدأ من دلوقتي', animation: 'glow' },
          { key: 'body', type: 'text', editable: true, required: false, maxLen: 100, defaultAr: 'مش قادر أستنى أعيش حياتي كلها معاكي.. تحت كل نجمة' },
        ],
      },
    ],
  },
};
