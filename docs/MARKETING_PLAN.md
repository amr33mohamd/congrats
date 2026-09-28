# Congrats — Marketing & Go-To-Market Plan (Egypt first)

**Version:** 2.0 · **Written:** 28 Sep 2026 · **Market:** Egypt (then GCC Arabic speakers) · **Currency:** EGP
(1 USD ≈ 51.9 EGP on 28 Sep 2026 — [Investing.com USD/EGP](https://www.investing.com/currencies/usd-egp-historical-data))

> Supersedes `docs/marketing/MARKETING-PLAN.md` (v1, June 2026), which was written
> before the redesign and before wedding invitations existed. v1's viral-loop
> thinking still holds; its targets and pricing do not.
>
> Anything marked **[verify]** is a reasoned estimate, not a sourced fact. Check it
> before you spend money on it.

---

## 0. The one-paragraph version

Congrats sells **one-page animated wedding invitations** (Arabic-first, RTL, opens
from a WhatsApp link, with the couple's families, date, venue + one-tap Google Maps
directions, RSVP straight to the couple's WhatsApp, and a gift section) and, around
them, **animated greeting cards** for birthdays, Eid, graduation, newborns and
couples. Invitations are the flagship because every one is opened by 100–300
guests — each of them a future bride, groom, sister or planner who just saw the
product working. The plan is: price invitations for what they are worth (not 79
EGP), win the Oct–Dec 2026 wedding season through **planners, venues and
photographers** plus bride-focused TikTok/Instagram content, use Egyptian Love Day
(4 Nov) and New Year for greeting-card volume, then prepare for the two big 2027
peaks — **Ramadan/Eid al-Fitr (≈8 Feb–10 Mar 2027)** and **Eid al-Adha (≈16–17 May
2027)** with the summer wedding season right after.

---

## 1. What we are actually selling (as of this commit)

| Product | What the buyer gets | Price today |
| --- | --- | --- |
| **Wedding invitation** (`invitation-*`) — 5 art directions (Ivory Arch, Baroque Noir, Sage Garden, Blue Porcelain, Qasr Gold) × Arabic/English = 10 templates | One continuous scrolling card: sealed "open" gate that also starts the music → letter → families → ceremony + reception times → live countdown → couple photo + gallery → venue + directions → RSVP via WhatsApp → gift details. One link, no app. | 79 EGP (`PRICE.premium`) |
| **Premium greeting cards** — wedding congrats, proposal | Animated, personalised story card | 79 EGP |
| **Standard greeting cards** — Eid (AR), anniversary (AR), graduation (AR), valentine (AR) | Same engine, lighter scenes | 49 EGP |
| **Free cards** — birthday (AR/EN), newborn (AR/EN), Eid (EN), valentine (EN), anniversary (EN), graduation (EN) | Full product, free | 0 |

Payment: buyer transfers via **InstaPay** to our handle, uploads the screenshot,
an admin approves in `/admin/queue`, the link unlocks. Comped accounts
(`users.all_access`) publish paid templates free — this is our partner/influencer
tool.

Honest gaps that shape the plan (details in §12 and the cross-stream notes):

- RSVP goes to the couple's WhatsApp; there is **no guest-count dashboard** yet.
  Competitors sell exactly that dashboard (§2), so we price below them until it exists.
- Shared cards have **no "make your own" call-to-action and no preview image**; the
  link preview title is English-only ("For Sara"). This is the single biggest
  growth leak — every invitation is a free ad we currently don't run.
- Manual payment approval means a **response-time promise** has to be staffed,
  especially on Thursday/Friday nights and Eid.
- No music ships yet (`public/audio/README.md`) and painted art is optional
  (`docs/ART_BRIEF.md`). Launch creative must be recorded **after** both land.

---

## 2. Market facts that drive the decisions

### Reach & channels

- Egypt: **96.3 M internet users (81.9%)**, **116 M mobile connections**, 50.7 M
  social media identities; YouTube 50.7 M, Facebook 48.7 M, **TikTok 41.3 M adults
  (+25% YoY)**, Messenger 35.4 M, Instagram 20.1 M, Snapchat 19.7 M
  ([DataReportal, Digital 2025: Egypt](https://datareportal.com/reports/digital-2025-egypt)).
- WhatsApp is reported at roughly 72% of internet users [verify — seen in search
  summaries of Digital 2025, not confirmed on the report page; DataReportal does not
  publish WhatsApp ad reach]. Either way it is the default messenger for family
  groups.
  → WhatsApp is the delivery channel; Facebook + TikTok are the discovery
  channels; Instagram is where brides and wedding vendors live, even though it
  is smaller.
- Meta ads in Egypt are cheap: CPM roughly **$1.5–2.5**, Instagram ~20–40% above
  Facebook ([Lebesgue CPM by country](https://lebesgue.io/facebook-ads/facebook-cpm-by-country),
  [Superads CPM benchmarks](https://www.superads.ai/facebook-ads-costs/cpm-cost-per-mille));
  an Egyptian agency reports lead-type results around **1–2 EGP per lead/conversation**
  but stresses that cheap clicks with bad conversion are expensive
  ([Red Octopus](https://www.redoctopuseg.com/blog/how-much-do-facebook-ads-cost-in-egypt)).

### Payments

- **InstaPay passed 16 M users and 1.1 B transactions by June 2025**
  ([Egypt Independent / CBE](https://www.egyptindependent.com/cbe-reveals-number-of-instapay-users-volume-of-egyptian-transactions/),
  [Wikipedia: Instant Payment Network](https://en.wikipedia.org/wiki/Instant_Payment_Network)).
  Since April 2025 the **sender** pays 0.1% (min 0.50, max 20 EGP) per transfer
  ([Egyptian Streets](https://egyptianstreets.com/2025/04/03/instapay-now-charging-transfer-fees/))
  — on a 199 EGP invitation that is 0.50 EGP. Negligible, but mention it so nobody
  "underpays by 50 piastres".
- **Mobile wallets:** 46.3 M active wallets in Q2 2025 (+29% YoY), rising to ~57 M
  registered in H1 2026; **Vodafone Cash** dominates transactions; 65% of wallet
  inflows come via InstaPay from bank accounts
  ([Daily News Egypt, Aug 2026](https://www.dailynewsegypt.com/2026/08/19/how-mobile-wallets-rewired-egypts-digital-economy/),
  [Daily News Egypt, Sep 2025](https://www.dailynewsegypt.com/2025/09/13/mobile-wallet-transactions-in-egypt-surge-72-in-q2-2025-to-egp-943-4bn/)).
  → A buyer without a bank-linked InstaPay can still pay **from a wallet to an
  InstaPay/IPA handle** in most wallet apps [verify per wallet]. Say so in the
  checkout copy: "InstaPay أو فودافون كاش".
- **Fawry** has 230k+ cash points, useful for the unbanked, but needs a gateway
  with setup fees/minimums; **Paymob** is ~2.75% + ~$0.06 per card/wallet
  transaction with no setup fee ([Paymob pricing](https://paymob.com/en/pricing),
  [Digitology gateway comparison](https://digitology.co/payment-gateway-egypt/)).
  → Stay on manual InstaPay for launch (zero fees, zero integration). Add Paymob
  (cards + wallets + Fawry reference codes) once manual approvals exceed
  ~30/day or the approval delay shows up as drop-off between `payment_submitted`
  and `publish` (§9).

### Weddings

- **936,739 marriage contracts in 2024** (−2.5% YoY), 42% urban
  ([Ahram Online / CAPMAS](https://english.ahram.org.eg/NewsContent/1/2/557770/Egypt/Society/Egypt-sees--drop-in-marriages,--rise-in-divorces-i.aspx)).
  That is **~2,500 marriages a day**. Even 0.5% of them is ~4,700 invitations a year.
- Summer is traditionally "the wedding season"; cooler **Mar–May and Sep–Dec** are
  popular for outdoor/venue weddings ([Bayut Egypt](https://www.bayut.eg/mybayut/en/choosing-between-a-summer-and-a-winter-wedding/)).
  Weddings are rare **during Ramadan** and bunch up **right after each Eid**
  [verify with 3–5 planners in week 1 — this decides when we spend].

### Competitors (invitations)

| Competitor | Market | What they sell | Price signal |
| --- | --- | --- | --- |
| **Da3wa Online** | GCC focus; pricing page shown in EGP | Bulk WhatsApp sending, RSVP dashboard, QR check-in, wallet passes | E-Invite page **675 EGP (≤50 guests)**, **2,700 EGP (≤500)**; WhatsApp auto-send **22–66 EGP per guest**; QR add-on 200 EGP ([da3wa.online/pricing](https://da3wa.online/en/pricing)) |
| **Wedvite** | GCC (Khaleeji designs) | Arabic/bilingual animated invitation, music, maps, RSVP, one-time price, unlimited guests | Price not public; running 45% promos ([wedvite.net](https://wedvite.net/arabic-wedding-invitations)) |
| **Envit, Invitou, Izzan, invited.ae, QuikRSVP** | GCC | WhatsApp invites + RSVP tracking | Mostly "free to start" ([envitme.com](https://envitme.com/), [izzan.org](https://izzan.org/), [invitou.com](https://invitou.com/)) |
| **Greenvelope / Paperless Post / Evite** | Global (English) | Animated envelope + RSVP | Greenvelope ~$159 for a 150-guest wedding; Paperless Post coin packs (600 coins $96); Evite Pro $249.99/yr ([Greenvelope compare](https://www.greenvelope.com/compare/greenvelope-vs-paperless-post), [Mixily comparison](https://blog.mixily.com/greenvelope-vs-paperless-post/)) |
| **Canva / Renderforest video invites** | Global, Arabic UI | DIY video/image invitation | Free/cheap, but a static file, no map/RSVP, no Arabic-first templates |
| **Instagram/TikTok freelancers** ("دعوة فرح إلكترونية") | Egypt | Custom video invitation made to order | Price by DM [verify: ask 5 sellers] — typically slow (days) and a video, not a page |
| **Print shops** (e.g. Khattab, 4 Cairo showrooms — [Arabia Weddings](https://www.arabiaweddings.com/cairo/invitation-cards)) | Egypt | Printed cards | Per-card print cost — we are a **complement** ("send the link to everyone, print 50 for the elders"), not an enemy |

**Where we win:** Egyptian-Arabic copy and Arabic calligraphic type by default;
it is a *page*, not a video (tappable map, tappable RSVP, gift details); made in
minutes by the couple themselves; cheaper than every Arabic RSVP platform.
**Where we lose today:** no guest list / RSVP counts, no bulk WhatsApp sending,
no QR check-in. Don't fight Da3wa on those features — fight on beauty, speed and
price for couples who just want a gorgeous link in the family group.

### Competitors (greeting cards)

Canva, CapCut templates, forwarded Eid images, and WhatsApp stickers are the real
alternative — all free. Paid greeting cards only work at impulse price (≤ 50 EGP)
and only for "big feeling" occasions (proposal, anniversary, a mother abroad on
Eid). Treat cards as **acquisition** (free tier) and invitations as **revenue**.

---

## 3. Positioning

**For** Egyptian couples planning a wedding or katb el-ketab **who** want every
guest to get something beautiful on WhatsApp — not a blurry photo of a printed
card — **Congrats** is an animated one-page invitation, in real Arabic, with the
families, date, map and RSVP in one link. **Unlike** video invitations from
freelancers, it is ready in 10 minutes and guests can tap the map and reply; **unlike**
GCC RSVP platforms, it costs less than a box of chocolates for the guests.

Taglines to test (A/B in ads and bio):

- AR: **«دعوة فرحك… لينك واحد يفرّح الكل»** · EN: *Your wedding invitation, in one beautiful link.*
- AR: **«من غير مطبعة ولا انتظار — دعوتك جاهزة في ١٠ دقايق»** · EN: *No print shop, no waiting — ready in 10 minutes.*
- AR (cards): **«بلاش "كل سنة وانت طيب" ناشفة»** · EN: *Say it like you mean it.*

Brand voice: warm, Egyptian, a little playful; never "tech". We say «لينك» not
«رابط» in social copy, but keep MSA-leaning phrasing inside the formal invitation
templates themselves (that is what families expect on an invitation).

---

## 4. Ideal customer profiles (ICPs)

| # | ICP | Who, concretely | Trigger | Where they are | What they need to hear |
| --- | --- | --- | --- | --- | --- |
| 1 | **The bride (primary buyer)** | 23–32, Cairo/Alex/Delta cities, Instagram + TikTok, planning 2–6 months ahead, manages a WhatsApp list of 150–400 guests | Venue booked → "we need invitations" | Bride groups on Facebook («عرايس مصر»-type groups), wedding TikTok, planner & photographer pages | "Looks as good as print, costs less than 10 printed cards, and aunt can tap the map." |
| 2 | **The groom / katb el-ketab organiser** | 25–35, wants it done in one sitting, pays via InstaPay | Katb el-ketab or engagement date fixed | Facebook, WhatsApp | "10 minutes, pay 199 by InstaPay, send to the family group tonight." |
| 3 | **The sister / best friend** | 18–30, does the "creative stuff" for the bride | Asked to "handle the invitation" | TikTok, Instagram | "Make it for her, she'll cry." |
| 4 | **Wedding planners & coordinators** (partners) | Small planning businesses (1–10 people), 3–20 weddings/month in season | Want an upsell and a "modern" touch | Instagram, Facebook business pages, WhatsApp | Wholesale price + white-glove setup + commission (§7). |
| 5 | **Venues & wedding halls** (partners) | Hotels, halls, garden venues | Every booking needs an invitation with *their* map pin | Sales managers on WhatsApp | "Your location opens correctly on every guest's phone." |
| 6 | **Photographers / videographers** (partners) | Already deliver the couple's pre-wedding shoot | Pre-wedding photos go straight into the invitation's photo moments | Instagram | Commission + their credit on the card. |
| 7 | **The expat child** (cards) | Egyptians in the Gulf/Europe sending Eid / birthday love home | Eid, Mother's Day (21 Mar), a parent's birthday | Facebook, WhatsApp | "Be there even when you can't be." |
| 8 | **Students** (cards, free) | University students, graduation & birthdays | Graduation (Jun–Jul), results day, friends' birthdays | TikTok, Instagram | Free, fun, shareable — they are the loop, not the revenue. |

---

## 5. Pricing recommendation

**Current:** free / 49 / 79 EGP; invitations at 79.

**Recommendation:**

| Tier | Today | Recommended | Why |
| --- | --- | --- | --- |
| Free cards | 0 | **0** — keep | Acquisition; every shared card is an ad once the end-card CTA exists. |
| Standard cards | 49 | **49** — keep | Impulse range; < InstaPay mental "small transfer". |
| Premium cards (proposal, wedding congrats) | 79 | **79** — keep | Same. |
| **Wedding invitation** | 79 | **Launch price 199 EGP → list 299 EGP from 1 Jan 2027** | Da3wa's cheapest e-invite page is 675 EGP for 50 guests ([pricing](https://da3wa.online/en/pricing)); Greenvelope is ~$159 ≈ 8,250 EGP for 150 guests ([Mixily](https://blog.mixily.com/greenvelope-vs-paperless-post/)). At 79 we signal "cheap card", and after the planner commission (20%) there is little left. 199 is still < 1/3 of the cheapest Arabic competitor and ~4 USD. |
| **"Founding couples" offer** | — | **First 100 couples: 149 EGP** with code, in exchange for a testimonial + permission to screen-record their card (names blurred) | Buys social proof we don't have yet. |
| **Invitation Pro** (future) | — | **499 EGP** once a guest list / RSVP counter / reminder feature exists | Leaves room under Da3wa Starter (675). Don't sell it before it exists. |
| **Planner pack** | — | **10 invitations for 1,490 EGP** (149 each) prepaid; planner resells at any price | Planners want margin and control; prepaid packs remove per-order approval. |

Rules:
- Prices live in the DB and can be edited in **/admin/pricing**, **but the seed
  overwrites `pricePiastres` from `content/templates/*.ts` on every boot**
  (`db/seed.ts` upsert). Until that is changed, price edits must be made in
  `content/templates/_helpers.ts` (`PRICE`) or per template, then redeployed —
  see cross-stream notes.
- Always show the price in both numerals («١٩٩ جنيه» / "199 EGP"); never "from".
- Discount codes don't exist in the product yet. For the founding offer, ask the
  buyer to transfer 149 and write «FOUNDING» in the transfer note; the admin
  approves manually. That is fine at < 5 orders/day.

---

## 6. 90-day go-to-market plan (Mon 5 Oct 2026 → Sun 3 Jan 2027)

Assumes the owner has finished `docs/LAUNCH_CHECKLIST.md` sections A–F by 4 Oct.
Roughly **2 hours/day of founder time**, more on launch week.

### Phase 1 — Soft launch & proof (Weeks 1–3)

| Week | Dates | Goals | Concrete actions | Exit criteria |
| --- | --- | --- | --- | --- |
| **W1** | 5–11 Oct | Real invitations live; learn the market | • Make 3 hero invitations yourself (Qasr Gold AR, Ivory Arch AR, Sage Garden EN) with real-looking (consented) photos; screen-record each on a mid-range Android. • Call/WhatsApp **10 planners and 5 venues** — not to sell, to ask: when do couples order invitations, what do they pay, what annoys them? (Validates §2 seasonality + pricing.) • Ask 5 Instagram "دعوة فرح إلكترونية" sellers for a quote as a customer. • Set up Instagram, TikTok, Facebook page: handle `@congrats.eg` or similar [check availability]. • Turn on Plausible + events (§9). | 15 conversations logged in a sheet; 3 hero invites recorded; analytics firing. |
| **W2** | 12–18 Oct | First 10 paying couples | • Founding-couples offer (149 EGP) to your own network: personal WhatsApp to every friend engaged/marrying in the next 6 months (template in `launch-kit/whatsapp-and-groups.md`). • Post hero invite #1 as a Reel/TikTok (script A, §8.2). • Join 5 bride Facebook groups as a member; **read, don't post** yet. | 10 invitations published; median create-to-publish time known. |
| **W3** | 19–25 Oct | Fix what week 2 showed; first partners | • Watch 5 people create an invitation (screen-share/in person), fix copy/UX notes via the dev streams. • Sign **3 partners** (1 planner, 1 photographer, 1 venue) on the partner program (§7) with comped accounts. • Post 3 TikToks (scripts A–C). • First value-first post in 2 bride groups ("I made a free checklist of what to put on a wedding invitation" + link to a blog post, not the product). | 3 partners live, 20 invitations published total. |

### Phase 2 — Wedding-season push + Egyptian Love Day (Weeks 4–8)

| Week | Dates | Goals | Concrete actions |
| --- | --- | --- | --- |
| **W4** | 26 Oct–1 Nov | Love Day prep | • Egyptian Love Day is **4 Nov** (عيد الحب المصري). Push free valentine cards + 49 EGP Arabic valentine. • 3 couple-POV TikToks ("sent this to my wife at work"). • Start Meta ads (only if budget ≥ 10k scenario): 2 ad sets — brides (engaged, 22–32, Cairo+Giza+Alex) and couples (married, 25–40). |
| **W5** | 2–8 Nov | Love Day + first press | • 4 Nov: stories all day, repost user cards (with permission). • Pitch the press one-pager to 5 Egyptian tech/lifestyle outlets (Egyptian Streets, CairoScene, Scoop Empire, Enterprise, Wamda) [verify contacts]. |
| **W6** | 9–15 Nov | Scale partners | • Target: **10 partners**. Offer planners a free 20-min WhatsApp video walkthrough. • Launch "made with Congrats" partner credit (photographer's name on the photo-moments section — needs product support; until then, in the caption). |
| **W7** | 16–22 Nov | Content engine | • Batch-record 12 short videos in one day (1 per style × AR/EN + 2 behind-the-scenes). • Publish 4/week. • Blog/SEO: 2 Arabic articles (§8.5). |
| **W8** | 23–29 Nov | Review & reprice decision | • Look at the funnel (§9). If invitation conversion `create_started→publish` ≥ 25% and `payment_submitted` ≥ 60/wk, keep 199 → 299 on 1 Jan. If < 30/wk, keep 199 and fix the funnel first. |

### Phase 3 — Winter weddings, year-end, Ramadan prep (Weeks 9–13)

| Week | Dates | Goals | Concrete actions |
| --- | --- | --- | --- |
| **W9** | 30 Nov–6 Dec | Winter-wedding angle | • "Winter weddings are cheaper — spend the saving on the details" content. • Venue partners: ask each to share one invitation link in their WhatsApp broadcast. |
| **W10** | 7–13 Dec | Birthday + New Year cards | • Free birthday templates push for students (exam season starts late Dec–Jan [verify by university]). |
| **W11** | 14–20 Dec | Christmas / New Year / Coptic Christmas | • English + Arabic New Year cards (need templates — cross-stream). Coptic Christmas is **7 Jan** — plan Coptic-friendly greetings if templates exist. |
| **W12** | 21–27 Dec | Year-end recap | • Publish "2026 in invitations" (count, favourite style, most-used city — anonymised). • Announce 1 Jan list price 299 with "last week at 199" urgency. |
| **W13** | 28 Dec–3 Jan | Plan Q1 2027 | • Ramadan starts ≈ **8 Feb 2027**, Eid al-Fitr ≈ **10 Mar 2027** ([AnyCalendar](https://anycalendar.org/ramadan-calendar/2027), [CalendarDate](https://www.calendardate.com/eid_al_fitr_2027.htm)). Brief the dev streams now: Ramadan Kareem + Eid templates, "Eidiya" gift section, and invitations for post-Eid weddings must be ready by **15 Jan**. • Retro: which channel produced paying couples? Double it; cut the worst. |

---

## 7. Partnership program ("Congrats Partners")

### Who and why

| Partner | Their incentive | What we give | What we ask |
| --- | --- | --- | --- |
| **Wedding planners / coordinators** | Upsell, look modern, save their own time | Comped account (`all_access`) to make demo invites; **20% commission** on referred orders for 12 months, or the **planner pack** (10 for 1,490 EGP) to resell at their own price | Mention us in the planning checklist they send couples; one story/month |
| **Venues / halls / hotels** | Guests arrive at the right gate; premium feel | Free invite for their own events; their map pin + a line «مكان الفرح: …» pre-filled for couples they refer [needs product support]; **15% commission** | Put our QR/link in the booking confirmation message |
| **Photographers / videographers** | Their pre-wedding photos seen by 200 guests | **20% commission**; credit in the caption (and on the card once supported) | Offer the invitation as an add-on in their packages |
| **Makeup artists, dress rental, cake & flower shops** | Same audience, happy clients | 15% commission | Share partner link in stories during season |
| **Influencers (bride/lifestyle, 10k–100k)** | Content + commission | Comped account, **25% commission** for 60 days with a personal code, or a flat fee (§10) | 1 Reel/TikTok + 3 stories, link in bio for 14 days |

### Mechanics (works with today's product, no code needed)

1. Partner gets a code: `P-<NAME>` (e.g. `P-NOURPLANS`).
2. Buyer writes the code in the InstaPay transfer note **or** we add `?ref=P-NOURPLANS`
   to the link they share (Plausible records the referrer; the admin checks it
   when approving). Log code + order id in a Google Sheet at approval time.
3. Payout: monthly, by InstaPay, on the 5th, for orders approved in the previous
   month. Minimum payout 200 EGP (rolls over).
4. Refunds within the refund window are clawed back from the next payout.
5. Written one-page agreement (commission %, 12-month term, no spam, no
   misrepresenting prices, either side can end with 14 days' notice). Have a lawyer
   glance at it once — see LAUNCH_CHECKLIST §H.

**When this outgrows a spreadsheet** (≥ 20 active partners or ≥ 100 partner
orders/month): build `ref` capture on signup + an `orders.partner_code` column
+ a partner dashboard. Listed as a cross-stream note.

### Partner outreach message (Arabic, WhatsApp, planner)

> أهلاً أستاذة نور 👋 أنا عمرو من Congrats. عملنا دعوات فرح إلكترونية بتتفتح لينك
> واحد على الواتساب: أسامي العيلتين، الميعاد، اللوكيشن بيفتح على الخريطة على طول،
> وتأكيد الحضور بيوصل للعروسة واتساب.
> دي دعوة تجريبية تشوفيها في ٣٠ ثانية: [demo link]
> حابين نعمل شراكة: لكل عروسة من طرفك ليكي ٢٠٪، أو باكدج ١٠ دعوات بسعر خاص
> تبيعيها بالسعر اللي يناسبك. ينفع أبعتلك تفاصيل أكتر؟

---

## 8. Channel playbooks

### 8.1 WhatsApp (delivery + word of mouth)

- **Every invitation is the ad.** Priority product fix: end-of-card CTA
  «اعمل دعوتك على Congrats» with `?utm_source=card&utm_medium=invite_footer`, an
  Arabic link-preview title («دعوة فرح سارة وأحمد») and an OG preview image.
  WhatsApp shows the preview in every family group — today it shows "For Sara".
- **WhatsApp Business** on a dedicated number: catalog with the 5 invitation styles,
  quick replies for "how do I pay?" / «الدفع إزاي؟», away message on Fridays.
- **Response SLA:** approve payments within **2 hours, 10:00–24:00 daily**; say it
  on the order page. Couples send invites the same night they pay.
- Never bulk-message strangers; WhatsApp restricts numbers that get reported.
- Example message after approval (sent by admin, manual for now):
  > مبروك مقدماً 🤍 دعوتكم اتفعّلت: [link]. نصيحة: ابعتوها الأول لجروب العيلة
  > الصغير، وبعدين للكل. لو احتجتوا أي تعديل قبل الفرح إحنا موجودين.

### 8.2 TikTok + Instagram Reels (discovery)

TikTok reaches 56% of Egyptian adults and grew 25% in a year
([DataReportal](https://datareportal.com/reports/digital-2025-egypt)), so it gets
the most creative effort; Instagram is where brides save and share vendors.

Cadence: **4 short videos/week** in weeks 3–13; 1 carousel/week on Instagram.

Scripts (full shot lists in `launch-kit/instagram-tiktok.md`):
- **A — "Aunt test":** «ابعتنا الدعوة لخالتي… وعرفت توصل القاعة لوحدها» — show the tap on
  "الاتجاهات" opening Google Maps.
- **B — "Open the seal":** ASMR-style: the gate, the music starting, the names
  arriving. Caption: «أول ما الضيف يفتحها 🤍».
- **C — "Print vs link":** split screen: printed card photo in WhatsApp (blurry) vs our
  link. «نفس الفرح، دعوة أشيك».
- **D — "10 minutes":** timer on screen, making an invitation start to finish.
- **E — style reveal:** one per art direction, trending audio, «أنهي ستايل يشبهك؟» (drives comments).
- Hashtags: `#دعوة_فرح #دعوات_زفاف #عروسة_٢٠٢٦ #فرح #كتب_كتاب #تجهيزات_الفرح #weddingegypt`.

### 8.3 Facebook groups (brides, "تجهيزات العرايس", neighbourhood groups)

Facebook still reaches ~41% of Egyptians and skews older — i.e. the mothers and
aunts who actually handle the guest list
([DataReportal](https://datareportal.com/reports/digital-2025-egypt)).

- Join as a person, contribute for 2 weeks before any link.
- Post useful things: «إيه اللي لازم يتكتب في دعوة الفرح؟ (ترتيب الأسماء، صيغة العيلتين، الميعاد)».
  Link to the blog post; the product is mentioned once at the bottom.
- Answer "who does electronic invitations?" threads with a demo link, not a sales pitch.
- Ask admins of 2–3 large groups for a paid pinned post or a giveaway (5 free invitations).

### 8.4 Meta ads (only in the 10k / 50k scenarios)

- Objective: **conversions on `publish`** once ≥ 50 events/week exist; before that,
  **traffic to /templates** with video creative and `utm_campaign`.
- Audiences: Engaged (relationship status) 22–34, Cairo/Giza/Alex/Mansoura; lookalike
  of paying couples once there are 100+.
- Creatives: scripts A–C cut to 9:16 and 1:1; Arabic captions burned in.
- Kill rule: an ad set with CPA > 60 EGP per `payment_submitted` after 2,000 EGP spend.

### 8.5 SEO (slow, compounding)

Arabic search for wedding invitations is under-served by Egyptian pages. Target
keywords in `launch-kit/seo-keywords.md`. Four articles in 90 days:
1. «صيغة دعوة فرح: ١٥ صيغة جاهزة بالعامية والفصحى»
2. «دعوة فرح إلكترونية ولا مطبوعة؟ مقارنة التكلفة»
3. «إزاي تبعت دعوة الفرح على الواتساب من غير ما تبان سبام»
4. «صيغ تهنئة بالعيد للأهل والأصحاب»
Each links to `/ar/templates` (the live gallery — the best landing page we have).
Blog pages don't exist yet → cross-stream note.

### 8.6 Launch platforms (English, credibility)

Product Hunt + r/SideProject + LinkedIn founder post (drafts in `launch-kit/`).
Expect little Egyptian revenue from these; do them in **W5** for backlinks and
recruiting, not sales.

---

## 9. KPIs, funnel targets and analytics events

### Events to implement (Plausible custom events or equivalent)

| Event | Fires when | Props |
| --- | --- | --- |
| `page_view` | Any page (automatic in Plausible) | `locale`, UTM params |
| `template_view` | A template preview is opened/played in `/templates` or the builder picker | `template_slug`, `category`, `is_paid`, `locale` |
| `create_started` | User clicks "use this template" and an experience draft is created | `template_slug`, `category` |
| `publish` | Experience is published (free) or unlocked (paid after approval) | `template_slug`, `category`, `price_egp`, `comped` (bool) |
| `payment_submitted` | Buyer uploads the InstaPay proof | `template_slug`, `price_egp`, `partner_code` (if any) |
| `card_opened` | Recipient taps the open gate on `/p/[slug]` | `template_slug`, `category`, `locale` |
| `rsvp_click` | Guest taps the RSVP (WhatsApp) button | `template_slug` |
| `share` | Sender taps copy-link / WhatsApp share in the dashboard, **or** a recipient taps the end-card CTA | `surface` (`dashboard` / `card_footer`), `template_slug` |

Add `directions_click` (venue map) too — cheap and it is the proof point for script A.
Never send names, phone numbers or photos as event props (privacy + PDPL, §11).

### Funnel targets (bootstrap scenario, cumulative for the 90 days)

| Step | Target | Rate |
| --- | --- | --- |
| Unique visitors | 25,000 | — |
| `template_view` | 12,000 | 48% of visitors |
| `create_started` | 3,000 | 25% of template viewers |
| `publish` (all) | 1,500 | 50% of starts |
| — of which invitations | 250 | |
| `payment_submitted` | 330 | invitations 230 + cards 100 |
| Approved paid orders | 300 | ≥ 90% of submissions |
| `card_opened` | 45,000 | invitations ≈ 150 opens each + cards ≈ 3 |
| `rsvp_click` / invitation opens | ≥ 15% | |
| `share` from card footer / `card_opened` | ≥ 1% | (once CTA exists) — this is the loop |
| **Revenue** | **≈ 45,000 EGP** | 230 × ~170 avg (mix of 149/199) + 100 × ~65 |

Scale ≈ 2× in the 10k scenario and ≈ 5× in the 50k scenario — but only if the
footer CTA and OG preview ship; without them paid traffic is doing all the work.

### North-star & health metrics (weekly review, Sunday)

- **North star:** invitations published per week.
- **Loop:** new creators whose first visit came from `utm_source=card` ÷ `card_opened`.
- **Payment friction:** median minutes `payment_submitted → approved` (target < 120);
  % of submissions rejected (fake/incorrect proofs).
- **Quality:** % of invitations with a venue map link; % with ≥ 3 photos.
- **CAC** (paid scenarios): ad spend ÷ approved paid orders; target < 60 EGP for
  invitations, < 20 EGP for cards.

---

## 10. Budget scenarios (monthly)

| Line | Bootstrap (~1.5k EGP) | 10k EGP | 50k EGP |
| --- | --- | --- | --- |
| Hosting + DB + domain + email [verify on provider pricing pages] | ~1,000–1,500 | ~1,500 | ~2,500 (bigger DB, backups) |
| Meta ads | 0 | 4,500 | 20,000 |
| TikTok Spark Ads / boosts | 0 | 1,500 | 7,000 |
| Nano/micro creators (Egypt: nano $50–200, micro $200–800 per post — [Valors](https://valors.agency/influencer-marketing-cost-egypt)) | 0 (comped accounts + commission only) | 2,000 (2–3 nano creators, or product + commission) | 12,000 (2 micro + 4 nano) |
| Facebook group admin posts / giveaways | 0 (5 free invites) | 500 | 2,000 |
| Freelance video editor (batch days) | 0 (founder records) | 0 | 4,500 |
| Printed QR table cards / flyers for venues | 0 | 0 | 2,000 |
| **Expected outcome (90 days)** | ~300 paid orders, ~45k EGP | ~600 paid, ~95k EGP | ~1,500 paid, ~240k EGP [verify after W8] |

Bootstrap relies entirely on partners, founder content, and the in-card loop.
Don't move up a scenario until W8's funnel review shows `create_started → publish`
≥ 25% — buying traffic into a leaky funnel wastes the money.

---

## 11. Content calendar (Egyptian calendar, Oct 2026 → Sep 2027)

Islamic dates shift ±1 day with moon sighting.

| When | Occasion | Product focus | Content / campaign |
| --- | --- | --- | --- |
| Oct 2026 | Autumn wedding season, katb el-ketab | Invitations (founding offer) | Scripts A–E, partner onboarding |
| 4 Nov 2026 | **Egyptian Love Day** (عيد الحب المصري) | Valentine cards (free EN, 49 AR) | "Surprise her at work" POV |
| Nov–Dec 2026 | Winter weddings | Invitations | "Winter wedding, smart budget" |
| 25 Dec / 31 Dec 2026 | Christmas / New Year | Greeting cards [needs template] | Year recap post |
| 7 Jan 2027 | Coptic Christmas | Greeting cards [needs template] | Respectful, bilingual |
| Jan 2027 | Mid-year exams / post-exam birthdays | Free birthday | Student ambassadors |
| **8 Feb 2027 (≈)** | **Ramadan starts** ([AnyCalendar](https://anycalendar.org/ramadan-calendar/2027)) | Ramadan Kareem cards [needs template]; **pre-sell post-Eid wedding invitations** | Ramadan nights content (post after iftar, 21:00–01:00 is peak scrolling [verify in Plausible]) |
| 14 Feb 2027 | Valentine's (inside Ramadan — low-key) | Valentine cards | Light, respectful tone |
| **10 Mar 2027 (≈)** | **Eid al-Fitr** ([CalendarDate](https://www.calendardate.com/eid_al_fitr_2027.htm)) | Eid cards (49 AR / free EN), Eidiya gift section | Biggest card week of the year; staff approvals |
| 21 Mar 2027 | **Mother's Day** (عيد الأم) | Cards [needs template] | Expats → mums |
| Mar–May 2027 | Post-Eid / spring wedding peak | Invitations | Planner push #2 |
| 3 May 2027 (≈) | Sham el-Nessim | Cards (fun) | Low priority |
| **16–17 May 2027 (≈)** | **Eid al-Adha** ([Wego](https://blog.wego.com/when-is-eid-al-adha/)) | Eid cards | Second Eid campaign |
| Jun–Jul 2027 | University graduations; summer wedding season | Graduation cards, invitations | Graduation TikTok challenge |
| Jul–Aug 2027 | Thanaweya Amma results [verify date] | Graduation (AR 49) | «مبروك النجاح» |
| Sep 2027 | Back to school; early autumn weddings | Invitations | Anniversary of launch: "1 year of Congrats" |

---

## 12. Risks & mitigations

| Risk | Likelihood | Impact | Mitigation |
| --- | --- | --- | --- |
| **Uploaded photos & payment proofs lost on redeploy** (local-disk storage; free/basic hosts have ephemeral disks) | High if not addressed | Critical — couples' invitations break | Persistent volume or R2 before launch (LAUNCH_CHECKLIST §B). |
| **Price edits reverted on each deploy** (seed overwrites price) | Certain today | Medium | Change prices in code until the seed is fixed (cross-stream note). |
| Manual approval too slow (Thu/Fri nights, Eid) | Medium | High — couples send invites the night they pay | 2-hour SLA; second approver; Paymob once > 30 orders/day. |
| Fake/edited InstaPay screenshots | Medium | Medium | Approve only after seeing the credit **in your bank app**, matching amount + time + sender name. |
| Music or art licensing claim | Low–Medium | High | Only licensed tracks (`public/audio/README.md`) and cleared art (`docs/ART_BRIEF.md`). Keep licences in a folder. |
| **Egypt PDPL** — executive regulations issued Nov 2025, one-year grace → enforcement ≈ Oct–Nov 2026; licences for controllers, e-marketing and cross-border transfer ([Al Tamimi](https://www.tamimi.com/law_update_articles/from-policy-to-practice-egypt-issues-executive-regulations-of-the-personal-data-protection-law/), [Kennedys](https://www.kennedyslaw.com/en/thought-leadership/article/2026/egypt-s-personal-data-protection-law-the-compliance-countdown-has-begun/)) | Medium | High | We process names, photos and phone numbers, hosted abroad. Get a one-hour lawyer consult before scaling paid ads (LAUNCH_CHECKLIST §H). |
| Tax / e-invoicing once revenue > 250k EGP/yr ([Wafeq](https://www.wafeq.com/en-eg/tax-and-reporting/electronic-invoice-system)) | Likely in year 1 at 50k scenario | Medium | Register as sole proprietorship / company early; keep order exports. |
| Wedding seasonality (Ramadan trough) | Certain | Medium | Cards carry Ramadan/Eid; pre-sell post-Eid invitations during Ramadan. |
| WhatsApp number restricted for spam | Low if rules followed | High | One-to-one only; opt-in broadcast lists. |
| Competitors (Da3wa etc.) enter Egypt harder / copy the look | Medium | Medium | Win on Egyptian copy, partners and speed; ship the RSVP dashboard in Q1 2027. |
| EGP devaluation raises USD hosting/ad costs | Medium | Low–Medium | Review prices each quarter; ads budget is in EGP-billed Meta account where possible [verify]. |

---

## 13. Product asks that marketing depends on (for the dev streams)

In priority order — each is small, each changes the numbers above:

1. End-of-card CTA «اعمل دعوتك / Make your own» with UTM (`/p/[slug]` player).
2. Locale-aware OG title + OG image for `/p/[slug]` (WhatsApp preview).
3. Analytics events in §9.
4. Seed must not overwrite admin-edited prices / status.
5. `?ref=` capture → stored on the order (partner program without spreadsheets).
6. Discount codes (founding offer, partner packs).
7. RSVP counter / guest list (unlocks Invitation Pro 499).
8. Templates: Ramadan Kareem, Mother's Day, New Year, Coptic Christmas, engagement / katb el-ketab invitation.
9. Arabic blog pages under `/ar/blog`.
