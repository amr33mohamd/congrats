import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { LegalLayout } from '@/components/marketing/LegalLayout';
import { Operator, SupportContact, PostalClause } from '@/components/marketing/LegalBits';
import { marketingMetadata, site } from '@/lib/site';

const UPDATED = '2026-09-28';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isAr = locale === 'ar';
  return marketingMetadata({
    locale: isAr ? 'ar' : 'en',
    path: '/privacy',
    title: isAr ? 'سياسة الخصوصية' : 'Privacy Policy',
    description: isAr
      ? 'كيف تجمع Congrats بياناتك وتستخدمها وتحميها — البريد الإلكتروني والصور المرفوعة ولقطات الدفع.'
      : 'How Congrats collects, uses, and protects your data — emails, uploaded photos, and payment screenshots.',
  });
}

function EnglishBody() {
  return (
    <>
      <p>
        This Privacy Policy explains how <Operator locale="en" /> collects, uses, and protects your information when you use our
        website and services to create and share animated greeting cards.
      </p>

      <h2>Information we collect</h2>
      <ul>
        <li>
          <strong>Account details:</strong> your email address and basic profile information when you sign in.
        </li>
        <li>
          <strong>Content you upload:</strong> photos, names, messages, and other media you add to a greeting.
        </li>
        <li>
          <strong>Payment information:</strong> the InstaPay payment screenshot and reference you submit so we
          can manually verify your order. We do <strong>not</strong> collect or store card numbers or bank
          credentials.
        </li>
        <li>
          <strong>Usage data:</strong> basic technical information such as device type, browser, and pages
          visited, used to keep the service secure and reliable.
        </li>
      </ul>

      <h2>How we use your information</h2>
      <ul>
        <li>To create, render, and deliver the greeting you build.</li>
        <li>To verify and approve your payment and fulfil your order.</li>
        <li>To respond to support requests and send transactional emails (for example, order confirmations).</li>
        <li>To protect against fraud, abuse, and technical problems.</li>
      </ul>

      <h2>Cookies and sessions</h2>
      <p>
        We use essential cookies and session storage to keep you signed in and to remember your language
        preference. These are required for the site to work; we do not use them for advertising.
      </p>

      <h2>Data retention</h2>
      <p>
        We keep your account data and created greetings for as long as your account is active or as needed to
        provide the service. Payment screenshots are retained only as long as necessary to verify your order and
        meet our record-keeping obligations, after which they are deleted or anonymised.
      </p>

      <h2>Third-party services</h2>
      <p>We rely on a small number of trusted providers to operate Congrats:</p>
      <ul>
        <li>
          <strong>Resend</strong> — to send transactional and support emails.
        </li>
        <li>
          <strong>Unsplash</strong> — to supply optional stock imagery used within templates.
        </li>
        <li>
          <strong>Our hosting and storage providers</strong> — to run the site and store the media you upload.
        </li>
      </ul>
      <p>
        These providers process data only on our behalf and are not permitted to use it for their own purposes.
      </p>

      <h2>Your rights</h2>
      <p>
        You may request access to, correction of, or deletion of your personal data at any time. To do so,
        contact us via <SupportContact locale="en" />. We aim to respond within {site.responseTime.en}.
      </p>

      <h2>Children</h2>
      <p>
        Congrats is not directed to children under 13, and we do not knowingly collect their personal data. If
        you believe a child has provided us information, please contact us so we can remove it.
      </p>

      <h2>Changes to this policy</h2>
      <p>
        We may update this policy from time to time. When we do, we will revise the &ldquo;Last updated&rdquo;
        date above, and material changes will be highlighted where appropriate.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about your privacy? Contact us via <SupportContact locale="en" />
        <PostalClause locale="en" />.
      </p>
    </>
  );
}

