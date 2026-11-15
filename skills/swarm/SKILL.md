---
name: swarm
description: Split a feature across parallel agents (subagents or Agent-Teams teammates) that share one lucid plan, log and set of file claims. Use when the work splits into parts that touch different files.
argument-hint: <feature>
---

Feature: $ARGUMENTS

1. Run `lucid init` if needed. Then write `.lucid/plan.md`: the goal, then tasks that each own a separate set of files (a glob).
   - Keep tightly coupled work with ONE agent: parts that share files, or that depend on design decisions still open. Parallel agents only help on parts that don't touch each other.
2. Make the cross-cutting decisions yourself before spawning anyone: interfaces, names, data shapes. Log each one with `note decision`. Workers inherit them.
3. Spawn one worker per task.
   - Use Agent Teams if it's enabled (`CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`), otherwise background subagents.
   - The prompt is the task, its glob, what "done" means, and: "first run `lucid claim '<glob>' --for '<task>'`". Don't give workers names or ids, and don't claim their files for them; lucid identifies every agent itself. End the brief with: "`.lucid/plan.md` overrides this brief if the plan changes." Don't forbid edits the plan might later require.
   - Don't paste the plan or earlier findings into the prompt. Hooks inject them.
4. While they work, keep going on your own task. Workers' decisions, dead ends and blockers arrive as `[lucid]` notes. Act on blockers; don't poll.
5. If the user changes direction, use /lucid:replan. Every worker gets the diff before its next tool call.
6. At the end, verify the result yourself (tests, build) instead of trusting summaries. Check `lucid status` for unresolved blockers.
