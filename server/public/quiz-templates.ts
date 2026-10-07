import { getTranslations } from 'next-intl/server';
import { listGalleryTemplates, type GalleryTemplate } from '@/server/public/templates-gallery';
import { formatPrice } from '@/components/marketing/gallery-cards';
import type { QuizTemplate } from '@/components/quiz/Quiz';

/**
 * The published catalog in the shape the quiz matcher needs. Shared by /start
 * and the quiz embedded on the home page. Pass `rows` when the caller already
 * loaded the gallery so the page doesn't query it twice.
 */
export async function loadQuizTemplates(locale: 'ar' | 'en', rows?: GalleryTemplate[]): Promise<QuizTemplate[]> {
  const t = await getTranslations({ locale, namespace: 'quiz.result' });
  const list = rows ?? (await listGalleryTemplates());
  return list.map((r) => ({
    id: r.id,
    slug: r.slug,
    locale: r.locale,
    categorySlug: r.categorySlug,
    title: (locale === 'ar' ? r.titleAr : r.titleEn) ?? r.titleEn ?? r.titleAr ?? r.slug,
    priceLabel: r.isPaid ? formatPrice(r.pricePiastres, locale) : t('free'),
    definition: r.definition,
  }));
}
