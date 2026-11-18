---
name: dream
description: Consolidate the lucid log into a short digest. Merges duplicates, retires outdated or wrong entries, re-checks stale ones and proposes lasting lessons as team rules. Use proactively after `lucid end`, when the log gets long, or before handing the project to a new session.
---

1. Run `lucid log` and read every entry. The last line shows `last id: N`.
2. For each ⚠stale entry, re-read the code it cites. If the entry is no longer true, retire it with `lucid supersede <ids> --why "..."`. Also supersede duplicates, keeping the clearest one.
3. Write `.lucid/digest.md`.
   - The first line must be exactly `<!-- lucid:upto=N -->`.
   - Then at most about 40 lines: current decisions (with why), dead ends, and key facts with evidence. Leave out the plan, because agents already receive `.lucid/plan.md` separately.
   - Agents get entries up to N from this digest, and newer entries are appended raw.
4. Never edit `log.jsonl`. Never drop a dead end unless it has been disproven.
5. Propose up to 3 lessons that would help any future session, not just this feature, as team rules: `lucid learn "<rule + why>" --paths '<glob>' -e path:line --source dream`. They stay inactive in `.lucid/proposed/` until a PR moves them into `.claude/rules/` (`/lucid:learn promote`). Never edit CLAUDE.md or `.claude/rules/` yourself here.
