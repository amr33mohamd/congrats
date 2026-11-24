'use client';

/**
 * The White Bloom player (theme.stage === 'bloom').
 *
 * The card is a stack of full-screen painted panels: white flowers on white
 * paper, then on deep turquoise, alternating. Each section of the template is
 * one panel, its artwork taken from the scene's own image background and its
 * ink from the scene's style (light ink → a turquoise panel). Text sits on the
 * side of the panel away from the flowers (style.textPosition).
 *
 * Sections have their own bespoke treatments here (the ribbon the guest
 * unties, diamond-set date, hanging-pearl countdown, timeline), but they read
 * the same slots as on any other card, so the builder edits them unchanged and
 * the RSVP is the same real form saved for the couple. A section type this
 * player has no treatment for falls back to the shared SceneRenderer.
 */
import * as React from 'react';
import { motion, useInView } from 'framer-motion';
import {
  sceneForStep,
  withLocaleFonts,
  type BoundExperience,
  type BoundStep,
  type SceneDef,
} from '@/lib/template-contract';
import { bodyFamily, cssFamily, googleFontsHref } from '@/lib/fonts';
import { remainingUntil, type Remaining } from '@/lib/countdown';
import { track } from '@/lib/track';
import { hexLuminance } from '../color';
import { SceneRenderer } from '../SceneRenderer';
import { RsvpForm, safeMapsUrl } from '../InvitationScenes';
import { Soundtrack } from '../Soundtrack';
import { isSectionVisible, type PlayerProps } from '../Player';
import {
  BLOOM_CSS,
  C,
  CoverPanel,
  Kicker,
  Pearl,
  PearlRule,
  Rise,
  SMALL_CAPS,
  Script,
  splitNames,
  text,
  usePrefersReducedMotion,
  whenParts,
  type Ctx,
} from './parts';

function VersePanel({ c }: { c: Ctx }) {
  const bism = text(c, 'bismillah');
  const translation = c.ar ? '' : text(c, 'translation');
  const verse = text(c, 'verse');
  const ref = text(c, 'verseRef');
  return (
    <div className="text-center" style={{ color: c.ink }}>
      <Rise c={c} className="mb-[14px] flex items-end justify-center gap-[6px]">
        <Pearl size={7} />
        <Pearl size={10} />
        <Pearl size={7} />
      </Rise>
      {bism ? (
        <Rise c={c} i={1}>
          <p
            dir="rtl"
            className="bl-shine whitespace-nowrap text-[28px] font-bold leading-[1.7]"
            style={{ fontFamily: "'Amiri', 'Aref Ruqaa', serif" }}
          >
            {bism}
          </p>
        </Rise>
      ) : null}
      {translation ? (
        <Rise c={c} i={1}>
          <p className="mt-[2px] text-[16.5px] italic leading-[1.45]" style={{ color: 'rgba(246,251,251,0.72)' }}>
            {translation}
          </p>
        </Rise>
      ) : null}
      <Rise c={c} i={2}>
        <PearlRule color={C.goldLight} width={64} />
      </Rise>
      {verse ? (
        <Rise c={c} i={3}>
          <p
            className={c.ar ? 'text-[24px] leading-[1.9]' : 'text-[22px] font-medium leading-[1.6]'}
            style={{ fontFamily: c.ar ? "'Amiri', serif" : undefined }}
          >
            {verse}
          </p>
        </Rise>
      ) : null}
      {ref ? (
        <Rise c={c} i={4} className="mt-[16px]">
          <Kicker c={c} color={C.goldLight}>
            {ref}
          </Kicker>
        </Rise>
      ) : null}
    </div>
  );
}

/** The turquoise satin bow at the centre of the ribbon. */
function Bow() {
  return (
    <svg viewBox="0 0 80 80" className="block h-full w-full" aria-hidden>
      <defs>
        <linearGradient id="bl-satin" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#08414B" />
          <stop offset="0.38" stopColor="#3FB3BB" />
          <stop offset="0.5" stopColor="#A5E4E6" />
          <stop offset="0.62" stopColor="#3FB3BB" />
          <stop offset="1" stopColor="#073A43" />
        </linearGradient>
      </defs>
      <path
        d="M40 40 C26 18 4 20 8 36 C10 50 28 50 40 40 Z"
        fill="url(#bl-satin)"
        stroke="#073A43"
        strokeOpacity="0.35"
      />
      <path
        d="M40 40 C54 18 76 20 72 36 C70 50 52 50 40 40 Z"
        fill="url(#bl-satin)"
        stroke="#073A43"
        strokeOpacity="0.35"
      />
      <path d="M40 40 C34 50 30 62 24 74 L32 72 L36 78 C38 64 40 52 40 40 Z" fill="url(#bl-satin)" />
      <path d="M40 40 C46 50 50 62 56 74 L48 72 L44 78 C42 64 40 52 40 40 Z" fill="url(#bl-satin)" />
      <ellipse cx="40" cy="40" rx="8" ry="9" fill="url(#bl-satin)" stroke="#073A43" strokeOpacity="0.4" />
    </svg>
  );
}

