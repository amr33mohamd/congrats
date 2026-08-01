# Template Authoring Guide (engine v2)

A template is a `CatalogTemplate` (see `_helpers.ts`) whose `definition` satisfies the
zod contract in `lib/template-contract.ts`. Authoring uses the **input** shape, so any
field with a default is OPTIONAL — only set what you want. The catalog is validated at
module load (`index.ts`), so a contract violation throws at seed/build time.

**Reference implementation:** `content/templates/birthday.ts` (`birthdayEn`) uses every
feature below. Match its quality and structure.

## Hard rules (do NOT break)

- Keep each template's `slug`, `category`, `locale`, `direction`, `isPaid`,
  `pricePiastres`, `currency` exactly as they are.
- Keep every scene `id` and every slot `key` stable (experiences bind to them).
  You MAY change a scene's `type`, copy, animations, `holdMs`, and add
  `background`/`decoration`/`style`. You may add NEW scenes (new ids) but keep the
  existing ones.
- Arabic templates: `defaultAr` only (no `defaultEn`); LTR English: `defaultEn` only.
- Add a `thumbnailUrl` (Unsplash) to every template.
- Every template MUST look clearly different from the others: different palette,
  fonts, background style, decoration effect, and animation mix.

## Scene types

`Cover` `PhotoReveal` `TextReveal` `Countdown` `Gallery` `GiftReveal` `Finale`
`Quote` (big stylized quote + optional attribution — 2 text slots)
`Letter` (handwritten-note card on a light panel — 1 heading + body lines)

## Animation presets (transitionIn.preset and slot.animation)

`fade` `slideStart` `slideEnd` `typewriter` `zoom` `parallax` `confettiBurst` `flip`
`rise` `blurIn` `glow` `bounce` `float` `kenBurns` `shimmer`

## theme

```ts
theme: {
  palette: ['#bg', '#primary', '#text', '#accent'],   // hex strings
  fontHeading: 'Playfair Display',   // see font list below
  fontBody: 'Poppins',
  accent: '#FBBF24',
  music: 'soft-piano',
  textColor: '#FFFFFF',              // default text color for scenes
  background: { ... },               // default bg for scenes w/o their own
  decoration: { ... },               // default ambient effect for the experience
}
```

## Per-scene `background`

```ts
background: {
  type: 'gradient' | 'solid' | 'radial' | 'image' | 'pattern',
  colors: ['#a', '#b', '#c'],        // gradient/solid/radial stops
  angle: 160,                        // gradient angle (deg)
  imageUrl: 'https://images.unsplash.com/photo-XXXX?auto=format&fit=crop&w=1200&q=70',
  overlay: 'linear-gradient(180deg, rgba(0,0,0,0.3), rgba(0,0,0,0.6))', // legibility over images
  pattern: 'dots' | 'grid' | 'diagonal' | 'confettiDots' | 'noise',
  kenBurns: true,                    // slow cinematic zoom on image bg
  blurPx: 4,
}
```

Images degrade gracefully: if an Unsplash URL fails, the gradient `colors` base shows
through. ALWAYS provide `colors` alongside an image so the fallback looks intentional.

## Per-scene `decoration` (ambient particles)

```ts
decoration: {
  effect: 'confetti'|'hearts'|'petals'|'sparkles'|'snow'|'balloons'|'stars'|'bubbles'|'fireworks'|'glow'|'emoji'|'none',
  intensity: 'low'|'medium'|'high',
  color: '#FBBF24',                  // for bubbles/glow/sparkles tint
  emoji: '🎁',                       // when effect === 'emoji'
}
```

## Per-scene `style`

```ts
style: {
  textAlign: 'start'|'center'|'end',
  textPosition: 'center'|'top'|'bottom',
  headingColor: '#FFFFFF',
  bodyColor: '#FFFFFF',
  headingSize: 'sm'|'md'|'lg'|'xl'|'2xl',
  headingFont: 'Great Vibes',        // per-scene font override
  imageStyle: 'rounded'|'circle'|'full'|'polaroid'|'card'|'tilt',
}
```

## Supported fonts (loaded on demand)

Sans/rounded: `Inter` `Poppins` `Montserrat` `Quicksand` `Fredoka` `Nunito`
Serif/elegant: `Playfair Display` `Cormorant Garamond` `Marcellus` `Abril Fatface` `Lora` `DM Serif Display`
Script: `Dancing Script` `Great Vibes` `Pacifico` `Sacramento` `Caveat` `Parisienne`
Display: `Bebas Neue`
Arabic: `Cairo` `Tajawal` `Reem Kufi` `Amiri` `Aref Ruqaa` `El Messiri` `Lalezar` `Lateef` `Markazi Text` `Mada` `Harmattan`

Use a font NOT on this list and it falls back to system — so only use these.

## Unsplash images

Format: `https://images.unsplash.com/photo-<ID>?auto=format&fit=crop&w=1200&q=70`
(use `w=800` for thumbnails). Pick photos that match the occasion. Because images
degrade to the gradient, prefer evocative photos but always pair with a `colors` base
and a dark `overlay` so white text stays legible.

## Quality bar

- 6–8 scenes per template, a varied rhythm of types (don't repeat the same type back
  to back), distinct `holdMs` (3500–6000).
- Each scene gets a thoughtful background + (often) a decoration + a style.
- Copy must be warm and human, occasion-appropriate, and native (Arabic = real spoken
  Egyptian warmth, not a translation calque).
- The whole template should feel like one art-directed piece, distinct from siblings.
