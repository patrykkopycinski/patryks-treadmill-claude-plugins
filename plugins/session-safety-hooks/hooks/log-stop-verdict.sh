#!/bin/bash
# Stop hook — logs the quality verdict from the haiku review prompt.
# Writes JSONL for trend analysis. Generates daily log entry.

LOG_DIR="$HOME/.claude/logs"
MEMORY_ROOT="$HOME/.claude/memory"
VERDICT_LOG="$LOG_DIR/verdicts.jsonl"
NOMINATIONS="$MEMORY_ROOT/nominations"
TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")
TODAY=$(date +%Y-%m-%d)

mkdir -p "$LOG_DIR" "$NOMINATIONS"
# Create legacy dirs if they don't exist (backward compat)
mkdir -p "$MEMORY_ROOT/audit" 2>/dev/null

# Read verdict from stdin (piped from haiku Stop prompt)
RAW_VERDICT=$(cat)

# Extract JSON from potential markdown wrapping
VERDICT=$(echo "$RAW_VERDICT" | sed -n '/^{/,/^}/p' | head -1)
[ -z "$VERDICT" ] && VERDICT="$RAW_VERDICT"

# Parse JSON fields
DECISION=$(echo "$VERDICT" | jq -r '.decision // "unknown"' 2>/dev/null)
LEARNING=$(echo "$VERDICT" | jq -r '.learning // empty' 2>/dev/null)
TASK_TYPE=$(echo "$VERDICT" | jq -r '.task_type // "other"' 2>/dev/null)
REASON=$(echo "$VERDICT" | jq -r '.reason // empty' 2>/dev/null)
SCORE=$(echo "$VERDICT" | jq -r '.quality_score // 70' 2>/dev/null)

# Write JSONL verdict
jq -n \
  --arg ts "$TIMESTAMP" \
  --arg decision "$DECISION" \
  --arg learning "$LEARNING" \
  --arg task_type "$TASK_TYPE" \
  --arg reason "$REASON" \
  --arg score "$SCORE" \
  '{timestamp: $ts, decision: $decision, learning: $learning, task_type: $task_type, reason: $reason, quality_score: ($score | tonumber)}' \
  >> "$VERDICT_LOG" 2>/dev/null

# Write quality score to audit/
echo "{\"timestamp\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",\"overall_score\":$SCORE,\"task_type\":\"$TASK_TYPE\",\"decision\":\"$DECISION\"}" >> "$MEMORY_ROOT/audit/quality-scores.jsonl" 2>/dev/null

# Track blocks
if [ "$DECISION" = "block" ]; then
  echo "- \`$TIMESTAMP\` | VERDICT | BLOCK | $REASON" >> "$LOG_DIR/incident-log.md"
fi

# Nominate learning if present
if [ -n "$LEARNING" ] && [ "$LEARNING" != "null" ]; then
  cat > "$NOMINATIONS/verdict-learning-$(date +%Y%m%d-%H%M%S).md" <<EOF
# Learning from Stop Verdict

**Pattern:** $LEARNING
**Task Type:** $TASK_TYPE
**Source:** Stop hook verdict at $TIMESTAMP
**Quality:** Pending review
EOF
fi

# Append to daily log
DAILY_LOG="$LOG_DIR/daily-$TODAY.md"
if [ ! -f "$DAILY_LOG" ]; then
  cat > "$DAILY_LOG" <<EOF
# $TODAY Work Log

## Session Verdicts
EOF
fi

# Count tool history entries for summary
TOOL_COUNT=$(wc -l < "$LOG_DIR/tool-history.jsonl" 2>/dev/null | tr -d ' ')
echo "- \`$TIMESTAMP\` | $DECISION | quality=$SCORE | type=$TASK_TYPE | tools=$TOOL_COUNT" >> "$DAILY_LOG"

exit 0
