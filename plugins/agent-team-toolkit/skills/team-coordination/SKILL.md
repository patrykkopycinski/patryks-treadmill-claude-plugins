---
name: team-coordination
description: Methodology for orchestrating Claude Code agent teams with file reservations, quality gates, and task graphs. Covers when to create teams, team patterns, teammate coordination, and post-team cleanup.
---

# Team Coordination Methodology

Battle-tested system for orchestrating multi-agent teams in Claude Code. Covers auto-creation signals, file reservation, task dependency graphs, quality gates, lint coordination, and cleanup.

---

## Auto-Creation: When to Spawn a Team

**Auto-create a team (no confirmation needed) when ALL of:**
1. Task is non-trivial (not a single-file fix, typo, or config change)
2. Task matches at least ONE team signal below
3. At least 3 independent subtasks can be identified

### Team Signals

| Signal | Example | Team Pattern |
|--------|---------|-------------|
| Cross-layer work | "Add a new API endpoint with UI and tests" | Cross-Layer Feature |
| Multi-angle review | "Review PR #142" | Parallel Review |
| Unclear root cause | "Users report X but we don't know why" | Investigation |
| Large migration | "Migrate Cypress tests to Scout" (10+ files) | Migration |
| Multi-module refactor | "Rename X across server, public, and common" | Cross-Layer Feature |
| Adversarial exploration | "Evaluate approaches A vs B vs C" | Investigation |

### Do NOT Auto-Create When

- Single file fix or typo
- Sequential dependency chain (step N depends entirely on step N-1)
- User explicitly asks for a single-session approach
- Task is purely conversational (explanation, Q&A)
- Research-only work (use subagents instead — cheaper)

---

## Auto-Creation Flow

```
1. Analyze user's request → identify subtasks
2. Check: ≥3 independent subtasks? Any team signal?
   ├── NO → Use subagents or single session
   └── YES →
       3. Announce: "Spinning up a [Pattern] team with N teammates..."
       4. TeamCreate with descriptive name
       5. Write file reservations: ~/.claude/teams/<name>/reservations.json
       6. Create task graph with dependencies (fan-out for parallelism)
       7. Spawn teammates (model: "sonnet" default, "opus" for deep-reasoning tasks) + subagent_type
       8. Assign initial tasks
       9. Monitor, redirect, synthesize
      10. Centralized lint pass after all teammates idle
      11. TeamDelete after shutdown
```

---

## Decision Framework: Teams vs Subagents vs Worktrees

| Signal | Subagents | Agent Teams | Worktrees |
|--------|:---------:|:-----------:|:---------:|
| Workers need to communicate | | X | |
| Workers edit the same repo simultaneously | | X | |
| Each worker needs a separate branch | | | X |
| Fire-and-forget with result summary | X | | |
| Research/exploration only (no edits) | X | | |
| Cross-layer coordination (FE + BE + tests) | | X | |
| Competing hypotheses / adversarial debate | | X | |
| Independent PR-sized changes | | | X |
| Quick focused tasks < 5 min each | X | | |
| Multi-file refactor with discussion | | X | |

### Quick Decision Tree

```
Is communication between workers needed?
├── NO → Are workers editing files?
│   ├── NO → Subagents (research, review, exploration)
│   └── YES → Do they need separate branches?
│       ├── YES → Worktrees (independent PRs)
│       └── NO → Subagents with isolation: "worktree"
└── YES → Agent Teams
    ├── Workers need to challenge each other → adversarial team
    ├── Workers own different layers → cross-layer team
    └── Workers need to coordinate ordering → pipeline team
```

---

## Teammate Model Selection

**Default to `model: "sonnet"` for teammates. Use `model: "opus"` only when the task genuinely requires deeper reasoning.**

```
// DEFAULT — most teammate work
Agent({ name: "backend", model: "sonnet", team_name: "...", prompt: "..." })

// WRONG — inherits Opus from lead, wastes 5x quota for simple work
Agent({ name: "backend", team_name: "...", prompt: "..." })

// JUSTIFIED — task requires deep architectural reasoning
Agent({ name: "architect", model: "opus", team_name: "...", prompt: "..." })
```

### When to use Opus for a teammate

| Signal | Example | Why Opus helps |
|--------|---------|----------------|
| Architectural design decisions | "Design the data model for X" | Needs to reason about trade-offs, constraints, future extensibility |
| Complex root-cause debugging | "Find why X causes Y only under Z" | Multi-step causal reasoning across many files |
| Security-critical review | "Audit auth flow for bypasses" | Must reason adversarially about attack vectors |
| Cross-cutting refactor planning | "Plan how to decouple X from Y across 50 files" | Needs holistic understanding of dependency graph |

