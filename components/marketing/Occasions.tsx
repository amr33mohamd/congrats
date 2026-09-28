import Image from 'next/image';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';

/**
 * Occasion grid. Each tile carries the same photograph the matching template
 * uses for its cover, so what someone clicks here is what they get in the
 * picker. `photo` is the Unsplash CDN id; the crop is requested per-tile.
 *
 * Every entry is verified to resolve — two of the originals had rotted to 404
 * and one was a duplicate of another occasion.
 */
const items = [
  { key: 'anniversary', photo: '1518621736915-f3b1c41bfd00', tint: '#7A1E3A' },
  { key: 'valentine', photo: '1518709779341-56cf4535e94b', tint: '#D11A4B' },
  { key: 'proposal', photo: '1512163143273-bde0e3cc7407', tint: '#0E1A33' },
  { key: 'eid', photo: '1577214407836-1f3a0604ecb2', tint: '#06281F' },
  { key: 'birthday', photo: '1530103862676-de8c9debad1d', tint: '#2E1065' },
  { key: 'graduation', photo: '1541339907198-e08756dedf3f', tint: '#0B1B2B' },
  { key: 'newborn', photo: '1511948374796-056e8f289f34', tint: '#3A4A49' },
  { key: 'wedding', photo: '1511285560929-80b456fea0bc', tint: '#3B4A36' },
] as const;

const src = (id: string) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=640&h=480&q=70`;

export async function Occasions() {
  const t = await getTranslations('marketing.occasions');

  return (
    <section id="occasions" className="scroll-mt-20 bg-surface-2 py-20">
      <div className="mx-auto max-w-6xl px-token-4">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-heading text-[clamp(1.9rem,4vw,2.75rem)] font-bold tracking-tight text-ink">
            {t('title')}
          </h2>
          <p className="mt-token-3 text-lg text-muted">{t('subtitle')}</p>
        </div>

        <div className="mt-token-8 grid grid-cols-2 gap-token-4 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((item, i) => (
            <Link
              key={item.key}
              href="/dashboard"
              className="group relative flex aspect-[4/5] items-end overflow-hidden rounded-2xl shadow-[var(--shadow-card)] transition-all duration-[var(--motion-slow)] ease-emphasized hover:-translate-y-1.5 hover:shadow-[var(--shadow-pop)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              style={{ backgroundColor: item.tint }}
            >
              <Image
                src={src(item.photo)}
                alt=""
                fill
                // Two columns on phones, four on desktop.
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                className="object-cover transition-transform duration-[900ms] ease-emphasized group-hover:scale-[1.08]"
                // Only the first row is above the fold on most screens.
                priority={i < 4}
              />
              {/* scrim keeps the label readable whatever the photo is doing */}
              <div
                aria-hidden
                className="absolute inset-0 transition-opacity duration-[var(--motion-slow)] group-hover:opacity-90"
                style={{
                  background: `linear-gradient(to top, ${item.tint}F2 0%, ${item.tint}80 38%, transparent 72%)`,
                }}
              />
              <span className="relative w-full p-token-4 font-heading text-lg font-semibold text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)]">
                {t(`items.${item.key}`)}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
