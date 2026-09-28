/**
 * PROPOSAL — one card that builds, section by section, to the question.
 *
 * Midnight navy and champagne gold under a starfield, a monogram crest at the
 * two ends:
 *   cover → the letter → where it started (photo) → every step (gallery) →
 *   what I promise → the ring → the question → forever.
 *
 * EN "Will You Marry Me?" (paid, MVP) — Cormorant Garamond over Montserrat.
 * AR "اتجوزيني؟" (paid) — Reem Kufi over Tajawal, Egyptian Arabic, to her.
 *
 * The question is kept for last on purpose: the whole card is the run-up.
 * Scene ids that existed before the one-page rewrite are kept; `promises` is
 * new, and the old countdown was dropped (a proposal has no date to count to).
 */
import type { TemplateDefinitionInput } from '@/lib/template-contract';
import type { CatalogTemplate } from './_helpers';
import { PRICE } from './_helpers';
import { LABEL, PLAIN, enter, frame, photo, text, theme, type Loc, type Look } from './_card';

const NIGHT: Omit<Look, 'fontHeading' | 'fontBody'> = {
  palette: ['#0E1A33', '#E7C36B', '#F6F1E7', '#243A66'],
  ground: ['#0E1A33', '#172849', '#0E1A33'],
  accent: '#E7C36B',
  ink: '#F6F1E7',
  headingInk: '#F6F1E7',
  music: 'cinematic-swell',
  ornament: 'monogram',
  pattern: 'noise',
  ambient: { effect: 'stars', intensity: 'low', color: '#E7C36B' },
};

const LOOK: Record<Loc, Look> = {
  en: { ...NIGHT, fontHeading: 'Cormorant Garamond', fontBody: 'Montserrat' },
  ar: { ...NIGHT, fontHeading: 'Reem Kufi', fontBody: 'Tajawal' },
};

const IDS = {
  en: { letter: 'truth', photo: 'journey', gallery: 'us', ring: 'the-ring', question: 'the-question' },
  ar: { letter: 'haqiqa', photo: 'rehletna', gallery: 'ehna', ring: 'el-khatem', question: 'el-soaal' },
} as const;

const COPY = {
  en: {
    heading: '{recipient}, there’s something I need to say',
    sub: 'Just stay with me until the end.',
    dear: 'Before I ask…',
    letter:
      'I’ve rehearsed this a hundred times, and every version starts the same way: with you. I’ve pictured every ordinary tomorrow — quiet mornings, long drives, growing old — and you’re in every single one of them.',
    sign: 'My whole heart',
    caption: 'From the very first night, I knew.',
    galleryTitle: 'Every step that led here',
    promise1: 'I promise to choose you, every single day.',
    promise2: 'To laugh with you, and hold you when it’s hard.',
    promise3: 'To build a home that feels like us.',
    ringTitle: 'I had this made for you',
    ringNote: 'It was always going to be you.',
    question: 'Will you marry me, {recipient}?',
    questionBy: 'and stay mine forever',
    finale: 'Forever starts now.',
    finaleBody: 'I can’t wait to spend my whole life with you — beneath every star.',
  },
  ar: {
    heading: 'يا {recipient}.. في كلمة لازم أقولهالك',
    sub: 'خليكي معايا لحد الآخر',
    dear: 'قبل ما أسألك..',
    letter:
      'قلت الكلام ده في دماغي مية مرة، وكل مرة كان بيبدأ بيكي. تخيّلت كل بكرة عادي.. الصبح الهادي، والسكة الطويلة، وإننا نكبر مع بعض.. ولقيتك في كله.',
    sign: 'من كل قلبي',
    caption: 'من أول ليلة.. وأنا متأكد',
    galleryTitle: 'كل خطوة وصّلتنا لهنا',
    promise1: 'أوعدك أختارك كل يوم من جديد',
    promise2: 'أضحك معاكي، وأبقى جنبك في الصعب قبل الحلو',
    promise3: 'ونبني بيت شبهنا',
    ringTitle: 'عملته مخصوص علشانك',
    ringNote: 'من الأول وقلبي عارف إنها إنتِ',
    question: 'تتجوزيني يا {recipient}؟',
    questionBy: 'وتفضلي ليّا للأبد',
    finale: 'العمر كله يبدأ من دلوقتي',
    finaleBody: 'مش قادر أستنى أعيش حياتي كلها معاكي.. تحت كل نجمة',
  },
} satisfies Record<Loc, Record<string, string>>;