function InvitePanel({ c }: { c: Ctx }) {
  // The builder shows the card open: the sender is editing what is under the ribbon.
  const [open, setOpen] = React.useState(c.embedded);
  const names = splitNames(text(c, 'names'));
  const when = whenParts(text(c, 'date'), c.ar);
  const untie = () => {
    if (!open) setOpen(true);
  };
  const lines: React.ReactNode[] = [
    <Kicker key="k" c={c}>
      {text(c, 'inviteKicker')}
    </Kicker>,
    names.length === 2 ? (
      <React.Fragment key="n">
        <Script c={c} size={50}>
          {names[0]}
        </Script>
        <p
          className="text-[22px] italic leading-[1.1]"
          style={{ color: C.gold, fontFamily: "'Playfair Display', serif" }}
        >
          &amp;
        </p>
        <Script c={c} size={50}>
          {names[1]}
        </Script>
      </React.Fragment>
    ) : (
      <Script key="n" c={c} size={44}>
        {names[0]}
      </Script>
    ),
    <PearlRule key="r" color={C.gold} triple />,
    <p
      key="b"
      className="mx-auto max-w-[26ch] text-[19px] font-medium leading-[1.5]"
      style={{ color: c.soft, fontStyle: c.ar ? undefined : 'italic' }}
    >
      {text(c, 'inviteBody')}
    </p>,
    when ? (
      <p
        key="d"
        className={c.ar ? 'mt-[18px] text-[16px]' : 'mt-[18px] text-[14px] uppercase tracking-[0.2em]'}
        style={{ color: c.ink, fontFamily: c.ar ? undefined : SMALL_CAPS }}
      >
        {when.long}
      </p>
    ) : null,
    <p
      key="t"
      className="mt-[2px] text-[17px] leading-[1.5]"
      style={{ color: c.soft, fontStyle: c.ar ? undefined : 'italic' }}
    >
      {text(c, 'inviteTime')}
    </p>,
  ].filter(Boolean);

  return (
    <div className="text-center">
      <div
        role={open ? undefined : 'button'}
        tabIndex={open ? undefined : 0}
        aria-label={open ? undefined : c.ar ? 'فك الشريطة' : 'Untie the ribbon'}
        onClick={untie}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && untie()}
        className={`bl-card relative mx-auto overflow-hidden rounded-[4px] px-[9%] py-[44px] ${open ? 'is-open' : 'cursor-pointer'}`}
        style={{
          background: 'rgba(255,255,255,0.94)',
          boxShadow: '0 18px 50px -24px rgba(11,63,72,0.45)',
          transitionDuration: c.reduced ? '0.01s' : undefined,
        }}
      >
        <div className="relative z-[1] flex flex-col items-center">
          {lines.map((l, i) => (
            <div
              key={i}
              className="bl-line w-full"
              style={{
                opacity: open ? 1 : 0.22,
                transitionDelay: open && !c.reduced ? `${0.55 + i * 0.15}s` : '0s',
              }}
            >
              {l}
            </div>
          ))}
        </div>
        <div aria-hidden className="bl-ribbon pointer-events-none absolute inset-0 z-[2]">
          <i className="v1" />
          <i className="v2" />
          <i className="h1" />
          <i className="h2" />
          <i className="t1" />
          <i className="t2" />
          <span className="bl-bow">
            <Bow />
          </span>
        </div>
      </div>
      <p
        aria-hidden
        className={`bl-untie mt-[18px] flex items-center justify-center gap-[9px] ${c.ar ? 'text-[14px]' : 'text-[11.5px] uppercase tracking-[0.32em]'}`}
        style={{
          color: c.key,
          fontFamily: c.ar ? undefined : SMALL_CAPS,
          opacity: open ? 0 : 1,
        }}
      >
        <Pearl size={6} />
        {c.ar ? 'اضغط لفك الشريطة' : 'Tap to untie'}
        <Pearl size={6} />
      </p>
    </div>
  );
}

