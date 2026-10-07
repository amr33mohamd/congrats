/**
 * Static illustration of the guest-list view the full wedding package delivers
 * (compiled by hand today, a live dashboard later). Purely decorative, with
 * made-up sample names — it is labelled as an illustration on the page.
 */
const ROWS = {
  ar: [
    { name: 'خالة سميرة', n: 4, ok: true },
    { name: 'محمود وهبة', n: 2, ok: true },
    { name: 'عم صلاح', n: 3, ok: false },
    { name: 'شلة الجامعة', n: 6, ok: true },
    { name: 'بيت جدو', n: 5, ok: null },
  ],
  en: [
    { name: 'Aunt Samira', n: 4, ok: true },
    { name: 'Mahmoud & Heba', n: 2, ok: true },
    { name: 'Uncle Salah', n: 3, ok: false },
    { name: 'Uni friends', n: 6, ok: true },
    { name: 'Grandpa’s house', n: 5, ok: null },
  ],
} as const;

export function RsvpMock({ locale, label }: { locale: 'ar' | 'en'; label: string }) {
  const ar = locale === 'ar';
  const rows = ROWS[locale];
  const confirmed = rows.filter((r) => r.ok).reduce((s, r) => s + r.n, 0);
  const fmt = (n: number) => new Intl.NumberFormat(ar ? 'ar-EG' : 'en-EG').format(n);
  return (
    <div
      role="img"
      aria-label={label}
      className="relative mx-auto aspect-[9/16] w-full max-w-[280px] overflow-hidden rounded-[1.75rem] bg-[#1a1216] p-token-4 text-white ring-1 ring-white/15 shadow-[var(--shadow-pop)]"
    >
      <p className="text-center font-heading text-sm text-white/60">{ar ? 'فرح أحمد وسارة' : 'Ahmed & Sara’s wedding'}</p>
      <p className="mt-token-2 text-center font-heading text-4xl font-extrabold text-gold">{fmt(confirmed)}</p>
      <p className="text-center text-xs text-white/60">{ar ? 'ضيف أكدوا حضورهم' : 'guests confirmed'}</p>
      <ul className="mt-token-4 flex flex-col gap-token-2">
        {rows.map((r) => (
          <li key={r.name} className="flex items-center justify-between gap-token-2 rounded-lg bg-white/5 px-token-3 py-token-2 text-sm">
            <span className="truncate">{r.name}</span>
            <span className="flex shrink-0 items-center gap-token-2 text-xs">
              <span className="text-white/50">×{fmt(r.n)}</span>
              <span
                className={
                  r.ok === true
                    ? 'rounded-pill bg-success/20 px-2 py-0.5 text-success'
                    : r.ok === false
                      ? 'rounded-pill bg-danger/20 px-2 py-0.5 text-danger'
                      : 'rounded-pill bg-white/10 px-2 py-0.5 text-white/60'
                }
              >
                {r.ok === true ? (ar ? 'جاي' : 'Yes') : r.ok === false ? (ar ? 'معتذر' : 'No') : ar ? 'لسه' : 'Pending'}
              </span>
            </span>
          </li>
        ))}
      </ul>
      <div className="absolute inset-x-token-4 bottom-token-4 grid grid-cols-[auto_1fr] items-center gap-token-3 rounded-xl bg-white p-token-3 text-neutral-900">
        {/* a stylised QR — decorative only */}
        <svg aria-hidden viewBox="0 0 7 7" className="h-12 w-12" shapeRendering="crispEdges">
          {[
            '1111111', '1000001', '1011101', '1010101', '1011101', '1000001', '1111111',
          ].map((row, y) =>
            row.split('').map((c, x) =>
              c === '1' && (x < 3 || y < 3 || (x + y) % 2 === 0) ? <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" /> : null,
            ),
          )}
        </svg>
        <p className="text-xs font-semibold leading-snug">{ar ? 'امسح الكود وافتح الدعوة' : 'Scan to open the invitation'}</p>
      </div>
    </div>
  );
}
