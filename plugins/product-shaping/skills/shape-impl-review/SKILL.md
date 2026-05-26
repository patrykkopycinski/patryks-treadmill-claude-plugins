---
name: shape-impl-review
description: >
  Review implementation against plan for drift, dangerous decisions, and pattern compliance.
  Use after completing a phase or all phases of /shape-implement to verify quality.
argument-hint: "<change-id> [phase N] | <saved-review-path>"
allowed-tools:
  - Read
  - Write
  - Bash
  - Task
  - AskUserQuestion
---

# Implementation Review

Compare actual implementation work against the original plan to catch drift, dangerous decisions, architecture violations, and pattern misuse before they compound.

Two granularities:
- **Phase review**: after a single phase — fast, focused
- **Full plan review**: after all phases — comprehensive sweep

Two modes:
- **Fresh review**: analyze → findings → interactive triage
- **Resume triage**: load a saved report and jump to per-issue triage

## Input resolution

1. Argument points to a saved review file (contains `<!-- IMPL-REVIEW-REPORT -->`) → resume triage
2. Argument is a `<change-id>` and `context/changes/<change-id>/plan.md` exists → fresh review
3. Phase number provided → review only that phase
4. No argument → enumerate `context/changes/*/change.md`; pick most recently updated with status `implementing` or `implemented`

If path starts with `context/archive/`, refuse and STOP.

## Step 1: Load plan and detect change scope

1. Read the plan file fully.
2. Read `context/foundation/lessons.md` if present.
3. Read the Progress section for completion state.
4. Scope: specific phase → that phase only; else all completed phases.
5. Extract file paths, architectural decisions, success criteria.
6. Git scope detection — compare changed files against plan files.

## Step 2: Parallel review via sub-agents

Launch two sub-agents simultaneously:

**Agent 1 — Plan Drift Detection**: For each planned change, verify implementation matches intent. Check for: intent mismatch, skipped items, scope creep.

**Agent 2 — Safety, Quality & Pattern Compliance**: Security scan (injection, secrets, auth), performance (N+1, unbounded iteration), reliability (error handling, races), data safety (destructive ops), and pattern compliance against similar files.

## Step 3: Verify success criteria

Run automated verification commands. Check manual items in Progress section.

## Step 4: Compile findings and present report

Each finding has: ID, Severity, Impact, Dimension, Title, Location, Detail, Fix options.

Dimensions: Plan Adherence / Scope Discipline / Safety & Quality / Architecture / Pattern Consistency / Success Criteria

Overall verdict: **APPROVED** / **NEEDS ATTENTION** / **REJECTED**

Present report with box-drawing format. Then ask: "Triage findings" / "Save report & triage later" / "Save report only"

Save to `context/changes/<change-id>/reviews/impl-review.md`. Update `change.md`: `status: impl_reviewed`.

## Step 5: Interactive triage

Walk findings in severity order. For each: "Fix now" / "Fix differently" / "Skip" / "Record as lesson" (append to `context/foundation/lessons.md`).

Print summary with Fixed/Rule/Skipped/Accepted counts.

## Notes

- This is a **review** skill. Default to analyzing and reporting.
- Be specific with file:line references.
- Don't flag style preferences unless they matter.
- During triage, keep momentum. Minimal targeted edits when fixing.
