import React from "react";
import { AbsoluteFill, Easing, interpolate, random, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { loadFont as loadHead } from "@remotion/google-fonts/FunnelDisplay";
import { loadFont as loadBody } from "@remotion/google-fonts/FunnelSans";
import { loadFont as loadMono } from "@remotion/google-fonts/JetBrainsMono";

export const fonts = {
  head: loadHead("normal", { weights: ["600", "800"], subsets: ["latin"] }).fontFamily,
  body: loadBody("normal", { weights: ["400", "600"], subsets: ["latin"] }).fontFamily,
  mono: loadMono("normal", { weights: ["400", "700"], subsets: ["latin"] }).fontFamily,
};

// The site's dark palette (site/app/globals.css).
export const C = {
  bg: "#0e0a28",
  surface: "#151036",
  raised: "#1d1747",
  line: "#2d2566",
  lineStrong: "#43398a",
  fg: "#ece9ff",
  muted: "#aaa4d6",
  accent: "#b9a5ff",
  cyan: "#6ff3ff",
  violet: "#a98bff",
  pink: "#ff86cf",
  hot: "#ff6fc4",
  moon: "#ffd76e",
  added: "#7ef0b5",
  red: "#ff5c7a",
  lid: "linear-gradient(90deg, #6ff3ff 0%, #a98bff 50%, #ff6fc4 100%)",
};

export const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
export const ease = Easing.bezier(0.16, 1, 0.3, 1);

/** Layout helper: portrait or landscape, and a pick between the two. */
export const useLayout = () => {
  const { width, height } = useVideoConfig();
  const portrait = height > width;
  return { portrait, width, height, pick: <T,>(land: T, port: T) => (portrait ? port : land) };
};

/** 0→1 spring that starts at `at` (frames). */
export const usePop = (at: number, damping = 14) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - at, fps, config: { damping, stiffness: 180, mass: 0.6 } });
};

/** Linear 0→1 progress between two frames, eased. */
export const prog = (frame: number, a: number, b: number) => interpolate(frame, [a, b], [0, 1], { ...clamp, easing: ease });

/** RGB-split text shadow, for glitchy type. */
export const rgb = (d: number) => (d ? `${d}px 0 ${C.hot}, ${-d}px 0 ${C.cyan}` : "none");

/** Deterministic jitter in [-1, 1]. */
export const jit = (seed: string | number) => random(seed) * 2 - 1;

// ---------------------------------------------------------------- background

