/**
 * Congrats · تهاني ودعوات brand tokens — mirrored from app/globals.css so the
 * ads stay pixel-consistent with the product UI. Identity reference:
 * docs/brand/brand-guide.md and docs/brand/brand-book.html.
 *
 * The flat keys below (rose, roseStrong, …) are the ones the ads already use;
 * their values are unchanged. The ramps are the full system.
 */
export const roseRamp = {
  50: "#FFF1F4",
  100: "#FFE0E8",
  200: "#FFC2D1",
  300: "#FF8FA8",
  400: "#FA6189",
  500: "#F0436E", // signature
  600: "#D92B5A", // fills that carry white text (4.73:1)
  650: "#C2214F",
  700: "#AE1F44",
  800: "#85173A",
  900: "#5C0F27",
} as const;

export const goldRamp = {
  50: "#FFF8E6",
  100: "#FFEFC7",
  200: "#FFE0A8",
  300: "#E9C667",
  500: "#D6A435",
  600: "#B5862A",
  700: "#8C6620",
} as const;

/** The dark "stage" the product lives on (plum-tinted near-blacks). */
export const nightRamp = {
  950: "#0C0A0B",
  900: "#150C11",
  850: "#1A1518",
  800: "#241D21",
  700: "#30292D",
  500: "#9E9498",
  50: "#F7F4F5",
} as const;

export const brand = {
  rose: roseRamp[500],
  roseFill: roseRamp[600],
  roseStrong: roseRamp[700],
  roseSoft: roseRamp[300],
  roseTint: roseRamp[50],
  gold: goldRamp[500],
  goldLight: goldRamp[300],
  goldSoft: goldRamp[200],
  ink: "#14100E",
  cream: "#FAF8F7",
  creamWarm: "#FFF7F3", // the arch in the logomark
  white: "#FFFFFF",
  muted: "#8C817B",
  night: nightRamp[900],
  nightPage: nightRamp[950],
  faience: "#4FC3C9", // Egyptian turquoise — info / illustration accent
} as const;

export const roseGradient = `linear-gradient(135deg, ${brand.rose} 0%, ${brand.roseStrong} 100%)`;
export const creamGradient = `linear-gradient(160deg, ${brand.cream} 0%, ${brand.roseTint} 100%)`;
export const goldGradient = `linear-gradient(135deg, #F6DC8C 0%, ${brand.gold} 55%, ${goldRamp[600]} 100%)`;
/** Night stage with the rose + gold "celebration light" (matches the site hero). */
export const stageGradient =
  `radial-gradient(75% 55% at 50% 8%, ${brand.rose}6B, transparent 68%),` +
  `radial-gradient(45% 45% at 88% 78%, ${brand.gold}4D, transparent 70%),` +
  `${brand.night}`;

// Latin: Fredoka headings/display; Arabic: Cairo headings, IBM Plex Sans Arabic
// body, Aref Ruqaa for short festive display lines (e.g. "تهاني ودعوات").
export const fontStackEn =
  "'Fredoka', 'Poppins', 'Segoe UI', system-ui, sans-serif";
export const fontStackAr =
  "'Cairo', 'Tajawal', 'Segoe UI', system-ui, sans-serif";
export const fontStackArBody =
  "'IBM Plex Sans Arabic', 'Cairo', 'Segoe UI', system-ui, sans-serif";
export const fontStackArDisplay =
  "'Aref Ruqaa', 'Cairo', serif";

export const confettiColors = [
  brand.rose,
  brand.roseSoft,
  brand.gold,
  brand.goldSoft,
  brand.white,
];
