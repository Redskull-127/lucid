import Link from "next/link";
import { CodeBlock } from "@/components/code-block";
import { Callout, DocHeader, H2, Table, docMetadata } from "@/components/doc";

export const metadata = docMetadata("/docs/cli");

export default function Cli() {
  return (
    <>
      <DocHeader title="CLI reference">
        The <code>lucid</code> command is how agents, and you, write to the dream. It is on the agents’ PATH and usable
        from your own terminal.
      </DocHeader>

      <H2 id="synopsis">Synopsis</H2>
      <CodeBlock
        lang="text"
        copy={false}
        code={`lucid [--as ME] [--dream NAME] init [--name NAME]
lucid [--as ME] note {decision,fact,failed,blocker} TEXT [-e EVIDENCE [EVIDENCE ...]]
lucid [--as ME] claim GLOB [GLOB ...] [--for TASK]
lucid [--as ME] release [GLOB ...]
lucid [--as ME] supersede ID [ID ...] [--why WHY]
lucid [--as ME] log [--since SINCE]
lucid [--as ME] status
lucid [--as ME] wait [--timeout SECONDS]
lucid [--as ME] end
lucid learn TEXT [--paths GLOB [GLOB ...]] [-e EVIDENCE [EVIDENCE ...]] [--source SOURCE] [--kind KIND]
lucid rules [export [--check]]
lucid dream [list | use NAME | share | unshare | archive [NAME] | path]`}
      />
      <p>
        Every command accepts <code>-h</code> / <code>--help</code>. In a git repo, commands other than{" "}
        <code>init</code>, <code>learn</code>, <code>rules</code> and <code>dream</code> work on this branch’s feature
        dream (or the one <code>--dream NAME</code> names), and say how to start or join one when there is none.
      </p>

      <H2 id="ids">Who wrote what: --as</H2>
      <Table
        keys
        head={["Option", "Meaning"]}
        rows={[[<code key="a">--as ME</code>, "The agent id recorded on the entry. Hooks fill it in for agents."]]}
      />
      <p>
        <strong>Agents never manage ids.</strong> Before an agent’s Bash command runs, a lucid hook adds the agent’s
        real id to every <code>lucid</code> command in it, replacing a wrong <code>--as</code> if there is one. Every
        entry records who wrote it, and leads can’t invent worker ids.
      </p>
      <p>
        <strong>Humans appear as </strong>
        <code>human</code>. When you run <code>lucid</code> from your own terminal without <code>--as</code>, your
        notes reach agents as coming from <code>human</code>.
      </p>

      <H2 id="init">init</H2>
      <CodeBlock code={`lucid init [--name NAME]`} what="lucid init" />
      <p>
        Starts this feature’s dream, named after the branch (or <code>--name</code>), and prints the plan’s path. It
        stays out of git, and every worktree of the clone shares it. Safe to run again: an existing plan and log are
        kept, and an ended dream of the same name is archived first. Outside git it creates the single{" "}
        <code>.lucid/</code> dream, as before. See <Link href="/docs/installation#created">what lucid init creates</Link>.
      </p>

      <H2 id="dream">dream</H2>
      <CodeBlock lang="text" copy={false} code={`lucid dream [list | use NAME | share | unshare | archive [NAME] | path]`} />
      <Table
        keys
        head={["Action", "What it does"]}
        rows={[
          [<code key="1">list</code>, "Every feature dream in this clone with its branches, and whether it’s shared, ended or merged. * marks yours."],
          [<code key="2">use NAME</code>, "Binds this branch to an existing dream."],
          [<code key="3">share</code>, "Moves the dream into this checkout and stops excluding it, so you can commit it on the branch for teammates."],
          [<code key="4">unshare</code>, "Makes it private again and stages its removal from the branch."],
          [<code key="5">archive [NAME]</code>, "Moves a finished dream to .lucid/dreams/.archive/ and forgets its bindings."],
          [<code key="6">path</code>, "Prints the dream’s folder."],
        ]}
      />

      <H2 id="note">note</H2>
      <CodeBlock lang="text" copy={false} code={`lucid note {decision,fact,failed,blocker} TEXT [-e EVIDENCE [EVIDENCE ...]]`} />
      <p>Logs a decision, fact, dead end (failed) or blocker, and prints its id.</p>
      <Table
        keys
        head={["Argument", "Meaning"]}
        rows={[
          [<code key="1">decision</code>, "A choice others must stay consistent with. Write it as “what, because why”."],
          [<code key="2">fact</code>, "A non-obvious truth about the code. Always give evidence."],
          [<code key="3">failed</code>, "A dead end: what was tried and why it broke, so nobody retries it."],
          [<code key="4">blocker</code>, "What you need, and from whom. The lead sees it on its next turn."],
          [<code key="5">TEXT</code>, "The entry. Quote it."],
          [
            <code key="6">-e, --evidence</code>,
            <>
              One or more <code>path[:line[-line]]</code> references, or free text.
            </>,
          ],
        ]}
      />
      <p>
        When evidence points at a file that exists, lucid records a hash of that file. If the file changes later,
        the entry is shown as <strong>⚠stale</strong> until someone re-checks it.
      </p>
      <CodeBlock
        label="Examples"
        what="note examples"
        code={`lucid note decision "use JWT, not sessions, because the API is stateless" -e src/auth.ts:42
lucid note failed   "bcrypt native build breaks on Node 24; use bcryptjs"
lucid note blocker  "need the DB schema from the migrations worker"`}
      />

      <H2 id="claim">claim</H2>
      <CodeBlock lang="text" copy={false} code={`lucid claim GLOB [GLOB ...] [--for TASK]`} />
      <p>
        Claims files before editing them. While your claim is active, other agents’ writes to matching files are
        blocked, whether through Edit/Write or through Bash.
      </p>
      <Table
        keys
        head={["Argument", "Meaning"]}
        rows={[
          [<code key="1">GLOB</code>, "One or more globs or paths. Quote globs so your shell doesn’t expand them."],
          [<code key="2">--for TASK</code>, "What the claim is for. Shown to other agents next to the claim."],
        ]}
      />
      <p>
        A claim that overlaps another active agent’s claim is refused with a message naming the owner, so you can pick
        other work or coordinate. Claims lapse after <Link href="/docs/configuration">LUCID_CLAIM_TTL</Link> seconds
        without activity from their owner, and are released automatically when a subagent stops or a session ends.
      </p>
      <CodeBlock label="Example" what="claim example" code={`lucid claim 'src/db/**' --for "migrations"     # release when done`} />

      <H2 id="release">release</H2>
      <CodeBlock lang="text" copy={false} code={`lucid release [GLOB ...]`} />
      <p>Drops your claims: all of them with no arguments, or only the given globs.</p>
      <CodeBlock label="Examples" what="release examples" code={`lucid release                 # all of your claims
lucid release 'src/db/**'     # just this one`} />

      <H2 id="supersede">supersede</H2>
      <CodeBlock lang="text" copy={false} code={`lucid supersede ID [ID ...] [--why WHY]`} />
      <p>
        Retires wrong or outdated entries. The log stays append-only: superseding adds an entry that marks the old ones
        as retired. Retired entries drop out of what agents are shown, and <code>lucid log</code> marks them{" "}
        <code>(superseded)</code>.
      </p>
      <CodeBlock label="Example" what="supersede example" code={`lucid supersede 12 --why "switched to sessions"`} />

      <H2 id="log">log</H2>
      <CodeBlock lang="text" copy={false} code={`lucid log [--since SINCE]`} />
      <p>
        Prints log entries in order, with <strong>⚠stale</strong> and <code>(superseded)</code> markers, and ends with{" "}
        <code>last id: N</code>. With <code>--since SINCE</code>, prints only entries after that id.
      </p>
      <CodeBlock label="Example" what="log example" code={`lucid log --since 40`} />

      <H2 id="status">status</H2>
      <CodeBlock lang="text" copy={false} code={`lucid status`} />
      <p>
        Prints the digest agents get when they start: the plan, the consolidated digest if <code>/lucid:dream</code> has
        written one, active claims, and the newest log entries that fit the budget. Use it to see exactly what a new
        agent would see.
      </p>

      <H2 id="wait">wait</H2>
      <CodeBlock lang="text" copy={false} code={`lucid wait [--timeout SECONDS]`} />
      <p>
        Blocks until another agent logs a <code>blocker</code> or <code>failed</code> entry, then prints it and exits.
        This includes the alarm lucid raises when one command changes many unclaimed files. The lead runs it in the
        background while workers run. Claude Code wakes the lead when the command exits, so a worker’s question doesn’t
        wait for the lead’s next turn. It also stops after 5 minutes with no other agent active, or at the timeout
        (default 1800 seconds). If the lead tries to end its turn while its workers still hold claims and nothing is
        waiting, lucid reminds it once.
      </p>

      <H2 id="end">end</H2>
      <CodeBlock lang="text" copy={false} code={`lucid end`} />
      <p>
        Ends the swarm. From then on, the swarm hooks only add one line at session start pointing at the old plan and
        log, so solo work afterwards doesn’t pay for coordination nobody needs. <Link href="/docs/team-rules">Team
        rules</Link> keep working. The output suggests <code>/lucid:dream</code> to turn the swarm’s lessons into rule
        proposals. The next <code>lucid init</code> moves the plan and log
        to the archive and starts fresh; deleting the dream’s <code>ended</code> file resumes the old swarm instead.
      </p>

      <H2 id="learn">learn</H2>
      <CodeBlock
        lang="text"
        copy={false}
        code={`lucid learn TEXT [--paths GLOB ...] [-e path:line ...] [--source chat|pr#123|dream|review] [--kind architecture|review|convention]`}
      />
      <p>
        Proposes a team rule. It writes <code>.lucid/proposed/&lt;slug&gt;.md</code> in the rule format, with{" "}
        <code>paths</code>, <code>kind</code>, <code>source</code>, <code>evidence</code> and the date in its
        frontmatter. The kind decides its folder once promoted: <code>.claude/rules/architecture/</code>,{" "}
        <code>review/</code> or <code>conventions/</code>. Claude Code
        doesn’t load that folder, so the proposal does nothing until a PR moves it into <code>.claude/rules/</code>. A
        rule whose text already appears in a proposal or a rule is refused with <code>already there</code>. Run in a repo
        without <code>.lucid/</code>, it creates one, so proposing the first rule opts the repo in.
      </p>
      <CodeBlock
        what="learn example"
        code={`lucid learn "Money is integer cents, never float; floats lost a cent in the 2025 refund bug" \
  --paths 'src/billing/**' -e src/billing/refund.ts:88 --source pr#412`}
      />

      <H2 id="rules">rules</H2>
      <CodeBlock lang="text" copy={false} code={`lucid rules [export [--check]]`} />
      <p>
        <code>lucid rules</code> lists every rule in <code>.claude/rules/</code>: its lucid keys, paths and this
        machine’s counts of <em>match</em>, <em>forbid</em>, <em>unresolved</em> and <em>review</em>. It also lists
        rules whose paths never matched an edit, rules skipped because of a bad regex, and proposals waiting in{" "}
        <code>.lucid/proposed/</code>.
      </p>
      <p>
        <code>lucid rules export</code> writes a generated block between{" "}
        <code>{`<!-- lucid:rules -->`}</code> markers in AGENTS.md for Codex, Copilot, Cursor and review bots. The rest
        of the file is left alone. <code>--check</code> writes nothing and exits 1 if the block is out of date, for CI.
      </p>

      <Callout>
        <p>
          Hooks call lucid as <code>lucid hook EVENT</code>. That is wired up by the plugin; you never run it yourself.
        </p>
      </Callout>
    </>
  );
}
