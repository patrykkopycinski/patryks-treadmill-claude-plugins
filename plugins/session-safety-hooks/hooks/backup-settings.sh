#!/bin/bash
# SessionEnd hook — backs up Claude Code settings and agents/ directory.
# Skips if settings.json hasn't changed. Rotates to keep max 30 daily backups.

CLAUDE_DIR="$HOME/.claude"
SETTINGS_SRC="$CLAUDE_DIR/settings.json"
AGENTS_SRC="$CLAUDE_DIR/agents"
BACKUP_DIR="$CLAUDE_DIR/backups/settings"
LOG_DIR="$CLAUDE_DIR/logs"
TODAY=$(date +%Y-%m-%d)
TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")

mkdir -p "$BACKUP_DIR" "$LOG_DIR"

# Bail early if settings.json doesn't exist
[ ! -f "$SETTINGS_SRC" ] && exit 0

# --- Change detection via checksum ---
CHECKSUM=$(shasum -a 256 "$SETTINGS_SRC" 2>/dev/null | awk '{print $1}')
CHECKSUM_FILE="$BACKUP_DIR/.last-checksum"
LAST_CHECKSUM=$(cat "$CHECKSUM_FILE" 2>/dev/null)

if [ "$CHECKSUM" = "$LAST_CHECKSUM" ]; then
  exit 0
fi

# --- Backup settings.json ---
SETTINGS_DEST="$BACKUP_DIR/settings-$TODAY.json"
cp "$SETTINGS_SRC" "$SETTINGS_DEST" 2>/dev/null

# --- Backup agents/ directory ---
if [ -d "$AGENTS_SRC" ]; then
  rsync -a --delete "$AGENTS_SRC/" "$BACKUP_DIR/agents/" 2>/dev/null
fi

# --- Update checksum ---
echo "$CHECKSUM" > "$CHECKSUM_FILE"

# --- Rotate: keep max 30 daily backups ---
BACKUP_COUNT=$(ls "$BACKUP_DIR"/settings-*.json 2>/dev/null | wc -l | tr -d ' ')
if [ "$BACKUP_COUNT" -gt 30 ]; then
  ls -t "$BACKUP_DIR"/settings-*.json 2>/dev/null | tail -n +31 | xargs rm -f 2>/dev/null
fi

# --- Log backup event ---
echo "- \`$TIMESTAMP\` | BACKUP | settings.json | $SETTINGS_DEST" >> "$LOG_DIR/audit-trail.md" 2>/dev/null

exit 0
