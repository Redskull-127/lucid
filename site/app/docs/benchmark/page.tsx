import { CodeBlock } from "@/components/code-block";
import { Callout, DocHeader, H2, H3, Table, docMetadata } from "@/components/doc";
import { ThemedFigure } from "@/components/themed-image";
import { SITE } from "@/lib/site";

export const metadata = docMetadata("/docs/benchmark");

const b = (s: string) => <strong key={s}>{s}</strong>;

export default function Benchmark() {
  return (
    <>
      <DocHeader title="Benchmark">
        The same tasks, run with and without lucid, on Claude Haiku 5.5 and Claude Opus 5.5, in a small repo and a
        large private monorepo. When the plan changed
        mid-build, 44 of 44 runs passed with lucid and 11 of 44 without.
      </DocHeader>

      <H2 id="method">Methodology</H2>
      <p>
        Every run goes through headless <code>claude -p</code>. Everything else is identical between the two arms: the
        prompts, the tools, a fresh checkout per run, and project settings only (no personal plugins, hooks or{" "}
        <code>CLAUDE.md</code>). The lucid arm only adds the plugin and <code>lucid init</code>. A hidden acceptance test
        the agents never see scores the final code. Runs used two codebases: a small demo repo and a private 12k-file, ~950k-line
        TypeScript monorepo, which isn&rsquo;t named here, and none of its code is published. The 120 runs shown cost $24.86 in total.
      </p>
      <H3 id="scenarios">Scenarios</H3>
      <ul>
        <li>
          <strong>Plan changes early:</strong> two workers run in parallel, and you edit <code>PLAN.md</code> at the
          first worker edit.
        </li>
        <li>
          <strong>Plan changes late:</strong> the same, but the edit lands after both workers’ main edits.
        </li>
        <li>
          <strong>Policy in a new session:</strong> session 1 hears an unwritten policy, and a fresh session 2 must
          follow it.
        </li>
        <li>
          <strong>Simple task:</strong> one agent, nothing to coordinate. This measures the overhead.
        </li>
        <li>
          <strong>Monorepo rows:</strong> the same design in the private monorepo, with the two workers editing modules
          in two different packages.
        </li>
      </ul>

      <H2 id="results">Results</H2>
      <Table
        head={["Scenario", "Model", "With lucid", "Without"]}
        numeric={[2, 3]}
        rows={[
          ["Plan changes early", "Haiku 5.5", <>{b("8/8")} · $0.031</>, "4/8 · $0.030"],
          ["", "Opus 5.5", <>{b("5/5")} · $1.01</>, "1/5 · $0.91"],
          ["Plan changes late", "Haiku 5.5", <>{b("8/8")} · $0.033</>, <>{b("0/8")} · $0.026</>],
          ["", "Opus 5.5", <>{b("5/5")} · $1.06</>, "2/5 · $0.94"],
          ["Policy in a new session", "Haiku 5.5", "4/4 · $0.024", "4/4 · $0.022"],
          ["Simple task", "Haiku 5.5", "4/4 · $0.011", "4/4 · $0.009"],
          ["", "Opus 5.5", "3/3 · $0.37", "3/3 · $0.35"],
          ["Monorepo: plan changes early", "Haiku 5.5", <>{b("8/8")} · $0.045</>, "2/8 · $0.043"],
          ["Monorepo: plan changes late", "Haiku 5.5", <>{b("10/10")} · $0.053</>, "2/10 · $0.044"],
          ["Monorepo: simple task", "Haiku 5.5", "5/5 · $0.019", "5/5 · $0.017"],
        ]}
      />
      <p>Cells show runs passed and mean cost per run.</p>

      <ThemedFigure
        name="bench-success"
        width={760}
        height={678}
        alt="Task success with vs without lucid. Haiku: plan changes early 8/8 vs 4/8, late 8/8 vs 0/8, policy 4/4 vs 4/4, simple 4/4 vs 4/4. Opus: early 5/5 vs 1/5, late 5/5 vs 2/5, simple 3/3 vs 3/3"
      />

      <H2 id="what-it-shows">What it shows</H2>
      <ul>
        <li>
          <strong>Plan changes mid-build: 44/44 with lucid, 11/44 without, across both models and both codebases.</strong>{" "}
          Without lucid, Haiku missed every late change in the demo repo (0/8). Opus did better by re-checking the plan
          at the end (2/5), but still missed most changes. With lucid, the diff arrives before each worker’s next tool
          call.
        </li>
        <li>
          <strong>It holds in a large real codebase.</strong> In the private 12k-file monorepo, workers without lucid
          missed the mid-task change in 14 of 18 runs, and with lucid all 18 passed. Each run cost 6% more for early
          changes and 20% more for late ones.
        </li>
        <li>
          <strong>Cheaper per working result.</strong> lucid runs cost 2–26% more, mostly because they do the extra
          work the change requires (see below). Per <em>passing</em> run they cost about half as much on Haiku ($0.031 vs $0.061). On Opus
          they cost $1.01 vs $4.57 for early changes and $1.06 vs $2.35 for late ones.
        </li>
        <li>
          <strong>Plan changed by chatting with the lead: parity, 3/3 vs 3/3.</strong> In live tmux sessions, a lead
          without lucid relayed the change to its workers or applied it itself. lucid’s edge is for changes that don’t
          pass through the lead’s chat: you editing the plan, another agent, or another session. It also makes chat
          changes persist: when workers are active, lucid asks the lead to write the change into{" "}
          <code>plan.md</code>, and leads then did so 3/3 times (1/3 before), so the change survives{" "}
          <code>/compact</code>.
        </li>
        <li>
          <strong>One agent across sessions: parity.</strong> Claude Code’s built-in memory already carries the policy
          forward. lucid matches it; it doesn’t beat it.
        </li>
        <li>
          <strong>Overhead when there’s nothing to coordinate:</strong> +$0.002 and about +4–5 s per run on Haiku
          (+11–18%, in both codebases), and +$0.026 (+7%) and +6 s on Opus. Almost all of it is bookkeeping calls (see
          below).
        </li>
        <li>
          <strong>It found a lucid bug.</strong> The first memory run failed 1 of 4 because a finished session’s file
          claim blocked the next session. Claims now release on <code>SessionEnd</code>, and the scenario was rerun.
        </li>
      </ul>

      <H2 id="cost-per-pass">Cost per passing run</H2>
      <p>Total spend divided by the runs that worked. Lower is better.</p>
      <ThemedFigure
        name="bench-costpass-opus"
        width={760}
        height={300}
        alt="Opus 5.5 cost per passing run: plan changes early $1.01 vs $4.57, late $1.06 vs $2.35, simple task $0.37 vs $0.35"
      />
      <ThemedFigure
        name="bench-costpass-haiku"
        width={760}
        height={516}
        alt="Haiku 5.5 cost per passing run: plan changes early $0.031 vs $0.061, late $0.033 vs no run passed, policy $0.024 vs $0.022, simple task $0.011 vs $0.009"
      />

      <H2 id="raw">Raw cost and time per run</H2>
      <p>Mean per run, with the min–max range, for each model.</p>

      <H3 id="why-cost">Why lucid runs cost a bit more and take a bit longer</H3>
      <p>Measured from the run transcripts, three things explain the gap.</p>
      <ol>
        <li>
          <strong>They do the work the change requires.</strong> Most of the gap in the plan-change scenarios is work
          the baseline skipped: a failing run never applies the change. Compare only runs that passed:
        </li>
      </ol>
      <Table
        head={["", "with lucid", "without, passing runs only"]}
        rows={[
          ["Haiku, plan changes early", "$0.031 · 46 s", "$0.035 · 54 s"],
          ["Opus, plan changes early", "$1.006 · 49 s", "$0.987 · 58 s"],
          ["Opus, plan changes late", "$1.064 · 57 s", "$1.044 · 74 s"],
          ["Monorepo (Haiku), plan changes early", "$0.045 · 49 s", "$0.046 · 52 s"],
          ["Monorepo (Haiku), plan changes late", "$0.053 · 57 s", "$0.048 · 58 s"],
        ]}
        numeric={[1, 2]}
      />
      <p>
        When the baseline gets it right, it costs about the same and takes longer, because the lead discovers the
        change late and the work gets redone.
      </p>
      <ol start={2}>
        <li>
          <strong>Bookkeeping calls.</strong> Agents run short <code>lucid</code> commands to claim files and log
          decisions. That&rsquo;s about 9 per run with two workers, and about 5 even on the trivial single-agent task
          (10 tool calls vs 6). Each call is cheap but costs a model turn. On the simple task this is the whole
          overhead: +$0.002 on Haiku, +$0.026 on Opus, and +5–6 s.
        </li>
        <li>
          <strong>Injected context is small.</strong> Hooks added about 340 characters per simple run, and about 4,700
          characters (around 1,200 tokens) across all agents in a two-worker run. Each run processes 0.6–1 million
          tokens, mostly prompt-cache reads. Hook latency is about 25 ms per tool call, roughly 1 s per run.
        </li>
      </ol>
      <ThemedFigure
        name="bench-cost-opus"
        width={760}
        height={300}
        alt="Opus 5.5 mean cost per run with min-max range, with vs without lucid"
      />
      <ThemedFigure
        name="bench-time-opus"
        width={760}
        height={300}
        alt="Opus 5.5 mean wall-clock seconds per run with min-max range, with vs without lucid"
      />
      <ThemedFigure
        name="bench-cost-haiku"
        width={760}
        height={516}
        alt="Haiku 5.5 mean cost per run with min-max range, with vs without lucid"
      />
      <ThemedFigure
        name="bench-time-haiku"
        width={760}
        height={516}
        alt="Haiku 5.5 mean wall-clock seconds per run with min-max range, with vs without lucid"
      />

      <H2 id="reproduce">Reproduce it</H2>
      <p>From a checkout of the repo, run the Haiku set (about $1.50):</p>
      <CodeBlock label="In your terminal" what="Haiku benchmark command" code={`python3 bench/run.py --runs 8 -j 4`} />
      <p>Or the Opus set, at about $1 per run:</p>
      <CodeBlock
        label="In your terminal"
        what="Opus benchmark command"
        code={`python3 bench/run.py --runs 8 -j 4 --model opus --budget 30`}
      />
      <p>Then render the charts:</p>
      <CodeBlock label="In your terminal" what="chart command" code={`python3 bench/chart.py`} />
      <p>
        Raw results are in{" "}
        <a href={`${SITE.github}/blob/main/bench/results.jsonl`}>
          <code>bench/results.jsonl</code>
        </a>
        .
      </p>

      <H2 id="caveats">Caveats</H2>
      <Callout>
        <p>
          The samples are small (3–10 runs per arm). The monorepo set ran on Haiku only, from a private harness that
          names files in that repo, so it can&rsquo;t be reproduced from the public repo. To keep spend down, the Opus
          set skips the memory scenario. Treat this as a strong signal, not a paper.
        </p>
      </Callout>
    </>
  );
}
