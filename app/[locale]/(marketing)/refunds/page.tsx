import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { LegalLayout } from '@/components/marketing/LegalLayout';
import { OwnerName, SupportContact } from '@/components/marketing/LegalBits';
import { marketingMetadata, site } from '@/lib/site';

const UPDATED = '28 September 2026';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isAr = locale === 'ar';
  return marketingMetadata({
    locale: isAr ? 'ar' : 'en',
    path: '/refunds',
    title: isAr ? 'سياسة الاسترداد والدفع' : 'Refund & Payment Policy',
    description: isAr
      ? 'كيفية الدفع عبر InstaPay ومراجعة الطلبات يدوياً ومتى تُمنح المبالغ المستردّة وكيفية طلبها.'
      : 'How InstaPay payments, manual order review, and refunds work at Congrats — and how to request one.',
  });
}

function EnglishBody() {
  return (
    <>
      <p>
        This Refund &amp; Payment Policy explains how payments work at Congrats, how we review orders, and when
        refunds are and are not available. It applies to all paid templates sold by <OwnerName />.
      </p>

      <h2>How payment works (InstaPay)</h2>
      <p>
        Congrats accepts manual payments via <strong>InstaPay</strong> in Egyptian Pounds (EGP). Because this is a
        manual method, the flow is:
      </p>
      <ol>
        <li>You build your greeting and choose a paid template.</li>
        <li>You transfer the exact amount to our InstaPay details shown at checkout.</li>
        <li>You submit a screenshot or reference of the completed transfer as proof of payment.</li>
        <li>
          Our team <strong>manually reviews and approves</strong> your payment, usually within{' '}
          <strong>{site.reviewWindow.en}</strong>.
        </li>
        <li>Once approved, your paid greeting is unlocked and delivered.</li>
      </ol>
      <p>
        Please make sure the amount and reference match exactly — mismatched or unclear payments may delay
        approval while we contact you.
      </p>

      <h2>Digital goods</h2>
      <p>
        Congrats sells <strong>digital products</strong> — animated greetings delivered electronically. Because
        the product is delivered instantly upon approval and cannot be &ldquo;returned,&rdquo; all sales are
        generally final once your order is approved and the greeting is unlocked.
      </p>

      <h2>When you are entitled to a refund</h2>
      <p>We will refund your payment in these situations:</p>
      <ul>
        <li>
          <strong>Duplicate payment:</strong> you were charged twice for the same order.
        </li>
        <li>
          <strong>Order not approved:</strong> your payment was received but we could not approve or deliver the
          order (for example, a technical fault on our side).
        </li>
        <li>
          <strong>Overpayment:</strong> you transferred more than the listed price; we refund the difference.
        </li>
        <li>
          <strong>Undelivered product:</strong> your order was approved but the greeting was never made available
          to you and we cannot resolve it.
        </li>
      </ul>

      <h2>When refunds are not available</h2>
      <ul>
        <li>You changed your mind after the greeting was unlocked and delivered.</li>
        <li>You made a mistake in the content you entered (names, dates, photos) after delivery.</li>
        <li>The greeting works as designed but does not match a personal expectation not described on the page.</li>
      </ul>
      <p>
        If something went wrong with your greeting, contact us first — in many cases we can fix or re-issue it
        rather than refund.
      </p>

      <h2>How to request a refund</h2>
      <p>
        Contact us via <SupportContact locale="en" /> within <strong>{site.refundWindow.en}</strong> of your
        purchase and include:
      </p>
      <ul>
        <li>The email address on your account.</li>
        <li>Your order or reference number.</li>
        <li>The InstaPay payment screenshot or reference.</li>
        <li>A short description of the problem.</li>
      </ul>
      <p>
        We aim to respond within <strong>{site.responseTime.en}</strong>. Approved refunds are
        returned via InstaPay to the account you paid from, typically within{' '}
        <strong>{site.refundProcessing.en}</strong>.
      </p>

      <h2>Questions</h2>
      <p>
        For anything about payments or refunds, contact us via <SupportContact locale="en" />.
      </p>
    </>
  );
}

