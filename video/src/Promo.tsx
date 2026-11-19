import React from "react";
import { AbsoluteFill, interpolate, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Audio } from "@remotion/media";
import { ActOne, Cta, Demo, Learn, Receipts, Reveal, Rules, T } from "./scenes";
import { C, clamp, fonts, useLayout } from "./ui";
import WORDS from "./words.json";

export const FPS = 30;
export const DURATION = Math.round(T.end * FPS);

const SCENES: [number, number, React.FC<{ start: number }>, string][] = [
  [T.act1, T.reveal, ActOne, "Hook + the memo"],
  [T.reveal, T.demo, Reveal, "Reveal"],
  [T.demo, T.rules, Demo, "Demo"],
  [T.rules, T.learn, Rules, "Rules: who's checking?"],
  [T.learn, T.receipts, Learn, "Rules: it learns"],
  [T.receipts, T.cta, Receipts, "Receipts"],
  [T.cta, T.end, Cta, "CTA"],
];

// The VO is three pieces (seconds). words.json uses the same offsets, so captions stay in sync.
const VO = [
  { file: "vo.mp3", at: 0.4, trim: 0, dur: 21.5 }, // take 1: "Three Claude agents… before its very next tool call."
  { file: "vo2.mp3", at: 21.96, trim: 0, dur: 0 }, // take 2: "Plus file locks… cheaper per working result."
  { file: "vo.mp3", at: 51.64, trim: 39.3, dur: 0 }, // take 1: "Two commands. Zero dependencies. Go lucid."
];
const VO_END = 55.46; // "lucid." ends

// [seconds, file in public/audio, volume]
const SFX: [number, string, number][] = [
  [1.0, "pop.mp3", 0.5],
  [1.15, "pop.mp3", 0.5],
  [1.3, "pop.mp3", 0.5],
  [3.1, "vineboom.wav", 0.5],
  [4.95, "typing.mp3", 0.4],
  [6.95, "scratch.wav", 0.8],
  [9.08, "glitch.mp3", 0.6],
  [10.13, "glitch.mp3", 0.6],
  [11.41, "glitch.mp3", 0.6],
  [11.5, "riser.mp3", 1],
  [13.5, "impact.mp3", 0.9],
  [13.95, "shimmer.mp3", 0.5],
  [17.25, "typing.mp3", 0.35],
  [17.95, "shimmer.mp3", 0.5],
  [18.9, "ping.mp3", 0.45],
  [19.3, "ping.mp3", 0.5],
  [19.4, "glitch.mp3", 0.25],
  [22.28, "whoosh.wav", 0.5],
  [23.64, "whoosh.wav", 0.5],
  // rules: who's checking?
  [25.5, "pop.mp3", 0.45],
  [27.6, "stamp.mp3", 0.75],
  [28.8, "tick.mp3", 0.5],
  [30.28, "pop.mp3", 0.5],
  [31.42, "impact.mp3", 0.75],
  [32.9, "typing.mp3", 0.3],
  [33.5, "alert.mp3", 0.55],
  [34.7, "typing.mp3", 0.3],
  [35.6, "ping.mp3", 0.45],
  // rules: it learns
  [36.3, "shimmer.mp3", 0.5],
  [37.65, "typing.mp3", 0.35],
  [38.95, "typing.mp3", 0.3],
  [39.6, "ping.mp3", 0.4],
  [41.6, "whoosh.wav", 0.5],
  [42.2, "whoosh.wav", 0.5],
  [43.12, "whoosh.wav", 0.5],
  [44.4, "stamp.mp3", 0.75],
  [44.9, "pop.mp3", 0.45],
  [45.6, "ping.mp3", 0.35],
  [45.8, "ping.mp3", 0.35],
  [46.0, "ping.mp3", 0.4],
  // receipts
  [47.15, "receipt.mp3", 0.6],
  [48.6, "impact.mp3", 0.7],
  // CTA
  [T.cta + 0.1, "typing.mp3", 0.4],
  [T.cta + 0.85, "typing.mp3", 0.35],
  [T.cta + 1.4, "ping.mp3", 0.45],
  [T.go, "impact.mp3", 0.85],
  [T.go + 0.04, "shimmer.mp3", 0.5],
];

