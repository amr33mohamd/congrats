import type { BoundExperience } from '@/lib/template-contract';

/**
 * A self-contained BoundExperience used by the landing-page mini Player demo.
 * No backend needed — it renders the real Player generically. Recipient name is
 * passed in so the hero can localize it.
 */
export function buildDemoExperience(
  locale: 'ar' | 'en',
  recipientName: string,
): BoundExperience {
  const isAr = locale === 'ar';
  const t = (en: string, ar: string) => (isAr ? ar : en);

  return {
    experienceId: 'demo',
    templateId: 'demo-template',
    locale,
    direction: isAr ? 'rtl' : 'ltr',
    recipientName,
    theme: {
      palette: ['#F0436E', '#AE1F44'],
      accent: '#D6A435',
    },
    scenes: [
      {
        id: 'cover',
        type: 'Cover',
        transitionIn: { preset: 'zoom', durationMs: 900, delayMs: 0 },
        holdMs: 2600,
        slots: [],
      },
      {
        id: 'text',
        type: 'TextReveal',
        transitionIn: { preset: 'typewriter', durationMs: 800, delayMs: 0 },
        holdMs: 2800,
        slots: [{ key: 'heading', type: 'text', editable: true, required: false, animation: 'typewriter' }],
      },
      {
        id: 'gift',
        type: 'GiftReveal',
        transitionIn: { preset: 'flip', durationMs: 900, delayMs: 0 },
        holdMs: 2600,
        slots: [],
      },
      {
        id: 'finale',
        type: 'Finale',
        transitionIn: { preset: 'zoom', durationMs: 900, delayMs: 0 },
        holdMs: 3200,
        slots: [],
      },
    ],
    steps: [
      {
        templateStepId: 'cover',
        orderIndex: 0,
        text: {
          heading: t('A little surprise for', 'مفاجأة صغيرة لـ'),
          body: '{recipient} 💛',
        },
        media: [],
        animationConfig: {},
      },
      {
        templateStepId: 'text',
        orderIndex: 1,
        text: {
          heading: t('You make every day brighter', 'تجعلين كل يوم أجمل'),
        },
        media: [],
        animationConfig: {},
      },
      {
        templateStepId: 'gift',
        orderIndex: 2,
        text: {
          heading: t('Here is something for you', 'لديّ شيء من أجلك'),
          body: t('Tap to keep going', 'اضغط للمتابعة'),
        },
        media: [],
        animationConfig: {},
      },
      {
        templateStepId: 'finale',
        orderIndex: 3,
        text: {
          heading: t('Congratulations, {recipient}!', 'مبروك يا {recipient}!'),
          body: t('Made with Congrats', 'صُنع بواسطة Congrats'),
        },
        media: [],
        animationConfig: {},
      },
    ],
  };
}
