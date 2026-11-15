import Image from "next/image";
import Link from "next/link";
import { CopyButton } from "@/components/copy-button";
import { HeroEye } from "@/components/hero-eye";
import { GitHubMark } from "@/components/site-header";
import { ThemedFigure } from "@/components/themed-image";
import { INSTALL, SITE } from "@/lib/site";

const PROBLEMS = [
  {
    term: "Plan drift",
    why: "Workers that are already running still follow the plan they were spawned with. Nothing tells them it changed.",
  },
  {
    term: "Lossy handoffs",
    why: "A subagent’s summary leaves out the why, and leaves out the “we tried X, it broke”.",
  },
  {
    term: "Repeated work",
    why: "Every worker re-reads and re-searches the same code.",
  },
  {
    term: "Compaction amnesia",
    why: "Decisions disappear when the conversation is compacted and in new sessions.",
  },
  {
    term: "Overwritten work",
    why: "Two agents edit the same file and one loses its changes.",
  },
];

const LIFECYCLE = [
  {
    hooks: "SessionStart, SubagentStart",
    title: "Every agent starts with the whole dream",
    text: "The plan, the live memory and active claims are injected within a fixed budget, also after /compact. Subagents and teammates get the full shared context instead of a one-paragraph brief.",
  },
  {
    hooks: "UserPromptSubmit, PreToolUse",
    title: "Before each action, only what changed",
    text: "An agent sees what other agents wrote since it last looked. When nothing changed, nothing is injected and it costs no tokens.",
  },
  {
    hooks: "PreToolUse on writes",
    title: "Claimed files stay locked",
    text: "A write to a file another active agent has claimed is blocked, whether it goes through Edit or Write or through Bash.",
  },
  {
    hooks: "SubagentStop, TaskCompleted",
    title: "Nothing finishes silently",
    text: "An agent that edited files but logged nothing is asked once for notes. A stopping subagent’s claims are released.",
  },
];

const FILES = [
  { name: "plan.md", text: "The live plan. When anyone edits it, every running agent gets the diff before its next tool call." },
  {
    name: "log.jsonl",
    text: "An append-only memory: decisions with why, facts with path:line evidence, dead ends, blockers and file claims.",
  },
  { name: "digest.md", text: "A consolidated summary, written when you run /lucid:dream." },
];

const LIMITS = [
  {
    title: "More agents, more tokens",
    text: "lucid cuts repeated exploration and re-explaining, not the cost of running each instance.",
  },
  {
    title: "Decoupled work only",
    text: "Parallelism helps when parts don’t touch. Keep tightly coupled changes with one agent.",
  },
  {
    title: "Parity for one agent",
    text: "Across sessions, Claude Code’s built-in memory already carries a policy forward. lucid matches it.",
  },
  {
    title: "Bash writes are a heuristic",
    text: "Redirects, tee, cp/mv/rm, sed -i and Python writes are caught, not every way a program can write.",
  },
  {
    title: "macOS and Linux",
    text: "POSIX only, because the log uses flock for locking.",
  },
];

function InstallLine({ command }: { command: string }) {
  return (
    <div className="install-line">
      <code>{command}</code>
      <CopyButton text={command} what={`command: ${command}`} />
    </div>
  );
}

