---
name: shape-plan-review
description: >
  Review implementation plans for substance, feasibility, and architectural fitness.
  Use when user asks to review a plan, says "is this plan good", "check my plan",
  "review this plan", or wants validation before starting /shape-implement.
argument-hint: "<change-id> | <plan-path> | <saved-review-path>"
allowed-tools:
  - Read
  - Write
  - Bash
  - Task
  - AskUserQuestion
---

# Plan Review

Catch substance problems in an implementation plan before a line of code is written. A flawed plan costs hours — a flawed review costs minutes.

Where `/shape-impl-review` asks "did we build what we planned?", this asks "will this plan actually work?"

Two modes:
- **Fresh review**: analyze → findings → interactive triage
- **Resume triage**: load a saved report and jump to per-issue triage

## Input resolution

1. Argument points to a saved review file (contains `<!-- PLAN-REVIEW-REPORT -->`) → **resume triage** (skip to Step 6)
2. Argument is a `<change-id>` and `context/changes/<change-id>/plan.md` exists → review that plan
3. Plan path provided → use it
4. No argument → list `context/changes/*/plan.md` via AskUserQuestion
5. `--quick` flag → document-only mode (skip Step 3)

If path starts with `context/archive/`, refuse and STOP.

## Step 1: Load and internal consistency scan

Read the plan file fully. Also read sibling `plan-brief.md` and `context/foundation/lessons.md` if present. Check:

- **Contradiction**: does Current State Analysis document a limitation the implementation ignores?
- **Promise gap**: every capability in Success Criteria should have a backing phase
- **Contract breaks**: trace data flow across endpoints
- **Progress↔Phase consistency**: verify the Progress section matches phases

## Step 2: Grounding

Quick verification without sub-agents:
- **Paths**: `ls -l` on ≥5 file paths the plan claims to modify
- **Symbols**: grep for specific functions/config keys
- **Brief↔plan consistency**: phases, decisions, scope match?

## Step 3: Codebase verification (deep mode only)

Skip if `--quick`. Identify 3–5 riskiest claims. Launch one sub-agent to verify claims, check blast-radius, and check patterns.

## Step 4: Substance analysis

Analyze against five dimensions:
- **End-State Alignment**: do phases reach the stated end state?
- **Lean Execution**: is each phase necessary?
- **Architectural Fitness**: does this fit the existing system?
- **Blind Spots**: error paths, rollback, cost, testing gaps?
- **Plan Completeness**: is the document actionable?

## Step 5: Compile findings

Each finding has: ID, Severity (CRITICAL/WARNING/OBSERVATION), Impact (LOW/MEDIUM/HIGH), Dimension, Title, Location, Detail, Fix options.

Dimension verdicts: PASS / WARNING / FAIL.
Overall: **SOUND** / **REVISE** / **RETHINK**.

## Step 6: Present report

Print findings grouped by severity. Then ask:
- "Triage findings" — walk through each
- "Save report & triage later"
- "Save report only"

Save to `context/changes/<change-id>/reviews/plan-review.md`. Update `change.md`: `status: plan_reviewed`.

## Step 7: Interactive triage

Walk findings in severity order. For each, offer: Apply Fix, Fix differently, Skip, Accept risk, Disagree.

After triage, print summary with counts of Fixed/Skipped/Accepted/Dismissed.

## Notes

- This is a **review** skill. Analyze and report — don't rewrite the plan unless asked during triage.
- Be specific with file:line references.
- If the plan is genuinely good, say so briefly and stop. Don't manufacture findings.
