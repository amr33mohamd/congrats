# Reddit — Congrats

**Read this first.** Reddit will punish anything that smells like an ad. Rules to
follow or you'll get removed/banned:

- Only post in subs where you're already a member and have some comment history.
  If your account is brand new, spend a week commenting genuinely first.
- Lead with the *story or the value*, not the product. Never say "check out my
  app." Show what you made and why.
- Read each sub's rules — many require a flair, a self-post (no direct links in
  title), or restrict promotion to specific weekly threads.
- Reply to every single comment like a person. Take criticism graciously.
- **Never** post the same text to multiple subs (crossposting identical content =
  spam filter). Rewrite for each community.

---

## Which subreddits fit

**Best fits (maker-friendly, expect these to work):**
- **r/SideProject** — the home for exactly this. Show what you built + the story.
- **r/InternetIsBeautiful** — only if you have a genuinely beautiful, no-signup
  demo link (they hate anything gated). Lead with the demo, not the pitch.
- **r/webdev** — use the **Showoff Saturday** weekly thread only, and focus on
  the *how you built it* (Next.js, RTL, animation) more than the marketing.

**Regional / audience fits (check rules, some ban self-promo):**
- **r/Egypt**, **r/cairo** — very anti-spam; only post if you frame it as "I made
  this thing for us, is it useful?" and engage. Consider asking a question rather
  than announcing.
- **r/arabs** — culture-aware framing works; keep it humble.

**Niche / occasion fits (check each sub's self-promo rules):**
- **r/EngagementRings**, **r/weddingplanning**, **r/proposal** — only where a
  genuine "here's a free way to do X" is welcome and not against rules.
- **r/InternetIsBeautiful** aside, avoid r/webdev/r/programming for pure marketing.

---

## Post 1 — r/SideProject

**Title:** I built a tool that turns a name + a few photos into an animated
greeting you send as a link (bilingual EN/Arabic)

**Body:**

> I kept watching real moments — birthdays, weddings, friends having babies — get
> reduced to "🎉🎉🎉" in group chats. Not because people don't care, but because
> making anything more personal means fighting a video editor for an hour.
>
> So I built **Congrats**. You pick an occasion, type the recipient's name, drop
> in a few photos and a message, and it generates a step-by-step animated card —
> text animates in, photos fade, confetti at the end. You share it as a single
> link and it plays on any phone, no app or signup for whoever opens it.
>
> A few things I went deep on:
> - **Proper bilingual + RTL.** It's Arabic-first, and the Arabic templates use
>   phrases people actually say, not translated English. Getting animation timing
>   to feel right in both LTR and RTL was more work than I expected.
> - **Payments that fit the region.** Premium templates are paid via InstaPay
>   (I'm in Egypt); tons of templates are free.
> - Built on Next.js, framer-motion for the animation, all mobile-first.
>
> Here's a finished one so you can see the output without signing up: [demo experience link]
>
> Would genuinely love feedback on the build flow — where does it feel slow or
> confusing? And what occasion should I add a template for next?
>
> (Main site if you want to make one: [site URL])

---

## Post 2 — r/webdev (Showoff Saturday thread only)

**Comment in the weekly thread:**

> **Congrats** — build a step-by-step animated greeting and share it as one link.
>
> The interesting part for this crowd was the RTL work. It's bilingual
> (English/Arabic) and Arabic is the default, so every animation — text arriving,
> photos sliding, layout direction — had to feel native in both directions, not
> just mirrored. Stack: Next.js 15 (App Router), framer-motion + canvas-confetti,
> Drizzle/Postgres, next-intl for i18n. Money is stored in integer piastres to
> avoid float issues, and premium unlocks go through a manual InstaPay + admin
> approval flow (no card processor needed for the Egyptian market).
>
> Demo output (no signup): [demo experience link]
>
> Happy to go into the RTL/animation gotchas if anyone's dealing with the same.

---

## Post 3 — r/Egypt (frame as "is this useful for us?", engage humbly)

**Title:** Made a thing so we can send a proper "كل سنة وإنت طيب" instead of a
plain WhatsApp message — does this feel useful?

**Body:**

> Every birthday/فرح/عيد I end up sending the same boring text and I always feel
> like it deserves more. So I built a small web tool where you type the person's
> name, add a couple of photos and a message, and it makes an animated card
> ("تهنئة متحركة") that you send as one link. Opens on any phone, no app.
>
> It's in Arabic properly (not translated), and the templates use real phrases —
> "كل سنة وإنت طيب," "مبروك المولود." Free ones to try; premium is paid by
> InstaPay.
>
> Here's one I made so you can judge the output before anything else: [demo experience link]
>
> Honest question for the sub — is this actually nicer to receive, or is a normal
> message fine? And what occasions matter most to you that I should cover well?

*(If r/Egypt rules forbid links in the post, put the demo link in your first
comment and say so.)*
