---
name: shape-archive
description: >
  Archive a completed change by moving its folder into context/archive/
  and stamping change.md with archived status. Use when a change is done
  and should be closed out.
argument-hint: "<change-id-or-path>"
allowed-tools:
  - Read
  - Write
  - Bash
  - AskUserQuestion
---

# /shape-archive — Close a Change

Move a completed change folder from `context/changes/<change-id>/` to `context/archive/<created-date>-<change-id>/`, stamp `change.md` with `status: archived` + `archived_at`, use `git mv` so file history follows, and — if `context/foundation/roadmap.md` carries a matching item — close that item too.

The gate is **lenient warn-only** — `/shape-archive` only hard-blocks on uncommitted changes inside the change folder.

## Initial Response

When this command is invoked:

1. **If argument provided**, parse it and proceed to "Resolution".
2. **If NO argument**, respond with:

```
I'll archive a completed change. Please provide a change-id:

Examples:
  /shape-archive context-dir-restructure
  /shape-archive @context/changes/oauth-login/

You can list active changes with: `ls context/changes/`
```

Then **wait**.

## Argument Parsing

Take the first whitespace-delimited token. Strip leading `@`, trailing `/`. If contains `/`, take last path segment. Result is `<change-id>`.

## Resolution

1. Resolve to `context/changes/<change-id>/`. If missing, check archive or error.
2. Read `change.md` frontmatter. If already archived, error. If `created` missing, error.

## Hard refusal: uncommitted changes

1. `git status --porcelain "context/changes/<change-id>/"` — block if non-empty.
2. `git diff --cached --quiet` — block if pre-existing staged changes exist.

## Soft warnings (non-blocking)

Collect warnings:
1. Status not in `{implemented, impl_reviewed}`
2. Pending Progress items (count automated vs manual separately)
3. No impl-review found
4. Progress rows missing SHA suffix

If warnings exist, present them and ask via AskUserQuestion:
- "Continue archiving"
- "Resume implementation" → suggest `/shape-implement <change-id>`
- "Cancel"

## Move and stamp

1. Compute destination: `context/archive/<created-date>-<change-id>`
2. Stamp `change.md`: `status: archived`, `archived_at: <ISO datetime>`, `updated: <today>`
3. Move folder with `git mv` (fallback to `mv`)
4. Stage the stamp: `git add "$DEST/change.md"`
5. Close matching roadmap item (best effort, never blocks):
   - Find item by Change ID in `roadmap.md`
   - Flip Status to `done` in At-a-glance table and body
   - Append entry to `## Done` section
6. Commit: `chore(archive): close <change-id>`
7. Print confirmation

## What this skill does NOT do

- Does not run tests as a gate
- Does not push (user's call)
- Does not rewrite the roadmap beyond closing one item
- Does not unarchive — use `/shape-new` to start fresh
