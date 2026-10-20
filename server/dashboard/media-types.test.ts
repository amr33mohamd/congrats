import { describe, expect, it } from 'vitest';
import { sniffVideoMime, sniffAudioMime } from './image-sniff';
import { assertMediaBytes, isVideoMedia, latestMusic, normalizeMime } from './media-service';
import { isWellFormedMediaKey } from '@/server/storage';

const ftyp = (brand: string) => Buffer.concat([Buffer.from([0, 0, 0, 0x18]), Buffer.from('ftyp' + brand), Buffer.alloc(16)]);
const MP4 = ftyp('isom');
const MOV = ftyp('qt  ');
const M4A = ftyp('M4A ');
const WEBM = Buffer.from([0x1a, 0x45, 0xdf, 0xa3, 0, 0, 0, 0]);
const MP3_ID3 = Buffer.concat([Buffer.from('ID3'), Buffer.alloc(16)]);
const MP3_FRAME = Buffer.from([0xff, 0xfb, 0x90, 0x64, 0, 0]);
const AAC = Buffer.from([0xff, 0xf1, 0x50, 0x80, 0, 0]);
const OGG = Buffer.concat([Buffer.from('OggS'), Buffer.alloc(16)]);
const WAV = Buffer.concat([Buffer.from('RIFF'), Buffer.alloc(4), Buffer.from('WAVE'), Buffer.alloc(8)]);
const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0]);

describe('video and audio sniffing', () => {
  it('recognises the video containers phones produce', () => {
    expect(sniffVideoMime(MP4)).toBe('video/mp4');
    expect(sniffVideoMime(MOV)).toBe('video/quicktime');
    expect(sniffVideoMime(WEBM)).toBe('video/webm');
    expect(sniffVideoMime(M4A)).toBeNull();
    expect(sniffVideoMime(JPEG)).toBeNull();
    expect(sniffVideoMime(Buffer.from('<html>'))).toBeNull();
  });

  it('recognises common song formats', () => {
    expect(sniffAudioMime(MP3_ID3)).toBe('audio/mpeg');
    expect(sniffAudioMime(MP3_FRAME)).toBe('audio/mpeg');
    expect(sniffAudioMime(AAC)).toBe('audio/aac');
    expect(sniffAudioMime(M4A)).toBe('audio/mp4');
    expect(sniffAudioMime(OGG)).toBe('audio/ogg');
    expect(sniffAudioMime(WAV)).toBe('audio/wav');
    expect(sniffAudioMime(Buffer.from('<svg/>'))).toBeNull();
  });
});

describe('assertMediaBytes', () => {
  it('lets photo slots hold a video but never a song', () => {
    expect(assertMediaBytes(JPEG, 'step_image')).toBe('image/jpeg');
    expect(assertMediaBytes(MOV, 'step_image')).toBe('video/quicktime');
    expect(() => assertMediaBytes(MP3_ID3, 'step_image')).toThrow(/not a supported image or video/);
  });

  it('takes only audio as music (an audio-only MP4 counts)', () => {
    expect(assertMediaBytes(MP3_ID3, 'music')).toBe('audio/mpeg');
    expect(assertMediaBytes(MP4, 'music')).toBe('audio/mp4');
    expect(() => assertMediaBytes(JPEG, 'music')).toThrow(/not a supported song/);
  });

  it('keeps payment proofs to images', () => {
    expect(() => assertMediaBytes(MP4, 'payment_screenshot')).toThrow(/not a supported image/);
  });

  it('applies the per-type size cap', () => {
    const bigVideo = Buffer.alloc(9 * 1024 * 1024);
    MP4.copy(bigVideo);
    expect(assertMediaBytes(bigVideo, 'step_image')).toBe('video/mp4'); // over the photo cap, under video's
    const tooBig = Buffer.alloc(31 * 1024 * 1024);
    MP4.copy(tooBig);
    expect(() => assertMediaBytes(tooBig, 'step_image')).toThrow(/too large/);
    const bigPhoto = Buffer.alloc(9 * 1024 * 1024);
    JPEG.copy(bigPhoto);
    expect(() => assertMediaBytes(bigPhoto, 'step_image')).toThrow(/too large/);
  });
});

describe('media helpers', () => {
  it('normalises the type names phones send', () => {
    expect(normalizeMime('audio/x-m4a')).toBe('audio/mp4');
    expect(normalizeMime('Audio/MP3')).toBe('audio/mpeg');
    expect(normalizeMime('video/mp4; codecs=avc1')).toBe('video/mp4');
  });

  it('accepts minted video and audio keys', () => {
    expect(isWellFormedMediaKey('u1/exp/abc_DEF-1.mp4', 'u1')).toBe(true);
    expect(isWellFormedMediaKey('u1/exp/abc.m4a', 'u1')).toBe(true);
    expect(isWellFormedMediaKey('u1/exp/abc.html', 'u1')).toBe(false);
  });

  it('picks the newest song and flags video rows', () => {
    const t = (ms: number) => new Date(ms);
    const rows = [
      { id: 'a', kind: 'music', createdAt: t(1) },
      { id: 'b', kind: 'step_image', createdAt: t(5) },
      { id: 'c', kind: 'music', createdAt: t(3) },
    ];
    expect(latestMusic(rows)?.id).toBe('c');
    expect(latestMusic([])).toBeUndefined();
    expect(isVideoMedia({ mimeType: 'video/mp4' })).toBe(true);
    expect(isVideoMedia({ mimeType: 'image/png' })).toBe(false);
  });
});
