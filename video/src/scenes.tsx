import React from "react";
import { AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { C, Card, Eye, EYE_VIEWBOX, GlitchBurst, Jolt, LID, LidGradient, Sky, clamp, ease, fonts, jit, rgb, useLayout } from "./ui";

/*
  Every time here is in absolute seconds of the final video; src/words.json holds every spoken word at its
  absolute time. The VO is three spliced pieces (see Promo.tsx): take 1 up to "tool call.", take 2 ("Plus file
  locks… working result."), then take 1's "Two commands… Go lucid." Each scene gets its start and works out its own clock.
*/
export const T = {
  act1: 0, // hook + the memo, one continuous scene
  freeze: 6.95, // record scratch, right after "your workers?"
  list: 9.05, // "Plan drift. Clobbered files. Amnesia after compact."
  reveal: 13.5, // "Meet lucid."
  demo: 17.0, // "Edit the plan…"
  slams: 22.0, // "Plus file locks, and memory that survives compact."
  rules: 25.45, // "Your AGENTS.md? Just a suggestion…"
  learn: 36.25, // "And it learns…"
  receipts: 47.1, // "The receipts?"
  cta: 51.64, // "Two commands."
  go: 54.32, // "Go lucid."
  end: 57.5,
};

/** Absolute-time clock inside a scene that starts at `start` seconds. */
const useClock = (start: number) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = start + frame / fps;
  return {
    t,
    p: (a: number, b: number) => interpolate(t, [a, b], [0, 1], { ...clamp, easing: ease }),
    sp: (a: number, damping = 13) => spring({ frame: (t - a) * fps, fps, config: { damping, stiffness: 170, mass: 0.6 } }),
  };
};

const head = (size: number, extra?: React.CSSProperties): React.CSSProperties => ({
  fontFamily: fonts.head,
  fontWeight: 800,
  fontSize: size,
  lineHeight: 1.02,
  letterSpacing: "-0.02em",
  color: C.fg,
  ...extra,
});

const gradientText: React.CSSProperties = {
  background: C.lid,
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
};

/** Mono line with a colored tool bullet. */
const Code: React.FC<{ text: string; color?: string; bold?: boolean }> = ({ text, color, bold }) =>
  text.startsWith("●") ? (
    <span style={{ color: color ?? C.fg, fontWeight: bold ? 700 : 400 }}>
      <span style={{ color: C.cyan }}>●</span>
      {text.slice(1)}
    </span>
  ) : (
    <span style={{ color: color ?? C.fg, fontWeight: bold ? 700 : 400 }}>{text}</span>
  );

// ======================================================================== act 1: hook + the memo

type L = [number, string, string?];
const PANES: { name: string; dot: string; lines: L[] }[] = [
  {
    name: "lead",
    dot: C.cyan,
    lines: [
      [1.5, "● Write PLAN.md"],
      [1.9, "● Task(worker 1)"],
      [2.2, "● Task(worker 2)"],
      [2.7, "  waiting on workers…", C.muted],
    ],
  },
  {
    name: "worker 1",
    dot: C.violet,
    lines: [
      [1.6, "● Read db/models.py"],
      [2.3, "● Edit db/models.py"],
      [2.8, "  + engine = sqlite(…)", C.added],
      [4.3, "● Edit db/session.py"],
      [5.3, "  + sqlite3.connect(…)", C.added],
      [6.3, "● Bash pytest -q"],
    ],
  },
  {
    name: "worker 2",
    dot: C.hot,
    lines: [
      [1.8, "● Read api/users.py"],
      [2.5, "● Edit api/users.py"],
      [3.2, "  + sqlite3.connect(…)", C.added],
      [4.7, "● Edit api/auth.py"],
      [5.8, "  + sqlite3.connect(…)", C.added],
    ],
  },
];

