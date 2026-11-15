import Link from "next/link";
import { CodeBlock } from "@/components/code-block";
import { Callout, DocHeader, H2, Table, docMetadata } from "@/components/doc";
import { INSTALL } from "@/lib/site";

export const metadata = docMetadata("/docs/installation");

export default function Installation() {
  return (
    <>
      <DocHeader title="Installation">
        Install the plugin once, then turn it on in each project where you want agents to share a dream.
      </DocHeader>

      <H2 id="requirements">Requirements</H2>
      <ul>
        <li>
          <strong>Claude Code</strong>, with plugin support.
        </li>
        <li>
          <strong>python3</strong> (3.9 or newer). lucid uses only the standard library, so there is nothing else to
          install.
        </li>
        <li>
          <strong>macOS or Linux.</strong> lucid is POSIX only, because the log uses <code>flock</code> for locking.
        </li>
      </ul>

      <H2 id="marketplace">Install from the marketplace</H2>
      <p>Run these two commands inside Claude Code:</p>
      <CodeBlock lang="claude" label="In Claude Code" code={INSTALL.marketplace} what="marketplace command" />
      <CodeBlock lang="claude" label="In Claude Code" code={INSTALL.install} what="install command" />

      <H2 id="local">Try a local checkout</H2>
      <p>To develop lucid or try it without installing, load a clone for one session:</p>
      <CodeBlock
        label="In your terminal"
        what="local checkout commands"
        code={`git clone https://github.com/Redskull-127/lucid
claude --plugin-dir ./lucid       # load for one session; /reload-plugins after edits
python3 lucid/test_lucid.py       # self-check
claude plugin validate ./lucid --strict`}
      />

      <H2 id="init">Turn it on in a project</H2>
      <p>
        lucid does nothing until a project opts in. In Claude Code, ask Claude to run <code>lucid init</code> in the project, then write
        your plan in <code>.lucid/plan.md</code>:
      </p>
      <CodeBlock code={`lucid init        # Claude runs this: the plugin puts lucid on its PATH`} what="lucid init" />
      <p>
        You can also skip this step: <Link href="/docs/commands#swarm">/lucid:swarm</Link> and{" "}
        <Link href="/docs/commands#replan">/lucid:replan</Link> run <code>lucid init</code> themselves when{" "}
        <code>.lucid/</code> doesn’t exist yet. Running <code>lucid init</code> again is safe: it keeps an existing plan
        and log.
      </p>
      <Callout>
        <p>
          The <code>lucid</code> command is on your agents’ PATH (the plugin’s <code>bin/</code> folder), not your own shell’s. From your terminal, run the same script
          with python3 from the plugin’s <code>bin/</code> folder, for example{" "}
          <code>python3 path/to/lucid/bin/lucid init</code>.
        </p>
      </Callout>

      <H2 id="created">What lucid init creates</H2>
      <Table
        keys
        head={["Path in .lucid/", "What it is", "In git"]}
        rows={[
          [<code key="1">plan.md</code>, "The live plan, started from a short template (goal, tasks with one owner per file set, constraints).", "Commit"],
          [<code key="2">log.jsonl</code>, "The append-only log. Starts empty.", "Commit"],
          [<code key="3">digest.md</code>, "Not created by init. /lucid:dream writes it later.", "Commit"],
          [<code key="4">.gitattributes</code>, <>Sets <code>log.jsonl merge=union</code>, so two people appending to the log never conflict.</>, "Commit"],
          [<code key="5">.gitignore</code>, "Ignores the per-agent files below.", "Commit"],
          [<code key="6">.state/</code>, "Per-agent state, such as how far each agent has read the log.", "Ignored"],
          [<code key="7">.plan.prev</code>, "The last plan lucid saw, used to compute plan diffs.", "Ignored"],
          [<code key="8">.debug.jsonl</code>, <>Only with <code>LUCID_DEBUG=1</code>: every hook input.</>, "Ignored"],
        ]}
      />
      <p>The plan template looks like this:</p>
      <CodeBlock
        lang="text"
        label=".lucid/plan.md"
        what="plan template"
        code={`# Plan

## Goal

## Tasks (one owner per file set)
- [ ]

## Constraints / non-goals`}
      />

      <H2 id="commit">What to commit</H2>
      <p>
        Commit <code>plan.md</code>, <code>log.jsonl</code> and <code>digest.md</code> so teammates and future sessions
        share the dream. Per-agent state is git-ignored automatically.
      </p>

      <H2 id="worktrees">Subfolders and worktrees</H2>
      <p>
        lucid finds <code>.lucid/</code> by walking up from the project directory, so it works from repo subfolders. Git
        worktrees share the main checkout’s dream. For a worktree outside the repo, set{" "}
        <Link href="/docs/configuration">LUCID_ROOT</Link> to where <code>.lucid/</code> lives.
      </p>

      <p>
        Next: <Link href="/docs/quick-start">walk through a first build</Link>.
      </p>
    </>
  );
}
