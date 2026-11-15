import { renderLines } from "./code-block";

// Verbatim from the README's "Seen in a real run": what a running worker received before its next tool call.
const INJECTED = `[lucid] 1 update(s) from other agents since you last looked:
#3 PLAN CHANGED by user:
@@ -3 +3,2 @@
 - add a one-line docstring to every function in calc.py
+- ALSO add multiply() to calc.py`;

function Sparkle({ x, y, r }: { x: number; y: number; r: number }) {
  const k = r * 0.22;
  return (
    <path
      d={`M${x} ${y - r} L${x + k} ${y - k} L${x + r} ${y} L${x + k} ${y + k} L${x} ${y + r} L${x - k} ${y + k} L${x - r} ${y} L${x - k} ${y - k} Z`}
      fill="currentColor"
    />
  );
}

/** The icon's eye, drawn large, with the real plan-change injection as its pupil. */
export function HeroEye() {
  return (
    <figure className="m-0">
      <div className="relative mx-auto w-full max-w-[40rem] lg:aspect-[804/600]">
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
          <path className="eye-halo" stroke="url(#lid)" d="M150 512 Q512 122 874 512 Q512 902 150 512 Z" />
          <path
            className="eye-lid eye-draw"
            stroke="url(#lid)"
            d="M150 512 Q512 122 874 512 Q512 902 150 512 Z"
          />
          <g style={{ color: "var(--sparkle)" }} opacity="0.85">
            <Sparkle x={512} y={205} r={30} />
            <Sparkle x={236} y={318} r={17} />
            <Sparkle x={792} y={318} r={17} />
          </g>
        </svg>
        <div className="relative lg:absolute lg:left-1/2 lg:top-[60.3%] lg:w-[84%] lg:-translate-x-1/2 lg:-translate-y-1/2">
          <div className="terminal">
            <div className="terminal-bar">
              <span className="inline-block h-2 w-2 rounded-full" style={{ background: "var(--lid-a)" }} />
              Injected before the worker’s next tool call
            </div>
            <pre tabIndex={0} className="arrive">
              <code>{renderLines(INJECTED, "output")}</code>
            </pre>
          </div>
        </div>
      </div>
      <figcaption className="mx-auto mt-4 max-w-[34rem] text-center text-[0.9rem] leading-relaxed text-muted lg:mt-0">
        From a real <code>claude -p</code> run on Haiku. The worker’s brief never mentioned <code>multiply()</code>.
        A human added one line to the plan, and the worker added it.
      </figcaption>
    </figure>
  );
}
