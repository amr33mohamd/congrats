import React from "react";
import { brand } from "../brand";

/**
 * The Congrats logomark — a celebration card with a rising sparkle + confetti.
 * Matches /public/brand/logomark.svg. Size is the square edge in px.
 */
export const Logomark: React.FC<{ size?: number }> = ({ size = 120 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient
          id="lm-rose"
          x1="12"
          y1="8"
          x2="108"
          y2="112"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor={brand.rose} />
          <stop offset="1" stopColor={brand.roseStrong} />
        </linearGradient>
        <linearGradient
          id="lm-card"
          x1="34"
          y1="50"
          x2="86"
          y2="92"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#FFFFFF" />
          <stop offset="1" stopColor={brand.roseTint} />
        </linearGradient>
      </defs>
      <rect x="4" y="4" width="112" height="112" rx="32" fill="url(#lm-rose)" />
      <rect x="34" y="52" width="52" height="40" rx="9" fill="url(#lm-card)" />
      <path
        d="M34 61c0-5 4-9 9-9h34c5 0 9 4 9 9l-23 14a4 4 0 0 1-6 0L34 61z"
        fill="#FFE0E8"
      />
      <path
        d="M34 61l26 16 26-16"
        stroke={brand.roseStrong}
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        opacity="0.55"
      />
      <path
        d="M60 16c2.2 8.2 4.6 10.6 12.8 12.8C64.6 31 62.2 33.4 60 41.6 57.8 33.4 55.4 31 47.2 28.8 55.4 26.6 57.8 24.2 60 16z"
        fill="#FFFFFF"
      />
      <circle cx="40" cy="34" r="4" fill={brand.gold} />
      <circle cx="82" cy="30" r="3.5" fill={brand.gold} />
      <circle cx="30" cy="50" r="3" fill={brand.goldSoft} />
      <circle cx="92" cy="48" r="3.2" fill={brand.goldSoft} />
      <rect
        x="46"
        y="20"
        width="5"
        height="5"
        rx="1.4"
        transform="rotate(20 48.5 22.5)"
        fill={brand.gold}
      />
      <rect
        x="72"
        y="40"
        width="5"
        height="5"
        rx="1.4"
        transform="rotate(-25 74.5 42.5)"
        fill="#FFFFFF"
      />
    </svg>
  );
};
