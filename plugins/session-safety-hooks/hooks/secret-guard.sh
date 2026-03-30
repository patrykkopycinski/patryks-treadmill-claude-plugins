#!/bin/bash
# PreToolUse hook for Write|Edit — detects secrets/credentials in content.
# Blocks writes containing API keys, tokens, or secrets to non-.env files.

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')
TOOL=$(echo "$INPUT" | jq -r '.tool_name // empty')
TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")
LOG_DIR="$HOME/.claude/logs"
INCIDENT_LOG="$LOG_DIR/incident-log.md"

mkdir -p "$LOG_DIR"

[ -z "$FILE_PATH" ] && exit 0

# Allow .env files and backups to contain secrets
case "$FILE_PATH" in
  *.env*|*/.claude/backups/*) exit 0 ;;
esac

# Get content based on tool type
if [ "$TOOL" = "Write" ]; then
  CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // empty')
elif [ "$TOOL" = "Edit" ] || [ "$TOOL" = "MultiEdit" ]; then
  CONTENT=$(echo "$INPUT" | jq -r '.tool_input.new_string // empty')
else
  exit 0
fi

[ -z "$CONTENT" ] && exit 0

# Check for common secret patterns
if echo "$CONTENT" | grep -qE '(sk[-_](live|test|ant|proj)[_-][A-Za-z0-9]{20,}|ghp_[A-Za-z0-9]{36}|ghs_[A-Za-z0-9]{36}|eyJhbGci[A-Za-z0-9+/=]{50,}|AKIA[0-9A-Z]{16}|xox[bpsar]-[A-Za-z0-9-]{20,})'; then
  echo "- \`$TIMESTAMP\` | SECRET | HIGH | BLOCKED: credential detected in $FILE_PATH" >> "$INCIDENT_LOG"
  jq -n \
    --arg file "$FILE_PATH" \
    '{
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision: "deny",
        permissionDecisionReason: ("SECURITY: Content contains API key/token/secret. Credentials must NEVER be written to non-.env files: " + $file),
        additionalContext: "Remove the credential. Reference by variable name instead. Secrets belong in .env files only."
      }
    }'
  exit 0
fi

exit 0
