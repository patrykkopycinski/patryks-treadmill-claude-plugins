# Creating Plugins for This Marketplace

A practical guide for contributors who want to add plugins to `patryks-treadmill-claude-plugins`.

---

## 📁 Plugin Structure

Every plugin lives under `plugins/<plugin-name>/` and follows this layout:

```
plugins/my-plugin/
├── plugin.json          # Required — manifest declaring all components
├── README.md            # Required — what it does, when to use it
├── skills/              # Optional — skills (LLM-guided workflows)
│   └── my-skill/
│       └── SKILL.md
├── agents/              # Optional — subagents with their own tools/model
│   └── my-agent.md
├── hooks/               # Optional — shell scripts for event-driven behavior
│   └── my-hook.sh
└── commands/            # Optional — slash command wrappers around skills
    └── my-command.md
```

**Only `plugin.json` and `README.md` are required.** Everything else is optional depending on what your plugin needs.

---

## 📋 plugin.json Format

The manifest declares all components. Claude Code reads this to register skills, agents, and hooks.

**Minimal example** (skills only, like `kibana-career-development`):

```json
{
  "name": "kibana-career-development",
  "version": "1.0.0",
  "description": "Career progression tracking and promotion evidence capture for Kibana developers",
  "author": {
    "name": "Patryk Kopycinski",
    "url": "https://github.com/patrykkopycinski"
  },
  "skills": [
    { "path": "skills/promotion-evidence-tracker" }
  ]
}
```

**Full example** (skills + commands + hooks, like `ai-conversation-intelligence`):

```json
{
  "name": "ai-conversation-intelligence",
  "version": "0.1.0",
  "description": "Unified AI conversation search, pattern mining, and automated skill/agent/hook creation",
  "author": "Patryk Kopycinski",
  "skills": [
    { "id": "mine-patterns", "path": "skills/mine-patterns/SKILL.md" },
    { "id": "capture-learnings", "path": "skills/capture-learnings/SKILL.md" }
  ],
  "commands": [
    { "id": "mine-patterns", "path": "commands/mine-patterns.md" },
    { "id": "setup-memory", "path": "commands/setup-memory.md" }
  ],
  "hooks": {
    "SessionEnd": [
      {
        "type": "prompt",
        "prompt": "Queue this session for pattern mining at ~/.claude/chat-browser/analysis-queue.jsonl",
        "timeout": 15,
        "model": "haiku"
      }
    ]
  }
}
```

**Field reference:**

| Field | Required | Notes |
|-------|----------|-------|
| `name` | Yes | Must match directory name |
| `version` | Yes | Semver |
| `description` | Yes | One sentence, shown in `/plugin` browser |
| `author` | Yes | String or `{ name, url }` object |
| `skills` | No | Array of `{ path }` or `{ id, path }` |
| `agents` | No | Path to agents directory (e.g., `"./agents/"`) |
| `commands` | No | Array of `{ id, path }` |
| `hooks` | No | Object keyed by event type |
| `keywords` | No | Array of strings for discoverability |
| `license` | No | Default MIT |
| `repository` | No | `{ type: "git", url: "..." }` |

---

## 🧠 Skills — SKILL.md Format

Skills are LLM-guided workflow documents. They tell Claude how to do something when invoked.

**File path:** `skills/<skill-name>/SKILL.md` (directory) or `skills/<skill-name>.md` (flat)

**Frontmatter fields:**

```yaml
---
name: my-skill                    # Required — matches the id in plugin.json
description: >                    # Required — when Claude should invoke this skill
  One or two sentences. Include trigger phrases users might say.
trigger: |                        # Optional — explicit trigger conditions
  - After completing any non-trivial task
  - User says "log this"
examples:                         # Optional — few-shot examples
  - input: "I just improved test coverage"
    output: "Logs to Technical Leadership: ..."
---
```

**Real example from `promotion-evidence-tracker`:**

