---
name: shape-init
description: Initialize the /context directory in this project — scaffold context/{changes,archive,foundation}/ plus universal README.md files if absent. Worktree-aware (places context/ at the main repo root so all worktrees share it). Excludes context/ from git so artifacts never get accidentally committed or wiped.
allowed-tools:
  - Read
  - Write
  - Bash
---

# /shape-init — Initialize /context Directory

Scaffold the `/context` directory skeleton (`changes/`, `archive/`, `foundation/`) plus a universal `README.md` in each, so the change-tracking and foundation-doc conventions have a place to land. Idempotent: each artifact (3 dirs + 3 READMEs + the git-exclude line) is independently create-if-absent; re-running on a project where everything is already present is a no-op.

This skill is the explicit entry point for users who want to scaffold the workflow conventions up-front. It is NOT a precondition for any other skill — they self-bootstrap their own files when needed (and they apply the same context-root protocol). `/shape-init` exists for users who prefer to set up the skeleton first.

**Worktree-aware.** When run inside a git repo, `/shape-init` places `context/` at the main repo's working tree (the parent of `git rev-parse --git-common-dir`), not at the cwd. This means a single `context/` is shared across the main checkout and every worktree of the same repo — running `/shape-init` in worktree A then `/shape-prd` in worktree B finds the same `context/foundation/`. The git-exclude line is also written once to the shared exclude file, covering all current and future worktrees.

## Process

### Step 0: Resolve `CONTEXT_ROOT` and exclude `context/` from git

Apply the **context-root protocol** documented in `references/context-root-protocol.md` exactly. Concretely, run this block before anything else:

```bash
if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  GIT_COMMON_DIR="$(git rev-parse --git-common-dir)"
  GIT_COMMON_DIR="$(cd "$GIT_COMMON_DIR" && pwd)"
  IS_BARE="$(git --git-dir="$GIT_COMMON_DIR" rev-parse --is-bare-repository 2>/dev/null)"
  if [ "$IS_BARE" = "true" ]; then
    CONTEXT_ROOT="$GIT_COMMON_DIR/shape-context"
  else
    CONTEXT_ROOT="$(dirname "$GIT_COMMON_DIR")"
  fi
else
  CONTEXT_ROOT="$(pwd)"
  GIT_COMMON_DIR=""
fi
```

Then:

1. If `GIT_COMMON_DIR` is non-empty, check whether `context/` is already excluded (`git check-ignore -q "$CONTEXT_ROOT/context/"`); if not, append `context/` to `$GIT_COMMON_DIR/info/exclude` (single line, deduped). This file is shared by every worktree of this repo, so the line lands once and applies everywhere — including future worktrees the user hasn't created yet.
2. If the user passed `mode=gitignore` to `/shape-init`, instead append `context/` to `$CONTEXT_ROOT/.gitignore` (the tracked one, anchored at the main working tree). Default behavior never edits `.gitignore`.
3. Capture a single `GIT_STATE` value: `not-a-git-repo`, `already-excluded`, `appended-to-info-exclude`, `already-in-info-exclude`, `appended-to-gitignore`, or `already-in-gitignore`.

Why this matters: when a user runs the pipeline from inside a shared repository they don't own (a monorepo, an upstream they're contributing to, e.g. `kibana`), `context/foundation/prd.md` and friends are personal working notes — they must never be staged, committed, or pushed by accident. Anchoring `context/` to the main repo's working tree (instead of the cwd) means a single setup covers every worktree forever; the user does not have to re-run `/shape-init` for each new branch worktree.

Read the full protocol in `references/context-root-protocol.md` for the exact bash, edge cases (bare repos, non-git cwds), and what the protocol does NOT do.

### Step 1: Scaffold `$CONTEXT_ROOT/context/changes/` + `README.md`

Operate on `$CONTEXT_ROOT/context/changes/`, not `./context/changes/`. The rest of this skill's instructions write `context/foo/bar.md` for brevity — read those as `$CONTEXT_ROOT/context/foo/bar.md`.

If the directory exists, leave it untouched and note `present` for the directory in the summary. Otherwise create it with `mkdir -p` and note `created`.

If `context/changes/README.md` exists, leave it untouched and note `present`. Otherwise write it with this canonical content (embedded inline — no separate template file):

```
# Changes

In-flight changes. One folder per change at `context/changes/<change-id>/`, identified by a `change.md` identity file. Holds research, frame, plan, reviews, and other change-scoped artifacts.

When a change is complete, move its folder under `context/archive/`.
```

### Step 2: Scaffold `context/archive/` + `README.md`

If the directory exists, leave it untouched and note `present` for the directory. Otherwise create it with `mkdir -p` and note `created`.

If `context/archive/README.md` exists, leave it untouched and note `present`. Otherwise write it with this canonical content:

```
# Archive

Completed changes. Folders moved here from `context/changes/` when archived. Read-only by convention; skills refuse to write here.
```

### Step 3: Scaffold `context/foundation/` + `README.md`

