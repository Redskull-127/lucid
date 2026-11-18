#!/bin/sh
# Fast path in front of every lucid hook. Find .lucid/ (or lucid's bookkeeping in .git/lucid/) by walking up from the
# project dir, stopping at the repo root, and only then start python. Projects that haven't opted in pay a few shell
# builtins, nothing more, except at SessionStart, where lucid says in a few lines when it would help.
d="${LUCID_ROOT:-${CLAUDE_PROJECT_DIR:-$PWD}}"
while [ -n "$d" ]; do
  [ -d "$d/.lucid" ] && break
  if [ -d "$d/.git" ]; then
    [ -d "$d/.git/lucid" ] || d=""
    break
  fi
  if [ -f "$d/.git" ]; then  # linked worktree: opted in if the main checkout is
    IFS= read -r g < "$d/.git"; g="${g#gitdir: }"
    case "$g" in /*) ;; *) g="$d/$g" ;; esac
    c="${g%/worktrees/*}"
    [ -d "$c/lucid" ] || [ -d "${c%/.git}/.lucid" ] || d=""
    break
  fi
  d="${d%/*}"
done
command -v python3 >/dev/null 2>&1 || exit 0
[ -n "$d" ] || [ "$1" = SessionStart ] || exit 0
LUCID_HOOK_ROOT="${d:-${CLAUDE_PROJECT_DIR:-$PWD}}" exec python3 "${0%/*}/../bin/lucid" hook "$1"
