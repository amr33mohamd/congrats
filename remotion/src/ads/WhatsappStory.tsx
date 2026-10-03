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

/**
 * "Story" ad: a friend sends a wedding invitation link in a chat, the guest
 * opens it and scrolls the real invitation (a screen recording of
 * /ar/t/invitation-tarab-velvet-ar), then replies in the chat. Ends on the two
 * ways to get one: make it yourself on the site, or message us and we make it.
 *
 * The chat is a generic messenger look — no third-party logos or trademarks.
 */

// ── Timeline (frames @30fps) ────────────────────────────────────────────────
const T = {
  msg1Typing: 14,
  msg1: 40,
  msg2Typing: 58,
  msg2: 84,
  msg3: 112,
  tapLink: 146,
  browserIn: 160, // browser slides up over the chat
  videoStart: 172,
  tapOpen: 172 + 54, // "افتح الدعوة" is tapped 1.8s into the recording
  browserOut: 736, // back to the chat
  typeStart: 770,
  typeEnd: 838,
  send: 852,
  replyTyping: 878,
  reply: 912,
  end: 965,
  total: 1110,
};

const SCREEN_W = 800;
const SCREEN_H = 1600;
const SCREEN_X = (1080 - SCREEN_W) / 2;
const SCREEN_Y = 236;

const CHAT = {
  header: "#0B5C4F",
  wall: "#EFE7DD",
  inBubble: "#FFFFFF",
  outBubble: "#D9FDD3",
  tick: "#34B7F1",
  meta: "#667781",
};

/** Everything that changes from one design to the next. */
export type StoryCopy = {
  video: string; // recording under public/, e.g. rec/invite.mp4
  cover: string; // link-preview thumbnail under public/
  openTapY: number; // the card's open button, as a fraction of the recording's height
  sender: string; // chat title, e.g. "نور 💍"
  senderInitial: string;
  senderFemale: boolean;
  msg1: string;
  linkTitle: string;
  linkSub: string;
  linkPath: string;
  msg3: string;
  reply: string; // what the recipient types back
  answer: string;
  captions: [string, string, string, string];
};

export const TARAB_COPY: StoryCopy = {
  video: "rec/invitation-tarab-velvet-ar.mp4",
  cover: "rec/invitation-tarab-velvet-ar.jpg",
  openTapY: 0.655,
  sender: "نور 💍",
  senderInitial: "ن",
  senderFemale: true,
  msg1: "ليلى حبيبتي 🤍 فرحي يوم ٢ ديسمبر ولازم تكوني معايا!",
  linkTitle: "دعوة فرح عمر & نور 💍",
  linkSub: "افتح الدعوة… معمولة مخصوص ليك",
  linkPath: "/ar/c/omar-nour",
  msg3: "افتحي الدعوة 👆😍",
  reply: "ألف مبروك يا نور 🤍 أكيد جاية!",
  answer: "مستنياكي يا ليلى 🥰",
  captions: [
    "نور بعتت دعوة فرحها لليلى على واتساب 💌",
    "ليلى فتحت اللينك… دعوة حقيقية بتتحرك ✨",
    "بالعدّاد والصور واللوكيشن على الخريطة 📍",
    "وردّت عليها على طول 💬",
  ],
};

const ease = Easing.bezier(0.22, 1, 0.36, 1);

const popIn = (frame: number, at: number, fps: number) =>
  spring({ frame: frame - at, fps, config: { damping: 16, stiffness: 180, mass: 0.7 } });

// ── Small pieces ────────────────────────────────────────────────────────────
const StatusBar: React.FC<{ dark?: boolean }> = ({ dark }) => {
  const c = dark ? "#fff" : "#111";
  return (
    <div
      style={{
        height: 54,
        padding: "0 34px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        fontFamily: "Poppins, sans-serif",
        fontWeight: 600,
        fontSize: 24,
        color: c,
        direction: "ltr",
      }}
    >
      <span>9:41</span>
      <span style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <span style={{ display: "flex", gap: 3, alignItems: "flex-end" }}>
          {[8, 12, 16, 20].map((h) => (
            <span key={h} style={{ width: 5, height: h, background: c, borderRadius: 2 }} />
          ))}
        </span>
        <span
          style={{
            width: 40,
            height: 20,
            border: `2px solid ${c}`,
            borderRadius: 6,
            padding: 2,
            display: "inline-flex",
          }}
        >
          <span style={{ flex: 1, background: c, borderRadius: 3 }} />
        </span>
      </span>
    </div>
  );
};

