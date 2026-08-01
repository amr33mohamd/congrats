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

const Center: React.FC<{
  bg: string;
  rtl?: boolean;
  children: React.ReactNode;
}> = ({ bg, rtl, children }) => (
  <AbsoluteFill
    style={{
      background: bg,
      alignItems: "center",
      justifyContent: "center",
      direction: rtl ? "rtl" : "ltr",
    }}
  >
    {children}
  </AbsoluteFill>
);

const Rise: React.FC<{ children: React.ReactNode; delay?: number }> = ({
  children,
  delay = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - delay, fps, config: { damping: 18 } });
  return (
    <div style={{ transform: `translateY(${interpolate(s, [0, 1], [50, 0])}px)`, opacity: s }}>
      {children}
    </div>
  );
};

/** 30s landscape hero spot (1920×1080 @ 30fps = 900 frames). */
export const HeroSpot: React.FC<{ copy: AdCopy }> = ({ copy }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const ctaPop = spring({ frame: frame - 750, fps, config: { damping: 12 } });

  return (
    <AbsoluteFill style={{ backgroundColor: brand.cream }}>
      {/* Scene 1 — hook (0–5s) */}
      <Sequence durationInFrames={150}>
        <Center bg={creamGradient} rtl={copy.rtl}>
          <Rise>
            <Logomark size={120} />
          </Rise>
          <Rise delay={10}>
            <div
              style={{
                fontFamily: copy.font,
                fontSize: 96,
                fontWeight: 800,
                color: brand.ink,
                textAlign: "center",
                maxWidth: 1400,
                marginTop: 40,
                lineHeight: 1.15,
              }}
            >
              {copy.hook}
            </div>
          </Rise>
        </Center>
      </Sequence>

      {/* Scene 2 — split reveal: card + value prop (5–17s) */}
      <Sequence from={150} durationInFrames={360}>
        <Center bg={roseGradient} rtl={copy.rtl}>
          <Confetti count={80} burst />
          <div
            style={{
              display: "flex",
              flexDirection: copy.rtl ? "row-reverse" : "row",
              alignItems: "center",
              gap: 110,
            }}
          >
            <CelebrationCard
              greeting={copy.greeting}
              name={copy.name}
              occasion={copy.occasion}
              emoji={copy.emoji}
              rtl={copy.rtl}
              fontFamily={copy.font}
              enterAt={10}
            />
            <div style={{ maxWidth: 560, textAlign: copy.rtl ? "right" : "left" }}>
              <Rise delay={26}>
                <div
                  style={{
                    fontFamily: copy.font,
                    fontSize: 70,
                    fontWeight: 800,
                    color: brand.white,
                    lineHeight: 1.2,
                  }}
                >
                  {copy.closer}
                </div>
              </Rise>
              <Rise delay={40}>
                <div
                  style={{
                    fontFamily: copy.font,
                    fontSize: 40,
                    fontWeight: 500,
                    color: "rgba(255,255,255,0.92)",
                    marginTop: 28,
                  }}
                >
                  {copy.tagline}
                </div>
              </Rise>
            </div>
          </div>
        </Center>
      </Sequence>

      {/* Scene 3 — steps (17–25s) */}
      <Sequence from={510} durationInFrames={240}>
        <Center bg={creamGradient} rtl={copy.rtl}>
          <div style={{ display: "flex", gap: 48, flexDirection: copy.rtl ? "row-reverse" : "row" }}>
            {copy.steps.map((step, i) => (
              <Rise key={i} delay={i * 16}>
                <div
                  style={{
                    width: 420,
                    height: 360,
                    background: brand.white,
                    borderRadius: 40,
                    boxShadow: "0 30px 80px -34px rgba(20,16,14,0.45)",
                    padding: 48,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                    gap: 28,
                  }}
                >
                  <div
                    style={{
                      width: 96,
                      height: 96,
                      borderRadius: "50%",
                      background: roseGradient,
                      color: brand.white,
                      fontFamily: copy.font,
                      fontWeight: 800,
                      fontSize: 52,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {i + 1}
                  </div>
                  <div
                    style={{
                      fontFamily: copy.font,
                      fontSize: 46,
                      fontWeight: 700,
                      color: brand.ink,
                      textAlign: "center",
                    }}
                  >
                    {step}
                  </div>
                </div>
              </Rise>
            ))}
          </div>
        </Center>
      </Sequence>

      {/* Scene 4 — CTA (25–30s) */}
      <Sequence from={750} durationInFrames={150}>
        <Center bg={roseGradient} rtl={copy.rtl}>
          <Confetti count={50} />
          <div style={{ transform: `scale(${interpolate(ctaPop, [0, 1], [0.7, 1])})` }}>
            <Logomark size={200} />
          </div>
          <Rise delay={12}>
            <div
              style={{
                background: brand.white,
                color: brand.roseStrong,
                fontFamily: copy.font,
                fontWeight: 800,
                fontSize: 58,
                padding: "30px 80px",
                borderRadius: 999,
                marginTop: 44,
              }}
            >
              {copy.cta} · {copy.url}
            </div>
          </Rise>
        </Center>
      </Sequence>
    </AbsoluteFill>
  );
};
