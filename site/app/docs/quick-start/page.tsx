import Link from "next/link";
import { CodeBlock } from "@/components/code-block";
import { Callout, DocHeader, docMetadata } from "@/components/doc";

export const metadata = docMetadata("/docs/quick-start");

export default function QuickStart() {
  return (
    <>
      <DocHeader title="Quick start">
        From an empty project to parallel workers that follow your change of plan, in five steps. This assumes you have{" "}
        <Link href="/docs/installation">installed the plugin</Link>.
      </DocHeader>

      <ol className="steps">
        <li>
          <h2 id="init">Turn lucid on</h2>
          <p>In your project, create the dream:</p>
          <CodeBlock code={`lucid init        # creates .lucid/ ; write your plan in .lucid/plan.md`} what="lucid init" />
        </li>

        <li>
          <h2 id="plan">Write the plan</h2>
          <p>
            Open <code>.lucid/plan.md</code> and write the goal, then tasks that each own a separate set of files. For
            example:
          </p>
          <CodeBlock
            lang="text"
            label=".lucid/plan.md"
            what="example plan"
            code={`# Plan

## Goal
Add discounts and item removal to the shop.

## Tasks (one owner per file set)
- [ ] shop/pricing.py: add discount(price, pct)
- [ ] shop/cart.py: add Cart.remove(item)

## Constraints / non-goals`}
          />
          <p>
            Keep tightly coupled work with one agent: parts that share files, or that depend on design decisions still
            open. Parallel agents only help on parts that don’t touch each other.
          </p>
        </li>

        <li>
          <h2 id="swarm">Split the work with /lucid:swarm</h2>
          <CodeBlock lang="claude" label="In Claude Code" what="swarm command" code={`/lucid:swarm add discounts and cart removal`} />
          <p>
            The lead writes or updates the plan, settles cross-cutting decisions (interfaces, names, data shapes) and logs
            each one, then spawns one worker per task. It uses Agent Teams when enabled, otherwise background subagents.
            Each worker first claims its files with <code>lucid claim</code>. Workers don’t need the plan pasted into
            their brief: hooks inject it.
          </p>
          <p>
            While they work, their decisions, dead ends and blockers reach the lead as <code>[lucid]</code> notes.
          </p>
        </li>

        <li>
          <h2 id="replan">Change your mind with /lucid:replan</h2>
          <CodeBlock
            lang="claude"
            label="In Claude Code"
            what="replan command"
            code={`/lucid:replan Cart.total() must apply discount() over 100`}
          />
          <p>
            The plan is edited in place and the change is logged as a decision. Every running worker gets the diff before
            its next tool call, with a reminder that the plan overrides its original brief. This is what a worker saw in
            a real run:
          </p>
          <CodeBlock
            lang="output"
            label="Injected into the running worker"
            copy={false}
            code={`[lucid] 1 update(s) from other agents since you last looked:
#3 PLAN CHANGED by user:
@@ -3 +3,2 @@
 - add a one-line docstring to every function in calc.py
+- ALSO add multiply() to calc.py`}
          />
          <p>
            You can also edit <code>.lucid/plan.md</code> directly in your editor. lucid picks up plan edits made outside
            Claude’s tools too.
          </p>
          <p>
            At the end, the lead verifies the result itself (tests, build) instead of trusting summaries, and checks{" "}
            <code>lucid status</code> for unresolved blockers.
          </p>
        </li>

        <li>
          <h2 id="dream">Consolidate with /lucid:dream</h2>
          <CodeBlock lang="claude" label="In Claude Code" what="dream command" code={`/lucid:dream`} />
          <p>
            When the log gets long, or before you hand the project to a new session, <code>/lucid:dream</code> merges
            duplicates, retires stale or wrong entries and writes <code>.lucid/digest.md</code>. It proposes up to three
            lasting lessons as team rules. Claude suggests it after <code>lucid end</code>.
          </p>
        </li>

        <li>
          <h2 id="rules">Keep what you learned: team rules</h2>
          <CodeBlock lang="claude" label="In Claude Code" what="promote command" code={`/lucid:learn promote`} />
          <p>
            Proposals from <code>/lucid:dream</code>, from your corrections in chat and from{" "}
            <code>/lucid:learn pr &lt;n&gt;</code> wait in <code>.lucid/proposed/</code>. Promote the ones you want into{" "}
            <code>.claude/rules/</code> and merge them in a PR. From then on, every teammate’s agents are checked against
            them. See <Link href="/docs/team-rules">Team rules</Link>.
          </p>
        </li>
      </ol>

      <Callout>
        <p>
          You can write to the dream yourself from your terminal. Your notes reach agents as coming from{" "}
          <code>human</code>. See the <Link href="/docs/cli">CLI reference</Link>.
        </p>
      </Callout>
    </>
  );
}
