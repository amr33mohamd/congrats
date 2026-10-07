# Congrats · تهاني ودعوات — Brand Guide

> The visual reference with every swatch, logo and template is the brand book:
> [`docs/brand/brand-book.html`](./brand-book.html) (open it in a browser).
> Tokens live in `app/globals.css` → `tailwind.config.ts`, mirrored in `remotion/src/brand.ts`.
> Logo files live in `public/brand/` (see `public/brand/README.md`).

---

## 1. Brand platform

### Who we are for
Egyptian brides, grooms and their families, mostly 20–35, on their phones, living in
WhatsApp, Facebook and Instagram. They are planning a فرح, a خطوبة, a كتب كتاب, a
birthday or a سبوع. They want something that looks **شيك**, feels **warm**, is easy to send
to 300 people on WhatsApp, and doesn't make Teta squint.

### Positioning
For Egyptian families celebrating a big moment, **Congrats** is the animated invitation and
greeting card you build in minutes and send as **one link on WhatsApp** — designed to feel
like an Egyptian celebration (لمة، زغروطة، فرحة), not like a translated template.

Unlike printed cards (expensive, slow, can't reach everyone) and generic Canva / video
templates (look the same, aren't made for Arabic or WhatsApp), Congrats is Arabic-first,
personal (their names, your photos, your words) and opens instantly on any phone.

### Brand promise
**فرحتك توصل لكل حبايبك — شيك، ودافي، وفي لينك واحد.**
*Your joy reaches everyone you love — elegant, warm, and in one link.*

### Pillars → feelings
| Pillar | Feeling | What it means in practice |
| --- | --- | --- |
| **فرحة** — Joy | Celebration, confetti, the zaghrouta moment | Rose + gold, sparkles, motion that *opens* like a door |
| **لمة** — Togetherness | Family, everyone invited, nobody forgotten | One link for the whole guest list; copy speaks to the family, not the "user" |
| **شياكة** — Elegance | Looks expensive without being cold | Generous space, gold used sparingly, the keel arch, no clip-art |
| **دفء** — Warmth | Like a call from your aunt, not a bank | Egyptian colloquial, emoji in moderation, rounded shapes |
| **مصري** — Egyptian | Ours, not imported | Fatimid keel arch, Ruq'ah handwriting, faience turquoise, local occasions |

### Personality
If Congrats were a person: **the cousin everyone calls when there's a فرح** — organised,
has great taste, funny, never makes you feel stupid, and always shows up.

- Warm, not syrupy · Elegant, not snobbish · Playful, not childish · Confident, not loud · Egyptian, not cliché

---

## 2. Naming rules

| Context | Write | Notes |
| --- | --- | --- |
| Brand name, Latin | **Congrats** | Capital C only. Never "CONGRATS", "congrats!" or "Congrats!" as the name. |
| Brand name, Arabic script | **كونجراتس** | Transliteration. Use where Latin letters would break an Arabic line (e.g. Arabic ad copy, voice-over scripts). |
| Descriptor | **تهاني ودعوات** / *Greetings & Invitations* | Always the descriptor, never the name on its own. |
| Full name (social handles, page names, store listing) | **Congrats تهاني ودعوات** | Latin name first, Arabic descriptor second — this is the Facebook/Instagram page name. |
| In running Arabic copy | "اعمل كارتك على **Congrats**" or "على **كونجراتس**" | Don't mix both in one sentence. Prefer Latin "Congrats" on screen, "كونجراتس" in audio. |
| Legacy | ~~مبروك~~ as the brand name | "مبروك" is a word we *use*, not our name — it can't be owned or searched. Retire it from logos and titles as copy is touched (the SEO title in `app/[locale]/layout.tsx` still says "مبروك —"; owner: copy team). |

Pronunciation for voice-over: **كون-جراتس** (stress on the first syllable).

---

## 3. Taglines

**Primary (AR):** فرحتك في لينك واحد
**Primary (EN):** Your celebration, in one link.

| Arabic | English | Use |
| --- | --- | --- |
| فرحتك في لينك واحد | Your celebration, in one link. | **Primary** — covers, bios, OG, ads end-card |
| ابعتلهم لحظة مش هينسوها | Send a moment they'll never forget | Greeting cards / hero (current site hero) |
| دعوة تليق بفرحتك | An invitation worthy of your day | Wedding invitations |
| من القلب… لحد الواتساب | From the heart, straight to WhatsApp | Social, playful |
| كل حبايبك معزومين | Everyone you love is invited | Wedding season campaigns |

---

## 4. Tone of voice

We write in **Egyptian colloquial (عامية مصرية)**, the way a stylish friend texts — not
فصحى, not Gulf, not translated English. Short sentences. Verbs first. One emoji at most per
line, and only where it carries feeling (💍 🎉 ✨ 🤍).

### Principles
1. **Talk to the family, not the "user".** "حبايبك"، "المعازيم"، "العروسة" — not "المستخدم".
2. **Say what happens, plainly.** "هيوصلهم لينك على واتساب" beats "سيتم إرسال رابط".
3. **Celebrate with them.** Congratulate first, sell second.
4. **Make it feel easy.** Minutes, not steps. "جاهز في ٥ دقايق".
5. **Respect.** Never joke about the couple, family, religion, or money worries.

### Do / Don't

| ✅ Do | ❌ Don't | Why |
| --- | --- | --- |
| اعمل كارتك ببلاش | قم بإنشاء بطاقتك مجانًا | فصحى + "قم بـ" feels like a government form |
| ابعتها لينك واحد على واتساب لكل المعازيم | شارك الرابط عبر تطبيقات المراسلة | Name the app people actually use |
| ألف مبروك! الدعوة جاهزة 🎉 | تمت العملية بنجاح. | Celebrate the moment, not the transaction |
| حصلت مشكلة في رفع الصورة — جرّب صورة أصغر من ١٠ ميجا | Error 413: Payload too large | Errors: what happened + what to do |
| شيك وبسيط | فخم جدًا جدًا 🔥🔥🔥💯 | Elegance is quiet; max one emoji |
| العروسة والعريس | العميل | Real people, real roles |
| ادفع بإنستاباي أو فودافون كاش | ادفع باستخدام وسائل الدفع الإلكترونية المتاحة | Be concrete and local |
| Your invitation is ready 🎉 (EN) | Your digital asset has been generated | EN copy follows the same warmth |

### Microcopy patterns
- **Buttons:** imperative + benefit — "اعمل كارتك"، "شوف التصميمات"، "ابعت على واتساب".
- **Empty states:** encouragement — "لسه معملتش كروت — يلا نعمل أول واحد ✨".
- **Confirmation:** congratulate — "تمام! دعوتك اتنشرت. ابعت اللينك لحبايبك".
- **Prices:** always in **جنيه**, Arabic numerals in AR copy (١٥٠ جنيه), Latin numerals in EN.

---

## 5. Logo system

**The mark — "باب الفرح" (the door to the celebration).** A **Fatimid keel arch** — the
pointed arch of Cairo's Al-Aqmar and Al-Azhar facades — opens into a rose squircle. Inside it, a
**gold four-point sparkle**: the moment of joy. Above it, a small gold finial, like the light
above a dome. It reads as an invitation (a doorway you're welcomed through), it is
unmistakably Egyptian/Arabic without being religious, and it survives at 16 px.

| File | Use |
| --- | --- |
| `logomark.svg` | Primary mark (squircle, full colour) |
| `favicon.svg` (also `/favicon.svg`) | Small-size master: bigger arch, no finial — ≤ 48 px |
| `logo-mono.svg` | One colour (`currentColor`), arch knocked out |
| `logomark-glyph.svg` | Arch alone (`currentColor`) — watermarks, stamps, foil, pattern |
| `logo-ar.svg` / `logo-ar-reverse.svg` | **Primary lockup** (Arabic-first): كونجراتس + تهاني ودعوات |
| `logo-en.svg` / `logo-en-reverse.svg` | English lockup: Congrats + GREETINGS & INVITATIONS |
| `logo-bilingual.svg` / `-reverse` | Congrats + تهاني ودعوات — social, covers, OG |
| `wordmark-ar.svg`, `wordmark-en.svg` | Wordmark only, `currentColor` |
| `app-icon.svg` | Full-bleed icon (OS applies the mask) |
| `social-avatar.svg` | 1080 × 1080, safe for circle crops |
| `facebook-cover.svg`, `whatsapp-cover.svg` | Covers with centred safe zone |
| `pattern-arches.svg` | Tileable arch + sparkle pattern |

PNG exports are in `public/brand/png/` (favicons, 180/192/512/1024 icons, social avatars at
1080/720/640, covers, lockups at 1200 w). All wordmarks are **outlined paths** — no font is
needed to render them.

**Rules:** clear space = the width of the arch's sparkle (¼ of the mark) on every side ·
minimum 16 px for `favicon.svg`, 24 px for `logomark.svg`, 120 px wide for lockups ·
use `-reverse` lockups on the night stage and on photos (with a dark scrim) · never
recolour the arch, stretch, rotate, add shadows/outlines, or re-type the wordmark in another font.

---

## 6. Colour

Product chrome ships **dark** (the "night stage" the cards perform on); `.light` exists for
paper contexts. Every text pair in the chrome is **WCAG AA ≥ 4.5:1** (verified figures in the
brand book).

| Role | Name | Hex | Notes |
| --- | --- | --- | --- |
| Primary | **Signature Rose** | `#F0436E` | Logo, gradients, glows. *Not* under small white text (3.66:1). |
| Primary (fill) | Rose 600 | `#D92B5A` | `bg-brand`. White text 4.73:1 |
| Primary (hover) | Rose 650 | `#C2214F` | `hover:bg-brand-hover`. White 5.79:1 |
| Primary (deep) | Rose 700 | `#AE1F44` | Gradient end, text on paper (6.44:1 on cream) |
| Primary (on dark text) | Rose 400 | `#FA6189` | `text-brand` on night: 6.13:1 |
| Accent | **Gold** | `#D6A435` / 300 `#E9C667` | Sparkle, premium, highlights. Text on dark = 300 (10:1); text on paper = 700 `#8C6620` |
| Secondary | **Night** | `#150C11` stage · `#0C0A0B` page · `#1A1518` surface · `#241D21` raised | Plum-tinted near-blacks |
| Neutral light | **Cream** | `#FAF8F7` · ink `#14100E` | Paper contexts; muted text `#6F645F` (5.41:1) |
| Support | **Faience** | `#4FC3C9` / `#0E7C80` | Egyptian turquoise — info + illustration only |
| Success | | dark `#34C785` · light `#187A52` | |
| Warning | | dark `#E9C667` · light `#8C6620` | |
| Danger | | dark `#F05C68` · light `#C62F3E` | |

**Proportion:** 60 % night/cream · 25 % rose · 10 % neutrals · 5 % gold. Gold is jewellery — a little goes a long way.

---

## 7. Typography

| Role | Arabic | Latin | Token |
| --- | --- | --- | --- |
| Headings | **Cairo** 700–800 | **Fredoka** 600–700 | `font-heading` |
| Body / UI | **IBM Plex Sans Arabic** 400–600 | **Inter** 400–600 | `font-body` |
| Display (festive phrases only) | **Aref Ruqaa** 700 | **Fredoka** 600 | `font-display` |

Why: Cairo is literally Cairene and punchy at headline size; Plex Sans Arabic has open counters
and calm rhythm for long paragraphs on small screens; Aref Ruqaa is **Ruq'ah**, the everyday
handwriting of Egypt — warmth and "مصري" in one line, used for the descriptor and short
celebratory lines only. Fredoka's rounded terminals match Cairo's softness. All on Google Fonts (OFL).

**Scale** (1.25 major third, 16 px body): 12 · 14 · 16 · 18 · 20 · 25 · 31 · 39 · display `clamp(36px, 7vw, 76px)`.
Arabic body line-height **1.7**, headings **1.15**. Never letter-space Arabic. Never set Aref Ruqaa below 20 px or for more than ~6 words.

*Templates (the invitation designs themselves) keep their own fonts via `lib/fonts.ts` — the
identity governs the site chrome, ads and social, not the template art.*

---

## 8. Visual style

- **Shape:** soft. Radii 6 / 10 / 16 / 24 px and pills; the **keel arch** (`rounded-arch`) frames hero photos and featured cards. No sharp corners, no hard drop shadows.
- **Elevation:** on night, a 1 px inner light ring + deep soft shadow (`shadow-card`, `shadow-pop`); the primary CTA gets the rose **glow** (`shadow-glow`).
- **Iconography:** 1.75 px rounded-stroke line icons (Lucide/Phosphor-style), 24 px grid, rounded caps/joins; filled sparkle ✦ is the only "brand" glyph. Emoji are content, not icons.
- **Pattern & illustration:** the arch-and-sparkle tile (`pattern-arches.svg`) at 8–15 % opacity in gold on night; confetti in rose / rose-300 / gold / gold-200 / white. Flat shapes with subtle gradient, no 3D clip-art, no stock "wedding rings" vectors.
- **Photography:** real Egyptian celebrations — hands with henna/rings, family لمة, table details, string lights, rooftop & garden weddings; warm golden-hour light; candid over posed; diverse (veiled and unveiled brides, all ages). Avoid: Western church weddings, stocky white studio shots, faces of real customers without written consent.
- **Motion:** *opens like a door.* Ease `--ease-emphasized` (cubic-bezier(.22,1,.36,1)); 150 / 280 / 520 ms. Entrances rise + fade 8–16 px; one sparkle twinkle per moment; confetti only at the payoff (publish, open). Always honour `prefers-reduced-motion`.

---

## 9. Social templates

- **Avatar:** `png/social-avatar-1080.png` everywhere (Instagram 1080, Facebook 720, WhatsApp 640). Mark only — no text in avatars.
- **Covers:** Facebook `png/facebook-cover-1640x624.png` (keep text inside the central 820 × 312 band — mobile crops the sides); WhatsApp Business `png/whatsapp-cover-1920x1080.png` (16:9, centred; check crop in the app).
- **Feed post 1080 × 1350 (4:5):** night or cream background · one card/phone mockup as hero · headline in Cairo 800 (max 2 lines) · optional Ruqaa accent line in gold · CTA chip in rose 600 · logo bottom-centre at 64 px · 64 px margins.
- **Story/Reel 1080 × 1920:** keep text in the central 1080 × 1420 (top 250 / bottom 250 are UI); end-card = bilingual reverse lockup + "فرحتك في لينك واحد" + "اللينك في البايو".
- **WhatsApp status:** 1080 × 1920, one message, big type, a real card preview; no more than 12 words.
- Always: one message per post, real template screenshots over mockup fantasy, Arabic first, Egyptian colloquial.
