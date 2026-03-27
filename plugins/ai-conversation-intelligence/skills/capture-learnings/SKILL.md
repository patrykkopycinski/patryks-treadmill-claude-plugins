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

**Mistakes & Corrections:**
- "Did I make any mistakes that needed correction?"
- "Would you approach this differently next time?"

**Validated Patterns:**
- "Did any approach work particularly well?"
- "Is there a pattern here worth repeating?"

### 2. Categorize the Learning

| If it's about... | Type | Example |
|------------------|------|---------|
| How you prefer to work | **feedback** | "Don't reformat unrelated code" |
| A non-obvious behavior or gotcha | **feedback** | "Scout fixtures must be imported in specific order" |
| Current work context or deadline | **project** | "Feature freeze on 2026-04-01" |
| Where to find information | **reference** | "API metrics in Grafana at ..." |

### 3. Save the Memory

Write to `~/.claude/projects/<project>/memory/knowledge/` with frontmatter:

```markdown
---
name: feedback_[topic]
description: One-line description of the lesson
type: feedback
---

[State the rule/pattern clearly]

**Why:** [Reason — incident, constraint, or validated approach]

**How to apply:** [When/where this guidance kicks in]
```

Update MEMORY.md index with a new entry.

### 4. Escalation Check

If this is the **second time** correcting the same mistake:
- Escalate to rule in `~/.agents/rules/`

If this is the **third time**:
- Escalate to skill in treadmill plugins

### 5. What NOT to Save

- Code patterns (derivable from reading code)
- Git history (use `git log`)
- Debugging solutions (the fix is in the code)
- Anything already in CLAUDE.md
- Ephemeral task details
