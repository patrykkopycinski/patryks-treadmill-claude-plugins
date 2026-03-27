# AI Conversation Intelligence

**4 skills + MCP server for pattern mining, learnings capture, and automation from AI session history**

Unified plugin that searches Claude Code and Cursor conversation history, mines recurring patterns, captures validated learnings into memory, and manages automations (hooks, rules, skills) derived from session insights. Replaces the former knowledge-base-system plugin.

---

## MCP Server: ai-chat-browser

Bundled MCP server that indexes and searches past AI conversations across all workspaces.

**Capabilities:**
- Search messages by keyword with surrounding context
- Search conversations by title
- Retrieve full conversation content
- Reindex conversation databases on demand

Defined in `mcp.json` and automatically registered when the plugin is loaded.

---

## Skills

### @mine-patterns
**Session history pattern miner**

Processes queued sessions from the analysis queue, searches conversation history for recurring themes, and surfaces actionable patterns (repeated mistakes, common workflows, knowledge gaps).

**Trigger:** `/mine-patterns` | "Analyze my recent sessions" | "Find patterns"

---

### @capture-learnings
**Validated learning capture**

Extracts non-obvious learnings from conversations and persists them as structured memory files (feedback, project, reference types). Deduplicates against existing memories.

**Trigger:** `/capture-learnings` | "Save what I learned" | End-of-session review

---

### @manage-automations
**Hook/rule/skill lifecycle manager**

Creates, updates, and removes automation artifacts (hooks, rules, skills) based on mined patterns. Escalation path: repeated pattern -> rule -> hook -> skill.

**Trigger:** "Create a hook for this" | "Automate this pattern" | "Review my automations"

---

### @marketplace-advisor
**Plugin discovery and recommendation**

Suggests relevant plugins and skills from the marketplace based on current workflow gaps. Compares installed plugins against available offerings.

**Trigger:** "What plugins should I install?" | "Find a skill for X"

---

## Commands

| Command | Description |
|---------|-------------|
| `/mine-patterns` | Process queued sessions and surface recurring patterns |
| `/review-nominations` | Review candidate learnings before promoting to memory |
| `/setup-memory` | Initialize the memory directory structure for a project |

---

## Hooks

| Hook | Behavior |
|------|----------|
| **SessionEnd** | Queues the ending session's metadata to `~/.claude/chat-browser/analysis-queue.jsonl` for later pattern mining. Does not perform analysis inline. |
| **SessionStart** | Checks for pending sessions in the analysis queue and suggests running `/mine-patterns` if entries exist. |

---

## Installation

```bash
cd ~/.claude/plugins/treadmill && git pull origin main
```

Restart Claude Code.

---

**Part of [Patryk's Treadmill](https://github.com/patrykkopycinski/patryks-treadmill-claude-plugins)**
