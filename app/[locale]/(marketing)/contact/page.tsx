import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { LegalLayout } from '@/components/marketing/LegalLayout';
import { marketingMetadata, site, supportWhatsappHref } from '@/lib/site';

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
    path: '/contact',
    title: isAr ? 'التواصل والدعم' : 'Contact & Support',
    description: isAr
      ? 'كيفية التواصل مع فريق دعم Congrats، وأوقات الرد المتوقّعة، وما ينبغي تضمينه في رسالتك.'
      : 'How to reach the Congrats support team, expected response times, and what to include in your message.',
  });
}

/**
 * The contact channels that are actually configured, one line each. Nothing is
 * printed for an unset channel — a contact page listing a fake address is
 * worse than a short one.
 */
function Channels({ locale }: { locale: 'ar' | 'en' }) {
  const isAr = locale === 'ar';
  const wa = supportWhatsappHref();
  const lines: React.ReactNode[] = [];

  if (site.supportEmail) {
    lines.push(
      <p key="email">
        {isAr ? 'البريد الإلكتروني: ' : 'Email: '}
        <a href={`mailto:${site.supportEmail}`}>{site.supportEmail}</a>
      </p>,
    );
  }
  if (wa) {
    lines.push(
      <p key="wa">
        {isAr ? 'واتساب: ' : 'WhatsApp: '}
        <a href={wa} target="_blank" rel="noopener noreferrer" dir="ltr">
          {site.supportWhatsapp}
        </a>
      </p>,
    );
  }
  if (site.companyName || site.businessAddress) {
    const who = [site.companyName, site.businessAddress].filter(Boolean).join(isAr ? '، ' : ', ');
    lines.push(
      <p key="op">
        {isAr ? 'تُدار الخدمة بواسطة: ' : 'Operated by: '}
        <strong>{who}</strong>
      </p>,
    );
  }

  if (lines.length === 0) {
    return (
      <p>
        {isAr
          ? 'سننشر بيانات التواصل المباشر هنا قريبًا.'
          : 'Direct contact details will be published here shortly.'}
      </p>
    );
  }
  return <>{lines}</>;
}

function EnglishBody() {
  return (
    <>
      <p>
        Need help with an order, a payment, or your greeting or invitation? We&rsquo;re happy to help.
      </p>

      <h2>Contact us</h2>
      <Channels locale="en" />

      <h2>Response time</h2>
      <p>
        We typically reply within <strong>{site.responseTime.en}</strong>. Payment reviews and order approvals
        are usually handled within <strong>{site.reviewWindow.en}</strong>. Requests sent on weekends or holidays
        may take a little longer.
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
        <Link href="/refunds">Refund &amp; Payment Policy</Link> first, then contact us with the details above.
      </p>
    </>
  );
}

function ArabicBody() {
  return (
    <>
      <p>هل تحتاج مساعدة بخصوص طلب أو دفعة أو بطاقة تهنئة أو دعوة؟ يسعدنا مساعدتك.</p>

      <h2>تواصل معنا</h2>
      <Channels locale="ar" />

      <h2>وقت الرد</h2>
      <p>
        نرد عادةً خلال <strong>{site.responseTime.ar}</strong>. وتُعالَج مراجعات الدفع والموافقات على الطلبات عادةً
        خلال <strong>{site.reviewWindow.ar}</strong>. وقد تستغرق الطلبات المرسلة في العطلات الأسبوعية أو الرسمية
        وقتاً أطول قليلاً.
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
        <Link href="/refunds">سياسة الاسترداد والدفع</Link>، ثم تواصل معنا مع التفاصيل المذكورة أعلاه.
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
