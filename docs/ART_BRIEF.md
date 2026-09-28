# Invitation art brief

Each wedding-invitation style in `content/templates/invitation.ts` currently
draws its ornaments as vector line-work. That works, but painted illustration
(watercolour florals, carved gold frames) is what makes the reference
invitations feel premium. This brief is everything needed to commission that
art, or to generate it with a tool whose licence allows commercial use.

**Licensing:** whatever you use must be cleared for use *inside a product you
sell*. Adobe Firefly (trained on licensed/public-domain content, commercial use
permitted) or a commissioned illustrator with a written licence are safe
routes. Do not use art downloaded from other invitation sites.

## What each style needs

Four files per style. All are optional — anything missing falls back to the
vector ornament automatically.

| Slot | File | Size | Notes |
| --- | --- | --- | --- |
| `corner` | `corner.png` | 1200×1200, **transparent** | A floral cluster designed for the **top-left** corner, bleeding off the top and left edges. The engine rotates a copy 180° for the bottom-right. |
| `divider` | `divider.png` | 1200×160, **transparent** | Horizontal flourish with a centre motif, symmetric, drawn under every section heading. |
| `frame` | `frame.png` | 1080×1920, **transparent centre** | Optional full-card border. Keep the middle 70% empty for text. |
| `texture` | `texture.jpg` | 1024×1024, **seamless tile** | Paper / damask surface. Must tile with no visible seam. |

Put files in `public/art/<style-key>/` and set the style's `art` field, e.g.:

```ts
art: {
  corner: '/art/qasr-gold/corner.png',
  divider: '/art/qasr-gold/divider.png',
  texture: '/art/qasr-gold/texture.jpg',
},
```

Then run `npm run db:seed` so the catalog picks the paths up.

## Styles and prompts

The palette hex values match the template, so the art lands on the right
colours. For Firefly, add: *"isolated on transparent background, no text, no
people, high detail, print quality"*.

### `qasr-gold` — Qasr Gold (cream + gold palace)
Palette: cream `#F6EEDC`, sand `#EADCBE`, gold `#9C7A34`, ink `#4A3418`.
- **corner:** "Ornate Moroccan palace arch fragment with gold filigree, white
  gardenias and pale green leaves, hanging brass lantern, watercolour, warm
  cream and antique gold"
- **divider:** "Symmetrical gold Islamic geometric flourish with a small
  eight-point star in the centre, thin elegant line art"
- **texture:** "Seamless warm cream handmade paper texture with subtle gold
  flecks"

### `baroque-noir` — Baroque Noir (burgundy + antique gold)
Palette: burgundy `#2A0E1B`, deep `#160408`, ivory `#F5EFE6`, gold `#C9A227`.
- **corner:** "Baroque carved ivory scrollwork frame corner with deep red
  peonies and cream roses, gold accents, rich watercolour"
- **divider:** "Symmetrical baroque acanthus scroll divider with a single red
  rose in the centre, ivory and gold"
- **texture:** "Seamless dark burgundy damask brocade fabric texture, subtle"

### `ivory-arch` — Ivory Arch (midnight navy + champagne gold)
Palette: navy `#101A2E`, deep `#0A1120`, ivory `#F7F2E8`, champagne `#D9B778`.
- **corner:** "Champagne gold line-art botanical corner, delicate olive
  branches and small white flowers, on dark navy"
- **divider:** "Thin champagne gold art-deco divider with a centre diamond"
- **texture:** "Seamless midnight navy velvet texture with faint gold dust"

### `sage-garden` — Sage Garden (ivory + sage + muted gold)
Palette: ivory `#F7F4EC`, sage `#E4E7DA`, olive ink `#37402F`, gold `#A98E4F`.
- **corner:** "Loose watercolour eucalyptus and white garden roses corner
  arrangement, sage green, soft and airy"
- **divider:** "Delicate hand-drawn olive branch divider, symmetrical, sage
  and muted gold"
- **texture:** "Seamless soft ivory watercolour paper texture"

### `blue-porcelain` — Blue Porcelain (ivory + porcelain blue)
Palette: ivory `#F6F4EF`, mist `#E6EAF2`, navy ink `#1F3358`, blue `#4A6FA5`.
- **corner:** "Chinoiserie porcelain blue florals and birds corner, blue and
  white ceramic painting style"
- **divider:** "Symmetrical porcelain-blue floral scroll divider"
- **texture:** "Seamless off-white glazed ceramic texture, very subtle"

## Commissioning an illustrator

Send this document plus a screenshot of the style from `/templates`. Ask for:
layered PSD/AI source files, the PNG/JPG exports above, and a written licence
granting perpetual commercial use within a SaaS product (including
modification). Budget typically scales with the number of styles; one style is
a sensible pilot.
