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
        code={`lucid [--as ME] init
lucid [--as ME] note {decision,fact,failed,blocker} TEXT [-e EVIDENCE [EVIDENCE ...]]
lucid [--as ME] claim GLOB [GLOB ...] [--for TASK]
lucid [--as ME] release [GLOB ...]
lucid [--as ME] supersede ID [ID ...] [--why WHY]
lucid [--as ME] log [--since SINCE]
lucid [--as ME] status`}
      />
      <p>
        Every command accepts <code>-h</code> / <code>--help</code>. Commands other than <code>init</code> need a{" "}
        <code>.lucid/</code> directory and exit with{" "}
        <code>lucid: no .lucid/ found here; run `lucid init` first</code> otherwise.
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
      <CodeBlock code={`lucid init`} what="lucid init" />
      <p>
        Creates <code>.lucid/</code> in this project with a plan template, an empty log and git settings. Safe to run
        again: an existing plan and log are kept. See{" "}
        <Link href="/docs/installation#created">what lucid init creates</Link>.
      </p>

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

      <Callout>
        <p>
          Hooks call lucid as <code>lucid hook EVENT</code>. That is wired up by the plugin; you never run it yourself.
        </p>
      </Callout>
    </>
  );
}
