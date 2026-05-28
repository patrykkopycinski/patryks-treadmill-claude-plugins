---
name: shape-implement
description: >
  Implement technical plans from context/changes/<change-id>/plan.md with verification.
  Use when the user has an approved plan and is ready to execute it phase by phase.
argument-hint: "<change-id> [phase N]"
allowed-tools:
  - Read
  - Write
  - Bash
  - Task
  - AskUserQuestion
---

# Implement Plan

You are tasked with implementing an approved technical plan from `context/changes/<change-id>/plan.md`. These plans contain phases with specific changes and a canonical `## Progress` section at the bottom that drives execution state.

## Initial Setup

When this command is invoked:

1. **Resolve the plan**:
   - If invoked as `/shape-implement <change-id> [phase N]`, resolve to `context/changes/<change-id>/plan.md`.
   - If invoked with a full path, accept it.
   - **Refuse if the resolved path starts with `context/archive/`** — print "This change is archived. Open a new change with `/shape-new` instead." and STOP.
   - If nothing was provided, respond with:

```
I'll help you implement an approved technical plan. Please provide:

1. A change-id (e.g., `/shape-implement oauth-login phase 1`), or
2. A full path (e.g., `@context/changes/oauth-login/plan.md`).

You can list active changes with: `ls context/changes/`
```

## Getting Started

When given a plan path:

- Read the plan completely. The `## Progress` section is authoritative for execution state.
- Read `context/foundation/lessons.md` if present.
- Read all files mentioned in the plan.
- Update `change.md`: set `status: implementing` and `updated: <today>`.
- Find the next pending step by scanning `## Progress` for the first `- [ ]` line.
- Start implementing.

## Implementation Philosophy

- Follow the plan's intent while adapting to what you find
- Implement each phase fully before moving to the next
- Verify your work makes sense in the broader codebase context
- Update checkboxes in the plan as you complete sections

When things don't match the plan:
- STOP and think about why
- Present the mismatch clearly
- Use AskUserQuestion to get a decision: "Adapt and continue" / "Skip this part" / "Stop and re-plan"

## Autonomous mode: `/goal`

When a plan is concrete, scope is closed, and completion is measurable, this skill can be driven headlessly via `/goal` (Claude Code and Codex):

```
/goal Use shape-implement skill to implement all phases of context/changes/<id>/plan.md.
      Each phase is committed separately. All phases marked done in plan progress.
      Stop after 20 turns if not complete.
```

An evaluator sub-model checks the stop condition after each turn — continues if not met, stops if met. Control shifts to PR review and your decision, not mid-session steering.

**Use `/goal` when**: plan is concrete, scope is closed, completion is clearly measurable.
**Use interactive mode when**: decisions arise mid-implementation, domain is unfamiliar, or the plan has known ambiguities.

**Model tip**: this skill is an implementor task — DeepSeek V4 Flash or Qwen3 Coder are strong choices at a fraction of architect-tier cost. Switch intentionally; don't use Opus for mechanical phase execution.

## Verification Approach

After implementing a phase:

1. Run the success criteria checks
2. Fix any issues before proceeding
3. Update Progress section: flip `- [ ] N.M <title>` → `- [x] N.M <title>`
4. **Manual confirmation gate**: inform the human that automated verification passed and list manual items. Pause until confirmed.
5. **Stage and commit**: stage touched files, propose a Conventional-Commits message, commit via heredoc.
6. **Write SHA back**: append ` — <short-sha>` to each flipped Progress row.
7. **Next phase decision** via AskUserQuestion:
   - "Continue to Phase [N+1]"
   - "Clear context first" — copy resume command to clipboard
   - "Review this phase first" — run `/shape-impl-review`

## State Tracking

The `## Progress` section in `plan.md` is the single source of truth. No state file. No comment markers.

### After each step
Flip exactly one Progress line: `- [ ] N.M <title>` → `- [x] N.M <title>`

### After all phases

1. Update `change.md`: set `status: implemented`, `updated: <today>`.
2. Run epilogue commit for the final SHA write-back + status flip.
3. Present completion summary and offer final review via `/shape-impl-review`.

## Resuming Work

If the plan's Progress section has existing `[x]` marks:
- Trust that completed work is done
- Pick up from the first `- [ ]` line
- Verify previous work only if something seems off

## Notes

- You're implementing a solution, not just checking boxes. Keep the end goal in mind.
- Use sub-tasks sparingly — mainly for targeted debugging or exploring unfamiliar territory.
- Never pass `--no-verify`, `--amend`, or signing-bypass flags on commits.