export const ActOne: React.FC<{ start: number }> = ({ start }) => {
  const { t, p, sp } = useClock(start);
  const { portrait, pick } = useLayout();
  const clock = Math.min(t, T.freeze); // the freeze frame stops the agents
  const frozen = p(T.freeze, T.freeze + 0.15);
  const listOn = t >= T.list;

  const paneW = pick(540, 920);
  const paneH = pick(380, 300);
  const paneX = (i: number) => pick(90 + i * 600, 80);
  const paneY = (i: number) => pick(430, 640 + i * 330);
  const maxLines = pick(6, 4);

  // headline: "3 agents. 1 feature." then "Big brain. 🧠"
  const brain = t >= 3.1;
  const headOut = 1 - p(4.2, 4.45);
  const headSize = pick(128, 116);

  // the plan card, edited mid-build
  const planIn = sp(4.5, 14);
  const strike = p(4.9, 5.3);
  const typed = "+ store users in Postgres";
  const nTyped = Math.round(interpolate(t, [5.0, 5.8], [0, typed.length], clamp));
  const planOut = 1 - p(8.9, 9.05);

  return (
    <AbsoluteFill>
      <Sky intensity={listOn ? 0.5 : 1} />
      {!listOn ? (
        <AbsoluteFill
          style={{
            scale: String(1 + 0.045 * frozen),
            transformOrigin: "50% 65%",
            filter: `grayscale(${0.75 * frozen}) brightness(${1 - 0.15 * frozen})`,
          }}
        >
          {PANES.map((pane, i) => {
            const pop = sp(1.0 + i * 0.15, 12);
            const lines = pane.lines.filter(([at]) => clock >= at).slice(-maxLines);
            return (
              <Card
                key={pane.name}
                title={`✻ ${pane.name}`}
                right={i === 0 ? "claude" : "claude · subagent"}
                dot={pane.dot}
                style={{
                  position: "absolute",
                  left: paneX(i),
                  top: paneY(i),
                  width: paneW,
                  height: paneH,
                  opacity: pop,
                  scale: String(0.7 + 0.3 * pop),
                }}
              >
                {lines.map(([at, text, color]) => (
                  <div key={at} style={{ opacity: interpolate(clock, [at, at + 0.15], [0, 1], clamp), whiteSpace: "pre" }}>
                    <Code text={text} color={color} />
                  </div>
                ))}
              </Card>
            );
          })}

          {/* you, editing the plan mid-build */}
          {t >= 4.5 ? (
            <Card
              title="PLAN.md"
              right="you, mid-build"
              dot={C.moon}
              glow={p(5.0, 5.3) * (1 - p(6.2, 6.8))}
              style={{
                position: "absolute",
                left: pick(550, 80),
                top: pick(110, 250),
                width: pick(820, 920),
                opacity: planIn * planOut,
                translate: `0 ${(1 - planIn) * -60}px`,
              }}
            >
              <div style={{ color: C.muted }}>## storage</div>
              <div style={{ position: "relative", display: "inline-block", color: strike > 0.5 ? C.red : C.fg }}>
                - store users in SQLite
                <span
                  style={{ position: "absolute", left: 0, top: "52%", height: 4, width: `${strike * 100}%`, background: C.red }}
                />
              </div>
              <div style={{ color: C.added, whiteSpace: "pre" }}>
                {typed.slice(0, nTyped)}
                {nTyped < typed.length ? <span style={{ color: C.cyan }}>▍</span> : null}
              </div>
            </Card>
          ) : null}

          {/* the freeze frame: they did not get the memo */}
          {t >= T.freeze + 0.2 ? (
            <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", overflow: "visible" }}>
              {[1, 2].map((i) => {
                const d = p(T.freeze + 0.2 + (i - 1) * 0.2, T.freeze + 0.5 + (i - 1) * 0.2);
                const cx = paneX(i) + paneW / 2;
                const cy = paneY(i) + paneH / 2;
                return (
                  <ellipse
                    key={i}
                    cx={cx}
                    cy={cy}
                    rx={paneW / 2 + pick(16, 14)}
                    ry={paneH / 2 + pick(26, 14)}
                    fill="none"
                    stroke={C.red}
                    strokeWidth={9}
                    strokeLinecap="round"
                    pathLength={1}
                    strokeDasharray="1.08 1"
                    strokeDashoffset={1.08 - 1.08 * d}
                    transform={`rotate(${i === 1 ? -3 : 2.5} ${cx} ${cy})`}
                    style={{ filter: "drop-shadow(0 0 10px rgba(255,92,122,0.7))" }}
                  />
                );
              })}
            </svg>
          ) : null}
        </AbsoluteFill>
      ) : null}

      {/* headline */}
      {t < 4.45 ? (
        <AbsoluteFill style={{ alignItems: "center", paddingTop: pick(110, 250), opacity: headOut }}>
          {!brain ? (
            <div style={{ ...head(headSize), display: "flex", gap: "0.35em", flexDirection: portrait ? "column" : "row", alignItems: "center" }}>
              <span style={{ scale: String(sp(0.45, 10)), display: "inline-block" }}>
                <span style={gradientText}>3</span> agents.
              </span>
              <span style={{ scale: String(sp(2.0, 10)), display: "inline-block" }}>1 feature.</span>
            </div>
          ) : (
            <div
              style={{
                ...head(headSize * 1.1),
                scale: String(1 + 0.8 * (1 - sp(3.1, 9))),
                rotate: "-4deg",
                textShadow: rgb(Math.round(14 * (1 - p(3.1, 3.5)))),
              }}
            >
              Big brain. 🧠
            </div>
          )}
        </AbsoluteFill>
      ) : null}

      {/* meme captions during the freeze */}
      {t >= T.freeze && !listOn ? (
        <>
          <div
            style={{
              position: "absolute",
              left: pick(60, 80),
              top: pick(40, 120),
              fontFamily: fonts.mono,
              fontStyle: "italic",
              fontSize: pick(34, 36),
              color: C.fg,
              opacity: p(T.freeze, T.freeze + 0.1),
            }}
          >
            *record scratch* ⏸
          </div>
          {t >= 7.5 ? (
            <div
              style={{
                position: "absolute",
                left: pick(1260, 540),
                top: pick(860, 545),
                translate: "-50% -50%",
                rotate: "-3deg",
                scale: String(sp(7.5, 9)),
                background: C.moon,
                color: "#1a1030",
                padding: pick("16px 34px", "14px 28px"),
                borderRadius: 16,
                boxShadow: "0 18px 50px -10px rgba(0,0,0,0.7)",
                whiteSpace: "nowrap",
                ...head(pick(54, 50), { color: "#1a1030" }),
              }}
            >
              did <span style={{ color: "#c8102e" }}>NOT</span> get the memo 📎
            </div>
          ) : null}
        </>
      ) : null}

      {/* the glitchy list */}
      {listOn ? <PainList start={start} /> : null}
      <GlitchBurst at={Math.round((T.freeze - start) * 30)} dur={6} />
    </AbsoluteFill>
  );
};

const PAINS: [number, string, string][] = [
  [9.1, "🧭", "PLAN DRIFT"],
  [10.15, "💥", "CLOBBERED FILES"],
  [11.43, "🫥", "AMNESIA AFTER /compact"],
];

const PainList: React.FC<{ start: number }> = ({ start }) => {
  const { t, p, sp } = useClock(start);
  const { pick } = useLayout();
  const { fps } = useVideoConfig();
  const shake = p(12.6, 13.5);
  const hits = PAINS.map(([at]) => Math.round((at - start) * fps));
  return (
    <Jolt at={hits} amp={26}>
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          gap: pick(36, 44),
          padding: pick("0 120px", "0 80px"),
          translate: `${jit(`s${Math.round(t * fps)}`) * 18 * shake}px 0`,
        }}
      >
        {PAINS.map(([at, icon, text], i) => {
          if (t < at) return null;
          const latest = i === PAINS.length - 1 || t < PAINS[i + 1][0];
          const pop = sp(at, 10);
          return (
            <div
              key={text}
              style={{
                ...head(pick(112, 84)),
                textAlign: "center",
                opacity: latest ? 1 : 0.32,
                scale: String((latest ? 1 : 0.9) * (1 + 0.5 * (1 - pop))),
                textShadow: rgb(Math.round(16 * (1 - p(at, at + 0.4)) + 10 * shake)),
                color: latest ? C.fg : C.muted,
              }}
            >
              <span style={{ marginRight: "0.3em" }}>{icon}</span>
              {text.includes("/compact") ? (
                <>
                  AMNESIA AFTER <span style={{ fontFamily: fonts.mono, color: latest ? C.pink : C.muted }}>/compact</span>
                </>
              ) : (
                text
              )}
            </div>
          );
        })}
      </AbsoluteFill>
      {hits.map((h) => (
        <GlitchBurst key={h} at={h} />
      ))}
      <GlitchBurst at={Math.round((13.3 - start) * fps)} dur={6} />
    </Jolt>
  );
};

// ======================================================================== reveal

