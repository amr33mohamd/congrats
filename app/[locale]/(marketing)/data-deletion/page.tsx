import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { LegalLayout } from '@/components/marketing/LegalLayout';
import { SupportContact } from '@/components/marketing/LegalBits';
import { marketingMetadata } from '@/lib/site';

const UPDATED = '2026-10-25';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isAr = locale === 'ar';
  return marketingMetadata({
    locale: isAr ? 'ar' : 'en',
    path: '/data-deletion',
    title: isAr ? 'حذف بياناتك' : 'Delete your data',
    description: isAr
      ? 'كيف تطلب حذف محادثاتك مع Congrats على ماسنجر وأي بيانات حفظناها منها.'
      : 'How to ask Congrats to delete your Messenger conversations and any data we kept from them.',
  });
}

function EnglishBody() {
  return (
    <>
      <p>
        When you message the Congrats Facebook Page, we keep the conversation and the details you give us (such as
        the couple&apos;s names, the wedding date and venue) to prepare your invitation and answer you.
      </p>
      <h2>How to delete it</h2>
      <ol>
        <li>
          Send the message <strong>delete my data</strong> to the Congrats Page on Messenger, or contact us via{' '}
          <SupportContact locale="en" />.
        </li>
        <li>We delete your conversation and the details kept from it within 7 days and confirm when it is done.</li>
      </ol>
      <p>
        Invitations you already paid for stay online until you ask us to remove them too. Messages also remain in
        your own Messenger app, which Meta controls.
      </p>
    </>
  );
}

function ArabicBody() {
  return (
    <>
      <p>
        لما تراسل صفحة Congrats على فيسبوك، بنحتفظ بالمحادثة والتفاصيل اللي بتبعتها (زي أسماء العروسين وميعاد الفرح
        والقاعة) عشان نجهز دعوتك ونرد عليك.
      </p>
      <h2>إزاي تحذفها</h2>
      <ol>
        <li>
          ابعت رسالة <strong>امسح بياناتي</strong> لصفحة Congrats على ماسنجر، أو تواصل معانا عبر{' '}
          <SupportContact locale="ar" />.
        </li>
        <li>بنحذف المحادثة والتفاصيل المحفوظة منها خلال ٧ أيام ونأكدلك لما نخلص.</li>
      </ol>
      <p>
        الدعوات اللي دفعت تمنها بتفضل شغالة لحد ما تطلب نشيلها هي كمان. والرسائل بتفضل موجودة في تطبيق ماسنجر بتاعك،
        وده تحت إدارة ميتا.
      </p>
    </>
  );
}

export default async function DataDeletionPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const isAr = locale === 'ar';

  return (
    <LegalLayout title={isAr ? 'حذف بياناتك' : 'Delete your data'} updated={UPDATED}>
      {isAr ? <ArabicBody /> : <EnglishBody />}
    </LegalLayout>
  );
}
