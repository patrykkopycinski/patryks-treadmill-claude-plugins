#!/bin/bash
# SessionStart(user) hook — resets stale state on fresh session start.
# Cleans gate files, validates hooks are executable, prunes old logs.

LOG_DIR="$HOME/.claude/logs"
HOOKS_DIR="$HOME/.claude/hooks"
MEMORY_ROOT="$HOME/.claude/memory"

mkdir -p "$LOG_DIR"

# 1. Reset stale gate files
rm -f "$LOG_DIR/.quality-gate-active" \
      "$LOG_DIR/.compaction-occurred" 2>/dev/null

# 2. Clear session-volatile data
: > "$LOG_DIR/tool-history.jsonl" 2>/dev/null
# Also clear legacy L1-session if it exists
: > "$MEMORY_ROOT/L1-session/current-context.json" 2>/dev/null
: > "$MEMORY_ROOT/L1-session/event-queue.jsonl" 2>/dev/null
: > "$MEMORY_ROOT/L1-session/tool-history.jsonl" 2>/dev/null

# 3. Validate hook scripts are executable
if [ -d "$HOOKS_DIR" ]; then
  FIXED=0
  for hook in "$HOOKS_DIR"/*.sh; do
    [ ! -f "$hook" ] && continue
    if [ ! -x "$hook" ]; then
      chmod +x "$hook" 2>/dev/null
      FIXED=$((FIXED + 1))
    fi
  done
  [ "$FIXED" -gt 0 ] && echo "- \`$(date +"%Y-%m-%d %H:%M:%S")\` | SESSION | INFO | Fixed permissions on $FIXED hook scripts" >> "$LOG_DIR/incident-log.md"
fi

# 4. Prune old audit trail (keep last 2000 lines)
if [ -f "$LOG_DIR/audit-trail.md" ]; then
  LINES=$(wc -l < "$LOG_DIR/audit-trail.md" | tr -d ' ')
  if [ "$LINES" -gt 5000 ]; then
    tail -2000 "$LOG_DIR/audit-trail.md" > "$LOG_DIR/audit-trail.md.tmp"
    mv "$LOG_DIR/audit-trail.md.tmp" "$LOG_DIR/audit-trail.md"
  fi
fi

# 5. Prune old failure log (keep last 500 lines)
if [ -f "$LOG_DIR/failure-log.md" ]; then
  LINES=$(wc -l < "$LOG_DIR/failure-log.md" | tr -d ' ')
  if [ "$LINES" -gt 1000 ]; then
    tail -500 "$LOG_DIR/failure-log.md" > "$LOG_DIR/failure-log.md.tmp"
    mv "$LOG_DIR/failure-log.md.tmp" "$LOG_DIR/failure-log.md"
  fi
fi

# 6. Prune incident log (keep last 1000 lines)
if [ -f "$LOG_DIR/incident-log.md" ]; then
  LINES=$(wc -l < "$LOG_DIR/incident-log.md" | tr -d ' ')
  if [ "$LINES" -gt 3000 ]; then
    tail -1000 "$LOG_DIR/incident-log.md" > "$LOG_DIR/incident-log.md.tmp"
    mv "$LOG_DIR/incident-log.md.tmp" "$LOG_DIR/incident-log.md"
  fi
fi

# 7. Prune old daily logs (keep last 14 days)
if [ -d "$LOG_DIR" ]; then
  find "$LOG_DIR" -name "daily-*.md" -mtime +14 -delete 2>/dev/null
fi

exit 0