### When Sonnet is sufficient (most work)

| Task type | Examples |
|-----------|---------|
| Implementation | Build a component, add an API route, write a service |
| Test writing | Jest unit tests, Scout E2E tests, test fixtures |
| Focused review | Check for N+1 queries, verify i18n, lint correctness |
| Research | Git blame investigation, codebase exploration |
| Migration | Rename across files, convert test frameworks |

- **Lead**: Opus — orchestration, synthesis, final quality judgment
- **Teammates**: Sonnet by default, Opus when the task requires deep reasoning (see table above)

---

## Team Patterns

### 1. Cross-Layer Feature Team (3-4 teammates)
Best for: new features spanning server + public + tests

```
- Backend:  owns server/ routes, services, types
- Frontend: owns public/ components, hooks, stores
- Tests:    owns test/ (Scout UI + API, Jest)
- Reviewer: (optional) reads all changes, challenges assumptions
```

### 2. Parallel Review Team (3 teammates)
Best for: thorough PR review

```
- Security reviewer:    auth, injection, RBAC, input validation
- Performance reviewer: N+1 queries, bundle size, memoization
- Correctness reviewer: logic, edge cases, test coverage, type safety
```

Each reviewer works independently; lead synthesizes.

### 3. Investigation Team (3-5 teammates)
Best for: debugging unclear root causes

```
- Each investigates a different hypothesis
- Explicitly told to disprove each other's theories
- Lead synthesizes consensus
```

### 4. Migration Team (2-3 teammates)
Best for: large-scale migrations (Cypress → Scout, FTR → Scout)

```
- Each owns a subset of test files/directories
- Lead coordinates shared fixtures and helpers
- Require plan approval before implementation
```

---

## File Reservations

Before spawning teammates, the lead MUST create a reservation file:

```bash
# ~/.claude/teams/<team-name>/reservations.json
{
  "backend":  "x-pack/**/server/**",
  "frontend": "x-pack/**/public/**",
  "tester":   "x-pack/**/test/**"
}
```

The `team-file-reservation.sh` PreToolUse hook enforces these automatically — if "frontend" tries to edit a file matching `server/**`, the hook blocks it.

**Rules:**
- Lead creates reservations BEFORE spawning teammates
- Glob patterns must be non-overlapping
- Shared files (e.g., `index.ts` barrel exports) should be reserved by ONE teammate, others message for changes
- Reservations are advisory but hook-enforced

---

## Task Dependency Graph

Use task dependencies to sequence work with ordering requirements:

```
Task 1: "Create server-side types and interfaces" (backend)
Task 2: "Implement API routes using types from Task 1" (backend, depends_on: [1])
Task 3: "Build UI components" (frontend, no deps — starts immediately)
Task 4: "Write integration tests" (tester, depends_on: [2, 3])
```

### Patterns

| Pattern | Shape | When to Use |
|---------|-------|-------------|
| Fan-out | 1 → {2, 3} | One setup task unblocks multiple parallel tasks |
| Fan-in  | {2, 3} → 4 | Parallel work converges at a shared integration point |
| Pipeline | 1 → 2 → 3 | Strict sequential (avoid in teams — defeats parallelism) |

**Rules:**
- Pre-create the full task graph BEFORE spawning teammates
- Use fan-out to maximize parallel work
- Tester tasks should depend on implementation tasks
- Teammates auto-claim next unblocked, unassigned task (lowest ID first)

---

## Quality Gate Hooks

Three hooks enforce quality at the team level:

| Hook | Script | Event | What It Checks |
|------|--------|-------|----------------|
| File reservation | `team-file-reservation.sh` | PreToolUse (Write\|Edit) | Blocks edits to files reserved by another teammate |
| Task scope | `team-task-created.sh` | TaskCreated | Task specificity (≥10 chars), no kitchen-sink tasks (≤4 action verbs) |
| Task quality | `team-task-completed.sh` | TaskCompleted | No merge conflict markers, no new FIXME/HACK/XXX in diff |
| Idle safety | `team-teammate-idle.sh` | TeammateIdle | No merge conflict markers in changed files |

---

## Coordination Rules

1. **File ownership is non-negotiable**: Two teammates MUST NOT edit the same file. Lead assigns file boundaries before spawning.
2. **Plan approval for risky work**: Require plan approval for database schema changes, auth changes, or public API changes.
3. **3-5 teammates max**: More creates coordination overhead that exceeds the benefit.
4. **5-6 tasks per teammate**: Keeps everyone productive without excessive context switching.
5. **Monitor and redirect**: Check in on teammates that haven't sent a message in >5 minutes.
6. **Convergence protocol**: When teammates audit code, use 2-consecutive-clean-pass convergence — don't run fixed-count review passes.
7. **Proactive anticipation**: Lead runs blast-radius analysis BEFORE creating tasks. Identify cross-cutting concerns and assign them upfront.

