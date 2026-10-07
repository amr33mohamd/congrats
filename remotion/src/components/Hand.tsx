import React from "react";

/**
 * Illustrated pointing hand with a shirt cuff and sleeve, drawn so the
 * fingertip lands exactly on (x, y). `angle` tilts it around the fingertip
 * (0 = pointing up); `press` 0..1 squashes it slightly for a tap.
 */
export const HandGraphic: React.FC<{
  x: number;
  y: number;
  angle?: number;
  press?: number;
  size?: number;
  zIndex?: number;
}> = ({ x, y, angle = -14, press = 0, size = 1.55, zIndex = 10 }) => {
  const S = size;
  // Fingertip sits at (98, 6) in the 200×430 drawing.
  return (
    <svg
      width={200 * S}
      height={430 * S}
      viewBox="0 0 200 430"
      style={{
        position: "absolute",
        left: x - 98 * S,
        top: y - 6 * S,
        transform: `rotate(${angle}deg) scale(${1 - press * 0.08})`,
        transformOrigin: `${98 * S}px ${6 * S}px`,
        zIndex,
        filter: "drop-shadow(0 18px 24px rgba(0,0,0,0.35))",
      }}
    >
      <defs>
        <linearGradient id="hand-skin" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#F6D2B3" />
          <stop offset="1" stopColor="#E3AE88" />
        </linearGradient>
        <linearGradient id="hand-sleeve" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2A3550" />
          <stop offset="1" stopColor="#1B2236" />
        </linearGradient>
      </defs>
      <rect x="78" y="2" width="42" height="190" rx="21" fill="url(#hand-skin)" stroke="#C98F69" strokeWidth="2.5" />
      <path d="M86 26 q13 -8 26 0" stroke="#C98F69" strokeWidth="2" fill="none" opacity="0.55" />
      <ellipse cx="99" cy="22" rx="12" ry="13" fill="#FBE3D1" opacity="0.75" />
      <rect x="116" y="150" width="54" height="40" rx="20" fill="url(#hand-skin)" stroke="#C98F69" strokeWidth="2.5" />
      <rect x="118" y="184" width="52" height="38" rx="19" fill="url(#hand-skin)" stroke="#C98F69" strokeWidth="2.5" />
      <rect x="116" y="216" width="48" height="36" rx="18" fill="url(#hand-skin)" stroke="#C98F69" strokeWidth="2.5" />
      <path d="M70 170 Q66 150 82 150 L120 152 Q150 158 158 200 L160 262 Q160 300 132 312 L92 316 Q62 312 56 280 L52 214 Q52 186 70 170 Z" fill="url(#hand-skin)" stroke="#C98F69" strokeWidth="2.5" />
      <path d="M60 214 Q34 200 30 176 Q28 160 44 160 Q58 162 70 186 L80 214 Z" fill="url(#hand-skin)" stroke="#C98F69" strokeWidth="2.5" />
      <rect x="50" y="296" width="116" height="30" rx="8" fill="#F2EEE8" stroke="#D8D2C8" strokeWidth="2" />
      <path d="M44 320 L172 320 L186 430 L30 430 Z" fill="url(#hand-sleeve)" />
    </svg>
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
