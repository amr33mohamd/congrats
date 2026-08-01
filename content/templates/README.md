# Congrats — Template Catalog

The catalog is the heart of the product: a set of genuinely attractive,
occasion-native **animated** experiences authored as **data** that strictly
satisfy the frozen `TemplateDefinition` contract (`lib/template-contract.ts`),
so the shared Player renders them and the admin panel can manage them.

## What it is

- `index.ts` exports **`TEMPLATE_CATALOG`** — a validated array of
  `CatalogTemplate` objects — and **`CATALOG_CATEGORIES`**.
- Every `definition` is run through the contract's own zod parser
  (`parseTemplateDefinition`) **at module load**. An invalid template throws at
  import time (during seed/build), never silently at render time. Extra
  load-time checks guard duplicate slugs, unknown categories, locale/direction
  agreement between row and definition, and paid/free price sanity.

### Files

| File | Contents |
|------|----------|
| `_helpers.ts` | `CatalogTemplate` / `CatalogCategory` types + `PRICE` constants |
| `categories.ts` | `CATALOG_CATEGORIES` (8 categories; FK targets for templates) |
| `anniversary.ts` `valentine.ts` `proposal.ts` `eid.ts` `birthday.ts` `graduation.ts` `newborn.ts` `wedding.ts` | the per-occasion AR + EN templates |
| `index.ts` | assembles, validates, exports `TEMPLATE_CATALOG`, lookups, `CATALOG_STATS` |

### Stats

16 templates · 8 paid / 8 free · 8 AR / 8 EN · 5 MVP-first · 8 categories.

## Catalog (16 templates across 8 occasions)

Each occasion ships a native **Arabic (rtl)** and native **English (ltr)**
template. The Arabic ones are authored in idiomatic Egyptian
عامية/فصحى — **not** translations of the English copy.

| Occasion | EN slug | AR slug | Paid? | MVP |
|----------|---------|---------|-------|-----|
| Anniversary | `anniversary-our-story-en` (free) | `anniversary-hobbna-ar` (49 EGP) | mixed | EN |
| Valentine | `valentine-be-mine-en` (free) | `valentine-ya-albi-ar` (49 EGP) | mixed | EN |
| Proposal | `proposal-marry-me-en` (79 EGP) | `proposal-etgawezini-ar` (79 EGP) | both paid | EN |
| Eid | `eid-mubarak-en` (free) | `eid-blessings-ar` (49 EGP) | mixed | AR |
| Birthday | `birthday-make-a-wish-en` (free) | `birthday-kol-sana-ar` (free) | both free | EN |
| Graduation | `graduation-cap-and-gown-en` (free) | `graduation-mabrouk-ar` (49 EGP) | mixed | — |
| Newborn | `newborn-welcome-little-one-en` (free) | `newborn-mabrouk-elmawloud-ar` (free) | both free | — |
| Wedding | `wedding-two-hearts-en` (79 EGP) | `wedding-mabrouk-elzawag-ar` (79 EGP) | both paid | — |

**MVP-first** (`mvp: true`): the five that should seed/launch first —
`anniversary-our-story-en`, `valentine-be-mine-en`, `proposal-marry-me-en`,
`eid-blessings-ar`, `birthday-make-a-wish-en`. They cover the highest-intent
occasions and include one flagship paid (proposal), one flagship paid AR (eid),
and free entry points to drive trial.

> Note: `anniversary-our-story-en` and `eid-blessings-ar` keep the **exact
> slugs, titles, locale/direction and price** the Foundation seed already used,
> so wiring the catalog into `db/seed.ts` is a superset — no existing rows churn.

## AR-vs-EN design rationale (per occasion)

The Arabic templates are designed native-first: RTL flow, Arabic display fonts,
culturally-attuned color/ornament, and the phrases people actually say.

- **Anniversary** — EN *Our Story* is a cinematic film-still arc (blush + wine,
  Playfair serif). AR *ذكرى حبّنا* uses the spoken "كل سنة وإحنا مع بعض" and
  "لعمرٍ كامل معاكي" instead of a literal "happy anniversary" calque; rose + gold
  arabesque, Cairo headings, oud-romantic mood.
