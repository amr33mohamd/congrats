import React from "react";
import {
  AbsoluteFill,
  Audio,
  Easing,
  OffthreadVideo,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { brand, fontStackAr } from "../brand";
import { Logomark } from "../components/Logo";
import { HandGraphic, TapRipple } from "../components/Hand";
import { Bubble, CHAT, LinkPreview, StatusBar, popIn } from "./WhatsappStory";

/**
 * "الدعوة اللي بتتفتح" — 25s click-to-Messenger ad built from the research
 * brief (reports/Congrats market and video ads.md):
 *   0–3s   hook: link arrives in WhatsApp, a hand taps it, the invitation opens
 *   3–5s   the guest's own name on it (answers "it's just a group message")
 *   5–8s   price: 79 EGP
 *   8–11s  date + live countdown
 *   11–14s venue + map in one tap
 *   14–17s RSVP lands on WhatsApp
 *   17–21s five designs, "see it free before you pay"
 *   21–25s end card: message us / we make it for you
 *
 * Every screen is a real recording of the live preview pages; names are the
 * designs' built-in samples, and a "عرض توضيحي" label stays on screen.
 * All text keeps inside Reels' safe zone (y 270–1248, x 80–1000).
 */

const S = 0.7; // phone contents are laid out at 800×1600 and scaled down
const IN_W = 800;
const IN_H = 1600;
const PHONE_X = (1080 - IN_W * S) / 2;
const PHONE_Y = 530;
const BROWSER_TOP = 132;
const OFF = 1950;

export const PERFECT_AD_FRAMES = 750;

const B = {
  hook: [0, 90],
  name: [90, 150],
  price: [150, 240],
  count: [240, 324],
  map: [324, 420],
  rsvp: [420, 510],
  montage: [510, 630],
  end: [630, 750],
} as const;

const TAP_LINK = 40;
const BROWSER_IN = 44;
const TAP_OPEN = 64; // recording opens the card at 1.8s; clip starts at 1.2s on frame 46
const SWIPE_COUNT = { at: 240, dur: 36 };
const SWIPE_MAP = { at: 324, dur: 39 };
const TAP_MAP = 378;
const TAP_SEND = 462;
const PRESSES = [TAP_LINK, TAP_OPEN, TAP_MAP, TAP_SEND];

const MSG1 = "دعوة فرح عمر ونور 💍 مستنيينك!";
const RSVP = "هحضر إن شاء الله 🤍 ألف مبروك!";
const LINK = {
  cover: "rec/invitation-ivory-arch-ar.jpg",
  linkTitle: "عمر & نور يتشرّفان بدعوتكم 💍",
  linkSub: "افتحي الدعوة… معمولة مخصوص ليكي",
  linkPath: "/ar/p/omar-nour",
};
const MONTAGE = ["tarab-velvet", "qasr-gold", "baroque-noir", "blue-porcelain", "sage-garden"];

// ── Hand path (phone-content coordinates) ───────────────────────────────────
type Key = { f: number; x: number; y: number };
const hold = (p: number, x: number, y: number): Key[] => [
  { f: p - 5, x, y },
  { f: p + 5, x, y },
];
const swipe = ({ at, dur }: { at: number; dur: number }): Key[] => [
  { f: at - 12, x: 420, y: 1330 },
  { f: at, x: 420, y: 1310 },
  { f: at + dur, x: 420, y: 720 },
];
const KEYS: Key[] = [
  { f: 0, x: 560, y: OFF },
  { f: 16, x: 560, y: OFF },
  ...hold(TAP_LINK, 330, 1150),
  ...hold(TAP_OPEN, 400, BROWSER_TOP + 0.655 * IN_H),
  { f: 86, x: 640, y: OFF },
  { f: 226, x: 600, y: OFF },
  ...swipe(SWIPE_COUNT),
  { f: 292, x: 640, y: OFF },
  { f: 310, x: 600, y: OFF },
  ...swipe(SWIPE_MAP),
  ...hold(TAP_MAP, 400, BROWSER_TOP + 0.45 * IN_H),
  { f: 404, x: 640, y: OFF },
  { f: 440, x: 560, y: OFF },
  ...hold(TAP_SEND, 736, 1526),
  { f: 492, x: 700, y: OFF },
  { f: PERFECT_AD_FRAMES, x: 700, y: OFF },
];
const ease = Easing.bezier(0.45, 0, 0.25, 1);
const handAt = (f: number) => {
  let i = KEYS.findIndex((k) => k.f > f);
  if (i <= 0) i = i === 0 ? 1 : KEYS.length - 1;
  const a = KEYS[i - 1];
  const b = KEYS[i];
  const k = ease(Math.min(1, Math.max(0, (f - a.f) / Math.max(1, b.f - a.f))));
  return { x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k };
};

const Hand: React.FC = () => {
  const f = useCurrentFrame();
  const { x, y } = handAt(f);
  if (y >= OFF - 1) return null;
  const press = PRESSES.reduce(
    (m, p) => Math.max(m, interpolate(f, [p - 4, p, p + 6], [0, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })),
    0,
  );
  const dragging = [SWIPE_COUNT, SWIPE_MAP].some(({ at, dur }) => f >= at && f <= at + dur);
  const ripple = PRESSES.find((p) => f >= p && f < p + 18);
  return (
    <>
      {ripple !== undefined ? <TapRipple x={x} y={y} t={(f - ripple) / 18} /> : null}
      <HandGraphic x={x} y={y} press={press + (dragging ? 0.5 : 0)} />
    </>
  );
};

// ── Phone screens ───────────────────────────────────────────────────────────
const ChatScreen: React.FC<{ msgs: { at: number; side: "in" | "out"; node: React.ReactNode; pad?: number; readAt?: number }[]; draft?: string }> = ({
  msgs,
  draft,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ background: CHAT.wall }}>
      <div style={{ background: CHAT.header }}>
        <StatusBar dark />
        <div style={{ height: 112, display: "flex", alignItems: "center", gap: 18, padding: "0 26px", direction: "ltr", color: "#fff" }}>
          <svg width="30" height="30" viewBox="0 0 24 24">
            <path d="M15 4l-8 8 8 8" stroke="#fff" strokeWidth="2.6" fill="none" strokeLinecap="round" />
          </svg>
          <div style={{ width: 76, height: 76, borderRadius: 38, background: "linear-gradient(135deg, #7FA7E8, #2F5BA8)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: fontStackAr, fontWeight: 800, fontSize: 36 }}>
            ع
          </div>
          <div style={{ fontFamily: fontStackAr, direction: "rtl", textAlign: "left", flex: 1 }}>
            <div style={{ fontSize: 34, fontWeight: 700, lineHeight: 1.2 }}>عمر 💍</div>
            <div style={{ fontSize: 22, opacity: 0.85 }}>متصل الآن</div>
          </div>
        </div>
      </div>
      <div style={{ position: "absolute", left: 24, right: 24, bottom: 130 }}>
        {msgs.map((m, i) => (
          <Bubble key={i} side={m.side} show={popIn(frame, m.at, fps)} time="8:41 PM" read={m.readAt !== undefined && frame >= m.readAt} pad={m.pad}>
            {m.node}
          </Bubble>
        ))}
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 120, display: "flex", alignItems: "center", gap: 14, padding: "0 18px 14px", direction: "ltr" }}>
        <div style={{ flex: 1, height: 84, borderRadius: 42, background: "#fff", display: "flex", alignItems: "center", padding: "0 30px", fontFamily: fontStackAr, fontSize: 30, color: draft ? "#111B21" : "#8696A0", direction: "rtl", whiteSpace: "nowrap", overflow: "hidden" }}>
          {draft || "اكتب رسالة"}
        </div>
        <div style={{ width: 84, height: 84, borderRadius: 42, background: CHAT.header, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="38" height="38" viewBox="0 0 24 24">
            <path d="M3 20l18-8L3 4v6l12 2-12 2z" fill="#fff" />
          </svg>
        </div>
      </div>
    </AbsoluteFill>
  );
};

/** Browser chrome + a slice of a recording starting at `from` seconds. */
const Browser: React.FC<{ src: string; from: number }> = ({ src, from }) => (
  <AbsoluteFill style={{ background: "#0B1226" }}>
    <div style={{ background: "#F7F7F7", position: "relative", zIndex: 2, borderBottom: "1px solid #ddd" }}>
      <StatusBar />
      <div style={{ height: 78, display: "flex", alignItems: "center", padding: "0 26px 12px" }}>
        <div style={{ flex: 1, height: 60, borderRadius: 30, background: "#E9E9EB", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Poppins, sans-serif", fontSize: 25, color: "#333" }}>
          🔒 congrats-eta.vercel.app
        </div>
      </div>
    </div>
    <div style={{ position: "absolute", top: BROWSER_TOP, left: 0, width: IN_W, height: IN_H - BROWSER_TOP, overflow: "hidden" }}>
      <OffthreadVideo src={staticFile(src)} muted startFrom={Math.round(from * 30)} style={{ width: IN_W, height: IN_W * 2, display: "block" }} />
    </div>
  </AbsoluteFill>
);

const PhoneContents: React.FC = () => {
  const frame = useCurrentFrame();
  const browserY = interpolate(frame, [BROWSER_IN, BROWSER_IN + 9], [IN_H, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.22, 1, 0.36, 1),
  });
  const hookMsgs = [
    { at: 4, side: "in" as const, node: MSG1 },
    { at: 12, side: "in" as const, node: <LinkPreview copy={LINK} />, pad: 10 },
  ];
  return (
    <AbsoluteFill>
      <Sequence durationInFrames={B.hook[1]}>
        <ChatScreen msgs={hookMsgs} />
      </Sequence>
      <Sequence from={BROWSER_IN} durationInFrames={B.hook[1] - BROWSER_IN}>
        <AbsoluteFill style={{ transform: `translateY(${browserY}px)` }}>
          <Sequence from={2} layout="none">
            <Browser src="rec/hand-invite.mp4" from={1.2} />
          </Sequence>
        </AbsoluteFill>
      </Sequence>
      <Sequence from={B.name[0]} durationInFrames={B.name[1] - B.name[0]}>
        <Browser src="rec/hand-invite.mp4" from={6.6} />
      </Sequence>
      <Sequence from={B.price[0]} durationInFrames={B.price[1] - B.price[0]}>
        <Browser src="rec/hand-invite.mp4" from={8.6} />
      </Sequence>
      <Sequence from={B.count[0]} durationInFrames={B.map[1] - B.count[0]}>
        <Browser src="rec/hand-invite.mp4" from={12.0} />
      </Sequence>
      <Sequence from={B.rsvp[0]} durationInFrames={B.rsvp[1] - B.rsvp[0]}>
        <RsvpChat />
      </Sequence>
      {MONTAGE.map((slug, i) => (
        <Sequence key={slug} from={B.montage[0] + i * 24} durationInFrames={24}>
          <Browser src={`rec/invitation-${slug}-ar.mp4`} from={4.0} />
        </Sequence>
      ))}
      <Hand />
      <div style={{ position: "absolute", top: 14, left: IN_W / 2 - 90, width: 180, height: 46, borderRadius: 23, background: "#000", zIndex: 12 }} />
    </AbsoluteFill>
  );
};

const RsvpChat: React.FC = () => {
  const f = useCurrentFrame(); // local to the RSVP beat
  const sent = TAP_SEND - B.rsvp[0];
  return (
    <ChatScreen
      msgs={[
        { at: -100, side: "in", node: MSG1 },
        { at: -100, side: "in", node: <LinkPreview copy={LINK} />, pad: 10 },
        { at: sent + 4, side: "out", node: RSVP, readAt: sent + 30 },
      ]}
      draft={f >= 3 && f < sent ? RSVP : undefined}
    />
  );
};

// ── Overlays ────────────────────────────────────────────────────────────────
const HEADLINES: { at: readonly [number, number]; text: string }[] = [
  { at: [0, 90], text: "دي مش صورة كارت… دي دعوة بتتفتح!" },
  { at: B.name, text: "باسم كل ضيف… مش رسالة جماعية" },
  { at: B.price, text: "دعوة كاملة بـ ٧٩ جنيه بس" },
  { at: B.count, text: "الميعاد وعدّاد لحد يوم الفرح ⏳" },
  { at: B.map, text: "اللوكيشن بضغطة… محدش هيتوه 📍" },
  { at: B.rsvp, text: "والضيف يأكد حضوره على واتساب ✅" },
  { at: B.montage, text: "اختار تصميمك… وشوفه ببلاش قبل ما تدفع" },
];

const Headline: React.FC = () => {
  const f = useCurrentFrame();
  const h = HEADLINES.find((k) => f >= k.at[0] && f < k.at[1]);
  if (!h) return null;
  const local = f - h.at[0];
  const len = h.at[1] - h.at[0];
  const a = interpolate(local, [0, 6, len - 5, len], [0, 1, 1, h.at[1] === B.montage[1] ? 0 : 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const pop = spring({ frame: local, fps: 30, config: { damping: 14, stiffness: 220, mass: 0.6 } });
  return (
    <div style={{ position: "absolute", top: 318, left: 80, right: 80, height: 196, display: "flex", alignItems: "center", justifyContent: "center", opacity: a }}>
      <div
        style={{
          direction: "rtl",
          textAlign: "center",
          fontFamily: fontStackAr,
          fontWeight: 800,
          fontSize: 58,
          lineHeight: 1.3,
          color: "#fff",
          background: "rgba(16,8,12,0.55)",
          borderRadius: 28,
          padding: "14px 30px",
          transform: `scale(${0.88 + pop * 0.12})`,
          maxWidth: 900,
        }}
      >
        {h.text}
      </div>
    </div>
  );
};

const PriceChip: React.FC = () => {
  const f = useCurrentFrame();
  const s = spring({ frame: f - 10, fps: 30, config: { damping: 11, stiffness: 160 } });
  return (
    <div style={{ position: "absolute", top: 1010, left: 0, right: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 14, zIndex: 20 }}>
      <div
        style={{
          transform: `scale(${s}) rotate(${(1 - s) * -8}deg)`,
          background: `linear-gradient(135deg, ${brand.goldSoft}, ${brand.gold})`,
          color: "#2a1a05",
          fontFamily: fontStackAr,
          fontWeight: 900,
          fontSize: 92,
          padding: "10px 54px 18px",
          borderRadius: 999,
          boxShadow: "0 18px 40px rgba(0,0,0,0.45)",
          direction: "rtl",
        }}
      >
        ٧٩ جنيه
      </div>
      <div style={{ opacity: interpolate(f, [18, 28], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }), fontFamily: fontStackAr, fontWeight: 700, fontSize: 38, color: "#fff", background: "rgba(16,8,12,0.6)", padding: "8px 26px", borderRadius: 999, direction: "rtl" }}>
        أرخص من طباعة الكروت 💸
      </div>
    </div>
  );
};

const DemoLabel: React.FC = () => (
  <div style={{ position: "absolute", top: 278, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
    <span style={{ fontFamily: fontStackAr, fontSize: 24, color: "rgba(255,255,255,0.75)", border: "1px solid rgba(255,255,255,0.35)", borderRadius: 999, padding: "2px 16px", direction: "rtl" }}>
      عرض توضيحي
    </span>
  </div>
);

const EndCard: React.FC = () => {
  const f = useCurrentFrame();
  const s = (d: number) => spring({ frame: f - d, fps: 30, config: { damping: 15, stiffness: 150 } });
  const bubble = "عايز أعمل دعوة فرح 💍";
  const typed = [...bubble].slice(0, Math.floor(interpolate(f, [26, 54], [0, [...bubble].length], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }))).join("");
  const handY = 1130 + Math.sin(f / 5) * 14;
  return (
    <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 35%, #4A1A2C 0%, #160A10 75%)", opacity: interpolate(f, [0, 8], [0, 1], { extrapolateRight: "clamp" }) }}>
      <div style={{ position: "absolute", top: 330, left: 0, right: 0, display: "flex", justifyContent: "center", transform: `scale(${s(2)})` }}>
        <Logomark size={130} />
      </div>
      <div style={{ position: "absolute", top: 480, left: 80, right: 80, textAlign: "center", direction: "rtl", fontFamily: fontStackAr, fontWeight: 900, fontSize: 70, lineHeight: 1.25, color: "#fff", opacity: s(8) }}>
        ابعتلنا رسالة…
        <br />
        <span style={{ color: brand.goldSoft }}>وإحنا نعملهالك</span>
      </div>
      {/* Messenger-style bubble (no third-party logo) */}
      <div style={{ position: "absolute", top: 720, left: 0, right: 0, display: "flex", justifyContent: "center", opacity: s(20) }}>
        <div style={{ background: "linear-gradient(135deg, #3C8CFF, #A33BFF)", color: "#fff", fontFamily: fontStackAr, fontSize: 46, fontWeight: 700, padding: "22px 40px", borderRadius: 44, borderBottomRightRadius: 10, direction: "rtl", minWidth: 120, minHeight: 64, boxShadow: "0 14px 36px rgba(0,0,0,0.4)" }}>
          {typed || "…"}
        </div>
      </div>
      <div style={{ position: "absolute", top: 880, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 18, direction: "rtl", opacity: s(36) }}>
        {["٧٩ جنيه", "الدفع إنستاباي", "جاهزة في دقايق"].map((t) => (
          <span key={t} style={{ fontFamily: fontStackAr, fontWeight: 700, fontSize: 34, color: "#2a1a05", background: `linear-gradient(135deg, ${brand.goldSoft}, ${brand.gold})`, padding: "8px 24px", borderRadius: 999 }}>
            {t}
          </span>
        ))}
      </div>
      <div style={{ position: "absolute", top: 960, left: 80, right: 80, textAlign: "center", fontFamily: fontStackAr, fontSize: 32, color: "rgba(255,255,255,0.8)", direction: "rtl", opacity: s(44) }}>
        أو اعملها بنفسك: <span style={{ fontFamily: "Poppins, sans-serif", direction: "ltr", unicodeBidi: "isolate" }}>congrats-eta.vercel.app</span>
      </div>
      <div style={{ position: "absolute", inset: 0, opacity: s(50) }}>
        <HandGraphic x={540} y={handY + 160} variant="down" size={0.95} />
      </div>
    </AbsoluteFill>
  );
};

// ── Composition ─────────────────────────────────────────────────────────────
const Sfx: React.FC<{ at: number; src: string; volume?: number }> = ({ at, src, volume = 1 }) => (
  <Sequence from={at} durationInFrames={30}>
    <Audio src={staticFile(src)} volume={volume} />
  </Sequence>
);

export const PerfectAd: React.FC = () => {
  const frame = useCurrentFrame();
  const enter = spring({ frame, fps: 30, config: { damping: 20, stiffness: 160 } });
  const oud = (f: number) => interpolate(f, [0, 6, 222, 250], [0, 0.6, 0.6, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const upbeat = (f: number) => interpolate(f, [0, 20, 480, 500], [0, 0.5, 0.5, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const inEnd = frame >= B.end[0];

  return (
    <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 30%, #5A1F33 0%, #1A0B12 80%)" }}>
      <Audio src={staticFile("audio/oud-romantic.mp3")} volume={oud} />
      <Sequence from={225}>
        <Audio src={staticFile("audio/triumphant-soft.mp3")} volume={upbeat} />
      </Sequence>
      <Sfx at={4} src="sfx/ping.wav" />
      <Sfx at={12} src="sfx/ping.wav" volume={0.7} />
      {PRESSES.map((p) => (
        <Sfx key={p} at={p} src="sfx/tap.wav" volume={0.8} />
      ))}
      <Sfx at={BROWSER_IN} src="sfx/whoosh.wav" />
      <Sfx at={B.rsvp[0]} src="sfx/whoosh.wav" volume={0.7} />
      <Sfx at={TAP_SEND + 2} src="sfx/send.wav" />
      {MONTAGE.map((_, i) => (
        <Sfx key={i} at={B.montage[0] + i * 24} src="sfx/whoosh.wav" volume={0.35} />
      ))}
      <Sfx at={B.end[0] + 56} src="sfx/send.wav" />

      {!inEnd ? (
        <>
          <div
            style={{
              position: "absolute",
              left: PHONE_X - 13,
              top: PHONE_Y - 13,
              width: IN_W * S + 26,
              height: IN_H * S + 26,
              borderRadius: 62,
              background: "#0E0E10",
              boxShadow: "0 30px 70px rgba(0,0,0,0.55), inset 0 0 0 2px #2b2b30",
              transform: `translateY(${(1 - enter) * 120}px)`,
            }}
          >
            <div style={{ position: "absolute", left: 13, top: 13, width: IN_W * S, height: IN_H * S, borderRadius: 50, overflow: "hidden", background: "#000" }}>
              <div style={{ width: IN_W, height: IN_H, transform: `scale(${S})`, transformOrigin: "0 0", position: "relative" }}>
                <PhoneContents />
              </div>
            </div>
          </div>
          <Headline />
          <Sequence from={B.price[0]} durationInFrames={B.price[1] - B.price[0]}>
            <PriceChip />
          </Sequence>
        </>
      ) : null}
      <Sequence from={B.end[0]}>
        <EndCard />
      </Sequence>
      <DemoLabel />
    </AbsoluteFill>
  );
};
