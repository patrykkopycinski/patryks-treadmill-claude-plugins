---
name: shape-roadmap
description: >
  Generate context/foundation/roadmap.md from a PRD as an ordered set of
  vertical, end-to-end slices. Use AFTER /shape-prd (and after tech-stack
  selection / bootstrap, when applicable) to turn a holistic PRD into a
  sequence of user-visible milestones a programmer can pick off and hand to
  /shape-plan. Trigger phrases: "write the roadmap", "generate roadmap",
  "create the roadmap from PRD", "turn PRD into a roadmap",
  "what should I build first". Do NOT use for per-change planning —
  that's /shape-plan's job.
argument-hint: "[path-to-prd]"
allowed-tools:
  - Read
  - Write
  - Bash
  - Task
  - AskUserQuestion
---

# Roadmap: Generate context/foundation/roadmap.md from a PRD

This skill is the bridge between **product** (PRD) and **per-change planning** (`/shape-plan`). Its single job: read a PRD, auto-probe the codebase baseline, infer a decisive sequencing proposal, and emit a `context/foundation/roadmap.md` that lists vertical, user-visible slices in dependency order — ready to feed into `/shape-plan <change-id>`.

**Posture: opinionated recommender, lean interview.** At most three anchor questions (main goal, north star, top blocker), each with one strong Recommend grounded in artifact evidence plus 1-2 alternatives.

It is a **decomposition + sequencing** skill, not a low-level planner. It NEVER picks frameworks, file paths, schemas, or implementation details — those belong to `/shape-plan`. It NEVER assigns time estimates.

## When to use, when to skip

**Use when**: `context/foundation/prd.md` exists with non-trivial content AND the user wants to know what to build first / in what order.

**Skip when**: PRD is hollow — point at `/shape-prd` first. Also skip for planning a *single* change — that's `/shape-plan`.

## Relationship to other skills

- `/shape-idea` and `/shape-prd` — produce the upstream PRD
- `/shape-tech-stack` — runs between `/shape-prd` and this skill
- `/shape-plan` — downstream consumer. User picks a roadmap item and invokes `/shape-plan <change-id>`
- `/shape-archive` — closes items when changes are archived

## Process

### Step 1: Locate and read PRD

Default to `context/foundation/prd.md`. If missing, ask user to run `/shape-prd` first.

### Step 2: Read supplementary inputs

Read if they exist: `shape-notes.md`, `tech-stack.md`, existing `roadmap.md`, `lessons.md`.

### Step 3: PRD readiness check

Score on a 0–4 heuristic: Vision non-trivial, ≥1 user story, ≥1 must-have FR, Business Logic populated. Score < 3 → warn and offer to firm up PRD first.

### Step 4: Auto-research baseline

Use sub-agents to inventory each layer (Frontend, Backend/API, Data, Auth, Deploy/infra, Observability). Present baseline summary for user confirmation.

### Step 5: Lean interview — 2-3 anchor questions

At most 3 anchors: `main_goal`, `north_star`, `top_blocker`. Each with strong Recommend + alternatives. Investment areas derived from answers.

### Step 6: Decompose and sequence

- **6a**: Identify Foundations (cross-cutting prerequisites)
- **6b**: Decompose into vertical slices from User Stories / FRs
- **6c**: Build dependency graph
- **6d**: Topological sort biased by main goal
- **6e**: Identify blocking unknowns
- **6f**: Generate Open Roadmap Questions
- **6g**: Generate Parked items
- **6h**: Derive Streams (navigation aid)

### Step 7: Emit roadmap content

Write `context/foundation/roadmap.md` with sections: Vision recap, North star, At a glance, Streams, Baseline, Foundations, Slices, Backlog Handoff, Open Roadmap Questions, Parked, Done.

### Step 8: Self-review

Verify: frontmatter, required sections, per-entry schema, PRD coverage, dependency graph integrity, no invented slices. Abort on failure.

### Step 9: Collision check

If `roadmap.md` exists, ask: Archive and replace / Overwrite / Cancel.

### Step 10: Hand off

Summarize and recommend a single next move — the one roadmap item to plan first.

```
► **Your next move:** `/shape-plan <change-id>` on **<ID>: <Outcome>**.
```

STOP. Do not chain into another skill automatically.

## Critical guardrails

1. **PRD is the source.** Every slice traces to PRD IDs.
2. **Vertical slices first.** No horizontal slices.
3. **No estimates, no time units.**
4. **No low-level technical details.**
5. **Surface unknowns, don't paper over them.**
6. **Baseline is auto-researched, not asked.**
7. **Self-review aborts on drift.**
8. **Never chain automatically.**