export const Reveal: React.FC<{ start: number }> = ({ start }) => {
  const { t, p, sp } = useClock(start);
  const { pick } = useLayout();
  const words = ["One", "shared", "dream", "for", "every", "Claude."];
  const wordAt = [14.88, 15.12, 15.44, 15.84, 16.08, 16.4];
  const mark = sp(14.0, 12);
  const zoom = 1 + 0.05 * p(13.5, 17.0);
  return (
    <AbsoluteFill>
      <Sky intensity={1.3} />
      <AbsoluteFill style={{ alignItems: "center", scale: String(zoom) }}>
        <div style={{ marginTop: pick(90, 300) }}>
          <Eye
            width={pick(640, 860)}
            draw={p(13.5, 14.1)}
            open={sp(13.9, 11)}
            sparkles={sp(14.2, 9)}
            glow={1 + 0.4 * Math.sin((t - 13.5) * 6)}
          />
        </div>
        <div
          style={{
            ...head(pick(220, 230)),
            ...gradientText,
            marginTop: pick(-10, 40),
            scale: String(0.6 + 0.4 * mark),
            letterSpacing: `${0.4 - 0.42 * mark}em`,
            filter: `blur(${(1 - mark) * 20}px)`,
            opacity: Math.min(1, mark * 2),
          }}
        >
          lucid
        </div>
        <div
          style={{
            ...head(pick(64, 70), { fontWeight: 600 }),
            marginTop: pick(16, 30),
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: "0 0.28em",
            maxWidth: pick(1600, 900),
          }}
        >
          {words.map((w, i) => (
            <span
              key={w}
              style={{
                display: "inline-block",
                opacity: p(wordAt[i], wordAt[i] + 0.12),
                translate: `0 ${(1 - sp(wordAt[i], 12)) * 30}px`,
                color: w === "dream" ? C.moon : C.fg,
              }}
            >
              {w}
            </span>
          ))}
        </div>
      </AbsoluteFill>
      <AbsoluteFill style={{ background: "#fff", opacity: 0.8 * (1 - p(13.5, 13.75)) }} />
    </AbsoluteFill>
  );
};

// ======================================================================== demo

const INJECTED: [string, string][] = [
  ["[lucid] 1 update(s) from other agents since you last looked:", C.cyan],
  ["#3 PLAN CHANGED by user:", C.moon],
  ["@@ -3 +3 @@", C.muted],
  ["-- store users in SQLite", C.red],
  ["+- store users in Postgres", C.added],
];

const FEATURES = [
  { at: 22.28, icon: "🔒", title: "File locks", sub: "claims stop two agents editing one file" },
  { at: 23.64, icon: "🧠", title: "Survives /compact", sub: "plan + memory live in files, not chat" },
];

export const Demo: React.FC<{ start: number }> = ({ start }) => {
  const { t, p, sp } = useClock(start);
  const { portrait, pick } = useLayout();
  const { x: vx, y: vy, w: vw } = EYE_VIEWBOX;

  const eyeX = pick(50, 80);
  const eyeY = pick(200, 420);
  const eyeW = pick(900, 920);
  const s = eyeW / vw;
  const toScreen = (x: number, y: number) => [eyeX + (x - vx) * s, eyeY + (y - vy) * s];
  const [topX, topY] = toScreen(512, 317);

  const plan = { x: pick(1010, 80), y: pick(110, 150), w: pick(850, 920) };
  const term = { x: pick(1010, 60), y: pick(320, 1170), w: pick(850, 960), h: pick(600, 470) };
  const beam = portrait
    ? `M540 ${plan.y + 185} C 540 ${plan.y + 260}, 540 ${topY - 120}, ${topX} ${topY}`
    : `M${plan.x} ${plan.y + 90} C ${plan.x - 190} ${plan.y + 90}, ${topX + 100} ${topY - 127}, ${topX} ${topY}`;
  const beamP = p(17.95, 18.3);

  // a pulse runs around the lid both ways: lead and worker 1 at 18.9, worker 2 at 19.3
  const fwd = t < 18.9 ? interpolate(t, [18.3, 18.9], [250, 500], clamp) : interpolate(t, [18.9, 19.3], [500, 750], clamp);
  const back = interpolate(t, [18.3, 18.9], [250, 0], clamp);
  const sweepOn = t >= 18.3 && t < 19.45;

  const typed = "+ store users in Postgres";
  const nTyped = Math.round(interpolate(t, [17.25, 17.9], [0, typed.length], clamp));

  const dim = p(22.0, 22.3);
  const termFont = pick(24, 20);

  const before: [number, string, string?][] = [
    [17.0, "● Read api/users.py"],
    [17.3, "● Edit api/users.py"],
    [17.6, "  + db = sqlite3.connect(…)", C.added],
  ];
  const after: [number, string, string?, boolean?][] = [
    [20.5, "● Edit api/users.py"],
    [20.7, "  - db = sqlite3.connect(…)", C.red],
    [20.85, "  + db = psycopg.connect(DB_URL)", C.added],
    [21.15, '● lucid note "switched to Postgres, plan #3"'],
    [21.45, "✓ applied the plan change", C.added, true],
  ];

  return (
    <AbsoluteFill>
      <Sky />
      <AbsoluteFill style={{ scale: String(1 - 0.06 * dim), filter: `blur(${7 * dim}px)`, opacity: 1 - 0.7 * dim }}>
        {/* the eye with the three agents on its lid */}
        <div style={{ position: "absolute", left: eyeX, top: eyeY, opacity: sp(17.0, 14) }}>
          <Eye width={eyeW} sparkles={0.8} glow={0.8}>
            {sweepOn ? (
              <>
                {[fwd, back].map((pos, i) => (
                  <path
                    key={i}
                    d={LID}
                    stroke="#fff"
                    strokeWidth={16}
                    strokeLinecap="round"
                    pathLength={1000}
                    strokeDasharray="70 930"
                    strokeDashoffset={-(pos - 35)}
                    style={{ filter: "drop-shadow(0 0 16px #fff) drop-shadow(0 0 30px #a98bff)" }}
                  />
                ))}
              </>
            ) : null}
            {(
              [
                [150, 512, "lead", 18.9],
                [874, 512, "worker 1", 18.9],
                [512, 707, "worker 2", 19.3],
              ] as const
            ).map(([x, y, label, at]) => {
              const ring = p(at, at + 0.5);
              const lit = t >= at;
              return (
                <g key={label}>
                  {lit ? <circle cx={x} cy={y} r={24 + 60 * ring} fill="none" stroke="#fff" strokeWidth={4} opacity={1 - ring} /> : null}
                  <circle cx={x} cy={y} r={24} fill={C.surface} stroke="url(#lid)" strokeWidth={6} />
                  <circle cx={x} cy={y} r={10} fill={lit ? C.cyan : C.lineStrong} style={{ filter: lit ? "drop-shadow(0 0 10px #6ff3ff)" : undefined }} />
                  <text
                    x={x}
                    y={y + 64}
                    textAnchor="middle"
                    fill={C.fg}
                    style={{ fontFamily: fonts.mono, fontSize: 30, fontWeight: 700 }}
                  >
                    {label}
                  </text>
                </g>
              );
            })}
          </Eye>
        </div>

        {/* your plan.md */}
        <Card
          title="plan.md"
          right="you, mid-build"
          dot={C.moon}
          glow={p(17.3, 17.6) * (1 - p(18.4, 18.9))}
          style={{ position: "absolute", left: plan.x, top: plan.y, width: plan.w, opacity: sp(17.05, 14) }}
        >
          <div style={{ color: C.muted }}>## storage</div>
          <div style={{ color: C.added, whiteSpace: "pre" }}>
            {typed.slice(0, nTyped)}
            {nTyped < typed.length ? <span style={{ color: C.cyan }}>▍</span> : null}
          </div>
        </Card>

        {/* the beam: plan.md → the lid */}
        <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", overflow: "visible" }}>
          <defs>
            <LidGradient id="beam" />
          </defs>
          {t >= 17.95 && t < 19.0 ? (
            <path
              d={beam}
              fill="none"
              stroke="url(#beam)"
              strokeWidth={10}
              strokeLinecap="round"
              pathLength={1}
              strokeDasharray="1 1"
              strokeDashoffset={1 - beamP}
              opacity={1 - p(18.6, 19.0)}
              style={{ filter: "drop-shadow(0 0 14px #a98bff)" }}
            />
          ) : null}
        </svg>

        {/* worker 2's session */}
        <Card
          title="✻ worker 2"
          right="mid-task"
          dot={C.hot}
          glow={p(19.4, 19.6) * (1 - p(20.6, 21.2))}
          style={{ position: "absolute", left: term.x, top: term.y, width: term.w, height: term.h, opacity: sp(17.1, 14) }}
        >
          <div style={{ fontSize: termFont, lineHeight: 1.5 }}>
            {t < 20.4
              ? before.filter(([at]) => t >= at).map(([at, text, color]) => (
                  <div key={at} style={{ whiteSpace: "pre" }}>
                    <Code text={text} color={color} />
                  </div>
                ))
              : null}
            {t >= 19.4 ? (
              <div
                style={{
                  margin: "8px 0",
                  padding: "10px 14px",
                  borderRadius: 12,
                  border: `2px solid ${C.violet}`,
                  background: "rgba(169,139,255,0.10)",
                  boxShadow: `0 0 ${30 * (1 - p(20.4, 21))}px rgba(169,139,255,0.6)`,
                }}
              >
                {INJECTED.map(([text, color], i) => (
                  <div key={i} style={{ color, opacity: p(19.4 + i * 0.12, 19.5 + i * 0.12), whiteSpace: "pre-wrap" }}>
                    {text}
                  </div>
                ))}
              </div>
            ) : null}
            {after
              .filter(([at]) => t >= at)
              .map(([at, text, color, bold]) => (
                <div key={at} style={{ whiteSpace: "pre", opacity: p(at, at + 0.1) }}>
                  <Code text={text} color={color} bold={bold} />
                </div>
              ))}
          </div>
        </Card>
      </AbsoluteFill>

      {/* feature slams */}
      {t >= 22.1 ? (
        <AbsoluteFill
          style={{
            flexDirection: portrait ? "column" : "row",
            justifyContent: "center",
            alignItems: "center",
            gap: pick(44, 40),
            paddingBottom: pick(60, 140),
          }}
        >
          {FEATURES.map((f, i) => {
            const pop = sp(f.at, 11);
            return t >= f.at ? (
              <div
                key={f.title}
                style={{
                  width: pick(560, 900),
                  height: pick(400, 300),
                  borderRadius: 32,
                  padding: 3,
                  background: C.lid,
                  scale: String(0.6 + 0.4 * pop),
                  rotate: `${(1 - pop) * (i === 0 ? -8 : 8)}deg`,
                  opacity: Math.min(1, pop * 2),
                  boxShadow: "0 40px 90px -30px rgba(0,0,0,0.9), 0 0 60px rgba(169,139,255,0.35)",
                }}
              >
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    borderRadius: 29,
                    background: C.surface,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                    textAlign: "center",
                    gap: 14,
                    padding: "0 30px",
                  }}
                >
                  <div style={{ fontSize: pick(110, 90) }}>{f.icon}</div>
                  <div style={head(pick(52, 62))}>
                    {f.title.includes("/compact") ? (
                      <>
                        Survives <span style={{ fontFamily: fonts.mono, color: C.pink }}>/compact</span>
                      </>
                    ) : (
                      f.title
                    )}
                  </div>
                  <div style={{ fontFamily: fonts.body, fontSize: pick(32, 36), color: C.muted }}>{f.sub}</div>
                </div>
              </div>
            ) : (
              <div key={f.title} style={{ width: pick(560, 900), height: pick(400, 300) }} />
            );
          })}
        </AbsoluteFill>
      ) : null}
    </AbsoluteFill>
  );
};

