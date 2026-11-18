"use client";

import { useState, type CSSProperties, type ReactNode } from "react";

/*
  The hero, as one ~5 s story that plays once (then holds; Replay restarts it):
  a worker is mid-task -> you add a line to the plan -> lucid carries it around the eye to every running agent
  -> it lands in this worker before its next tool call -> the worker applies it and logs why.
  Timing lives here (CSS custom property --d per element); motion lives in globals.css under .hero-*.
  With prefers-reduced-motion, the final state renders at once.
*/
const T = {
  read: 0.55,
  edit: 0.95,
  tick1: 1.3,
  card: 1.45,
  type: 1.6,
  beam: 2.3,
  sweep: 2.6,
  corners: 2.9, // the pulse reaches the lead and worker 1
  worker2: 3.2, // ...and this worker
  edit2: 4.1,
  tick2: 4.35,
  note: 4.55,
  applied: 4.8,
  replay: 4.95,
};

// Verbatim from the README's "Seen in a real run": what a running worker received before its next tool call.
const INJECTED: [string, string][] = [
  ["[lucid] 1 update(s) from other agents since you last looked:", "tok-cmd"],
  ["#3 PLAN CHANGED by user:", "tok-head"],
  ["@@ -3 +3,2 @@", "tok-meta"],
  [" - add a one-line docstring to every function in calc.py", ""],
  ["+- ALSO add multiply() to calc.py", "tok-add"],
];

const at = (s: number, s2?: number) => ({ "--d": `${s}s`, ...(s2 ? { "--d2": `${s2}s` } : {}) }) as CSSProperties;

function Sparkle({ x, y, r }: { x: number; y: number; r: number }) {
  const k = r * 0.22;
  return (
    <path
      d={`M${x} ${y - r} L${x + k} ${y - k} L${x + r} ${y} L${x + k} ${y + k} L${x} ${y + r} L${x - k} ${y + k} L${x - r} ${y} L${x - k} ${y - k} Z`}
      fill="currentColor"
    />
  );
}

/** An agent on the lid: its ring pulses as the plan change reaches it, then its core lights up. */
function Agent({ x, y, label, when, dx = 0 }: { x: number; y: number; label: string; when: number; dx?: number }) {
  return (
    <g style={at(when)}>
      <circle className="hero-ring" cx={x} cy={y} r="12" />
      <circle cx={x} cy={y} r="13" fill="var(--surface)" stroke="url(#lid)" strokeWidth="3" />
      <circle className="hero-core" cx={x} cy={y} r="5.5" />
      <text className="hero-agent" x={x + dx} y={y + 38} textAnchor="middle">
        {label}
      </text>
    </g>
  );
}

function Tool({ name, children, when }: { name: string; children?: ReactNode; when: number }) {
  return (
    <span className="line hero-in" style={at(when)}>
      <span className="hero-bullet">●</span> <span className="tok-cmd">{name}</span>
      {children}
    </span>
  );
}

const LID = "M150 512 Q512 122 874 512 Q512 902 150 512 Z";

