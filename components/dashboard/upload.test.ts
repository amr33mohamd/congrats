import { afterEach, describe, expect, it, vi } from 'vitest';
import { uploadAndConfirm } from './api-client';

// Regression: every UI upload failed (wrong URL field, no PUT handler, invalid
// kinds). uploadAndConfirm must send bytes to the one-step route with a valid kind.
describe('uploadAndConfirm', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('posts the file to /api/dashboard/media with a real media kind and returns a viewable url', async () => {
    const fetchMock = vi.fn(async (_url: string, init?: RequestInit) => {
      const form = init?.body as FormData;
      expect(form.get('kind')).toBe('payment_screenshot');
      expect(form.get('experienceId')).toBe('exp-1');
      expect(form.get('file')).toBeInstanceOf(File);
      return new Response(
        JSON.stringify({ media: { id: 'm1', bucket: 'payment-proofs', storagePath: 'u1/exp-1/abc.png', width: 10, height: 20 } }),
        { status: 201 },
      );
    });
    vi.stubGlobal('fetch', fetchMock);

    const file = new File([new Uint8Array([0x89, 0x50, 0x4e, 0x47])], 'proof.png', { type: 'image/png' });
    const media = await uploadAndConfirm(file, { kind: 'payment_screenshot', experienceId: 'exp-1' });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe('/api/dashboard/media');
    expect(media).toEqual({ id: 'm1', url: '/api/storage/payment-proofs/u1/exp-1/abc.png', width: 10, height: 20 });
  });

  it("surfaces the server's message when the upload is rejected", async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ error: { message: 'file too large' } }), { status: 400 })));
    const file = new File([new Uint8Array([1])], 'x.png', { type: 'image/png' });
    await expect(uploadAndConfirm(file, { kind: 'step_image' })).rejects.toThrow('file too large');
  });
});