```yaml
---
name: promotion-evidence-tracker
description: >
  Automatically tracks and logs promotion-worthy achievements after completing tasks.
  Analyzes work context, categorizes by competency framework, generates evidence entries with metrics.
trigger: |
  - After completing any non-trivial task (feature, bug fix, optimization)
  - User says "log this for promotion"
examples:
  - input: "I just improved eval pass rate from 70% to 100%"
    output: "Logs to Problem Solving & Impact: '100% eval pass rate via root cause analysis...'"
---
```

**Real example from `code-refactor` (simpler style):**

```yaml
---
name: code-refactor
description: Systematic code refactoring based on Martin Fowler's methodology. Use when users
  ask to refactor code, improve code structure, reduce technical debt, clean up legacy code,
  eliminate code smells, or improve code maintainability.
---
```

The body of SKILL.md is the actual instruction document — write it for Claude, not for humans. Include phases, decision criteria, and explicit instructions.

---

## 🤖 Agents — Agent .md Format

Agents are subagents with their own tool restrictions, model, and context. They live in the `agents/` directory and are referenced via `"agents": "./agents/"` in `plugin.json`.

**Frontmatter fields:**

```yaml
---
name: my-agent                    # Required
description: >                    # Required — when to invoke this agent
  One sentence. Explain what question it answers or what it does.
tools:                            # Optional — restrict tool access
  - Read
  - Grep
  - Glob
  - Bash(git:*)                   # Bash with command restriction
model: haiku                      # Optional — haiku/sonnet/opus (default: sonnet)
memory: none                      # Optional — none/read/write
maxTurns: 10                      # Optional — cap on reasoning steps
---
```

**Real example from `yak-shave-detector`:**

```yaml
---
name: yak-shave-detector
description: >
  Catches scope creep before it costs you hours. Monitors task scope and
  detects when you've drifted from the original goal.
tools:
  - Read
  - Glob
model: haiku
memory: none
maxTurns: 4
---
```

**Real example from `archaeologist`:**

```yaml
---
name: archaeologist
description: >
  Code history investigator. Answers "why was this written this way?" by
  digging through git history, blame, related issues, and commit messages.
tools:
  - Read
  - Grep
  - Glob
  - Bash(git:*)
model: sonnet
memory: none
maxTurns: 10
---
```

**Model selection guidance:**
- `haiku` — simple checks, scope validation, fast lookups (low cost)
- `sonnet` — code analysis, investigation, most agent work (default)
- `opus` — avoid unless the task genuinely requires it (5x cost)

---

## 🪝 Hooks — Shell Scripts

Hooks run automatically on Claude Code events. They are shell scripts that receive JSON input via stdin and respond with JSON.

### Event Types

| Event | When it fires | Common use |
|-------|--------------|------------|
| `PreToolUse` | Before any tool call | Block dangerous commands, back up files |
| `PostToolUse` | After a successful tool call | Log changes, audit writes |
| `PostToolUseFailure` | After a tool call failure | Log incidents |
| `SessionStart` | Session begins | Reset state, restore context |
| `Stop` | Claude finishes responding | Session verdicts, wrap-up |
| `PreCompact` | Before context compaction | Save state |
| `TaskCreated` | New task spawned in team | Validate scope |
| `TaskCompleted` | Task finishes | Quality gate |
| `TeammateIdle` | Teammate goes idle | Check readiness |

### Hook Entry in plugin.json

```json
"hooks": {
  "PreToolUse": [
    {
      "matcher": "Bash",
      "hooks": [
        {
          "type": "command",
          "command": "${CLAUDE_PLUGIN_ROOT}/hooks/guard-bash.sh",
          "statusMessage": "Checking command safety...",
          "timeout": 10
        }
      ]
    }
  ]
}
```

