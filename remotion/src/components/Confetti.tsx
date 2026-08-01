import React from "react";
import {
  AbsoluteFill,
  interpolate,
  random,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { confettiColors } from "../brand";

type Piece = {
  seed: string;
  x: number;
  size: number;
  delay: number;
  duration: number;
  drift: number;
  rotateSpeed: number;
  color: string;
  round: boolean;
};

const buildPieces = (count: number, width: number): Piece[] =>
  new Array(count).fill(0).map((_, i) => {
    const s = `confetti-${i}`;
    return {
      seed: s,
      x: random(s + "x") * width,
      size: 8 + random(s + "size") * 16,
      delay: random(s + "delay") * 40,
      duration: 80 + random(s + "dur") * 70,
      drift: (random(s + "drift") - 0.5) * 260,
      rotateSpeed: (random(s + "rot") - 0.5) * 12,
      color: confettiColors[Math.floor(random(s + "col") * confettiColors.length)],
      round: random(s + "shape") > 0.55,
    };
  });

/**
 * Deterministic confetti rain. `burst` makes pieces fountain up first, then fall,
 * for celebratory beats; otherwise it's a gentle continuous fall.
 */
export const Confetti: React.FC<{ count?: number; burst?: boolean }> = ({
  count = 70,
  burst = false,
}) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const pieces = React.useMemo(() => buildPieces(count, width), [count, width]);

  return (
    <AbsoluteFill>
      {pieces.map((p) => {
        const local = frame - p.delay;
        if (local < 0) return null;
        const progress = (local % p.duration) / p.duration;

        const fallY = interpolate(progress, [0, 1], [-60, height + 60]);
        const burstY = burst
          ? interpolate(
              progress,
              [0, 0.25, 1],
              [height * 0.6, height * 0.15, height + 60]
            )
          : fallY;
        const y = burst ? burstY : fallY;
        const x =
          p.x + interpolate(progress, [0, 1], [0, p.drift]) +
          Math.sin((local / 14) + p.x) * 14;
        const rotate = local * p.rotateSpeed;
        const opacity = interpolate(progress, [0, 0.08, 0.85, 1], [0, 1, 1, 0]);

        return (
          <div
            key={p.seed}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: p.size,
              height: p.round ? p.size : p.size * 0.6,
              backgroundColor: p.color,
              borderRadius: p.round ? "50%" : 2,
              opacity,
              transform: `rotate(${rotate}deg)`,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};
