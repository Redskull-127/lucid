---
name: dream
description: Consolidate a feature's lucid dream. Merges duplicates, retires stale entries, and turns its lasting lessons (architecture, review learnings, conventions) into proposed team rules. Use proactively when a [lucid] note says a feature has merged, after `lucid end`, when the log gets long, or before handing the work to a new session.
argument-hint: "[feature]"
---

Feature: $ARGUMENTS. If it's empty, use this branch's dream. If a feature is named, put `--dream <feature>` right after `lucid` in every command below.

1. Run `lucid log` and read every entry. The last line shows `last id: N`.
2. For each ⚠stale entry, re-read the code it cites. If the entry is no longer true, retire it with `lucid supersede <ids> --why "..."`. Also supersede duplicates, keeping the clearest one.
3. Write `digest.md` in the dream's folder, which `lucid dream path` prints.
   - The first line must be exactly `<!-- lucid:upto=N -->`.
   - Then at most about 40 lines: current decisions (with why), dead ends, and key facts with evidence. Leave out the plan, because agents already get it separately.
4. Never edit `log.jsonl`. Never drop a dead end unless it has been disproven.
5. Propose the lasting lessons as team rules. These are what future work anywhere in this repo needs, not this feature's details. Usually there are 0–5, and only ones a future agent would otherwise get wrong. Pick a kind for each:
   - `architecture`: how parts fit, and why. Example: "billing owns invoices; other services read them through BillingClient".
   - `review`: what review caught, or should catch next time. Example: "every new route checks session.role".
   - `convention`: how code is written here.

   Run `lucid learn "<lesson + why>" --kind <kind> --paths '<narrowest glob>' -e path:line --source dream:<feature>`. Proposals stay inactive in `.lucid/proposed/`.
6. If the feature has merged (a `[lucid] Feature … has merged` note said so):
   - Run `/lucid:learn promote` on these proposals. It writes them into `.claude/rules/<kind>/` and shows the diff.
   - Show the user the diff and **ask before opening a PR to main**. Never commit, push or open a PR without a yes.
   - Then run `lucid dream archive <feature>`. If the dream was shared (committed on the branch), its removal goes into the same learnings PR.

   If the feature hasn't merged yet, stop after step 5. The proposals wait in `.lucid/proposed/`.
