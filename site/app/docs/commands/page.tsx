import Link from "next/link";
import { CodeBlock } from "@/components/code-block";
import { Callout, DocHeader, H2, H3, Table, docMetadata } from "@/components/doc";

export const metadata = docMetadata("/docs/commands");

export default function Commands() {
  return (
    <>
      <DocHeader title="Commands">
        Four slash commands, and one protocol skill. You can run them yourself, but you don’t have to: every session
        tells Claude when each one helps, and it starts them on its own.
      </DocHeader>

      <Table
        head={["Command", "What it does"]}
        rows={[
          [
            <code key="s">/lucid:swarm &lt;feature&gt;</code>,
            "Writes the plan, splits the work by file ownership, settles shared decisions up front, then spawns workers that share the dream.",
          ],
          [
            <code key="r">/lucid:replan &lt;change&gt;</code>,
            "Changes direction mid-build. Running workers get the diff before their next action.",
          ],
          [
            <code key="d">/lucid:dream</code>,
            "Consolidates a long memory: merges duplicates, retires stale entries, and proposes lasting lessons as team rules. Suggested after lucid end.",
          ],
          [
            <code key="l">/lucid:learn [pr N | recent N | import | promote]</code>,
            "Turns corrections, PR review comments and an existing CLAUDE.md or AGENTS.md into team rules, and walks proposals through to a PR.",
          ],
        ]}
      />

      <H2 id="swarm">/lucid:swarm</H2>
      <CodeBlock lang="claude" label="In Claude Code" what="swarm command" code={`/lucid:swarm <feature>`} />
      <p>
        Splits a feature across parallel agents (subagents or Agent-Teams teammates) that share one plan, log and set of
        file claims. Use it when the work splits into parts that touch different files. The lead:
      </p>
      <ol>
        <li>
          Runs <code>lucid init</code> if needed, then writes <code>.lucid/plan.md</code>: the goal, then tasks that
          each own a separate set of files (a glob). Tightly coupled work stays with one agent.
        </li>
        <li>
          Makes the cross-cutting decisions itself before spawning anyone (interfaces, names, data shapes) and logs each
          with <code>lucid note decision</code>. Workers inherit them.
        </li>
        <li>
          Spawns one worker per task, with Agent Teams if it’s enabled, otherwise as background subagents. Each brief is
          the task, its glob, what “done” means, and an instruction to claim the glob first. Briefs end with{" "}
          <em>
            “<code>.lucid/plan.md</code> overrides this brief if the plan changes.”
          </em>{" "}
          The lead doesn’t name workers, assign ids or paste the plan: lucid identifies every agent, and hooks inject the
          plan.
        </li>
        <li>
          Keeps working on its own task while workers’ decisions, dead ends and blockers arrive as{" "}
          <code>[lucid]</code> notes. It acts on blockers and doesn’t poll.
        </li>
        <li>
          Uses <code>/lucid:replan</code> if you change direction.
        </li>
        <li>
          Verifies the result itself (tests, build) instead of trusting summaries, and checks <code>lucid status</code>{" "}
          for unresolved blockers.
        </li>
      </ol>

      <H2 id="replan">/lucid:replan</H2>
      <CodeBlock lang="claude" label="In Claude Code" what="replan command" code={`/lucid:replan <the change>`} />
      <p>Applies a mid-build change of plan so every running agent picks it up before its next tool call:</p>
      <ol>
        <li>
          Runs <code>lucid init</code> if <code>.lucid/</code> doesn’t exist.
        </li>
        <li>
          Edits <code>.lucid/plan.md</code> in place: changes tasks, strikes dropped ones as{" "}
          <code>~~task~~ (dropped: why)</code>, and gives each new task an owner and a file set.
        </li>
        <li>
          Logs <code>{`lucid note decision "replan: <one line> because <why>"`}</code>.
        </li>
        <li>
          Running workers get the diff before their next tool call. If the change makes a worker’s claimed task obsolete
          or conflicting, the lead messages that worker directly (SendMessage) instead of waiting for it to finish.
        </li>
        <li>Tells you what changed in one or two lines.</li>
      </ol>

      <H2 id="dream">/lucid:dream</H2>
      <CodeBlock lang="claude" label="In Claude Code" what="dream command" code={`/lucid:dream`} />
      <p>
        Consolidates the log into a short digest. Use it when the log gets long, or before handing the project to a new
        session.
      </p>
      <ol>
        <li>
          Reads every entry with <code>lucid log</code>.
        </li>
        <li>
          Re-reads the code behind each <strong>⚠stale</strong> entry, and retires entries that are no longer true with{" "}
          <code>lucid supersede</code>. Duplicates are superseded too, keeping the clearest one.
        </li>
        <li>
          Writes <code>.lucid/digest.md</code>: at most about 40 lines of current decisions (with why), dead ends, and
          key facts with evidence. Its first line, <code>{`<!-- lucid:upto=N -->`}</code>, records which entries it
          covers; agents get newer entries raw.
        </li>
        <li>
          Never edits <code>log.jsonl</code>, and never drops a dead end unless it has been disproven.
        </li>
        <li>
          Proposes up to 3 lessons that would help any future session as team rules, with{" "}
          <code>lucid learn --source dream</code>. They stay inactive in <code>.lucid/proposed/</code> until a PR moves
          them into <code>.claude/rules/</code>.
        </li>
      </ol>

      <H2 id="learn">/lucid:learn</H2>
      <CodeBlock
        lang="claude"
        label="In Claude Code"
        what="learn commands"
        code={`/lucid:learn pr 412        # learn from one PR's review threads
/lucid:learn recent 30     # ...or the last 30 merged PRs
/lucid:learn import        # split CLAUDE.md / AGENTS.md into path-scoped rules
/lucid:learn promote       # review proposals, turn the approved ones into rules`}
      />
      <ul>
        <li>
          <strong>No argument:</strong> what Claude does after you correct it with a standing convention. It checks the
          rule isn’t already there, proposes it with <code>lucid learn</code>, and tells you in one line.
        </li>
        <li>
          <strong>
            <code>pr</code> / <code>recent</code>:
          </strong>{" "}
          reads review threads from humans and review bots through <code>gh</code>. It keeps conventions that led to a
          code change, skips nits a linter already catches, weights themes that recur across PRs, and proposes each
          with its source PR and evidence.
        </li>
        <li>
          <strong>
            <code>import</code>:
          </strong>{" "}
          groups the instructions in your CLAUDE.md or AGENTS.md by the files they concern, writes one rule file per
          group with the narrowest <code>paths</code>, and shows you the diff. It asks before deleting anything.
        </li>
        <li>
          <strong>
            <code>promote</code>:
          </strong>{" "}
          merges duplicates, decides with you whether each proposal gets a <code>forbid</code> pattern (only with zero
          false positives in today’s code) or <code>review: true</code>, moves the approved ones into{" "}
          <code>.claude/rules/</code>, runs <code>lucid rules export</code> and suggests a PR. It never commits or pushes
          unless you ask.
        </li>
      </ul>
      <p>
        More in <Link href="/docs/team-rules">Team rules</Link>.
      </p>

      <H2 id="protocol">The lucid protocol skill</H2>
      <p>
        Besides the four commands, the plugin ships a <code>lucid</code> skill that teaches agents the protocol,
        including how to answer team-rule notes. Claude loads it on its own when it’s relevant: starting a multi-step
        feature, before spawning subagents or teammates, when you change the plan mid-build, when a{" "}
        <code>[lucid]</code> note asks for something, or when you mention lucid.
      </p>
      <H3 id="protocol-logging">What agents log</H3>
      <p>Only what another agent would otherwise rediscover or get wrong:</p>
      <ul>
        <li>
          <code>{`note decision "<what> because <why>"`}</code>: choices others must stay consistent with.
        </li>
        <li>
          <code>{`note failed "<tried X, broke because Y>"`}</code>: dead ends, so nobody retries them.
        </li>
        <li>
          <code>{`note fact "<non-obvious truth about the code>" -e path:line`}</code>: always with evidence.
        </li>
        <li>
          <code>{`note blocker "<what you need, from whom>"`}</code>: the lead sees it on its next turn.
        </li>
        <li>
          <code>{`claim 'glob' --for "<task>"`}</code> before editing, <code>release</code> when done. Subagents
          release automatically when they stop.
        </li>
      </ul>
      <H3 id="protocol-rules">Rules agents follow</H3>
      <ul>
        <li>
          Every fact needs evidence (<code>-e path:line</code>). A <strong>⚠stale</strong> entry cites code that has
          changed since it was written, so re-read the code before relying on it.
        </li>
        <li>
          Never edit <code>.lucid/log.jsonl</code>. To retire a wrong entry, use{" "}
          <code>{`supersede <ids> --why "..."`}</code>.
        </li>
        <li>Edit the plan in place with the Edit tool; every running agent gets the diff automatically.</li>
        <li>
          A <code>PLAN CHANGED</code> note is the user’s latest intent and overrides the original brief. If it touches
          files the agent owns or claimed, it applies the change and logs a decision.
        </li>
        <li>Never invent ids or names for yourself or for workers.</li>
      </ul>
      <Callout>
        <p>
          The full command-line interface the agents use is in the <Link href="/docs/cli">CLI reference</Link>.
        </p>
      </Callout>
    </>
  );
}
