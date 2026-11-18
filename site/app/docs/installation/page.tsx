import Link from "next/link";
import { CodeBlock } from "@/components/code-block";
import { Callout, DocHeader, H2, Table, docMetadata } from "@/components/doc";
import { INSTALL } from "@/lib/site";

export const metadata = docMetadata("/docs/installation");

export default function Installation() {
  return (
    <>
      <DocHeader title="Installation">
        Install the plugin once. After that, Claude uses lucid on its own wherever it helps. You never have to name
        it.
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

      <H2 id="automatic">Claude uses it on its own</H2>
      <p>
        Like any well-behaved plugin skill, lucid doesn’t wait to be named. Every session starts with a few lines on
        when it helps, so Claude reaches for it at the right moments:
      </p>
      <Table
        head={["When", "Claude runs", "What you get"]}
        rows={[
          [
            "Two or more agents are about to edit files in parallel",
            <code key="s">/lucid:swarm</code>,
            "lucid init, a shared plan, decisions settled before anyone spawns, and file claims.",
          ],
          [
            "You change the plan while workers run",
            <code key="r">/lucid:replan</code>,
            "Every running worker gets the diff before its next tool call.",
          ],
          [
            "You state a standing convention (“we never…”, “from now on…”)",
            <code key="l">lucid learn</code>,
            "A proposed team rule your team merges in a PR.",
          ],
          [
            "A swarm ends",
            <code key="d">/lucid:dream</code>,
            "A consolidated log and up to three proposed lessons.",
          ],
        ]}
      />
      <p>
        In a live test, a repo had no <code>.lucid/</code> and the prompt only asked for two tasks done in parallel by
        two subagents. Claude ran <code>lucid init</code>, wrote the plan, logged two shared decisions before spawning,
        and its workers claimed their files. One agent on an ordinary task gets none of this; the note says so.
      </p>

      <H2 id="team">Install it for a whole team</H2>
      <p>
        Commit this to the project’s <code>.claude/settings.json</code>. Teammates who trust the folder are offered the
        marketplace, and each one installs the plugin once:
      </p>
      <CodeBlock
        lang="text"
        label=".claude/settings.json"
        what="team settings"
        code={`{
  "extraKnownMarketplaces": {
    "lucid": { "source": { "source": "github", "repo": "Redskull-127/lucid" } }
  },
  "enabledPlugins": { "lucid@lucid": true }
}`}
      />
      <p>
        To install it for everyone without asking, an organization admin can put the same two keys in managed settings.
        Then commit <code>.claude/rules/</code> and <code>.lucid/</code>, so every teammate’s agents get the same{" "}
        <Link href="/docs/team-rules">team rules</Link>.
      </p>

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
        Claude usually does this itself (see above). To do it by hand, ask Claude to run <code>lucid init</code> in the
        project, then write your plan in <code>.lucid/plan.md</code>:
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
          [<code key="9">proposed/</code>, <>Not created by init. <code>lucid learn</code> puts team-rule proposals here.</>, "Commit"],
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
