import { describe, it, expect } from 'vitest';
import path from 'node:path';
import os from 'node:os';
import { promises as fs } from 'node:fs';
import { LocalDiskStorageAdapter, assertSafeStorageKey, isWellFormedMediaKey } from './storage';

describe('storage key safety', () => {
  it('rejects traversal and malformed keys', () => {
    for (const k of [
      'u/....//....//x',
      'u/../x',
      '../x',
      '/etc/passwd',
      'u\\..\\x',
      'u//x',
      'u/./x',
      '',
    ]) {
      expect(() => assertSafeStorageKey(k), k).toThrow();
    }
    expect(() => assertSafeStorageKey('u/e/f.png')).not.toThrow();
  });

  it('isWellFormedMediaKey only accepts the minted shape for the owner', () => {
    const uid = '4f1c2b9e-1111-2222-3333-444455556666';
    expect(isWellFormedMediaKey(`${uid}/order/abcDEF_12-3.png`, uid)).toBe(true);
    expect(isWellFormedMediaKey(`${uid}/order/abc.svg`, uid)).toBe(false);
    expect(isWellFormedMediaKey(`${uid}/....//....//package.json`, uid)).toBe(false);
    expect(isWellFormedMediaKey(`other/order/abc.png`, uid)).toBe(false);
  });

  it('LocalDiskStorageAdapter never touches files outside its bucket', async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'storage-test-'));
    const outside = path.join(root, 'secret.txt');
    await fs.writeFile(outside, 'keep me');
    const adapter = new LocalDiskStorageAdapter(path.relative(process.cwd(), path.join(root, 'uploads')));
    await expect(adapter.remove('experience-media', 'u/....//....//secret.txt')).rejects.toThrow();
    await expect(adapter.remove('experience-media', '../../secret.txt')).rejects.toThrow();
    expect(await fs.readFile(outside, 'utf8')).toBe('keep me');
    await fs.rm(root, { recursive: true, force: true });
  });
});
