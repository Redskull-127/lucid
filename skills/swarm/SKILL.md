---
name: swarm
description: Split a feature across parallel agents (subagents or Agent-Teams teammates) that share one lucid plan, log and set of file claims. Use proactively, without being asked, whenever you are about to run two or more agents that edit files at the same time, and the work splits into parts that touch different files.
argument-hint: <feature>
---

Feature: $ARGUMENTS

1. Run `lucid init` if this branch has no dream yet. It starts this feature's dream, named after the branch, and prints the plan's path. Worktrees, stacked branches and your workers all share it. Then write the plan there: the goal, then tasks that each own a separate set of files (a glob).
   - Several people building this feature? `lucid dream share` commits the dream on the branch so teammates get it.
   - Keep tightly coupled work with ONE agent: parts that share files, or that depend on design decisions still open. Parallel agents only help on parts that don't touch each other.
2. Make the cross-cutting decisions yourself before spawning anyone: interfaces, names, data shapes. Log each one with `note decision`. Workers inherit them.
3. Spawn one worker per task.
   - Use Agent Teams if it's enabled (`CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`), otherwise background subagents.
   - The prompt is the task, its glob, what "done" means, and: "first run `lucid claim '<glob>' --for '<task>'`". Don't give workers names or ids, and don't claim their files for them; lucid identifies every agent itself. End the brief with: "The lucid plan overrides this brief if it changes." Don't forbid edits the plan might later require.
   - Don't paste the plan or earlier findings into the prompt. Hooks inject them.
4. Right after spawning, run `lucid wait` with `run_in_background`. It returns, and wakes you, when a worker logs a blocker, a dead end or a stray-write alarm. Act on it, then run it again.
   - Keep going on your own task meanwhile. Workers' decisions arrive as `[lucid]` notes before your next tool call. Don't poll.
   - While workers run, nobody runs repo-wide formatters, linters with `--fix` or codegen. Format the exact files you edited. If such a command does run, lucid raises a blocker with a one-line `git restore`.
5. If the user changes direction, use /lucid:replan. Every worker gets the diff before its next tool call.
6. At the end, verify the result yourself (tests, build) instead of trusting summaries. Check `lucid status` for unresolved blockers.
   - lucid makes the parts fit together. It doesn't make them correct, so run the review step.
7. When the workers are done and the plan is complete, run `lucid end`. The hooks go quiet for later solo work, and the plan and log stay. When the feature's PRs merge, lucid tells the next session to run `/lucid:dream <feature>`, which turns its lessons into team rules.
