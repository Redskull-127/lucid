import Link from "next/link";
import { CodeBlock } from "@/components/code-block";
import { DocHeader, H2, Table, docMetadata } from "@/components/doc";

export const metadata = docMetadata("/docs/configuration");

export default function Configuration() {
  return (
    <>
      <DocHeader title="Configuration">
        lucid has no config file. A few environment variables change its behaviour, and the dream itself is plain files
        you commit.
      </DocHeader>

      <H2 id="env">Environment variables</H2>
      <Table
        keys
        head={["Variable", "Default", "Meaning"]}
        rows={[
          [
            <code key="1">LUCID_CLAIM_TTL</code>,
            <code key="1d">1200</code>,
            "Seconds without activity from a claim’s owner before the claim lapses.",
          ],
          [
            <code key="2">LUCID_ROOT</code>,
            "project dir",
            <>
              Where <code>.lucid/</code> lives, for worktrees outside the repo.
            </>,
          ],
          [
            <code key="3">LUCID_DEBUG</code>,
            "unset",
            <>
              <code>1</code> logs every hook input to <code>.lucid/.debug.jsonl</code>.
            </>,
          ],
        ]}
      />
      <p>Set them in the environment Claude Code starts in, for example:</p>
      <CodeBlock label="In your terminal" what="example environment" code={`LUCID_DEBUG=1 claude`} />
      <p>
        One more variable belongs to Claude Code rather than lucid: <code>CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1</code>{" "}
        turns on <Link href="/docs/agent-teams">Agent Teams</Link>.
      </p>

      <H2 id="commit">What to commit</H2>
      <p>
        Commit <code>plan.md</code>, <code>log.jsonl</code> and <code>digest.md</code> so teammates and future sessions
        share the dream. Per-agent state is git-ignored automatically by the <code>.gitignore</code> that{" "}
        <code>lucid init</code> writes inside <code>.lucid/</code>.
      </p>
      <Table
        head={["Commit", "Ignored"]}
        rows={[
          [
            <>
              <code>plan.md</code>, <code>log.jsonl</code>, <code>digest.md</code>, <code>.gitignore</code>,{" "}
              <code>.gitattributes</code>
            </>,
            <>
              <code>.state/</code>, <code>.plan.prev</code>, <code>.debug.jsonl</code>, <code>*.tmp</code>
            </>,
          ],
        ]}
      />
    </>
  );
}
