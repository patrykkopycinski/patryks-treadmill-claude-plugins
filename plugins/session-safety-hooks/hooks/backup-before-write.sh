#!/bin/bash
# PreToolUse async hook — timestamped backup before Write|Edit.
# 7-day auto-rotation. Zero-cost insurance against destructive writes.

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

# Skip if no file path or file doesn't exist yet
[ -z "$FILE_PATH" ] && exit 0
[ ! -f "$FILE_PATH" ] && exit 0

# Skip backups/logs (no recursion)
case "$FILE_PATH" in
  */.claude/logs/*|*/.claude/backups/*|*/.claude/memory/L1-session/*) exit 0 ;;
esac

BACKUP_DIR="$HOME/.claude/backups/$(date +%Y-%m-%d)"
mkdir -p "$BACKUP_DIR"

BASENAME=$(basename "$FILE_PATH")
TIMESTAMP=$(date +"%H%M%S")
cp "$FILE_PATH" "$BACKUP_DIR/${BASENAME}.${TIMESTAMP}.bak" 2>/dev/null

# Prune backups older than 7 days
find "$HOME/.claude/backups" -maxdepth 1 -type d -mtime +7 -exec rm -rf {} \; 2>/dev/null

exit 0
