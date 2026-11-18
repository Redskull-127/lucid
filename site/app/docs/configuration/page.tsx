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
            <code key="4">LUCID_STRAY_ALARM</code>,
            <code key="4d">20</code>,
            "Unclaimed files that one Bash command may change before lucid raises a blocker for everyone.",
          ],
          [
            <code key="5">LUCID_RULES</code>,
            <code key="5d">on</code>,
            <>
              Team rules: <code>on</code>, <code>observe</code> (record stats in <code>lucid rules</code>, show agents
              nothing) or <code>off</code>. See <Link href="/docs/team-rules#safety">Team rules</Link>.
            </>,
          ],
          [
            <code key="2">LUCID_ROOT</code>,
            "project dir",
            <>
              Forces the single-dream layout, with <code>.lucid/</code> in this folder. Feature dreams don’t need it.
            </>,
          ],
          [
            <code key="6">LUCID_DREAM</code>,
            "unset",
            <>
              Use this feature dream instead of the branch’s (same as <code>lucid --dream NAME</code>).
            </>,
          ],
          [
            <code key="7">LUCID_GH</code>,
            <code key="7d">1</code>,
            <>
              <code>0</code> skips asking <code>gh</code> about squash-merged PRs at session start (offline, or no{" "}
              <code>gh</code>).
            </>,
          ],
          [
            <code key="3">LUCID_DEBUG</code>,
            "unset",
            <>
              <code>1</code> logs every hook input to <code>.debug.jsonl</code> in the dream’s folder (<code>lucid dream path</code>).
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
        Commit <code>.claude/rules/</code> (team rules) and <code>.lucid/proposed/</code> (proposals waiting for review).
        Feature dreams in <code>.lucid/dreams/</code> stay out of git through <code>.git/info/exclude</code>, unless you
        share one, and lucid’s bookkeeping and rule stats live in <code>.git/lucid/</code> on each machine.
      </p>
      <Table
        head={["Commit", "Kept out of git"]}
        rows={[
          [
            <>
              <code>.claude/rules/</code>, <code>.lucid/proposed/</code>, and a dream you <code>lucid dream share</code>
            </>,
            <>
              <code>.lucid/dreams/</code> (private dreams and <code>.archive/</code>), every <code>.state/</code>,{" "}
              <code>.git/lucid/</code>
            </>,
          ],
        ]}
      />
    </>
  );
}