function ArabicBody() {
  return (
    <>
      <p>
        توضّح سياسة الخصوصية هذه كيف تقوم <Operator locale="ar" /> بجمع معلوماتك واستخدامها وحمايتها عند استخدامك لموقعنا وخدماتنا لإنشاء بطاقات تهنئة متحركة ومشاركتها.
      </p>

      <h2>المعلومات التي نجمعها</h2>
      <ul>
        <li>
          <strong>بيانات الحساب:</strong> بريدك الإلكتروني والمعلومات الأساسية للملف الشخصي عند تسجيل الدخول.
        </li>
        <li>
          <strong>المحتوى الذي ترفعه:</strong> الصور والأسماء والرسائل وأي وسائط أخرى تضيفها إلى بطاقة التهنئة.
        </li>
        <li>
          <strong>معلومات الدفع:</strong> لقطة الشاشة والرقم المرجعي لعملية InstaPay التي ترسلها لنا حتى نتمكن من
          التحقق اليدوي من طلبك. <strong>لا</strong> نجمع أو نخزّن أرقام البطاقات أو بيانات الدخول البنكية.
        </li>
        <li>
          <strong>بيانات الاستخدام:</strong> معلومات تقنية أساسية مثل نوع الجهاز والمتصفح والصفحات التي تزورها،
          نستخدمها للحفاظ على أمان الخدمة وموثوقيتها.
        </li>
      </ul>

      <h2>كيف نستخدم معلوماتك</h2>
      <ul>
        <li>لإنشاء بطاقة التهنئة التي تصممها وعرضها وتسليمها لك.</li>
        <li>للتحقق من عملية الدفع والموافقة عليها وتنفيذ طلبك.</li>
        <li>للرد على طلبات الدعم وإرسال رسائل البريد المتعلقة بالمعاملات (مثل تأكيدات الطلب).</li>
        <li>للحماية من الاحتيال وإساءة الاستخدام والمشكلات التقنية.</li>
      </ul>

      <h2>ملفات تعريف الارتباط والجلسات</h2>
      <p>
        نستخدم ملفات تعريف ارتباط أساسية وتخزين الجلسات لإبقائك مسجّلاً للدخول ولتذكّر لغتك المفضّلة. هذه العناصر
        ضرورية لعمل الموقع، ولا نستخدمها لأغراض الإعلانات.
      </p>

      <h2>الاحتفاظ بالبيانات</h2>
      <p>
        نحتفظ ببيانات حسابك والبطاقات التي أنشأتها طالما ظل حسابك نشطاً أو بالقدر اللازم لتقديم الخدمة. أما لقطات
        الدفع فنحتفظ بها فقط للمدة اللازمة للتحقق من طلبك والوفاء بالتزامات حفظ السجلات، ثم يتم حذفها أو إخفاء
        هويتها.
      </p>

      <h2>خدمات الأطراف الثالثة</h2>
      <p>نعتمد على عدد محدود من مزوّدي الخدمة الموثوقين لتشغيل Congrats:</p>
      <ul>
        <li>
          <strong>Resend</strong> — لإرسال رسائل البريد الخاصة بالمعاملات والدعم.
        </li>
        <li>
          <strong>Unsplash</strong> — لتوفير صور اختيارية تُستخدم داخل القوالب.
        </li>
        <li>
          <strong>مزوّدو الاستضافة والتخزين لدينا</strong> — لتشغيل الموقع وتخزين الوسائط التي ترفعها.
        </li>
      </ul>
      <p>يعالج هؤلاء المزوّدون البيانات نيابةً عنّا فقط، ولا يُسمح لهم باستخدامها لأغراضهم الخاصة.</p>

      <h2>حقوقك</h2>
      <p>
        يمكنك في أي وقت طلب الاطّلاع على بياناتك الشخصية أو تصحيحها أو حذفها. للقيام بذلك، تواصل معنا عبر <SupportContact locale="ar" />. ونسعى للرد خلال {site.responseTime.ar}.
      </p>

      <h2>الأطفال</h2>
      <p>
        Congrats ليست موجّهة للأطفال دون سن 13 عاماً، ولا نجمع بياناتهم الشخصية عن علم. إذا كنت تعتقد أن طفلاً قد
        زوّدنا بمعلومات، يُرجى التواصل معنا لإزالتها.
      </p>

      <h2>التغييرات على هذه السياسة</h2>
      <p>
        قد نحدّث هذه السياسة من وقت لآخر. وعند ذلك، سنقوم بتحديث تاريخ &laquo;آخر تحديث&raquo; أعلاه، وسنبرز
        التغييرات الجوهرية عند الاقتضاء.
      </p>

      <h2>التواصل</h2>
      <p>
        لديك استفسار بخصوص خصوصيتك؟ تواصل معنا عبر <SupportContact locale="ar" />
        <PostalClause locale="ar" />.
      </p>
    </>
  );
}

export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const isAr = locale === 'ar';

  return (
    <LegalLayout title={isAr ? 'سياسة الخصوصية' : 'Privacy Policy'} updated={UPDATED}>
      {isAr ? <ArabicBody /> : <EnglishBody />}
    </LegalLayout>
  );
}
