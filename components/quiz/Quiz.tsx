'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Player } from '@/components/player/Player';
import { PhoneFrame } from '@/components/marketing/PhoneFrame';
import { TemplateStage } from '@/components/templates/TemplateStage';
import { cn } from '@/components/ui/cn';
import { WhatsAppIcon, whatsappLink } from '@/components/marketing/WhatsAppButton';
import type { TemplateDefinition } from '@/lib/template-contract';
import { track } from '@/lib/track';
import {
  COLORS,
  COLOR_SWATCH,
  MAX_COLORS,
  NAME_MAX,
  OCCASIONS,
  OCCASION_INFO,
  STYLES,
  STYLE_SWATCH,
  VENUE_MAX,
  cleanText,
  encodePrefill,
  joinedNames,
  parseAnswers,
  type ColorKey,
  type PartialAnswers,
  type QuizAnswers,
} from '@/lib/quiz/answers';
import { matchTemplates } from '@/lib/quiz/match';
import { buildQuizPreview } from '@/lib/quiz/personalize';

/**
 * The /start questionnaire: one question per screen, big tap targets, then a
 * live preview of the matched design with the visitor's own names in it.
 *
 * Progress lives in localStorage so a refresh (or a WhatsApp detour) resumes
 * where they left off. Analytics get option keys and template slugs only —
 * never the names, date or venue.
 */

export interface QuizTemplate {
  id: string;
  slug: string;
  locale: 'ar' | 'en';
  categorySlug: string | null;
  title: string;
  priceLabel: string;
  definition: TemplateDefinition;
}

const QUESTIONS = ['occasion', 'style', 'colors', 'names', 'when', 'lang'] as const;
type Question = (typeof QUESTIONS)[number];
const RESULT = QUESTIONS.length;

const STORAGE_KEY = 'cg_quiz_v1';

interface Saved {
  step: number;
  answers: PartialAnswers;
  chosen?: string;
}

function load(): Saved | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const v = JSON.parse(raw) as Saved;
    if (typeof v?.step !== 'number' || typeof v.answers !== 'object' || !v.answers) return null;
    return { step: Math.max(0, Math.min(RESULT, Math.floor(v.step))), answers: v.answers, chosen: v.chosen };
  } catch {
    return null;
  }
}

function save(v: Saved | null) {
  try {
    if (v) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(v));
    else window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* private mode — the quiz still works, it just won't resume */
  }
}

function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/* ─────────────────────────────── building blocks ─────────────────────────── */

function OptionCard({
  selected,
  onClick,
  children,
  className,
  testId,
}: {
  selected?: boolean;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
  testId?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      data-testid={testId}
      className={cn(
        'flex min-h-[64px] w-full items-center gap-token-3 rounded-xl border px-token-4 py-token-3 text-start text-base font-semibold transition-colors duration-[var(--motion-base)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand active:scale-[0.98]',
        selected ? 'border-brand bg-brand/15 text-ink' : 'border-border bg-surface text-ink hover:border-brand/60',
        className,
      )}
    >
      {children}
    </button>
  );
}

function PrimaryButton({
  children,
  disabled,
  onClick,
  testId,
}: {
  children: React.ReactNode;
  disabled?: boolean;
  onClick: () => void;
  testId?: string;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      data-testid={testId}
      className="w-full rounded-pill bg-brand px-token-6 py-token-4 text-base font-bold text-white shadow-lg transition-opacity disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
    >
      {children}
    </button>
  );
}

function Field({
  id,
  label,
  children,
}: {
  id: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-token-2 block text-sm font-medium text-ink">
        {label}
      </label>
      {children}
    </div>
  );
}

const inputClass =
  'block h-14 w-full rounded-xl border border-border bg-surface px-token-4 text-base text-ink placeholder:text-muted focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/40';

/** A tiny card mock in the style's colours: ground, a frame, two lines. */
function StyleSwatch({ colors }: { colors: readonly [string, string, string] }) {
  const [ground, ink, accent] = colors;
  return (
    <span
      aria-hidden
      className="relative flex h-14 w-11 shrink-0 flex-col items-center justify-center gap-1 overflow-hidden rounded-md shadow-inner"
      style={{ background: ground, border: `1px solid ${accent}` }}
    >
      <span className="absolute inset-1 rounded-t-full border" style={{ borderColor: accent }} />
      <span className="h-1 w-5 rounded-full" style={{ background: accent }} />
      <span className="h-0.5 w-4 rounded-full" style={{ background: ink }} />
      <span className="h-0.5 w-3 rounded-full" style={{ background: ink }} />
    </span>
  );
}