const Ticks: React.FC<{ read: boolean }> = ({ read }) => (
  <svg width="26" height="16" viewBox="0 0 26 16" style={{ marginInlineStart: 6 }}>
    <path d="M1 8.5l4.5 4.5L14 3" stroke={read ? CHAT.tick : CHAT.meta} strokeWidth="2.2" fill="none" strokeLinecap="round" />
    <path d="M9 12.5l1 1L19.5 3" stroke={read ? CHAT.tick : CHAT.meta} strokeWidth="2.2" fill="none" strokeLinecap="round" />
  </svg>
);

const Bubble: React.FC<{
  side: "in" | "out";
  show: number; // 0..1 spring
  time: string;
  read?: boolean;
  children: React.ReactNode;
  pad?: number;
}> = ({ side, show, time, read, children, pad = 16 }) => {
  if (show <= 0.001) return null;
  return (
    <div
      style={{
        display: "flex",
        justifyContent: side === "in" ? "flex-start" : "flex-end",
        transform: `translateY(${(1 - show) * 30}px) scale(${0.85 + show * 0.15})`,
        transformOrigin: side === "in" ? "left bottom" : "right bottom",
        opacity: Math.min(1, show * 1.4),
        marginBottom: 14,
      }}
    >
      <div
        style={{
          maxWidth: 560,
          background: side === "in" ? CHAT.inBubble : CHAT.outBubble,
          borderRadius: 22,
          borderTopLeftRadius: side === "in" ? 6 : 22,
          borderTopRightRadius: side === "out" ? 6 : 22,
          padding: pad,
          boxShadow: "0 2px 3px rgba(0,0,0,0.10)",
          fontFamily: fontStackAr,
          fontSize: 33,
          lineHeight: 1.45,
          color: "#111B21",
          direction: "rtl",
        }}
      >
        {children}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            direction: "ltr",
            fontFamily: "Poppins, sans-serif",
            fontSize: 19,
            color: CHAT.meta,
            marginTop: 4,
          }}
        >
          {time}
          {side === "out" ? <Ticks read={!!read} /> : null}
        </div>
      </div>
    </div>
  );
};

const TypingDots: React.FC<{ frame: number }> = ({ frame }) => (
  <div style={{ display: "flex", marginBottom: 14 }}>
    <div
      style={{
        background: CHAT.inBubble,
        borderRadius: 22,
        borderTopLeftRadius: 6,
        padding: "22px 26px",
        display: "flex",
        gap: 10,
        boxShadow: "0 2px 3px rgba(0,0,0,0.10)",
      }}
    >
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          style={{
            width: 14,
            height: 14,
            borderRadius: 7,
            background: "#9AA5AC",
            transform: `translateY(${Math.sin((frame - i * 5) / 4) * 5}px)`,
          }}
        />
      ))}
    </div>
  </div>
);

const LinkPreview: React.FC<{ copy: StoryCopy }> = ({ copy }) => (
  <div style={{ width: 500 }}>
    <div style={{ borderRadius: 14, overflow: "hidden", background: "#F5F6F6", marginBottom: 10 }}>
      <img src={staticFile(copy.cover)} style={{ width: "100%", height: 250, objectFit: "cover", display: "block" }} />
      <div style={{ padding: "12px 16px" }}>
        <div style={{ fontWeight: 800, fontSize: 28 }}>{copy.linkTitle}</div>
        <div style={{ fontSize: 23, color: CHAT.meta }}>{copy.linkSub}</div>
        <div style={{ fontSize: 21, color: CHAT.meta, fontFamily: "Poppins, sans-serif", direction: "ltr", textAlign: "right" }}>
          congrats-eta.vercel.app
        </div>
      </div>
    </div>
    <div style={{ color: "#027EB5", fontSize: 25, fontFamily: "Poppins, sans-serif", direction: "ltr", textAlign: "left" }}>
      congrats-eta.vercel.app{copy.linkPath}
    </div>
  </div>
);

