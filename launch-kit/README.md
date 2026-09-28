# Congrats — Marketing Launch Kit

Ready-to-post drafts for launching **Congrats**, a bilingual (Arabic-first, full
RTL) web app that makes:

- **One-page animated wedding invitations** — the flagship. The guest opens one
  WhatsApp link, taps the seal (the soundtrack starts), and scrolls through the
  invitation: the families, ceremony and reception times, a live countdown, the
  couple's photos, the venue with a one-tap **Google Maps directions** button,
  **RSVP straight to the couple's WhatsApp**, and gift details. Five art
  directions (Ivory Arch, Baroque Noir, Sage Garden, Blue Porcelain, Qasr Gold),
  each in Arabic and English.
- **Animated greeting cards** — birthday, Eid, graduation, newborn, anniversary,
  valentine, proposal and wedding congratulations — personalised with a name,
  photos and your words, shared as one link.

The site itself is dark and cinematic (3D hero), and `/templates` is a **live
gallery**: every template plays right in the grid, so people see the real thing
before they sign up. No app for anyone, works on any phone. Many cards are free;
paid templates (49 / 79 EGP today — see the pricing recommendation in
[`docs/MARKETING_PLAN.md`](../docs/MARKETING_PLAN.md) §5) are paid via **InstaPay**.

> These are **drafts for you to review and post yourself.** Fill in every
> `[bracketed placeholder]` before posting. Nothing here has been posted anywhere.
> Founder stories in `linkedin.md` / `product-hunt.md` are illustrative — replace
> them with your real story; don't post a story that didn't happen.

The strategy (who, when, how much) lives in
[`docs/MARKETING_PLAN.md`](../docs/MARKETING_PLAN.md). The go-live steps
(hosting, domain, InstaPay, music licences, legal pages) live in
[`docs/LAUNCH_CHECKLIST.md`](../docs/LAUNCH_CHECKLIST.md). Finish that checklist
before posting anything here.

---

## What's in this kit

| File | What it's for | Priority for Egypt |
| --- | --- | --- |
| `whatsapp-and-groups.md` | Forwardable WhatsApp / Facebook-group messages + planner outreach (AR + EN) | ★★★ |
| `instagram-tiktok.md` | Short-video scripts (invitation + cards) and captions (AR + EN) | ★★★ |
| `press-one-pager.md` | One-pager for press/partners + boilerplate "About" | ★★ |
| `seo-keywords.md` | Arabic + English search phrases, blog titles | ★★ |
| `email-announcement.md` | Launch email to friends/family/early list (AR + EN) | ★★ |
| `x-twitter.md` | Launch tweet, thread, follow-ups, Arabic version | ★ |
| `linkedin.md` | Founder launch post (long + short) | ★ |
| `product-hunt.md` | Product Hunt listing, maker comment, shot-list | ★ (backlinks, credibility) |
| `reddit.md` | Subreddit picks + value-first posts | ★ |

---

## Fill these in once, reuse everywhere

- `[site URL]` — your domain (the same value as `AUTH_URL`)
- `[templates URL]` — `[site URL]/ar/templates` (the live gallery — the best landing page)
- `[demo invitation link]` — a real, finished invitation you made (Arabic, Qasr Gold or Ivory Arch)
- `[demo experience link]` — a finished greeting card (birthday or Eid)
- `[support email]` · `[your name]` · `[your X handle]` · `[Product Hunt URL]`
- `[WhatsApp Business number]` — the number that answers "how do I pay?"
- `[InstaPay handle]` — the same value as `INSTAPAY_HANDLE`
- `[invitation price]` — whatever you decided (plan recommends 199 EGP; founding couples 149)

Add `?utm_source=<channel>&utm_medium=<post-type>` to every link you post so
Plausible shows what worked (e.g. `?utm_source=whatsapp&utm_medium=family_group`).

---

## Launch-day checklist (12 steps, in order)

Steps 1–4 happen **the week before**. Steps 5–12 are launch day. Pick a
**Sunday–Wednesday** for the Egyptian launch (Thursday night and Friday are for
family and weddings, not new apps); do Product Hunt separately on a Tue–Thu.

**Pre-launch prep**

1. **Analytics on.** Plausible + the events in `docs/MARKETING_PLAN.md` §9. Check
   a test visit shows up with its UTM source.
2. **Support ready.** `[support email]` and `[WhatsApp Business number]` on your
   phone, quick replies saved for «الدفع إزاي؟» and «ممكن أعدّل الدعوة؟».
3. **Hero demos.** 2 invitations (Arabic) + 1 birthday + 1 Eid card that genuinely
   look great, with licensed music in place. Record them on a mid-range Android.
4. **Warm up.** Personally message 20 people (engaged couples first) and 3
   planners/photographers you know. Ask them to try it on launch day and reply
   with honest feedback.

**Launch day**

5. **Morning — WhatsApp first.** Send the personal messages in
   `whatsapp-and-groups.md` one by one (never a mass blast). Couples get the
   invitation message; everyone else gets the card message.
6. **Post the invitation video** (script A in `instagram-tiktok.md`) to TikTok and
   Reels. Pin it. Link in bio → `[templates URL]`.
7. **Facebook groups** — only groups you already participate in; value-first post
   from `whatsapp-and-groups.md`.
8. **Email** friends/family (`email-announcement.md`).
9. **Partners** — send the planner/photographer outreach message to 10 names.
10. **LinkedIn + X** (English, for credibility and your network abroad).
11. **Answer everything within the hour**, approve payments within 2 hours
    (`/ar/admin/queue`, after confirming money in your bank app).
12. **Evening** — post the reactions/screenshots you received (with permission),
    reshare the best to Stories.

**After launch:** one short video a day for 5 days, reply to every comment, DM
each person who made an invitation and ask what they'd change. Product Hunt,
Reddit and the X thread go in week 5 of the plan (`docs/MARKETING_PLAN.md` §6),
once you have real invitations and reactions to show.
