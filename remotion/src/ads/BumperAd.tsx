import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { brand, roseGradient } from "../brand";
import { AdCopy } from "../copy";
import { Confetti } from "../components/Confetti";
import { Logomark } from "../components/Logo";

/** 6s vertical bumper (1080×1920 @ 30fps = 180 frames) — fast brand hit. */
export const BumperAd: React.FC<{ copy: AdCopy }> = ({ copy }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = spring({ frame: frame - 6, fps, config: { damping: 11 } });
  const ctaIn = spring({ frame: frame - 60, fps, config: { damping: 16 } });

  return (
    <AbsoluteFill
      style={{
        background: roseGradient,
        alignItems: "center",
        justifyContent: "center",
        gap: 44,
        direction: copy.rtl ? "rtl" : "ltr",
      }}
    >
      <Confetti count={80} burst />
      <div style={{ transform: `scale(${interpolate(pop, [0, 1], [0.5, 1])})`, opacity: pop }}>
        <Logomark size={220} />
      </div>
      <div
        style={{
          fontFamily: copy.font,
          fontSize: 78,
          fontWeight: 800,
          color: brand.white,
          textAlign: "center",
          maxWidth: 880,
          lineHeight: 1.15,
          transform: `translateY(${interpolate(pop, [0, 1], [30, 0])}px)`,
          opacity: pop,
        }}
      >
        {copy.closer}
      </div>
      <div
        style={{
          background: brand.white,
          color: brand.roseStrong,
          fontFamily: copy.font,
          fontWeight: 800,
          fontSize: 52,
          padding: "26px 66px",
          borderRadius: 999,
          opacity: ctaIn,
          transform: `scale(${interpolate(ctaIn, [0, 1], [0.8, 1])})`,
        }}
      >
        {copy.cta} · {copy.url}
      </div>
    </AbsoluteFill>
  );
};
