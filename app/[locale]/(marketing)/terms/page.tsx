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
    title: isAr ? 'شروط الخدمة | Congrats' : 'Terms of Service | Congrats',
    description: isAr
      ? 'الشروط التي تحكم استخدامك لـ Congrats: الاستخدام المقبول والملكية الفكرية وشروط الدفع والمسؤولية.'
      : 'The terms that govern your use of Congrats: acceptable use, ownership, payment terms, and liability.',
  };
}

function EnglishBody() {
  return (
    <>
      <p>
        These Terms of Service (&ldquo;Terms&rdquo;) govern your use of Congrats, operated by{' '}
        <strong>[Company/Owner Name]</strong>. By creating an account, purchasing a template, or using the
        service, you agree to these Terms.
      </p>

      <h2>The service</h2>
      <p>
        Congrats lets you build, purchase, and share premium animated greeting cards. Some templates are free
        and others are paid. Features and pricing may change over time.
      </p>

      <h2>Acceptable use</h2>
      <p>You agree not to use Congrats to:</p>
      <ul>
        <li>Upload content that is unlawful, hateful, harassing, or infringes anyone&rsquo;s rights.</li>
        <li>Upload photos or media you do not have permission to use.</li>
        <li>Attempt to disrupt, reverse-engineer, or gain unauthorised access to the service.</li>
        <li>Resell or redistribute our templates or platform as your own.</li>
      </ul>
      <p>We may suspend or terminate accounts that violate these rules.</p>

      <h2>Your content and ownership</h2>
      <p>
        You keep ownership of the photos, text, and media you upload (&ldquo;Your Content&rdquo;). You grant us a
        limited licence to store, process, and display Your Content solely to provide the service — for example,
        to render and deliver your greeting. You are responsible for having the rights to everything you upload.
      </p>

      <h2>Template licence</h2>
      <p>
        When you purchase a paid template, you receive a personal, non-exclusive, non-transferable licence to use
        the resulting greeting for personal, non-commercial purposes. The templates, designs, animations, and
        underlying software remain the intellectual property of <strong>[Company/Owner Name]</strong> and its
        licensors. You may not resell, sublicense, or redistribute the templates themselves.
      </p>

      <h2>Payment terms</h2>
      <p>
        Prices are shown in Egyptian Pounds (EGP). Paid orders are completed via InstaPay: you send the payment
        manually and submit proof, and we review and approve each order before it is fulfilled. Your access to a
        paid greeting is granted only after approval. Refunds are handled under our{' '}
        <Link href="/refunds">Refund &amp; Payment Policy</Link>.
      </p>

      <h2>Disclaimers</h2>
      <p>
        The service is provided &ldquo;as is&rdquo; and &ldquo;as available.&rdquo; While we work hard to keep
        Congrats reliable, we do not warrant that it will be uninterrupted, error-free, or fit for a particular
        purpose.
      </p>

      <h2>Limitation of liability</h2>
      <p>
        To the maximum extent permitted by law, <strong>[Company/Owner Name]</strong> shall not be liable for any
        indirect, incidental, or consequential damages arising from your use of the service. Our total liability
        for any claim is limited to the amount you paid for the order giving rise to the claim.
      </p>

      <h2>Governing law</h2>
      <p>
        These Terms are governed by the laws of <strong>[governing jurisdiction: Egypt]</strong>, and any
        disputes shall be subject to the courts of that jurisdiction.
      </p>

      <h2>Changes to these Terms</h2>
      <p>
        We may update these Terms from time to time. Continued use of Congrats after changes take effect means you
        accept the updated Terms. Questions? Email <a href="mailto:[support email]">[support email]</a>.
      </p>
    </>
  );
}

