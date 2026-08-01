import { fontStackAr, fontStackEn } from "./brand";

export type AdCopy = {
  lang: "en" | "ar";
  rtl: boolean;
  font: string;
  hook: string;
  occasion: string;
  greeting: string;
  name: string;
  emoji: string;
  steps: [string, string, string];
  closer: string;
  tagline: string;
  cta: string;
  url: string;
};

export const EN: AdCopy = {
  lang: "en",
  rtl: false,
  font: fontStackEn,
  hook: "Some moments deserve more than a text.",
  occasion: "Happy Birthday",
  greeting: "For someone special,",
  name: "Mariam",
  emoji: "🎂",
  steps: ["Pick an occasion", "Make it personal", "Share one link"],
  closer: "Send a moment they'll never forget.",
  tagline: "Animated congratulations, made in minutes.",
  cta: "Start free",
  url: "congrats.app",
};

export const AR: AdCopy = {
  lang: "ar",
  rtl: true,
  font: fontStackAr,
  hook: "في لحظات بتستاهل أكتر من رسالة.",
  occasion: "كل سنة وإنت طيب",
  greeting: "لحد غالي عليك،",
  name: "مريم",
  emoji: "🎂",
  steps: ["اختار المناسبة", "خليها على ذوقك", "ابعت لينك واحد"],
  closer: "ابعت لحظة مش هينسوها.",
  tagline: "تهنئة متحركة، جاهزة في دقائق.",
  cta: "ابدأ مجانًا",
  url: "congrats.app",
};
