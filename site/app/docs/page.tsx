import Link from "next/link";
import { DocHeader, H2, Table, docMetadata } from "@/components/doc";
import { ThemedFigure } from "@/components/themed-image";
import { DOC_GROUPS } from "@/lib/docs";

export const metadata = docMetadata("/docs");

export default function DocsOverview() {
  return (
    <>
      <DocHeader title="lucid docs">
        lucid gives every Claude agent working on a project one shared memory, the dream: a live plan, an
        evidence-backed log and file claims. The lead agent, its subagents and Agent-Teams teammates all see it, and a
        change to the plan reaches every running worker before its next action. For the whole team, lucid also keeps{" "}
        <Link href="/docs/team-rules">team rules</Link>: conventions every agent is checked against, learned from
        corrections and PR reviews and approved in a pull request.
      </DocHeader>

      <H2 id="the-dream">What’s in the dream</H2>
      <p>
        Each feature gets its own dream: plain files in <code>.lucid/dreams/&lt;feature&gt;/</code>, kept out of git
        and shared by the feature’s worktrees, stacked branches and agents (see{" "}
        <Link href="/docs/feature-dreams">Feature dreams</Link>):
      </p>
      <Table
        keys
        head={["File", "What it holds"]}
        rows={[
          [
            <code key="p">plan.md</code>,
            "The live plan. When anyone edits it, every running agent gets the diff before its next tool call.",
          ],
          [
            <code key="l">log.jsonl</code>,
            "An append-only memory: decisions (with why), facts (with path:line evidence), dead ends, blockers and file claims.",
          ],
          [<code key="d">digest.md</code>, "A consolidated summary, written when you run /lucid:dream."],
        ]}
      />
      <p>
        The memory is wired in through hooks, so agents can’t forget to check it. Agents only add to the log and never
        rewrite it. A fact whose cited code has changed is flagged <strong>⚠stale</strong>, so shared memory doesn’t
        spread outdated claims.
      </p>
      <ThemedFigure
        name="how-it-works"
        minWidth={680}
        width={880}
        height={344}
        alt="You edit the feature's plan.md (.lucid/dreams/<feature>/); hooks inject the full dream into every agent on start and only what changed before each tool call; agents write back with lucid note and lucid claim."
      />

      <H2 id="why">The problem it solves</H2>
      <p>
        You build a feature with several Claude agents working at once, then change your mind partway through. Workers
        that are already running keep following the plan they were spawned with. Subagent summaries leave out the why
        and the dead ends. Every worker re-reads the same code. Decisions disappear when the conversation is compacted,
        and two agents can edit the same file. lucid addresses each of these with one shared, hook-fed memory.
      </p>

      <H2 id="team-rules">Team rules</H2>
      <p>
        <code>.claude/rules/*.md</code> are Claude Code’s own path-scoped rule files. lucid adds a <code>forbid</code>{" "}
        pattern checked on the lines each edit adds, a <code>review</code> step against the diff before a turn ends,
        per-rule stats, proposals learned from chat corrections and PR reviews, and an AGENTS.md export for other tools.
        See <Link href="/docs/team-rules">Team rules</Link>.
      </p>

      <H2 id="opt-in">Claude uses it without being asked</H2>
      <p>
        You don’t have to name lucid. Every session starts with a few lines on when it helps: before parallel agents
        edit files, when the plan changes mid-build, and when you state a standing convention. Claude then runs{" "}
        <code>/lucid:swarm</code>, <code>/lucid:replan</code> or <code>lucid learn</code> on its own. The rest of lucid
        stays inactive until a project has a <code>.lucid/</code> folder. Before that, a tiny shell guard exits on every
        other hook without starting Python. It works from repo subfolders and git worktrees; each feature’s worktrees
        share that feature’s dream.
      </p>

      <H2 id="next">Where to go next</H2>
      {DOC_GROUPS.map((g) => (
        <div key={g.title}>
          <h3>{g.title}</h3>
          <ul>
            {g.pages
              .filter((p) => p.href !== "/docs")
              .map((p) => (
                <li key={p.href}>
                  <Link href={p.href}>{p.title}</Link>: {p.description}
                </li>
              ))}
          </ul>
        </div>
      ))}
    </>
  );
}
