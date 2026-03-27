# AI Conversation Intelligence

**Your AI conversations are a goldmine. Stop losing them.**

Every correction you make, every workflow you repeat, every "always do X" instruction you give — it's all trapped in local session files, forgotten between conversations. This plugin changes that.

## What It Does

**1. Searches all your AI history in one place**

A unified MCP server indexes every Claude Code and Cursor session you've ever had. Ask "what did we decide about auth last week?" and get the actual conversation, not a vague memory.

```
search_messages("authentication refactor", source: "claude")
→ 3 matches across 2 sessions with full context
```

**2. Mines patterns you didn't know you had**

Scans your conversation history for:
- **Corrections** — things you keep fixing ("no, don't mock the database")
- **Repeated workflows** — the same 5 steps you run every time
- **Recurring instructions** — "always lint before commit" said 4 times
- **Validated approaches** — what actually worked

**3. Turns patterns into automations**

Discovered patterns become real artifacts:
- Corrections → memory entries or hook rules
- Repeated workflows → skills
- Recurring delegations → agents
- Instructions → CLAUDE.md updates or rules

With confidence-based safety: memories auto-merge at high confidence, but skills and hooks always require your review.

**4. Keeps your automation ecosystem healthy**

When new skills are created, evaluates whether they should be published to the marketplace. Deduplicates against existing automations so you don't end up with 3 skills that do the same thing.

## Quick Start

```bash
# After installing, run the initial sweep
/mine-patterns all

# Review what it found
/review-nominations

# Set up simplified memory structure (migrates from 6-tier if needed)
/setup-memory
```

## Architecture

```
┌─ Skills ────────────────────────────────────────┐
│  mine-patterns        → discover patterns       │
│  capture-learnings    → manual reflection        │
│  manage-automations   → review & create          │
│  marketplace-advisor  → evaluate for publishing  │
├─ Commands ──────────────────────────────────────┤
│  /mine-patterns       → bulk or incremental scan │
│  /review-nominations  → accept/reject candidates │
│  /setup-memory        → scaffold memory dirs     │
├─ Hooks ─────────────────────────────────────────┤
│  SessionEnd   → queues session for analysis      │
│  SessionStart → notifies of pending analysis     │
├─ MCP Server (ai-chat-browser) ──────────────────┤
│  Indexes Claude Code + Cursor sessions           │
│  SQLite FTS4 search across all conversations     │
│  Tools: search_messages, search_conversations,   │
│         get_conversation, list_projects, stats    │
└─────────────────────────────────────────────────┘
```

## Memory Structure

Uses a simplified 3-directory layout:

```
~/.claude/projects/<project>/memory/
├── MEMORY.md          ← index
├── knowledge/         ← validated learnings
├── nominations/       ← candidates pending review
└── audit/             ← promotion evidence, quality scores
```

## How Pattern Mining Works

1. **FTS pre-filter** — queries the search index for high-signal messages (corrections, confirmations, instructions)
2. **Context extraction** — pulls surrounding messages for each hit
3. **Classification** — categorizes as correction, workflow, delegation, validation, or instruction
4. **Confidence scoring** — frequency + clarity + actionability = 0-100 score
5. **Dedup** — LLM compares candidates against existing automations
6. **Output** — auto-merges high-confidence memories, nominates everything else for review

Skills, agents, and hooks **never** auto-merge. They always go through `/review-nominations`.

## Installation

### Via Marketplace

The plugin is part of [Patryk's Treadmill](https://github.com/patrykkopycinski/patryks-treadmill-claude-plugins):

```
ai-conversation-intelligence@patryks-treadmill
```

### MCP Server Setup

The MCP server ships inside the plugin. After installation:

```bash
cd <plugin-path>/mcp-server
npm install && npm run build
```

It registers automatically via `mcp.json`. On first run, it indexes all existing sessions (~30-60s for large histories, then incremental).

## Contributing

New skills should go through a PR. The `marketplace-advisor` skill evaluates readiness using a 6-criterion scoring system (reusable, self-contained, well-described, not project-specific, clear trigger, tested). Score 10+/12 to publish.
