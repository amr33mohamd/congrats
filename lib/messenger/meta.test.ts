import { createHmac } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { parseWebhook, splitReply, verifySignature } from './meta';

const sign = (body: string, secret: string) => `sha256=${createHmac('sha256', secret).update(body).digest('hex')}`;

describe('verifySignature', () => {
  const body = JSON.stringify({ object: 'page', entry: [] });

  it('accepts a body signed with the app secret', () => {
    expect(verifySignature(body, sign(body, 's3cret'), 's3cret')).toBe(true);
  });

  it('rejects a wrong secret, a tampered body, or a missing header', () => {
    expect(verifySignature(body, sign(body, 'other'), 's3cret')).toBe(false);
    expect(verifySignature(body + ' ', sign(body, 's3cret'), 's3cret')).toBe(false);
    expect(verifySignature(body, null, 's3cret')).toBe(false);
    expect(verifySignature(body, 'sha256=zz', 's3cret')).toBe(false);
  });

  it('rejects everything when no app secret is configured', () => {
    expect(verifySignature(body, sign(body, ''), undefined)).toBe(false);
  });
});

describe('parseWebhook', () => {
  const page = { pageId: 'PAGE', appId: 'APP' };

  it('reads a customer message with an image', () => {
    const events = parseWebhook(
      {
        object: 'page',
        entry: [
          {
            messaging: [
              {
                sender: { id: 'U1' },
                recipient: { id: 'PAGE' },
                timestamp: 1000,
                message: { mid: 'm1', text: 'احمد وسارة', attachments: [{ type: 'image', payload: { url: 'https://x/i.jpg' } }] },
              },
            ],
          },
        ],
      },
      page,
    );
    expect(events).toEqual([{ kind: 'message', psid: 'U1', mid: 'm1', text: 'احمد وسارة', imageUrls: ['https://x/i.jpg'], at: 1000 }]);
  });

  it('tells our own echoes from a person replying in Business Suite', () => {
    const echo = (app_id?: string) => ({
      object: 'page',
      entry: [{ messaging: [{ sender: { id: 'PAGE' }, recipient: { id: 'U1' }, message: { mid: 'e1', is_echo: true, app_id, text: 'hi' } }] }],
    });
    expect(parseWebhook(echo('APP'), page)[0]).toMatchObject({ kind: 'echo', psid: 'U1', fromThisApp: true });
    expect(parseWebhook(echo(), page)[0]).toMatchObject({ kind: 'echo', psid: 'U1', fromThisApp: false });
  });

  it('reads new comments and skips the Page’s own and edits', () => {
    const change = (value: object) => ({ object: 'page', entry: [{ changes: [{ field: 'feed', value }] }] });
    const base = { item: 'comment', verb: 'add', comment_id: 'c1', post_id: 'p1', message: 'محمد ورحمه', from: { id: 'F1', name: 'Om Zamzam' } };
    expect(parseWebhook(change(base), page)[0]).toMatchObject({ kind: 'comment', commentId: 'c1', fromName: 'Om Zamzam', isReply: false });
    expect(parseWebhook(change({ ...base, parent_id: 'c0' }), page)[0]).toMatchObject({ isReply: true });
    expect(parseWebhook(change({ ...base, from: { id: 'PAGE' } }), page)).toEqual([]);
    expect(parseWebhook(change({ ...base, verb: 'edited' }), page)).toEqual([]);
  });

  it('ignores payloads that are not for a Page', () => {
    expect(parseWebhook({ object: 'instagram', entry: [] }, page)).toEqual([]);
    expect(parseWebhook(null, page)).toEqual([]);
  });
});

describe('splitReply', () => {
  it('sends each paragraph as a message and every link alone', () => {
    const text = 'ألف مبروك 🤍 دي دعوتكم بأساميكم\nhttps://congrats.example/ar/t/x?names=a\n\nعجبتك؟';
    expect(splitReply(text)).toEqual([
      'ألف مبروك 🤍 دي دعوتكم بأساميكم',
      'https://congrats.example/ar/t/x?names=a',
      'عجبتك؟',
    ]);
  });

  it('caps the number of messages', () => {
    expect(splitReply('a\n\nb\n\nc\n\nd\n\ne', 3)).toEqual(['a', 'b', 'c']);
  });
});
