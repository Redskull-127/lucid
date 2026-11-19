import Link from "next/link";
import { CopyButton } from "@/components/copy-button";
import { HeroEye } from "@/components/hero-eye";
import { GitHubMark } from "@/components/site-header";
import { ThemedFigure } from "@/components/themed-image";
import { INSTALL, SITE } from "@/lib/site";

const PROBLEMS = [
  { term: "Plan drift", why: "Running workers keep following the plan they started with." },
  { term: "Lossy handoffs", why: "Summaries drop the why and the dead ends." },
  { term: "Repeated work", why: "Every worker re-reads the same code." },
  { term: "Compaction amnesia", why: "Decisions vanish after /compact and in new sessions." },
  { term: "Overwritten work", why: "Two agents edit one file, and one of them loses." },
];

const LIFECYCLE = [
  { title: "Every agent starts with the whole dream", text: "Plan, memory and claims at start, and again after /compact." },
  { title: "Before each action, only what changed", text: "Nothing new means nothing injected, at zero tokens." },
  { title: "Claimed files stay locked", text: "Writes to another agent’s files are blocked, via Edit or Bash." },
  { title: "Nothing finishes silently", text: "An agent that edited but logged nothing is asked once for notes." },
];

const FILES = [
  { name: "plan.md", text: "The live plan. Every edit reaches running agents." },
  { name: "log.jsonl", text: "Decisions, facts with evidence, dead ends and claims. Outdated facts get flagged." },
  { name: "digest.md", text: "A tidy summary written by /lucid:dream." },
];

const RULES = [
  { title: "Checked on every edit", text: "A forbid pattern runs on the lines an agent adds. A hit comes back with the edit, never as a blocked write." },
  { title: "Reviewed before the turn ends", text: "Judgment rules are checked against the diff, once per turn, for the files it touched." },
  { title: "Learned, then approved in a PR", text: "Corrections, PR review threads and swarm lessons become proposals your team merges like code." },
  { title: "One set of rules for every tool", text: "Exported to AGENTS.md for Codex, Copilot, Cursor and review bots. lucid rules shows what each rule caught." },
];

const LIMITS = [
  { title: "More agents, more tokens", text: "lucid saves rework, not per-agent cost." },
  { title: "Decoupled work only", text: "Keep tightly coupled changes with one agent." },
  { title: "Parity cases", text: "One agent across sessions, or a change told to the lead in chat: Claude Code already handles these." },
  { title: "Bash writes are a heuristic", text: "Common write patterns are caught, not all of them." },
  { title: "Rule reviews are self-checks", text: "A review round is a prompt, not proof. Keep human review and CI." },
  { title: "macOS and Linux", text: "POSIX only, for file locking." },
];

