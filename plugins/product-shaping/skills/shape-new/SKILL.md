---
name: shape-new
description: Initialize a new change folder under context/changes/<change-id> with a change.md identity file
argument-hint: "<change-id-or-path> [freeform intent]"
allowed-tools:
  - Read
  - Write
  - Bash
  - AskUserQuestion
---

# /shape-new — Start a New Change

Bootstrap a new change folder under `context/changes/<change-id>/`. Creates a tiny identity file (`change.md`) and points the user at the next skill.

A "change" is a single unit of work end-to-end — research, planning, implementation, and review all live inside one folder keyed by `<change-id>`.

## Initial Response

When this command is invoked:

1. **Check if any argument was provided**:
   - If an argument was provided, parse it (see "Argument Parsing" below) and proceed to "Validation"
   - If NO argument was provided, respond with the following message and **STOP**:

```
I'll create a new change folder. Please provide a change-id (kebab-case slug):

Examples:
  /shape-new context-dir-restructure
  /shape-new oauth-login add Google sign-in so users skip the email-password step
  /shape-new @context/changes/oauth-login/

The first token becomes the change-id. Anything after it is freeform intent — used to write a richer title and to pick the next-step suggestion. Path-style references (with or without a leading `@`) are accepted; the last path segment is used as the change-id.

The change-id must be:
- kebab-case (lowercase letters, digits, hyphens; no leading/trailing hyphen, no double hyphens)
- unique across `context/changes/` and `context/archive/`
```

   Then **wait** for the user to provide an argument.

## Argument Parsing

Split the raw argument string on the first run of whitespace:

- **First token** = the change-id reference. Normalize it:
  1. Strip a leading `@` if present.
  2. Strip a trailing `/` if present.
  3. If the result contains `/`, take the last non-empty path segment.
  4. The result is `<change-id>`.
- **Everything after the first token** = freeform intent. May be empty.

## Validation

Before creating anything:

1. **kebab-case check**: `<change-id>` must match `^[a-z][a-z0-9]*(-[a-z0-9]+)*$`.
   - On failure, print: `error: change-id "<id>" is not kebab-case.` and STOP.

2. **Uniqueness check**: neither `context/changes/<change-id>/` nor `context/archive/<change-id>/` may already exist.
   - On collision, print: `error: change "<id>" already exists at <path>.` and STOP.

3. **`context/changes/` parent exists**: if missing, print `error: context/changes/ not found — is this repo set up for the product-shaping workflow?` and STOP.

## Creation

1. Create directory `context/changes/<change-id>/`.
2. Derive the `<title>`:
   - If the intent string is empty, humanize the change-id: replace hyphens with spaces and capitalize the first letter.
   - If the intent string is non-empty, write a concise human-readable title (≤ 80 chars, sentence case, no trailing period).
3. Derive the `## Notes` body:
   - If the intent string is empty, emit the hint comment: `<!-- Free-form notes for this change -->`
   - If the intent string is non-empty, drop it verbatim as the Notes body.
4. Write `context/changes/<change-id>/change.md`:

```markdown
---
change_id: <change-id>
title: <title>
status: new
created: <YYYY-MM-DD>
updated: <YYYY-MM-DD>
archived_at: null
---

## Notes

<notes-body>
```

## Next-step suggestion

After successful creation, print a next-step prompt and copy the suggested command to clipboard.

The default next step is `/shape-plan <change-id>`. Use `/shape-research` when the intent suggests codebase exploration is needed, and `/shape-frame` when the intent signals suspect framing (bug-shape or scope-shape).

```bash
NEXT_CMD="/shape-plan <change-id>"
echo -n "$NEXT_CMD" | pbcopy 2>/dev/null || echo -n "$NEXT_CMD" | clip.exe 2>/dev/null || echo -n "$NEXT_CMD" | xclip -selection clipboard 2>/dev/null || true
```

Then display:

```
✓ Created context/changes/<change-id>/change.md (status: new)

Next step:
  → <NEXT_CMD>  (✓ copied to clipboard)

Other options:
  /shape-research <change-id>   — explore the codebase first
  /shape-frame <change-id>      — challenge the framing first
```

## What this skill does NOT do

- Does not write `frame.md`, `research.md`, `plan.md`, or any other artifact.
- Does not enforce status transitions.
- Does not create the `context/changes/` parent directory.
