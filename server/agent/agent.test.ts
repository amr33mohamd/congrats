import { describe, expect, it } from 'vitest';
import { normalizeTurns } from './claude';
import { systemPrompt } from './prompt';
import { botMayReply, commentsEnabled } from '@/server/messenger/handle';

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
