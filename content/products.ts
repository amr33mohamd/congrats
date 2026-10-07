/**
 * Product landing pages: /[locale]/products/<slug>.
 *
 * One entry per product recommended in
 * research_notes/Products and USP research/competitor_products.md. All product
 * copy (Arabic + English) lives here so a product is one object; the page
 * chrome (section headings, the shared FAQ) lives in messages/<locale>/products.json.
 *
 * HONESTY RULES (enforced by content/products.test.ts where it can be):
 *  - A `self` tier is something a visitor can make alone today, so its price
 *    MUST equal the price of a real catalog template (`selfTemplate`).
 *  - Anything the platform does not do yet is either a `whatsapp` tier
 *    ("بنعمله لك يدوي" — our team builds it from existing features) or a
 *    feature flagged `soon: true`, which renders a "قريباً" chip.
 *  - The primary CTA points at a real template preview (/t/<slug>), a real
 *    occasion gallery (/templates/<category>), or WhatsApp.
 */
import type { CategorySlug } from '@/content/templates/_helpers';

export type L = { ar: string; en: string };

export type ProductCta =
  /** The template's public preview page (/t/<slug>), which has a "make this card" bar. */
  | { kind: 'template'; slug: string }
  /** The occasion gallery (/templates/<category>). */
  | { kind: 'category'; slug: CategorySlug }
  /** No self-serve flow fits — order on WhatsApp with the product named. */
  | { kind: 'whatsapp' };

export interface ProductFeature {
  text: L;
  /** Not built yet — shown with a "قريباً" chip, never sold as available. */
  soon?: boolean;
}

export interface ProductTier {
  name: L;
  /** EGP. 0 = free. null = "custom quote". */
  price: number | null;
  /** Shown under the price ("لكل كارت", "لـ ٥٠ اسم"…). */
  unit?: L;
  /** `self`: made by the visitor in the builder. `whatsapp`: our team makes it. */
  fulfilment: 'self' | 'whatsapp';
  /** For `self` tiers: the catalog template whose price this tier quotes. */
  selfTemplate?: string;
  featured?: boolean;
  features: ProductFeature[];
}

export interface Product {
  slug: string;
  emoji: string;
  /** Short product name, used in the index, the WhatsApp message and the title. */
  name: L;
  /** Occasion / season line shown as the hero eyebrow. */
  season: L;
  headline: L;
  subheadline: L;
  /** The 3 benefit bullets from the research. */
  bullets: [L, L, L];
  /** "إزاي بيشتغل" — exactly 3 steps. */
  steps: [Step, Step, Step];
  /** Who it's for. */
  audience: L[];
  primary: ProductCta;
  /** Label of the primary CTA. */
  primaryLabel: L;
  /** A published catalog template rendered live as the demo. Omit for a static mock. */
  demoTemplate?: string;
  /** Which static mock to draw when there is no live demo. */
  mock?: 'rsvp-dashboard';
  tiers: ProductTier[];
  /** Product-specific FAQ, rendered before the shared FAQ. */
  faq: { q: L; a: L }[];
  seo: { title: L; description: L };
}

interface Step {
  title: L;
  body: L;
}

/* Reused step copy ─────────────────────────────────────────────────────── */

const STEP_PICK: Step = {
  title: { ar: 'اختار التصميم', en: 'Pick the design' },
  body: {
    ar: 'شوف المعاينة الحية واختار اللي على ذوقك — من غير حساب.',
    en: 'Watch the live preview and pick the one you like — no account needed.',
  },
};
const STEP_SHARE: Step = {
  title: { ar: 'ابعت اللينك', en: 'Send the link' },
  body: {
    ar: 'بعد تأكيد الدفع بإنستاباي اللينك يتفتح، وتبعته واتساب لأي حد.',
    en: 'Once your InstaPay payment is confirmed the link goes live — send it on WhatsApp.',
  },
};
const STEP_WA_SEND: Step = {
  title: { ar: 'ابعتلنا على واتساب', en: 'Message us on WhatsApp' },
  body: {
    ar: 'قولنا المناسبة والأسماء وابعت الصور، ونقولك السعر والميعاد قبل أي دفع.',
    en: 'Tell us the occasion and names, send the photos, and we confirm price and timing before you pay.',
  },
};
const STEP_WA_BUILD: Step = {
  title: { ar: 'إحنا نجهّزه لك', en: 'We build it for you' },
  body: {
    ar: 'فريقنا يعمله على نفس التصميمات، وتشوف معاينة وتطلب أي تعديل.',
    en: 'Our team builds it on the same designs; you preview it and ask for changes.',
  },
};

/* Products ─────────────────────────────────────────────────────────────── */