// ======================================================================== rules: "Your AGENTS.md? Just a suggestion…"

const AGENTS_MD = ["## Team rules", "- Never log auth tokens", "- Money is integer cents, never floats", "- No SQL in route handlers", "- Every bugfix ships with a test", "- …and 26 more"];
const STREAM = ["● Read src/api/auth.ts", "● Edit src/api/auth.ts", "  + const session = await sign(user)", "● Bash npm test", "● Read src/routes/orders.ts", "● Edit src/routes/orders.ts", "● Grep \"invoice\"", "● Read src/billing/tax.ts"];
const VIOLATION = 24; // the stream line nobody catches
// What lucid actually returns when an edit adds a line a rule's `forbid` matches (bin/lucid check_edit).
const FORBID_HIT =
  '[lucid] team rule security/no-token-logs.md ("Never log auth tokens"): this edit adds `console.log(token)` to src/api/auth.ts. Fix it, or say in one line why it\'s an exception.';

type PaneLine = [number, string, string?, boolean?];
const RULE_PANES: { name: string; dot: string; lines: PaneLine[] }[] = [
  {
    name: "lead",
    dot: C.cyan,
    lines: [
      [32.7, "● Edit billing.ts"],
      [32.9, "  + cents = toCents(total)", C.added],
      [33.4, "✓ convention/money-in-cents.md", C.added, true],
    ],
  },
  {
    name: "worker 1",
    dot: C.violet,
    lines: [
      [32.8, "● Edit routes/orders.ts"],
      [33.0, "  + return repo.orders(user)", C.added],
      [33.7, "✓ architecture/no-sql-in-routes.md", C.added, true],
    ],
  },
];

