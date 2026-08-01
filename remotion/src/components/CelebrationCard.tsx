import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { brand } from "../brand";
import { Logomark } from "./Logo";

/**
 * A mock of the celebration "experience" a user builds in the product — shown
 * inside a phone-like frame so the ad demonstrates the actual output.
 */
export const CelebrationCard: React.FC<{
  greeting: string;
  name: string;
  occasion: string;
  emoji: string;
  rtl?: boolean;
  fontFamily: string;
  enterAt?: number;
}> = ({ greeting, name, occasion, emoji, rtl, fontFamily, enterAt = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const local = frame - enterAt;

  const pop = spring({ frame: local, fps, config: { damping: 14, mass: 0.8 } });
  const scale = interpolate(pop, [0, 1], [0.8, 1]);
  const nameReveal = spring({
    frame: local - 14,
    fps,
    config: { damping: 16 },
  });
  const emojiFloat = Math.sin(local / 12) * 8;

  return (
    <div
      style={{
        width: 540,
        height: 760,
        borderRadius: 48,
        background: brand.white,
        boxShadow: "0 40px 120px -30px rgba(20,16,14,0.45)",
        border: `2px solid ${brand.roseTint}`,
        transform: `scale(${scale})`,
        opacity: interpolate(pop, [0, 1], [0, 1]),
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        direction: rtl ? "rtl" : "ltr",
      }}
    >
      {/* photo / hero area */}
      <div
        style={{
          height: 380,
          background: `linear-gradient(150deg, ${brand.rose}, ${brand.roseStrong})`,
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ fontSize: 150, transform: `translateY(${emojiFloat}px)` }}>
          {emoji}
        </div>
        <div
          style={{
            position: "absolute",
            top: 26,
            insetInlineStart: 26,
            background: "rgba(255,255,255,0.22)",
            color: brand.white,
            fontFamily,
            fontWeight: 700,
            fontSize: 22,
            padding: "8px 18px",
            borderRadius: 999,
          }}
        >
          {occasion}
        </div>
      </div>

      {/* message area */}
      <div
        style={{
          flex: 1,
          padding: "44px 40px",
          display: "flex",
          flexDirection: "column",
          alignItems: rtl ? "flex-end" : "flex-start",
          justifyContent: "center",
          gap: 14,
          textAlign: rtl ? "right" : "left",
        }}
      >
        <div
          style={{
            fontFamily,
            fontSize: 40,
            fontWeight: 600,
            color: brand.muted,
          }}
        >
          {greeting}
        </div>
        <div
          style={{
            fontFamily,
            fontSize: 76,
            fontWeight: 800,
            color: brand.ink,
            lineHeight: 1,
            transform: `translateY(${interpolate(nameReveal, [0, 1], [24, 0])}px)`,
            opacity: nameReveal,
          }}
        >
          {name}
        </div>
        <div style={{ marginTop: 18, opacity: interpolate(local, [30, 50], [0, 1]) }}>
          <Logomark size={46} />
        </div>
      </div>
    </div>
  );
};
