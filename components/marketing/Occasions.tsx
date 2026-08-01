import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';

const items = [
  { key: 'anniversary', emoji: '💍', from: '#F0436E', to: '#AE1F44' },
  { key: 'valentine', emoji: '❤️', from: '#F0436E', to: '#FF8FA8' },
  { key: 'proposal', emoji: '💐', from: '#AE1F44', to: '#D6A435' },
  { key: 'eid', emoji: '🌙', from: '#22A06D', to: '#0E5C44' },
  { key: 'birthday', emoji: '🎂', from: '#D6A435', to: '#F0436E' },
  { key: 'graduation', emoji: '🎓', from: '#4A423E', to: '#141010' },
  { key: 'newborn', emoji: '🍼', from: '#FF8FA8', to: '#D6A435' },
  { key: 'wedding', emoji: '💒', from: '#AE1F44', to: '#F0436E' },
] as const;

export async function Occasions() {
  const t = await getTranslations('marketing.occasions');

  return (
    <section id="occasions" className="scroll-mt-20 bg-surface-2 py-16">
      <div className="mx-auto max-w-6xl px-token-4">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-heading text-3xl font-bold text-ink md:text-4xl">{t('title')}</h2>
          <p className="mt-token-3 text-muted">{t('subtitle')}</p>
        </div>

        <div className="mt-token-8 grid grid-cols-2 gap-token-3 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((item) => (
            <Link
              key={item.key}
              href="/dashboard"
              className="group relative flex aspect-[4/3] flex-col items-center justify-center gap-token-2 overflow-hidden rounded-xl border border-border p-token-4 text-center text-white shadow-[var(--shadow-card)] transition-transform duration-[var(--motion-base)] hover:-translate-y-1"
              style={{ background: `linear-gradient(150deg, ${item.from}, ${item.to})` }}
            >
              <span aria-hidden className="text-4xl transition-transform duration-[var(--motion-base)] group-hover:scale-110">
                {item.emoji}
              </span>
              <span className="font-heading text-lg font-semibold drop-shadow">
                {t(`items.${item.key}`)}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