export const Sky: React.FC<{ intensity?: number }> = ({ intensity = 1 }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const stars = React.useMemo(
    () =>
      new Array(140).fill(0).map((_, i) => ({
        x: random(`x${i}`) * width,
        y: random(`y${i}`) * height,
        r: 0.8 + random(`r${i}`) * 2.2,
        p: random(`p${i}`) * Math.PI * 2,
        s: 0.04 + random(`s${i}`) * 0.08,
      })),
    [width, height],
  );
  return (
    <AbsoluteFill style={{ background: C.bg, overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(${width * 0.7}px ${height * 0.5}px at 80% -5%, rgba(143,107,255,${0.38 * intensity}), transparent 70%),
            radial-gradient(${width * 0.6}px ${height * 0.45}px at 0% 105%, rgba(255,111,196,${0.18 * intensity}), transparent 70%),
            radial-gradient(${width * 0.5}px ${height * 0.4}px at 100% 100%, rgba(111,243,255,${0.12 * intensity}), transparent 70%)`,
        }}
      />
      <svg width={width} height={height} style={{ position: "absolute", inset: 0 }}>
        {stars.map((s, i) => (
          <circle
            key={i}
            cx={s.x}
            cy={(s.y - frame * 0.15 * s.r + height) % height}
            r={s.r}
            fill="#fff"
            opacity={0.25 + 0.55 * (0.5 + 0.5 * Math.sin(frame * s.s + s.p))}
          />
        ))}
      </svg>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at center, transparent 55%, rgba(5,3,20,0.75) 100%)" }} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- the eye

export const LID = "M150 512 Q512 122 874 512 Q512 902 150 512 Z";
export const EYE_VIEWBOX = { x: 110, y: 150, w: 804, h: 600 };

export const Sparkle: React.FC<{ x: number; y: number; r: number; o?: number }> = ({ x, y, r, o = 1 }) => {
  const k = r * 0.22;
  return (
    <path
      d={`M${x} ${y - r} L${x + k} ${y - k} L${x + r} ${y} L${x + k} ${y + k} L${x} ${y + r} L${x - k} ${y + k} L${x - r} ${y} L${x - k} ${y - k} Z`}
      fill="#fff"
      opacity={o}
      style={{ filter: "drop-shadow(0 0 12px rgba(255,255,255,0.9))" }}
    />
  );
};

export const LidGradient: React.FC<{ id?: string }> = ({ id = "lid" }) => (
  <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stopColor={C.cyan} />
    <stop offset="0.5" stopColor={C.violet} />
    <stop offset="1" stopColor={C.hot} />
  </linearGradient>
);

/** The icon's eye: lid draws in, the moon pupil opens, sparkles twinkle. */
export const Eye: React.FC<{
  width: number;
  draw?: number;
  open?: number;
  sparkles?: number;
  glow?: number;
  children?: React.ReactNode;
}> = ({ width, draw = 1, open = 1, sparkles = 1, glow = 1, children }) => {
  const { x, y, w, h } = EYE_VIEWBOX;
  return (
    <svg width={width} height={(width * h) / w} viewBox={`${x} ${y} ${w} ${h}`} fill="none" style={{ overflow: "visible" }}>
      <defs>
        <LidGradient />
        <radialGradient id="moon" cx="0.35" cy="0.3" r="0.9">
          <stop offset="0" stopColor="#fff6d6" />
          <stop offset="1" stopColor={C.moon} />
        </radialGradient>
        <mask id="crescent">
          <circle cx="490" cy="530" r="100" fill="#fff" />
          <circle cx="548" cy="478" r="92" fill="#000" />
        </mask>
      </defs>
      <path d={LID} stroke="url(#lid)" strokeWidth={70} opacity={0.22 * glow * draw} style={{ filter: "blur(22px)" }} />
      <path
        d={LID}
        stroke="url(#lid)"
        strokeWidth={30}
        strokeLinejoin="round"
        pathLength={1}
        strokeDasharray="1 1"
        strokeDashoffset={1 - draw}
        style={{ filter: `drop-shadow(0 0 ${18 * glow}px rgba(169,139,255,0.8))` }}
      />
      <g transform={`translate(512 512) scale(${Math.max(open, 0.001)}) translate(-512 -512)`} opacity={Math.min(1, open * 1.5)}>
        <circle cx="512" cy="512" r="160" fill="#0a0720" stroke="url(#lid)" strokeOpacity={0.5} strokeWidth={6} />
        <rect x="380" y="400" width="260" height="260" fill="url(#moon)" mask="url(#crescent)" style={{ filter: "drop-shadow(0 0 24px rgba(255,215,110,0.7))" }} />
      </g>
      <Sparkle x={512} y={205} r={34 * sparkles} o={sparkles} />
      <Sparkle x={236} y={318} r={19 * sparkles} o={sparkles} />
      <Sparkle x={792} y={318} r={19 * sparkles} o={sparkles} />
      {children}
    </svg>
  );
};

// ---------------------------------------------------------------- cards

export const Card: React.FC<{
  title: string;
  right?: string;
  dot?: string;
  style?: React.CSSProperties;
  glow?: number;
  children: React.ReactNode;
}> = ({ title, right, dot = C.cyan, style, glow = 0, children }) => (
  <div
    style={{
      background: "rgba(21,16,54,0.92)",
      border: `2px solid ${glow ? C.violet : C.line}`,
      borderRadius: 22,
      boxShadow: `0 30px 80px -30px rgba(0,0,0,0.8), 0 0 ${60 * glow}px rgba(169,139,255,${0.55 * glow})`,
      overflow: "hidden",
      ...style,
    }}
  >
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "16px 24px",
        borderBottom: `2px solid ${C.line}`,
        background: C.raised,
        fontFamily: fonts.mono,
        fontSize: 24,
        color: C.fg,
      }}
    >
      <span style={{ width: 14, height: 14, borderRadius: 7, background: dot, boxShadow: `0 0 12px ${dot}` }} />
      <span style={{ fontWeight: 700 }}>{title}</span>
      <span style={{ marginLeft: "auto", color: C.muted }}>{right}</span>
    </div>
    <div style={{ padding: "20px 26px", fontFamily: fonts.mono, fontSize: 26, lineHeight: 1.55, color: C.fg }}>{children}</div>
  </div>
);

/** Text typed in over [a, b]. */
export const Typed: React.FC<{ text: string; a: number; b: number; caret?: boolean }> = ({ text, a, b, caret }) => {
  const frame = useCurrentFrame();
  const n = Math.round(interpolate(frame, [a, b], [0, text.length], clamp));
  const blink = caret && n < text.length + 1 && Math.floor(frame / 8) % 2 === 0;
  return (
    <span>
      {text.slice(0, n)}
      {caret && frame >= a ? <span style={{ opacity: blink || n < text.length ? 1 : 0, color: C.cyan }}>▍</span> : null}
    </span>
  );
};

/** A line that appears (fade + rise) at `at`. */
export const Line: React.FC<{ at: number; color?: string; children: React.ReactNode; style?: React.CSSProperties }> = ({
  at,
  color = C.fg,
  children,
  style,
}) => {
  const frame = useCurrentFrame();
  const p = prog(frame, at, at + 8);
  if (frame < at) return null;
  return <div style={{ color, opacity: p, translate: `0 ${(1 - p) * 14}px`, whiteSpace: "pre", ...style }}>{children}</div>;
};

// ---------------------------------------------------------------- glitch at a cut

/** Full-frame glitch burst for ~10 frames starting at `at`: colored slices, a flash, a jolt. */
export const GlitchBurst: React.FC<{ at: number; dur?: number }> = ({ at, dur = 10 }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const t = frame - at;
  if (t < 0 || t >= dur) return null;
  const k = 1 - t / dur;
  const bars = new Array(9).fill(0).map((_, i) => ({
    y: random(`gy${at}-${t}-${i}`) * height,
    h: 6 + random(`gh${at}-${t}-${i}`) * 70,
    x: jit(`gx${at}-${t}-${i}`) * 140 * k,
    c: i % 3 === 0 ? C.cyan : i % 3 === 1 ? C.hot : "#ffffff",
    o: 0.25 + random(`go${at}-${t}-${i}`) * 0.5,
  }));
  return (
    <AbsoluteFill style={{ pointerEvents: "none", mixBlendMode: "screen" }}>
      {t < 2 ? <AbsoluteFill style={{ background: "#fff", opacity: 0.35 * (2 - t) }} /> : null}
      {bars.map((b, i) => (
        <div
          key={i}
          style={{ position: "absolute", left: b.x, top: b.y, width, height: b.h, background: b.c, opacity: b.o * k }}
        />
      ))}
    </AbsoluteFill>
  );
};

/** Camera jolt: wraps children and shakes them for `dur` frames from `at`. */
export const Jolt: React.FC<{ at: number[]; dur?: number; amp?: number; children: React.ReactNode }> = ({
  at,
  dur = 8,
  amp = 22,
  children,
}) => {
  const frame = useCurrentFrame();
  const hit = at.find((a) => frame >= a && frame < a + dur);
  const k = hit === undefined ? 0 : 1 - (frame - hit) / dur;
  return (
    <AbsoluteFill style={{ translate: `${jit(`jx${frame}`) * amp * k}px ${jit(`jy${frame}`) * amp * k}px` }}>
      {children}
    </AbsoluteFill>
  );
};
