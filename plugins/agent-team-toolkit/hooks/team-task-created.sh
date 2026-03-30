#!/usr/bin/env bash
# Hook: TaskCreated — validates new team tasks before they're added
# Exit 0 = allow, Exit 2 = reject with feedback (stderr)
#
# Enforces:
#   1. Task has a meaningful description (not too short)
#   2. Task scope is focused (single deliverable)

set -euo pipefail

# Graceful degradation if jq is not available
command -v jq >/dev/null 2>&1 || exit 0

TOOL_INPUT="${TOOL_INPUT:-}"
[ -z "$TOOL_INPUT" ] && exit 0

# Parse task content from tool input
TASK_CONTENT=$(echo "$TOOL_INPUT" | jq -r '.content // .description // .title // empty' 2>/dev/null || echo "")
[ -z "$TASK_CONTENT" ] && exit 0

# Reject tasks that are too vague (under 10 chars)
if [ ${#TASK_CONTENT} -lt 10 ]; then
  echo "Task too vague: '$TASK_CONTENT'. Provide a specific, actionable description (what file/module, what outcome)." >&2
  exit 2
fi

# Reject tasks with too many imperative verbs (indicates kitchen-sink scope)
VERB_COUNT=$(echo "$TASK_CONTENT" | grep -oiE '\b(add|remove|fix|refactor|update|create|delete|implement|test|migrate|rename|move|extract|replace|convert|rewrite)\b' | wc -l | tr -d ' ')
if [ "$VERB_COUNT" -gt 4 ]; then
  echo "Task has $VERB_COUNT distinct actions: '$TASK_CONTENT'. Split into 2-3 focused tasks with a single deliverable each." >&2
  exit 2
fi

exit 0
