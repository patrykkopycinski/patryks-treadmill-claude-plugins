#!/bin/bash
# Stop hook — tracks session usage stats (tool count, duration, files changed).
# Appends JSONL to usage.jsonl and a human-readable line to the daily log.

LOG_DIR="$HOME/.claude/logs"
TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")
TODAY=$(date +%Y-%m-%d)
NOW_EPOCH=$(date +%s)

mkdir -p "$LOG_DIR"

# Read stdin (Stop hook receives verdict output from preceding prompt hook)
RAW=$(cat)

# --- Session duration ---
SESSION_START_FILE="$LOG_DIR/session-start.txt"
SESSION_DURATION_MINUTES=0
if [ -f "$SESSION_START_FILE" ]; then
  START_EPOCH=$(cat "$SESSION_START_FILE" 2>/dev/null | tr -d '[:space:]')
  if [[ "$START_EPOCH" =~ ^[0-9]+$ ]]; then
    SESSION_DURATION_MINUTES=$(( (NOW_EPOCH - START_EPOCH) / 60 ))
  fi
fi

# --- Tool count (lines in session-volatile tool-history.jsonl) ---
TOOL_COUNT=$(wc -l < "$LOG_DIR/tool-history.jsonl" 2>/dev/null | tr -d ' ')
[ -z "$TOOL_COUNT" ] && TOOL_COUNT=0

# --- Files changed (audit-trail entries written since session start) ---
FILES_CHANGED=0
if [ -f "$LOG_DIR/audit-trail.md" ] && [ -f "$SESSION_START_FILE" ]; then
  START_EPOCH=$(cat "$SESSION_START_FILE" 2>/dev/null | tr -d '[:space:]')
  if [[ "$START_EPOCH" =~ ^[0-9]+$ ]]; then
    START_TS=$(date -r "$START_EPOCH" +"%Y-%m-%d %H:%M:%S" 2>/dev/null)
    if [ -n "$START_TS" ]; then
      FILES_CHANGED=$(grep -c "$TODAY" "$LOG_DIR/audit-trail.md" 2>/dev/null || echo 0)
    fi
  fi
fi
[ -z "$FILES_CHANGED" ] && FILES_CHANGED=0

# --- Append JSONL usage entry ---
jq -n \
  --arg ts "$TIMESTAMP" \
  --argjson dur "$SESSION_DURATION_MINUTES" \
  --argjson tools "$TOOL_COUNT" \
  --argjson files "$FILES_CHANGED" \
  --arg date "$TODAY" \
  '{timestamp: $ts, session_duration_minutes: $dur, tool_count: $tools, files_changed: $files, date: $date}' \
  >> "$LOG_DIR/usage.jsonl" 2>/dev/null

# --- Append to daily log ---
DAILY_LOG="$LOG_DIR/daily-$TODAY.md"
echo "- \`$TIMESTAMP\` | USAGE | duration=${SESSION_DURATION_MINUTES}m | tools=${TOOL_COUNT} | files_changed=${FILES_CHANGED}" >> "$DAILY_LOG" 2>/dev/null

# --- Weekly/monthly aggregation ---
DAY_OF_WEEK=$(date +%u)  # 7 = Sunday
DAY_OF_MONTH=$(date +%d)
DAYS_IN_MONTH=$(date -v +1m -v1d -v -1d +%d 2>/dev/null || date -d "$(date +%Y-%m-01) +1 month -1 day" +%d 2>/dev/null)

if [ "$DAY_OF_WEEK" = "7" ] || [ "$DAY_OF_MONTH" = "$DAYS_IN_MONTH" ]; then
  PERIOD_LABEL="weekly"
  [ "$DAY_OF_MONTH" = "$DAYS_IN_MONTH" ] && PERIOD_LABEL="monthly"
  TOTAL_TOOLS=$(awk -F'"tool_count":' 'NF>1{sum += $2+0} END{print sum+0}' "$LOG_DIR/usage.jsonl" 2>/dev/null)
  TOTAL_SESSIONS=$(wc -l < "$LOG_DIR/usage.jsonl" 2>/dev/null | tr -d ' ')
  echo "- \`$TIMESTAMP\` | AGGREGATE | $PERIOD_LABEL | sessions=${TOTAL_SESSIONS:-0} | total_tools=${TOTAL_TOOLS:-0}" >> "$DAILY_LOG" 2>/dev/null
fi

exit 0
