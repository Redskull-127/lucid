import Link from "next/link";
import { CodeBlock } from "@/components/code-block";
import { DocHeader, H2, Table, docMetadata } from "@/components/doc";
import { SITE } from "@/lib/site";

export const metadata = docMetadata("/docs/troubleshooting");

export default function Troubleshooting() {
  return (
    <>
      <DocHeader title="Troubleshooting">
        How to see what lucid is doing, and what its messages mean.
      </DocHeader>

      <H2 id="nothing-happens">Agents don’t see the dream</H2>
      <p>lucid stays silent unless all of these are true:</p>
      <ul>
        <li>
          <strong>The project has opted in.</strong> A <code>.lucid/</code> directory exists in the project, or in a
          parent folder up to the repo root. Run <code>lucid init</code> if not.
        </li>
        <li>
          <strong>
            <code>python3</code> is on the PATH Claude Code runs hooks with.
          </strong>{" "}
          The guard in front of every hook exits quietly when it can’t find <code>python3</code>.
        </li>
        <li>
          <strong>The plugin is installed and enabled.</strong> Check with <code>/plugin</code> in Claude Code.
        </li>
        <li>
          <strong>
            For a worktree outside the repo, <code>LUCID_ROOT</code> points at the folder that holds{" "}
            <code>.lucid/</code>.
          </strong>
        </li>
      </ul>

      <H2 id="status">See what agents see</H2>
      <p>Print the digest a new agent gets, then the raw log:</p>
      <CodeBlock
        label="In your terminal"
        what="status commands"
        code={`lucid status        # the digest agents see
lucid log --since 40`}
      />
      <p>
        <code>lucid log</code> ends with <code>last id: N</code>, and marks entries <strong>⚠stale</strong> or{" "}
        <code>(superseded)</code>.
      </p>

      <H2 id="debug">Log every hook input</H2>
      <p>
        Start Claude Code with <code>LUCID_DEBUG=1</code>, and lucid appends every hook input, tagged with its event name,
        to <code>.lucid/.debug.jsonl</code>. The file is git-ignored.
      </p>
      <CodeBlock
        label="In your terminal"
        what="debug commands"
        code={`LUCID_DEBUG=1 claude
tail -n 5 .lucid/.debug.jsonl`}
      />

      <H2 id="claude-debug">Watch the hooks run</H2>
      <p>
        Claude Code’s own debug mode shows each hook as it runs, with its output. Use it to confirm that lucid’s hooks
        fire and what they inject or block:
      </p>
      <CodeBlock label="In your terminal" what="claude debug command" code={`claude --debug`} />

      <H2 id="messages">Messages</H2>
      <Table
        head={["Message", "What it means"]}
        rows={[
          [
            <code key="1">lucid: no .lucid/ found here; run `lucid init` first</code>,
            "The command ran outside an opted-in project. Run lucid init, run the command from inside the project, or set LUCID_ROOT.",
          ],
          [
            <code key="2">lucid: `path` is claimed by `owner` (glob: task). Work on something else, or coordinate …</code>,
            <>
              Another active agent has claimed that file, so the write was blocked. Pick other work, or coordinate with{" "}
              <code>lucid note blocker</code> or SendMessage.
            </>,
          ],
          [
            <code key="3">lucid: glob overlaps `owner`’s claim … Pick other work or coordinate.</code>,
            "Your lucid claim overlaps an active claim by another agent.",
          ],
          [
            <code key="4">lucid: log.jsonl is append-only; use `lucid note|supersede`.</code>,
            "Something tried to edit the log directly. Add entries with lucid note, and retire wrong ones with lucid supersede.",
          ],
          [
            <code key="5">lucid: you edited files but logged nothing for the other agents …</code>,
            "The stop gate. The agent is asked once to record decisions, dead ends and facts before finishing.",
          ],
          [
            <code key="6">lucid hook error: …</code>,
            "A hook hit an unexpected error. It never blocks the agent. Turn on LUCID_DEBUG=1 to capture the input, and open an issue.",
          ],
        ]}
      />

      <H2 id="stuck-claim">A claim is in the way</H2>
      <p>
        Claims end when their owner releases them, when a claiming subagent stops or its session ends, or after{" "}
        <Link href="/docs/configuration">LUCID_CLAIM_TTL</Link> seconds (default 1200) without activity from the owner.
        To see who holds what, run <code>lucid status</code> and look under “Active claims”.
      </p>

      <H2 id="report">Still stuck?</H2>
      <p>
        Open an issue on <a href={`${SITE.github}/issues`}>GitHub</a> with the output of <code>lucid status</code> and,
        if you can, the relevant lines of <code>.lucid/.debug.jsonl</code>.
      </p>
    </>
  );
}
