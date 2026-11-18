import Link from "next/link";
import { DocHeader, H2, H3, docMetadata } from "@/components/doc";

export const metadata = docMetadata("/docs/limits");

const FAQ = [
  {
    id: "automatic",
    q: "Do I have to tell Claude to use lucid?",
    a: (
      <>
        No. Each session starts with a few lines on when lucid helps, and the skills say to use them proactively. Claude
        runs <code>/lucid:swarm</code> before parallel agents edit files, <code>/lucid:replan</code> when you change the
        plan mid-build, and <code>lucid learn</code> when you state a standing convention. In live tests it did all of
        this from prompts that never mentioned lucid. One agent on an ordinary task is told it needs none of it.
      </>
    ),
  },
  {
    id: "agents-md",
    q: "Why not just write a better AGENTS.md?",
    a: (
      <>
        Keep it: <code>lucid rules export</code> writes your team rules into it for the tools that read it. But a long
        file loaded once at the start is advice. Agents follow most rules, but rarely all of them in a long session, and
        a correction one developer makes stays on that developer’s machine. <Link href="/docs/team-rules">Team
        rules</Link> scope each rule to its files, check the mechanical ones on every edit, review the judgment ones
        against the diff, and turn corrections into rules your team approves in a PR.
      </>
    ),
  },
  {
    id: "when",
    q: "When should I use it, and when not?",
    a: (
      <>
        Use it when three or more agents build at once, the work splits cleanly by file, you can decide the interfaces
        before spawning anyone, and the plan is likely to change. Skip it for one agent working through review comments,
        for agents that only read or review, and for tasks where writing the plan costs more than it saves.
      </>
    ),
  },
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
    q: "Does it work with git worktrees and PR stacks?",
    a: (
      <>
        Yes. Each feature has its own dream, shared by every worktree on that feature, by branches stacked on it, and
        by subagents in their own worktrees. Features in different worktrees never see each other’s plans. When the
        feature’s PRs merge, its lessons become team rules. See <Link href="/docs/feature-dreams">Feature dreams</Link>.
      </>
    ),
  },
  {
    id: "merge",
    q: "What if two people append to the log on different branches?",
    a: (
      <>
        Each dream sets <code>log.jsonl merge=union</code> in its <code>.gitattributes</code>, so two
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
          program can write a file. During a swarm, a <code>git status</code> taken before and after each Bash call
          catches the rest after the fact. That adds about 0.2 s per Bash call on a 12k-file repo. If another agent writes
          during that window, the write may be blamed on the caller.
        </li>
        <li>
          <strong>lucid makes the parts fit together, not correct.</strong> In a real feature, contracts settled up front
          kept every review finding off the seams between workers, but the review still found real bugs. Keep the review
          step.
        </li>
        <li>
          <strong>Team-rule reviews are the agent checking itself.</strong> The review round makes an agent read its diff
          against the rules and answer ✓ or ✗. That catches a lot, but it’s a prompt, not proof. Keep human review and CI
          for what must hold. A <code>forbid</code> pattern is checked mechanically, but only on Edit, Write and
          MultiEdit text. Bash writes are covered by the review round, not the pattern.
        </li>
        <li>
          <strong>Checks run inside Claude Code only.</strong> Codex, Copilot and Cursor get the same rules as AGENTS.md
          text, without lucid’s checks. Rule stats are per machine.
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
