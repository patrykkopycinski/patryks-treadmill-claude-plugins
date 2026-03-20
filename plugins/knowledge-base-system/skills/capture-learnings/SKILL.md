---
name: capture-learnings
description: Capture learnings after completing tasks - prompts for surprises, mistakes, and validated patterns to save as memory
---

# Capture Learnings

After completing a task, capture non-obvious learnings that should persist to future conversations.

## Process

### 1. Reflection Questions
Ask the user:

**Surprises & Non-obvious Discoveries:**
- "What was surprising or non-obvious about this task?"
- "Did you expect something to work differently?"
- "Were there any hidden gotchas or edge cases?"

**Mistakes & Corrections:**
- "Did I make any mistakes that needed correction?"
- "Would you approach this differently next time?"
- "What should I have done earlier or avoided entirely?"

**Validated Patterns:**
- "Did any approach work particularly well?"
- "Is there a pattern here worth repeating?"

### 2. Categorize the Learning

Based on the answers, determine memory type:

| If it's about... | Type | Example |
|------------------|------|---------|
| How you prefer to work | **feedback** | "Don't reformat unrelated code" |
| A non-obvious behavior or gotcha | **feedback** | "Scout fixtures must be imported in specific order" |
| Current work context or deadline | **project** | "Feature freeze on 2026-04-01 for release" |
| Where to find information | **reference** | "API metrics in Grafana at grafana.internal/d/api-latency" |

### 3. Memory Structure Template

For **feedback** memories (most common):

```markdown
---
name: feedback_[topic]
description: One-line description of the lesson
type: feedback
---

# [Topic] Pattern

[State the rule/pattern clearly]

**Why:** [Explain the reason - often a past incident, constraint, or validated approach]

**How to apply:** [When/where this guidance kicks in, with edge case handling]

**Never:**
- [Anti-patterns to avoid]

**Confirmed approach:** [Note that this was validated, not just theoretical]
```

### 4. Save the Memory

```bash
# Create the memory file
~/.claude/projects/-Users-patrykkopycinski-Projects-kibana/memory/feedback_[topic].md

# Add to MEMORY.md index
- [feedback_[topic].md](feedback_[topic].md) - Brief description
```

### 5. Escalation Check

If this is the **second time** you've corrected the same mistake:
- **Escalate to rule:** Create detailed procedural guidance in `~/.agents/rules/`

If this is the **third time**:
- **Escalate to skill:** Create automated workflow in `~/.agents/skills/`

## Red Flags - Don't Save These

❌ Code patterns (derivable from reading code)
❌ Git history (use `git log` or `git blame`)
❌ Debugging solutions (the fix is in the code)
❌ Anything already in CLAUDE.md
❌ Ephemeral task details

## Examples

### Good Memory (Non-obvious Gotcha)
```markdown
---
name: feedback_scout_fixture_order
description: Scout fixtures must be imported in specific order or tests fail silently
type: feedback
---

# Scout Fixture Import Order

Scout fixtures have dependency order requirements. If imported out of order, tests fail with cryptic errors.

**Why:** Learned during Scout migration - spent 2 hours debugging before discovering import order mattered. Not documented in Scout guides.

**How to apply:**
- Always import base fixtures before specialized ones
- Pattern: `scoutSpace`, then `browser`, then domain-specific fixtures
- If tests fail with "fixture not found," check import order

**Confirmed approach:** Validated across 15+ Scout test migrations.
```

### Poor Memory (Already in Code)
```markdown
# Don't save: "The validation function is in src/utils/validate.ts"
# Why: This is derivable by grepping or reading the code
```

## Automation Hooks

This skill is designed to be manually invoked after completing tasks, but can be automated:

**PostToolUse hook (after git commit):**
```yaml
event: PostToolUse
tool: Bash
condition: ${TOOL_ARGS} contains "git commit"
prompt: |
  A commit was just created. Run the /capture-learnings skill to check
  if there are any learnings worth saving to memory.
```

**SessionEnd hook:**
```yaml
event: SessionEnd
prompt: |
  Before ending this session, run /capture-learnings to capture any
  non-obvious discoveries from this work.
```
