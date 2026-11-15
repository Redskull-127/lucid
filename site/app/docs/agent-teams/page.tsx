import Link from "next/link";
import { CodeBlock } from "@/components/code-block";
import { Callout, DocHeader, H2, docMetadata } from "@/components/doc";

export const metadata = docMetadata("/docs/agent-teams");

export default function AgentTeams() {
  return (
    <>
      <DocHeader title="Agent Teams">
        For parallel <em>full</em> Claude instances, enable Claude Code’s experimental Agent Teams. lucid keeps the
        teammates in sync the same way it keeps subagents in sync.
      </DocHeader>

      <H2 id="enable">Enable Agent Teams</H2>
      <p>
        Agent Teams is a Claude Code feature behind an environment variable. Set it when you start Claude Code:
      </p>
      <CodeBlock label="In your terminal" what="Agent Teams command" code={`CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1 claude`} />
      <p>
        lucid doesn’t spawn agents itself. It keeps the ones Claude Code spawns in sync. With Agent Teams enabled,{" "}
        <Link href="/docs/commands#swarm">/lucid:swarm</Link> spawns teammates; without it, it uses background
        subagents.
      </p>

      <H2 id="what-teammates-get">What teammates get</H2>
      <ul>
        <li>The full dream when they start, instead of a one-paragraph brief.</li>
        <li>Only what changed, before each of their tool calls, including plan diffs.</li>
        <li>Claims: their writes to files another active agent claimed are blocked, and their own claims protect their files.</li>
        <li>The stop gate when their task completes, and automatic release of their claims.</li>
        <li>Their own id on every entry they write.</li>
      </ul>
      <p>
        If a change of plan makes a teammate’s task obsolete or conflicting, <code>/lucid:replan</code> has the lead
        message that teammate directly (SendMessage) instead of waiting for it to finish.
      </p>

      <H2 id="verified">Verified live: in-process and split-pane</H2>
      <p>
        In a live run in tmux with <code>CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1</code>, the lead picked{" "}
        <code>/lucid:swarm</code> on its own and spawned <code>@pricing-worker</code> and <code>@cart-worker</code> as
        in-process teammates. lucid’s hooks fired inside both teammates: start, every tool call, plan edits and stop,
        each under the teammate’s own id. Both claimed, worked, logged and were auto-released.
      </p>
      <p>
        In split-pane mode (<code>{`teammateMode: "tmux"`}</code>), each teammate is a separate <code>claude</code>{" "}
        process in its own tmux pane. lucid loads there too: in a live run both teammates claimed their files and
        logged notes, the cart teammate applied a mid-task plan change itself, and the hidden acceptance test passed 4/4.
        Two differences: a split-pane teammate shows up under its session id (for example <code>main-5d04</code>)
        rather than its name, and the once-only stop gate, which works on subagents, doesn’t apply to it. Its claims are
        released when its turn ends.
      </p>
      <p>
        The in-process run also uncovered a gap that is now fixed: a teammate edited through a Python heredoc in Bash, which
        skipped claims and the stop gate. File writes made through Bash are now checked too. See{" "}
        <Link href="/docs/how-it-works#bash-writes">Bash write detection</Link>.
      </p>

      <Callout>
        <p>
          Parallel agents only help on work that doesn’t touch the same files. Keep tightly coupled changes with a single
          agent; <code>/lucid:swarm</code> says so too.
        </p>
      </Callout>
    </>
  );
}