---

## Spawn Templates

Custom agent definitions live in `~/.claude/agents/` (or installed via plugin). Reference by `subagent_type`.

### Cross-Layer Feature Team

```
TeamCreate: { team_name: "<feature>-impl", description: "Implement <feature>" }

Teammate 1 — "backend":
  model: "sonnet", subagent_type: kibana-backend-dev
  prompt: "Implement backend for <feature>. File boundaries: x-pack/.../server/**."

Teammate 2 — "frontend":
  model: "sonnet", subagent_type: kibana-frontend-dev
  prompt: "Implement UI for <feature>. File boundaries: x-pack/.../public/**."

Teammate 3 — "tester":
  model: "sonnet", subagent_type: kibana-test-specialist
  prompt: "Write tests for <feature>. File boundaries: **/*.test.ts, test/scout*/**."
```

### Parallel Review Team

```
TeamCreate: { team_name: "review-pr-<number>", description: "Review PR #<number>" }

Teammate 1 — "security-reviewer":
  model: "sonnet", subagent_type: kibana-code-reviewer
  prompt: "Focus on SECURITY: auth bypass, injection, RBAC, input validation, path traversal."

Teammate 2 — "perf-reviewer":
  model: "sonnet", subagent_type: kibana-code-reviewer
  prompt: "Focus on PERFORMANCE: N+1 queries, missing memoization, bundle size, re-renders."

Teammate 3 — "correctness-reviewer":
  model: "sonnet", subagent_type: kibana-code-reviewer
  prompt: "Focus on CORRECTNESS: logic errors, edge cases, missing test coverage, type safety."
```

### Investigation Team

```
TeamCreate: { team_name: "investigate-<issue>", description: "Debug <issue>" }

Spawn 3-5 teammates (model: "sonnet"), each with a different hypothesis.
Add to each prompt: "Try to DISPROVE other teammates' theories.
  Message them directly to challenge their findings."
```

---

## Escalation Protocol

Include in every teammate's spawn prompt:

```
If you get stuck (unresolvable error, missing context, blocked by another task):
1. Message the lead immediately — don't silently spin or retry the same thing 5 times
2. Include: what you tried, the exact error, and what you think is needed
3. Move on to the next unblocked task while waiting for a response
```

Lead responsibilities:
- Check in on teammates that haven't sent a message in >5 minutes
- Reassign stuck tasks to other teammates or handle directly
- Kill and replace a teammate that's looping on the same error

---

## Post-Team Lint Coordination

After all teammates idle, the lead runs a centralized lint pass to catch agent-introduced errors:

```bash
node scripts/eslint --no-cache --fix $(git diff --name-only HEAD)
```

### Why This Is Necessary

Teammates operate without full project eslint context and consistently introduce:
1. **`react/jsx-no-literals`** — bare string literals in JSX (all user-facing strings need `i18n.translate()`)
2. **`prettier/prettier`** — formatting mismatches around `i18n.translate()` calls and JSX expression containers

### Lint Workflow

1. After ALL teammates have idled, run the eslint fix pass above
2. The `--fix` flag auto-resolves ~90% of agent-introduced formatting errors
3. Budget for one manual fix round: some `jsx-no-literals` errors need manual `i18n.translate()` wrapping (5-10 minutes)
4. To distinguish pre-existing vs new errors:
   ```bash
   git stash && node scripts/eslint --no-cache <file> && git stash pop
   ```
5. Commit the lint pass: `chore: centralized lint pass after team completion`

### Prevention (include in every frontend teammate's prompt)

Wrap all new JSX string literals with:
```tsx
import { i18n } from '@kbn/i18n';
const label = i18n.translate('xpack.<plugin>.<area>.<key>', { defaultMessage: '...' });
```

---

## Anti-Patterns

| Anti-Pattern | Why It's Bad | Fix |
|---|---|---|
| Teams for sequential work | Tasks with strict ordering don't benefit from parallelism | Use a single session |
| Kitchen-sink teams | Spawning 10 teammates for simple changes wastes tokens | Max 3-5 teammates |
| No file boundaries | Teammates overwrite each other's work | Always set reservations.json first |
| Lead doing implementation | Lead competes with teammates instead of orchestrating | Lead coordinates only |
| Forgetting `TeamDelete` | Orphaned teams accumulate and consume context | Always clean up when done |
| Opus for simple work | 5x token cost for implementation/tests Sonnet handles equally well | Default to `model: "sonnet"`, use Opus only for deep-reasoning tasks (architecture, security audit, complex debugging) |