function ArabicBody() {
  return (
    <>
      <p>
        تحكم شروط الخدمة هذه (&laquo;الشروط&raquo;) استخدامك لـ Congrats، التي تُدار بواسطة{' '}
        <strong>[Company/Owner Name]</strong>. بإنشائك حساباً أو شرائك قالباً أو استخدامك للخدمة، فإنك توافق على
        هذه الشروط.
      </p>

      <h2>الخدمة</h2>
      <p>
        تتيح لك Congrats إنشاء بطاقات تهنئة متحركة مميزة وشراءها ومشاركتها. بعض القوالب مجانية وبعضها مدفوع. وقد
        تتغيّر الميزات والأسعار بمرور الوقت.
      </p>

      <h2>الاستخدام المقبول</h2>
      <p>توافق على عدم استخدام Congrats من أجل:</p>
      <ul>
        <li>رفع محتوى غير قانوني أو يحضّ على الكراهية أو يتضمّن مضايقة أو ينتهك حقوق أي طرف.</li>
        <li>رفع صور أو وسائط لا تملك إذناً باستخدامها.</li>
        <li>محاولة تعطيل الخدمة أو إجراء هندسة عكسية عليها أو الوصول غير المصرّح به إليها.</li>
        <li>إعادة بيع قوالبنا أو منصّتنا أو توزيعها على أنها ملكك.</li>
      </ul>
      <p>يجوز لنا تعليق أو إنهاء الحسابات التي تخالف هذه القواعد.</p>

      <h2>المحتوى الخاص بك وملكيته</h2>
      <p>
        تحتفظ بملكية الصور والنصوص والوسائط التي ترفعها (&laquo;المحتوى الخاص بك&raquo;). وتمنحنا ترخيصاً محدوداً
        لتخزين المحتوى الخاص بك ومعالجته وعرضه فقط بغرض تقديم الخدمة — مثل عرض بطاقة التهنئة وتسليمها. وأنت مسؤول عن
        امتلاكك حقوق كل ما ترفعه.
      </p>

      <h2>ترخيص القالب</h2>
      <p>
        عند شرائك قالباً مدفوعاً، تحصل على ترخيص شخصي غير حصري وغير قابل للتحويل لاستخدام بطاقة التهنئة الناتجة
        لأغراض شخصية غير تجارية. وتظل القوالب والتصاميم والرسوم المتحركة والبرمجيات الأساسية ملكية فكرية لـ{' '}
        <strong>[Company/Owner Name]</strong> ومرخّصيها. ولا يجوز لك إعادة بيع القوالب نفسها أو الترخيص من الباطن
        لها أو إعادة توزيعها.
      </p>

      <h2>شروط الدفع</h2>
      <p>
        تُعرض الأسعار بالجنيه المصري (EGP). وتُنفَّذ الطلبات المدفوعة عبر InstaPay: ترسل الدفعة يدوياً وترفق ما يثبت
        ذلك، ثم نراجع كل طلب ونوافق عليه قبل تنفيذه. ولا يُمنح لك الوصول إلى بطاقة التهنئة المدفوعة إلا بعد الموافقة.
        وتُعالَج المبالغ المستردّة وفقاً لـ <Link href="/refunds">سياسة الاسترداد والدفع</Link> الخاصة بنا.
      </p>

      <h2>إخلاء المسؤولية</h2>
      <p>
        تُقدَّم الخدمة &laquo;كما هي&raquo; و&laquo;حسب توافرها&raquo;. ومع أننا نجتهد للحفاظ على موثوقية Congrats،
        فإننا لا نضمن أن تكون الخدمة دون انقطاع أو خالية من الأخطاء أو ملائمة لغرض معيّن.
      </p>

      <h2>حدود المسؤولية</h2>
      <p>
        إلى أقصى حد يسمح به القانون، لن تكون <strong>[Company/Owner Name]</strong> مسؤولة عن أي أضرار غير مباشرة أو
        عرضية أو تبعية تنشأ عن استخدامك للخدمة. وتقتصر مسؤوليتنا الإجمالية عن أي مطالبة على المبلغ الذي دفعته مقابل
        الطلب موضوع المطالبة.
      </p>

      <h2>القانون الحاكم</h2>
      <p>
        تخضع هذه الشروط لقوانين <strong>[governing jurisdiction: Egypt]</strong>، وتخضع أي نزاعات لاختصاص محاكم تلك
        الجهة.
      </p>

      <h2>التغييرات على هذه الشروط</h2>
      <p>
        قد نحدّث هذه الشروط من وقت لآخر. واستمرارك في استخدام Congrats بعد سريان التغييرات يعني قبولك للشروط المحدّثة.
        لأي استفسار، راسلنا على <a href="mailto:[support email]">[support email]</a>.
      </p>
    </>
  );
}

export default async function TermsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const isAr = locale === 'ar';

  return (
    <LegalLayout title={isAr ? 'شروط الخدمة' : 'Terms of Service'} updated={UPDATED}>
      {isAr ? <ArabicBody /> : <EnglishBody />}
    </LegalLayout>
  );
}
