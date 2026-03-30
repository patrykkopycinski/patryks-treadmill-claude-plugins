#!/usr/bin/env bash
# Hook: TaskCompleted — validates task quality before marking complete
# Exit 0 = allow completion, Exit 2 = reject with feedback (stderr)
#
# Enforces:
#   1. No merge conflict markers in changed files
#   2. No FIXME/HACK/XXX markers introduced by this task (diff-only, not pre-existing)

set -euo pipefail

# Skip if not in a git repo
if ! git rev-parse --git-dir >/dev/null 2>&1; then
  exit 0
fi

# Check for merge conflict markers in modified files
CHANGED_FILES=$(git diff --name-only 2>/dev/null || true)
if [ -n "$CHANGED_FILES" ]; then
  CONFLICT_FILES=$(echo "$CHANGED_FILES" | xargs grep -l '<<<<<<<' 2>/dev/null || true)
  if [ -n "$CONFLICT_FILES" ]; then
    echo "Cannot complete task: merge conflict markers found in: $CONFLICT_FILES" >&2
    exit 2
  fi
fi

# Check for FIXME/HACK/XXX only in NEW lines (+ lines in diff), not pre-existing
HACK_LINES=$(git diff --unified=0 2>/dev/null | grep -E '^\+.*\b(FIXME|HACK|XXX)\b' | grep -v '^\+\+\+' || true)
if [ -n "$HACK_LINES" ]; then
  echo "Cannot complete task: new FIXME/HACK/XXX markers introduced:" >&2
  echo "$HACK_LINES" | head -5 >&2
  echo "Resolve these before marking the task complete." >&2
  exit 2
fi

exit 0
