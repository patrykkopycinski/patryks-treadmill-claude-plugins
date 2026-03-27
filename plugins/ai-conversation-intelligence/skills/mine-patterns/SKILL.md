---
name: mine-patterns
description: Analyze AI conversation history to discover corrections, repeated workflows, validated approaches, and recurring instructions that should become skills, agents, hooks, or memory entries
---

# Mine Patterns

Analyze conversation history from the ai-chat-browser MCP to discover automatable patterns.

## Two Modes

### Incremental (from SessionStart queue)
Process specific sessions queued by the SessionEnd hook.

### Bulk Sweep (from /mine-patterns command)
Scan all indexed sessions or a filtered subset.

## Process

### Step 1: FTS Pre-Filter

Query the ai-chat-browser MCP `search_messages` tool for high-signal messages.

**Correction signals** (user correcting the assistant):
- Query: `"no don't" OR "wrong" OR "stop" OR "that's not" OR "I said"`

**Confirmation signals** (user validating an approach):
- Query: `"perfect" OR "exactly" OR "yes that's right" OR "keep doing"`

**Instruction signals** (user giving persistent directives):
- Query: `"always" OR "never" OR "make sure" OR "from now on" OR "remember to"`

For each query, use `limit: 50` and `context_messages: 3`.

### Step 2: Context Extraction

For each hit from Step 1, use `get_conversation` with the `search` parameter to retrieve the matching message with ±3 messages of surrounding context.

### Step 3: Pattern Classification

For each high-signal hit with context, classify the pattern:

| Pattern Type | Signal | Proposed Output |
|---|---|---|
| **correction** | User says "no/don't/wrong" then provides right way | `feedback` memory or hook rule |
| **repeated_workflow** | Same tool call sequence across 3+ sessions | Skill candidate |
| **repeated_delegation** | Same autonomous task requested 3+ times | Agent candidate |
| **validated_approach** | User confirms with positive signals | `feedback` memory |
| **recurring_instruction** | Same instruction in 3+ sessions | Rule or CLAUDE.md update |

### Step 4: Confidence Scoring

Assign 0-100 confidence based on:
- **Frequency** (40%): How many sessions show this pattern? (1 session = low, 3+ = high)
- **Clarity** (30%): How explicit is the user's correction/instruction? (ambiguous = low, direct quote = high)
- **Actionability** (30%): Can this be converted to a concrete automation? (vague preference = low, specific rule = high)

### Step 5: LLM-Based Dedup

Before creating a nomination:

1. **Keyword pre-filter**: Use Grep to search existing files:
   - `~/.claude/projects/<project>/memory/knowledge/` (existing memories)
   - `~/.agents/rules/` (existing rules)
   - `~/.agents/skills/` (existing skills)
   - `~/Projects/patryks-treadmill-claude-plugins/plugins/*/skills/` (treadmill skills)

2. **LLM similarity check**: If keyword matches found, evaluate:
   - "Given existing automation X, is candidate Y a **duplicate**, an **extension**, or **genuinely new**?"
   - **Duplicate** → discard
   - **Extension** → nominate as update to existing (include diff)
   - **New** → nominate as creation

### Step 6: Write Nominations

**Auto-merge** (confidence 80+, memories and rules only):
- Write directly to `knowledge/` or `~/.agents/rules/`
- Update MEMORY.md
- Log as auto-merged for awareness during `/review-nominations`

**Nominate** (confidence 50+, or any skill/agent/hook):
- Write to `~/.claude/projects/<project>/memory/nominations/`
- File format:

```markdown
---
id: candidate_<8-char-hash>
confidence: <score>
type: feedback | skill | agent | hook | rule | claude_md
target: new | update:<existing-file-path>
source_sessions:
  - <session-id-1>
  - <session-id-2>
discovered_at: <ISO-8601>
pattern_type: correction | repeated_workflow | repeated_delegation | validated_approach | recurring_instruction
auto_merged: false
---

# <Title>

## Evidence

<Relevant message excerpts from source sessions>

## Proposed Content

<The actual memory/skill/hook content to create or diff to apply>
```

**Discard** (confidence < 50): Skip silently.

### Step 7: Report

After processing, summarize:
- Total sessions analyzed
- Patterns found by category
- Auto-merged items (with file paths)
- Nominations created (pending review)
- Discarded (count only)

Suggest running `/review-nominations` if there are pending items.
