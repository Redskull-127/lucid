---
name: learn
description: Turn what a team keeps telling its agents into team rules every agent follows. Use proactively when the user corrects you with a standing convention ("we never…", "from now on…"), when asked to learn from PR review comments, to import an existing CLAUDE.md or AGENTS.md into scoped rules, or to review and promote proposed rules.
argument-hint: "[pr <number> | recent <N> | import | promote]"
---

Team rules are `.claude/rules/*.md`. Claude Code loads each one when an agent touches a file under its `paths:` globs. lucid adds two optional keys:

```markdown
---
paths: ["src/api/**/*.ts"]
forbid: 'console\.log\('   # regex that lines an agent ADDS must not match (string or list); single quotes
review: true               # checked against the diff before an agent finishes a turn
---
# Log through `logger`, never console
Every API handler logs through src/lib/logger.ts so request ids are kept.
```

Rules are grouped by kind, each in its own folder: `.claude/rules/architecture/` (how parts fit, and why), `.claude/rules/review/` (what review catches) and `.claude/rules/conventions/` (how code is written here). Proposals go to `.lucid/proposed/` through `lucid learn --kind <architecture|review|convention>`. They do nothing until a PR moves them into `.claude/rules/`, so the team reviews every rule like code. Never commit, push or open a PR yourself unless the user asks.

Mode: $ARGUMENTS

## A correction in chat (no argument)

The user just told you something that holds beyond this task. Fix the code first, then:

1. Check that it isn't already covered: `lucid rules`, and grep `.claude/rules/` and `.lucid/proposed/`.
2. Run `lucid learn "<the rule in one imperative sentence, with the why>" --paths '<narrowest glob>' -e <path:line> --source chat`.
3. Tell the user in one line that it's proposed and reaches teammates once a PR merges it.

Skip it for one-off choices ("use a smaller font here"). Only standing conventions count.

## `pr <number>` or `recent <N>`: learn from code review

1. Get `owner` and `repo` with `gh repo view --json owner,name`. For `recent`, run `gh pr list --state merged --limit <N> --json number,title` and skip bot or dependency PRs.
2. For each PR, read the review threads (humans and review bots):
   ```
   gh api graphql -f query='query($o:String!,$r:String!,$n:Int!){repository(owner:$o,name:$r){pullRequest(number:$n){title reviewThreads(first:100){nodes{isResolved isOutdated path line comments(first:20){nodes{author{login} body}}}} reviews(first:50){nodes{author{login} state body}}}}}' -F o=<owner> -F r=<repo> -F n=<number>
   ```
3. Keep comments that state a convention a future change could break again ("we always…", "don't use X here", "every handler must…"). Weight a thread that was resolved or became outdated (the author changed the code) above one that was argued away. A theme seen in 2+ PRs is the strongest signal.
4. Drop style nits a linter already enforces, one-off bugs, and questions.
5. For each survivor, run `lucid learn "<rule + why>" --paths '<glob from the commented paths>' -e <path:line> --source pr#<n>`.
6. Report a short table: proposed rule, source PRs, paths.

## `import`: split a long CLAUDE.md or AGENTS.md into scoped rules

1. Read the project's CLAUDE.md and AGENTS.md, and any nested ones.
2. Group instructions by the files they concern. Each group becomes one `.claude/rules/<topic>.md` with the narrowest `paths:` that fits. Truly global rules have no `paths:` and stay few.
3. Write the files and show the user the diff. Ask before deleting anything from the original files. Suggest keeping only project overview and commands there.
4. Don't add `forbid` or `review` yet. That happens in `promote`, with evidence.

## `promote`: review proposals and turn them into rules

1. Read every file in `.lucid/proposed/`. Merge duplicates, and merge a proposal into an existing rule in `.claude/rules/` when they overlap.
2. For each proposal, decide with the user:
   - **`forbid`**: only if a regex captures the rule exactly. Grep the current code under the rule's paths first. Add it only when it matches zero lines, or only real violations the user wants flagged. A noisy pattern does more harm than none.
   - **`review: true`**: for judgment rules that should be checked against the diff, such as "every handler validates input" or "migrations are reversible". Keep these few, because each costs one review step per turn that touches its paths.
   - Neither: a plain rule that Claude Code loads when its files are touched.
3. Move each approved proposal into its kind's folder, for example `git mv .lucid/proposed/<f>.md .claude/rules/architecture/<topic>.md` (`convention` goes to `conventions/`). Then edit it: keep `paths`, add `forbid` or `review`, and delete `kind`, `source`, `evidence` and `proposed` (git history keeps them). Delete rejected proposals.
4. Run `lucid rules export` so Codex, Copilot, Cursor and review bots get the same rules through AGENTS.md.
5. Show `git status` and the diff, then suggest a PR titled "Team rules: …". Open it only if the user asks.

## Keep rules healthy

`lucid rules` lists each rule's matches, `forbid` hits, unresolved hits and reviews on this machine. It also lists rules whose paths never matched an edit, and rules it skipped as broken. Prune or fix those in a PR, the same way. In CI, `lucid rules export --check` fails when AGENTS.md has drifted from `.claude/rules/`.
