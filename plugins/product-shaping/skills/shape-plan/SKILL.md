---
name: shape-plan
description: >
  Create detailed implementation plans with thorough research and iteration.
  Use when the user has a change to plan, says "plan this", "create a plan",
  "how should we build", or has a change-id ready for planning.
argument-hint: "<change-id> | <path-to-context>"
allowed-tools:
  - Read
  - Write
  - Bash
  - Task
  - AskUserQuestion
---

# Implementation Plan

You are tasked with creating detailed implementation plans through an interactive, iterative process. You should be skeptical, thorough, and work collaboratively with the user to produce high-quality technical specifications.

## Initial Response

When this command is invoked:

1. **Check if parameters were provided**:
   - If a file path or ticket reference was provided, skip the default message
   - Immediately read any provided files FULLY
   - Begin the research process

2. **If no parameters provided**, respond with:

```
I'll help you create a detailed implementation plan. Let me start by understanding what we're building.

Please provide:
1. The task/ticket description (or reference to a ticket file)
2. Any relevant context, constraints, or specific requirements
3. Links to related research or previous implementations

The more upstream context you pass in, the fewer questions I'll ask:
- Just a task description → full questioning
- Task + research doc (`context/changes/<change-id>/research.md`) → fewer questions
- Task + frame brief (`context/changes/<change-id>/frame.md`) → far fewer questions
- Task + frame + research → minimum questions

Tip: invoke directly with a change-id — `/shape-plan oauth-login`
```

Then wait for the user's input.

## Process Steps

### Step 1: Context Gathering and Initial Analysis

#### Step 1.0: Identify upstream artifacts and scale questioning depth

Identify what upstream artifacts the user passed in. Each represents decisions already made.

- **Frame brief** — path matches `context/changes/<change-id>/frame.md`
- **Research doc** — path matches `context/changes/<change-id>/research.md`
- **Task description only** — none of the above

Question count scales with what's provided:

| Upstream artifacts | LOW | MEDIUM | HIGH |
| --- | --- | --- | --- |
| Task only (baseline) | 4–6 | 7–10 | 11–15 |
| Task + research | 3–5 | 5–7 | 8–11 |
| Task + frame | 2–3 | 4–6 | 7–9 |
| Task + frame + research | 1–2 | 3–5 | 5–7 |

#### Step 1.1: Read and research

1. Read all mentioned files immediately and FULLY
2. Read `context/foundation/lessons.md` if present
3. Spawn initial research tasks to gather context using parallel sub-agents
4. Read all files identified by research tasks
5. Present informed understanding and assess complexity
6. Ask deep probing questions using AskUserQuestion

**Complexity scale:**

| Level | Questions | When to use |
| --- | --- | --- |
| **LOW** | 4-6 | Straightforward task, few moving parts |
| **MEDIUM** | 7-10 | Multiple components, design decisions needed |
| **HIGH** | 11-15 | Cross-cutting concerns, significant unknowns |

### Step 2: Research and Discovery

After initial clarifications:
1. Research implementation patterns and prior work
2. If user corrects misunderstandings, verify with fresh research
3. Spawn parallel sub-tasks for comprehensive research
4. Wait for ALL sub-tasks to complete
5. Present findings and design options

### Step 3: Plan Structure Development

Present plan outline and get structured feedback via AskUserQuestion.

### Step 4: Detailed Plan Writing

1. Resolve the change folder, then write to `context/changes/<change-id>/plan.md`
   - If `context/changes/<change-id>/` exists, use it
   - Otherwise create the folder + `change.md` (mirroring `/shape-new`)
   - Refuse if path starts with `context/archive/`
   - Update `change.md`: set `status: planned` and `updated: <today>`

2. Use this template structure:

````markdown
# [Feature/Task Name] Implementation Plan

## Overview
[Brief description]

## Current State Analysis
[What exists now, constraints]

## Desired End State
[Specification of end state and how to verify it]

## What We're NOT Doing
[Out-of-scope items]

## Implementation Approach
[High-level strategy]

## Phase 1: [Descriptive Name]

### Overview
[What this phase accomplishes]

### Changes Required:

#### 1. [Component/File Group]
**File**: `path/to/file.ext`
**Intent**: [1-2 sentences on what and why]
**Contract**: [Interface, signature, or invariant]

### Success Criteria:

#### Automated Verification:
- Migration applies cleanly: `make migrate`
- Tests pass: `make test`
- Type checking passes

#### Manual Verification:
- Feature works as expected
- No regressions

---

## Phase 2: [Descriptive Name]
[Similar structure...]

## Testing Strategy
[Unit, integration, manual tests]

## References
- Related research: `context/changes/<change-id>/research.md`

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands.

### Phase 1: <name>
#### Automated
- [ ] 1.1 <item>
#### Manual
- [ ] 1.2 <item>

### Phase 2: <name>
#### Automated
- [ ] 2.1 <item>
````

### Step 4.5: Plan Brief (Two-Pager)

Write a concise brief to `context/changes/<change-id>/plan-brief.md`.

### Step 5: Sync and Review

1. Confirm plan + brief landed
2. Copy implementation command to clipboard:
   ```bash
   echo -n "/shape-implement <change-id> phase 1" | pbcopy 2>/dev/null || echo -n "/shape-implement <change-id> phase 1" | clip.exe 2>/dev/null || true
   ```
3. Present both files and iterate based on feedback

## Important Guidelines

1. **Be Skeptical**: Question vague requirements, identify issues early
2. **Be Interactive**: Get buy-in at each step, allow course corrections
3. **Be Thorough**: Read all context files completely, include specific references
4. **Be Practical**: Focus on incremental, testable changes
5. **Describe intent, not implementation**: Tell the implementer WHAT and WHY, not HOW to write the code
