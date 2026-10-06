import React from "react";
import {
  AbsoluteFill,
  Audio,
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
import { Bubble, CHAT, LinkPreview, StatusBar, TypingDots, popIn } from "./WhatsappStory";

/**
 * "How it works" walkthrough: a real screen recording of the purchase flow on
 * a phone (public/rec/purchase-raw.mp4, captured from a local demo server with
 * a test account) — site → design → sign up → fill details → pay → approved →
 * share — then the friend receives it in a chat and opens it.
 *
 * Segments point into the raw recording by second; each plays at its own speed
 * so typing doesn't drag. The wait for payment approval is cut.
 */

const FPS = 30;
const RAW = "rec/purchase-raw.mp4";

type Clip = { kind: "clip"; from: number; to: number; rate: number; caption: string };
type Scene = { kind: "wait" | "send" | "reply" | "end"; frames: number; caption: string };
type Part = Clip | Scene;

const PARTS: Part[] = [
  { kind: "clip", from: 0, to: 16.0, rate: 1.25, caption: "١. افتح الموقع واختار التصميم اللي يعجبك" },
  { kind: "clip", from: 16.0, to: 29.9, rate: 1.8, caption: "٢. اعمل حساب في ثواني" },
  { kind: "clip", from: 29.9, to: 50.7, rate: 1.6, caption: "٣. اكتب الأسامي والميعاد والقاعة… والمعاينة بتتغير قدامك" },
  { kind: "clip", from: 50.7, to: 59.3, rate: 1.3, caption: "٤. راجع دعوتك قبل ما تدفع" },
  { kind: "clip", from: 59.3, to: 73.0, rate: 1.4, caption: "٥. ادفع ٧٩ جنيه بإنستاباي وارفع صورة التحويل" },
  { kind: "wait", frames: 60, caption: "⏱️ بعد دقايق…" },
  { kind: "clip", from: 84.4, to: 93.4, rate: 1.15, caption: "٦. الدعوة جاهزة 🎉 ابعتها على واتساب" },
  { kind: "send", frames: 150, caption: "سلمى بعتت الدعوة لصاحبتها 💌" },
  { kind: "clip", from: 101.3, to: 115.6, rate: 1.15, caption: "منى فتحت الدعوة… باسم العروسين 😍" },
  { kind: "reply", frames: 165, caption: "وردّت على طول 💬" },
  { kind: "end", frames: 165, caption: "" },
];

const lengthOf = (p: Part) =>
  p.kind === "clip" ? Math.round(((p.to - p.from) * FPS) / p.rate) : p.frames;

const TIMELINE = PARTS.reduce<{ part: Part; start: number; len: number }[]>((acc, part) => {
  const prev = acc[acc.length - 1];
  const start = prev ? prev.start + prev.len : 0;
  acc.push({ part, start, len: lengthOf(part) });
  return acc;
}, []);

export const PURCHASE_FLOW_FRAMES = TIMELINE[TIMELINE.length - 1].start + TIMELINE[TIMELINE.length - 1].len;

const SCREEN_W = 800;
const SCREEN_H = 1600;
const SCREEN_X = (1080 - SCREEN_W) / 2;
const SCREEN_Y = 236;
const SITE_BG = "#0d0b0c";

// The recording is 1:2; fit it under the status bar without cropping the
// bottom action bars.
const VIDEO_H = SCREEN_H - 54;
const VIDEO_W = VIDEO_H / 2;

// ── Phone contents ──────────────────────────────────────────────────────────
const ClipScreen: React.FC<{ clip: Clip }> = ({ clip }) => (
  <AbsoluteFill style={{ background: SITE_BG }}>
    <div style={{ background: "#141011" }}>
      <StatusBar dark />
    </div>
    <OffthreadVideo
      src={staticFile(RAW)}
      muted
      startFrom={Math.round(clip.from * FPS)}
      playbackRate={clip.rate}
      style={{
        position: "absolute",
        top: 54,
        left: (SCREEN_W - VIDEO_W) / 2,
        width: VIDEO_W,
        height: VIDEO_H,
      }}
    />
  </AbsoluteFill>
);

const WaitScreen: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: SITE_BG, alignItems: "center", justifyContent: "center", gap: 26 }}>
      <div style={{ fontSize: 120, transform: `rotate(${Math.sin(f / 6) * 12}deg)` }}>⏳</div>
      <div style={{ fontFamily: fontStackAr, fontWeight: 800, fontSize: 44, color: "#FFF6F8", direction: "rtl" }}>
        بنأكد الدفع…
      </div>
      <div style={{ fontFamily: fontStackAr, fontSize: 30, color: "#cbb8bf", direction: "rtl" }}>
        وغالباً بيخلص في دقايق
      </div>
    </AbsoluteFill>
  );
};

type Msg = { at: number; side: "in" | "out"; time: string; node: React.ReactNode; pad?: number };

