#!/bin/sh
# Fast path in front of every lucid hook. Find .lucid/ by walking up from the project dir, stopping at the
# repo root, and only then start python. Projects that haven't opted in pay a few shell builtins, nothing more.
d="${LUCID_ROOT:-${CLAUDE_PROJECT_DIR:-$PWD}}"
while [ -n "$d" ]; do
  [ -d "$d/.lucid" ] && break
  [ -f "$d/.git" ] && break   # linked git worktree: lucid resolves the main checkout's dream
  [ -d "$d/.git" ] && exit 0  # repo root without .lucid/: not opted in
  d="${d%/*}"
done
[ -n "$d" ] && command -v python3 >/dev/null 2>&1 || exit 0
LUCID_ROOT="$d" exec python3 "${0%/*}/../bin/lucid" hook "$1"