export const Rules: React.FC<{ start: number }> = ({ start }) => {
  const { t, p, sp } = useClock(start);
  const { pick } = useLayout();
  const { fps } = useVideoConfig();
  const caught = t >= 31.4;

  // phase 1-2: the AGENTS.md card, stamped, then pushed out of view by forty turns of tool calls
  const cardTop = pick(150, 420);
  const cardW = pick(1000, 920);
  const lineH = 40;
  const streamTop = cardTop + pick(440, 400);
  // the stream stops with the uncaught line below "who's checking?", where its red squiggle shows
  const scrollEnd = streamTop + VIOLATION * lineH - pick(760, 1250);
  const scroll = interpolate(t, [28.7, 30.6], [0, scrollEnd], { ...clamp, easing: Easing.in(Easing.quad) });
  const turn = Math.round(interpolate(t, [28.8, 30.5], [1, 40], { ...clamp, easing: Easing.in(Easing.quad) }));
  const checking = t >= 30.28;

  // phase 3: lucid catches it
  const w2 = { x: pick(720, 60), y: pick(330, 830), w: pick(1120, 960), h: pick(550, 760) };
  const small = (i: number) => ({ x: pick(80, i === 0 ? 60 : 550), y: pick(i === 0 ? 330 : 620, 520), w: pick(600, 470), h: pick(260, 280) });
  const flagged = t >= 33.5;
  const fixed = t >= 34.7;

  return (
    <AbsoluteFill>
      <Sky intensity={caught ? 1 : 0.7} />
      {!caught ? (
        <>
          <AbsoluteFill style={{ translate: `0 ${-scroll}px`, opacity: 1 - (checking ? 0.55 * p(30.28, 30.5) : 0) }}>
            <Card
              title="AGENTS.md"
              right="30 rules"
              dot={C.moon}
              style={{ position: "absolute", left: (pick(1920, 1080) - cardW) / 2, top: cardTop, width: cardW, scale: String(sp(25.5, 13)) }}
            >
              {AGENTS_MD.map((l, i) => (
                <div key={i} style={{ color: i === 0 ? C.muted : C.fg, fontSize: pick(34, 30) }}>
                  {l}
                </div>
              ))}
              {t >= 27.6 ? (
                <div
                  style={{
                    position: "absolute",
                    left: "50%",
                    top: "56%",
                    translate: "-50% -50%",
                    rotate: "-11deg",
                    scale: String(1 + 1.2 * (1 - sp(27.6, 9))),
                    border: `8px solid ${C.red}`,
                    borderRadius: 14,
                    padding: "6px 26px",
                    color: C.red,
                    whiteSpace: "nowrap",
                    background: "rgba(14,10,40,0.55)",
                    ...head(pick(92, 74), { color: C.red, letterSpacing: "0.04em" }),
                  }}
                >
                  JUST A SUGGESTION
                </div>
              ) : null}
            </Card>
            {t >= 28.7
              ? new Array(32).fill(0).map((_, i) => {
                  const bad = i === VIOLATION;
                  const text = bad ? "  + console.log(token)" : STREAM[i % STREAM.length];
                  return (
                    <div
                      key={i}
                      style={{
                        position: "absolute",
                        left: (pick(1920, 1080) - cardW) / 2 + 26,
                        top: streamTop + i * lineH,
                        fontFamily: fonts.mono,
                        fontSize: 26,
                        whiteSpace: "pre",
                        color: text.startsWith("  +") ? C.added : C.fg,
                        opacity: 0.85,
                        textDecoration: bad && checking ? `underline wavy ${C.red}` : undefined,
                      }}
                    >
                      <Code text={text} color={text.startsWith("  +") ? C.added : undefined} />
                    </div>
                  );
                })
              : null}
          </AbsoluteFill>

          {/* forty turns in */}
          {t >= 28.75 ? (
            <div
              style={{
                position: "absolute",
                right: pick(60, undefined),
                left: pick(undefined, 300),
                width: pick(undefined, 480),
                top: pick(150, 120),
                textAlign: "center",
                padding: "14px 28px",
                borderRadius: 22,
                background: "rgba(14,10,40,0.9)",
                border: `2px solid ${C.lineStrong}`,
                boxShadow: "0 20px 60px -20px rgba(0,0,0,0.9)",
                scale: String(sp(28.75, 12)),
              }}
            >
              <div style={{ fontFamily: fonts.mono, fontWeight: 700, fontSize: pick(84, 72), color: C.fg, textShadow: "0 0 30px rgba(14,10,40,0.9)" }}>
                turn {turn}
              </div>
              <div style={{ display: "inline-block", width: pick(300, 420), height: 14, borderRadius: 7, background: C.raised, marginTop: 10, overflow: "hidden" }}>
                <div style={{ width: `${92 * p(28.8, 30.5)}%`, height: "100%", background: `linear-gradient(90deg, ${C.violet}, ${C.red})` }} />
              </div>
              <div style={{ fontFamily: fonts.mono, fontSize: 24, color: C.muted, marginTop: 6 }}>context</div>
            </div>
          ) : null}

          {/* the receipts for the claim */}
          {t >= 29.3 ? (
            <div
              style={{
                position: "absolute",
                left: pick(60, 80),
                right: pick(undefined, 80),
                top: pick(840, 1530),
                padding: "14px 22px",
                borderRadius: 16,
                background: "rgba(10,7,32,0.85)",
                border: `2px solid ${C.lineStrong}`,
                fontFamily: fonts.body,
                fontSize: pick(30, 32),
                color: C.fg,
                opacity: p(29.3, 29.5),
                textAlign: pick("left", "center") as React.CSSProperties["textAlign"],
              }}
            >
              Only <b style={{ color: C.moon }}>10–28%</b> of agent tasks follow every rule{" "}
              <span style={{ color: C.muted, fontSize: "0.8em" }}>· OctoBench, arXiv 2601.10343</span>
            </div>
          ) : null}

          {checking ? (
            <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
              <div style={{ ...head(pick(140, 116)), scale: String(1 + 0.6 * (1 - sp(30.28, 9))), rotate: "-3deg", textShadow: rgb(Math.round(10 * (1 - p(30.28, 30.6)))) }}>
                who's checking? 👀
              </div>
            </AbsoluteFill>
          ) : null}
        </>
      ) : (
        <>
          {/* "lucid is." */}
          <AbsoluteFill style={{ alignItems: "center", paddingTop: pick(80, 220) }}>
            <div style={{ ...head(pick(124, 124)), scale: String(1 + 0.6 * (1 - sp(31.45, 9))), textShadow: rgb(Math.round(12 * (1 - p(31.45, 31.8)))) }}>
              <span style={gradientText}>lucid</span> is.
            </div>
            <div style={{ fontFamily: fonts.body, fontWeight: 600, fontSize: pick(38, 38), color: C.muted, marginTop: 6, opacity: p(32.6, 32.8) }}>
              every edit · every agent · checked against your rules
            </div>
          </AbsoluteFill>

          {RULE_PANES.map((pane, i) => {
            const b = small(i);
            return (
              <Card
                key={pane.name}
                title={`✻ ${pane.name}`}
                dot={pane.dot}
                style={{ position: "absolute", left: b.x, top: b.y, width: b.w, height: b.h, opacity: sp(32.5 + i * 0.1, 13), scale: String(0.8 + 0.2 * sp(32.5 + i * 0.1, 13)) }}
              >
                <div style={{ fontSize: pick(24, 20) }}>
                  {pane.lines
                    .filter(([at]) => t >= at)
                    .map(([at, text, color, bold]) => (
                      <div key={at} style={{ whiteSpace: "pre", opacity: p(at, at + 0.1) }}>
                        <Code text={text} color={color} bold={bold} />
                      </div>
                    ))}
                </div>
              </Card>
            );
          })}

          <Card
            title="✻ worker 2"
            dot={C.hot}
            glow={flagged ? 1 - p(34.6, 35.2) : 0}
            style={{
              position: "absolute",
              left: w2.x,
              top: w2.y,
              width: w2.w,
              height: w2.h,
              opacity: sp(32.7, 13),
              scale: String(0.8 + 0.2 * sp(32.7, 13)),
              borderColor: t >= 33.1 && !flagged ? C.red : undefined,
            }}
          >
            <div style={{ fontSize: pick(24, 22), lineHeight: 1.5 }}>
              {t >= 32.9 ? <Code text="● Edit src/api/auth.ts" /> : null}
              {t >= 33.1 ? (
                <div style={{ whiteSpace: "pre", color: C.added, textDecoration: flagged && !fixed ? `underline wavy ${C.red}` : undefined }}>
                  {"  + console.log(token)"}
                </div>
              ) : null}
              {flagged ? (
                <div
                  style={{
                    margin: "10px 0",
                    padding: "12px 16px",
                    borderRadius: 12,
                    border: `2px solid ${C.violet}`,
                    background: "rgba(169,139,255,0.10)",
                    color: C.cyan,
                    opacity: p(33.5, 33.65),
                    scale: String(0.9 + 0.1 * sp(33.5, 12)),
                    boxShadow: `0 0 ${36 * (1 - p(34.2, 35))}px rgba(169,139,255,0.65)`,
                  }}
                >
                  {FORBID_HIT}
                </div>
              ) : null}
              {(
                [
                  [34.7, "● Edit src/api/auth.ts"],
                  [34.85, "  - console.log(token)", C.red],
                  [35.0, '  + log.info("auth ok")', C.added],
                  [35.6, "✓ security/no-token-logs.md", C.added, true],
                ] as PaneLine[]
              )
                .filter(([at]) => t >= at)
                .map(([at, text, color, bold]) => (
                  <div key={at} style={{ whiteSpace: "pre", opacity: p(at, at + 0.1) }}>
                    <Code text={text} color={color} bold={bold} />
                  </div>
                ))}
            </div>
          </Card>
        </>
      )}
      <GlitchBurst at={Math.round((31.42 - start) * fps)} dur={8} />
    </AbsoluteFill>
  );
};