function definition(loc: Loc): TemplateDefinitionInput {
  const look = LOOK[loc];
  const c = COPY[loc];
  const id = IDS[loc];
  const t = (key: string, label: readonly [string, string], value: string, opts?: Parameters<typeof text>[4]) =>
    text(loc, key, label, value, opts);

  return {
    version: 1,
    locale: loc,
    direction: loc === 'ar' ? 'rtl' : 'ltr',
    theme: theme(look),
    scenes: [
      {
        id: 'cover',
        type: 'Cover',
        transitionIn: enter('blurIn', 1400),
        holdMs: 4500,
        ornament: frame(look, 0.7),
        decoration: { effect: 'stars', intensity: 'medium', color: look.accent },
        style: { headingSize: 'lg', headingColor: look.headingInk, bodyColor: look.accent },
        slots: [
          t('heading', LABEL.coverHeading, c.heading, { required: true, maxLen: 56, animation: 'blurIn' }),
          t('subheading', LABEL.coverSub, c.sub, { maxLen: 60, animation: 'fade' }),
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
          t('message', LABEL.letterBody, c.letter, { required: true, maxLen: 420 }),
          t('signoff', LABEL.letterSign, c.sign, { maxLen: 40 }),
        ],
      },
      {
        id: id.photo,
        type: 'PhotoReveal',
        transitionIn: enter('rise', 1100),
        holdMs: 4600,
        ornament: PLAIN,
        style: { imageStyle: 'arch', headingColor: look.accent, headingSize: 'md' },
        slots: [
          photo('image', LABEL.photo, { aspect: '3:4' }),
          t('caption', LABEL.caption, c.caption, { maxLen: 56, animation: 'rise' }),
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
          photo('gallery', LABEL.gallery, { aspect: '3:4', max: 6 }),
        ],
      },
      {
        id: 'promises',
        type: 'TextReveal',
        transitionIn: enter('rise'),
        holdMs: 5000,
        ornament: PLAIN,
        style: { headingColor: look.headingInk, bodyColor: look.accent, headingSize: 'md' },
        slots: [
          t('line1', LABEL.line1, c.promise1, { required: true, maxLen: 60 }),
          t('line2', LABEL.line2, c.promise2, { maxLen: 60 }),
          t('line3', LABEL.line3, c.promise3, { maxLen: 60 }),
        ],
      },
      {
        id: id.ring,
        type: 'GiftReveal',
        transitionIn: enter('glow', 1100),
        holdMs: 4600,
        ornament: PLAIN,
        decoration: { effect: 'glow', intensity: 'medium', color: look.accent, emoji: '💍' },
        style: { headingColor: look.headingInk, bodyColor: look.accent, headingSize: 'lg', imageStyle: 'circle' },
        slots: [
          t('heading', LABEL.giftTitle, c.ringTitle, { required: true, maxLen: 40 }),
          t('body', LABEL.giftNote, c.ringNote, { maxLen: 110 }),
          photo('image', LABEL.giftPhoto, { aspect: '1:1' }),
        ],
      },
      {
        id: id.question,
        type: 'Quote',
        transitionIn: enter('blurIn', 1400),
        holdMs: 5500,
        ornament: PLAIN,
        decoration: { effect: 'sparkles', intensity: 'medium', color: look.accent },
        style: { headingColor: look.accent, bodyColor: look.ink, headingSize: 'xl' },
        slots: [
          t('message', ['The question', 'السؤال'], c.question, { required: true, maxLen: 120 }),
          t('attribution', ['Line under the question', 'سطر تحت السؤال'], c.questionBy, { maxLen: 40 }),
        ],
      },
      {
        id: 'finale',
        type: 'Finale',
        transitionIn: enter('glow', 1200),
        holdMs: 6000,
        ornament: frame(look, 0.7),
        decoration: { effect: 'fireworks', intensity: 'medium' },
        style: { headingSize: 'xl', headingColor: look.accent, bodyColor: look.ink },
        slots: [
          t('heading', LABEL.finaleHeading, c.finale, { required: true, maxLen: 44, animation: 'glow' }),
          t('body', LABEL.finaleBody, c.finaleBody, { maxLen: 110 }),
        ],
      },
    ],
  };
}

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
  definition: definition('en'),
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
    'https://images.unsplash.com/photo-1512163143273-bde0e3cc7407?auto=format&fit=crop&w=800&q=70',
  mvp: false,
  definition: definition('ar'),
};
