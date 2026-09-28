# Template Authoring Guide (one-page cards)

A template is a `CatalogTemplate` (see `_helpers.ts`) whose `definition` satisfies the
zod contract in `lib/template-contract.ts`. The catalog is validated at module load
(`index.ts`), so a contract violation throws at seed/build time. Check it with:

```sh
npx tsx -e "import('./content/templates/index.ts').then(m => console.log(m.CATALOG_STATS))"
```

**Reference implementations:** `anniversary.ts` (greeting card, built with the kit in
`_card.ts`) and `invitation.ts` (wedding invitation factory, 5 styles × AR/EN).

## How a card is read

The Player renders every scene as a section of ONE continuously scrolling card (not
slides). A greeting card reads top to bottom:

> cover → a personal letter → photo / gallery → the occasion's own sections → finale

- **Cover and Finale** are full-height and carry the template's ornament (arch,
  wreath, engraved frame…). Every section in between sets `ornament: { kind: 'none' }`
  — the renderer opens it with a small flourish instead.
- **One continuous ground.** The theme background is painted once for the whole card;
  per-scene non-image backgrounds are ignored by the Player. Don't use stock photos as
  scene backgrounds: they render as panels of strangers on someone's card.
- **Empty sections disappear.** A photo/gallery section with no upload, a countdown
  with no date, and any section whose fields the sender cleared are left out. That is
  how a sender removes an optional section (a party venue they don't need).

## Hard rules (do NOT break)

- Keep each template's `slug`, `category`, `locale`, `direction`, `isPaid`,
  `pricePiastres`, `currency` exactly as they are.
- Keep the `id` of every scene that survives a rewrite, and its slot `key`s (saved
  cards bind text and photos to them). A retired scene is simply dropped; a new scene
  gets a new id. `tests/template-contract.qa.test.ts` pins the kept ids.
- Every text/date slot has `labelEn` + `labelAr` (the builder shows them). Use the
  shared `LABEL` vocabulary in `_card.ts`.
- Photos are never required (`required: false`, `min: 0`) — a card must be publishable
  before any upload.
- Date slots ship with NO default: a fixed date goes stale. The gallery preview fills a
  sample date (`lib/template-preview.ts`).
- Arabic templates: `defaultAr` only; English: `defaultEn` only. Arabic copy is written
  natively (warm Egyptian where the card is personal), never translated from English.
- Don't shrink an existing slot's `maxLen`: saved text longer than the new limit would
  fail validation the next time the sender edits it.

## Scene types and the keys their renderer reads

| Type | Keys |
| --- | --- |
| `Cover` | first text = heading, rest = lines; optional image slot (circle photo) |
| `Letter` | first text = opening, then body; a slot keyed `signoff` is set as the signature |
| `PhotoReveal` | one image + caption |
| `Gallery` | `heading` + an image slot with `max` > 1 |
| `TextReveal` | up to three lines; a date slot is shown formatted as the last line |
| `Quote` | the quote + an attribution line (rendered with a leading "— ") |
| `Countdown` | title, a `date` slot to count to, a note |
| `GiftReveal` | heading, note, optional photo of the gift (else `decoration.emoji`) |
| `Event` | `label`, `venue`, `when`, `date` |
| `Venue` | `heading`, `address`, `mapUrl` |
| `Rsvp` | `heading`, `body`, `phone` (WhatsApp) — invitations |
| `Gift` | `heading`, `body`, `account` (copyable transfer details) — invitations |
| `Families` | `familiesHeading`, `groomLabel`, `groomFamily`, `brideLabel`, `brideFamily` |
| `Finale` | heading + last words |

## Look

Colours come from the template only — never app tokens. Put `[ground, ground-deep,
paper, accent]` in `palette`: the open gate and the letter sheet pick their paper and
ink from it for contrast. Pick an `accent` that reads on the ground (section titles,
buttons and ornaments use it); on light paper that usually means a deeper tone than
the pastel in the palette.

Decorations (`hearts`, `petals`, `confetti`…) run only while their section is on
screen; keep the theme-wide ambient layer `low`.

## Supported fonts (loaded on demand)

Sans/rounded: `Inter` `Poppins` `Montserrat` `Quicksand` `Fredoka` `Nunito`
Serif/elegant: `Playfair Display` `Cormorant Garamond` `Marcellus` `Abril Fatface` `Lora` `DM Serif Display`
Script: `Dancing Script` `Great Vibes` `Pacifico` `Sacramento` `Caveat` `Parisienne`
Display: `Bebas Neue`
Arabic: `Cairo` `Tajawal` `Reem Kufi` `Amiri` `Aref Ruqaa` `El Messiri` `Lalezar` `Lateef` `Markazi Text` `Mada` `Harmattan`

A font not on this list falls back to the system face. `fontBody` is used for the
card's running text.
