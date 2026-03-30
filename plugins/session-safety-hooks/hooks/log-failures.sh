#!/bin/bash
# PostToolUseFailure hook — categorizes and logs tool failures.
# Categories: BUILD, API, FILESYSTEM, NETWORK, PERMISSION, OTHER

INPUT=$(cat)
TOOL=$(echo "$INPUT" | jq -r '.tool_name // empty')
ERROR=$(echo "$INPUT" | jq -r '.error // .tool_result // empty' | head -5)
TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")
LOG_DIR="$HOME/.claude/logs"
MEMORY_ROOT="$HOME/.claude/memory"

mkdir -p "$LOG_DIR"

CATEGORY="OTHER"
SEVERITY="ERROR"

case "$ERROR" in
  *"ENOENT"*|*"No such file"*|*"not found"*)
    CATEGORY="FILESYSTEM"; SEVERITY="WARN" ;;
  *"EACCES"*|*"Permission denied"*|*"EPERM"*)
    CATEGORY="PERMISSION"; SEVERITY="ERROR" ;;
  *"ECONNREFUSED"*|*"ETIMEDOUT"*|*"fetch failed"*|*"network"*)
    CATEGORY="NETWORK"; SEVERITY="ERROR" ;;
  *"401"*|*"403"*|*"429"*|*"500"*|*"API"*|*"rate limit"*)
    CATEGORY="API"; SEVERITY="ERROR" ;;
  *"build"*|*"compile"*|*"syntax"*|*"TypeError"*|*"ReferenceError"*)
    CATEGORY="BUILD"; SEVERITY="ERROR" ;;
  *"CRITICAL"*|*"fatal"*|*"panic"*)
    SEVERITY="CRITICAL" ;;
esac

SHORT_ERROR=$(echo "$ERROR" | head -1 | cut -c1-200)

echo "- \`$TIMESTAMP\` | $SEVERITY | $CATEGORY | $TOOL | $SHORT_ERROR" >> "$LOG_DIR/failure-log.md"

# Also log to incident log if ERROR or CRITICAL
if [ "$SEVERITY" = "ERROR" ] || [ "$SEVERITY" = "CRITICAL" ]; then
  echo "- \`$TIMESTAMP\` | FAILURE | $SEVERITY | $CATEGORY | $TOOL | $SHORT_ERROR" >> "$LOG_DIR/incident-log.md"
  # Log to L6-audit for adaptive learning
  echo "{\"type\":\"tool_failure\",\"tool\":\"$TOOL\",\"category\":\"$CATEGORY\",\"severity\":\"$SEVERITY\",\"error\":\"$SHORT_ERROR\",\"timestamp\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}" >> "$MEMORY_ROOT/L6-audit/incidents.jsonl" 2>/dev/null
fi

exit 0
