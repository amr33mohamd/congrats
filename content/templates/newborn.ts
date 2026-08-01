/**
 * NEWBORN — two native templates.
 *
 * Art direction: tender, soft, dreamy — a gentle welcome to the world.
 * Soft pastel backgrounds (mint, peach, cream) with DARK ink text for
 * legibility, handwritten/rounded fonts, gentle bubbles + stars + glow,
 * and slow soothing float/rise/blurIn/fade animations. Includes a Letter
 * scene — a quiet note to the little one.
 *
 * EN "Welcome Little One" (free): Quicksand/Nunito, mint + peach pastel,
 *     a dreamy 8-scene welcome — cover, the-baby PhotoReveal, birth details,
 *     tiny-toes Gallery, a blessing line, a handwritten Letter, a keepsake
 *     gift, a soft glow finale.
 * AR "مبروك المولود" (free): native Arabic newborn congratulations —
 *     Harmattan/Tajawal, RTL, soft cream + sage, the warm
 *     "ربنا يخليه ويباركلكم فيه" blessing.
 */
import type { CatalogTemplate } from './_helpers';
import { PRICE } from './_helpers';

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
    'https://images.unsplash.com/photo-1519689680058-324335c77eba?auto=format&fit=crop&w=800&q=70',
  mvp: false,
  definition: {
    version: 1,
    locale: 'en',
    direction: 'ltr',
    theme: {
      palette: ['#FFF6F0', '#9DC7C0', '#3A4A49', '#F4C7B5'],
      fontHeading: 'Quicksand',
      fontBody: 'Nunito',
      accent: '#F4C7B5',
      music: 'lullaby-soft',
      textColor: '#3A4A49',
      background: { type: 'gradient', colors: ['#FFF6F0', '#F4C7B5', '#9DC7C0'], angle: 165 },
      decoration: { effect: 'bubbles', intensity: 'low', color: '#9DC7C0' },
    },
    scenes: [
      {
        id: 'cover',
        type: 'Cover',
        layout: 'centered-photo',
        transitionIn: { preset: 'blurIn', durationMs: 1200, delayMs: 0 },
        holdMs: 4400,
        background: {
          type: 'gradient',
          colors: ['#FFF6F0', '#FDE7DA', '#9DC7C0'],
          angle: 160,
        },
        decoration: { effect: 'bubbles', intensity: 'low', color: '#9DC7C0' },
        style: {
          headingSize: '2xl',
          headingColor: '#3A4A49',
          bodyColor: '#5B6B6A',
          headingFont: 'Caveat',
          textPosition: 'center',
        },
        slots: [
          { key: 'heading', type: 'text', editable: true, required: true, maxLen: 44, defaultEn: 'Welcome to the world, {recipient}', animation: 'blurIn' },
          { key: 'subheading', type: 'text', editable: true, required: false, maxLen: 50, defaultEn: 'A tiny miracle has arrived.', animation: 'fade' },
          { key: 'coverImage', type: 'image', editable: true, required: false, aspect: '1:1', min: 0, max: 1, animation: 'float' },
        ],
      },
      {
        id: 'the-baby',
        type: 'PhotoReveal',
        layout: 'full-bleed',
        transitionIn: { preset: 'rise', durationMs: 1100, delayMs: 0 },
        holdMs: 4800,
        background: {
          type: 'image',
          colors: ['#FFF6F0', '#9DC7C0'],
          imageUrl: 'https://images.unsplash.com/photo-1555252333-9f8e92e65df9?auto=format&fit=crop&w=1200&q=70',
          overlay: 'linear-gradient(180deg, rgba(255,246,240,0.45), rgba(157,199,192,0.45))',
          kenBurns: true,
        },
        decoration: { effect: 'glow', intensity: 'low', color: '#FFFFFF' },
        style: {
          imageStyle: 'rounded',
          headingColor: '#3A4A49',
          bodyColor: '#3A4A49',
          textPosition: 'bottom',
        },
        slots: [
          { key: 'image', type: 'image', editable: true, required: true, aspect: '4:5', min: 1, max: 1, animation: 'float' },
          { key: 'caption', type: 'text', editable: true, required: false, maxLen: 50, defaultEn: 'Hello, little one', animation: 'rise' },
        ],
      },
      {
        id: 'details',
        type: 'TextReveal',
        transitionIn: { preset: 'fade', durationMs: 1000, delayMs: 0 },
        holdMs: 4600,
        background: {
          type: 'gradient',
          colors: ['#FFF6F0', '#FDE7DA'],
          angle: 150,
        },
        decoration: { effect: 'stars', intensity: 'low', color: '#F4C7B5' },
        style: {
          headingColor: '#3A4A49',
          bodyColor: '#5B6B6A',
          headingSize: 'lg',
          textPosition: 'center',
        },
        slots: [
          { key: 'name', type: 'text', editable: true, required: false, maxLen: 40, defaultEn: 'Name: {recipient}', animation: 'rise' },
          { key: 'weight', type: 'text', editable: true, required: false, maxLen: 40, defaultEn: 'Weight: 3.4 kg', animation: 'fade' },
          { key: 'date', type: 'date', editable: true, required: false },
        ],
      },
      {
        id: 'tiny-toes',
        type: 'Gallery',
        layout: 'grid',
        transitionIn: { preset: 'rise', durationMs: 900, delayMs: 0 },
        holdMs: 5200,
        background: {
          type: 'image',
          colors: ['#FFF6F0', '#F4C7B5'],
          imageUrl: 'https://images.unsplash.com/photo-1492725764893-90b379c2b6e7?auto=format&fit=crop&w=1200&q=70',
          overlay: 'linear-gradient(180deg, rgba(255,246,240,0.55), rgba(244,199,181,0.5))',
        },
        decoration: { effect: 'bubbles', intensity: 'low', color: '#FFFFFF' },
        style: {
          imageStyle: 'rounded',
          headingColor: '#3A4A49',
          bodyColor: '#3A4A49',
          headingSize: 'md',
        },
        slots: [
          { key: 'heading', type: 'text', editable: true, required: false, maxLen: 30, defaultEn: 'First little moments', animation: 'fade' },
          { key: 'gallery', type: 'image', editable: true, required: true, min: 2, max: 6, aspect: '1:1', animation: 'float' },
        ],
      },
      {
        id: 'blessing',
        type: 'Quote',
        transitionIn: { preset: 'blurIn', durationMs: 1300, delayMs: 0 },
        holdMs: 5000,
        background: {
          type: 'radial',
          colors: ['#FFFDFB', '#9DC7C0'],
        },
        decoration: { effect: 'glow', intensity: 'medium', color: '#F4C7B5' },
        style: {
          headingColor: '#3A4A49',
          bodyColor: '#5B6B6A',
          headingSize: 'xl',
          headingFont: 'Caveat',
          textPosition: 'center',
        },
        slots: [
          { key: 'message', type: 'text', editable: true, required: false, maxLen: 140, defaultEn: 'May your days be soft, your nights be gentle, and your life be long and full.', animation: 'blurIn' },
          { key: 'attribution', type: 'text', editable: true, required: false, maxLen: 40, defaultEn: 'with all our love', animation: 'fade' },
        ],
      },
      {
        id: 'letter',
        type: 'Letter',
        layout: 'centered',
        transitionIn: { preset: 'rise', durationMs: 1100, delayMs: 0 },
        holdMs: 5500,
        background: {
          type: 'gradient',
          colors: ['#FFF6F0', '#FDE7DA', '#FFF6F0'],
          angle: 170,
        },
        decoration: { effect: 'stars', intensity: 'low', color: '#9DC7C0' },
        style: {
          headingColor: '#3A4A49',
          bodyColor: '#5B6B6A',
          headingFont: 'Caveat',
          textAlign: 'start',
          headingSize: 'lg',
        },
        slots: [
          { key: 'heading', type: 'text', editable: true, required: true, maxLen: 40, defaultEn: 'A note for you, little one', animation: 'rise' },
          { key: 'body', type: 'text', editable: true, required: false, maxLen: 320, defaultEn: 'We waited so long for you, and now that you are here the whole house feels brighter. We promise to keep you safe, to read you stories until you fall asleep, and to love you more with every passing day. Welcome home.', animation: 'fade' },
        ],
      },
      {
        id: 'keepsake',
        type: 'GiftReveal',
        layout: 'centered',
        transitionIn: { preset: 'glow', durationMs: 1000, delayMs: 0 },
        holdMs: 4600,
        background: {
          type: 'gradient',
          colors: ['#9DC7C0', '#FFF6F0'],
          angle: 200,
        },
        decoration: { effect: 'bubbles', intensity: 'low', color: '#F4C7B5' },
        style: {
          headingColor: '#3A4A49',
          bodyColor: '#5B6B6A',
          textPosition: 'center',
        },
        slots: [
          { key: 'heading', type: 'text', editable: true, required: true, maxLen: 40, defaultEn: 'A little something', animation: 'glow' },
          { key: 'body', type: 'text', editable: true, required: false, maxLen: 100, defaultEn: 'For the newest, most loved arrival.', animation: 'fade' },
          { key: 'image', type: 'image', editable: true, required: false, aspect: '1:1', min: 0, max: 1, animation: 'float' },
        ],
      },
      {
        id: 'finale',
        type: 'Finale',
        transitionIn: { preset: 'glow', durationMs: 1200, delayMs: 0 },
        holdMs: 6000,
        background: {
          type: 'image',
          colors: ['#FFF6F0', '#9DC7C0'],
          imageUrl: 'https://images.unsplash.com/photo-1490730141103-6cac27aaab94?auto=format&fit=crop&w=1200&q=70',
          overlay: 'linear-gradient(180deg, rgba(255,246,240,0.55), rgba(157,199,192,0.5))',
          kenBurns: true,
        },
        decoration: { effect: 'stars', intensity: 'medium', color: '#FFFFFF' },
        style: {
          headingSize: '2xl',
          headingColor: '#3A4A49',
          bodyColor: '#3A4A49',
          headingFont: 'Caveat',
          textPosition: 'center',
        },
        slots: [
          { key: 'heading', type: 'text', editable: true, required: true, maxLen: 44, defaultEn: 'Welcome, {recipient}', animation: 'blurIn' },
          { key: 'body', type: 'text', editable: true, required: false, maxLen: 90, defaultEn: 'So loved already.', animation: 'fade' },
        ],
      },
    ],
  },
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
  definition: {
    version: 1,
    locale: 'ar',
    direction: 'rtl',
    theme: {
      palette: ['#FFF7EF', '#8FB9A8', '#3A4A49', '#E7B59B'],
      fontHeading: 'Harmattan',
      fontBody: 'Tajawal',
      accent: '#E7B59B',
      music: 'lullaby-soft',
      textColor: '#3A4A49',
      background: { type: 'gradient', colors: ['#FFF7EF', '#E7B59B', '#8FB9A8'], angle: 165 },
      decoration: { effect: 'bubbles', intensity: 'low', color: '#8FB9A8' },
    },
    scenes: [
      {
        id: 'cover',
        type: 'Cover',
        layout: 'centered-photo',
        transitionIn: { preset: 'blurIn', durationMs: 1200, delayMs: 0 },
        holdMs: 4400,
        background: {
          type: 'gradient',
          colors: ['#FFF7EF', '#FBE4D6', '#8FB9A8'],
          angle: 160,
        },
        decoration: { effect: 'bubbles', intensity: 'low', color: '#8FB9A8' },
        style: {
          headingSize: '2xl',
          headingColor: '#3A4A49',
          bodyColor: '#5B6B6A',
          textPosition: 'center',
        },
        slots: [
          { key: 'heading', type: 'text', editable: true, required: true, maxLen: 44, defaultAr: 'أهلاً بيك في الدنيا يا {recipient}', animation: 'blurIn' },
          { key: 'subheading', type: 'text', editable: true, required: false, maxLen: 50, defaultAr: 'وصلت أحلى هدية', animation: 'fade' },
          { key: 'coverImage', type: 'image', editable: true, required: false, aspect: '1:1', min: 0, max: 1, animation: 'float' },
        ],
      },
      {
        id: 'el-baby',
        type: 'PhotoReveal',
        layout: 'full-bleed',
        transitionIn: { preset: 'rise', durationMs: 1100, delayMs: 0 },
        holdMs: 4800,
        background: {
          type: 'image',
          colors: ['#FFF7EF', '#8FB9A8'],
          imageUrl: 'https://images.unsplash.com/photo-1555252333-9f8e92e65df9?auto=format&fit=crop&w=1200&q=70',
          overlay: 'linear-gradient(180deg, rgba(255,247,239,0.45), rgba(143,185,168,0.45))',
          kenBurns: true,
        },
        decoration: { effect: 'glow', intensity: 'low', color: '#FFFFFF' },
        style: {
          imageStyle: 'rounded',
          headingColor: '#3A4A49',
          bodyColor: '#3A4A49',
          textPosition: 'bottom',
        },
        slots: [
          { key: 'image', type: 'image', editable: true, required: true, aspect: '4:5', min: 1, max: 1, animation: 'float' },
          { key: 'caption', type: 'text', editable: true, required: false, maxLen: 50, defaultAr: 'يا أهلاً بالصغير', animation: 'rise' },
        ],
      },
      {
        id: 'tafaseel',
        type: 'TextReveal',
        transitionIn: { preset: 'fade', durationMs: 1000, delayMs: 0 },
        holdMs: 4600,
        background: {
          type: 'gradient',
          colors: ['#FFF7EF', '#FBE4D6'],
          angle: 150,
        },
        decoration: { effect: 'stars', intensity: 'low', color: '#E7B59B' },
        style: {
          headingColor: '#3A4A49',
          bodyColor: '#5B6B6A',
          headingSize: 'lg',
          textPosition: 'center',
        },
        slots: [
          { key: 'name', type: 'text', editable: true, required: false, maxLen: 40, defaultAr: 'الاسم: {recipient}', animation: 'rise' },
          { key: 'weight', type: 'text', editable: true, required: false, maxLen: 40, defaultAr: 'الوزن: 3.4 كيلو', animation: 'fade' },
          { key: 'date', type: 'date', editable: true, required: false },
        ],
      },
      {
        id: 'koraat',
        type: 'Gallery',
        layout: 'grid',
        transitionIn: { preset: 'rise', durationMs: 900, delayMs: 0 },
        holdMs: 5200,
        background: {
          type: 'image',
          colors: ['#FFF7EF', '#E7B59B'],
          imageUrl: 'https://images.unsplash.com/photo-1492725764893-90b379c2b6e7?auto=format&fit=crop&w=1200&q=70',
          overlay: 'linear-gradient(180deg, rgba(255,247,239,0.55), rgba(231,181,155,0.5))',
        },
        decoration: { effect: 'bubbles', intensity: 'low', color: '#FFFFFF' },
        style: {
          imageStyle: 'rounded',
          headingColor: '#3A4A49',
          bodyColor: '#3A4A49',
          headingSize: 'md',
        },
        slots: [
          { key: 'heading', type: 'text', editable: true, required: false, maxLen: 30, defaultAr: 'أول لحظات صغيّرة', animation: 'fade' },
          { key: 'gallery', type: 'image', editable: true, required: true, min: 2, max: 6, aspect: '1:1', animation: 'float' },
        ],
      },
      {
        id: 'doaa',
        type: 'Quote',
        transitionIn: { preset: 'blurIn', durationMs: 1300, delayMs: 0 },
        holdMs: 5000,
        background: {
          type: 'radial',
          colors: ['#FFFDFB', '#8FB9A8'],
        },
        decoration: { effect: 'glow', intensity: 'medium', color: '#E7B59B' },
        style: {
          headingColor: '#3A4A49',
          bodyColor: '#5B6B6A',
          headingSize: 'xl',
          textPosition: 'center',
        },
        slots: [
          { key: 'message', type: 'text', editable: true, required: false, maxLen: 140, defaultAr: 'ربنا يحفظه ويكبر في عزّ.. ويملا حياتكم فرح', animation: 'blurIn' },
          { key: 'attribution', type: 'text', editable: true, required: false, maxLen: 40, defaultAr: 'بكل الحب', animation: 'fade' },
        ],
      },
      {
        id: 'gawab',
        type: 'Letter',
        layout: 'centered',
        transitionIn: { preset: 'rise', durationMs: 1100, delayMs: 0 },
        holdMs: 5500,
        background: {
          type: 'gradient',
          colors: ['#FFF7EF', '#FBE4D6', '#FFF7EF'],
          angle: 170,
        },
        decoration: { effect: 'stars', intensity: 'low', color: '#8FB9A8' },
        style: {
          headingColor: '#3A4A49',
          bodyColor: '#5B6B6A',
          textAlign: 'start',
          headingSize: 'lg',
        },
        slots: [
          { key: 'heading', type: 'text', editable: true, required: true, maxLen: 40, defaultAr: 'كلمتين لأحلى مولود', animation: 'rise' },
          { key: 'body', type: 'text', editable: true, required: false, maxLen: 320, defaultAr: 'استنيناك كتير، ودلوقتي وإنت معانا البيت كله نوّر. وعدناك نحافظ عليك، ونحكيلك حواديت لما تنام، ونحبك أكتر كل يوم. نوّرت الدنيا يا حبيبنا.', animation: 'fade' },
        ],
      },
      {
        id: 'hadiya',
        type: 'GiftReveal',
        layout: 'centered',
        transitionIn: { preset: 'glow', durationMs: 1000, delayMs: 0 },
        holdMs: 4600,
        background: {
          type: 'gradient',
          colors: ['#8FB9A8', '#FFF7EF'],
          angle: 200,
        },
        decoration: { effect: 'bubbles', intensity: 'low', color: '#E7B59B' },
        style: {
          headingColor: '#3A4A49',
          bodyColor: '#5B6B6A',
          textPosition: 'center',
        },
        slots: [
          { key: 'heading', type: 'text', editable: true, required: true, maxLen: 40, defaultAr: 'حاجة صغيّرة', animation: 'glow' },
          { key: 'body', type: 'text', editable: true, required: false, maxLen: 100, defaultAr: 'لأحدث وأحلى وصول', animation: 'fade' },
          { key: 'image', type: 'image', editable: true, required: false, aspect: '1:1', min: 0, max: 1, animation: 'float' },
        ],
      },
      {
        id: 'finale',
        type: 'Finale',
        transitionIn: { preset: 'glow', durationMs: 1200, delayMs: 0 },
        holdMs: 6000,
        background: {
          type: 'image',
          colors: ['#FFF7EF', '#8FB9A8'],
          imageUrl: 'https://images.unsplash.com/photo-1490730141103-6cac27aaab94?auto=format&fit=crop&w=1200&q=70',
          overlay: 'linear-gradient(180deg, rgba(255,247,239,0.55), rgba(143,185,168,0.5))',
          kenBurns: true,
        },
        decoration: { effect: 'stars', intensity: 'medium', color: '#FFFFFF' },
        style: {
          headingSize: '2xl',
          headingColor: '#3A4A49',
          bodyColor: '#3A4A49',
          textPosition: 'center',
        },
        slots: [
          { key: 'heading', type: 'text', editable: true, required: true, maxLen: 44, defaultAr: 'ربنا يخليه ويباركلكم فيه', animation: 'blurIn' },
          { key: 'body', type: 'text', editable: true, required: false, maxLen: 90, defaultAr: 'محبوب من قبل ما يجي', animation: 'fade' },
        ],
      },
    ],
  },
};