function ArabicBody() {
  return (
    <>
      <p>
        توضّح سياسة الاسترداد والدفع هذه كيف تتم عمليات الدفع في Congrats، وكيف نراجع الطلبات، ومتى تُتاح المبالغ
        المستردّة ومتى لا تُتاح. وتنطبق على جميع القوالب المدفوعة التي تبيعها <OwnerName />.
      </p>

      <h2>كيف يتم الدفع (InstaPay)</h2>
      <p>
        تقبل Congrats الدفع اليدوي عبر <strong>InstaPay</strong> بالجنيه المصري (EGP). ولأن هذه طريقة يدوية، تسير
        الخطوات كالتالي:
      </p>
      <ol>
        <li>تصمّم بطاقة التهنئة وتختار قالباً مدفوعاً.</li>
        <li>تحوّل المبلغ المطلوب بالضبط إلى بيانات InstaPay الظاهرة عند إتمام الطلب.</li>
        <li>ترسل لقطة شاشة أو الرقم المرجعي للتحويل المكتمل كإثبات للدفع.</li>
        <li>
          يقوم فريقنا <strong>بمراجعة الدفعة والموافقة عليها يدوياً</strong>، عادةً خلال{' '}
          <strong>{site.reviewWindow.ar}</strong>.
        </li>
        <li>بمجرد الموافقة، يتم فتح بطاقة التهنئة المدفوعة وتسليمها لك.</li>
      </ol>
      <p>
        يُرجى التأكد من تطابق المبلغ والرقم المرجعي تماماً — فالدفعات غير المتطابقة أو غير الواضحة قد تؤخّر الموافقة
        ريثما نتواصل معك.
      </p>

      <h2>المنتجات الرقمية</h2>
      <p>
        تبيع Congrats <strong>منتجات رقمية</strong> — بطاقات تهنئة متحركة تُسلَّم إلكترونياً. ولأن المنتج يُسلَّم
        فور الموافقة ولا يمكن &laquo;إرجاعه&raquo;، فإن جميع المبيعات تُعتبر نهائية عموماً بمجرد الموافقة على طلبك
        وفتح بطاقة التهنئة.
      </p>

      <h2>متى يحق لك استرداد المبلغ</h2>
      <p>نعيد إليك المبلغ في الحالات التالية:</p>
      <ul>
        <li>
          <strong>دفع مكرّر:</strong> تم خصم المبلغ مرتين عن الطلب نفسه.
        </li>
        <li>
          <strong>عدم الموافقة على الطلب:</strong> استُلمت دفعتك ولكن تعذّرت الموافقة على الطلب أو تسليمه (مثل خلل
          تقني من جانبنا).
        </li>
        <li>
          <strong>الدفع الزائد:</strong> حوّلت أكثر من السعر المعلن؛ ونعيد إليك الفرق.
        </li>
        <li>
          <strong>عدم التسليم:</strong> تمت الموافقة على طلبك لكن بطاقة التهنئة لم تُتَح لك مطلقاً وتعذّر علينا حلّ
          المشكلة.
        </li>
      </ul>

      <h2>متى لا يُتاح الاسترداد</h2>
      <ul>
        <li>غيّرت رأيك بعد فتح بطاقة التهنئة وتسليمها.</li>
        <li>ارتكبت خطأً في المحتوى الذي أدخلته (الأسماء أو التواريخ أو الصور) بعد التسليم.</li>
        <li>تعمل بطاقة التهنئة كما هو مصمَّم لها لكنها لا تطابق توقعاً شخصياً غير موصوف في الصفحة.</li>
      </ul>
      <p>إذا حدث خطأ ما في بطاقتك، تواصل معنا أولاً — ففي كثير من الحالات يمكننا إصلاحها أو إعادة إصدارها بدلاً من الاسترداد.</p>

      <h2>كيفية طلب الاسترداد</h2>
      <p>
        تواصل معنا عبر <SupportContact locale="ar" /> خلال{' '}
        <strong>{site.refundWindow.ar}</strong> من تاريخ الشراء، مع تضمين ما يلي:
      </p>
      <ul>
        <li>البريد الإلكتروني المسجّل في حسابك.</li>
        <li>رقم الطلب أو الرقم المرجعي.</li>
        <li>لقطة شاشة أو مرجع دفعة InstaPay.</li>
        <li>وصف موجز للمشكلة.</li>
      </ul>
      <p>
        نسعى للرد خلال <strong>{site.responseTime.ar}</strong>. وتُعاد المبالغ المستردّة الموافق عليها عبر
        InstaPay إلى الحساب الذي دفعت منه، عادةً خلال{' '}
        <strong>{site.refundProcessing.ar}</strong>.
      </p>

      <h2>الاستفسارات</h2>
      <p>
        لأي أمر يخص الدفع أو الاسترداد، تواصل معنا عبر <SupportContact locale="ar" />.
      </p>
    </>
  );
}

export default async function RefundsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const isAr = locale === 'ar';

  return (
    <LegalLayout title={isAr ? 'سياسة الاسترداد والدفع' : 'Refund & Payment Policy'} updated={UPDATED}>
      {isAr ? <ArabicBody /> : <EnglishBody />}
    </LegalLayout>
  );
}
