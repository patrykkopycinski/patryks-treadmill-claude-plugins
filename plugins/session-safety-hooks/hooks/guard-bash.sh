#!/bin/bash
# PreToolUse hook for Bash commands.
# Shell-based (instant, zero LLM cost) with 3 tiers:
#   HARD BLOCK  — always blocked, no override
#   SOFT BLOCK  — blocked with explanation, user can re-request
#   LOG WARNING — allowed but logged
# Also reads L3-knowledge/safety_rules.md for learned patterns.

INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')
TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")
MEMORY_ROOT="$HOME/.claude/memory"
LOG_DIR="$HOME/.claude/logs"
INCIDENT_LOG="$LOG_DIR/incident-log.md"

mkdir -p "$LOG_DIR"

log_incident() {
  local SEVERITY="$1"
  local MSG="$2"
  echo "- \`$TIMESTAMP\` | GUARD | $SEVERITY | $MSG" >> "$INCIDENT_LOG"
}

deny() {
  local REASON="$1"
  local CONTEXT="$2"
  jq -n \
    --arg reason "$REASON" \
    --arg context "$CONTEXT" \
    '{
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision: "deny",
        permissionDecisionReason: $reason,
        additionalContext: $context
      }
    }'
  exit 0
}

# ═══════════════════════════════════════════════════════
# HARD BLOCK — never allowed
# ═══════════════════════════════════════════════════════

# rm -rf / or rm -rf ~ (catastrophic)
if echo "$COMMAND" | grep -qE 'rm\s+(-[a-zA-Z]*f[a-zA-Z]*\s+)?(/|~|\$HOME)\s*$'; then
  log_incident "CRITICAL" "BLOCKED: catastrophic rm → $COMMAND"
  deny "HARD BLOCK: This would delete your entire filesystem or home directory." "Command blocked: catastrophic rm detected."
fi

# git push --force (but allow --force-with-lease on non-main branches)
if echo "$COMMAND" | grep -qE 'git\s+push\s+.*--force|git\s+push\s+-f'; then
  # Allow --force-with-lease (safer than --force) on personal branches
  if echo "$COMMAND" | grep -qE '\-\-force-with-lease'; then
    # Block force-with-lease to main/master
    if echo "$COMMAND" | grep -qE 'git\s+push\s+.*\b(main|master)\b'; then
      log_incident "CRITICAL" "BLOCKED: force push to main/master → $COMMAND"
      deny "HARD BLOCK: Force push to main/master is never allowed." "Command blocked: force push to protected branch."
    else
      log_incident "LOW" "ALLOWED: force-with-lease on personal branch → $COMMAND"
    fi
  else
    # Plain --force or -f — always block
    log_incident "CRITICAL" "BLOCKED: force push → $COMMAND"
    deny "HARD BLOCK: Force push rewrites shared history. Use --force-with-lease instead." "Command blocked: use --force-with-lease for safer force push."
  fi
fi

# git reset --hard
if echo "$COMMAND" | grep -qE 'git\s+reset\s+--hard'; then
  log_incident "HIGH" "BLOCKED: git reset --hard → $COMMAND"
  deny "HARD BLOCK: git reset --hard destroys uncommitted changes." "Suggest using git stash or git commit first."
fi

# git clean -f
if echo "$COMMAND" | grep -qE 'git\s+clean\s+(-[a-zA-Z]*f|-f)'; then
  log_incident "HIGH" "BLOCKED: git clean -f → $COMMAND"
  deny "HARD BLOCK: git clean -f permanently deletes untracked files." "Suggest using git stash instead."
fi

# chmod 777
if echo "$COMMAND" | grep -qE 'chmod\s+777'; then
  log_incident "HIGH" "BLOCKED: chmod 777 → $COMMAND"
  deny "HARD BLOCK: chmod 777 grants full access to all users." "Use 755 or 644 instead."
fi

# dd to disk devices
if echo "$COMMAND" | grep -qE 'dd\s+.*of=/dev/'; then
  log_incident "CRITICAL" "BLOCKED: dd to device → $COMMAND"
  deny "HARD BLOCK: dd to block device could destroy disk." "Command blocked: direct disk write."
fi

# Fork bomb
if echo "$COMMAND" | grep -qE ':\(\)\{.*\}'; then
  log_incident "CRITICAL" "BLOCKED: fork bomb → $COMMAND"
  deny "HARD BLOCK: Fork bomb detected." "Command blocked."
fi

# ═══════════════════════════════════════════════════════
# SECRET EXPOSURE — block commands that leak credentials
# ═══════════════════════════════════════════════════════

# cat/read .env files
if echo "$COMMAND" | grep -qE '(cat|head|tail|less|more|bat)\s+.*(\.(env|env\.local|env\.production))'; then
  log_incident "HIGH" "BLOCKED: credential file read → $COMMAND"
  deny "HARD BLOCK: Reading .env files exposes secrets in output." "Use grep -c 'KEY_NAME' file to verify a key exists instead."
fi

# echo secret environment variables
if echo "$COMMAND" | grep -qE '(echo|printf)\s+.*\$(STRIPE_|OPENAI_|ANTHROPIC_|AWS_|DATABASE_|AUTH_SECRET|NEXTAUTH_SECRET|API_KEY|SECRET_KEY|PRIVATE_KEY|ELASTIC_)'; then
  log_incident "HIGH" "BLOCKED: secret echo → $COMMAND"
  deny "HARD BLOCK: Echoing secret environment variables exposes credentials." "Reference secrets by variable name only."
