/**
 * Congrats / مبروك brand tokens — mirrored from app/globals.css so the ads stay
 * pixel-consistent with the product UI.
 */
export const brand = {
  rose: "#F0436E",
  roseStrong: "#AE1F44",
  roseSoft: "#FF8FA8",
  roseTint: "#FFF1F4",
  gold: "#D6A435",
  goldSoft: "#FFE0A8",
  ink: "#14100E",
  cream: "#FAF8F7",
  white: "#FFFFFF",
  muted: "#8C817B",
} as const;

export const roseGradient = `linear-gradient(135deg, ${brand.rose} 0%, ${brand.roseStrong} 100%)`;
export const creamGradient = `linear-gradient(160deg, ${brand.cream} 0%, ${brand.roseTint} 100%)`;

export const fontStackEn =
  "'Fredoka', 'Poppins', 'Segoe UI', system-ui, sans-serif";
export const fontStackAr =
  "'Cairo', 'Tajawal', 'Segoe UI', system-ui, sans-serif";

export const confettiColors = [
  brand.rose,
  brand.roseSoft,
  brand.gold,
  brand.goldSoft,
  brand.white,
];
