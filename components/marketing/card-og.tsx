import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ImageResponse } from 'next/og';
import sharp from 'sharp';
import type { CardPreview } from '@/lib/card-preview';
import { rtlLine, wrapWords, isArabic } from '@/lib/arabic-shape';

/**
 * The link-preview image for one shared card (1200×630), drawn in the card's
 * own colours with its names, line, date and first photo.
 *
 * Arabic goes through lib/arabic-shape (Satori has no Arabic shaping) and is
 * set in Amiri, whose font carries the presentation forms that shaping
 * produces. The PNG Satori makes is re-encoded as JPEG: WhatsApp drops
 * preview images much over a few hundred KB, and a photo makes the PNG large.
 */
export const cardOgSize = { width: 1200, height: 630 };

let fontPromise: Promise<Buffer> | null = null;
const amiri = () => (fontPromise ??= readFile(join(process.cwd(), 'assets/fonts/Amiri-Bold-noGSUB.ttf')));

/** One visual line of text: shaped + visual order for Arabic. */
function Line({ text, style }: { text: string; style: React.CSSProperties }) {
  return <div style={{ display: 'flex', justifyContent: 'center', textAlign: 'center', ...style }}>{rtlLine(text)}</div>;
}

export async function renderCardOg(p: CardPreview, photo: string | null): Promise<Buffer> {
  const { ground, groundDeep, ink, accent, body } = p.colors;
  const rtl = p.locale === 'ar' || isArabic(p.headline);
  const textWidth = photo ? 700 : 1040;

  // Names: one big line when they fit, else two smaller ones.
  const maxChars = photo ? 16 : 24;
  const headLines = wrapWords(p.headline, maxChars, 2);
  const headSize = headLines.length > 1 ? (photo ? 74 : 86) : p.headline.length > maxChars * 0.7 ? 88 : 108;
  const subLines = p.subline ? wrapWords(p.subline, photo ? 34 : 50, 2) : [];

  const text = (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: textWidth }}>
      <Line text={p.kicker} style={{ fontSize: 34, color: accent, letterSpacing: rtl ? 0 : 2 }} />
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 10 }}>
        {headLines.map((l, i) => (
          <Line key={i} text={l} style={{ fontSize: headSize, color: ink, lineHeight: 1.25 }} />
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', marginTop: 18, marginBottom: 18 }}>
        <div style={{ width: 90, height: 2, background: accent, opacity: 0.8, display: 'flex' }} />
        <div style={{ width: 12, height: 12, margin: '0 14px', background: accent, transform: 'rotate(45deg)', display: 'flex' }} />
        <div style={{ width: 90, height: 2, background: accent, opacity: 0.8, display: 'flex' }} />
      </div>
      {subLines.map((l, i) => (
        <Line key={i} text={l} style={{ fontSize: 36, color: body, opacity: 0.92, lineHeight: 1.35 }} />
      ))}
      {p.date ? <Line text={p.date} style={{ fontSize: 32, color: accent, marginTop: 14 }} /> : null}
    </div>
  );

  const png = new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          position: 'relative',
          alignItems: 'center',
          justifyContent: 'center',
          background: `linear-gradient(170deg, ${ground} 0%, ${groundDeep} 100%)`,
          fontFamily: 'Amiri',
        }}
      >
        {/* frame */}
        <div
          style={{
            position: 'absolute',
            top: 26,
            left: 26,
            right: 26,
            bottom: 26,
            border: `2px solid ${accent}`,
            opacity: 0.55,
            borderRadius: 28,
            display: 'flex',
          }}
        />
        <div
          style={{
            display: 'flex',
            flexDirection: rtl ? 'row-reverse' : 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 56,
            width: '100%',
            padding: '0 70px',
          }}
        >
          {photo ? (
            <div
              style={{
                display: 'flex',
                width: 360,
                height: 360,
                borderRadius: 180,
                padding: 8,
                background: accent,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photo} width={344} height={344} style={{ borderRadius: 172, objectFit: 'cover' }} alt="" />
            </div>
          ) : null}
          {text}
        </div>
        <div
          style={{
            position: 'absolute',
            bottom: 44,
            display: 'flex',
            width: '100%',
            justifyContent: 'center',
            fontSize: 24,
            color: body,
            opacity: 0.6,
          }}
        >
          {rtlLine('Congrats · تهاني ودعوات')}
        </div>
      </div>
    ),
    {
      ...cardOgSize,
      fonts: [{ name: 'Amiri', data: await amiri(), weight: 700, style: 'normal' }],
    },
  );
  const buf = Buffer.from(await png.arrayBuffer());
  return sharp(buf).jpeg({ quality: 84, mozjpeg: true }).toBuffer();
}

/** A card photo as a small JPEG data URI for the preview (or null if unreadable). */
export async function photoDataUri(bytes: Buffer): Promise<string | null> {
  try {
    const jpg = await sharp(bytes).rotate().resize(420, 420, { fit: 'cover' }).jpeg({ quality: 82 }).toBuffer();
    return `data:image/jpeg;base64,${jpg.toString('base64')}`;
  } catch {
    return null;
  }
}