If the directory exists, leave it untouched and note `present` for the directory. Otherwise create it with `mkdir -p` and note `created`.

If `context/foundation/README.md` exists, leave it untouched and note `present`. Otherwise write it with this canonical content:

```
# Foundation Docs

Cross-change living documents that span multiple changes. Each project picks which foundation docs it needs (e.g. product requirements, tech-stack, roadmap, glossary, test-stack). Foundation docs are owned by the skills that read and write them; this README describes the conventions that apply to all of them.

## Update convention

**Edit-in-place.** Foundation docs evolve over the lifetime of the project. When something changes incrementally (a new dependency, a refined product goal, a shifted milestone), edit the existing file. Don't create dated copies.

## Archive convention

When a foundation doc is fully superseded — replaced by a new approach rather than refined — move it to `foundation/archive/YYYY-MM-DD-<doc>.md` and write the replacement at the original path. The archive folder is a historical record; nothing reads from it routinely.

## Anti-pattern

Do **not** put change-scoped docs here. Anything tied to a single change (its plan, its research, its review) belongs under `context/changes/<change-id>/`. Foundation is for what outlives any one change.
```

### Step 4: Print summary

Print a status block. When `CONTEXT_ROOT` differs from the cwd (running from a subdirectory of the main checkout, or from a worktree), include a `context-root:` line so the user knows where the artifacts actually landed:

```
context-root:                   <CONTEXT_ROOT>   (only when ≠ cwd)
git-exclude:                    [<protocol-result>]
context/changes/                [created|present]
context/changes/README.md       [created|present]
context/archive/                [created|present]
context/archive/README.md       [created|present]
context/foundation/             [created|present]
context/foundation/README.md    [created|present]
```

Where `<protocol-result>` is one of `not-a-git-repo`, `already-excluded`, `appended-to-info-exclude`, `already-in-info-exclude`, `appended-to-gitignore`, `already-in-gitignore` (see `references/context-root-protocol.md`).

Then a one-paragraph guide on what each directory is for, where to look next, and one or two lines on what just happened with git and worktrees:

- `context/changes/` holds in-flight changes. Each change lives at `context/changes/<change-id>/` with a `change.md` identity file.
- `context/archive/` holds completed changes. When a change is done, move its folder out of `changes/` into `archive/`.
- `context/foundation/` holds cross-change living docs. There is no fixed list of files here; foundation docs are owned by the skills that write them (e.g. `/shape-prd` writes `prd.md`, `/shape-tech-stack` writes `tech-stack.md`).
- **git-exclude:** if you saw `appended-to-info-exclude`, `context/` is now ignored locally in this repo via the shared `info/exclude` file inside `git rev-parse --git-common-dir`. This applies to **every worktree** of this repo (current and future). Nothing was added to `.gitignore` — the exclusion is private to your clone and cannot be pushed upstream. To share the exclusion with the team instead, re-run with `/shape-init mode=gitignore`.
- **Worktrees:** if `CONTEXT_ROOT` was printed and differs from cwd, you ran this from inside a worktree. `context/` lives at the main repo root and is shared by every worktree of this repo — running `/shape-prd`, `/shape-tech-stack`, etc. from any other worktree will read and write the **same** files. You don't need to re-run `/shape-init` per worktree.

Stop. Do not chain into any other skill; the user runs those when they have something to do.

## Notes

- **Idempotent.** Re-running `/shape-init` on a project where the git exclusion is in place and the directory artifacts already exist is a no-op (with a status print). The context-root protocol itself is idempotent — it never appends a duplicate exclude line.
- **Worktree-shared.** `context/` is anchored to the **main repo working tree** (parent of `git rev-parse --git-common-dir`), not the cwd. Every worktree of the same repo resolves to the same `CONTEXT_ROOT`. You do not need to re-init per worktree.
- **No forced ordering.** The directory artifacts are independent. If only some exist, create the missing ones and leave the existing ones alone. Step 0 (resolve + git-exclude) always runs first, regardless.
- **Parent directories are created as needed.** `context/` may not exist in a fresh project — create it implicitly via `mkdir -p` semantics on each child directory.
- **Not a precondition.** Other skills self-bootstrap their own files **and** apply the same context-root protocol via `references/context-root-protocol.md`. `/shape-init` is for users who like to set up the `/context` skeleton up-front.
- **`lessons.md` and `contract-surfaces.md` are not scaffolded here.** `lessons.md` is owned end-to-end by `/shape-lesson`, which self-bootstraps it with its canonical header on first use.
- **Mode flag.** The optional `mode=gitignore` argument switches Step 0 to write to the tracked `.gitignore` (anchored at `CONTEXT_ROOT`, i.e. the main working tree) instead of the shared `info/exclude`. Use it only when the user explicitly wants the exclusion to be visible to the rest of the team. Default is the safer, repo-local `info/exclude`.
- **Bare repo support.** If the common repo is bare (`git rev-parse --is-bare-repository` returns `true`), `CONTEXT_ROOT` falls back to `<git-common-dir>/shape-context` so all worktrees still share one location.