// ======================================================================== learn: "And it learns…"

const LEARN_PROMPT = "we never put SQL in route handlers. use the repo layer";
const LEARN_CMD ='lucid learn "Never put SQL in route handlers; use the repo layer" --paths \'src/routes/**\' --kind architecture';
// What `lucid learn` prints (bin/lucid): the slug is the rule's first six words.
const LEARN_OUT =
  "lucid: proposed .lucid/proposed/never-put-sql-in-route-handlers.md. It does nothing until a PR moves it into .claude/rules/ (/lucid:learn promote).";

const RULE_FILES = [
  { at: 41.6, icon: "🏛️", kind: "Architecture", file: "architecture/no-sql-in-routes.md", meta: ["paths", "[src/routes/**]"], title: "Never put SQL in route handlers" },
  { at: 42.2, icon: "🔐", kind: "Security", file: "security/no-token-logs.md", meta: ["forbid", "'console\\.log\\(.*token'"], title: "Never log auth tokens" },
  { at: 43.12, icon: "📏", kind: "Conventions", file: "convention/money-in-cents.md", meta: ["review", "true"], title: "Money is integer cents" },
];

export const Learn: React.FC<{ start: number }> = ({ start }) => {
  const { t, p, sp } = useClock(start);
  const { portrait, pick } = useLayout();
  const { fps } = useVideoConfig();
  const up = p(37.45, 37.8); // the headline moves to the top
  const chatOut = p(41.35, 41.6);
  const nPrompt = Math.round(interpolate(t, [37.65, 38.35], [0, LEARN_PROMPT.length], clamp));
  const nCmd = Math.round(interpolate(t, [38.95, 39.45], [0, LEARN_CMD.length], clamp));
  const pr = t >= 44.2;

  return (
    <AbsoluteFill>
      <Sky intensity={1.1} />
      {/* "And it learns." */}
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <div
          style={{
            ...head(pick(150, 130)),
            scale: String((1 + 0.5 * (1 - sp(36.3, 10))) * (1 - 0.55 * up)),
            translate: `0 ${up * pick(-445, -745)}px`,
            whiteSpace: "nowrap",
          }}
        >
          And it <span style={gradientText}>learns.</span>
        </div>
      </AbsoluteFill>

      {/* correct an agent once */}
      {t >= 37.6 && chatOut < 1 ? (
        <AbsoluteFill style={{ alignItems: "center", paddingTop: pick(250, 420), opacity: 1 - chatOut }}>
          <Card title="✻ claude" right="~/shop" dot={C.cyan} style={{ width: pick(1300, 960), scale: String(sp(37.6, 13)) }}>
            <div style={{ fontSize: pick(28, 23), lineHeight: 1.6 }}>
              <div style={{ whiteSpace: "pre-wrap" }}>
                <span style={{ color: C.pink }}>❯ </span>
                {LEARN_PROMPT.slice(0, nPrompt)}
              </div>
              {t >= 38.95 ? (
                <div style={{ whiteSpace: "pre-wrap", marginTop: 10 }}>
                  <span style={{ color: C.cyan }}>● </span>
                  <span style={{ color: C.fg }}>Bash </span>
                  <span style={{ color: C.accent }}>{LEARN_CMD.slice(0, nCmd)}</span>
                </div>
              ) : null}
              {t >= 39.6 ? (
                <div style={{ whiteSpace: "pre-wrap", color: C.muted, marginTop: 6, opacity: p(39.6, 39.75) }}>
                  {"  "}
                  {LEARN_OUT}
                </div>
              ) : null}
            </div>
          </Card>
        </AbsoluteFill>
      ) : null}

      {/* architecture · security · conventions */}
      {t >= 41.5 ? (
        <AbsoluteFill
          style={{
            flexDirection: portrait ? "column" : "row",
            justifyContent: portrait ? "flex-start" : "center",
            alignItems: portrait ? "center" : "flex-start",
            gap: pick(36, 26),
            paddingTop: pick(200, 330),
          }}
        >
          {RULE_FILES.map((r, i) => {
            const pop = sp(r.at, 11);
            const on = t >= r.at;
            return (
              <div
                key={r.file}
                style={{
                  width: pick(560, 920),
                  height: pick(310, 240),
                  borderRadius: 26,
                  padding: 3,
                  background: C.lid,
                  opacity: on ? Math.min(1, pop * 2) : 0,
                  scale: String((0.6 + 0.4 * pop) * (pr ? 1 - 0.08 * p(44.2, 44.5) : 1)),
                  rotate: `${(1 - pop) * (i - 1) * 8}deg`,
                  boxShadow: "0 40px 90px -30px rgba(0,0,0,0.9)",
                }}
              >
                <div style={{ width: "100%", height: "100%", borderRadius: 23, background: C.surface, padding: pick("22px 26px", "18px 26px"), display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <span style={{ fontSize: pick(54, 46) }}>{r.icon}</span>
                    <span style={head(pick(50, 46))}>{r.kind}</span>
                  </div>
                  <div style={{ fontFamily: fonts.mono, fontSize: pick(21, 21), color: C.muted }}>.claude/rules/{r.file}</div>
                  <div style={{ fontFamily: fonts.mono, fontSize: pick(22, 22) }}>
                    <span style={{ color: C.cyan }}>{r.meta[0]}:</span> <span style={{ color: C.fg }}>{r.meta[1]}</span>
                  </div>
                  <div style={{ fontFamily: fonts.body, fontWeight: 600, fontSize: pick(30, 30), color: C.fg }}># {r.title}</div>
                </div>
              </div>
            );
          })}
        </AbsoluteFill>
      ) : null}

      {/* approved in a PR, followed by every agent */}
      {pr ? (
        <>
          <div
            style={{
              position: "absolute",
              left: pick(460, 80),
              top: pick(570, 1180),
              width: pick(1000, 920),
              padding: "22px 30px",
              borderRadius: 22,
              background: C.raised,
              border: `2px solid ${C.lineStrong}`,
              boxShadow: "0 30px 80px -30px rgba(0,0,0,0.9)",
              scale: String(sp(44.2, 12)),
              display: "flex",
              alignItems: "center",
              gap: 22,
            }}
          >
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: fonts.mono, fontSize: 22, color: C.muted }}>pull request · 3 files in .claude/rules/</div>
              <div style={head(pick(46, 42))}>Add 3 team rules</div>
            </div>
            {t >= 44.9 ? (
              <div
                style={{
                  fontFamily: fonts.body,
                  fontWeight: 600,
                  fontSize: 30,
                  color: "#fff",
                  background: "#8250df",
                  padding: "10px 22px",
                  borderRadius: 999,
                  scale: String(sp(44.9, 10)),
                }}
              >
                Merged
              </div>
            ) : null}
            {t >= 44.4 ? (
              <div
                style={{
                  position: "absolute",
                  right: pick(24, 20),
                  top: pick(-66, -62),
                  rotate: "-8deg",
                  scale: String(1 + 1.2 * (1 - sp(44.4, 9))),
                  border: `6px solid ${C.added}`,
                  borderRadius: 12,
                  padding: "2px 18px",
                  background: "rgba(14,10,40,0.7)",
                  ...head(pick(46, 42), { color: C.added }),
                }}
              >
                ✓ APPROVED
              </div>
            ) : null}
          </div>
          <div
            style={{
              position: "absolute",
              left: 0,
              width: pick(1920, 1080),
              top: pick(800, 1350),
              flexDirection: pick("row", "column") as React.CSSProperties["flexDirection"],
              alignItems: "center",
              display: "flex",
              justifyContent: "center",
              gap: pick(90, 18),
            }}
          >
            {(
              [
                ["lead", 45.6],
                ["worker 1", 45.8],
                ["worker 2", 46.0],
              ] as const
            ).map(([name, at]) => {
              const lit = t >= at;
              const ring = p(at, at + 0.5);
              return (
                <div key={name} style={{ display: "flex", alignItems: "center", gap: 14, opacity: p(45.4, 45.6) }}>
                  <div style={{ position: "relative", width: 34, height: 34 }}>
                    {lit ? (
                      <div style={{ position: "absolute", inset: -24 * ring, borderRadius: "50%", border: "3px solid #fff", opacity: 1 - ring }} />
                    ) : null}
                    <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "5px solid #a98bff", background: lit ? C.cyan : C.surface, boxShadow: lit ? "0 0 18px #6ff3ff" : undefined }} />
                  </div>
                  <div style={{ fontFamily: fonts.mono, fontWeight: 700, fontSize: pick(30, 28), color: C.fg }}>
                    {name} {lit ? <span style={{ color: C.added }}>✓ 3 rules</span> : null}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : null}
      <GlitchBurst at={Math.round((41.55 - start) * fps)} dur={6} />
    </AbsoluteFill>
  );
};

// ======================================================================== receipts: cost only

export const Receipts: React.FC<{ start: number }> = ({ start }) => {
  const { t, p, sp } = useClock(start);
  const { pick } = useLayout();
  const { fps } = useVideoConfig();
  const title = sp(47.15, 10);
  const up = p(47.75, 48.05);
  const land = 48.6; // "4.5"
  const k = p(land - 0.35, land + 0.05);
  const landed = sp(land, 8);
  const bars = [
    { at: 48.9, label: "with lucid", value: "$1.01", frac: 1.01 / 4.57, win: true },
    { at: 49.05, label: "without", value: "$4.57", frac: 1, win: false },
  ];
  return (
    <AbsoluteFill>
      <Sky intensity={0.9} />
      <Jolt at={[Math.round((land - start) * fps)]} amp={16}>
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
          <div
            style={{
              ...head(pick(150, 130)),
              translate: `0 ${up * pick(-410, -720)}px`,
              scale: String((1 + 0.6 * (1 - title)) * (1 - 0.55 * up)),
              textShadow: rgb(Math.round(12 * (1 - p(47.15, 47.5)))),
              whiteSpace: "nowrap",
            }}
          >
            THE RECEIPTS 🧾
          </div>
        </AbsoluteFill>
        {t >= 47.95 ? (
          <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", paddingTop: pick(110, 40), opacity: Math.min(1, sp(47.95, 14) * 1.5) }}>
            <div style={{ fontFamily: fonts.body, fontWeight: 600, fontSize: pick(44, 42), letterSpacing: "0.12em", color: C.muted, textAlign: "center" }}>
              CHEAPER PER WORKING RESULT
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 24 }}>
              <span style={{ ...head(pick(70, 64)), color: C.muted, opacity: p(48.2, 48.4) }}>up to</span>
              <span
                style={{
                  ...head(pick(270, 230)),
                  ...gradientText,
                  display: "inline-block",
                  scale: String(t >= land ? 1 + 0.25 * (1 - landed) : 1),
                  filter: `drop-shadow(0 0 ${t >= land ? 40 * (1 - p(land, land + 0.6)) : 0}px rgba(169,139,255,0.9))`,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {(1 + 3.5 * k).toFixed(1)}×
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 18, marginTop: pick(10, 20) }}>
              {bars.map((b) => (
                <div key={b.label} style={{ display: "flex", alignItems: "center", gap: 22, opacity: t >= b.at ? 1 : 0 }}>
                  <div style={{ width: pick(200, 180), fontFamily: fonts.mono, fontSize: 28, color: b.win ? C.fg : C.muted, textAlign: "right" }}>{b.label}</div>
                  <div style={{ width: pick(900, 560), height: 30, borderRadius: 15, background: C.raised, overflow: "hidden" }}>
                    <div
                      style={{
                        width: `${100 * b.frac * p(b.at, b.at + 0.5)}%`,
                        height: "100%",
                        borderRadius: 15,
                        background: b.win ? C.lid : "linear-gradient(90deg, #5b2a4a, #ff5c7a)",
                        boxShadow: b.win ? "0 0 24px rgba(169,139,255,0.6)" : undefined,
                      }}
                    />
                  </div>
                  <div style={{ width: pick(130, 120), fontFamily: fonts.mono, fontWeight: 700, fontSize: pick(32, 30), color: b.win ? C.added : C.red }}>{b.value}</div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: pick(30, 34), fontFamily: fonts.body, fontSize: pick(28, 30), color: C.muted, opacity: p(49.3, 49.6), textAlign: "center", maxWidth: pick(1500, 900) }}>
              Claude Opus 5.5 · cost per passing run · without lucid, 4 of 5 runs missed the plan change
            </div>
          </AbsoluteFill>
        ) : null}
        <GlitchBurst at={Math.round((47.95 - start) * fps)} dur={6} />
      </Jolt>
    </AbsoluteFill>
  );
};

// ======================================================================== CTA

const CHIPS = ["0 dependencies", "Python stdlib", "MIT licensed", "Claude Code plugin"];

export const Cta: React.FC<{ start: number }> = ({ start }) => {
  const { t, p, sp } = useClock(start);
  const { pick } = useLayout();
  const { fps } = useVideoConfig();
  const out = p(T.go - 0.05, T.go + 0.2);
  const lock = sp(T.go, 11);
  const cmd1 = "/plugin marketplace add Redskull-127/lucid";
  const cmd2 = "/plugin install lucid@lucid";
  const n1 = Math.round(interpolate(t, [T.cta + 0.1, T.cta + 0.75], [0, cmd1.length], clamp));
  const n2 = Math.round(interpolate(t, [T.cta + 0.85, T.cta + 1.3], [0, cmd2.length], clamp));
  return (
    <AbsoluteFill>
      <Sky intensity={1.1} />
      {t < T.go + 0.25 ? (
        <AbsoluteFill style={{ alignItems: "center", paddingTop: pick(190, 400), opacity: 1 - out, scale: String(1 - 0.1 * out) }}>
          <div style={{ ...head(pick(84, 84)), marginBottom: pick(40, 50), scale: String(sp(T.cta + 0.02, 11)) }}>
            Two commands.
          </div>
          <Card title="claude" right="~/your-project" dot={C.cyan} style={{ width: pick(1240, 960), scale: String(sp(T.cta + 0.05, 13)) }}>
            <div style={{ fontSize: pick(34, 25), lineHeight: 1.7 }}>
              <div style={{ whiteSpace: "pre" }}>
                <span style={{ color: C.pink }}>❯ </span>
                {cmd1.slice(0, n1)}
                {t < T.cta + 0.8 ? <span style={{ color: C.cyan }}>▍</span> : null}
              </div>
              {t >= T.cta + 0.85 ? (
                <div style={{ whiteSpace: "pre" }}>
                  <span style={{ color: C.pink }}>❯ </span>
                  {cmd2.slice(0, n2)}
                  {t < T.cta + 1.35 ? <span style={{ color: C.cyan }}>▍</span> : null}
                </div>
              ) : null}
              {t >= T.cta + 1.4 ? <div style={{ color: C.added, fontWeight: 700, opacity: p(T.cta + 1.4, T.cta + 1.5) }}>✓ installed</div> : null}
            </div>
          </Card>
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 18, marginTop: pick(44, 50), maxWidth: pick(1600, 900) }}>
            {CHIPS.map((c, i) => {
              const pop = sp(T.cta + 1.5 + i * 0.15, 11);
              return (
                <div
                  key={c}
                  style={{
                    fontFamily: fonts.body,
                    fontWeight: 600,
                    fontSize: pick(36, 38),
                    color: C.fg,
                    padding: "12px 28px",
                    borderRadius: 999,
                    border: `2px solid ${C.lineStrong}`,
                    background: C.raised,
                    opacity: t >= T.cta + 1.5 + i * 0.15 ? 1 : 0,
                    scale: String(0.5 + 0.5 * pop),
                  }}
                >
                  {i === 0 ? <span style={{ color: C.added }}>0</span> : null}
                  {i === 0 ? c.slice(1) : c}
                </div>
              );
            })}
          </div>
        </AbsoluteFill>
      ) : null}

      {/* end lockup */}
      {t >= T.go ? (
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: pick(10, 26), paddingBottom: pick(40, 120) }}>
          <div style={{ scale: String(0.4 + 0.6 * lock), opacity: Math.min(1, lock * 2) }}>
            <Eye width={pick(340, 460)} glow={1 + 0.3 * Math.sin((t - T.go) * 5)} sparkles={0.6 + 0.4 * Math.abs(Math.sin((t - T.go) * 2.4))} />
          </div>
          <div style={{ ...head(pick(190, 170)), scale: String(0.5 + 0.5 * lock), textShadow: rgb(Math.round(12 * (1 - p(T.go, T.go + 0.4)))) }}>
            Go <span style={gradientText}>lucid.</span>
          </div>
          <div style={{ fontFamily: fonts.mono, fontWeight: 700, fontSize: pick(46, 46), color: C.fg, opacity: p(T.go + 0.35, T.go + 0.6), marginTop: pick(10, 20) }}>
            lucid.meertarbani.in
          </div>
          <div style={{ fontFamily: fonts.mono, fontSize: pick(30, 32), color: C.muted, opacity: p(T.go + 0.55, T.go + 0.8) }}>
            github.com/Redskull-127/lucid
          </div>
        </AbsoluteFill>
      ) : null}
      <GlitchBurst at={Math.round((T.go - start) * fps)} dur={8} />
    </AbsoluteFill>
  );
};