/* ───────────────────────────────── the quiz ─────────────────────────────── */

export function Quiz({
  templates,
  locale,
  signedIn,
  whatsappHref,
}: {
  templates: QuizTemplate[];
  locale: 'ar' | 'en';
  signedIn: boolean;
  whatsappHref: string | null;
}) {
  const t = useTranslations('quiz');
  const [step, setStep] = React.useState(0);
  const [answers, setAnswers] = React.useState<PartialAnswers>({});
  const [chosen, setChosen] = React.useState<string | undefined>();
  const [ready, setReady] = React.useState(false);
  const [nameError, setNameError] = React.useState(false);
  const topRef = React.useRef<HTMLDivElement>(null);

  // Resume a saved quiz once on mount (localStorage only exists client-side).
  React.useEffect(() => {
    const saved = load();
    if (saved) {
      const ok = saved.step === 0 || Boolean(saved.answers.occasion);
      setAnswers(saved.answers);
      setStep(ok ? saved.step : 0);
      setChosen(saved.chosen);
    }
    track('quiz_start', { resumed: Boolean(saved && saved.step > 0) });
    setReady(true);
  }, []);

  React.useEffect(() => {
    if (ready) save({ step, answers, chosen });
  }, [ready, step, answers, chosen]);

  const go = (next: number) => {
    setStep(next);
    setNameError(false);
    topRef.current?.scrollIntoView({ block: 'start' });
  };

  const answer = (question: Question, patch: PartialAnswers, value: string, advance = true) => {
    setAnswers((a) => ({ ...a, ...patch }));
    if (question !== 'names' && question !== 'when') setChosen(undefined);
    track('quiz_answer', { question, value });
    if (advance) go(QUESTIONS.indexOf(question) + 1);
  };

  const restart = () => {
    save(null);
    setAnswers({});
    setChosen(undefined);
    go(0);
  };

  const final: QuizAnswers | null = React.useMemo(
    () => (answers.occasion ? parseAnswers({ ...answers, lang: answers.lang ?? locale }) : null),
    [answers, locale],
  );

  const question = QUESTIONS[step] as Question | undefined;
  const info = answers.occasion ? OCCASION_INFO[answers.occasion] : null;
  const couple = info?.names === 'couple';
  const back = locale === 'ar' ? '→' : '←';

  return (
    <div ref={topRef} className="min-h-[100svh] overflow-x-hidden bg-surface-2 text-ink">
      <div className="mx-auto flex min-h-[100svh] w-full max-w-md flex-col px-token-4 pb-token-8 pt-token-4">
        {/* top bar */}
        <header className="flex items-center gap-token-3">
          {step > 0 ? (
            <button
              type="button"
              onClick={() => go(step - 1)}
              className="flex h-11 shrink-0 items-center gap-1 rounded-pill px-token-3 text-sm font-medium text-muted hover:text-ink"
              data-testid="quiz-back"
            >
              <span aria-hidden>{back}</span> {t('back')}
            </button>
          ) : (
            <Link href="/" className="flex h-11 shrink-0 items-center px-token-2 font-heading text-lg font-extrabold text-ink">
              {t('brand')}
            </Link>
          )}
          {step < RESULT ? (
            <div className="flex-1">
              <div
                className="h-2 w-full overflow-hidden rounded-pill bg-border"
                role="progressbar"
                aria-valuemin={1}
                aria-valuemax={QUESTIONS.length}
                aria-valuenow={step + 1}
                aria-label={t('progress', { current: step + 1, total: QUESTIONS.length })}
              >
                <div
                  className="h-full rounded-pill bg-brand transition-[width] duration-300"
                  style={{ width: `${((step + 1) / QUESTIONS.length) * 100}%` }}
                />
              </div>
              <p className="mt-1 text-xs text-muted">{t('progress', { current: step + 1, total: QUESTIONS.length })}</p>
            </div>
          ) : (
            <div className="flex-1" />
          )}
        </header>

        <main className="mt-token-6 flex flex-1 flex-col">
          {question === 'occasion' ? (
            <>
              <p className="mb-token-2 text-sm text-gold">{t('intro')}</p>
              <h1 className="font-heading text-3xl font-extrabold">{t('occasion.title')}</h1>
              <p className="mt-token-1 text-muted">{t('occasion.subtitle')}</p>
              <div className="mt-token-6 grid grid-cols-2 gap-token-3">
                {OCCASIONS.map((o) => (
                  <OptionCard
                    key={o}
                    testId={`occasion-${o}`}
                    selected={answers.occasion === o}
                    onClick={() => answer('occasion', { occasion: o }, o)}
                    className="flex-col justify-center gap-1 text-center text-sm"
                  >
                    <span aria-hidden className="text-2xl">
                      {OCCASION_INFO[o].emoji}
                    </span>
                    {t(`occasion.options.${o}`)}
                  </OptionCard>
                ))}
              </div>
            </>
          ) : null}

          {question === 'style' ? (
            <>
              <h1 className="font-heading text-3xl font-extrabold">{t('style.title')}</h1>
              <p className="mt-token-1 text-muted">{t('style.subtitle')}</p>
              <div className="mt-token-6 grid gap-token-3">
                {STYLES.map((s) => (
                  <OptionCard
                    key={s}
                    testId={`style-${s}`}
                    selected={answers.style === s}
                    onClick={() => answer('style', { style: s }, s)}
                  >
                    <StyleSwatch colors={STYLE_SWATCH[s]} />
                    <span className="min-w-0">
                      <span className="block">{t(`style.options.${s}.label`)}</span>
                      <span className="block text-sm font-normal text-muted">{t(`style.options.${s}.hint`)}</span>
                    </span>
                  </OptionCard>
                ))}
              </div>
            </>
          ) : null}

          {question === 'colors' ? (
            <>
              <h1 className="font-heading text-3xl font-extrabold">{t('colors.title')}</h1>
              <p className="mt-token-1 text-muted">{t('colors.subtitle')}</p>
              <div className="mt-token-6 grid grid-cols-2 gap-token-3">
                {COLORS.map((c) => {
                  const picked = answers.colors?.includes(c) ?? false;
                  return (
                    <OptionCard
                      key={c}
                      testId={`color-${c}`}
                      selected={picked}
                      onClick={() =>
                        setAnswers((a) => {
                          const cur = a.colors ?? [];
                          const next: ColorKey[] = cur.includes(c)
                            ? cur.filter((x) => x !== c)
                            : [...cur, c].slice(-MAX_COLORS);
                          return { ...a, colors: next };
                        })
                      }
                    >
                      <span
                        aria-hidden
                        className="h-8 w-8 shrink-0 rounded-full border border-white/30 shadow-inner"
                        style={{ background: COLOR_SWATCH[c] }}
                      />
                      {t(`colors.options.${c}`)}
                    </OptionCard>
                  );
                })}
              </div>
              <div className="mt-auto grid gap-token-3 pt-token-8">
                <PrimaryButton
                  testId="quiz-next"
                  onClick={() => {
                    setChosen(undefined);
                    track('quiz_answer', { question: 'colors', value: (answers.colors ?? []).join(',') || 'any' });
                    go(step + 1);
                  }}
                >
                  {answers.colors?.length ? t('next') : t('colors.any')}
                </PrimaryButton>
              </div>
            </>
          ) : null}

          {question === 'names' ? (
            <form
              className="flex flex-1 flex-col"
              onSubmit={(e) => {
                e.preventDefault();
                const one = cleanText(answers.name1 ?? '', NAME_MAX);
                const two = couple ? cleanText(answers.name2 ?? '', NAME_MAX) : '';
                if (!one && !two) {
                  setNameError(true);
                  return;
                }
                answer('names', { name1: one || undefined, name2: two || undefined }, couple && one && two ? 'both' : 'one');
              }}
            >
              <h1 className="font-heading text-3xl font-extrabold">
                {couple ? t('names.titleCouple') : t('names.titleSingle')}
              </h1>
              <p className="mt-token-1 text-muted">{t('names.subtitle')}</p>
              <div className="mt-token-6 grid gap-token-4">
                <Field id="quiz-name1" label={couple ? t('names.name1Couple') : t('names.name1Single')}>
                  <input
                    id="quiz-name1"
                    className={inputClass}
                    value={answers.name1 ?? ''}
                    maxLength={NAME_MAX}
                    autoComplete="off"
                    enterKeyHint={couple ? 'next' : 'done'}
                    placeholder={couple ? t('names.placeholder1Couple') : t('names.placeholderSingle')}
                    onChange={(e) => setAnswers((a) => ({ ...a, name1: e.target.value }))}
                  />
                </Field>
                {couple ? (
                  <Field id="quiz-name2" label={t('names.name2Couple')}>
                    <input
                      id="quiz-name2"
                      className={inputClass}
                      value={answers.name2 ?? ''}
                      maxLength={NAME_MAX}
                      autoComplete="off"
                      enterKeyHint="done"
                      placeholder={t('names.placeholder2Couple')}
                      onChange={(e) => setAnswers((a) => ({ ...a, name2: e.target.value }))}
                    />
                  </Field>
                ) : null}
                {nameError ? (
                  <p role="alert" className="text-sm text-danger">
                    {t('names.required')}
                  </p>
                ) : null}
              </div>
              <div className="mt-auto pt-token-8">
                <button
                  type="submit"
                  data-testid="quiz-next"
                  className="w-full rounded-pill bg-brand px-token-6 py-token-4 text-base font-bold text-white shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  {t('next')}
                </button>
              </div>
            </form>
          ) : null}

          {question === 'when' ? (
            <form
              className="flex flex-1 flex-col"
              onSubmit={(e) => {
                e.preventDefault();
                const venue = cleanText(answers.venue ?? '', VENUE_MAX);
                const date = answers.date && /^\d{4}-\d{2}-\d{2}$/.test(answers.date) ? answers.date : undefined;
                answer('when', { date, venue: venue || undefined }, [date ? 'date' : '', venue ? 'venue' : ''].filter(Boolean).join(',') || 'none');
              }}
            >
              <h1 className="font-heading text-3xl font-extrabold">{t('when.title')}</h1>
              <p className="mt-token-1 text-muted">{t('when.subtitle')}</p>
              <div className="mt-token-6 grid gap-token-4">
                <Field id="quiz-date" label={t('when.date')}>
                  <input
                    id="quiz-date"
                    type="date"
                    className={inputClass}
                    min={todayIso()}
                    value={answers.date ?? ''}
                    onChange={(e) => setAnswers((a) => ({ ...a, date: e.target.value || undefined }))}
                  />
                </Field>
                <Field id="quiz-venue" label={t('when.venue')}>
                  <input
                    id="quiz-venue"
                    className={inputClass}
                    value={answers.venue ?? ''}
                    maxLength={VENUE_MAX}
                    autoComplete="off"
                    enterKeyHint="done"
                    placeholder={t('when.venuePlaceholder')}
                    onChange={(e) => setAnswers((a) => ({ ...a, venue: e.target.value }))}
                  />
                </Field>
              </div>
              <div className="mt-auto pt-token-8">
                <button
                  type="submit"
                  data-testid="quiz-next"
                  className="w-full rounded-pill bg-brand px-token-6 py-token-4 text-base font-bold text-white shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  {answers.date || answers.venue?.trim() ? t('next') : t('skip')}
                </button>
              </div>
            </form>
          ) : null}

          {question === 'lang' ? (
            <>
              <h1 className="font-heading text-3xl font-extrabold">{t('lang.title')}</h1>
              <p className="mt-token-1 text-muted">{t('lang.subtitle')}</p>
              <div className="mt-token-6 grid grid-cols-2 gap-token-3">
                {(['ar', 'en'] as const).map((l) => (
                  <OptionCard
                    key={l}
                    testId={`lang-${l}`}
                    selected={answers.lang === l}
                    onClick={() => answer('lang', { lang: l }, l)}
                    className="min-h-[96px] flex-col justify-center text-center text-lg"
                  >
                    <span aria-hidden className="font-heading text-2xl" dir={l === 'ar' ? 'rtl' : 'ltr'}>
                      {l === 'ar' ? 'أ ب' : 'Aa'}
                    </span>
                    {t(`lang.${l}`)}
                  </OptionCard>
                ))}
              </div>
            </>
          ) : null}

          {step === RESULT ? (
            final ? (
              <Result
                answers={final}
                templates={templates}
                chosen={chosen}
                onChoose={setChosen}
                locale={locale}
                signedIn={signedIn}
                whatsappHref={whatsappHref}
                onEdit={() => go(0)}
                onRestart={restart}
              />
            ) : (
              <div className="text-center">
                <PrimaryButton onClick={restart}>{t('result.restart')}</PrimaryButton>
              </div>
            )
          ) : null}
        </main>
      </div>
    </div>
  );
}