function SaveDatePanel({ c }: { c: Ctx }) {
  const when = whenParts(text(c, 'date'), c.ar);
  const couple = (c.experience.fields ?? {}).couple ?? '';
  const calendar = when
    ? `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
        c.ar ? `فرح ${couple}` : `${couple} — Wedding`,
      )}&dates=${when.gcal}&ctz=Africa/Cairo${c.address ? `&location=${encodeURIComponent(c.address.replace(/\n/g, ', '))}` : ''}`
    : '';
  const gem = (big: boolean, label: string, i: number) => (
    <div className={`bl-gem relative flex-none ${big ? 'is-big' : ''}`}>
      <b className={c.revealed ? 'is-live' : ''} style={{ transitionDelay: `${i * 0.15}s` }} />
      <span
        className="absolute inset-0 flex items-center justify-center"
        style={{
          opacity: c.revealed ? 1 : 0,
          transition: `opacity .8s ${0.7 + i * 0.15}s ease`,
        }}
      >
        <span className={big ? 'bl-gem-num' : 'bl-gem-cap'} style={big ? { fontSize: 'min(11cqw, 46px)' } : undefined}>
          {label}
        </span>
      </span>
    </div>
  );
  return (
    <div className="text-center" style={{ color: c.ink }}>
      <Rise c={c}>
        <Script c={c} size={50}>
          {text(c, 'saveHeading')}
        </Script>
        <p
          className={c.ar ? 'mt-[8px] text-[16px]' : 'mt-[8px] text-[12px] uppercase tracking-[0.26em]'}
          style={{
            color: 'rgba(246,251,251,0.72)',
            fontFamily: c.ar ? undefined : SMALL_CAPS,
          }}
        >
          {text(c, 'saveBody')}
        </p>
      </Rise>
      {when ? (
        <>
          <div
            className="relative mx-auto my-[48px] flex items-center justify-center"
            style={{ gap: 'min(9.5cqw, 38px)' }}
            dir="ltr"
          >
            <span
              aria-hidden
              className="absolute inset-x-[4%] top-1/2 h-px origin-center transition-transform duration-1000"
              style={{
                background: `linear-gradient(90deg, transparent, ${C.goldLight}bf 18%, ${C.goldLight}bf 82%, transparent)`,
                transform: c.revealed || c.reduced ? 'none' : 'scaleX(0)',
              }}
            />
            {gem(false, when.month, 0)}
            {gem(true, when.day, 1)}
            {gem(false, when.year, 2)}
            <span aria-hidden className="bl-drop" />
          </div>
          <Rise c={c} i={3}>
            <p
              className={`flex items-center justify-center gap-[14px] ${c.ar ? 'text-[17px]' : 'text-[13.5px] uppercase tracking-[0.22em]'}`}
              style={{ fontFamily: c.ar ? undefined : SMALL_CAPS }}
            >
              <span>{when.weekday}</span>
              {when.time ? (
                <>
                  <i aria-hidden className="block h-[5px] w-[5px] rounded-full" style={{ background: C.goldLight }} />
                  <span>{when.time}</span>
                </>
              ) : null}
            </p>
            {calendar ? (
              <a
                href={calendar}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className={`mt-[26px] inline-flex items-center gap-[10px] rounded-full border px-[24px] py-[11px] transition-colors hover:bg-[#F6FBFB] hover:text-[#0B3F48] ${
                  c.ar ? 'text-[14px]' : 'text-[12px] uppercase tracking-[0.24em]'
                }`}
                style={{
                  borderColor: `${C.pearl}99`,
                  color: C.pearl,
                  fontFamily: c.ar ? undefined : SMALL_CAPS,
                }}
              >
                <Pearl size={6} />
                {c.ar ? 'أضف للتقويم' : 'Add to Calendar'}
              </a>
            ) : null}
          </Rise>
        </>
      ) : null}
    </div>
  );
}

