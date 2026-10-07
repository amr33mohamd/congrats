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
import { Bubble, CHAT, LinkPreview, StatusBar, TypingDots, popIn } from "./WhatsappStory";

/**
 * Omar sends his wedding invitation to Laila on WhatsApp. On Laila's phone a
 * hand comes up from the bottom, taps the link, opens the real invitation
 * (public/rec/hand-invite.mp4, recorded from /ar/t/invitation-ivory-arch-ar),
 * swipes to the date and the venue, then goes back to the chat and replies —
 * and the reply lands on Omar's phone.
 *
 * Swipe and tap frames are taken from the recorder's log so the finger moves
 * exactly when the page does.
 */

const SCREEN_W = 800;
const SCREEN_H = 1600;
const SCREEN_X = (1080 - SCREEN_W) / 2;
const SCREEN_Y = 236;
const BROWSER_TOP = 132;

// ── Timeline (frames @30fps) ────────────────────────────────────────────────
const VIDEO_AT = 330; // recording t=0
const rec = (s: number) => VIDEO_AT + Math.round(s * 30);
const T = {
  type1: [25, 85] as const,
  send1: 100,
  send2: 132,
  read: 210,
  flip1: [230, 260] as const,
  tapLink: 305,
  browserIn: 312,
  tapOpen: rec(1.8),
  swipes: [
    { at: rec(5.4), dur: 36 },
    { at: rec(8.2), dur: 39 },
    { at: rec(12.0), dur: 36 },
    { at: rec(14.8), dur: 39 },
  ],
  tapMap: rec(16.6),
  browserOut: rec(19.5),
  tapInput: 947,
  type2: [955, 1040] as const,
  send3: 1050,
  flip2: [1100, 1130] as const,
  replyTyping: [1135, 1158] as const,
  replyIn: 1158,
  end: 1240,
  total: 1390,
};
export const HAND_STORY_FRAMES = T.total;

const MSG1 = "ليلى! فرحي يوم ٥ ديسمبر ولازم تكوني معانا 🤍";
const REPLY = "ألف مبروك يا عمر 🤍 أكيد جاية! والقاعة عرفتها 📍";

const LINK = {
  cover: "rec/invitation-ivory-arch-ar.jpg",
  linkTitle: "عمر & نور يتشرّفان بدعوتكم 💍",
  linkSub: "افتحي الدعوة… معمولة مخصوص ليكي",
  linkPath: "/ar/p/omar-nour",
};

// ── The hand ────────────────────────────────────────────────────────────────
type Key = { f: number; x: number; y: number };
const OFF = 1950;
const swipeKeys = T.swipes.flatMap(({ at, dur }): Key[] => [
  { f: at - 12, x: 420, y: 1330 },
  { f: at, x: 420, y: 1310 },
  { f: at + dur, x: 420, y: 720 },
  { f: at + dur + 14, x: 640, y: 1660 },
]);
// A tap: arrive a few frames early, hold through the press, then leave.
const hold = (p: number, x: number, y: number): Key[] => [
  { f: p - 5, x, y },
  { f: p + 5, x, y },
];
const OPEN_Y = BROWSER_TOP + 0.655 * SCREEN_H;
const MAP_Y = BROWSER_TOP + 0.45 * SCREEN_H;
const KEYS: Key[] = [
  { f: 0, x: 620, y: OFF },
  { f: 78, x: 640, y: OFF },
  ...hold(T.send1, 736, 1526),
  { f: T.send1 + 14, x: 724, y: 1580 },
  ...hold(T.send2, 736, 1526),
  { f: 158, x: 700, y: OFF },
  { f: 272, x: 520, y: OFF },
  ...hold(T.tapLink, 330, 1150),
  { f: 322, x: 560, y: OFF },
  { f: 360, x: 560, y: OFF },
  ...hold(T.tapOpen, 400, OPEN_Y),
  { f: T.tapOpen + 22, x: 640, y: 1660 },
  ...swipeKeys,
  { f: T.tapMap - 16, x: 640, y: 1660 },
  ...hold(T.tapMap, 400, MAP_Y),
  { f: T.tapMap + 22, x: 640, y: 1660 },
  { f: T.browserOut - 10, x: 640, y: OFF },
  { f: 930, x: 520, y: OFF },
  ...hold(T.tapInput, 420, 1526),
  { f: 966, x: 560, y: 1720 },
  { f: 1036, x: 580, y: 1710 },
  ...hold(T.send3, 736, 1526),
  { f: 1080, x: 700, y: OFF },
  { f: T.total, x: 700, y: OFF },
];
const PRESSES = [T.send1, T.send2, T.tapLink, T.tapOpen, T.tapMap, T.tapInput, T.send3];
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
  const press = PRESSES.reduce((m, p) => Math.max(m, interpolate(f, [p - 4, p, p + 6], [0, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })), 0);
  const dragging = T.swipes.some(({ at, dur }) => f >= at && f <= at + dur);
  const ripple = PRESSES.find((p) => f >= p && f < p + 18);
  return (
    <>
      {ripple !== undefined ? <TapRipple x={x} y={y} t={(f - ripple) / 18} /> : null}
      <HandGraphic x={x} y={y} press={press + (dragging ? 0.5 : 0)} />
    </>
  );
};