/* ───────────────────────────────── the result ───────────────────────────── */

function Result({
  answers,
  templates,
  chosen,
  onChoose,
  locale,
  signedIn,
  whatsappHref,
  onEdit,
  onRestart,
}: {
  answers: QuizAnswers;
  templates: QuizTemplate[];
  chosen?: string;
  onChoose: (id: string) => void;
  locale: 'ar' | 'en';
  signedIn: boolean;
  whatsappHref: string | null;
  onEdit: () => void;
  onRestart: () => void;
}) {
  const t = useTranslations('quiz');
  const match = React.useMemo(() => matchTemplates(templates, answers), [templates, answers]);
  const options = match ? [match.best, ...match.alternatives] : [];
  const current = options.find((o) => o.id === chosen) ?? options[0];
  const sampleGuest = t('result.sampleGuest');

  const previews = React.useMemo(
    () =>
      new Map(
        options.map((o) => [
          o.id,
          buildQuizPreview(o.definition, answers, {
            templateId: o.id,
            category: o.categorySlug ?? undefined,
            sampleGuest,
          }),
        ]),
      ),
    // options is derived from match; recompute when the match or answers change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [match, answers, sampleGuest],
  );

  const resultSlug = match?.best.slug;
  React.useEffect(() => {
    if (resultSlug) track('quiz_result', { template: resultSlug, occasion: answers.occasion, style: answers.style ?? 'none' });
  }, [resultSlug, answers.occasion, answers.style]);

  if (!current) {
    return <p className="rounded-xl border border-border bg-surface p-token-6 text-center text-muted">{t('result.noMatch')}</p>;
  }

  const info = OCCASION_INFO[answers.occasion];
  const names = joinedNames(answers, locale === 'ar' ? ' و' : ' & ');
  const title = !names
    ? t('result.titleNoName')
    : info.names === 'couple'
      ? t('result.titleCouple', { names })
      : t('result.titleSingle', { names });

  const builderPath = `/builder?template=${current.id}&prefill=${encodePrefill(answers)}`;
  const createHref = signedIn
    ? `/${locale}${builderPath}`
    : `/${locale}/login?mode=signup&next=${encodeURIComponent(builderPath)}`;

  const waHref = whatsappHref ? whatsappLink(whatsappHref, whatsappMessage(t, answers, current, locale)) : null;
  const experience = previews.get(current.id)!;

  return (
    <div className="flex flex-col">
      <h1 className="font-heading text-2xl font-extrabold leading-snug" data-testid="quiz-result-title">
        {title}
      </h1>
      <p className="mt-token-1 text-sm text-muted">{t('result.subtitle')}</p>

      <div className="mt-token-6" data-testid="quiz-preview">
        <PhoneFrame className="max-w-[280px]">
          <div className="absolute inset-0">
            <div className="h-full w-full [&>div]:!h-full">
              <Player key={`${current.id}:${JSON.stringify(answers)}`} experience={experience} embedded />
            </div>
          </div>
        </PhoneFrame>
        <p className="mt-token-3 text-center text-sm font-semibold text-ink">
          {current.title} · <span className="text-gold">{current.priceLabel}</span>
        </p>
      </div>

      <div className="mt-token-6 grid gap-token-3">
        <a
          href={createHref}
          data-testid="quiz-cta-create"
          onClick={() => track('quiz_cta', { cta: 'create', template: current.slug })}
          className="block w-full rounded-pill bg-brand px-token-6 py-token-4 text-center text-base font-bold text-white shadow-[0_10px_40px_-8px_rgb(240_67_110_/_0.7)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          {t('result.ctaCreate')}
        </a>
        {waHref ? (
          <a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            data-testid="quiz-cta-whatsapp"
            onClick={() => {
              track('quiz_cta', { cta: 'whatsapp', template: current.slug });
              track('whatsapp_click', { source: 'quiz' });
            }}
            className="flex w-full items-center justify-center gap-token-2 rounded-pill bg-[#25D366] px-token-6 py-token-4 text-center text-base font-bold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#25D366]"
          >
            <WhatsAppIcon className="h-5 w-5 shrink-0" />
            {t('result.ctaWhatsapp')}
          </a>
        ) : null}
      </div>

      {options.length > 1 ? (
        <section className="mt-token-8">
          <h2 className="text-base font-bold">{t('result.alternatives')}</h2>
          <div className="mt-token-3 grid grid-cols-3 gap-token-3">
            {options.map((o) => {
              const active = o.id === current.id;
              return (
                <button
                  key={o.id}
                  type="button"
                  aria-pressed={active}
                  data-testid={`quiz-option-${o.slug}`}
                  onClick={() => {
                    onChoose(o.id);
                    track('quiz_cta', { cta: 'alternative', template: o.slug });
                  }}
                  className={cn(
                    'min-w-0 text-start focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand',
                  )}
                >
                  <span
                    className={cn(
                      'relative block aspect-[9/16] overflow-hidden rounded-lg border-2',
                      active ? 'border-brand' : 'border-transparent',
                    )}
                  >
                    <TemplateStage experience={previews.get(o.id)!} />
                    {active ? (
                      <span className="absolute inset-x-0 bottom-0 bg-brand/90 py-0.5 text-center text-[11px] font-semibold text-white">
                        {t('result.chosen')}
                      </span>
                    ) : null}
                  </span>
                  <span className="mt-1 block truncate text-xs text-muted">{o.title}</span>
                </button>
              );
            })}
          </div>
        </section>
      ) : null}

      <div className="mt-token-8 flex items-center justify-center gap-token-4 text-sm">
        <button type="button" onClick={onEdit} className="text-muted underline-offset-4 hover:text-ink hover:underline">
          {t('result.edit')}
        </button>
        <span aria-hidden className="text-border">
          |
        </span>
        <button type="button" onClick={onRestart} className="text-muted underline-offset-4 hover:text-ink hover:underline" data-testid="quiz-restart">
          {t('result.restart')}
        </button>
      </div>
    </div>
  );
}

