import { describe, expect, it } from 'vitest';
import { normalizeTurns, withImages, withoutImages } from './claude';
import { systemPrompt } from './prompt';
import { botMayReply, commentsEnabled, looksAutomated, placeLink } from '@/server/messenger/handle';
import { splitReply } from '@/lib/messenger/meta';

describe('normalizeTurns', () => {
  it('merges consecutive messages and starts with the customer', () => {
    const turns = normalizeTurns([
      { role: 'assistant', text: 'old greeting' },
      { role: 'user', text: 'احمد' },
      { role: 'user', text: 'وسارة' },
      { role: 'assistant', text: 'ألف مبروك' },
      { role: 'user', text: '   ' },
    ]);
    expect(turns).toEqual([
      { role: 'user', content: 'احمد\n\nوسارة' },
      { role: 'assistant', content: 'ألف مبروك' },
    ]);
  });
});

describe('systemPrompt', () => {
  const base = {
    catalog: [{ slug: 'invitation-ivory-arch-ar', title: 'آيفوري', priceEgp: 79 }],
    facts: { names: 'أحمد وسارة' },
    customerName: 'Sara',
    cairoNow: '25 Oct 2026, 14:00',
    isNight: false,
    instapayHandle: 'congrats@instapay',
    fromComment: false,
  };

  it('quotes only database prices and what is already known', () => {
    const p = systemPrompt(base);
    expect(p).toContain('invitation-ivory-arch-ar) — 79 جنيه');
    expect(p).toContain('- names: أحمد وسارة');
    expect(p).toContain('congrats@instapay');
  });

  it('promises a morning reply only at night', () => {
    expect(systemPrompt(base)).not.toContain('هنرد عليك الصبح');
    expect(systemPrompt({ ...base, isNight: true })).toContain('هنرد عليك الصبح');
  });

  it('keeps the honesty rule', () => {
    expect(systemPrompt(base)).toContain('Never claim to be human');
  });
});

describe('botMayReply', () => {
  it('is off unless enabled', () => {
    expect(botMayReply('U1', {})).toBe(false);
    expect(botMayReply('U1', { MESSENGER_BOT_ENABLED: 'true' })).toBe(true);
  });

  it('answers only listed testers while a test list is set', () => {
    const env = { MESSENGER_BOT_ENABLED: 'true', MESSENGER_TEST_PSIDS: 'U1, U2' };
    expect(botMayReply('U2', env)).toBe(true);
    expect(botMayReply('U3', env)).toBe(false);
    expect(botMayReply(null, env)).toBe(false);
  });
});

describe('commentsEnabled', () => {
  it('needs its own switch on top of the bot switch, and stays off while testing', () => {
    expect(commentsEnabled({ MESSENGER_BOT_ENABLED: 'true' })).toBe(false);
    expect(commentsEnabled({ MESSENGER_BOT_ENABLED: 'true', MESSENGER_COMMENTS_ENABLED: 'true' })).toBe(true);
    expect(commentsEnabled({ MESSENGER_BOT_ENABLED: 'true', MESSENGER_COMMENTS_ENABLED: 'true', MESSENGER_TEST_PSIDS: 'U1' })).toBe(false);
    expect(commentsEnabled({ MESSENGER_COMMENTS_ENABLED: 'true' })).toBe(false);
  });
});

describe('looksAutomated', () => {
  const t = (s: number) => new Date(Date.UTC(2026, 9, 25, 20, 0, s));
  it('treats a Page reply seconds after the customer as an automation', () => {
    expect(looksAutomated(t(2), t(0))).toBe(true);
    expect(looksAutomated(t(0), t(1))).toBe(true); // echo processed before the message
  });
  it('treats a later reply, or one with no nearby customer message, as a person', () => {
    expect(looksAutomated(t(40), t(0))).toBe(false);
    expect(looksAutomated(t(2), null)).toBe(false);
  });
});

describe('placeLink', () => {
  const link = 'https://congrats.example/ar/t/x?names=%D8%A3+%D9%88';

  it('puts the exact link where the agent wrote [[LINK]], as its own message', () => {
    const parts = splitReply('ألف مبروك 🤍 دي دعوتكم\n[[LINK]]\n\nعجبتك؟');
    expect(placeLink(parts, link)).toEqual(['ألف مبروك 🤍 دي دعوتكم', link, 'عجبتك؟']);
  });

  it('drops a link the model typed itself and adds the real one after the first message', () => {
    expect(placeLink(['دي دعوتكم', 'https://congrats.example/broken%D8', 'عجبتك؟'], link)).toEqual(['دي دعوتكم', link, 'عجبتك؟']);
  });

  it('leaves replies without a preview alone', () => {
    expect(placeLink(['الساعة كام؟'], null)).toEqual(['الساعة كام؟']);
  });
});

describe('withImages', () => {
  const turns = [
    { role: 'user' as const, content: 'صورة قديمة\n[صورة] https://cdn/old.jpg' },
    { role: 'assistant' as const, content: 'تمام' },
    { role: 'user' as const, content: 'حولت\n[صورة] https://cdn/pay.jpg' },
  ];

  it('shows only the newest customer image to the agent', () => {
    const out = withImages(turns);
    expect(out[0].content).toBe('صورة قديمة\n[أرسل صورة]');
    expect(out[2].content).toEqual([
      { type: 'text', text: 'حولت\n[أرسل صورة]' },
      { type: 'image', source: { type: 'url', url: 'https://cdn/pay.jpg' } },
    ]);
  });

  it('can fall back to text only', () => {
    expect(withoutImages(turns)[2].content).toBe('حولت\n[أرسل صورة]');
  });
});
