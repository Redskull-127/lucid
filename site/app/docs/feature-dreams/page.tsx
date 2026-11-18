import Link from "next/link";
import { CodeBlock } from "@/components/code-block";
import { Callout, DocHeader, H2, H3, Table, docMetadata } from "@/components/doc";

export const metadata = docMetadata("/docs/feature-dreams");

export default function FeatureDreams() {
  return (
    <>
      <DocHeader title="Feature dreams">
        Each feature gets its own dream that lives until its PR, or its whole PR stack, merges. Its lasting lessons
        then move into team rules on main, the way sleep turns the day’s memories into long-term memory.
      </DocHeader>

      <H2 id="two-layers">Two kinds of memory</H2>
      <Table
        head={["", "Long-term: team rules", "Short-term: a feature dream"]}
        rows={[
          [
            "What",
            "Architecture, review learnings, conventions",
            "The plan, decisions, dead ends, facts, file claims",
          ],
          [
            "Where",
            <>
              <code key="r">.claude/rules/</code> on main
            </>,
            <>
              <code key="d">.lucid/dreams/&lt;feature&gt;/</code>, out of git
            </>,
          ],
          ["Lives", "For good; changed through PRs", "From lucid init until the feature’s PRs merge"],
          ["Seen by", "Every branch, every teammate", "The feature’s branches, worktrees and agents"],
          [
            "When the feature merges",
            "Gets the lessons the feature taught",
            "Is consolidated, proposes its lessons, then is archived",
          ],
        ]}
      />

      <H2 id="where">Where a dream lives, and who sees it</H2>
      <ul>
        <li>
          <strong>One dream per feature.</strong> <code>lucid init</code> (or <code>/lucid:swarm</code>) starts a dream
          named after the branch, in the main checkout’s <code>.lucid/dreams/&lt;feature&gt;/</code>. lucid keeps it out
          of git through <code>.git/info/exclude</code>, so it never shows in <code>git status</code> and can’t reach main
          by accident.
        </li>
        <li>
          <strong>Every worktree of the clone shares it.</strong> A session in any worktree finds its branch’s dream. A
          worktree on another feature has its own, and nothing leaks between them.
        </li>
        <li>
          <strong>Workers follow their lead.</strong> A subagent works in its lead’s dream wherever its worktree is,
          including Claude Code’s isolated agent worktrees. lucid adds <code>--dream &lt;feature&gt;</code> to every{" "}
          <code>lucid</code> command an agent runs.
        </li>
        <li>
          <strong>Stacks share one dream.</strong> A branch cut from a feature branch that has commits joins that
          feature’s dream, so <code>feat-1</code> → <code>feat-2</code> → <code>feat-3</code> share one plan with any
          stack tool. <code>lucid dream use &lt;name&gt;</code> joins a dream by hand.
        </li>
      </ul>
      <Callout>
        <p>
          Why not inside <code>.git/</code>? Claude Code asks before every edit to a file under <code>.git/</code>, and
          agents edit the plan. lucid keeps only its own bookkeeping there, in <code>.git/lucid/</code>: which branch
          and which lead session uses which dream, and the team-rule stats.
        </p>
      </Callout>

      <H2 id="merge">When the feature merges</H2>
      <p>
        At the start of each session, lucid checks whether a feature’s branches have all landed on the default branch.
        It checks ancestry for merge commits and fast-forwards, and asks <code>gh</code> about squash merges (cached for
        10 minutes). When they have, the session is told so, and Claude runs <code>/lucid:dream &lt;feature&gt;</code>{" "}
        on its own:
      </p>
      <ol>
        <li>It consolidates the log: merges duplicates, re-checks stale entries and writes a digest.</li>
        <li>
          It proposes the lasting lessons as team rules, each with a kind: <code>architecture</code> (how parts fit,
          and why), <code>review</code> (what review caught) or <code>convention</code> (how code is written here).
        </li>
        <li>
          It promotes them into <code>.claude/rules/&lt;kind&gt;/</code>, shows you the diff, and asks before opening a
          PR to main. It never commits, pushes or opens a PR without a yes.
        </li>
        <li>
          <code>lucid dream archive &lt;feature&gt;</code> moves the dream to <code>.lucid/dreams/.archive/</code>.
        </li>
      </ol>
      <p>
        Claude Code asks before writing into <code>.claude/</code>, so you’ll approve the rule files as they’re
        written. That’s the moment to read them.
      </p>

      <H2 id="share">Sharing a dream with teammates</H2>
      <p>
        A dream is private to your clone by default. When several people build one feature, share it:
      </p>
      <CodeBlock
        label="Any agent, or your terminal"
        what="share commands"
        code={`lucid dream share      # move this feature's dream into this checkout's .lucid/dreams/<feature>/ and stop excluding it
git add .lucid/dreams && git commit -m "Share the feature dream"
lucid dream unshare    # private again; commit the removal`}
      />
      <p>
        A teammate who checks out the branch gets the same plan and log, and their lucid binds it automatically. Logs
        merge line by line, so two people appending never conflict. A shared dream reaches main with the feature, and
        the learnings PR removes it when it archives the dream.
      </p>

      <H2 id="commands">Commands</H2>
      <CodeBlock
        label="Any agent, or your terminal"
        what="dream commands"
        code={`lucid init [--name N]       # start this feature's dream (default name: the branch)
lucid dream                 # list dreams: branches, shared, ended, merged; * marks yours
lucid dream use NAME        # this branch joins dream NAME
lucid dream share|unshare   # commit it on the branch for teammates, or make it private again
lucid dream archive [NAME]  # shelve a finished dream
lucid dream path            # its folder
lucid --dream NAME <cmd>    # any command, on another feature's dream`}
      />

      <H3 id="upgrading">Upgrading from 0.5</H3>
      <p>
        A repo whose main checkout has a <code>.lucid/log.jsonl</code> keeps the single shared dream it had, unchanged.
        So do projects outside git, and <code>LUCID_ROOT</code>. To switch a repo to feature dreams, move{" "}
        <code>.lucid/plan.md</code>, <code>log.jsonl</code> and <code>digest.md</code> out (or <code>git rm</code>{" "}
        them), then run <code>lucid init</code> on a feature branch. Team rules work the same either way: see{" "}
        <Link href="/docs/team-rules">Team rules</Link>.
      </p>

      <H3 id="seen-live">Seen in a live run</H3>
      <p>
        This was headless <code>claude -p</code> on Haiku, with prompts that never mentioned lucid. A clone had a dream
        for <code>feat-a</code>, and a separate worktree held <code>feat-b</code>. Asked for two tasks done by two
        parallel subagents, Claude started a <code>feat-b</code> dream, and its workers claimed their files and logged
        decisions there. There were no permission prompts. <code>git status</code> showed only the code, and nothing
        from <code>feat-a</code> leaked in. After <code>feat-b</code> was merged, a new session on main was asked only
        “anything I should take care of?”. Claude consolidated the dream, proposed an architecture and a convention
        rule, and stopped to ask before writing the rule files or opening a PR.
      </p>
    </>
  );
}