- **Valentine** — EN *Be Mine* is playful script (Dancing Script, crimson). AR
  *يا قلبي* drops the western "Valentine" framing entirely for the endearments
  Egyptians use (يا قلبي / ليكِ إنتِ), Reem Kufi display flourish, burgundy +
  rose-gold, single-rose restraint.
- **Proposal** — EN *Will You Marry Me?* is a midnight-navy starfield with a
  Countdown that lands on the question + a ring `GiftReveal`. AR *اتجوزيني؟*
  keeps the same dramatic build but in real spoken proposal language
  ("عندي كلمة لازم أقولهالك" → "تتجوزيني؟"), teal + gold lantern light.
- **Eid** — AR *بركات العيد* is the flagship: classical فصحى blessing
  ("تقبّل الله منا ومنكم صالح الأعمال"), العيدية `GiftReveal`, emerald + gold
  crescent/fanous motifs. EN *Eid Mubarak* serves diaspora/English speakers with
  the same motifs but accessible English and Marcellus serif.
- **Birthday** — EN *Make a Wish* is bubbly (Fredoka, confetti lilac) with a
  Countdown to the cake. AR *كل سنة وإنت طيّب* uses the actual spoken Egyptian
  greeting (not "عيد ميلاد سعيد"), festive teal + gold.
- **Graduation** — EN *Cap & Gown* is dignified navy + gold academic. AR
  *مبروك التخرّج* leads with "ألف مبروك" pride and "تعب السنين جاب نتيجته".
- **Newborn** — EN *Welcome Little One* is soft pastel + lullaby calm. AR
  *مبروك المولود* carries the blessing "ربنا يخليه ويباركلكم فيه".
- **Wedding** — EN *Two Hearts* is ivory + sage + gold with a save-the-date
  Countdown. AR *مبروك الزواج* closes on the traditional "بالرفاء والبنين".

## Font choices

- **Arabic headings:** primarily **Cairo** (geometric, modern, high legibility
  at display sizes); **Reem Kufi** for Valentine's calligraphic flourish.
- **Arabic body:** **Tajawal** (warm, readable companion to Cairo).
- **English headings:** occasion-matched — Playfair Display / Cormorant Garamond
  (romance, formality), Dancing Script (playful love), Fredoka / Quicksand
  (birthday, newborn), Marcellus (Eid, graduation — classical).
- **English body:** **Inter** (neutral, mobile-first).

> These are **font *tokens*** in `theme.fontHeading` / `theme.fontBody`. The
> Player/loader is responsible for actually loading the webfonts; the catalog
> only declares intent. If a token isn't loaded, the renderer should fall back
> to a sensible serif/sans + an Arabic system font for `direction: 'rtl'`.

## Contract notes (how these map to the Player)

- Scenes use only the contract's `SceneType` union: `Cover`, `PhotoReveal`,
  `TextReveal`, `Countdown`, `Gallery`, `GiftReveal`, `Finale`.
- Animations use only the `AnimationPreset` union: `fade`, `slideStart`,
  `slideEnd`, `typewriter`, `zoom`, `parallax`, `confettiBurst`, `flip`.
  `slideStart`/`slideEnd` are direction-relative (they mirror correctly in RTL),
  so AR templates deliberately favour `slideEnd` where EN uses `slideStart`.
- **Editable slots** the sender fills: `recipient` name is injected via the
  `{recipient}` token inside `defaultEn`/`defaultAr` (the contract's
  `applyTokens` resolves it). Text slots carry `maxLen`; image slots carry
  `aspect` + `min`/`max`; date slots (`type: 'date'`) drive Countdown targets.
- `scenes[].id` is the `templateStepId` the backend binds steps to — ids are
  unique within each definition and human-readable.

## How to consume (reviewer)

```ts
import { TEMPLATE_CATALOG, CATALOG_CATEGORIES } from '@/content/templates';
// 1. upsert CATALOG_CATEGORIES (idempotent on slug) -> Map<slug, id>
// 2. for each t of TEMPLATE_CATALOG: insert templates row with
//      categoryId = map.get(t.category),
//      definition = t.definition (already validated),
//      titleEn/titleAr/locale/direction/isPaid/pricePiastres/currency = t.*
//      status: 'published', createdBy: <seed admin's adminUsers.id>
//    thumbnailUrl may be null; t.thumbnailHint is art-direction only.
```
