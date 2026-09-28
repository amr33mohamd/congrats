import { Link } from '@/i18n/navigation';

/**
 * Crawlable links to each occasion's landing page.
 *
 * The gallery's own filter chips are buttons (client-side filtering), which
 * search engines don't follow — this row is what connects the gallery to the
 * /templates/<occasion> pages and those pages to each other.
 */
export function OccasionLinks({
  heading,
  items,
  current,
}: {
  heading: string;
  items: { slug: string; label: string }[];
  current?: string;
}) {
  if (items.length === 0) return null;
  return (
    <nav aria-label={heading} className="mt-16 border-t border-white/10 pt-token-8">
      <h2 className="text-center font-heading text-lg font-semibold text-white/85">{heading}</h2>
      <ul className="mt-token-4 flex flex-wrap justify-center gap-token-2">
        {items.map((o) => {
          const on = o.slug === current;
          return (
            <li key={o.slug}>
              <Link
                href={`/templates/${o.slug}`}
                aria-current={on ? 'page' : undefined}
                className={`inline-block rounded-pill px-token-4 py-token-2 text-sm font-medium transition-colors duration-[var(--motion-fast)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${
                  on ? 'bg-brand text-white' : 'bg-white/[0.08] text-white/70 hover:bg-white/15 hover:text-white'
                }`}
              >
                {o.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
