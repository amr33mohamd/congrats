# Congrats · تهاني ودعوات — Brand Assets

Full identity: [`docs/brand/brand-guide.md`](../../docs/brand/brand-guide.md) ·
visual brand book: [`docs/brand/brand-book.html`](../../docs/brand/brand-book.html).

## The mark — "باب الفرح"

A **Fatimid keel arch** (Cairo's Al-Aqmar / Al-Azhar) opening into a rose squircle, with a
**gold sparkle** inside — the door you're invited through, and the moment of joy. A small gold
finial sits above it. All wordmarks are **outlined paths** (Cairo 800, Fredoka 600, Aref Ruqaa),
so no font is needed to render any file here.

| File | What it is | Use |
| --- | --- | --- |
| `logomark.svg` | Mark, full colour | Default mark ≥ 24 px |
| `favicon.svg` (+ `/favicon.svg`) | Small-size master (bigger arch, no finial) | ≤ 48 px, browser tabs |
| `logo-mono.svg` | One colour, `currentColor`, arch knocked out | Print, stamps, single-ink |
| `logomark-glyph.svg` | Arch + sparkle only, `currentColor` | Watermarks, foil, pattern |
| `logo-ar.svg` / `logo-ar-reverse.svg` | **Primary** Arabic-first lockup: كونجراتس + تهاني ودعوات | Arabic contexts (light / dark bg) |
| `logo-en.svg` / `logo-en-reverse.svg` | Congrats + GREETINGS & INVITATIONS | English contexts |
| `logo-bilingual.svg` / `-reverse` | Congrats + تهاني ودعوات | Social, covers, OG |
| `wordmark-ar.svg`, `wordmark-en.svg` | Wordmark only, `currentColor` | Tight horizontal spaces |
| `app-icon.svg` | Full-bleed 1024 icon (OS masks it) | PWA / stores |
| `social-avatar.svg` | 1080², circle-crop safe | Profile pictures |
| `facebook-cover.svg`, `whatsapp-cover.svg` | 1640×624, 1920×1080 | Covers |
| `pattern-arches.svg` | 80 px tile | Backgrounds at 8–15 % opacity |
| `og-ar.png` | Legacy OG image (unchanged) | |

### PNG exports — `png/`
`favicon-32/48`, `apple-touch-icon-180`, `icon-192/512/1024`, `logomark-512`,
`social-avatar-1080`, `instagram-profile-1080`, `facebook-profile-720`, `whatsapp-profile-640`,
`facebook-cover-1640x624`, `whatsapp-cover-1920x1080`, and every lockup at 1200 px wide.
`/apple-touch-icon.png` (root) is the 180 px icon iOS probes for.

## Rules
- Clear space = ¼ of the mark's width on all sides. Minimums: 16 px (`favicon.svg`), 24 px (`logomark.svg`), 120 px wide (lockups).
- Use `-reverse` lockups on the night stage or on photos with a dark scrim.
- Don't stretch, rotate, recolour the arch, add shadows/outlines, or re-type the wordmark.

## Palette (mirrors `app/globals.css`, `remotion/src/brand.ts`)
Signature Rose `#F0436E` (graphics) · Rose 600 `#D92B5A` (fills with white text) · Rose 700 `#AE1F44` ·
Gold `#D6A435` / `#E9C667` · Night `#150C11` / `#0C0A0B` · Cream `#FAF8F7` · Ink `#14100E` · Faience `#4FC3C9`.
