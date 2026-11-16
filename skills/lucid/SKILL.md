---
name: lucid
description: Shared memory ("the dream") for multi-agent work. One live plan, an evidence-backed log of decisions and dead ends, and file claims that the lead, subagents and Agent-Teams teammates all see. Use when starting a multi-step feature, before spawning subagents or teammates, when the user changes the plan mid-build, or when the user mentions lucid.
---

# Lucid protocol

No `.lucid/` dir yet? Run `lucid init`, then write the plan into `.lucid/plan.md`.

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
- The plan is `.lucid/plan.md`. Edit it in place with the Edit tool and every running agent gets the diff automatically.
- A `PLAN CHANGED` note is the user's latest intent and overrides your original brief. If it touches files you own or claimed, apply it and log a decision.
- When spawning workers, don't paste the plan or earlier findings into the prompt, because they get those injected. Give the task, the files to claim and what "done" means.
