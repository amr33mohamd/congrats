import React from "react";
import {
  AbsoluteFill,
  interpolate,
  Sequence,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { brand, creamGradient, roseGradient } from "../brand";
import { AdCopy } from "../copy";
import { Confetti } from "../components/Confetti";
import { CelebrationCard } from "../components/CelebrationCard";
import { Logomark } from "../components/Logo";

const FadeUp: React.FC<{
  children: React.ReactNode;
  delay?: number;
  style?: React.CSSProperties;
}> = ({ children, delay = 0, style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - delay, fps, config: { damping: 18 } });
  return (
    <div
      style={{
        transform: `translateY(${interpolate(s, [0, 1], [40, 0])}px)`,
        opacity: s,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

// ── Scene 1 — Hook ──────────────────────────────────────────────────────────
const Hook: React.FC<{ c: AdCopy }> = ({ c }) => (
  <AbsoluteFill
    style={{
      background: creamGradient,
      alignItems: "center",
      justifyContent: "center",
      padding: 90,
      direction: c.rtl ? "rtl" : "ltr",
    }}
  >
    <FadeUp style={{ position: "absolute", top: 120 }}>
      <Logomark size={96} />
    </FadeUp>
    <FadeUp delay={8}>
      <div
        style={{
          fontFamily: c.font,
          fontSize: 92,
          fontWeight: 800,
          color: brand.ink,
          textAlign: "center",
          lineHeight: 1.15,
        }}
      >
        {c.hook}
      </div>
    </FadeUp>
  </AbsoluteFill>
);

// ── Scene 2 — The experience reveal ─────────────────────────────────────────
const Reveal: React.FC<{ c: AdCopy }> = ({ c }) => (
  <AbsoluteFill
    style={{ background: roseGradient, alignItems: "center", justifyContent: "center" }}
  >
    <Confetti count={90} burst />
    <CelebrationCard
      greeting={c.greeting}
      name={c.name}
      occasion={c.occasion}
      emoji={c.emoji}
      rtl={c.rtl}
      fontFamily={c.font}
      enterAt={6}
    />
  </AbsoluteFill>
);

// ── Scene 3 — How it works ──────────────────────────────────────────────────
const Steps: React.FC<{ c: AdCopy }> = ({ c }) => (
  <AbsoluteFill
    style={{
      background: creamGradient,
      alignItems: "center",
      justifyContent: "center",
      gap: 40,
      direction: c.rtl ? "rtl" : "ltr",
    }}
  >
    {c.steps.map((step, i) => (
      <FadeUp key={i} delay={i * 14}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 28,
            background: brand.white,
            borderRadius: 999,
            padding: "26px 50px",
            boxShadow: "0 20px 60px -28px rgba(20,16,14,0.45)",
            width: 760,
            flexDirection: c.rtl ? "row-reverse" : "row",
          }}
        >
          <div
            style={{
              width: 78,
              height: 78,
              borderRadius: "50%",
              background: roseGradient,
              color: brand.white,
              fontFamily: c.font,
              fontWeight: 800,
              fontSize: 44,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            {i + 1}
          </div>
          <div
            style={{ fontFamily: c.font, fontSize: 52, fontWeight: 700, color: brand.ink }}
          >
            {step}
          </div>
        </div>
      </FadeUp>
    ))}
  </AbsoluteFill>
);

// ── Scene 4 — CTA ───────────────────────────────────────────────────────────
const CTA: React.FC<{ c: AdCopy }> = ({ c }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = spring({ frame, fps, config: { damping: 12 } });
  return (
    <AbsoluteFill
      style={{
        background: roseGradient,
        alignItems: "center",
        justifyContent: "center",
        gap: 36,
        direction: c.rtl ? "rtl" : "ltr",
      }}
    >
      <Confetti count={50} />
      <div style={{ transform: `scale(${interpolate(pop, [0, 1], [0.7, 1])})` }}>
        <Logomark size={180} />
      </div>
      <FadeUp delay={10}>
        <div
          style={{
            fontFamily: c.font,
            fontSize: 70,
            fontWeight: 800,
            color: brand.white,
            textAlign: "center",
            maxWidth: 900,
            lineHeight: 1.15,
          }}
        >
          {c.closer}
        </div>
      </FadeUp>
      <FadeUp delay={20}>
        <div
          style={{
            background: brand.white,
            color: brand.roseStrong,
            fontFamily: c.font,
            fontWeight: 800,
            fontSize: 48,
            padding: "26px 64px",
            borderRadius: 999,
            marginTop: 12,
          }}
        >
          {c.cta} · {c.url}
        </div>
      </FadeUp>
    </AbsoluteFill>
  );
};

/** 15s vertical Reels / Stories / TikTok ad (1080×1920 @ 30fps = 450 frames). */
export const ReelAd: React.FC<{ copy: AdCopy }> = ({ copy }) => {
  return (
    <AbsoluteFill style={{ backgroundColor: brand.cream }}>
      <Sequence durationInFrames={90}>
        <Hook c={copy} />
      </Sequence>
      <Sequence from={90} durationInFrames={180}>
        <Reveal c={copy} />
      </Sequence>
      <Sequence from={270} durationInFrames={90}>
        <Steps c={copy} />
      </Sequence>
      <Sequence from={360} durationInFrames={90}>
        <CTA c={copy} />
      </Sequence>
    </AbsoluteFill>
  );
};