function InstallBlock() {
  const both = `${INSTALL.marketplace}\n${INSTALL.install}`;
  return (
    <div className="install-line">
      <code>
        <span className="block">{INSTALL.marketplace}</span>
        <span className="block">{INSTALL.install}</span>
      </code>
      <CopyButton text={both} what="install commands" />
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
            <h1 id="hero-title" className="display text-[clamp(2.6rem,1.6rem+4vw,4.5rem)] text-balance">
              One shared dream for every Claude
            </h1>
            <p className="lede mt-5 max-w-[30rem]">
              A live plan and shared memory for Claude Code agents. Change it mid-build, and every running worker sees
              it before its next step. Plus team rules every agent is checked against, learned from your reviews.
            </p>
            <div className="mt-8 max-w-[30rem]">
              <InstallBlock />
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/docs/quick-start" className="btn btn-primary">
                Read the docs
              </Link>
              <a href={SITE.github} className="btn btn-ghost">
                <GitHubMark />
                GitHub
              </a>
            </div>
          </div>

          <div className="min-w-0">
            <HeroEye />
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- video */}
      <section className="mx-auto w-full max-w-[64rem] px-4 pt-20 sm:px-6 lg:px-8 lg:pt-28" aria-labelledby="video-title">
        <h2 id="video-title" className="section-title text-center">
          lucid in under a minute
        </h2>
        <figure className="plate mt-8">
          {/* Captions are burned in. preload="none": nothing downloads until play. */}
          <video
            className="block aspect-video h-auto w-full bg-[#0e0a28]"
            controls
            playsInline
            preload="none"
            poster="/video/lucid-poster.jpg"
          >
            <source src="/video/lucid.mp4" type="video/mp4" />
          </video>
          <figcaption>Voice, music and sound effects made with ElevenLabs.</figcaption>
        </figure>
      </section>

      {/* ---------------------------------------------------------------- problem */}
      <section className="mx-auto w-full max-w-[84rem] px-4 py-20 sm:px-6 lg:px-8 lg:py-28" aria-labelledby="problem-title">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:gap-16">
          <div>
            <h2 id="problem-title" className="section-title">
              Change your mind mid-build, and parallel agents drift apart
            </h2>
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
              Each feature’s dream lives in <code>.lucid/dreams/&lt;feature&gt;/</code>, out of git, until the feature
              merges. Hooks read it into every agent, so nobody forgets to check it.
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
              alt="You edit the feature's plan.md (.lucid/dreams/<feature>/); hooks inject the full dream into every agent on start and only what changed before each tool call; agents write back with lucid note and lucid claim."
            />
          </div>

          <ol className="mt-12 grid gap-x-10 gap-y-10 md:grid-cols-2 xl:grid-cols-4" aria-label="When the hooks run">
            {LIFECYCLE.map((s) => (
              <li key={s.title}>
                <div className="lid-rule mb-4 w-12" />
                <h3 className="font-display text-[1.2rem] font-semibold leading-snug tracking-[-0.01em]">
                  {s.title}
                </h3>
                <p className="mt-2 text-[0.975rem] text-muted">{s.text}</p>
              </li>
            ))}
          </ol>

          <p className="mt-12 text-[0.975rem]">
            <Link href="/docs/how-it-works" className="link">
              How it works, in detail
            </Link>
          </p>
        </div>
      </section>

      {/* ---------------------------------------------------------------- team rules */}
      <section className="border-b border-line" aria-labelledby="rules-title">
        <div className="mx-auto grid w-full max-w-[84rem] gap-10 px-4 py-20 sm:px-6 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:gap-16 lg:px-8 lg:py-28">
          <div>
            <h2 id="rules-title" className="section-title">
              AGENTS.md is advice. Team rules get checked.
            </h2>
            <p className="lede mt-4">
              Write a rule once in <code>.claude/rules/</code>. Claude Code loads it when an agent touches matching files,
              and lucid checks it, reviews against it and learns new ones.
            </p>
            <p className="mt-6 text-[0.975rem]">
              <Link href="/docs/team-rules" className="link">
                Team rules, in detail
              </Link>
            </p>
          </div>
          <dl className="border-t border-line">
            {RULES.map((r) => (
              <div
                key={r.title}
                className="grid gap-1 border-b border-line py-5 sm:grid-cols-[15rem_minmax(0,1fr)] sm:gap-6"
              >
                <dt className="font-display text-[1.2rem] font-semibold tracking-[-0.01em]">{r.title}</dt>
                <dd className="text-muted">{r.text}</dd>
              </div>
            ))}
          </dl>
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
                <strong className="display text-[clamp(3.25rem,2.4rem+3vw,4.75rem)] leading-[1.05]">54/54</strong>
                <span className="text-muted">passed with lucid</span>
              </p>
              <p className="contents">
                <strong className="display text-[clamp(3.25rem,2.4rem+3vw,4.75rem)] leading-[1.05] text-muted">
                  12/54
                </strong>
                <span className="text-muted">passed without</span>
              </p>
            </div>
            <p className="mt-6 text-muted">Haiku 5.5 and Opus 5.5, in a small repo and a 12k-file monorepo, scored by a hidden acceptance test.</p>
            <ul className="mt-8 space-y-3 border-t border-line pt-6 text-[0.975rem] text-muted">
              <li>
                In a 12k-file monorepo, workers without lucid missed <strong className="text-fg">23 of 28</strong> plan
                changes.
              </li>
              <li>
                Per working run on Opus: <strong className="text-fg">$1.01 vs $4.57</strong>.
              </li>
              <li>About +$0.002 (Haiku) to +$0.026 (Opus) per run when there’s nothing to coordinate.</li>
            </ul>
            <p className="mt-6 text-[0.975rem]">
              <Link href="/docs/benchmark" className="link">
                Methodology, all charts and caveats
              </Link>
            </p>
          </div>

          <div className="flex min-w-0 flex-col gap-6">
            <ThemedFigure
              name="bench-headline"
              width={760}
              height={354}
              alt="When the plan changes mid-build, with vs without lucid (Haiku and Opus pooled): demo repo early change 13/13 vs 5/13, late change 13/13 vs 2/13; private monorepo early change 13/13 vs 2/13, late change 15/15 vs 3/15"
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
