#!/bin/bash
# PostToolUse async hook — audit trail of all Write|Edit operations.

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')
TOOL=$(echo "$INPUT" | jq -r '.tool_name // empty')
TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")
LOG_DIR="$HOME/.claude/logs"
MEMORY_ROOT="$HOME/.claude/memory"

mkdir -p "$LOG_DIR"

[ -z "$FILE_PATH" ] && exit 0

echo "- \`$TIMESTAMP\` | $TOOL | $FILE_PATH" >> "$LOG_DIR/audit-trail.md"

# Also log to L1-session tool history
echo "{\"tool\":\"$TOOL\",\"file\":\"$FILE_PATH\",\"timestamp\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}" >> "$MEMORY_ROOT/L1-session/tool-history.jsonl" 2>/dev/null

exit 0
