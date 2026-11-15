---
name: replan
description: Apply a mid-build change of plan to the shared lucid plan so every running agent picks it up before its next tool call.
argument-hint: <the change>
---

The user changed the plan: $ARGUMENTS

1. Run `lucid init` if `.lucid/` doesn't exist.
2. Read `.lucid/plan.md` and edit it in place with the Edit tool.
   - Change tasks as needed.
   - Strike dropped tasks: `~~task~~ (dropped: why)`.
   - Give each new task an owner and a file set.
   - Keep it short.
3. Run `lucid note decision "replan: <one line> because <why>"`.
4. Running workers get the plan diff before their next tool call. If the change makes a worker's claimed task obsolete or conflicting, message that worker directly (SendMessage) instead of waiting for it to finish.
5. Tell the user what changed in one or two lines.
