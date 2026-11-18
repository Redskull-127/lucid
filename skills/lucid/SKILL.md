---
name: lucid
description: Shared memory ("the dream") for multi-agent work and team rules for every agent. One live plan, an evidence-backed log of decisions and dead ends, file claims, and `.claude/rules/` checked with `forbid` and `review`. Use when starting a multi-step feature, before spawning subagents or teammates, when the user changes the plan mid-build, when a `[lucid]` note asks for something, or when the user mentions lucid.
---

# Lucid protocol

No dream for this branch yet? Run `lucid init`. Each feature gets its own dream, named after its branch and kept out of git. Worktrees, stacked branches and your workers share it. `lucid init` prints the plan's path; write the plan there.

Once `.lucid/` exists, hooks do the plumbing. Every agent gets the plan and log when it starts. Changes from other agents arrive as `[lucid]` notes before your next tool call. Run `lucid ...` as is: each agent's id is added automatically. Never invent ids or names for yourself or for workers.

Who writes:

- **The lead, and workers whose brief said to `lucid claim`** write to the log.
- **Agents that only review, research or answer a question** read the dream but don't write to it. They report to whoever spawned them. Notes they write anyway are tagged `reader` and drop out once the code they cite changes.

Log with `lucid <command>` only what another agent would otherwise rediscover or get wrong:

- `note decision "<what> because <why>"`: choices others must stay consistent with.
- `note failed "<tried X, broke because Y>"`: dead ends, so nobody retries them.
- `note fact "<non-obvious truth about the code>" -e path:line`: always with evidence.
- `note blocker "<what you need, from whom>"`: the lead sees it on its next turn.
- `claim 'glob' --for "<task>"` before editing, `release` when done. Subagents release automatically when they stop.
- `wait`: the lead runs it with `run_in_background` while workers run. It returns, and wakes the lead, on a worker's blocker or dead end.
- `end`: the swarm is over. The hooks go quiet, and the plan and log stay.

Rules:

- Every fact needs evidence (`-e path:line`). An entry marked ⚠stale cites code that has changed since it was written, so re-read the code before relying on it.
- Never edit `.lucid/log.jsonl`; it is append-only. To retire a wrong entry, use `supersede <ids> --why "..."`. If your note corrects an earlier one, supersede the earlier one in the same step.
- The plan is the file named in your `[lucid]` header's `## Plan (...)` line, usually `.lucid/dreams/<feature>/plan.md`. Edit it in place with the Edit tool, and every running agent gets the diff automatically.
- A `[lucid] Feature … has merged` note means: run `/lucid:dream <feature>` to turn its lessons into team rules.
- A `PLAN CHANGED` note is the user's latest intent and overrides your original brief. If it touches files you own or claimed, apply it and log a decision.
- When spawning workers, don't paste the plan or earlier findings into the prompt, because they get those injected. Give the task, the files to claim and what "done" means.

## Team rules

`.claude/rules/*.md` are the team's rules. Claude Code loads each one when you touch a file under its `paths:`. lucid checks them too:

- A `[lucid] team rule …` note after an edit means a line you just added matches that rule's `forbid` pattern. Fix it, or say in one line why it's an exception.
- Before a turn ends, lucid may ask you to check your diff against the `review: true` rules for the files you touched. Do it honestly: read the diff, fix what breaks a rule, then end with one line per rule, `✓ <rule>` or `✗ <rule> path:line <why>`.
- When the user states a standing convention ("we never…", "from now on…"), run `lucid learn "<rule + why>" --paths '<glob>' -e path:line --source chat`. Proposals stay inactive until a PR merges them (`/lucid:learn`).
