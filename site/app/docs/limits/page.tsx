import Link from "next/link";
import { DocHeader, H2, H3, docMetadata } from "@/components/doc";

export const metadata = docMetadata("/docs/limits");

const FAQ = [
  {
    id: "spawn",
    q: "Does lucid spawn agents?",
    a: (
      <>
        No. It keeps the agents Claude Code spawns in sync: the lead, its subagents and{" "}
        <Link href="/docs/agent-teams">Agent-Teams teammates</Link>.
      </>
    ),
  },
  {
    id: "tokens",
    q: "Does it cost tokens when nothing changed?",
    a: (
      <>
        No. Before each tool call an agent gets only what other agents wrote since it last looked; when that’s nothing,
        nothing is injected. With nothing to coordinate, the measured overhead was +$0.002 and +5 s per run on Haiku,
        and +$0.026 (+7%) and +6 s on Opus.
      </>
    ),
  },
  {
    id: "other-projects",
    q: "Does it slow down projects that don’t use it?",
    a: (
      <>
        No. Until a project runs <code>lucid init</code>, a tiny shell guard checks for <code>.lucid/</code> and exits
        without starting Python.
      </>
    ),
  },
  {
    id: "human-notes",
    q: "Can I add notes myself?",
    a: (
      <>
        Yes. Run <code>lucid note</code> from your own terminal; your notes reach agents as coming from{" "}
        <code>human</code>. See the <Link href="/docs/cli#note">CLI reference</Link>.
      </>
    ),
  },
  {
    id: "editor",
    q: "Can I edit the plan in my editor?",
    a: (
      <>
        Yes. Plan edits made outside Claude’s tools are picked up and attributed to <code>user</code>, and running agents
        get the diff before their next tool call. <code>/lucid:replan</code> does the same from inside Claude Code and
        also logs the decision.
      </>
    ),
  },
  {
    id: "compact",
    q: "What happens after /compact?",
    a: (
      <>
        The dream is injected again. In a real run, after a compaction the lead quoted a log entry word for word, from
        the re-injected dream rather than the summary.
      </>
    ),
  },
  {
    id: "single-agent",
    q: "Is it worth it with a single agent?",
    a: (
      <>
        Across sessions, Claude Code’s built-in auto-memory already carries a policy forward, and the benchmark shows
        parity there. lucid earns its keep when several agents work at once.
      </>
    ),
  },
  {
    id: "worktrees",
    q: "Does it work with git worktrees?",
    a: (
      <>
        Yes. Worktrees share the main checkout’s dream. For a worktree outside the repo, set{" "}
        <Link href="/docs/configuration">LUCID_ROOT</Link>.
      </>
    ),
  },
  {
    id: "merge",
    q: "What if two people append to the log on different branches?",
    a: (
      <>
        <code>lucid init</code> sets <code>log.jsonl merge=union</code> in <code>.lucid/.gitattributes</code>, so two
        people appending never conflict.
      </>
    ),
  },
  {
    id: "windows",
    q: "Does it run on Windows?",
    a: <>No. lucid is POSIX only (macOS and Linux), because the log uses <code>flock</code> for locking.</>,
  },
];

export default function Limits() {
  return (
    <>
      <DocHeader title="Limits & FAQ">What lucid doesn’t do, measured where possible.</DocHeader>

      <H2 id="limits">Honest limits</H2>
      <ul>
        <li>
          <strong>More agents still means more tokens.</strong> lucid cuts repeated exploration and re-explaining, not
          the cost of running each instance.
        </li>
        <li>
          <strong>Parallelism helps decoupled work.</strong> Keep tightly coupled changes with a single agent;{" "}
          <code>/lucid:swarm</code> says so too.
        </li>
        <li>
          <strong>Single agent across sessions:</strong> Claude Code’s built-in auto-memory already carries a policy into
          the next session, and the <Link href="/docs/benchmark">benchmark</Link> shows parity there. lucid earns its
          keep when <strong>several agents work at once</strong>.
        </li>
        <li>
          <strong>Bash write detection is a heuristic.</strong> It catches redirects, <code>tee</code>,{" "}
          <code>cp</code>/<code>mv</code>/<code>rm</code>, <code>sed -i</code> and Python writes, but not every way a
          program can write a file.
        </li>
        <li>
          <strong>POSIX only</strong> (macOS and Linux), because the log uses <code>flock</code> for locking.
        </li>
        <li>
          <strong>The benchmark is small.</strong> 3–10 runs per arm, across a small repo and one large private monorepo: a strong signal, not a paper.
        </li>
      </ul>

      <H2 id="faq">FAQ</H2>
      {FAQ.map((f) => (
        <section key={f.id} aria-labelledby={f.id}>
          <H3 id={f.id}>{f.q}</H3>
          <p>{f.a}</p>
        </section>
      ))}
    </>
  );
}