// ── Chat ────────────────────────────────────────────────────────────────────
type Msg = { at: number; side: "in" | "out"; time: string; node: React.ReactNode; pad?: number; readAt?: number };

const ChatView: React.FC<{
  title: string;
  initial: string;
  female: boolean;
  msgs: Msg[];
  draft?: { text: string; range: readonly [number, number]; sentAt: number };
  typingIn?: readonly [number, number];
}> = ({ title, initial, female, msgs, draft, typingIn }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const typing = typingIn && frame >= typingIn[0] && frame < typingIn[1];
  let draftText = "";
  if (draft && frame < draft.sentAt) {
    const n = Math.floor(interpolate(frame, draft.range, [0, [...draft.text].length], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
    draftText = [...draft.text].slice(0, n).join("");
  }
  const caret = draft && frame >= draft.range[0] - 8 && frame < draft.sentAt && Math.floor(frame / 12) % 2 === 0;
  return (
    <AbsoluteFill style={{ background: CHAT.wall }}>
      <div style={{ background: CHAT.header, position: "relative", zIndex: 2 }}>
        <StatusBar dark />
        <div style={{ height: 112, display: "flex", alignItems: "center", gap: 18, padding: "0 26px", direction: "ltr", color: "#fff" }}>
          <svg width="30" height="30" viewBox="0 0 24 24">
            <path d="M15 4l-8 8 8 8" stroke="#fff" strokeWidth="2.6" fill="none" strokeLinecap="round" />
          </svg>
          <div
            style={{
              width: 76,
              height: 76,
              borderRadius: 38,
              background: female ? `linear-gradient(135deg, ${brand.roseSoft}, ${brand.roseStrong})` : `linear-gradient(135deg, #7FA7E8, #2F5BA8)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: fontStackAr,
              fontWeight: 800,
              fontSize: 36,
            }}
          >
            {initial}
          </div>
          <div style={{ fontFamily: fontStackAr, direction: "rtl", textAlign: "left", flex: 1 }}>
            <div style={{ fontSize: 34, fontWeight: 700, lineHeight: 1.2 }}>{title}</div>
            <div style={{ fontSize: 22, opacity: 0.85 }}>
              {typing ? (female ? "بتكتب…" : "بيكتب…") : female ? "متصلة الآن" : "متصل الآن"}
            </div>
          </div>
        </div>
      </div>
      <div style={{ position: "absolute", left: 24, right: 24, bottom: 130 }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 22 }}>
          <span style={{ background: "#FFF5C4", color: "#54656F", fontFamily: fontStackAr, fontSize: 22, padding: "6px 18px", borderRadius: 12 }}>
            النهارده
          </span>
        </div>
        {msgs.map((m, i) => (
          <Bubble key={i} side={m.side} show={popIn(frame, m.at, fps)} time={m.time} read={m.readAt !== undefined && frame >= m.readAt} pad={m.pad}>
            {m.node}
          </Bubble>
        ))}
        {typing ? <TypingDots frame={frame} /> : null}
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 120, display: "flex", alignItems: "center", gap: 14, padding: "0 18px 14px", direction: "ltr" }}>
        <div
          style={{
            flex: 1,
            height: 84,
            borderRadius: 42,
            background: "#fff",
            display: "flex",
            alignItems: "center",
            padding: "0 30px",
            fontFamily: fontStackAr,
            fontSize: 30,
            color: draftText ? "#111B21" : "#8696A0",
            direction: "rtl",
            overflow: "hidden",
            whiteSpace: "nowrap",
          }}
        >
          <span style={{ flex: 1, textAlign: "right" }}>
            {draftText || (caret ? "" : "اكتب رسالة")}
            {caret ? <span style={{ color: CHAT.header }}>|</span> : null}
          </span>
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

const BrowserView: React.FC = () => (
  <AbsoluteFill style={{ background: "#0B1226" }}>
    <div style={{ background: "#F7F7F7", position: "relative", zIndex: 2, borderBottom: "1px solid #ddd" }}>
      <StatusBar />
      <div style={{ height: 78, display: "flex", alignItems: "center", padding: "0 26px 12px" }}>
        <div
          style={{
            flex: 1,
            height: 60,
            borderRadius: 30,
            background: "#E9E9EB",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "Poppins, sans-serif",
            fontSize: 25,
            color: "#333",
          }}
        >
          🔒 congrats-eta.vercel.app
        </div>
      </div>
    </div>
    <div style={{ position: "absolute", top: BROWSER_TOP, left: 0, width: SCREEN_W, height: SCREEN_H - BROWSER_TOP, overflow: "hidden" }}>
      <Sequence from={VIDEO_AT} layout="none">
        <OffthreadVideo src={staticFile("rec/hand-invite.mp4")} muted style={{ width: SCREEN_W, height: SCREEN_W * 2, display: "block" }} />
      </Sequence>
    </div>
  </AbsoluteFill>
);

// Omar's side of the conversation.
const omarMsgs = (frame: number): Msg[] => [
  { at: frame < T.flip2[0] ? T.send1 + 4 : -100, side: "out", time: "8:41 PM", node: MSG1, readAt: T.read },
  { at: frame < T.flip2[0] ? T.send2 + 4 : -100, side: "out", time: "8:41 PM", node: <LinkPreview copy={LINK} />, pad: 10, readAt: T.read },
  { at: T.replyIn, side: "in", time: "8:44 PM", node: REPLY },
];
// Laila's side.
const lailaMsgs: Msg[] = [
  { at: -100, side: "in", time: "8:41 PM", node: MSG1 },
  { at: -100, side: "in", time: "8:41 PM", node: <LinkPreview copy={LINK} />, pad: 10 },
  { at: T.send3 + 4, side: "out", time: "8:44 PM", node: REPLY, readAt: T.flip2[1] + 20 },
];

// ── Captions, phone, end card ───────────────────────────────────────────────
const CAPTIONS = [
  { from: 8, to: 228, text: "عمر بعت دعوة فرحه لليلى على واتساب 💌" },
  { from: 262, to: 400, text: "على موبايل ليلى… 📱" },
  { from: 405, to: T.swipes[1].at - 4, text: "فتحت الدعوة ✨" },
  { from: T.swipes[1].at, to: T.swipes[3].at - 4, text: "📅 الميعاد والساعة والعدّ التنازلي" },
  { from: T.swipes[3].at, to: T.browserOut + 6, text: "📍 والمكان على الخريطة" },
  { from: T.browserOut + 10, to: T.flip2[0], text: "وردّت عليه على طول 💬" },
  { from: T.flip2[1], to: T.end - 4, text: "والرد وصل لعمر 🥰" },
];

const Caption: React.FC = () => {
  const f = useCurrentFrame();
  const c = CAPTIONS.find((k) => f >= k.from && f < k.to);
  if (!c) return null;
  const a = interpolate(f, [c.from, c.from + 10, c.to - 8, c.to], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div
      style={{
        position: "absolute",
        top: 50,
        left: 40,
        right: 40,
        height: 170,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        direction: "rtl",
        fontFamily: fontStackAr,
        fontWeight: 800,
        fontSize: 52,
        lineHeight: 1.3,
        color: "#FFF6F8",
        textShadow: "0 4px 20px rgba(0,0,0,0.35)",
        opacity: a,
        transform: `translateY(${(1 - a) * 14}px)`,
      }}
    >
      {c.text}
    </div>
  );
};

const EndCard: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = (d: number) => spring({ frame: f - d, fps, config: { damping: 15, stiffness: 140 } });
  const row = (d: number, n: string, title: string, sub: string, icon: string) => (
    <div
      style={{
        width: 900,
        display: "flex",
        alignItems: "center",
        gap: 28,
        background: "rgba(255,255,255,0.08)",
        border: "2px solid rgba(233,198,103,0.55)",
        borderRadius: 34,
        padding: "34px 40px",
        direction: "rtl",
        opacity: s(d),
        transform: `translateY(${(1 - s(d)) * 40}px)`,
      }}
    >
      <div style={{ width: 96, height: 96, flexShrink: 0, borderRadius: 48, background: `linear-gradient(135deg, ${brand.rose}, ${brand.roseStrong})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 48 }}>
        {icon}
      </div>
      <div style={{ fontFamily: fontStackAr, color: "#FFF6F8" }}>
        <div style={{ fontSize: 26, color: brand.gold, fontWeight: 700 }}>{n}</div>
        <div style={{ fontSize: 44, fontWeight: 800, lineHeight: 1.3 }}>{title}</div>
        <div style={{ fontSize: 34, opacity: 0.85, direction: "ltr", textAlign: "right", fontFamily: "Poppins, sans-serif" }}>{sub}</div>
      </div>
    </div>
  );
  return (
    <AbsoluteFill
      style={{
        opacity: interpolate(f, [0, 14], [0, 1], { extrapolateRight: "clamp" }),
        background: "radial-gradient(circle at 50% 35%, #4A1A2C 0%, #160A10 75%)",
        alignItems: "center",
        justifyContent: "center",
        gap: 40,
      }}
    >
      <div style={{ transform: `scale(${s(4)})` }}>
        <Logomark size={190} />
      </div>
      <div style={{ fontFamily: fontStackAr, fontWeight: 800, fontSize: 76, color: "#FFF6F8", direction: "rtl", textAlign: "center", lineHeight: 1.3, opacity: s(10) }}>
        عايز دعوة زي دي؟
      </div>
      {row(22, "١", "اعملها بنفسك من الموقع", "congrats-eta.vercel.app", "🌐")}
      {row(34, "٢", "أو ابعتلنا ونعملهالك إحنا", "WhatsApp · 01018096938", "💬")}
    </AbsoluteFill>
  );
};

export const HandStory: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame, fps, config: { damping: 18, stiffness: 120 } });

  // Flip the phone between Omar's and Laila's screens.
  const flip = (r: readonly [number, number]) =>
    interpolate(frame, [r[0], (r[0] + r[1]) / 2, r[1]], [0, 90, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic) });
  const angle = frame < 700 ? flip(T.flip1) : flip(T.flip2);
  const mid1 = (T.flip1[0] + T.flip1[1]) / 2;
  const mid2 = (T.flip2[0] + T.flip2[1]) / 2;
  const onLaila = frame >= mid1 && frame < mid2;

  const browserY =
    frame < T.browserOut
      ? interpolate(frame, [T.browserIn, T.browserIn + 16], [SCREEN_H, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.bezier(0.22, 1, 0.36, 1) })
      : interpolate(frame, [T.browserOut, T.browserOut + 16], [0, SCREEN_H], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.in(Easing.cubic) });

  const music = (f: number) =>
    interpolate(f, [0, 20, T.total - 40, T.total], [0, 0.5, 0.5, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 30%, #5A1F33 0%, #1A0B12 80%)" }}>
      <Audio src={staticFile("audio/wedding-strings.mp3")} volume={music} />
      <Caption />
      <div
        style={{
          position: "absolute",
          left: SCREEN_X - 20,
          top: SCREEN_Y - 20,
          width: SCREEN_W + 40,
          height: SCREEN_H + 40,
          borderRadius: 96,
          background: "#0E0E10",
          boxShadow: "0 40px 90px rgba(0,0,0,0.55), inset 0 0 0 3px #2b2b30",
          transform: `perspective(2400px) translateY(${(1 - enter) * 200}px) rotateY(${angle}deg)`,
          opacity: enter,
        }}
      >
        <div style={{ position: "absolute", left: 20, top: 20, width: SCREEN_W, height: SCREEN_H, borderRadius: 78, overflow: "hidden", background: "#000" }}>
          {onLaila ? (
            <>
              <ChatView
                title="عمر 💍"
                initial="ع"
                female={false}
                msgs={lailaMsgs}
                draft={{ text: REPLY, range: T.type2, sentAt: T.send3 }}
              />
              {frame >= T.browserIn && frame < T.browserOut + 18 ? (
                <AbsoluteFill style={{ transform: `translateY(${browserY}px)`, zIndex: 3 }}>
                  <BrowserView />
                </AbsoluteFill>
              ) : null}
            </>
          ) : (
            <ChatView
              title="ليلى 🤍"
              initial="ل"
              female
              msgs={omarMsgs(frame)}
              draft={frame < T.flip1[0] ? { text: MSG1, range: T.type1, sentAt: T.send1 } : undefined}
              typingIn={T.replyTyping}
            />
          )}
          <Hand />
          <div style={{ position: "absolute", top: 14, left: SCREEN_W / 2 - 90, width: 180, height: 46, borderRadius: 23, background: "#000", zIndex: 12 }} />
        </div>
      </div>
      <Sequence from={T.end}>
        <EndCard />
      </Sequence>
    </AbsoluteFill>
  );
};