**Fields:**
- `matcher` — tool name pattern (`"Bash"`, `"Write|Edit"`, `"*"`) — omit for non-tool events
- `type` — `"command"` (shell script) or `"prompt"` (LLM instruction)
- `command` — use `${CLAUDE_PLUGIN_ROOT}` for portability
- `statusMessage` — shown in Claude Code UI during execution
- `timeout` — seconds before hook is killed (default varies by event)
- `async: true` — run without blocking Claude Code

### Shell Script Structure

```bash
#!/bin/bash
# Read JSON input from stdin
INPUT=$(cat)

# Extract fields with jq
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

# Use $HOME (not ~) for portable paths
LOG_DIR="$HOME/.claude/logs"
mkdir -p "$LOG_DIR"

# Deny with explanation
deny() {
  local REASON="$1"
  jq -n --arg reason "$REASON" \
    '{"decision":"block","reason":$reason}'
  exit 0
}

# Allow (exit 0 = allow, no output needed for allow)
exit 0
```

**Key rules for hooks:**
- Always use `$HOME` instead of `~` — hooks run in subshell, `~` may not expand
- Use `${CLAUDE_PLUGIN_ROOT}` to reference other files in your plugin
- `exit 0` with no output = allow; output JSON with `decision: "block"` = deny
- Keep hooks fast — slow hooks degrade the UX. Use `async: true` for logging

**Real hook from `session-safety-hooks`:**

```bash
#!/bin/bash
# PreToolUse hook — blocks dangerous Bash commands

INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')
LOG_DIR="$HOME/.claude/logs"
INCIDENT_LOG="$LOG_DIR/incident-log.md"
mkdir -p "$LOG_DIR"

# Hard blocks — never allow
case "$COMMAND" in
  *"rm -rf /"*|*"dd if="*|*"mkfs"*)
    jq -n '{"decision":"block","reason":"Destructive system command blocked"}'
    exit 0
    ;;
esac

exit 0
```

---

## 📦 Registering Your Plugin

To add your plugin to this marketplace:

1. **Add your plugin directory** under `plugins/`

2. **Verify plugin.json** is valid (see format above)

3. **Test it locally:**
   ```bash
   # Symlink into your Claude plugins directory
   ln -s $(pwd)/plugins/my-plugin ~/.claude/plugins/my-plugin
   # Restart Claude Code and verify it appears
   ```

4. **Open a PR.** The marketplace is discovered automatically from `plugins/` — no separate registration file needed.

The `skill-ecosystem-tools` plugin includes a `validate-claude-marketplace` skill that checks plugin structure before you submit:

```
/validate-claude-marketplace plugins/my-plugin
```

---

## ✅ Quality Checklist

Before submitting a plugin, verify:

**Structure**
- [ ] `plugin.json` has name, version, description, author
- [ ] Plugin name matches directory name exactly
- [ ] All paths in `plugin.json` exist as real files/directories
- [ ] `README.md` explains what the plugin does and when to use it

**Skills**
- [ ] SKILL.md frontmatter has `name` and `description`
- [ ] Description includes trigger phrases users would naturally say
- [ ] Instructions in the body are written for Claude, not for humans
- [ ] No hardcoded personal paths — use `$HOME` or variables

**Agents**
- [ ] `model: haiku` for cheap sanity checks, `model: sonnet` for real work
- [ ] `maxTurns` is set conservatively (don't let agents run forever)
- [ ] Tool list is scoped to minimum needed

**Hooks**
- [ ] Scripts use `$HOME` not `~`
- [ ] Scripts use `${CLAUDE_PLUGIN_ROOT}` for self-references
- [ ] Long-running operations use `async: true`
- [ ] `allow` is the default (hooks only fire to block or log, not to interrogate)
- [ ] Scripts are executable: `chmod +x hooks/*.sh`

**General**
- [ ] Plugin has a single, clear purpose — not a dumping ground
- [ ] No personal data, credentials, or machine-specific paths
- [ ] Tested locally with at least one real workflow
