#!/bin/bash
# PreCompact hook — saves state marker before auto-compaction.
# post-compact-resume.sh reads this marker to restore context.

TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")
LOG_DIR="$HOME/.claude/logs"

mkdir -p "$LOG_DIR"

echo "$TIMESTAMP" > "$LOG_DIR/.compaction-occurred"
echo "- \`$TIMESTAMP\` | COMPACTION | INFO | Auto-compaction triggered — state saved" >> "$LOG_DIR/incident-log.md"

exit 0
