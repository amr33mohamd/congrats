import { ImageResponse } from 'next/og';

/**
 * The social-share card (1200×630), shared by every opengraph-image route.
 *
 * Drawn from primitives in the dark brand — near-black stage, rose and gold
 * glows, a small deck of tilted cards echoing the 3D hero — so there is no
 * binary asset to maintain and nothing to fetch at render time.
 *
 * English-only on purpose: next/og (Satori) does not shape Arabic script, so
 * Arabic text would render as disconnected letters. The brand name and the
 * picture carry the card in both locales.
 */

export const ogSize = { width: 1200, height: 630 };
export const ogAlt = 'Congrats — Animated greeting cards & wedding invitations, sent as a link';

function Card({
  left,
  top,
  rotate,
  from,
  to,
  scale = 1,
}: {
  left: number;
  top: number;
  rotate: number;
  from: string;
  to: string;
  scale?: number;
}) {
  return (
    <div
      style={{
        position: 'absolute',
        left,
        top,
        width: 190 * scale,
        height: 338 * scale,
        borderRadius: 26 * scale,
        transform: `rotate(${rotate}deg)`,
        background: `linear-gradient(160deg, ${from} 0%, ${to} 100%)`,
        border: '2px solid rgba(214,164,53,0.45)',
        boxShadow: '0 30px 60px rgba(0,0,0,0.55)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div style={{ width: 70 * scale, height: 2, background: 'rgba(233,198,103,0.9)', display: 'flex' }} />
      <div
        style={{
          marginTop: 18 * scale,
          width: 110 * scale,
          height: 12 * scale,
          borderRadius: 6,
          background: 'rgba(255,255,255,0.85)',
          display: 'flex',
        }}
      />
      <div
        style={{
          marginTop: 10 * scale,
          width: 80 * scale,
          height: 8 * scale,
          borderRadius: 4,
          background: 'rgba(255,255,255,0.5)',
          display: 'flex',
        }}
      />
      <div
        style={{ marginTop: 18 * scale, width: 70 * scale, height: 2, background: 'rgba(233,198,103,0.9)', display: 'flex' }}
      />
    </div>
  );
}

export function renderOgCard(): ImageResponse {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          position: 'relative',
          background: '#0C0A0B',
          backgroundImage:
            'radial-gradient(circle at 78% 22%, rgba(240,67,110,0.45), transparent 45%), radial-gradient(circle at 92% 88%, rgba(214,164,53,0.32), transparent 40%), radial-gradient(circle at 8% 90%, rgba(174,31,68,0.35), transparent 45%)',
          color: 'white',
          fontFamily: 'sans-serif',
        }}
      >
        {/* the deck */}
        <Card left={760} top={150} rotate={-11} from="#3B0F1F" to="#AE1F44" scale={0.9} />
        <Card left={960} top={160} rotate={10} from="#1B1410" to="#6B4E16" scale={0.9} />
        <Card left={850} top={120} rotate={-2} from="#F0436E" to="#7A1330" />

        {/* copy */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: '0 0 0 80px',
            width: 720,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <svg width="64" height="64" viewBox="0 0 120 120">
              <defs>
                <linearGradient id="r" x1="12" y1="8" x2="108" y2="112" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#F0436E" />
                  <stop offset="1" stopColor="#AE1F44" />
                </linearGradient>
              </defs>
              <rect x="4" y="4" width="112" height="112" rx="30" fill="url(#r)" />
              <rect x="32" y="54" width="56" height="40" rx="9" fill="#FFFFFF" />
              <path
                d="M60 18c2.5 9 5 11.5 14 14-9 2.5-11.5 5-14 14-2.5-9-5-11.5-14-14 9-2.5 11.5-5 14-14z"
                fill="#FFFFFF"
              />
              <circle cx="38" cy="36" r="4.5" fill="#D6A435" />
              <circle cx="84" cy="32" r="4" fill="#D6A435" />
            </svg>
            <span style={{ fontSize: 44, fontWeight: 700, letterSpacing: -1 }}>Congrats</span>
          </div>
          <div style={{ fontSize: 68, fontWeight: 800, lineHeight: 1.05, marginTop: 44, letterSpacing: -2 }}>
            Send a moment they&apos;ll never forget
          </div>
          <div style={{ fontSize: 30, marginTop: 26, color: 'rgba(255,255,255,0.72)', lineHeight: 1.3 }}>
            Animated greeting cards &amp; one-page wedding invitations — shared with one link.
          </div>
          <div
            style={{
              display: 'flex',
              marginTop: 34,
              fontSize: 22,
              color: '#E9C667',
              letterSpacing: 1,
            }}
          >
            ARABIC · ENGLISH · NO APP NEEDED
          </div>
        </div>
      </div>
    ),
    { ...ogSize },
  );
}