export const PRODUCTS: Product[] = [
  {
    slug: 'love-story',
    emoji: '💞',
    name: { ar: 'حكايتنا — موقع قصة حبكم', en: 'Hekayetna — your love-story page' },
    season: {
      ar: 'عيد الحب المصري ٤ نوفمبر · ١٤ فبراير · ذكرى الجواز',
      en: 'Egyptian Valentine’s (4 Nov) · 14 Feb · anniversaries',
    },
    headline: {
      ar: 'قصتكم كلها في لينك واحد… هتعيّط من الفرحة',
      en: 'Your whole story in one link… happy tears guaranteed',
    },
    subheadline: {
      ar: 'صوركم وكلامك ومزيكا هادية في صفحة متحركة بتتفتح على موبايلها — أحلى من أي بوست.',
      en: 'Your photos, your words and soft music in an animated page that opens on her phone.',
    },
    bullets: [
      {
        ar: 'هتعمله في ١٠ دقايق من موبايلك، من غير ما تفهم في التصميم',
        en: 'Made in 10 minutes on your phone — no design skills',
      },
      {
        ar: 'صوركم وكلامك من القلب… كله في مكان واحد',
        en: 'Your photos and your words, all in one place',
      },
      {
        ar: 'أرخص من بوكيه ورد وبيفضل معاها على طول',
        en: 'Cheaper than a bouquet, and it lasts',
      },
    ],
    steps: [
      STEP_PICK,
      {
        title: { ar: 'حط صوركم وكلامك', en: 'Add your photos and words' },
        body: {
          ar: 'اكتب اسمها وجوابك ونزّل صوركم، وشوف المعاينة وإنت بتكتب.',
          en: 'Type her name and your letter, upload photos, and watch the preview update.',
        },
      },
      STEP_SHARE,
    ],
    audience: [
      { ar: 'جوز أو خطيب عايز يفاجئ مراته أو خطيبته', en: 'Husbands and fiancés planning a surprise' },
      { ar: 'زوجة بتحتفل بذكرى الجواز', en: 'Wives celebrating an anniversary' },
      { ar: 'أي حد عايز يقول «بحبك» بطريقة تتحفظ', en: 'Anyone who wants to say “I love you” in a way that lasts' },
    ],
    primary: { kind: 'template', slug: 'anniversary-hobbna-ar' },
    primaryLabel: { ar: 'اعمل حكايتكم دلوقتي', en: 'Make your story now' },
    demoTemplate: 'anniversary-hobbna-ar',
    tiers: [
      {
        name: { ar: 'اعملها بنفسك', en: 'Do it yourself' },
        price: 49,
        unit: { ar: 'مرة واحدة للكارت', en: 'one-time, per card' },
        fulfilment: 'self',
        selfTemplate: 'anniversary-hobbna-ar',
        featured: true,
        features: [
          { text: { ar: 'تصميم متحرك بالعربي ومزيكا هادية', en: 'Animated Arabic design with soft music' } },
          { text: { ar: 'صوركم واسمها وجوابك', en: 'Your photos, her name, your letter' } },
          { text: { ar: 'تعدّل بعد النشر على نفس اللينك', en: 'Edit after publishing, same link' } },
        ],
      },
      {
        name: { ar: 'حكايتنا كاملة — نعملها لك', en: 'Full story — made for you' },
        price: 99,
        unit: { ar: 'بنعملها لك يدوي', en: 'hand-made by our team' },
        fulfilment: 'whatsapp',
        features: [
          { text: { ar: 'ابعت الصور والحكاية على واتساب ونرتبها لك', en: 'Send photos and the story on WhatsApp, we arrange it' } },
          { text: { ar: 'نكتب معاك الجواب بالمصري لو محتاج', en: 'We help write the letter if you want' } },
          { text: { ar: 'تايم لاين لأول لقاء والخطوبة والفرح', en: 'Timeline: first meeting, engagement, wedding' }, soon: true },
          { text: { ar: 'أغنيتكم إنتم وباسورد للصفحة', en: 'Your own song and a page password' }, soon: true },
        ],
      },
    ],
    faq: [
      {
        q: { ar: 'هي هتحتاج تعمل حساب علشان تفتحه؟', en: 'Does she need an account to open it?' },
        a: {
          ar: 'لأ. بتدوس على اللينك والصفحة تشتغل في المتصفح على طول.',
          en: 'No. She taps the link and it plays in her browser.',
        },
      },
    ],
    seo: {
      title: { ar: 'حكايتنا — موقع قصة حب متحرك بصوركم | هدية عيد الحب', en: 'Hekayetna — an animated love-story page with your photos' },
      description: {
        ar: 'اعمل لمراتك أو خطيبتك صفحة متحركة بقصتكم وصوركم وجوابك في ١٠ دقايق. هدية عيد الحب المصري وذكرى الجواز من ٤٩ جنيه، بالدفع بإنستاباي.',
        en: 'An animated page with your story, photos and letter, made in 10 minutes. A Valentine’s or anniversary gift from EGP 49, paid by InstaPay.',
      },
    },
  },

  {
    slug: 'digital-eidiya',
    emoji: '🌙',
    name: { ar: 'عيدية ديجيتال', en: 'Digital Eidiya card' },
    season: { ar: 'عيد الفطر · عيد الأضحى · رمضان', en: 'Eid al-Fitr · Eid al-Adha · Ramadan' },
    headline: {
      ar: 'العيدية بقت لينك… وفرحتها زي ما هي',
      en: 'Eidiya is a link now… and it still feels like Eid',
    },
    subheadline: {
      ar: 'كارت عيد متحرك باسم كل واحد في العيلة، ومعاه العيدية على إنستاباي.',
      en: 'An animated Eid card with each person’s name, plus the Eidiya sent by InstaPay.',
    },
    bullets: [
      { ar: 'كارت متحرك باسمه بيتفتح على موبايله', en: 'An animated card with their name, opening on their phone' },
      { ar: 'ابعتها للعيلة كلها في دقيقة، حتى لو إنت برّه مصر', en: 'Send to the whole family in a minute, even from abroad' },
      { ar: 'اكتب رسالتك ورقم إنستاباي بتاعك جوه الكارت', en: 'Write your message and InstaPay details inside the card' },
    ],
    steps: [
      STEP_PICK,
      {
        title: { ar: 'اكتب الاسم والرسالة', en: 'Add the name and message' },
        body: {
          ar: 'حط اسم اللي هتعيّد عليه ورسالتك. العيدية نفسها بتحوّلها إنت على إنستاباي — إحنا مش بنلمس فلوسك.',
          en: 'Add their name and your message. You send the money yourself by InstaPay — we never touch it.',
        },
      },
      STEP_SHARE,
    ],
    audience: [
      { ar: 'الأب والأم والخال والعمة', en: 'Parents, uncles and aunts' },
      { ar: 'المصريين اللي برّه وعايزين يعيّدوا على العيلة', en: 'Egyptians abroad sending to family' },
      { ar: 'الشباب اللي بيعيّدوا على إخواتهم وصحابهم', en: 'Young people sending to siblings and friends' },
    ],
    primary: { kind: 'template', slug: 'eid-blessings-ar' },
    primaryLabel: { ar: 'اعمل كارت العيدية', en: 'Make an Eidiya card' },
    demoTemplate: 'eid-blessings-ar',
    tiers: [
      {
        name: { ar: 'كارت العيد', en: 'Eid card' },
        price: 49,
        unit: { ar: 'لكل كارت', en: 'per card' },
        fulfilment: 'self',
        selfTemplate: 'eid-blessings-ar',
        featured: true,
        features: [
          { text: { ar: 'تصميم عيد متحرك بالعربي', en: 'Animated Arabic Eid design' } },
          { text: { ar: 'اسم المستلم ورسالتك', en: 'Recipient’s name and your message' } },
          { text: { ar: 'ظرف بيتفتح والفلوس تطير', en: 'Envelope opens, banknotes fly out' }, soon: true },
          { text: { ar: 'رسالة بصوتك', en: 'A voice note from you' }, soon: true },
        ],
      },
      {
        name: { ar: 'باقة العيلة — ١٠ أسامي', en: 'Family pack — 10 names' },
        price: 99,
        unit: { ar: 'بنعملها لك يدوي', en: 'hand-made by our team' },
        fulfilment: 'whatsapp',
        features: [
          { text: { ar: 'ابعتلنا الأسامي ونجهّز ١٠ كروت باسم كل واحد', en: 'Send the names, we make 10 named cards' } },
          { text: { ar: 'لينك منفصل لكل واحد جاهز للواتساب', en: 'A separate link per person, ready for WhatsApp' } },
        ],
      },
    ],
    faq: [
      {
        q: { ar: 'Congrats بتحوّل العيدية نفسها؟', en: 'Does Congrats send the money?' },
        a: {
          ar: 'لأ، إنت بتحوّلها بنفسك على إنستاباي. الكارت هو الفرحة اللي بتوصل معاها.',
          en: 'No — you transfer it yourself by InstaPay. The card is the joy that comes with it.',
        },
      },
    ],
    seo: {
      title: { ar: 'عيدية ديجيتال — كارت عيد متحرك باسم كل واحد', en: 'Digital Eidiya — animated Eid cards with each name' },
      description: {
        ar: 'ابعت العيدية مع كارت عيد متحرك باسم كل واحد في العيلة، حتى لو إنت برّه مصر. من ٤٩ جنيه وباقة ١٠ أسامي بـ ٩٩ جنيه.',
        en: 'Send Eidiya with an animated Eid card named for each family member. From EGP 49; 10 names for EGP 99.',
      },
    },
  },

  {
    slug: 'katb-ketab-invitation',
    emoji: '💍',
    name: { ar: 'دعوة كتب الكتاب والخطوبة والحنة', en: 'Katb ketab, engagement & henna invitation' },
    season: { ar: 'طول السنة · الصيف وبعد العيدين', en: 'All year · peaks in summer and after Eid' },
    headline: {
      ar: 'كتب كتابكم يستاهل دعوة على مقامه',
      en: 'Your katb ketab deserves an invitation to match',
    },
    subheadline: {
      ar: 'دعوة من صفحة واحدة فيها الميعاد واللوكيشن والعدّاد وتأكيد الحضور على واتساب.',
      en: 'A one-page invitation with date, map, countdown and WhatsApp RSVP.',
    },
    bullets: [
      { ar: 'اللوكيشن والميعاد والعدّاد في لينك واحد على الواتساب', en: 'Location, date and countdown in one WhatsApp link' },
      { ar: 'زرار تأكيد حضور بيفتح واتساب برسالة جاهزة', en: 'An RSVP button that opens WhatsApp with a ready message' },
      { ar: 'باقة الخطوبة + كتب الكتاب + الفرح بسعر أقل', en: 'Engagement + katb ketab + wedding bundle, for less' },
    ],
    steps: [
      STEP_PICK,
      {
        title: { ar: 'اكتب التفاصيل', en: 'Fill in the details' },
        body: {
          ar: 'أسماء العروسين والعيلتين والميعاد والقاعة ورقم تأكيد الحضور.',
          en: 'Couple and family names, date, venue and the RSVP number.',
        },
      },
      STEP_SHARE,
    ],
    audience: [
      { ar: 'العروسين قبل الفرح بشهور', en: 'Couples months before the wedding' },
      { ar: 'أم العروسة أو أم العريس', en: 'The bride’s or groom’s mother' },
      { ar: 'اللي عاملين خطوبة أو حنة صغيرة', en: 'Anyone planning a small engagement or henna' },
    ],
    primary: { kind: 'category', slug: 'invitation' },
    primaryLabel: { ar: 'شوف تصميمات الدعوات', en: 'See invitation designs' },
    demoTemplate: 'invitation-qasr-gold-ar',
    tiers: [
      {
        name: { ar: 'دعوة واحدة', en: 'One invitation' },
        price: 79,
        unit: { ar: 'مرة واحدة للدعوة', en: 'one-time, per invitation' },
        fulfilment: 'self',
        selfTemplate: 'invitation-qasr-gold-ar',
        featured: true,
        features: [
          { text: { ar: 'العيلتين والميعاد والقاعة والخريطة', en: 'Families, date, venue and map' } },
          { text: { ar: 'عدّاد تنازلي لليوم الكبير', en: 'Countdown to the big day' } },
          { text: { ar: 'تأكيد حضور على واتساب', en: 'RSVP on WhatsApp' } },
        ],
      },
      {
        name: { ar: 'باقة خطوبة + كتب كتاب + فرح', en: 'Engagement + katb ketab + wedding' },
        price: 179,
        unit: { ar: '٣ دعوات — بدل ٢٣٧', en: '3 invitations — instead of 237' },
        fulfilment: 'whatsapp',
        features: [
          { text: { ar: '٣ دعوات بنفس الستايل لكل مناسبة', en: '3 matching invitations, one per event' } },
          { text: { ar: 'نظبط لك نص كتب الكتاب والآية', en: 'We adapt the katb ketab wording and verse' } },
          { text: { ar: 'تصميمات مخصوص للحنة بألوانها', en: 'Dedicated colourful henna designs' }, soon: true },
        ],
      },
    ],
    faq: [
      {
        q: { ar: 'فيه تصميم مخصوص لكتب الكتاب؟', en: 'Is there a design just for katb ketab?' },
        a: {
          ar: 'الدعوات الحالية بتتعدّل نصوصها بالكامل، فبتكتب «كتب كتاب» أو «خطوبة» بدل «فرح». لو عايز صياغة أو آية مخصوص ابعتلنا ونظبطها لك.',
          en: 'Every text on the current invitations is editable, so it can say “katb ketab” or “engagement”. Want special wording or a verse? Message us.',
        },
      },
    ],
    seo: {
      title: { ar: 'دعوة كتب كتاب وخطوبة إلكترونية على واتساب', en: 'Katb ketab & engagement e-invitation on WhatsApp' },
      description: {
        ar: 'دعوة كتب كتاب أو خطوبة أو حنة من صفحة واحدة: الميعاد واللوكيشن والعدّاد وتأكيد الحضور على واتساب. بـ ٧٩ جنيه، وباقة ٣ مناسبات بـ ١٧٩.',
        en: 'A one-page katb ketab, engagement or henna invitation with map, countdown and WhatsApp RSVP. EGP 79; 3-event bundle EGP 179.',
      },
    },
  },

  {
    slug: 'wedding-full-package',
    emoji: '💐',
    name: { ar: 'باقة الفرح الكاملة', en: 'Full wedding package' },
    season: { ar: 'موسم الأفراح · يونيو لسبتمبر وبعد العيد', en: 'Wedding season · June–September and after Eid' },
    headline: {
      ar: 'اعرف مين جاي قبل الفرح… وخد صور الليلة كلها من ضيوفك',
      en: 'Know who’s coming… and get every photo from your guests',
    },
    subheadline: {
      ar: 'دعوة الفرح + متابعة الحضور + ألبوم الضيوف. أجزاء منها شغالة النهارده، والباقي بنعمله لك يدوي لحد ما يخلص.',
      en: 'Invitation + guest tracking + guest album. Parts work today; the rest our team handles by hand until it ships.',
    },
    bullets: [
      { ar: 'تأكيد الحضور يوصلك على واتساب، من غير ما تتصل بحد', en: 'RSVPs arrive on WhatsApp — no calling around' },
      { ar: 'QR تحطه على الترابيزة يفتح الدعوة', en: 'A table QR that opens the invitation' },
      { ar: 'كشف بمين أكد ومين لأ نجهّزه لك', en: 'We compile who confirmed and who didn’t' },
    ],
    steps: [
      STEP_WA_SEND,
      STEP_WA_BUILD,
      {
        title: { ar: 'استلم كل حاجة', en: 'Receive everything' },
        body: {
          ar: 'اللينك والـQR وكشف الحضور، وتدفع بإنستاباي بعد ما توافق.',
          en: 'The link, the QR and the guest list; pay by InstaPay once you approve.',
        },
      },
    ],
    audience: [
      { ar: 'عرسان عندهم أكتر من ١٠٠ ضيف', en: 'Couples with 100+ guests' },
      { ar: 'اللي عملوا دعوة الـ٧٩ وعايزين يتابعوا الحضور', en: 'Couples on the 79 EGP invitation who want guest tracking' },
    ],
    primary: { kind: 'whatsapp' },
    primaryLabel: { ar: 'اطلبه على واتساب', en: 'Order on WhatsApp' },
    mock: 'rsvp-dashboard',
    tiers: [
      {
        name: { ar: 'الدعوة بس', en: 'Invitation only' },
        price: 79,
        unit: { ar: 'تعملها بنفسك', en: 'do it yourself' },
        fulfilment: 'self',
        selfTemplate: 'invitation-qasr-gold-ar',
        features: [
          { text: { ar: 'العيلتين والميعاد والخريطة والعدّاد', en: 'Families, date, map and countdown' } },
          { text: { ar: 'تأكيد حضور على واتساب', en: 'RSVP on WhatsApp' } },
          { text: { ar: 'QR للينك تطبعه', en: 'A printable QR for the link' } },
        ],
      },
      {
        name: { ar: 'الباقة الكاملة', en: 'Full package' },
        price: 249,
        unit: { ar: 'سعر الإطلاق', en: 'launch price' },
        fulfilment: 'whatsapp',
        featured: true,
        features: [
          { text: { ar: 'الدعوة متظبطة لك من فريقنا', en: 'The invitation, set up by our team' } },
          { text: { ar: 'كشف حضور نجمّعه لك من ردود واتساب', en: 'A guest list we compile from WhatsApp replies' } },
          { text: { ar: 'لوحة بمين أكد وتصدير Excel', en: 'A live RSVP dashboard with Excel export' }, soon: true },
          { text: { ar: 'ألبوم صور الضيوف بالـQR', en: 'A QR guest photo album' }, soon: true },
          { text: { ar: 'حيطة تهاني برسايل صوتية', en: 'A wishes wall with voice notes' }, soon: true },
        ],
      },
    ],
    faq: [
      {
        q: { ar: 'إيه الشغال النهارده وإيه اللي قريباً؟', en: 'What works today and what is coming?' },
        a: {
          ar: 'الدعوة والخريطة والعدّاد وتأكيد الحضور على واتساب والـQR شغالين. اللوحة والألبوم وحيطة التهاني لسه بنبنيهم — ولحد ما يخلصوا بنعمل كشف الحضور لك يدوي.',
          en: 'The invitation, map, countdown, WhatsApp RSVP and QR work today. The dashboard, album and wishes wall are being built — until then we compile the guest list by hand.',
        },
      },
    ],
    seo: {
      title: { ar: 'باقة الفرح الكاملة — دعوة وتأكيد حضور وكشف ضيوف', en: 'Full wedding package — invitation, RSVP and guest list' },
      description: {
        ar: 'دعوة فرح إلكترونية مع تأكيد حضور على واتساب وQR وكشف بالضيوف نجهّزه لك. باقة كاملة بـ ٢٤٩ جنيه — أقل من نص سعر المنافسين.',
        en: 'A wedding e-invitation with WhatsApp RSVP, QR and a guest list we compile for you. Full package EGP 249.',
      },
    },
  },

  {
    slug: 'sebou-baby-announcement',
    emoji: '🍼',
    name: { ar: 'إعلان المولود ودعوة السبوع', en: 'Baby announcement & sebou3 invitation' },
    season: { ar: 'طول السنة · أول ٧ أيام بعد الولادة', en: 'All year · the 7 days after birth' },
    headline: { ar: 'نوّر الدنيا… قول للعيلة كلها بلينك واحد', en: 'They’re here! Tell the whole family with one link' },
    subheadline: {
      ar: 'كارت متحرك باسم البيبي وصورته، والعيلة اللي برّه تشوفه في نفس اللحظة.',
      en: 'An animated card with the baby’s name and photo that family abroad see instantly.',
    },
    bullets: [
      { ar: 'إعلان المولود جاهز في ٥ دقايق من موبايلك', en: 'The announcement is ready in 5 minutes on your phone' },
      { ar: 'العيلة اللي برّه تشوف البيبي وتبارك على طول', en: 'Family abroad see the baby and congratulate right away' },
      { ar: 'QR تحطه على شنط السبوع يفتح صفحة البيبي', en: 'A QR for the sebou3 bags that opens the baby’s page' },
    ],
    steps: [
      STEP_PICK,
      {
        title: { ar: 'حط اسم البيبي وصورته', en: 'Add the baby’s name and photo' },
        body: {
          ar: 'الاسم والصورة ورسالة من بابا وماما.',
          en: 'Name, photo and a note from mum and dad.',
        },
      },
      {
        title: { ar: 'ابعت واطبع الـQR', en: 'Send it and print the QR' },
        body: {
          ar: 'ابعت اللينك للعيلة، ونزّل الـQR تلزقه على شنط السبوع.',
          en: 'Send the link to the family and download the QR for the sebou3 bags.',
        },
      },
    ],
    audience: [
      { ar: 'بابا وماما الجداد', en: 'New parents' },
      { ar: 'الجدة أو الخالة اللي بتنظّم السبوع', en: 'The grandmother or aunt organising the sebou3' },
    ],
    primary: { kind: 'template', slug: 'newborn-mabrouk-elmawloud-ar' },
    primaryLabel: { ar: 'اعمل إعلان المولود — مجاناً', en: 'Make the announcement — free' },
    demoTemplate: 'newborn-mabrouk-elmawloud-ar',
    tiers: [
      {
        name: { ar: 'إعلان المولود', en: 'Baby announcement' },
        price: 0,
        unit: { ar: 'تعمله بنفسك', en: 'do it yourself' },
        fulfilment: 'self',
        selfTemplate: 'newborn-mabrouk-elmawloud-ar',
        features: [
          { text: { ar: 'اسم البيبي وصورته ورسالتكم', en: 'Baby’s name, photo and your note' } },
          { text: { ar: 'QR للينك تطبعه', en: 'A printable QR for the link' } },
        ],
      },
      {
        name: { ar: 'دعوة السبوع', en: 'Sebou3 invitation' },
        price: 79,
        unit: { ar: 'بنعملها لك يدوي', en: 'hand-made by our team' },
        fulfilment: 'whatsapp',
        featured: true,
        features: [
          { text: { ar: 'ميعاد السبوع والعنوان والخريطة', en: 'Sebou3 date, address and map' } },
          { text: { ar: 'تأكيد حضور على واتساب', en: 'RSVP on WhatsApp' } },
          { text: { ar: 'ثيم «يا رب يا ربنا» بالغربال والشمع', en: 'A “ya rab ya rabena” theme with sieve and candles' }, soon: true },
        ],
      },
      {
        name: { ar: 'الإعلان + السبوع', en: 'Announcement + sebou3' },
        price: 99,
        unit: { ar: 'بنعملهم لك يدوي', en: 'hand-made by our team' },
        fulfilment: 'whatsapp',
        features: [
          { text: { ar: 'الكارتين بنفس الستايل', en: 'Both cards in one style' } },
          { text: { ar: 'حيطة تهاني للعيلة اللي برّه', en: 'A wishes wall for family abroad' }, soon: true },
        ],
      },
    ],
    faq: [
      {
        q: { ar: 'السبوع بعد ٣ أيام، هتلحقوا؟', en: 'The sebou3 is in 3 days — can you make it?' },
        a: {
          ar: 'الإعلان بتعمله بنفسك في دقايق. دعوة السبوع ابعتلنا على واتساب ونقولك الميعاد قبل ما تدفع.',
          en: 'You make the announcement yourself in minutes. For the sebou3 invite, message us and we confirm timing before you pay.',
        },
      },
    ],
    seo: {
      title: { ar: 'إعلان مولود ودعوة سبوع إلكترونية', en: 'Baby announcement & sebou3 e-invitation' },
      description: {
        ar: 'كارت إعلان مولود متحرك باسم البيبي وصورته مجاناً، ودعوة سبوع بتأكيد حضور على واتساب وQR لشنط السبوع.',
        en: 'A free animated baby announcement with name and photo, plus a sebou3 invitation with WhatsApp RSVP and a QR for favour bags.',
      },
    },
  },

  {
    slug: 'graduation',
    emoji: '🎓',
    name: { ar: 'تهنئة التخرج ودعوة الحفلة', en: 'Graduation card & party invite' },
    season: { ar: 'يونيو لأغسطس · نتيجة الجامعة والثانوية', en: 'June–August · university and thanaweya results' },
    headline: { ar: 'اتخرجت! خلّي الفرحة توصل لكل صحابك', en: 'You graduated! Let every friend share the joy' },
    subheadline: {
      ar: 'كارت تخرج متحرك بصورتك واسمك، ودعوة لحفلة التخرج بالميعاد والمكان.',
      en: 'An animated graduation card with your photo, and an invite to the party.',
    },
    bullets: [
      { ar: 'كارت تهنئة بالاسم والصورة من الأهل والصحاب', en: 'A named card with photo, from family or friends' },
      { ar: 'دعوة الحفلة وتأكيد الحضور في لينك', en: 'Party invite and RSVP in one link' },
      { ar: 'عرض الدفعة: ١٠ خريجين بسعر أقل', en: 'Class deal: 10 graduates for less' },
    ],
    steps: [
      STEP_PICK,
      {
        title: { ar: 'حط الاسم والكلية والصورة', en: 'Add name, faculty and photo' },
        body: { ar: 'اكتب رسالة الفخر وحط صورة التخرج.', en: 'Write your proud message and add the graduation photo.' },
      },
      STEP_SHARE,
    ],
    audience: [
      { ar: 'الخريجين وأهاليهم', en: 'Graduates and their parents' },
      { ar: 'شلة صحاب بتنظّم حفلة', en: 'Friend groups planning a party' },
      { ar: 'دفعة كاملة عايزة كروت لكل واحد', en: 'A whole class that wants a card each' },
    ],
    primary: { kind: 'template', slug: 'graduation-mabrouk-ar' },
    primaryLabel: { ar: 'اعمل كارت التخرج', en: 'Make the graduation card' },
    demoTemplate: 'graduation-mabrouk-ar',
    tiers: [
      {
        name: { ar: 'كارت التخرج', en: 'Graduation card' },
        price: 49,
        unit: { ar: 'تعمله بنفسك', en: 'do it yourself' },
        fulfilment: 'self',
        selfTemplate: 'graduation-mabrouk-ar',
        featured: true,
        features: [
          { text: { ar: 'تصميم متحرك بالعربي', en: 'Animated Arabic design' } },
          { text: { ar: 'الاسم والصورة والرسالة', en: 'Name, photo and message' } },
        ],
      },
      {
        name: { ar: 'دعوة الحفلة', en: 'Party invite' },
        price: 79,
        unit: { ar: 'بنعملها لك يدوي', en: 'hand-made by our team' },
        fulfilment: 'whatsapp',
        features: [
          { text: { ar: 'الميعاد والمكان والخريطة', en: 'Date, venue and map' } },
          { text: { ar: 'تأكيد حضور على واتساب', en: 'RSVP on WhatsApp' } },
          { text: { ar: 'دفتر تهاني يكتب فيه صحابك', en: 'A guestbook for friends’ messages' }, soon: true },
        ],
      },
      {
        name: { ar: 'عرض الدفعة — ١٠ خريجين', en: 'Class pack — 10 graduates' },
        price: 399,
        unit: { ar: 'بنعملها لك يدوي', en: 'hand-made by our team' },
        fulfilment: 'whatsapp',
        features: [
          { text: { ar: '١٠ كروت باسم وصورة كل خريج', en: '10 cards, each with a name and photo' } },
          { text: { ar: 'ثيم «دفعة ٢٠٢٧» بلون الكلية', en: 'A “Class of 2027” theme in faculty colours' }, soon: true },
        ],
      },
    ],
    faq: [],
    seo: {
      title: { ar: 'كارت تهنئة تخرج متحرك ودعوة حفلة التخرج', en: 'Animated graduation card & party invitation' },
      description: {
        ar: 'كارت تخرج متحرك بالاسم والصورة بـ ٤٩ جنيه، ودعوة حفلة التخرج بتأكيد حضور على واتساب، وعرض الدفعة ١٠ خريجين بـ ٣٩٩.',
        en: 'An animated graduation card from EGP 49, a party invite with WhatsApp RSVP, and a 10-graduate class pack for EGP 399.',
      },
    },
  },

  {
    slug: 'birthday-surprise',
    emoji: '🎂',
    name: { ar: 'مفاجأة عيد الميلاد', en: 'Birthday surprise page' },
    season: { ar: 'طول السنة · أكتر مناسبة بتتكرر', en: 'All year · the most frequent occasion' },
    headline: { ar: 'الساعة ١٢ بالظبط… ابعت اللينك والمفاجأة تبدأ', en: 'Midnight sharp… send the link and the surprise begins' },
    subheadline: {
      ar: 'كارت عيد ميلاد متحرك باسمها وصورها، ومعاه رسايل كل صحابها لو عايز نجمّعهالك.',
      en: 'An animated birthday card with her name and photos — plus messages from all her friends if you want us to gather them.',
    },
    bullets: [
      { ar: 'كارت متحرك باسمها وصورها — مجاناً', en: 'An animated card with her name and photos — free' },
      { ar: 'صحابها يبعتولنا رسايلهم ونحطها كلها في كارت واحد', en: 'Her friends send us messages; we put them all in one card' },
      { ar: 'مفاجأة بـ ٧٩ جنيه تعمل أكتر من هدية بألف', en: 'A 79 EGP surprise that beats a 1,000 EGP gift' },
    ],
    steps: [
      STEP_PICK,
      {
        title: { ar: 'حط اسمها وصورها', en: 'Add her name and photos' },
        body: { ar: 'اكتب أمنيتك وشوف المعاينة وإنت بتكتب.', en: 'Write your wish and watch the preview update.' },
      },
      {
        title: { ar: 'ابعته الساعة ١٢', en: 'Send it at midnight' },
        body: {
          ar: 'ابعت اللينك أول ما الساعة تيجي ١٢ والكارت يشتغل على موبايلها.',
          en: 'Send the link at midnight and it plays on her phone.',
        },
      },
    ],
    audience: [
      { ar: 'الجوز أو الخطيب', en: 'Partners and fiancés' },
      { ar: 'البيست فريند والإخوات', en: 'Best friends and siblings' },
      { ar: 'شلة صحاب عايزين يعملوا مفاجأة سوا', en: 'A friend group planning a surprise together' },
    ],
    primary: { kind: 'template', slug: 'birthday-kol-sana-ar' },
    primaryLabel: { ar: 'اعمل كارت عيد الميلاد — مجاناً', en: 'Make the birthday card — free' },
    demoTemplate: 'birthday-kol-sana-ar',
    tiers: [
      {
        name: { ar: 'كارت عيد الميلاد', en: 'Birthday card' },
        price: 0,
        unit: { ar: 'تعمله بنفسك', en: 'do it yourself' },
        fulfilment: 'self',
        selfTemplate: 'birthday-kol-sana-ar',
        features: [
          { text: { ar: 'تصميم متحرك ومزيكا عيد ميلاد', en: 'Animated design with birthday music' } },
          { text: { ar: 'اسمها وصورها وأمنيتك', en: 'Her name, photos and your wish' } },
        ],
      },
      {
        name: { ar: 'صفحة المفاجأة', en: 'Surprise page' },
        price: 79,
        unit: { ar: 'بنعملها لك يدوي', en: 'hand-made by our team' },
        fulfilment: 'whatsapp',
        featured: true,
        features: [
          { text: { ar: 'نجمّع رسايل صحابها ونحطها في الكارت', en: 'We gather her friends’ messages into the card' } },
          { text: { ar: 'صور «سنتها في صور»', en: 'A “her year in photos” gallery' } },
          { text: { ar: 'الصفحة تتفتح لوحدها الساعة ١٢ (+٣٠ جنيه)', en: 'Auto-unlock at midnight (+EGP 30)' }, soon: true },
          { text: { ar: 'تطفي الشمع بنفخة في الموبايل', en: 'Blow out the candles into the mic' }, soon: true },
        ],
      },
    ],
    faq: [],
    seo: {
      title: { ar: 'مفاجأة عيد ميلاد — كارت متحرك برسايل كل الصحاب', en: 'Birthday surprise — an animated card with every friend’s message' },
      description: {
        ar: 'كارت عيد ميلاد متحرك باسمها وصورها مجاناً، وصفحة مفاجأة برسايل كل صحابها بـ ٧٩ جنيه. ابعته الساعة ١٢ بالظبط.',
        en: 'A free animated birthday card, or a EGP 79 surprise page with messages from all her friends. Send it at midnight.',
      },
    },
  },

  {
    slug: 'corporate-greetings',
    emoji: '🏢',
    name: { ar: 'تهاني رمضان والعيد للشركات', en: 'Corporate Ramadan & Eid e-cards' },
    season: { ar: 'رمضان · العيدين · رأس السنة · ٦ أكتوبر', en: 'Ramadan · both Eids · New Year · 6 October' },
    headline: { ar: 'هنّي كل موظف وعميل باسمه… من غير ما تتعب', en: 'Greet every employee and client by name — effortlessly' },
    subheadline: {
      ar: 'كارت متحرك بلوجو شركتك، ولينك باسم كل واحد جاهز يتبعت على واتساب.',
      en: 'An animated card with your logo, and a named link for each person, ready for WhatsApp.',
    },
    bullets: [
      { ar: 'كارت متحرك بلوجو شركتك واسم كل واحد', en: 'An animated card with your logo and each person’s name' },
      { ar: 'ابعتلنا شيت الأسماء، والروابط ترجعلك جاهزة للواتساب', en: 'Send the name sheet; links come back ready for WhatsApp' },
      { ar: 'صورتكم تبقى أشيك قدام العملاء والموظفين', en: 'Your brand looks sharper to clients and staff' },
    ],
    steps: [
      {
        title: { ar: 'ابعتلنا اللوجو والأسماء', en: 'Send logo and names' },
        body: {
          ar: 'لوجو الشركة وشيت Excel بالأسماء ورسالة المدير لو حابب.',
          en: 'Your logo, an Excel sheet of names and an optional CEO message.',
        },
      },
      STEP_WA_BUILD,
      {
        title: { ar: 'استلم الروابط', en: 'Get the links' },
        body: {
          ar: 'شيت فيه لينك باسم كل واحد، وتدفع بإنستاباي أو تحويل بنكي بعد الموافقة.',
          en: 'A sheet with each person’s link; pay by InstaPay after you approve.',
        },
      },
    ],
    audience: [
      { ar: 'HR والماركتينج في الشركات الصغيرة والمتوسطة', en: 'HR and marketing teams at SMEs' },
      { ar: 'العيادات والمدارس', en: 'Clinics and schools' },
      { ar: 'شركات العقارات والسماسرة', en: 'Real-estate companies and brokers' },
    ],
    primary: { kind: 'whatsapp' },
    primaryLabel: { ar: 'اطلب عرض سعر على واتساب', en: 'Get a quote on WhatsApp' },
    demoTemplate: 'eid-blessings-ar',
    tiers: [
      {
        name: { ar: '٥٠ اسم', en: '50 names' },
        price: 999,
        unit: { ar: 'بنعملها لكم يدوي', en: 'hand-made by our team' },
        fulfilment: 'whatsapp',
        features: [
          { text: { ar: 'كارت بلوجو وألوان الشركة', en: 'A card in your logo and colours' } },
          { text: { ar: 'لينك منفصل باسم كل واحد', en: 'A separate named link per person' } },
        ],
      },
      {
        name: { ar: '٢٥٠ اسم', en: '250 names' },
        price: 2499,
        unit: { ar: 'بنعملها لكم يدوي', en: 'hand-made by our team' },
        fulfilment: 'whatsapp',
        featured: true,
        features: [
          { text: { ar: 'كل مميزات باقة الـ٥٠', en: 'Everything in the 50 pack' } },
          { text: { ar: 'رسالة من المدير في الكارت', en: 'A message from the CEO in the card' } },
          { text: { ar: 'تقرير بمين فتح التهنئة', en: 'A report of who opened it' }, soon: true },
        ],
      },
      {
        name: { ar: 'أكتر من ٢٥٠', en: 'More than 250' },
        price: null,
        unit: { ar: 'عرض سعر مخصوص', en: 'custom quote' },
        fulfilment: 'whatsapp',
        features: [{ text: { ar: 'كلمنا ونعملك عرض على عددكم', en: 'Talk to us for a quote' } }],
      },
    ],
    faq: [
      {
        q: { ar: 'إمتى لازم نطلب قبل رمضان؟', en: 'How early should we order before Ramadan?' },
        a: {
          ar: 'يفضّل قبلها بأسبوعين لـ٣ أسابيع علشان نلحق نراجع التصميم معاكم.',
          en: 'Two to three weeks ahead, so there is time to review the design with you.',
        },
      },
    ],
    seo: {
      title: { ar: 'تهاني رمضان والعيد للشركات — كارت باسم كل موظف', en: 'Corporate Ramadan & Eid e-cards — one per employee' },
      description: {
        ar: 'كروت تهنئة متحركة بلوجو شركتك واسم كل موظف وعميل، روابط جاهزة للواتساب. ٥٠ اسم بـ ٩٩٩ جنيه و٢٥٠ اسم بـ ٢٤٩٩.',
        en: 'Animated greeting cards with your logo and each recipient’s name, as WhatsApp-ready links. 50 names EGP 999; 250 names EGP 2,499.',
      },
    },
  },
];