const ChatScreen: React.FC<{ msgs: Msg[]; typingIn?: [number, number]; title: string; initial: string }> = ({
  msgs,
  typingIn,
  title,
  initial,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const typing = typingIn && frame >= typingIn[0] && frame < typingIn[1];
  return (
    <AbsoluteFill style={{ background: CHAT.wall }}>
      <div style={{ background: CHAT.header }}>
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
              background: `linear-gradient(135deg, ${brand.goldSoft}, ${brand.gold})`,
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
            <div style={{ fontSize: 22, opacity: 0.85 }}>{typing ? "بتكتب…" : "متصلة الآن"}</div>
          </div>
        </div>
      </div>
      <div style={{ position: "absolute", left: 24, right: 24, bottom: 130 }}>
        {msgs.map((m, i) => (
          <Bubble key={i} side={m.side} show={popIn(frame, m.at, fps)} time={m.time} read={frame > m.at + 20} pad={m.pad}>
            {m.node}
          </Bubble>
        ))}
        {typing ? <TypingDots frame={frame} /> : null}
      </div>
      <div style={{ position: "absolute", left: 18, right: 18, bottom: 18, height: 84, borderRadius: 42, background: "#fff" }} />
    </AbsoluteFill>
  );
};

const LINK = {
  cover: "rec/purchase-cover.jpg",
  linkTitle: "أحمد & سلمى يتشرّفان بدعوتكم 💍",
  linkSub: "افتح الدعوة… معمولة مخصوص ليك",
  linkPath: "/ar/p/LoGK6Y",
};

const sentMsgs: Msg[] = [
  { at: 10, side: "out", time: "8:12 PM", node: "منى!! فرحي يوم ١٠ ديسمبر 💍 ودي دعوتي 👇" },
  { at: 40, side: "out", time: "8:12 PM", node: <LinkPreview copy={LINK} />, pad: 10 },
];

const replyMsgs: Msg[] = [
  ...sentMsgs.map((m) => ({ ...m, at: -100 })),
  { at: 30, side: "in", time: "8:14 PM", node: "يا سلمى تحفة 😭🤍 ألف مبروك! أكيد جاية" },
  { at: 72, side: "in", time: "8:14 PM", node: "عملتيها منين دي؟؟ 😍" },
  { at: 112, side: "out", time: "8:15 PM", node: "من congrats-eta.vercel.app في ٥ دقايق 😉" },
];

// ── Frame around everything ─────────────────────────────────────────────────
const Caption: React.FC<{ text: string; len: number }> = ({ text, len }) => {
  const f = useCurrentFrame();
  if (!text) return null;
  const a = interpolate(f, [0, 10, len - 8, len], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
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
        fontSize: 50,
        lineHeight: 1.3,
        color: "#FFF6F8",
        textShadow: "0 4px 20px rgba(0,0,0,0.35)",
        opacity: a,
        transform: `translateY(${(1 - a) * 14}px)`,
      }}
    >
      {text}
    </div>
  );
};

const Phone: React.FC<{ children: React.ReactNode; enter: number }> = ({ children, enter }) => (
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
      transform: `translateY(${(1 - enter) * 200}px)`,
      opacity: enter,
    }}
  >
    <div style={{ position: "absolute", left: 20, top: 20, width: SCREEN_W, height: SCREEN_H, borderRadius: 78, overflow: "hidden", background: "#000" }}>
      {children}
      <div style={{ position: "absolute", top: 14, left: SCREEN_W / 2 - 90, width: 180, height: 46, borderRadius: 23, background: "#000", zIndex: 5 }} />
    </div>
  </div>
);

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
      <div style={{ fontFamily: fontStackAr, fontWeight: 800, fontSize: 72, color: "#FFF6F8", direction: "rtl", textAlign: "center", lineHeight: 1.3, opacity: s(10) }}>
        دعوتك جاهزة في ٥ دقايق
      </div>
      {row(22, "١", "اعملها بنفسك من الموقع", "congrats-eta.vercel.app", "🌐")}
      {row(34, "٢", "أو ابعتلنا ونعملهالك إحنا", "WhatsApp · 01018096938", "💬")}
    </AbsoluteFill>
  );
};

// ── Composition ─────────────────────────────────────────────────────────────
export const PurchaseFlow: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame, fps, config: { damping: 18, stiffness: 120 } });
  const music = (f: number) =>
    interpolate(f, [0, 20, PURCHASE_FLOW_FRAMES - 40, PURCHASE_FLOW_FRAMES], [0, 0.45, 0.45, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });

  return (
    <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 30%, #5A1F33 0%, #1A0B12 80%)" }}>
      <Audio src={staticFile("audio/wedding-strings.mp3")} volume={music} loop />
      {TIMELINE.map(({ part, start, len }, i) => {
        if (part.kind === "end") {
          return (
            <Sequence key={i} from={start} durationInFrames={len}>
              <EndCard />
            </Sequence>
          );
        }
        return (
          <Sequence key={i} from={start} durationInFrames={len}>
            <Caption text={part.caption} len={len} />
            <Phone enter={i === 0 ? enter : 1}>
              {part.kind === "clip" ? <ClipScreen clip={part} /> : null}
              {part.kind === "wait" ? <WaitScreen /> : null}
              {part.kind === "send" ? (
<ChatScreen msgs={sentMsgs} title="منى 💛" initial="م" />
              ) : null}
              {part.kind === "reply" ? <ChatScreen msgs={replyMsgs} typingIn={[4, 30]} title="منى 💛" initial="م" /> : null}
            </Phone>
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
