import Link from "next/link";
import { CodeBlock } from "@/components/code-block";
import { DocHeader, H2, Table, docMetadata } from "@/components/doc";
import { ThemedFigure } from "@/components/themed-image";

export const metadata = docMetadata("/docs/how-it-works");

export default function HowItWorks() {
  return (
    <>
      <DocHeader title="How it works">
        lucid is a set of Claude Code hooks around a few plain files. The hooks feed the dream into every agent and
        enforce claims, so the protocol doesn’t depend on agents remembering to follow it.
      </DocHeader>

      <ThemedFigure
        name="how-it-works"
        important
        minWidth={680}
        width={880}
        height={344}
        alt="You edit .lucid/plan.md; hooks inject the full dream into every agent on start and only what changed before each tool call; agents write back with lucid note and lucid claim."
      />

      <H2 id="hooks">The hooks</H2>
      <Table
        head={["Hook", "What it does"]}
        rows={[
          [
            <>
              <strong>SessionStart</strong> (also after <code>/compact</code>), <strong>SubagentStart</strong>
            </>,
            "Injects the plan, the live memory and active claims, within a fixed budget. Subagents and Agent-Teams teammates start with the full shared context instead of a one-paragraph brief. When there’s nothing to share yet (or no .lucid/ at all), a new session instead gets a few lines on when to use lucid, so Claude reaches for it without being asked.",
          ],
          [
            <>
              <strong>PreToolUse</strong> on edits, with team rules
            </>,
            "Checks the lines an edit adds against the forbid patterns of the rules whose paths match the file, and returns any hit with the edit’s result. Records which rules matched, for lucid rules. Never denies the edit.",
          ],
          [
            <>
              <strong>Stop</strong>, <strong>SubagentStop</strong> with team rules
            </>,
            "Once per turn (once per subagent): if the agent touched files that review rules cover, or a forbid hit is still in the code, asks it to check its diff against those rules before finishing.",
          ],
          [
            <>
              <strong>UserPromptSubmit</strong>, <strong>PreToolUse</strong>
            </>,
            "Injects only what other agents wrote since you last looked. When nothing changed it injects nothing and costs no tokens.",
          ],
          [
            <>
              <strong>UserPromptSubmit</strong> while workers are busy
            </>,
            <>
              If other agents hold active claims, adds one line telling the lead to write a chat change of plan into{" "}
              <code>.lucid/plan.md</code> first, so running workers get it and it survives <code>/compact</code>.
            </>,
          ],
          [
            <>
              <strong>PreToolUse</strong> on edits
            </>,
            <>
              Blocks a write to a file another active agent has claimed, whether it goes through Edit/Write or through
              Bash (<code>&gt;</code>, <code>sed -i</code>, <code>cp</code>/<code>mv</code>, scripts that{" "}
              <code>{`open(…, 'w')`}</code>).
            </>,
          ],
          [
            <>
              <strong>PreToolUse</strong> on Bash
            </>,
            <>
              Adds the calling agent’s real id to every <code>lucid</code> command, so every entry records who wrote it
              and agents never have to manage ids.
            </>,
          ],
          [
            <>
              <strong>PostToolUse</strong> on Edit/Write
            </>,
            <>
              When an agent edits <code>.lucid/plan.md</code>, records the change as a plan diff under that agent’s id.
            </>,
          ],
          [
            <>
              <strong>SubagentStop</strong>, <strong>TaskCompleted</strong>
            </>,
            "Asks once for notes from an agent that edited files but logged nothing. A stopping subagent’s claims are released.",
          ],
          [
            <>
              <strong>Stop</strong>, <strong>SessionEnd</strong>
            </>,
            "Releases a session’s claims when its turn or the whole session ends. An agent between turns isn’t editing, so its claims shouldn’t block anyone.",
          ],
        ]}
      />
      <p>
        Every hook goes through a tiny shell guard first. It walks up from the project directory looking for{" "}
        <code>.lucid/</code>, stopping at the repo root. If the project hasn’t opted in, or <code>python3</code> isn’t
        available, it exits without starting Python, so projects without lucid pay a few shell builtins and nothing
        more. The one exception is SessionStart, which starts Python once per session to print the note on when to use
        lucid.
      </p>

      <H2 id="digest-delta">Digest and delta</H2>
      <p>lucid injects context in two sizes.</p>
      <p>
        <strong>The digest</strong> is the whole dream, given when an agent starts (and again after{" "}
        <code>/compact</code>): the plan, the consolidated <code>digest.md</code> if one exists, active claims, and the
        newest log entries that fit a fixed budget. Older entries are left for <code>lucid log</code>. This is why
        decisions survive compaction: in a real run, after <code>/compact</code> the lead quoted a log entry word for
        word, from the re-injected dream rather than the summary. You can print the digest yourself with{" "}
        <code>lucid status</code>.
      </p>
      <p>
        <strong>The delta</strong> is given before each prompt and each tool call: only entries that <em>other</em>{" "}
        agents wrote since this agent last looked. When nothing changed, nothing is injected and it costs no tokens. When
        the delta includes a plan change, it also says that the plan is the user’s latest intent and overrides the
        agent’s original brief.
      </p>
      <CodeBlock
        lang="output"
        label="A delta, as a running worker saw it"
        copy={false}
        code={`[lucid] 1 update(s) from other agents since you last looked:
#3 PLAN CHANGED by user:
@@ -3 +3,2 @@
 - add a one-line docstring to every function in calc.py
+- ALSO add multiply() to calc.py`}
      />
      <p>
        Plan edits made outside Claude’s tools, such as in your editor, with <code>sed</code> or by a{" "}
        <code>git checkout</code>, are picked up too and attributed to <code>user</code>.
      </p>

      <H2 id="claims">Claims and TTL</H2>
      <p>
        Before editing, an agent claims a set of files with <code>{`lucid claim 'glob' --for "task"`}</code>. While the
        claim is active:
      </p>
      <ul>
        <li>Other agents’ writes to matching files are blocked, with a message naming the owner and the task.</li>
        <li>
          Another agent’s <code>lucid claim</code> that overlaps it is refused.
        </li>
        <li>Every agent sees it under “Active claims” in its digest.</li>
      </ul>
      <p>A claim ends when:</p>
      <ul>
        <li>
          its owner runs <code>lucid release</code>;
        </li>
        <li>its owner is a subagent that stops, or a session whose turn or session ends;</li>
        <li>
          its owner has been silent for <code>LUCID_CLAIM_TTL</code> seconds (default 1200).
        </li>
      </ul>
      <p>
        Releasing at the end of a turn or session came out of testing. In the benchmark, the first memory run failed 1
        of 4 because a finished session’s claim blocked the next session. In a live split-pane Agent Teams run,
        teammates, which are separate sessions, sat idle while still holding their claims.
      </p>

      <H2 id="stale">⚠stale facts</H2>
      <p>
        Facts are logged with evidence such as <code>-e src/auth.ts:42</code>. lucid records a hash of each cited file.
        If the file changes afterwards, the entry is shown with <strong>⚠stale</strong>, telling agents to re-read the
        code before relying on it. <Link href="/docs/commands#dream">/lucid:dream</Link> re-checks stale entries and
        retires the ones that are no longer true. In a real run, a worker logged a note before it had finished; lucid
        flagged it ⚠stale because the cited file had changed since, and the lead pointed out the inaccuracy.
      </p>

      <H2 id="stop-gate">The stop gate</H2>
      <p>
        When a subagent stops or a task completes, lucid checks whether the agent edited files but logged nothing. If so,
        it asks the agent, once, to record its decisions, dead ends and non-obvious facts before finishing. Changing the
        plan counts as reporting. A stopping subagent’s claims are then released.
      </p>
      <p>
        The <Link href="/docs/team-rules">team-rules</Link> review uses the same gate. When both apply, the agent gets
        one combined message, and <code>stop_hook_active</code> keeps it from looping.
      </p>

      <H2 id="bash-writes">Bash write detection</H2>
      <p>
        Agents don’t only edit through Edit and Write. In a real Agent Teams run, a teammate edited through a Python
        heredoc in Bash, which skipped claims and the stop gate. lucid now inspects Bash commands for file writes and
        applies claims to them too. It catches:
      </p>
      <ul>
        <li>
          redirects (<code>&gt;</code>, <code>&gt;&gt;</code>) and <code>tee</code>;
        </li>
        <li>
          <code>cp</code>, <code>mv</code> and <code>rm</code>;
        </li>
        <li>
          <code>sed -i</code>;
        </li>
        <li>Python writes, such as <code>{`open(…, 'w')`}</code>.</li>
      </ul>
      <p>
        This is a heuristic. It doesn’t catch every way a program can write a file. See{" "}
        <Link href="/docs/limits">Limits</Link>.
      </p>

      <H2 id="append-only">An append-only log</H2>
      <p>
        Agents only add to <code>log.jsonl</code>; direct edits to it are blocked. To retire a wrong entry, agents use{" "}
        <code>lucid supersede</code>, which adds an entry instead of rewriting history. In git, the log is merged with{" "}
        <code>merge=union</code>, so two people appending never conflicts.
      </p>

      <H2 id="ids">Agent ids</H2>
      <p>
        Every entry records who wrote it. lucid stamps each agent’s real id onto its <code>lucid</code> commands, so
        agents never manage ids. This was added after leads were seen inventing worker ids. When you run{" "}
        <code>lucid</code> yourself, your entries appear as <code>human</code>.
      </p>
    </>
  );
}
