/**
 * Identify an image by its leading bytes ("magic numbers").
 *
 * The upload routes used to trust the client's declared Content-Type, so any
 * file renamed to .png (HTML, SVG with script, an executable) was stored and
 * later served back under an image MIME. Sniffing the bytes makes the stored
 * type a fact about the file rather than a claim by the uploader.
 *
 * Only the formats we accept are recognised (see ALLOWED_IMAGE_MIME); anything
 * else — including SVG, which can carry script — returns null.
 */
export type SniffedImageMime = 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif';

export function sniffImageMime(bytes: Uint8Array): SniffedImageMime | null {
  const b = bytes;
  // JPEG: FF D8 FF
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'image/jpeg';
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    b.length >= 8 &&
    b[0] === 0x89 &&
    b[1] === 0x50 &&
    b[2] === 0x4e &&
    b[3] === 0x47 &&
    b[4] === 0x0d &&
    b[5] === 0x0a &&
    b[6] === 0x1a &&
    b[7] === 0x0a
  ) {
    return 'image/png';
  }
  // GIF: "GIF87a" / "GIF89a"
  if (
    b.length >= 6 &&
    b[0] === 0x47 &&
    b[1] === 0x49 &&
    b[2] === 0x46 &&
    b[3] === 0x38 &&
    (b[4] === 0x37 || b[4] === 0x39) &&
    b[5] === 0x61
  ) {
    return 'image/gif';
  }
  // WebP: "RIFF" <size> "WEBP"
  if (
    b.length >= 12 &&
    b[0] === 0x52 &&
    b[1] === 0x49 &&
    b[2] === 0x46 &&
    b[3] === 0x46 &&
    b[8] === 0x57 &&
    b[9] === 0x45 &&
    b[10] === 0x42 &&
    b[11] === 0x50
  ) {
    return 'image/webp';
  }
  return null;
}

/* ───────────────────────── video and audio ───────────────────────── */

export type SniffedVideoMime = 'video/mp4' | 'video/quicktime' | 'video/webm';
export type SniffedAudioMime = 'audio/mpeg' | 'audio/mp4' | 'audio/aac' | 'audio/ogg' | 'audio/wav';

const ascii = (b: Uint8Array, from: number, len: number) =>
  b.length >= from + len ? String.fromCharCode(...b.subarray(from, from + len)) : '';

/** ISO base media (MP4 / MOV / M4A): bytes 4–8 are "ftyp", then the major brand. */
function isoBrand(b: Uint8Array): string | null {
  return ascii(b, 4, 4) === 'ftyp' ? ascii(b, 8, 4) : null;
}

/** Audio-only ISO brands; every other ftyp file is treated as video. */
const AUDIO_BRANDS = new Set(['M4A ', 'M4B ', 'M4P ', 'F4A ']);

/** EBML header (WebM / Matroska): 1A 45 DF A3. */
function isEbml(b: Uint8Array): boolean {
  return b.length >= 4 && b[0] === 0x1a && b[1] === 0x45 && b[2] === 0xdf && b[3] === 0xa3;
}

export function sniffVideoMime(bytes: Uint8Array): SniffedVideoMime | null {
  const brand = isoBrand(bytes);
  if (brand) {
    if (AUDIO_BRANDS.has(brand)) return null;
    return brand === 'qt  ' ? 'video/quicktime' : 'video/mp4';
  }
  if (isEbml(bytes)) return 'video/webm';
  return null;
}

export function sniffAudioMime(bytes: Uint8Array): SniffedAudioMime | null {
  const b = bytes;
  // MP3 with an ID3 tag, or a bare MPEG audio frame (11 sync bits, layer != 0).
  if (ascii(b, 0, 3) === 'ID3') return 'audio/mpeg';
  if (b.length >= 2 && b[0] === 0xff && (b[1] & 0xe0) === 0xe0) {
    // ADTS AAC shares the sync word; its layer bits are always 00.
    return (b[1] & 0x06) === 0 ? 'audio/aac' : 'audio/mpeg';
  }
  const brand = isoBrand(b);
  if (brand && AUDIO_BRANDS.has(brand)) return 'audio/mp4';
  if (ascii(b, 0, 4) === 'OggS') return 'audio/ogg';
  if (ascii(b, 0, 4) === 'RIFF' && ascii(b, 8, 4) === 'WAVE') return 'audio/wav';
  return null;
}