/** The icon's eye, drawn large: a plan change travels around it to every agent and into the running worker. */
export function HeroEye() {
  const [run, setRun] = useState(0);
  return (
    <figure className="m-0">
      <div key={run} className="hero-fig relative mx-auto w-full max-w-[40rem] lg:aspect-[804/600]">
        <svg
          aria-hidden="true"
          className="absolute inset-0 hidden h-full w-full lg:block"
          viewBox="110 150 804 600"
          fill="none"
        >
          <defs>
            <linearGradient id="lid" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" style={{ stopColor: "var(--lid-a)" }} />
              <stop offset="0.5" style={{ stopColor: "var(--lid-b)" }} />
              <stop offset="1" style={{ stopColor: "var(--lid-c)" }} />
            </linearGradient>
          </defs>
          <path className="eye-halo" stroke="url(#lid)" d={LID} />
          <path className="eye-lid eye-draw" stroke="url(#lid)" d={LID} />
          {/* the plan change: from your plan.md into the eye, then around the lid both ways */}
          <path className="hero-beam" pathLength={1} style={at(T.beam)} d="M598 262 C 572 292, 545 309, 514 317" />
          <path className="hero-sweep hero-sweep-fwd" pathLength={1000} style={at(T.sweep)} d={LID} />
          <path className="hero-sweep hero-sweep-back" pathLength={1000} style={at(T.sweep)} d={LID} />
          <Agent x={150} y={512} label="lead" when={T.corners} dx={-4} />
          <Agent x={874} y={512} label="worker 1" when={T.corners} dx={9} />
          <Agent x={512} y={707} label="worker 2" when={T.worker2} />
          <g style={{ color: "var(--sparkle)" }} opacity="0.85">
            <Sparkle x={512} y={205} r={30} />
            <Sparkle x={236} y={318} r={17} />
            <Sparkle x={792} y={318} r={17} />
          </g>
        </svg>

        {/* you, editing the plan mid-build */}
        <div className="plan-card hero-pop mb-3 lg:absolute lg:left-[57%] lg:top-[2.5%] lg:mb-0 lg:w-[41%]" style={at(T.card)}>
          <div className="plan-bar">
            <span className="font-mono text-fg">plan.md</span>
            <span>you, mid-build</span>
          </div>
          <pre>
            <code>
              <span className="line tok-meta">- docstrings in calc.py</span>
              <span className="line tok-add hero-type" style={at(T.type)}>
                + ALSO add multiply() to calc.py
              </span>
            </code>
          </pre>
        </div>

        {/* worker 2's session: busy, gets the update before its next tool call, applies it */}
        <div className="relative lg:absolute lg:left-1/2 lg:top-[60.3%] lg:w-[82%] lg:-translate-x-1/2 lg:-translate-y-1/2">
          <div className="terminal">
            <div className="terminal-bar">
              <span className="hero-live inline-block h-2 w-2 rounded-full" style={{ background: "var(--lid-a)" }} />
              <span>
                worker 2 <span className="text-line-strong">·</span> calc.py
              </span>
              <span className="hero-pill" aria-hidden="true">
                <span className="hero-st hero-st-run" style={at(T.worker2 - 0.12)}>
                  running
                </span>
                <span className="hero-st hero-st-inj" style={at(T.worker2 + 0.05, T.applied - 0.12)}>
                  plan change injected
                </span>
                <span className="hero-st hero-st-done" style={at(T.applied + 0.05)}>
                  applied ✓
                </span>
              </span>
            </div>
            <pre className="hero-pre">
              <code className="hero-window">
                <span className="hero-feed">
                  <Tool name="Read" when={T.read}>
                    (calc.py)
                  </Tool>
                  <Tool name="Edit" when={T.edit}>
                    (calc.py) <span className="tok-meta">add docstrings</span>{" "}
                    <span className="hero-tick hero-in" style={at(T.tick1)}>
                      ✓
                    </span>
                  </Tool>
                  <span className="hero-inject" style={at(T.worker2 + 0.45)}>
                    {INJECTED.map(([text, cls], i) => (
                      <span key={i} className={`line hero-in ${cls}`} style={at(T.worker2 + i * 0.1)}>
                        {text}
                      </span>
                    ))}
                  </span>
                  <Tool name="Edit" when={T.edit2}>
                    (calc.py) <span className="tok-add">add multiply()</span>{" "}
                    <span className="hero-tick hero-in" style={at(T.tick2)}>
                      ✓
                    </span>
                  </Tool>
                  <Tool name="Bash" when={T.note}>
                    (lucid note decision &quot;added multiply(): plan #3&quot;)
                  </Tool>
                </span>
              </code>
            </pre>
          </div>
        </div>
      </div>
      <figcaption className="sr-only">
        A running worker is editing calc.py when you add a line to the plan. lucid sends the change to every running
        agent, and the worker receives it before its next tool call, adds multiply() and logs the decision.
      </figcaption>
      <div className="mt-3 flex justify-end">
        <button
          key={run}
          type="button"
          className="hero-replay"
          style={at(T.replay)}
          onClick={() => setRun((r) => r + 1)}
        >
          ↻ Replay
        </button>
      </div>
    </figure>
  );
}