type T = (key: string, values?: Record<string, string | number>) => string;

/** The prefilled WhatsApp message: every answer, in the page's language. */
function whatsappMessage(t: T, a: QuizAnswers, design: QuizTemplate, locale: 'ar' | 'en'): string {
  const lines = [t('whatsapp.intro'), t('whatsapp.occasion', { value: t(`occasion.options.${a.occasion}`) })];
  if (a.style) lines.push(t('whatsapp.style', { value: t(`style.options.${a.style}.label`) }));
  if (a.colors?.length) {
    lines.push(t('whatsapp.colors', { value: a.colors.map((c) => t(`colors.options.${c}`)).join(locale === 'ar' ? '، ' : ', ') }));
  }
  const names = joinedNames(a, locale === 'ar' ? ' و' : ' & ');
  if (names) lines.push(t('whatsapp.names', { value: names }));
  if (a.date) {
    const d = new Date(`${a.date}T12:00:00Z`);
    const value = new Intl.DateTimeFormat(locale === 'ar' ? 'ar-EG' : 'en-GB', { dateStyle: 'long', timeZone: 'UTC' }).format(d);
    lines.push(t('whatsapp.date', { value }));
  }
  if (a.venue) lines.push(t('whatsapp.venue', { value: a.venue }));
  if (a.lang) lines.push(t('whatsapp.lang', { value: t(`lang.${a.lang}`) }));
  lines.push(t('whatsapp.design', { value: `${design.title} (${design.slug})` }));
  return lines.join('\n');
}