export function productBySlug(slug: string): Product | undefined {
  return PRODUCTS.find((p) => p.slug === slug);
}

export function pick(l: L, locale: 'ar' | 'en'): string {
  return l[locale];
}

/** Lowest price across tiers (ignores custom quotes). null when every tier is a quote. */
export function startingPrice(p: Product): number | null {
  const prices = p.tiers.map((t) => t.price).filter((n): n is number => n != null);
  return prices.length ? Math.min(...prices) : null;
}

/** Relative href for a non-WhatsApp primary CTA (locale is added by the i18n Link). */
export function ctaPath(cta: ProductCta): string | null {
  if (cta.kind === 'template') return `/t/${cta.slug}`;
  if (cta.kind === 'category') return `/templates/${cta.slug}`;
  return null;
}

/** Prefilled WhatsApp message naming the product (and optionally a tier). */
export function whatsappMessage(p: Product, locale: 'ar' | 'en', tier?: ProductTier): string {
  const name = p.name[locale];
  if (locale === 'ar') {
    return tier
      ? `أهلاً Congrats 👋 عايز أطلب «${name}» — ${tier.name.ar}`
      : `أهلاً Congrats 👋 عايز أطلب «${name}»`;
  }
  return tier ? `Hi Congrats 👋 I’d like to order “${name}” — ${tier.name.en}` : `Hi Congrats 👋 I’d like to order “${name}”`;
}

/** wa.me link with the message, or null when the support number is unset. */
export function whatsappHref(base: string | null, message: string): string | null {
  return base ? `${base}?text=${encodeURIComponent(message)}` : null;
}
