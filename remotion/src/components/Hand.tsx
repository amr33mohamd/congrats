import React from "react";
import { Img, staticFile } from "remotion";

/**
 * Pointing hand — Microsoft Fluent Emoji 3D (MIT, see
 * public/hands/LICENSE-fluentui-emoji.txt), placed so the fingertip lands
 * exactly on (x, y). `variant` "down" points at something below (end cards).
 * `angle` tilts it around the fingertip; `press` 0..1 squashes it for a tap.
 */
const HANDS = {
  up: { src: "hands/backhand_index_pointing_up_3d.png", tip: [100, 18] },
  down: { src: "hands/backhand_index_pointing_down_3d.png", tip: [156, 237] },
} as const;

export const HandGraphic: React.FC<{
  x: number;
  y: number;
  angle?: number;
  press?: number;
  size?: number;
  zIndex?: number;
  variant?: keyof typeof HANDS;
}> = ({ x, y, angle = 0, press = 0, size = 1.55, zIndex = 10, variant = "up" }) => {
  const h = HANDS[variant];
  const k = 1.25 * (size / 1.55); // ~320px wide at the default size
  const [tx, ty] = h.tip;
  return (
    <Img
      src={staticFile(h.src)}
      style={{
        position: "absolute",
        left: x - tx * k,
        top: y - ty * k,
        width: 256 * k,
        height: 256 * k,
        transform: `rotate(${angle}deg) scale(${1 - press * 0.08})`,
        transformOrigin: `${tx * k}px ${ty * k}px`,
        zIndex,
        filter: "drop-shadow(0 16px 22px rgba(0,0,0,0.35))",
      }}
    />
  );
};

/** White ring that expands from a tap point. `t` runs 0..1. */
export const TapRipple: React.FC<{ x: number; y: number; t: number }> = ({ x, y, t }) =>
  t <= 0 || t >= 1 ? null : (
    <div
      style={{
        position: "absolute",
        left: x - 60,
        top: y - 60,
        width: 120,
        height: 120,
        borderRadius: 60,
        border: "5px solid rgba(255,255,255,0.9)",
        transform: `scale(${0.3 + t * 1.2})`,
        opacity: 1 - t,
        zIndex: 9,
      }}
    />
  );
