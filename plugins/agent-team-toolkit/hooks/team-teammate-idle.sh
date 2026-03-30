#!/usr/bin/env bash
# Hook: TeammateIdle — quality gate when a teammate finishes a turn
# Exit 0 = allow idle, Exit 2 = send feedback to keep working (stderr)
#
# IMPORTANT: Teammates go idle after EVERY turn — this is normal.
# Only block on genuinely dangerous conditions.
#
# Enforces:
#   1. No merge conflict markers left in changed files

set -euo pipefail

# Skip if not in a git repo
if ! git rev-parse --git-dir >/dev/null 2>&1; then
  exit 0
fi

# Only check for merge conflict markers — the one thing that's never OK
CHANGED_FILES=$(git diff --name-only 2>/dev/null || true)
if [ -n "$CHANGED_FILES" ]; then
  CONFLICT_FILES=$(echo "$CHANGED_FILES" | xargs grep -l '<<<<<<<' 2>/dev/null || true)
  if [ -n "$CONFLICT_FILES" ]; then
    echo "Merge conflict markers found in: $CONFLICT_FILES — resolve before idling." >&2
    exit 2
  fi
fi

exit 0