export default function Home() {
  return (
    <>
      {/* ---------------------------------------------------------------- hero */}
      <section className="sky border-b border-line" aria-labelledby="hero-title">
        <div className="mx-auto grid w-full max-w-[84rem] items-center gap-12 px-4 pb-16 pt-10 sm:px-6 sm:pt-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.08fr)] lg:gap-10 lg:px-8 lg:pb-20 lg:pt-14">
          <div className="min-w-0">
            <Image
              src="/icon.png"
              alt="lucid icon: an eye with a crescent moon for a pupil, under three stars"
              width={72}
              height={72}
              preload
              className="rounded-[18px] shadow-[0_10px_40px_-12px_rgba(143,107,255,0.65)]"
            />
            <h1 id="hero-title" className="display mt-7 text-[clamp(2.6rem,1.6rem+4vw,4.5rem)] text-balance">
              One shared dream for every Claude
            </h1>
            <p className="lede mt-5 max-w-[36rem]">
              lucid is a Claude Code plugin that gives the lead agent, its subagents and Agent-Teams teammates one live
              plan, one memory and one set of file claims. Change the plan partway through, and every running worker
              sees the change before its next action.
            </p>

            <div className="mt-8 max-w-[34rem]">
              <p className="mb-2.5 text-[0.9rem] font-medium text-muted">Install in Claude Code</p>
              <div className="flex flex-col gap-2.5">
                <InstallLine command={INSTALL.marketplace} />
                <InstallLine command={INSTALL.install} />
              </div>
              <p className="mt-3 text-[0.9rem] text-muted">
                Then turn it on per project: ask Claude to run <code>lucid init</code>, or just start with <code>/lucid:swarm</code>.
              </p>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/docs/quick-start" className="btn btn-primary">
                Read the docs
              </Link>
              <a href={SITE.github} className="btn btn-ghost">
                <GitHubMark />
                View on GitHub
              </a>
            </div>
          </div>

          <div className="min-w-0">
            <HeroEye />
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- problem */}
      <section className="mx-auto w-full max-w-[84rem] px-4 py-20 sm:px-6 lg:px-8 lg:py-28" aria-labelledby="problem-title">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:gap-16">
          <div>
            <h2 id="problem-title" className="section-title">
              Change your mind mid-build, and parallel agents drift apart
            </h2>
            <p className="lede mt-4">
              You build a feature with several Claude agents working at once, then change your mind partway through.
              Here is what goes wrong.
            </p>
          </div>
          <dl className="border-t border-line">
            {PROBLEMS.map((p) => (
              <div
                key={p.term}
                className="grid gap-1 border-b border-line py-5 sm:grid-cols-[13rem_minmax(0,1fr)] sm:gap-6"
              >
                <dt className="font-display text-[1.2rem] font-semibold tracking-[-0.01em]">{p.term}</dt>
                <dd className="text-muted">{p.why}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ---------------------------------------------------------------- how it works */}
      <section className="border-y border-line bg-surface/40" aria-labelledby="how-title">
        <div className="mx-auto w-full max-w-[84rem] px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <div className="max-w-[46rem]">
            <h2 id="how-title" className="section-title">
              One dream, kept in plain files, wired in through hooks
            </h2>
            <p className="lede mt-4">
              lucid gives every agent in the project one shared memory, the dream, kept in <code>.lucid/</code>. Hooks
              read it into every agent, so nobody can forget to check it. Agents only add to the log and never rewrite
              it.
            </p>
          </div>

          <ul className="mt-10 grid gap-x-10 gap-y-5 md:grid-cols-3">
            {FILES.map((f) => (
              <li key={f.name} className="border-l-2 border-line-strong pl-4">
                <code className="text-[0.95rem]">{f.name}</code>
                <p className="mt-1.5 text-[0.975rem] text-muted">{f.text}</p>
              </li>
            ))}
          </ul>

          <div className="mt-12">
            <ThemedFigure
              name="how-it-works"
              minWidth={680}
              width={880}
              height={344}
              alt="You edit .lucid/plan.md; hooks inject the full dream into every agent on start and only what changed before each tool call; agents write back with lucid note and lucid claim."
            />
          </div>

          <ol className="mt-12 grid gap-x-10 gap-y-10 md:grid-cols-2 xl:grid-cols-4" aria-label="When the hooks run">
            {LIFECYCLE.map((s) => (
              <li key={s.title}>
                <div className="lid-rule mb-4 w-12" />
                <p className="text-[0.85rem] text-muted">{s.hooks}</p>
                <h3 className="mt-1 font-display text-[1.2rem] font-semibold leading-snug tracking-[-0.01em]">
                  {s.title}
                </h3>
                <p className="mt-2 text-[0.975rem] text-muted">{s.text}</p>
              </li>
            ))}
          </ol>

          <p className="mt-12 text-[0.975rem] text-muted">
            A fact whose cited code has changed is flagged <strong className="text-fg">⚠stale</strong>, so shared
            memory doesn’t spread outdated claims.{" "}
            <Link href="/docs/how-it-works" className="link">
              Read how it works
            </Link>
          </p>
        </div>
      </section>

      {/* ---------------------------------------------------------------- benchmark */}
      <section className="mx-auto w-full max-w-[84rem] px-4 py-20 sm:px-6 lg:px-8 lg:py-28" aria-labelledby="bench-title">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,25rem)_minmax(0,1fr)] lg:gap-14">
          <div>
            <h2 id="bench-title" className="section-title">
              When the plan changes mid-build
            </h2>
            <div className="mt-8 grid grid-cols-[auto_minmax(0,1fr)] items-baseline gap-x-5 gap-y-1">
              <p className="contents">
                <strong className="display text-[clamp(3.25rem,2.4rem+3vw,4.75rem)] leading-[1.05]">26/26</strong>
                <span className="text-muted">passed with lucid</span>
              </p>
              <p className="contents">
                <strong className="display text-[clamp(3.25rem,2.4rem+3vw,4.75rem)] leading-[1.05] text-muted">
                  7/26
                </strong>
                <span className="text-muted">passed without</span>
              </p>
            </div>
            <p className="mt-6 text-muted">
              Across Claude Haiku 5.5 and Claude Opus 5.5, through headless <code>claude -p</code>. A hidden acceptance
              test the agents never see scores the final code.
            </p>
            <ul className="mt-8 space-y-4 border-t border-line pt-6 text-[0.975rem]">
              <li>
                <strong>Without lucid, Haiku missed every late change (0/8).</strong>{" "}
                <span className="text-muted">
                  Opus did better by re-checking the plan at the end (2/5), but still missed most.
                </span>
              </li>
              <li>
                <strong>Cheaper per working result.</strong>{" "}
                <span className="text-muted">
                  On Opus, a passing run cost $1.01 vs $4.57 for early changes and $1.06 vs $2.35 for late ones.
                </span>
              </li>
              <li>
                <strong>Small overhead when there’s nothing to coordinate.</strong>{" "}
                <span className="text-muted">
                  +$0.002 and +5 s per run on Haiku, +$0.026 (+7%) and +6 s on Opus.
                </span>
              </li>
            </ul>
            <p className="mt-6 text-[0.975rem] text-muted">
              74 runs, $23.01 in total.{" "}
              <Link href="/docs/benchmark" className="link">
                Methodology, every chart and caveats
              </Link>
            </p>
          </div>

          <div className="flex min-w-0 flex-col gap-6">
            <ThemedFigure
              name="bench-success"
              width={760}
              height={516}
              alt="Task success with vs without lucid. Haiku: plan changes early 8/8 vs 4/8, late 8/8 vs 0/8, policy 4/4 vs 4/4, simple 4/4 vs 4/4. Opus: early 5/5 vs 1/5, late 5/5 vs 2/5, simple 3/3 vs 3/3"
            />
            <ThemedFigure
              name="bench-costpass-opus"
              width={760}
              height={300}
              alt="Opus 5.5 cost per passing run: plan changes early $1.01 vs $4.57, late $1.06 vs $2.35, simple task $0.37 vs $0.35"
            />
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- limits */}
      <section className="border-t border-line bg-raised/60" aria-labelledby="limits-title">
        <div className="mx-auto w-full max-w-[84rem] px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="flex flex-wrap items-baseline justify-between gap-4">
            <h2 id="limits-title" className="section-title">
              Honest limits
            </h2>
            <Link href="/docs/limits" className="link text-[0.975rem]">
              Limits and FAQ
            </Link>
          </div>
          <ul className="mt-10 grid gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-5">
            {LIMITS.map((l) => (
              <li key={l.title}>
                <h3 className="font-semibold leading-snug">{l.title}</h3>
                <p className="mt-1.5 text-[0.95rem] text-muted">{l.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