fi

# pipe .env to network
if echo "$COMMAND" | grep -qE '\.env.*\|\s*(curl|wget|nc|ncat)'; then
  log_incident "CRITICAL" "BLOCKED: credential file piped to network → $COMMAND"
  deny "HARD BLOCK: Piping credential files to network commands exfiltrates secrets." "Never pipe .env files to network commands."
fi

# git add .env
if echo "$COMMAND" | grep -qE 'git\s+add\s+.*(\.(env|env\.local|env\.production))'; then
  log_incident "CRITICAL" "BLOCKED: git add of credential file → $COMMAND"
  deny "HARD BLOCK: Staging .env files for commit would expose secrets." "These files must stay in .gitignore."
fi

# ═══════════════════════════════════════════════════════
# LEARNED PATTERNS — read knowledge/safety_rules.md
# ═══════════════════════════════════════════════════════

# Check both legacy L3 path and current knowledge/ path
SAFETY_RULES=""
for candidate in "$MEMORY_ROOT/knowledge/safety_rules.md" "$MEMORY_ROOT/L3-knowledge/safety_rules.md"; do
  [ -f "$candidate" ] && SAFETY_RULES="$candidate" && break
done

if [ -n "$SAFETY_RULES" ]; then
  # Extract patterns between **Pattern:** markers
  while IFS= read -r pattern; do
    pattern=$(echo "$pattern" | sed 's/^.*`//;s/`.*$//' | tr -d '[:space:]')
    [ -z "$pattern" ] && continue
    if echo "$COMMAND" | grep -qF "$pattern"; then
      log_incident "HIGH" "BLOCKED by learned rule: $pattern → $COMMAND"
      deny "BLOCKED by learned safety rule: $pattern" "This pattern was previously flagged as dangerous. Check $SAFETY_RULES for context."
    fi
  done < <(grep '^\*\*Pattern:\*\*' "$SAFETY_RULES" 2>/dev/null)
fi

# ═══════════════════════════════════════════════════════
# SOFT BLOCK — blocked but user can re-request
# ═══════════════════════════════════════════════════════

# rm with -r or -f (but allow on .claude/backups and .claude/logs)
if echo "$COMMAND" | grep -qE 'rm\s+(-[a-zA-Z]*[rf][a-zA-Z]*\s+)'; then
  if ! echo "$COMMAND" | grep -qE '\.claude/(backups|logs)'; then
    log_incident "MEDIUM" "SOFT BLOCKED: recursive/force rm → $COMMAND"
    deny "SOFT BLOCK: rm with -r or -f flags deletes files permanently." "If intentional, ask the user to confirm with specific paths."
  fi
fi

# curl/wget piped to shell (any interpreter)
if echo "$COMMAND" | grep -qE 'curl\s.*\|\s*(bash|sh|zsh|perl|python[23]?|ruby|node)'; then
  log_incident "HIGH" "SOFT BLOCKED: curl pipe to interpreter → $COMMAND"
  deny "SOFT BLOCK: Piping curl to an interpreter executes arbitrary remote code." "Download the file first, inspect it, then run it."
fi
if echo "$COMMAND" | grep -qE 'wget\s.*\|\s*(bash|sh|zsh|perl|python[23]?|ruby|node)'; then
  log_incident "HIGH" "SOFT BLOCKED: wget pipe to interpreter → $COMMAND"
  deny "SOFT BLOCK: Piping wget to an interpreter executes arbitrary remote code." "Download the file first, inspect it, then run it."
fi

# eval with variable expansion (injection risk)
if echo "$COMMAND" | grep -qE '\beval\b\s+.*\$'; then
  log_incident "HIGH" "SOFT BLOCKED: eval with variable expansion → $COMMAND"
  deny "SOFT BLOCK: eval with variable expansion is an injection risk." "Avoid eval — use direct command execution instead."
fi

# tee to world-readable temp dirs (data exposure)
if echo "$COMMAND" | grep -qE '\btee\b\s+(/tmp/|/var/tmp/)'; then
  log_incident "MEDIUM" "SOFT BLOCKED: tee to tmp dir → $COMMAND"
  deny "SOFT BLOCK: tee to /tmp or /var/tmp exposes data to other users." "Use a private directory instead."
fi

# wget --post-file (exfiltration)
if echo "$COMMAND" | grep -qE 'wget\s+.*--post-file'; then
  log_incident "HIGH" "SOFT BLOCKED: wget --post-file → $COMMAND"
  deny "SOFT BLOCK: wget --post-file can exfiltrate local files to remote servers." "Review the target URL and file being sent."
fi

# ═══════════════════════════════════════════════════════
# LOG WARNING — allowed but recorded
# ═══════════════════════════════════════════════════════

if echo "$COMMAND" | grep -qE '\brm\b'; then
  log_incident "LOW" "WARNING: rm command → $COMMAND"
fi

if echo "$COMMAND" | grep -qE 'git\s+checkout\s+\.'; then
  log_incident "MEDIUM" "WARNING: git checkout . discards changes → $COMMAND"
fi

# Log to tool history (try current path first, fall back to legacy)
TOOL_HISTORY="$LOG_DIR/tool-history.jsonl"
echo "{\"tool\":\"Bash\",\"decision\":\"allowed\",\"timestamp\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}" >> "$TOOL_HISTORY" 2>/dev/null

exit 0
