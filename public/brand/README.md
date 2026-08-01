# Congrats — Brand Assets 🎉

Logo and identity files for **Congrats / مبروك**.

## The logo

The mark is a **celebration card** with a rising **sparkle + confetti** — it says
"a moment, being sent." It carries the product's core promise: *Send a moment they'll
never forget* / *ابعت لحظة مش هينسوها*.

| File             | What it is                                  | Use                                   |
| ---------------- | ------------------------------------------- | ------------------------------------- |
| `logomark.svg`   | Icon only (squircle, full color)            | App icon, avatars, favicons, social   |
| `logo-en.svg`    | Icon + "Congrats" wordmark + tagline        | Headers, marketing, English contexts  |
| `logo-ar.svg`    | Icon + "مبروك" wordmark + tagline (RTL)      | Headers, marketing, Arabic contexts   |
| `logo-mono.svg`  | Single-color mark (`currentColor`)          | One-color print, watermarks, stamps   |
| `../favicon.svg` | Simplified mark for tiny sizes              | Browser tab favicon                   |

The mono mark inherits `currentColor`, so you can recolor it in CSS:

```html
<span style="color:#AE1F44"><!-- inline logo-mono.svg --></span>
```

## Palette (mirrors `app/globals.css`)

| Token         | Hex       | RGB             | Use                            |
| ------------- | --------- | --------------- | ------------------------------ |
| Brand Rose    | `#F0436E` | 240 · 67 · 110  | Primary, buttons, highlights   |
| Deep Rose     | `#AE1F44` | 174 · 31 · 68   | Gradients, hover, depth        |
| Gold          | `#D6A435` | 214 · 164 · 53  | Accents, confetti, premium     |
| Ink           | `#14100E` | 20 · 16 · 14    | Headings & body text           |
| Cream         | `#FAF8F7` | 250 · 248 · 247 | Backgrounds, surfaces          |

Primary gradient: `linear-gradient(135deg, #F0436E → #AE1F44)`.

## Typography

- **Headings / wordmark:** Fredoka (fallback Poppins) — friendly, rounded.
- **Body:** Poppins / system sans.
- **Arabic:** Cairo / Tajawal — for correct shaping and a warm, modern feel.

## Clear space & minimum size

- Keep clear space around the mark equal to **¼ of its width** on all sides.
- Minimum size: **24px** for the favicon mark, **120px** wide for the full lockups.

## Don'ts

- Don't recolor the full-color mark outside the rose/gold palette.
- Don't stretch, rotate, or add drop shadows to the wordmark.
- Don't place the color logo on busy photos — use `logo-mono.svg` (white) instead.

## Regenerating PNGs

SVGs are the source of truth. To export raster versions (e.g. for stores or email):

```bash
# via headless Chrome
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --headless --screenshot=logomark.png --window-size=512,512 \
  --default-background-color=00000000 "file://$PWD/logomark.svg"
```