function CountdownPanel({ c }: { c: Ctx }) {
  const target = text(c, 'date');
  const [left, setLeft] = React.useState<Remaining | null>(null);
  React.useEffect(() => {
    if (!target) return;
    const tick = () => setLeft(remainingUntil(target));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [target]);
  const loc = c.ar ? 'ar-EG' : 'en-GB';
  const units = left
    ? [
        { v: left.d, l: c.ar ? 'يوم' : 'Days', chain: 30 },
        { v: left.h, l: c.ar ? 'ساعة' : 'Hours', chain: 52 },
        { v: left.m, l: c.ar ? 'دقيقة' : 'Minutes', chain: 40 },
        { v: left.s, l: c.ar ? 'ثانية' : 'Seconds', chain: 60 },
      ]
    : [];
  return (
    <div className="text-center" style={{ color: c.ink }}>
      <Rise c={c}>
        <Kicker c={c}>{text(c, 'countKicker')}</Kicker>
        <div className="mt-[6px]">
          <Script c={c} size={48}>
            {text(c, 'countHeading')}
          </Script>
        </div>
      </Rise>
      {units.length ? (
        <div className="mx-[2%] mt-[30px]" dir={c.ar ? 'rtl' : 'ltr'}>
          <div aria-hidden className="relative h-[14px]">
            <span
              className="absolute inset-x-0 top-[6px] h-px"
              style={{
                background: `linear-gradient(90deg, transparent, ${C.gold} 12%, ${C.gold} 88%, transparent)`,
              }}
            />
            {[6, 50, 94].map((x) => (
              <span key={x} className="absolute top-[3px]" style={{ left: `${x}%`, marginLeft: -3.5 }}>
                <Pearl size={7} />
              </span>
            ))}
          </div>
          <div className="-mt-[7px] flex items-start justify-around">
            {units.map((u, i) => (
              <div
                key={u.l}
                className={`flex w-[24%] flex-col items-center ${c.reduced ? '' : 'bl-sway'}`}
                style={{
                  animationDuration: `${4.6 + i * 0.3}s`,
                  animationDelay: `${-i * 1.1}s`,
                }}
              >
                <span aria-hidden className="bl-chain" style={{ height: u.chain }} />
                <span aria-hidden className="bl-cap" />
                <span
                  className="bl-big-pearl"
                  style={{
                    opacity: c.revealed || c.reduced ? 1 : 0,
                    transitionDelay: `${i * 0.12}s`,
                  }}
                >
                  <span
                    className="relative z-[1] text-[min(7.6cqw,31px)] font-semibold leading-none tabular-nums"
                    style={{ color: C.teal }}
                  >
                    {new Intl.NumberFormat(loc, {
                      minimumIntegerDigits: 2,
                    }).format(u.v)}
                  </span>
                </span>
                <span
                  className={
                    c.ar ? 'mt-[10px] text-[13px]' : 'mt-[10px] text-[min(2.7cqw,11px)] uppercase tracking-[0.2em]'
                  }
                  style={{
                    color: c.key,
                    fontFamily: c.ar ? undefined : SMALL_CAPS,
                  }}
                >
                  {u.l}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : null}
      <Rise c={c} i={2}>
        <p
          className="mt-[30px] text-[18px] leading-[1.5]"
          style={{ color: c.soft, fontStyle: c.ar ? undefined : 'italic' }}
        >
          {text(c, 'countNote')}
        </p>
      </Rise>
    </div>
  );
}

function ProgramPanel({ c }: { c: Ctx }) {
  const items = text(c, 'program')
    .split('\n')
    .map((l) => l.split('|').map((x) => x.trim()))
    .filter((p) => p.some(Boolean));
  return (
    <div className="text-center" style={{ color: c.ink }}>
      <Rise c={c}>
        <Kicker c={c} color={C.goldLight}>
          {text(c, 'progKicker')}
        </Kicker>
        <div className="mt-[6px]">
          <Script c={c} size={50}>
            {text(c, 'progHeading')}
          </Script>
        </div>
      </Rise>
      <div className="relative mt-[26px] pb-[34px] pt-[6px]">
        <span
          aria-hidden
          className="absolute bottom-[34px] start-1/2 top-0 w-px -translate-x-1/2 rtl:translate-x-1/2"
          style={{ background: 'rgba(226,201,143,0.22)' }}
        />
        <motion.span
          aria-hidden
          className="absolute bottom-[34px] start-1/2 top-0 w-px origin-top -translate-x-1/2 rtl:translate-x-1/2"
          style={{
            background: `linear-gradient(180deg, ${C.goldPale}, ${C.goldLight})`,
          }}
          initial={c.reduced ? false : { scaleY: 0 }}
          animate={c.revealed ? { scaleY: 1 } : undefined}
          transition={{
            duration: 0.5 + items.length * 0.35,
            ease: 'easeInOut',
          }}
        />
        {items.map(([time, title, note], i) => {
          const side = i % 2 === 0 ? 'end' : 'start';
          return (
            <motion.div
              key={i}
              className="relative grid min-h-[84px] items-start [grid-template-columns:1fr_34px_1fr]"
              initial={c.reduced ? false : { opacity: 0.2 }}
              animate={c.revealed ? { opacity: 1 } : undefined}
              transition={{ duration: 0.7, delay: 0.3 + i * 0.35 }}
            >
              <span aria-hidden className="col-start-2 row-start-1 mt-[3px] justify-self-center">
                <span className="bl-node block">
                  <Pearl size={16} />
                </span>
              </span>
              <div
                className={`row-start-1 px-[4px] ${side === 'end' ? 'col-start-3 text-start' : 'col-start-1 text-end'}`}
              >
                {time ? (
                  <p
                    className={c.ar ? 'text-[14px]' : 'text-[12.5px] uppercase tracking-[0.2em]'}
                    style={{
                      color: C.goldLight,
                      fontFamily: c.ar ? undefined : SMALL_CAPS,
                    }}
                  >
                    {time}
                  </p>
                ) : null}
                {title ? (
                  <p
                    className="mt-[2px]"
                    style={{
                      fontFamily: c.nameFont,
                      fontSize: c.ar ? 21 : 28,
                      lineHeight: c.ar ? 1.5 : 1.15,
                    }}
                  >
                    {title}
                  </p>
                ) : null}
                {note ? (
                  <p
                    className="mt-[3px] text-[15.5px] leading-[1.4]"
                    style={{
                      color: 'rgba(246,251,251,0.72)',
                      fontStyle: c.ar ? undefined : 'italic',
                    }}
                  >
                    {note}
                  </p>
                ) : null}
              </div>
            </motion.div>
          );
        })}
        {items.length ? (
          <span aria-hidden className="absolute bottom-[14px] start-1/2 -translate-x-1/2 rtl:translate-x-1/2">
            <Pearl size={24} />
          </span>
        ) : null}
      </div>
    </div>
  );
}

function VenuePanel({ c }: { c: Ctx }) {
  const [hall, ...rest] = text(c, 'address').split('\n');
  const address = text(c, 'address');
  const given = text(c, 'mapUrl');
  const href = safeMapsUrl(given)
    ? given
    : address
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address.replace(/\n/g, ', '))}`
      : '';
  return (
    <div className="text-center" style={{ color: c.ink }}>
      <Rise c={c}>
        <Kicker c={c}>{c.ar ? 'المكان' : 'Location'}</Kicker>
        <div className="mt-[6px]">
          <Script c={c} size={50}>
            {text(c, 'heading')}
          </Script>
        </div>
      </Rise>
      <Rise c={c} i={1}>
        <PearlRule color={C.gold} triple />
        {hall ? (
          <p
            className={c.ar ? 'text-[24px] font-bold' : 'text-[24px]'}
            style={{
              fontFamily: c.ar ? undefined : "'Playfair Display', serif",
            }}
          >
            {hall}
          </p>
        ) : null}
        {rest.map((l, i) => (
          <p
            key={i}
            className="mt-[2px] text-[18px] leading-[1.5]"
            style={{ color: c.soft, fontStyle: c.ar ? undefined : 'italic' }}
          >
            {l}
          </p>
        ))}
      </Rise>
      {href ? (
        <Rise c={c} i={2}>
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => {
              e.stopPropagation();
              if (/^\/(ar|en)\/p\//.test(window.location.pathname)) track('directions_click');
            }}
            className={`mt-[26px] inline-flex items-center gap-[10px] rounded-full px-[24px] py-[11px] transition-colors ${
              c.ar ? 'text-[14px]' : 'text-[12px] uppercase tracking-[0.24em]'
            }`}
            style={{
              background: C.teal,
              color: C.pearl,
              fontFamily: c.ar ? undefined : SMALL_CAPS,
            }}
          >
            <Pearl size={6} />
            {c.ar ? 'افتح الخريطة' : 'Get directions'}
          </a>
        </Rise>
      ) : null}
    </div>
  );
}

function RsvpPanel({ c }: { c: Ctx }) {
  const phone = text(c, 'phone').replace(/[^\d]/g, '');
  const guest = c.experience.recipientName || (c.ar ? 'ضيفكم' : 'your guest');
  const msg = c.ar
    ? `أهلاً! أنا ${guest}، يسعدني أؤكد حضوري 🤍`
    : `Hi! It's ${guest} — delighted to confirm I'll be there 🤍`;
  const wa = phone.length >= 8 ? `https://wa.me/${phone}?text=${encodeURIComponent(msg)}` : '';
  // The shared form reads its colours from the scene style: gold buttons, pearl text.
  const formScene: SceneDef = {
    ...c.scene,
    style: { ...c.scene.style, headingColor: C.goldLight, bodyColor: C.pearl },
  } as SceneDef;
  return (
    <div className="text-center" style={{ color: c.ink }}>
      <Rise c={c}>
        <Kicker c={c} color={C.goldLight}>
          {c.ar ? 'تأكيد الحضور' : 'RSVP'}
        </Kicker>
        <div className="mt-[6px]">
          <Script c={c} size={42}>
            {text(c, 'heading')}
          </Script>
        </div>
        <p
          className="mt-[8px] text-[17px] leading-[1.5]"
          style={{
            color: 'rgba(246,251,251,0.8)',
            fontStyle: c.ar ? undefined : 'italic',
          }}
        >
          {text(c, 'body')}
        </p>
      </Rise>
      <Rise c={c} i={1} className="bl-form">
        <RsvpForm
          p={{
            scene: formScene,
            step: c.step,
            theme: {
              ...c.experience.theme,
              palette: [C.teal, C.teal, C.pearl, C.goldLight],
            },
            direction: c.experience.direction,
            recipientName: c.experience.recipientName,
            reducedMotion: c.reduced,
            active: c.revealed,
            fields: c.experience.fields,
          }}
        />
        {wa ? (
          <a
            href={wa}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="mt-[16px] inline-block text-[14px] underline underline-offset-4"
            style={{ color: C.goldLight }}
          >
            {c.ar ? 'أو أكّد على واتساب' : 'Or reply on WhatsApp'}
          </a>
        ) : null}
      </Rise>
    </div>
  );
}

function ThankYouPanel({ c }: { c: Ctx }) {
  const names = text(c, 'names');
  const when = whenParts(text(c, 'date'), c.ar);
  return (
    <div
      className="relative mx-auto flex aspect-[3/4] w-[min(86%,350px)] flex-col items-center justify-center px-[16%] text-center"
      style={{ color: c.ink }}
    >
      <span
        aria-hidden
        className="absolute inset-[7%] rounded-[50%]"
        style={{
          background:
            'radial-gradient(closest-side, rgba(255,255,255,0.92), rgba(255,255,255,0.55) 70%, rgba(255,255,255,0))',
        }}
      />
      <svg aria-hidden viewBox="0 0 300 400" className="absolute inset-0 h-full w-full" fill="none">
        <ellipse cx="150" cy="200" rx="138" ry="188" stroke={C.gold} strokeOpacity="0.7" />
        <ellipse cx="150" cy="200" rx="130" ry="180" stroke={C.tealKey} strokeOpacity="0.3" />
      </svg>
      <span aria-hidden className="absolute left-1/2 top-[2%] -translate-x-1/2">
        <Pearl size={12} />
      </span>
      <span aria-hidden className="absolute bottom-[2%] left-1/2 -translate-x-1/2">
        <Pearl size={12} />
      </span>
      <div className="relative">
        <Rise c={c}>
          <Kicker c={c}>{c.ar ? 'بكل الحب والامتنان' : 'With love & gratitude'}</Kicker>
        </Rise>
        <Rise c={c} i={1} className="mt-[8px]">
          <Script c={c} size={56}>
            {text(c, 'heading')}
          </Script>
          <p
            className="mt-[4px] text-[17px] leading-[1.45]"
            style={{ color: c.soft, fontStyle: c.ar ? undefined : 'italic' }}
          >
            {text(c, 'body')}
          </p>
        </Rise>
        <Rise c={c} i={2}>
          <PearlRule color={C.gold} triple width={28} />
          {names ? (
            <Script c={c} size={34}>
              {names}
            </Script>
          ) : null}
          {when ? (
            <p className="mt-[6px] text-[12.5px] tracking-[0.2em]" style={{ fontFamily: SMALL_CAPS }} dir="ltr">
              {when.dots}
            </p>
          ) : null}
        </Rise>
      </div>
    </div>
  );
}

/** Any section type this stage has no treatment for. */
function Fallback({ c }: { c: Ctx }) {
  return (
    <SceneRenderer
      scene={{ ...c.scene, ornament: { kind: 'none', opacity: 0, scale: 1 } }}
      step={c.step}
      theme={{
        ...c.experience.theme,
        ornament: { kind: 'none', opacity: 0, scale: 1 },
      }}
      direction={c.experience.direction}
      recipientName={c.experience.recipientName}
      fields={c.experience.fields}
      reducedMotion={c.reduced}
      active={c.revealed}
    />
  );
}

function PanelBody({ c, started, onOpen }: { c: Ctx; started: boolean; onOpen: () => void }) {
  const has = (key: string) => c.scene.slots.some((s) => s.key === key);
  switch (c.scene.type) {
    case 'Cover':
      return <CoverPanel c={c} started={started} onOpen={onOpen} />;
    case 'Quote':
      return <VersePanel c={c} />;
    case 'Letter':
      return <InvitePanel c={c} />;
    case 'TextReveal':
      return has('program') ? <ProgramPanel c={c} /> : <SaveDatePanel c={c} />;
    case 'Countdown':
      return <CountdownPanel c={c} />;
    case 'Venue':
      return <VenuePanel c={c} />;
    case 'Rsvp':
      return <RsvpPanel c={c} />;
    case 'Finale':
      return <ThankYouPanel c={c} />;
    default:
      return <Fallback c={c} />;
  }
}

/* ───────────────────────────────── a panel ──────────────────────────────── */

function Panel({
  scene,
  step,
  experience,
  reduced,
  embedded,
  address,
  started,
  onOpen,
  onSeen,
}: {
  scene: SceneDef;
  step: BoundStep;
  experience: BoundExperience;
  reduced: boolean;
  embedded: boolean;
  address: string;
  started: boolean;
  onOpen: () => void;
  onSeen: (id: string) => void;
}) {
  const ref = React.useRef<HTMLElement>(null);
  const inView = useInView(ref, { amount: 0.3 });
  const [revealed, setRevealed] = React.useState(false);
  const onSeenRef = React.useRef(onSeen);
  onSeenRef.current = onSeen;
  React.useEffect(() => {
    if (!inView) return;
    setRevealed(true);
    onSeenRef.current(step.templateStepId);
  }, [inView, step.templateStepId]);

  const style: Partial<NonNullable<SceneDef['style']>> = scene.style ?? {};
  const ink = style.headingColor ?? C.teal;
  const dark = /^#[0-9a-f]{6}$/i.test(ink) && hexLuminance(ink) > 0.5;
  const image = scene.background?.type === 'image' ? scene.background.imageUrl : undefined;
  const tone = scene.background?.colors?.[0] ?? (dark ? '#0F6470' : C.paper);
  const theme = experience.theme;
  const nameFont = cssFamily(style.headingFont ?? theme.fontHeading);

  const c: Ctx = {
    scene,
    step,
    experience,
    ar: experience.direction === 'rtl',
    dark,
    ink,
    soft: style.bodyColor && dark ? style.bodyColor : C.tealSoft,
    key: dark ? C.goldLight : C.tealKey,
    nameFont,
    revealed: revealed || reduced,
    reduced,
    embedded,
    address,
  };

  // Text on the side away from the flowers, which fill about 45% of the art.
  const pos = scene.type === 'Cover' ? 'cover' : (style.textPosition ?? 'center');
  const pad =
    pos === 'top'
      ? 'pt-[calc(var(--bl-h)*0.1)] pb-[calc(var(--bl-h)*0.46)] justify-start'
      : pos === 'bottom'
        ? 'pt-[calc(var(--bl-h)*0.46)] pb-[calc(var(--bl-h)*0.08)] justify-end'
        : pos === 'cover'
          ? ''
          : 'py-[calc(var(--bl-h)*0.1)] justify-center';

  return (
    <section
      ref={ref}
      data-scene={step.templateStepId}
      className="relative flex w-full flex-col overflow-hidden"
      style={{
        minHeight: 'var(--bl-h)',
        background: tone,
        backgroundImage: image ? `url(${image})` : undefined,
        backgroundRepeat: 'no-repeat',
        // One screen of art, pinned to the flowers' side; a taller section
        // continues in the art's edge colour instead of scaling the flowers up.
        ...(pos === 'top' || pos === 'bottom'
          ? {
              backgroundSize: 'max(100%, calc(var(--bl-h) * 0.5584)) auto',
              backgroundPosition: pos === 'bottom' ? 'center top' : 'center bottom',
            }
          : { backgroundSize: 'cover', backgroundPosition: 'center' }),
        containerType: 'inline-size',
      }}
    >
      {pos === 'cover' ? (
        <div className="absolute inset-0">
          <PanelBody c={c} started={started} onOpen={onOpen} />
        </div>
      ) : (
        <div className={`relative flex flex-1 flex-col items-center ${pad}`}>
          <div className="w-[min(88%,400px)]">
            <PanelBody c={c} started={started} onOpen={onOpen} />
          </div>
        </div>
      )}
    </section>
  );
}

/* ───────────────────────────────── the player ───────────────────────────── */

export default function BloomPlayer({
  experience: given,
  startPaused = true,
  startAtStepId,
  onComplete,
  embedded = false,
  soundtrack = true,
}: PlayerProps) {
  const experience = React.useMemo(() => withLocaleFonts(given), [given]);
  const reduced = usePrefersReducedMotion();
  const rootRef = React.useRef<HTMLDivElement>(null);
  const [started, setStarted] = React.useState(!startPaused);
  const ar = experience.locale === 'ar';
  const theme = experience.theme;
  const fields = React.useMemo(() => experience.fields ?? {}, [experience.fields]);

  const sections = React.useMemo(() => {
    const out: Array<{ scene: SceneDef; step: BoundStep }> = [];
    for (const step of [...experience.steps].sort((a, b) => a.orderIndex - b.orderIndex)) {
      const scene = sceneForStep(experience, step);
      if (!scene) continue;
      // The panel art is not content: a section the sender emptied still goes.
      const bare = { ...scene, background: undefined } as SceneDef;
      if (isSectionVisible(bare, step, fields)) out.push({ scene, step });
    }
    return out;
  }, [experience, fields]);

  const address = React.useMemo(() => {
    const v = sections.find((s) => s.scene.type === 'Venue');
    return v ? text({ scene: v.scene, step: v.step, experience }, 'address') : '';
  }, [sections, experience]);

  const fontHref = React.useMemo(() => {
    const f = new Set<string | undefined>([
      theme.fontHeading,
      theme.fontBody,
      'Marcellus',
      'Playfair Display',
      'Amiri',
    ]);
    for (const s of experience.scenes) if (s.style?.headingFont) f.add(s.style.headingFont);
    return googleFontsHref(Array.from(f));
  }, [theme.fontHeading, theme.fontBody, experience.scenes]);

  // Closed: the cover is the gate, so nothing scrolls until the guest taps.
  React.useEffect(() => {
    if (embedded || started) return;
    const html = document.documentElement;
    const prev = html.style.overflow;
    html.style.overflow = 'hidden';
    window.scrollTo(0, 0);
    return () => {
      html.style.overflow = prev;
    };
  }, [embedded, started]);

  const scrollToIndex = React.useCallback(
    (i: number, behavior: ScrollBehavior) => {
      const root = rootRef.current;
      const el = root?.querySelectorAll<HTMLElement>('[data-scene]')[i];
      if (!root || !el) return;
      if (embedded) {
        const top = el.getBoundingClientRect().top - root.getBoundingClientRect().top + root.scrollTop;
        root.scrollTo?.({ top, behavior });
      } else {
        el.scrollIntoView({ behavior, block: 'start' });
      }
    },
    [embedded],
  );

  const open = () => {
    if (started) return;
    setStarted(true);
    if (!embedded) track('card_opened');
    // Let the page unlock first, then glide to the next panel.
    window.setTimeout(() => scrollToIndex(1, reduced ? 'auto' : 'smooth'), 350);
  };

  // The builder jumps to whichever section is being edited.
  React.useEffect(() => {
    if (!started || !startAtStepId) return;
    const i = sections.findIndex((s) => s.step.templateStepId === startAtStepId);
    if (i >= 0) scrollToIndex(i, reduced ? 'auto' : 'smooth');
  }, [started, startAtStepId, sections, scrollToIndex, reduced]);

  const [active, setActive] = React.useState(0);
  const completed = React.useRef(false);
  const onCompleteRef = React.useRef(onComplete);
  onCompleteRef.current = onComplete;
  const lastId = sections[sections.length - 1]?.step.templateStepId;
  const onSeen = React.useCallback(
    (id: string) => {
      const i = sections.findIndex((s) => s.step.templateStepId === id);
      if (i >= 0) setActive(i);
      if (id === lastId && !completed.current) {
        completed.current = true;
        onCompleteRef.current?.();
      }
    },
    [sections, lastId],
  );
  const progress = ((active + 1) / Math.max(1, sections.length)) * 100;

  return (
    <div
      ref={rootRef}
      dir={experience.direction}
      className={
        embedded
          ? `relative h-full w-full overflow-x-clip ${started ? 'overflow-y-auto' : 'overflow-y-hidden'}`
          : 'relative min-h-[100dvh] w-full overflow-x-clip'
      }
      style={{
        background: C.teal,
        fontFamily: bodyFamily(theme.fontBody),
        ...(embedded ? { containerType: 'size' as const } : {}),
        ['--bl-h' as string]: embedded ? '100cqh' : '100svh',
      }}
      data-testid="player-root"
      data-stage="bloom"
    >
      {fontHref ? <link rel="stylesheet" href={fontHref} /> : null}
      <style>{BLOOM_CSS}</style>

      {started ? (
        <div
          aria-hidden
          className={`pointer-events-none ${embedded ? 'sticky' : 'fixed'} start-0 top-0 z-20 h-0 w-full`}
        >
          <div
            className="h-[2px] transition-[width] duration-300"
            style={{ width: `${progress}%`, background: C.gold }}
          />
        </div>
      ) : null}

      {/* A phone-shaped column; on a wide screen the turquoise shows either side. */}
      <div className="relative mx-auto w-full max-w-[480px] whitespace-pre-line shadow-[0_0_80px_rgba(0,0,0,0.35)]">
        {sections.map(({ scene, step }) => (
          <Panel
            key={step.templateStepId}
            scene={scene}
            step={step}
            experience={experience}
            reduced={reduced}
            embedded={embedded}
            address={address}
            started={started}
            onOpen={open}
            onSeen={onSeen}
          />
        ))}
      </div>

      {!soundtrack ? null : embedded ? (
        <div className="pointer-events-none sticky bottom-0 z-30 h-0">
          <Soundtrack
            music={theme.music}
            src={experience.musicUrl}
            started={started}
            label={ar ? 'الموسيقى' : 'Music'}
            className="pointer-events-auto absolute bottom-token-4 end-token-4"
          />
        </div>
      ) : (
        <Soundtrack
          music={theme.music}
          src={experience.musicUrl}
          started={started}
          label={ar ? 'الموسيقى' : 'Music'}
          className="fixed bottom-token-4 end-token-4"
        />
      )}
    </div>
  );
}
