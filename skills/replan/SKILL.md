---
name: replan
description: Apply a mid-build change of plan to the shared lucid plan so every running agent picks it up before its next tool call. Use proactively whenever the user changes requirements while lucid workers are running.
argument-hint: <the change>
---

The user changed the plan: $ARGUMENTS

1. Run `lucid init` if this branch has no dream yet (`lucid status` says so).
2. Read the plan, at the path in your `[lucid]` header's `## Plan (...)` line (or `lucid dream path`), and edit it in place with the Edit tool.
   - Change tasks as needed.
   - Strike dropped tasks: `~~task~~ (dropped: why)`.
   - Give each new task an owner and a file set.
   - Keep it short.
3. Run `lucid note decision "replan: <one line> because <why>"`. Retire entries the change makes obsolete right away, for example a blocker on a dropped task: `lucid supersede <ids> --why "replan: ..."`.
4. Running workers get the plan diff before their next tool call. If the change makes a worker's claimed task obsolete or conflicting, message that worker directly (SendMessage) instead of waiting for it to finish.
   - Pick ONE path for each change: hand it to the file's owner (message it, even if it has finished), or claim the files and do it yourself. Never both, or you'll race the worker on the same file.
5. Tell the user what changed in one or two lines.
