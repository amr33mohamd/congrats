import { ImageResponse } from 'next/og';

// Default social-share card for the whole app (1200×630). Rendered at build/request
// time by next/og — no binary asset to maintain.
export const runtime = 'nodejs';
export const alt = 'Congrats — Animated greetings, made personal';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'center',
          padding: '80px',
          background: 'linear-gradient(135deg, #AE1F44 0%, #F0436E 55%, #D6A435 100%)',
          color: 'white',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ fontSize: 40, display: 'flex', alignItems: 'center', gap: 16, opacity: 0.95 }}>
          <span>🎉</span>
          <span style={{ fontWeight: 700 }}>Congrats</span>
        </div>
        <div style={{ fontSize: 82, fontWeight: 800, lineHeight: 1.05, marginTop: 40, maxWidth: 900 }}>
          Send a moment they&apos;ll never forget
        </div>
        <div style={{ fontSize: 34, marginTop: 28, opacity: 0.92, maxWidth: 860 }}>
          Personalized animated greetings · share with one link · Arabic &amp; English
        </div>
      </div>
    ),
    { ...size },
  );
}
