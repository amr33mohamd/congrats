import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { LegalLayout } from '@/components/marketing/LegalLayout';

const UPDATED = '18 July 2026';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isAr = locale === 'ar';
  return {
    title: isAr ? 'التواصل والدعم | Congrats' : 'Contact & Support | Congrats',
    description: isAr
      ? 'كيفية التواصل مع فريق دعم Congrats، وأوقات الرد المتوقّعة، وما ينبغي تضمينه في رسالتك.'
      : 'How to reach the Congrats support team, expected response times, and what to include in your message.',
  };
}

function EnglishBody() {
  return (
    <>
      <p>
        Need help with an order, a payment, or your greeting? We&rsquo;re happy to help. The fastest way to reach
        us is by email.
      </p>

      <h2>Contact us</h2>
      <p>
        Email: <a href="mailto:[support email]">[support email]</a>
      </p>
      <p>Operated by <strong>[Company/Owner Name]</strong>, [business address].</p>

      <h2>Response time</h2>
      <p>
        We typically reply within <strong>[response time, e.g. 1&ndash;2 business days]</strong>. Payment reviews
        and order approvals are usually handled within <strong>[review window, e.g. 24 hours]</strong>. Requests
        sent on weekends or holidays may take a little longer.
      </p>

      <h2>What to include</h2>
      <p>To help us resolve your request quickly, please include:</p>
      <ul>
        <li>The email address on your account.</li>
        <li>Your order or reference number, if you have one.</li>
        <li>For payment issues, your InstaPay screenshot or reference.</li>
        <li>A clear description of the problem or question, and a screenshot if relevant.</li>
      </ul>

      <h2>Refunds and payments</h2>
      <p>
        For questions about a payment or to request a refund, please review our{' '}
        <Link href="/refunds">Refund &amp; Payment Policy</Link> first, then email us with the details above.
      </p>
    </>
  );
}

function ArabicBody() {
  return (
    <>
      <p>
        هل تحتاج مساعدة بخصوص طلب أو دفعة أو بطاقة تهنئة؟ يسعدنا مساعدتك. وأسرع وسيلة للتواصل معنا هي البريد
        الإلكتروني.
      </p>

      <h2>تواصل معنا</h2>
      <p>
        البريد الإلكتروني: <a href="mailto:[support email]">[support email]</a>
      </p>
      <p>تُدار الخدمة بواسطة <strong>[Company/Owner Name]</strong>، [business address].</p>

      <h2>وقت الرد</h2>
      <p>
        نرد عادةً خلال <strong>[مدة الرد، مثلاً يوم إلى يومَي عمل]</strong>. وتُعالَج مراجعات الدفع والموافقات على
        الطلبات عادةً خلال <strong>[مدة المراجعة، مثلاً 24 ساعة]</strong>. وقد تستغرق الطلبات المرسلة في العطلات
        الأسبوعية أو الرسمية وقتاً أطول قليلاً.
      </p>

      <h2>ما ينبغي تضمينه</h2>
      <p>لمساعدتنا على حل طلبك بسرعة، يُرجى تضمين ما يلي:</p>
      <ul>
        <li>البريد الإلكتروني المسجّل في حسابك.</li>
        <li>رقم الطلب أو الرقم المرجعي، إن وُجد.</li>
        <li>لمشكلات الدفع، لقطة شاشة أو مرجع دفعة InstaPay.</li>
        <li>وصف واضح للمشكلة أو السؤال، مع لقطة شاشة إن كانت ذات صلة.</li>
      </ul>

      <h2>الاسترداد والدفع</h2>
      <p>
        للاستفسار عن دفعة أو لطلب استرداد، يُرجى الاطّلاع أولاً على{' '}
        <Link href="/refunds">سياسة الاسترداد والدفع</Link>، ثم راسلنا مع التفاصيل المذكورة أعلاه.
      </p>
    </>
  );
}

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const isAr = locale === 'ar';

  return (
    <LegalLayout title={isAr ? 'التواصل والدعم' : 'Contact & Support'} updated={UPDATED}>
      {isAr ? <ArabicBody /> : <EnglishBody />}
    </LegalLayout>
  );
}
