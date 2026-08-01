# Congrats — Remotion Ad Videos 🎉

Animated marketing videos for **Congrats / مبروك**, built with [Remotion](https://remotion.dev).
The motion language (confetti, spring pops, rose→gold palette) mirrors the product UI so
the ads look like the experiences users actually create.

This is a **self-contained sub-project** — it has its own `package.json` and does **not**
affect the main Next.js app's dependencies.

## Compositions

| ID            | Format            | Size       | Length | Use                                   |
| ------------- | ----------------- | ---------- | ------ | ------------------------------------- |
| `ReelAd-EN`   | Vertical          | 1080×1920  | 15s    | Instagram / TikTok / Stories (EN)     |
| `ReelAd-AR`   | Vertical          | 1080×1920  | 15s    | Instagram / TikTok / Stories (AR)     |
| `Bumper-EN`   | Vertical          | 1080×1920  | 6s     | Short bumper / pre-roll (EN)          |
| `Bumper-AR`   | Vertical          | 1080×1920  | 6s     | Short bumper / pre-roll (AR)          |
| `HeroSpot-EN` | Landscape         | 1920×1080  | 30s    | YouTube / website hero (EN)           |
| `HeroSpot-AR` | Landscape         | 1920×1080  | 30s    | YouTube / website hero (AR)           |

## Quick start

```bash
cd remotion
npm install

# Open the visual studio to preview & tweak every composition live:
npm run studio

# Render individual videos to remotion/out/*.mp4:
npm run render:reel-en
npm run render:reel-ar
npm run render:bumper-en
npm run render:hero-en

# Render everything at once:
npm run render:all

# Export a still poster (e.g. for a thumbnail):
npm run still:poster
```

## Customising the copy

All ad text lives in [`src/copy.ts`](src/copy.ts) — change the recipient name, occasion,
hook, steps, CTA and URL there. To produce per-occasion variants (Wedding, Eid, Graduation…),
duplicate the `EN`/`AR` objects with new `occasion` / `greeting` / `emoji` values and register
a new `<Composition>` in [`src/Root.tsx`](src/Root.tsx) with those `defaultProps`.

You can also override props per-render without editing code:

```bash
remotion render ReelAd-EN out/wedding.mp4 \
  --props='{"copy":{"lang":"en","rtl":false,"font":"Fredoka, sans-serif","occasion":"Just Married","greeting":"To the happy couple,","name":"Omar & Salma","emoji":"💍","hook":"Some moments deserve more than a text.","steps":["Pick an occasion","Make it personal","Share one link"],"closer":"Send a moment they will never forget.","tagline":"Animated congratulations, made in minutes.","cta":"Start free","url":"congrats.app"}}'
```

## Structure

```
src/
  brand.ts                 # palette + fonts mirrored from app/globals.css
  copy.ts                  # EN/AR ad copy (edit me)
  Root.tsx                 # composition registry
  components/
    Logo.tsx               # the Congrats logomark in React/SVG
    Confetti.tsx           # deterministic confetti rain / burst
    CelebrationCard.tsx    # mock of the product's experience card
  ads/
    ReelAd.tsx             # 15s vertical
    BumperAd.tsx           # 6s vertical
    HeroSpot.tsx           # 30s landscape
```

## Notes

- Fonts (Fredoka, Poppins, Cairo) are auto-loaded via `@remotion/google-fonts` — Cairo gives
  proper Arabic shaping for the AR variants.
- Rendering requires a Chrome/Chromium headless shell; Remotion downloads one automatically on
  first render if none is found.
- Output MP4s are H.264 with faststart, ready to upload directly to Meta / TikTok / WhatsApp.