const Tap: React.FC<{ frame: number; at: number; x: number; y: number }> = ({ frame, at, x, y }) => {
  const f = frame - at;
  if (f < -12 || f > 22) return null;
  const finger = interpolate(f, [-12, 0, 8, 22], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const press = interpolate(f, [-4, 0, 6], [1, 0.82, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const ring = interpolate(f, [0, 18], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <>
      <div
        style={{
          position: "absolute",
          left: x - 60,
          top: y - 60,
          width: 120,
          height: 120,
          borderRadius: 60,
          border: "5px solid rgba(255,255,255,0.9)",
          transform: `scale(${0.4 + ring * 1.2})`,
          opacity: f >= 0 ? 1 - ring : 0,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: x - 38,
          top: y - 38,
          width: 76,
          height: 76,
          borderRadius: 38,
          background: "rgba(255,255,255,0.55)",
          border: "3px solid rgba(0,0,0,0.25)",
          boxShadow: "0 6px 18px rgba(0,0,0,0.25)",
          transform: `scale(${press})`,
          opacity: finger,
        }}
      />
    </>
  );
};

// ── Chat screen ─────────────────────────────────────────────────────────────
const ChatScreen: React.FC<{ frame: number; fps: number; copy: StoryCopy }> = ({ frame, fps, copy }) => {
  const REPLY_TEXT = copy.reply;
  const typingIn =
    (frame >= T.msg1Typing && frame < T.msg1) ||
    (frame >= T.msg2Typing && frame < T.msg2) ||
    (frame >= T.replyTyping && frame < T.reply);

  const typed = Math.floor(
    interpolate(frame, [T.typeStart, T.typeEnd], [0, [...REPLY_TEXT].length], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }),
  );
  const draft = frame < T.send ? [...REPLY_TEXT].slice(0, typed).join("") : "";
  const cursorOn = frame >= T.typeStart - 10 && frame < T.send && Math.floor(frame / 12) % 2 === 0;

  return (
    <AbsoluteFill style={{ background: CHAT.wall }}>
      {/* subtle wallpaper doodles */}
      <AbsoluteFill
        style={{
          opacity: 0.07,
          backgroundImage:
            "radial-gradient(circle at 20px 20px, #6b5a48 3px, transparent 4px), radial-gradient(circle at 70px 60px, #6b5a48 2px, transparent 3px)",
          backgroundSize: "100px 100px",
        }}
      />
      <div style={{ background: CHAT.header, position: "relative", zIndex: 2 }}>
        <StatusBar dark />
        <div
          style={{
            height: 112,
            display: "flex",
            alignItems: "center",
            gap: 18,
            padding: "0 26px",
            direction: "ltr",
            color: "#fff",
          }}
        >
          <svg width="30" height="30" viewBox="0 0 24 24">
            <path d="M15 4l-8 8 8 8" stroke="#fff" strokeWidth="2.6" fill="none" strokeLinecap="round" />
          </svg>
          <div
            style={{
              width: 76,
              height: 76,
              borderRadius: 38,
              background: `linear-gradient(135deg, ${brand.roseSoft}, ${brand.roseStrong})`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: fontStackAr,
              fontWeight: 800,
              fontSize: 36,
            }}
          >
            {copy.senderInitial}
          </div>
          <div style={{ fontFamily: fontStackAr, direction: "rtl", textAlign: "left", flex: 1 }}>
            <div style={{ fontSize: 34, fontWeight: 700, lineHeight: 1.2 }}>{copy.sender}</div>
            <div style={{ fontSize: 22, opacity: 0.85 }}>{typingIn ? (copy.senderFemale ? "بتكتب…" : "بيكتب…") : copy.senderFemale ? "متصلة الآن" : "متصل الآن"}</div>
          </div>
        </div>
      </div>

      {/* messages, anchored to the bottom */}
      <div
        style={{
          position: "absolute",
          left: 24,
          right: 24,
          bottom: 130,
        }}
      >
        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginBottom: 22,
            }}
          >
            <span
              style={{
                background: "#FFF5C4",
                color: "#54656F",
                fontFamily: fontStackAr,
                fontSize: 22,
                padding: "6px 18px",
                borderRadius: 12,
              }}
            >
              النهارده
            </span>
          </div>
          <Bubble side="in" show={popIn(frame, T.msg1, fps)} time="9:38 PM">
            {copy.msg1}
          </Bubble>
          <Bubble side="in" show={popIn(frame, T.msg2, fps)} time="9:39 PM" pad={10}>
            <LinkPreview copy={copy} />
          </Bubble>
          <Bubble side="in" show={popIn(frame, T.msg3, fps)} time="9:39 PM">
            {copy.msg3}
          </Bubble>
          <Bubble side="out" show={popIn(frame, T.send, fps)} time="9:41 PM" read={frame > T.send + 18}>
            {REPLY_TEXT}
          </Bubble>
          <Bubble side="in" show={popIn(frame, T.reply, fps)} time="9:41 PM">
            {copy.answer}
          </Bubble>
          {typingIn ? <TypingDots frame={frame} /> : null}
        </div>
      </div>

      {/* input bar */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: 120,
          display: "flex",
          alignItems: "center",
          gap: 14,
          padding: "0 18px 14px",
          direction: "ltr",
        }}
      >
        <div
          style={{
            flex: 1,
            height: 84,
            borderRadius: 42,
            background: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            padding: "0 30px",
            fontFamily: fontStackAr,
            fontSize: 31,
            color: draft ? "#111B21" : "#8696A0",
            direction: "rtl",
            boxShadow: "0 1px 2px rgba(0,0,0,0.08)",
          }}
        >
          <span style={{ flex: 1, textAlign: "right" }}>
            {draft || (cursorOn || frame >= T.typeStart - 10 ? "" : "اكتب رسالة")}
            {cursorOn ? <span style={{ color: CHAT.header }}>|</span> : null}
          </span>
        </div>
        <div
          style={{
            width: 84,
            height: 84,
            borderRadius: 42,
            background: CHAT.header,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg width="38" height="38" viewBox="0 0 24 24">
            <path d="M3 20l18-8L3 4v6l12 2-12 2z" fill="#fff" />
          </svg>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ── Browser screen (the real invitation recording) ─────────────────────────
const BrowserScreen: React.FC<{ video: string }> = ({ video }) => (
  <AbsoluteFill style={{ background: "#F3E9DA" }}>
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
            gap: 10,
            fontFamily: "Poppins, sans-serif",
            fontSize: 25,
            color: "#333",
          }}
        >
          <svg width="18" height="22" viewBox="0 0 18 22">
            <rect x="2" y="9" width="14" height="11" rx="2" fill="#555" />
            <path d="M5 9V6a4 4 0 0 1 8 0v3" stroke="#555" strokeWidth="2.2" fill="none" />
          </svg>
          congrats-eta.vercel.app
        </div>
      </div>
    </div>
    <div style={{ position: "absolute", top: 132, left: 0, width: SCREEN_W, height: SCREEN_H - 132, overflow: "hidden" }}>
      <Sequence from={T.videoStart} layout="none">
        <OffthreadVideo
          src={staticFile(video)}
          muted
          style={{ width: SCREEN_W, height: SCREEN_W * 2, display: "block" }}
        />
      </Sequence>
    </div>
  </AbsoluteFill>
);

// ── Captions above the phone ───────────────────────────────────────────────
const CAPTIONS = [
  { from: 8, to: 160 },
  { from: 175, to: 440 },
  { from: 450, to: 730 },
  { from: 745, to: 955 },
];

const Caption: React.FC<{ frame: number; texts: StoryCopy["captions"] }> = ({ frame, texts }) => {
  const c = CAPTIONS.map((k, i) => ({ ...k, text: texts[i] })).find((k) => frame >= k.from && frame < k.to);
  if (!c) return null;
  const a = interpolate(frame, [c.from, c.from + 12, c.to - 10, c.to], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <div
      style={{
        position: "absolute",
        top: 70,
        left: 40,
        right: 40,
        textAlign: "center",
        direction: "rtl",
        fontFamily: fontStackAr,
        fontWeight: 800,
        fontSize: 52,
        lineHeight: 1.35,
        color: "#FFF6F8",
        textShadow: "0 4px 20px rgba(0,0,0,0.35)",
        opacity: a,
        transform: `translateY(${(1 - a) * 16}px)`,
      }}
    >
      {c.text}
    </div>
  );
};

// ── End card ────────────────────────────────────────────────────────────────
const EndCard: React.FC<{ frame: number; fps: number }> = ({ frame, fps }) => {
  const f = frame - T.end;
  const bg = interpolate(f, [0, 14], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const s = (d: number) => spring({ frame: f - d, fps, config: { damping: 15, stiffness: 140 } });
  const option = (n: number, d: number, title: string, sub: string, icon: string) => (
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
      <div
        style={{
          width: 96,
          height: 96,
          flexShrink: 0,
          borderRadius: 48,
          background: `linear-gradient(135deg, ${brand.rose}, ${brand.roseStrong})`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 48,
        }}
      >
        {icon}
      </div>
      <div style={{ fontFamily: fontStackAr, color: "#FFF6F8" }}>
        <div style={{ fontSize: 26, color: brand.gold, fontWeight: 700 }}>{n === 1 ? "١" : "٢"}</div>
        <div style={{ fontSize: 44, fontWeight: 800, lineHeight: 1.3 }}>{title}</div>
        <div style={{ fontSize: 34, opacity: 0.85, direction: "ltr", textAlign: "right", fontFamily: "Poppins, sans-serif" }}>
          {sub}
        </div>
      </div>
    </div>
  );
  if (f < 0) return null;
  return (
    <AbsoluteFill
      style={{
        opacity: bg,
        background: "radial-gradient(circle at 50% 35%, #4A1A2C 0%, #160A10 75%)",
        alignItems: "center",
        justifyContent: "center",
        gap: 40,
      }}
    >
      <div style={{ transform: `scale(${s(4)})` }}>
        <Logomark size={190} />
      </div>
      <div
        style={{
          fontFamily: fontStackAr,
          fontWeight: 800,
          fontSize: 76,
          color: "#FFF6F8",
          direction: "rtl",
          textAlign: "center",
          lineHeight: 1.3,
          opacity: s(10),
        }}
      >
        عايز دعوة زي دي؟
      </div>
      {option(1, 22, "اعملها بنفسك من الموقع", "congrats-eta.vercel.app", "🌐")}
      {option(2, 34, "أو ابعتلنا ونعملهالك إحنا", "WhatsApp · 01018096938", "💬")}
    </AbsoluteFill>
  );
};

// ── Composition ─────────────────────────────────────────────────────────────
export const WhatsappStory: React.FC<{ copy: StoryCopy }> = ({ copy }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const phoneIn = spring({ frame, fps, config: { damping: 18, stiffness: 120 } });
  const browserY =
    frame < T.browserOut
      ? interpolate(frame, [T.browserIn, T.browserIn + 16], [SCREEN_H, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: ease,
        })
      : interpolate(frame, [T.browserOut, T.browserOut + 16], [0, SCREEN_H], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.in(Easing.cubic),
        });

  const music = (f: number) =>
    interpolate(f, [0, 20, T.total - 40, T.total], [0, 0.55, 0.55, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });

  return (
    <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 30%, #5A1F33 0%, #1A0B12 80%)" }}>
      <Audio src={staticFile("audio/wedding-strings.mp3")} volume={music} />
      <Caption frame={frame} texts={copy.captions} />

      {/* phone */}
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
          transform: `translateY(${(1 - phoneIn) * 200}px)`,
          opacity: phoneIn,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 20,
            top: 20,
            width: SCREEN_W,
            height: SCREEN_H,
            borderRadius: 78,
            overflow: "hidden",
            background: "#000",
          }}
        >
          <ChatScreen frame={frame} fps={fps} copy={copy} />
          {frame >= T.browserIn && frame < T.browserOut + 18 ? (
            <AbsoluteFill style={{ transform: `translateY(${browserY}px)`, zIndex: 3 }}>
              <BrowserScreen video={copy.video} />
            </AbsoluteFill>
          ) : null}
          {/* taps: the link in the chat, then "open invitation" on the site */}
          <Tap frame={frame} at={T.tapLink} x={330} y={1060} />
          <Tap frame={frame} at={T.tapOpen} x={400} y={132 + copy.openTapY * SCREEN_W * 2} />
          <Tap frame={frame} at={T.send - 2} x={736} y={SCREEN_H - 74} />
          {/* dynamic island */}
          <div
            style={{
              position: "absolute",
              top: 14,
              left: SCREEN_W / 2 - 90,
              width: 180,
              height: 46,
              borderRadius: 23,
              background: "#000",
              zIndex: 5,
            }}
          />
        </div>
      </div>

      <EndCard frame={frame} fps={fps} />
    </AbsoluteFill>
  );
};

export const WHATSAPP_STORY_FRAMES = T.total;
