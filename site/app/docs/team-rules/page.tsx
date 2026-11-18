import Link from "next/link";
import { CodeBlock } from "@/components/code-block";
import { Callout, DocHeader, H2, H3, Table, docMetadata } from "@/components/doc";

export const metadata = docMetadata("/docs/team-rules");

export default function TeamRules() {
  return (
    <>
      <DocHeader title="Team rules">
        One versioned source of truth for how your team wants agents to work: conventions, code-review checks and the
        lessons you keep repeating. Every agent is checked against it, it learns from corrections and PR reviews, and
        your team approves each rule in a pull request.
      </DocHeader>

      <H2 id="problem">The problem</H2>
      <p>
        Most teams keep this in AGENTS.md or CLAUDE.md. Agents read those files, but nothing makes them follow every
        rule, and the lessons each developer teaches their agent stay on that developer’s machine.
      </p>
      <ul>
        <li>
          <strong>Each rule is usually followed, but rarely all of them.</strong> In{" "}
          <a href="https://arxiv.org/abs/2601.10343">OctoBench</a> (Claude Code among the scaffolds) 80–86% of
          individual rule checks pass, but only 10–28% of tasks follow every rule, and compliance falls as sessions get
          longer.
        </li>
        <li>
          <strong>The files are advisory by design.</strong> Anthropic’s{" "}
          <a href="https://code.claude.com/docs/en/memory">memory docs</a>: Claude “treats them as context, not enforced
          configuration.” For anything that must always hold, they point to hooks.
        </li>
        <li>
          <strong>Stale files win.</strong> Agents followed an outdated instruction file over the actual code in 90% of
          choices (<a href="https://arxiv.org/abs/2610.30571">arXiv 2610.30571</a>).
        </li>
        <li>
          <strong>Learnings are siloed.</strong> Claude Code’s auto memory is machine-local. Review bots keep their
          learnings in their own dashboards. Nothing keeps them in the repo, approved like code and checked.
        </li>
      </ul>

      <H2 id="format">The rule format</H2>
      <p>
        Team rules are Claude Code’s own <code>.claude/rules/*.md</code> files. Claude Code loads each one when an agent
        touches a file that matches its <code>paths:</code> globs, including inside subagents. lucid reads two extra
        keys that Claude Code ignores:
      </p>
      <CodeBlock
        lang="text"
        label=".claude/rules/api/logging.md"
        what="rule file"
        code={`---
paths: ["src/api/**/*.ts"]
forbid: 'console\\.log\\('   # lines an agent ADDS must not match (a string or a list)
review: true               # checked against the diff before the agent finishes a turn
---
# Log through logger, never console
Every API handler logs through src/lib/logger.ts so request ids are kept.`}
      />
      <Table
        keys
        head={["Key", "Who reads it", "What happens"]}
        rows={[
          [
            <code key="p">paths</code>,
            "Claude Code",
            "The rule loads when an agent reads or edits a matching file. No paths: it loads in every session.",
          ],
          [
            <code key="f">forbid</code>,
            "lucid",
            <>
              When an edit adds a line that matches, the agent gets{" "}
              <code>[lucid] team rule api/logging.md (…): this edit adds `console.log(id)`…</code> with the edit’s
              result, and fixes it or says why it’s an exception. Lines that were already there never count.
            </>,
          ],
          [
            <code key="r">review</code>,
            "lucid",
            "Before the agent ends a turn that touched matching files, it’s asked once to read its diff against these rules, fix what breaks one, and end with ✓ or ✗ per rule.",
          ],
        ]}
      />
      <p>
        Use <code>forbid</code> for what a pattern can say exactly (“never <code>moment(</code>”), and{" "}
        <code>review</code> for judgment (“every handler validates its input”, “migrations are reversible”). Most rules
        need neither: Claude Code loads them at the right moment on its own.
      </p>

      <H2 id="learn">How rules get learned</H2>
      <p>
        Proposals go to <code>.lucid/proposed/</code> in the same format. Claude Code doesn’t load that folder, so a
        proposal does nothing until someone moves it into <code>.claude/rules/</code> in a pull request. The PR diff is
        the rule, and the team reviews it like code.
      </p>
      <Table
        head={["Source", "How it gets proposed"]}
        rows={[
          [
            "A correction in chat",
            <>
              You tell Claude “no, we never…” or “from now on…”. Claude runs{" "}
              <code>lucid learn &quot;…&quot; --paths &apos;src/**&apos; --source chat</code> on its own: every session
              tells it to, and a correction-shaped message gets a one-line reminder (at most three per session).
            </>,
          ],
          [
            "PR review comments",
            <>
              <code>/lucid:learn pr 123</code> or <code>/lucid:learn recent 30</code> reads review threads from humans
              and review bots with <code>gh</code>, keeps conventions that led to a code change, and weights themes that
              recur across PRs.
            </>,
          ],
          [
            "A swarm’s log",
            <>
              <code>/lucid:dream</code> proposes up to three lasting lessons from a finished swarm.
            </>,
          ],
          [
            "Your existing files",
            <>
              <code>/lucid:learn import</code> splits a long CLAUDE.md or AGENTS.md into path-scoped rule files and shows
              you the diff.
            </>,
          ],
        ]}
      />
      <p>
        Each proposal has a kind that decides its folder: <code>architecture</code> (how parts fit, and why) goes to{" "}
        <code>.claude/rules/architecture/</code>, <code>review</code> (what review catches) to{" "}
        <code>.claude/rules/review/</code>, and <code>convention</code> to <code>.claude/rules/conventions/</code>. When a
        feature merges, its dream proposes its lessons this way on its own (see{" "}
        <Link href="/docs/feature-dreams#merge">Feature dreams</Link>).
      </p>
      <p>
        <code>/lucid:learn promote</code> then goes through the proposals with you. It merges duplicates and adds{" "}
        <code>forbid</code> only when a grep of today’s code shows the pattern has no false positives. It moves the
        approved ones into <code>.claude/rules/</code>, refreshes AGENTS.md and suggests a PR. lucid never commits or
        pushes on its own. Claude Code asks before writing into <code>.claude/</code>, so you approve each rule file as
        it’s written.
      </p>
      <CodeBlock
        label="Any agent, or your terminal"
        what="learn commands"
        code={`lucid learn "Never use moment.js; use date-fns, it's already a dependency" --paths 'src/**' -e src/date.ts:3 --source pr#412
lucid rules                    # every rule, with this machine's stats; proposals waiting
lucid rules export             # write the AGENTS.md block for other tools
lucid rules export --check     # in CI: fail if AGENTS.md has drifted from .claude/rules/`}
      />

      <H2 id="stats">Is each rule followed?</H2>
      <p>
        <code>lucid rules</code> lists every rule with what happened on this machine. <em>match</em> counts edits to
        files under its paths, <em>forbid</em> counts pattern hits, <em>unresolved</em> counts hits still in the code
        when the turn ended, and <em>review</em> counts review rounds. Rules whose paths never matched an edit are
        listed as candidates to prune, and a rule with a broken regex is listed as skipped instead of breaking a hook.
      </p>
      <CodeBlock
        lang="output"
        label="lucid rules"
        what="rules output"
        code={`Team rules in .claude/rules/: 2 · LUCID_RULES=on · stats from this machine
- api.md [review]: Handlers validate their input (src/api/**) · match 2, review 1 · last 2026-11-18
- logging.md [forbid]: Log through logger, never console (src/**) · match 2, forbid 1, unresolved 1 · last 2026-11-18`}
      />

      <H2 id="safety">Cautious by default</H2>
      <ul>
        <li>
          <strong>Nothing blocks a write.</strong> Pattern hits arrive as feedback with the edit’s result. They are never
          a denied tool call.
        </li>
        <li>
          <strong>Only added lines count</strong>, so legacy code never nags an agent.
        </li>
        <li>
          <strong>Every reminder is capped:</strong> a pattern hit twice per rule and file per session, the review once
          per turn (once per subagent), and the learn reminder three times per session.
        </li>
        <li>
          <strong>Rules can’t run code.</strong> lucid reads regexes, never shell commands from repo files, so a pull
          request can’t smuggle a command into your agents’ hooks.
        </li>
        <li>
          <strong>Proposals do nothing until a PR merges them.</strong>
        </li>
        <li>
          <strong>Observe first.</strong> <code>LUCID_RULES=observe</code> records the stats but shows agents nothing.
          Run a week that way, read <code>lucid rules</code> for false positives, then switch to <code>on</code>.{" "}
          <code>off</code> turns team rules off.
        </li>
      </ul>

      <H2 id="other-tools">Codex, Copilot, Cursor and review bots</H2>
      <p>
        <code>lucid rules export</code> writes the rules into a marked block in AGENTS.md, grouped by path, with each{" "}
        <code>forbid</code> pattern spelled out. Codex, GitHub Copilot, Cursor and many review bots read AGENTS.md, so
        they get the same rules. They don’t get lucid’s checks, which run inside Claude Code. Edit{" "}
        <code>.claude/rules/</code>, never the generated block, and run <code>lucid rules export --check</code> in CI to
        catch drift.
      </p>
      <Callout>
        <p>
          Claude Code reads AGENTS.md itself only when a project has no CLAUDE.md. If yours has none, add a one-line
          CLAUDE.md so Claude uses <code>.claude/rules/</code> and leaves AGENTS.md to the other tools. Otherwise it sees
          every rule twice.
        </p>
      </Callout>

      <H2 id="rollout">Rolling it out to a team</H2>
      <ol>
        <li>
          Everyone installs the plugin (<Link href="/docs/installation">Installation</Link>). To prompt teammates
          automatically, commit <code>extraKnownMarketplaces</code> and <code>enabledPlugins</code> in the project’s{" "}
          <code>.claude/settings.json</code>. To force it for an organization, use managed settings.
        </li>
        <li>
          Run <code>/lucid:learn import</code> on your CLAUDE.md or AGENTS.md, and <code>/lucid:learn recent 30</code> on
          your merged PRs. Merge the rule files in one PR.
        </li>
        <li>
          Set <code>LUCID_RULES=observe</code> for a week, then read <code>lucid rules</code>.
        </li>
        <li>
          Switch to <code>on</code>. Promote new proposals with <code>/lucid:learn promote</code> as they come in.
        </li>
      </ol>

      <H3 id="seen-live">Seen in live runs</H3>
      <p>
        These were headless <code>claude -p</code> sessions on Haiku, with the plugin loaded and nothing about lucid in the
        prompt:
      </p>
      <ul>
        <li>
          <strong>Rules.</strong> The prompt asked for <code>console.log</code> in an API handler. The pattern rule fired
          with the edit result. The review round then checked the diff, and the code ended up with the validation an API
          review rule asks for, which the prompt never mentioned. The agent kept <code>console.log</code> as a stated
          exception (“you asked for it by name”), and <code>lucid rules</code> showed it as unresolved.
        </li>
        <li>
          <strong>Learning, unprompted.</strong> A repo with no <code>.lucid/</code>. A user stated a team policy in
          passing. Claude ran <code>lucid learn</code> on its own. After the proposal was merged, a teammate’s session,
          with none of the first session’s memory, followed the policy.
        </li>
      </ul>
      <H3 id="honest">What the benchmark shows: no adherence gain yet</H3>
      <p>
        In 115 runs on Haiku and Opus, Claude followed every rule in every arm: 30 rules in one long CLAUDE.md, the same
        rules as native <code>.claude/rules/</code> files, and the same files under lucid. That held in a 7-turn session
        where the rules mattered again after 80 KB of docs had been read. A teammate session also picked up a
        chat-stated policy in every run without lucid, because Claude wrote it into a CLAUDE.md itself. lucid cost
        5–32% more per run, mostly for the review round.
      </p>
      <p>
        So lucid didn’t make Claude follow rules better on these tasks. What it adds is a mechanical check that runs
        anyway, a per-rule record of what was caught, a reviewed path from correction to rule (Claude ran{" "}
        <code>lucid learn</code> unprompted in 11 of 13 runs), and one set of rules for every tool. Hundreds of rules,
        compacted sessions and large repos, where research finds agents slip, are untested.{" "}
        <Link href="/docs/benchmark#team-rules">Full results</Link>.
      </p>
    </>
  );
}
