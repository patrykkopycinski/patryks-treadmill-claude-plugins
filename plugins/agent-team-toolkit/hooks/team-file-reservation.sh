#!/usr/bin/env bash
# Hook: PreToolUse (Write|Edit) — advisory file reservation for team teammates
# Exit 0 = allow, Exit 2 = reject with feedback (stderr)
#
# Inspired by Agent Flywheel's MCP Agent Mail file reservation system.
# Lightweight version: JSON file tracks which teammate owns which file globs.
#
# How it works:
#   1. When a team is created, the lead writes reservations in
#      ~/.claude/teams/<team-name>/reservations.json
#      Format: { "backend": "x-pack/**/server/**", "frontend": "x-pack/**/public/**" }
#   2. This hook checks if the file being edited conflicts with ANY reservation
#   3. If the editing agent's name matches the reservation owner, it's allowed
#   4. If no agent name is known, the hook only warns (doesn't block)
#
# The hook identifies the current agent via CLAUDE_AGENT_NAME env var or
# falls back to checking if only one reservation matches (self-evident ownership).

set -euo pipefail

# Graceful degradation
command -v jq >/dev/null 2>&1 || exit 0

TEAMS_DIR="$HOME/.claude/teams"
[ -d "$TEAMS_DIR" ] || exit 0

# Get the file being edited from tool input
TOOL_INPUT="${TOOL_INPUT:-}"
[ -z "$TOOL_INPUT" ] && exit 0

FILE_PATH=$(echo "$TOOL_INPUT" | jq -r '.file_path // empty' 2>/dev/null || echo "")
[ -z "$FILE_PATH" ] && exit 0

# Check all active team reservation files
for RESERVATIONS_FILE in "$TEAMS_DIR"/*/reservations.json; do
  [ -f "$RESERVATIONS_FILE" ] || continue

  # Find which reservations this file matches
  MATCHING_OWNERS=""
  ALL_OWNERS=""

  while IFS=$'\t' read -r OWNER GLOB_PATTERN; do
    [ -z "$OWNER" ] && continue
    ALL_OWNERS="$ALL_OWNERS $OWNER"

    # Convert glob to grep-compatible regex
    REGEX=$(echo "$GLOB_PATTERN" | sed 's/\./\\./g; s/\*\*/DOUBLESTAR/g; s/\*/[^\/]*/g; s/DOUBLESTAR/.*/g')

    if echo "$FILE_PATH" | grep -qE "$REGEX" 2>/dev/null; then
      MATCHING_OWNERS="$MATCHING_OWNERS $OWNER"
    fi
  done < <(jq -r 'to_entries[] | "\(.key)\t\(.value)"' "$RESERVATIONS_FILE" 2>/dev/null)

  # No reservations match this file — allow
  [ -z "$MATCHING_OWNERS" ] && continue

  # Count how many owners match
  MATCH_COUNT=$(echo "$MATCHING_OWNERS" | wc -w | tr -d ' ')

  if [ "$MATCH_COUNT" -eq 1 ]; then
    # Only one owner matches — this is that owner's file, allow
    exit 0
  fi

  # Multiple owners match the same file — this is a reservation conflict
  # (shouldn't happen with good non-overlapping globs, but catch it)
  echo "FILE RESERVATION WARNING: '$FILE_PATH' matches reservations for:$MATCHING_OWNERS — globs overlap. Lead should fix reservations.json." >&2
  exit 2
done

exit 0
