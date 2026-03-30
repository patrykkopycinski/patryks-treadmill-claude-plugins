#!/bin/bash
# SessionStart(compact) hook — restores context after auto-compaction.
# Reads marker left by pre-compact-handoff.sh, resets counters,
# injects resumption instructions for Claude.

LOG_DIR="$HOME/.claude/logs"
MARKER="$LOG_DIR/.compaction-occurred"

# Only run if compaction actually occurred
[ ! -f "$MARKER" ] && exit 0

COMPACT_TIME=$(cat "$MARKER" 2>/dev/null || echo "unknown")

# Clean up marker and stale state
rm -f "$MARKER" "$LOG_DIR/.quality-gate-active" 2>/dev/null

# Output resumption context for Claude
echo "POST-COMPACTION RESUME: Context was auto-compacted at $COMPACT_TIME. Read ~/.claude/memory/MEMORY.md and ~/.claude/memory/L5-daily/$(date +%Y-%m-%d).md to reload context, then continue working. Do not ask the user what to do — resume seamlessly."

exit 0
