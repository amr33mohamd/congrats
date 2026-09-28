/**
 * EID — two native templates, art-directed as one serene festive piece:
 * lanterns + crescent moon at night, emerald/gold/cream, calm reverent pacing.
 *
 * AR "بركات العيد" (paid, MVP): native Arabic Eid greeting — emerald + gold,
 *     Aref Ruqaa/Tajawal, crescent + fanous lantern motifs, RTL, warm spoken
 *     blessing (عيد سعيد / كل سنة وانتو طيبين) blended with classic فصحى dua.
 *     7-scene arc: greeting → blessing → lanterns photo → لمّة gallery →
 *     عيدية GiftReveal → night-prayer line → عيد مبارك finale.
 * EN "Eid Mubarak" (free): an Eid card for English speakers / diaspora — same
 *     night-and-lanterns warmth, Marcellus/Poppins, LTR, accessible greeting.
 */
import type { CatalogTemplate } from './_helpers';
import { PRICE } from './_helpers';

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
  definition: {
    version: 1,
    locale: 'ar',
    direction: 'rtl',
    theme: {
      palette: ['#06281F', '#1F8A6B', '#FFFFFF', '#D4AF37'],
      fontHeading: 'Aref Ruqaa',
      fontBody: 'Tajawal',
      accent: '#D4AF37',
      ornament: { kind: 'arch', opacity: 0.5, scale: 1 },
      music: 'eid-takbir-soft',
      textColor: '#FFFFFF',
      background: { type: 'gradient', colors: ['#06281F', '#0B3B2B'], angle: 165 },
      decoration: { effect: 'stars', intensity: 'medium', color: '#D4AF37' },
    },
    scenes: [
      {
        id: 'cover',
        type: 'Cover',
        layout: 'centered',
        transitionIn: { preset: 'glow', durationMs: 1100, delayMs: 0 },
        holdMs: 4800,
        background: {
          type: 'radial',
          colors: ['#0E4A35', '#06281F'],
          angle: 165,
        },
        decoration: { effect: 'glow', intensity: 'medium', color: '#D4AF37' },
        style: { headingSize: '2xl', headingColor: '#D4AF37', bodyColor: '#E8F5E9', textPosition: 'center' },
        slots: [
          { key: 'heading', type: 'text', editable: true, required: true, maxLen: 48, defaultAr: 'عيد سعيد يا {recipient}', animation: 'glow' },
          { key: 'subheading', type: 'text', editable: true, required: false, maxLen: 40, defaultAr: 'كل سنة وانتو طيبين' },
        ],
      },
      {
        id: 'blessing',
        type: 'Quote',
        transitionIn: { preset: 'blurIn', durationMs: 1200, delayMs: 0 },
        holdMs: 5200,
        background: { type: 'radial', colors: ['#0B3B2B', '#06281F'] },
        decoration: { effect: 'sparkles', intensity: 'low', color: '#D4AF37' },
        style: { headingColor: '#FFFFFF', headingSize: 'xl', bodyColor: '#D4AF37', textAlign: 'center' },
        slots: [
          { key: 'heading', type: 'text', editable: true, required: true, maxLen: 80, defaultAr: 'تقبّل الله منا ومنكم صالح الأعمال', animation: 'blurIn' },
          { key: 'dua', type: 'text', editable: true, required: false, maxLen: 100, defaultAr: 'وكل عام وأنتم إلى الله أقرب' },
        ],
      },
      {
        id: 'lanterns',
        type: 'PhotoReveal',
        layout: 'full-bleed',
        transitionIn: { preset: 'kenBurns', durationMs: 1400, delayMs: 0 },
        holdMs: 5000,
        background: {
          type: 'image',
          colors: ['#06281F', '#0B3B2B'],
          imageUrl: 'https://images.unsplash.com/photo-1561089489-f13d5e730d72?auto=format&fit=crop&w=1200&q=70',
          overlay: 'linear-gradient(180deg, rgba(6,40,31,0.35), rgba(6,40,31,0.78))',
          kenBurns: true,
        },
        decoration: { effect: 'emoji', emoji: '🏮', intensity: 'low' },
        style: { headingColor: '#D4AF37', bodyColor: '#FFFFFF', textPosition: 'bottom' },
        slots: [
          { key: 'image', type: 'image', editable: true, required: false, aspect: '4:5', min: 0, max: 1, animation: 'kenBurns' },
          { key: 'caption', type: 'text', editable: true, required: false, maxLen: 40, defaultAr: 'فوانيس العيد منوّرة الليلة', animation: 'rise' },
        ],
      },
      {
        id: 'lamma',
        type: 'Gallery',
        layout: 'grid',
        transitionIn: { preset: 'rise', durationMs: 900, delayMs: 0 },
        holdMs: 5400,
        background: {
          type: 'image',
          colors: ['#0B3B2B', '#06281F'],
          imageUrl: 'https://images.unsplash.com/photo-1542816417-0983c9c9ad53?auto=format&fit=crop&w=1200&q=70',
          overlay: 'linear-gradient(180deg, rgba(6,40,31,0.74), rgba(6,40,31,0.9))',
        },
        decoration: { effect: 'glow', intensity: 'low', color: '#D4AF37' },
        style: { imageStyle: 'card', headingSize: 'md', headingColor: '#D4AF37' },
        slots: [
          { key: 'heading', type: 'text', editable: true, required: false, maxLen: 30, defaultAr: 'لمّة العيد' },
          { key: 'gallery', type: 'image', editable: true, required: true, min: 2, max: 6, aspect: '1:1', animation: 'rise' },
        ],
      },
      {
        id: 'gift',
        type: 'GiftReveal',
        layout: 'centered',
        transitionIn: { preset: 'glow', durationMs: 1000, delayMs: 0 },
        holdMs: 4600,
        background: { type: 'radial', colors: ['#1F8A6B', '#06281F'] },
        decoration: { effect: 'sparkles', intensity: 'medium', color: '#D4AF37' },
        style: { headingColor: '#D4AF37', bodyColor: '#FFFFFF', imageStyle: 'rounded' },
        slots: [
          { key: 'heading', type: 'text', editable: true, required: true, maxLen: 40, defaultAr: 'العيدية', animation: 'glow' },
          { key: 'body', type: 'text', editable: true, required: false, maxLen: 120, defaultAr: 'هديتك على العيد.. كل عام وانت بخير' },
          { key: 'image', type: 'image', editable: true, required: false, aspect: '1:1', min: 0, max: 1, animation: 'zoom' },
        ],
      },
      {
        id: 'doaa',
        type: 'Letter',
        transitionIn: { preset: 'blurIn', durationMs: 1200, delayMs: 0 },
        holdMs: 5000,
        background: {
          type: 'image',
          colors: ['#06281F', '#0B3B2B'],
          imageUrl: 'https://images.unsplash.com/photo-1532635248-cdd3d399f56c?auto=format&fit=crop&w=1200&q=70',
          overlay: 'linear-gradient(180deg, rgba(6,40,31,0.6), rgba(6,40,31,0.82))',
        },
        decoration: { effect: 'stars', intensity: 'low', color: '#D4AF37' },
        style: { headingColor: '#D4AF37', bodyColor: '#FFFFFF', textAlign: 'center' },
        slots: [
          { key: 'message', type: 'text', editable: true, required: false, maxLen: 120, defaultAr: 'ربنا يعيده عليك بالصحة والسعادة وراحة البال', animation: 'rise' },
        ],
      },
      {
        id: 'finale',
        type: 'Finale',
        transitionIn: { preset: 'glow', durationMs: 1100, delayMs: 0 },
        holdMs: 6000,
        background: {
          type: 'image',
          colors: ['#06281F', '#0B3B2B'],
          imageUrl: 'https://images.unsplash.com/photo-1564769662533-4f00a87b4056?auto=format&fit=crop&w=1200&q=70',
          overlay: 'linear-gradient(180deg, rgba(6,40,31,0.55), rgba(6,40,31,0.85))',
          kenBurns: true,
        },
        decoration: { effect: 'glow', intensity: 'high', color: '#D4AF37' },
        style: { headingSize: '2xl', headingColor: '#D4AF37', bodyColor: '#FFFFFF' },
        slots: [
          { key: 'heading', type: 'text', editable: true, required: true, maxLen: 48, defaultAr: 'عيد مبارك يا {recipient}', animation: 'glow' },
          { key: 'body', type: 'text', editable: true, required: false, maxLen: 60, defaultAr: 'من قلبي.. كل سنة وانتو طيبين' },
        ],
      },
    ],
  },
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
  definition: {
    version: 1,
    locale: 'en',
    direction: 'ltr',
    theme: {
      palette: ['#06281F', '#1F8A6B', '#FFFFFF', '#D4AF37'],
      fontHeading: 'Marcellus',
      fontBody: 'Poppins',
      accent: '#D4AF37',
      ornament: { kind: 'arch', opacity: 0.5, scale: 1 },
      music: 'eid-takbir-soft',
      textColor: '#FFFFFF',
      background: { type: 'gradient', colors: ['#06281F', '#0B3B2B'], angle: 165 },
      decoration: { effect: 'stars', intensity: 'medium', color: '#D4AF37' },
    },
    scenes: [
      {
        id: 'cover',
        type: 'Cover',
        layout: 'centered',
        transitionIn: { preset: 'glow', durationMs: 1100, delayMs: 0 },
        holdMs: 4600,
        background: {
          type: 'radial',
          colors: ['#0E4A35', '#06281F'],
          angle: 165,
        },
        decoration: { effect: 'glow', intensity: 'medium', color: '#D4AF37' },
        style: { headingSize: '2xl', headingColor: '#D4AF37', bodyColor: '#E8F5E9', textPosition: 'center' },
        slots: [
          { key: 'heading', type: 'text', editable: true, required: true, maxLen: 48, defaultEn: 'Eid Mubarak, {recipient}', animation: 'glow' },
          { key: 'subheading', type: 'text', editable: true, required: false, maxLen: 50, defaultEn: 'May your Eid be blessed and full of light.' },
        ],
      },
      {
        id: 'blessing',
        type: 'Quote',
        transitionIn: { preset: 'blurIn', durationMs: 1200, delayMs: 0 },
        holdMs: 5200,
        background: { type: 'radial', colors: ['#0B3B2B', '#06281F'] },
        decoration: { effect: 'sparkles', intensity: 'low', color: '#D4AF37' },
        style: { headingColor: '#FFFFFF', headingSize: 'xl', bodyColor: '#D4AF37', textAlign: 'center' },
        slots: [
          { key: 'heading', type: 'text', editable: true, required: true, maxLen: 90, defaultEn: 'May this Eid bring you peace, joy, and the people you love.', animation: 'blurIn' },
          { key: 'attribution', type: 'text', editable: true, required: false, maxLen: 50, defaultEn: 'with warm wishes' },
        ],
      },
      {
        id: 'photo',
        type: 'PhotoReveal',
        layout: 'full-bleed',
        transitionIn: { preset: 'kenBurns', durationMs: 1400, delayMs: 0 },
        holdMs: 5000,
        background: {
          type: 'image',
          colors: ['#06281F', '#0B3B2B'],
          imageUrl: 'https://images.unsplash.com/photo-1561089489-f13d5e730d72?auto=format&fit=crop&w=1200&q=70',
          overlay: 'linear-gradient(180deg, rgba(6,40,31,0.35), rgba(6,40,31,0.78))',
          kenBurns: true,
        },
        decoration: { effect: 'emoji', emoji: '🏮', intensity: 'low' },
        style: { headingColor: '#D4AF37', bodyColor: '#FFFFFF', textPosition: 'bottom' },
        slots: [
          { key: 'image', type: 'image', editable: true, required: false, aspect: '4:5', min: 0, max: 1, animation: 'kenBurns' },
          { key: 'caption', type: 'text', editable: true, required: false, maxLen: 40, defaultEn: 'Lanterns lit, together', animation: 'rise' },
        ],
      },
      {
        id: 'gathering',
        type: 'Gallery',
        layout: 'grid',
        transitionIn: { preset: 'rise', durationMs: 900, delayMs: 0 },
        holdMs: 5400,
        background: {
          type: 'image',
          colors: ['#0B3B2B', '#06281F'],
          imageUrl: 'https://images.unsplash.com/photo-1542816417-0983c9c9ad53?auto=format&fit=crop&w=1200&q=70',
          overlay: 'linear-gradient(180deg, rgba(6,40,31,0.74), rgba(6,40,31,0.9))',
        },
        decoration: { effect: 'glow', intensity: 'low', color: '#D4AF37' },
        style: { imageStyle: 'card', headingSize: 'md', headingColor: '#D4AF37' },
        slots: [
          { key: 'heading', type: 'text', editable: true, required: false, maxLen: 30, defaultEn: 'Our Eid gathering' },
          { key: 'gallery', type: 'image', editable: true, required: true, min: 2, max: 6, aspect: '1:1', animation: 'rise' },
        ],
      },
      {
        id: 'gift',
        type: 'GiftReveal',
        layout: 'centered',
        transitionIn: { preset: 'glow', durationMs: 1000, delayMs: 0 },
        holdMs: 4600,
        background: { type: 'radial', colors: ['#1F8A6B', '#06281F'] },
        decoration: { effect: 'sparkles', intensity: 'medium', color: '#D4AF37' },
        style: { headingColor: '#D4AF37', bodyColor: '#FFFFFF', imageStyle: 'rounded' },
        slots: [
          { key: 'heading', type: 'text', editable: true, required: true, maxLen: 40, defaultEn: 'A little Eidiyya', animation: 'glow' },
          { key: 'body', type: 'text', editable: true, required: false, maxLen: 110, defaultEn: 'A small gift for the celebration — Eid Mubarak!' },
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
          colors: ['#06281F', '#0B3B2B'],
          imageUrl: 'https://images.unsplash.com/photo-1564769662533-4f00a87b4056?auto=format&fit=crop&w=1200&q=70',
          overlay: 'linear-gradient(180deg, rgba(6,40,31,0.55), rgba(6,40,31,0.85))',
          kenBurns: true,
        },
        decoration: { effect: 'glow', intensity: 'high', color: '#D4AF37' },
        style: { headingSize: '2xl', headingColor: '#D4AF37', bodyColor: '#FFFFFF' },
        slots: [
          { key: 'heading', type: 'text', editable: true, required: true, maxLen: 48, defaultEn: 'Eid Mubarak, {recipient}!', animation: 'glow' },
          { key: 'body', type: 'text', editable: true, required: false, maxLen: 80, defaultEn: 'From my heart to yours.' },
        ],
      },
    ],
  },
};