// The music cuts out on the record scratch and slams back in on "Meet lucid", right on the
// track's own drop (music60.mp3 at 15.00 s); its fade-out (58-60 s) then lands on the end lockup.
const MUSIC_DROP = 15.0;
const BED = 0.13; // VO (-23 dB mean) sits ~9 dB over the bed

/** `captions: false` renders clean stills (the site's poster). */
export const Promo: React.FC<{ captions?: boolean }> = ({ captions = true }) => {
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      {SCENES.map(([from, to, Scene, name]) => (
        <Sequence key={name} name={name} from={Math.round(from * fps)} durationInFrames={Math.round((to - from) * fps)}>
          <Scene start={from} />
        </Sequence>
      ))}
      {captions ? <Captions /> : null}

      {VO.map((v) => (
        <Audio
          key={v.at}
          src={staticFile(`audio/${v.file}`)}
          from={Math.round(v.at * fps)}
          trimBefore={v.trim ? Math.round(v.trim * fps) : undefined}
          durationInFrames={v.dur ? Math.round(v.dur * fps) : undefined}
        />
      ))}
      <Audio
        src={staticFile("audio/music60.mp3")}
        durationInFrames={Math.round(T.freeze * fps)}
        volume={(f) => interpolate(f / fps, [0, 0.4, 0.7, T.freeze - 0.05, T.freeze], [0.45, 0.45, BED, BED, 0], clamp)}
      />
      <Audio
        src={staticFile("audio/music60.mp3")}
        from={Math.round(T.reveal * fps)}
        trimBefore={Math.round(MUSIC_DROP * fps)}
        volume={(f) => {
          const s = T.reveal + f / fps;
          return interpolate(s, [T.reveal, T.reveal + 0.12, T.reveal + 0.5, VO_END, VO_END + 0.4], [0.45, 0.25, BED, BED, 0.7], clamp);
        }}
      />
      {SFX.map(([at, file, vol], i) => (
        <Audio key={i} src={staticFile(`audio/${file}`)} from={Math.round(at * fps)} volume={vol} />
      ))}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- word-pop captions

type Word = { text: string; start: number; end: number }; // absolute seconds
const GROUPS: Word[][] = (() => {
  const out: Word[][] = [];
  let cur: Word[] = [];
  for (const w of WORDS as Word[]) {
    cur.push(w);
    if (cur.length >= 3 || /[.,?:…]$/.test(w.text)) {
      out.push(cur);
      cur = [];
    }
  }
  if (cur.length) out.push(cur);
  return out;
})();

const Captions: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { pick } = useLayout();
  const t = frame / fps;
  const gi = GROUPS.findIndex((g, i) => {
    const next = GROUPS[i + 1];
    const until = Math.min(g[g.length - 1].end + 0.35, next ? next[0].start : Infinity);
    return t >= g[0].start - 0.05 && t < until;
  });
  if (gi < 0) return null;
  const g = GROUPS[gi];
  const pop = interpolate(t, [g[0].start - 0.05, g[0].start + 0.08], [0.85, 1], clamp);
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "flex-end", paddingBottom: pick(34, 0) }}>
      <div
        style={{
          position: pick("relative", "absolute") as React.CSSProperties["position"],
          top: pick(undefined, 1690),
          display: "flex",
          gap: "0.3em",
          padding: pick("10px 28px", "12px 30px"),
          borderRadius: 18,
          background: "rgba(10,7,32,0.78)",
          border: `2px solid ${C.line}`,
          fontFamily: fonts.head,
          fontWeight: 800,
          fontSize: pick(46, 54),
          color: C.fg,
          scale: String(pop),
          whiteSpace: "nowrap",
        }}
      >
        {g.map((w, i) => {
          const active = t >= w.start && (i === g.length - 1 || t < g[i + 1].start);
          return (
            <span key={i} style={{ color: active ? C.moon : C.fg }}>
              {w.text}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
