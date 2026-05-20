# Worktree-Safe `context/` Protocol

Every skill in this plugin writes artifacts under `context/`. When the user runs from inside a git repository — especially one with worktrees — there are two distinct safety problems to solve:

1. **Don't pollute the host repo's git history.** `context/` holds personal working notes, never source code. They must not be staged, committed, or pushed by accident, and they must survive `git clean` / branch switches.
2. **Don't make the user reinitialize per worktree.** A repo with N worktrees should be configured **once**: `/shape-idea` in worktree A and `/shape-idea` in worktree B should both find the same `context/foundation/prd.md` and share the same git-exclude line. The user does not want to re-run `/shape-init` every time they create a new worktree.

This protocol solves both at once by anchoring everything to the repo's **common git directory** (shared by the main repo and every worktree of it) instead of to the cwd.

## Two outputs every skill needs

A. **`CONTEXT_ROOT`** — the absolute path to the directory that contains `context/`. All `context/foo/bar.md` paths in skill instructions are relative to this root, not to cwd.
B. **One git-exclude write** — one line in the repo's shared exclude file, applied once per repo, idempotent thereafter.

## Step 1 — Detect the git repository

```bash
if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  # Not inside a git repo at all. context/ lives in cwd; no exclude to write.
  CONTEXT_ROOT="$(pwd)"
  GIT_STATE="not-a-git-repo"
fi
```

If `GIT_STATE=not-a-git-repo`, skip Steps 2–4 entirely — there is no git history to be careful about, and `context/` simply lives in the current directory. Note `git-exclude: not-a-git-repo` in the summary and proceed.

## Step 2 — Resolve `CONTEXT_ROOT` (worktree-aware)

When inside a git repo, anchor `context/` to a single location shared by every worktree of this repo:

```bash
GIT_COMMON_DIR="$(git rev-parse --git-common-dir)"
# Make absolute (rev-parse may return a relative path)
GIT_COMMON_DIR="$(cd "$GIT_COMMON_DIR" && pwd)"

# Is the common repo bare?
IS_BARE="$(git --git-dir="$GIT_COMMON_DIR" rev-parse --is-bare-repository 2>/dev/null)"

if [ "$IS_BARE" = "true" ]; then
  # Bare-repo case: no main working tree. Park context/ inside the common git dir.
  CONTEXT_ROOT="$GIT_COMMON_DIR/shape-context"
else
  # Non-bare case: the parent of .git is the primary working tree of the repo.
  # Both the main checkout and any number of worktrees resolve to the SAME path here.
  CONTEXT_ROOT="$(dirname "$GIT_COMMON_DIR")"
fi
```

What this gives you: in a layout like

```
~/Projects/kibana                       ← main checkout, .git is a directory here
~/Projects/kibana.worktrees/branch-a    ← worktree, .git is a file pointing at kibana/.git/worktrees/branch-a
~/Projects/kibana.worktrees/branch-b    ← worktree
```

…running any skill from any of those three locations resolves `CONTEXT_ROOT` to the same value: `~/Projects/kibana`. The `context/foundation/prd.md` written from worktree A is the same file `/shape-idea` from worktree B will read.

### When to use `CONTEXT_ROOT` vs. cwd

- **Read or write under `context/`?** Always use `CONTEXT_ROOT`. The skill's instructions might say `context/foundation/prd.md` — internally, that means `$CONTEXT_ROOT/context/foundation/prd.md`.
- **Read or write source code, package manifests, lockfiles, `AGENTS.md`?** Use cwd (or wherever the skill normally writes). Those files belong to the worktree, not the shared notes area. `/shape-agents-md` writing `AGENTS.md`, `/shape-bootstrap` scaffolding source files, and `/shape-stack-assess` reading `package.json` all stay worktree-local.

The split is: **shaping notes are repo-shared; code is worktree-local.**

## Step 3 — Decide which exclusion mechanism to use

Two mechanisms exist. The protocol picks one automatically:

| Mechanism | When | Why |
|-----------|------|-----|
| `<git-common-dir>/info/exclude` (repo-local, untracked) | **Default.** Always prefer this. | Repo-local. Never committed. Never visible to other contributors. **Shared by every worktree of this repo** — write once, applies everywhere. |
| `<main-working-tree>/.gitignore` (tracked) | Only when the user explicitly opts in via `mode=gitignore`. | Tracked. Visible to teammates. Use only if `context/` should be ignored for everyone working on this repo. |

The default is `<git-common-dir>/info/exclude`. The protocol never edits `.gitignore` without an explicit `mode=gitignore` signal.

## Step 4 — Check whether `context/` is already excluded

```bash
# Run check-ignore against a file under context/ (path doesn't need to exist).
# Use --no-index so we test the rules, not the staged state.
if git check-ignore -q "$CONTEXT_ROOT/context/" 2>/dev/null; then
  GIT_STATE="already-excluded"
fi
```

If already excluded (by the common exclude file, the main repo's `.gitignore`, or a per-worktree exclude from a previous run), do nothing and note `git-exclude: already-excluded`.

## Step 5 — Append `context/` to `<git-common-dir>/info/exclude` (default)

```bash
EXCLUDE_FILE="$GIT_COMMON_DIR/info/exclude"
mkdir -p "$(dirname "$EXCLUDE_FILE")"
touch "$EXCLUDE_FILE"

if ! grep -qxF 'context/' "$EXCLUDE_FILE"; then
  {
    printf '\n# Added by the product-shaping plugin — see plugins/product-shaping/README.md\n'
    printf 'context/\n'
  } >> "$EXCLUDE_FILE"
  GIT_STATE="appended-to-info-exclude"
else
  GIT_STATE="already-in-info-exclude"
fi
```

Result: in every worktree of this repo (current and future), `context/` is invisible to `git status`, `git add`, `git commit`. The user never has to re-run this for a new worktree of the same repo.

## Step 6 — Append `context/` to `.gitignore` (only when `mode=gitignore`)

Only when the caller explicitly passes `mode=gitignore`:

```bash
# Anchor .gitignore at the main working tree, not the worktree we happen to be in.
GITIGNORE="$CONTEXT_ROOT/.gitignore"
touch "$GITIGNORE"

if ! grep -qxF 'context/' "$GITIGNORE"; then
  {
    printf '\n# product-shaping plugin artifacts — local working notes\n'
    printf 'context/\n'
  } >> "$GITIGNORE"
  GIT_STATE="appended-to-gitignore"
else
  GIT_STATE="already-in-gitignore"
fi
```

The protocol does not run `git add` or `git commit` — that decision belongs to the user.

## Step 7 — Surface the state

The caller folds these into its summary, depending on which apply:

- `context-root: <path>` — print this when CONTEXT_ROOT differs from cwd (i.e. running from a worktree, or a subdirectory of the main checkout). Skip when CONTEXT_ROOT == cwd to avoid noise.
- `git-exclude: <state>` — always print. Possible values:
  - `not-a-git-repo`
  - `already-excluded`
  - `appended-to-info-exclude`
  - `already-in-info-exclude`
  - `appended-to-gitignore` (only when `mode=gitignore`)
  - `already-in-gitignore` (only when `mode=gitignore`)

## Caller responsibilities

A skill that reads or writes under `context/` must:

1. **Resolve `CONTEXT_ROOT` first.** Run the detect/resolve block at Step 1–2 before any path reference. Any `context/foo.md` in this skill's instructions is shorthand for `$CONTEXT_ROOT/context/foo.md`.
2. **Run the git-exclude protocol idempotently.** Step 4 short-circuits if already excluded. The full protocol is safe to re-run on every invocation; it never appends a duplicate line.
3. **Surface `context-root:` when relevant** so the user knows their notes are shared with siblings. Surface `git-exclude:` always.
4. **Don't run `git add` / `git commit` / `git rm` on the user's behalf.** Edits to `info/exclude` are filesystem-only; edits to `.gitignore` are deliberately left for the user to commit.

## Concrete example: kibana with worktrees

```
~/Projects/kibana                       # main repo, has .git/
~/Projects/kibana.worktrees/feature-a   # worktree
~/Projects/kibana.worktrees/feature-b   # worktree
```

User runs `/shape-init` from `feature-a` for the first time:

1. `git rev-parse --git-common-dir` → `~/Projects/kibana/.git`
2. Bare check: false → `CONTEXT_ROOT = ~/Projects/kibana`
3. `git check-ignore -q context/` → not yet excluded
4. Append `context/` to `~/Projects/kibana/.git/info/exclude`
5. Create `~/Projects/kibana/context/{changes,archive,foundation}/`
6. Print:
   ```
   context-root:                   /Users/patryk/Projects/kibana  (shared with all worktrees)
   git-exclude:                    appended-to-info-exclude
   context/changes/                created
   ...
   ```

User then opens worktree `feature-b` later and runs `/shape-prd`:

1. `git rev-parse --git-common-dir` → `~/Projects/kibana/.git` (same!)
2. `CONTEXT_ROOT = ~/Projects/kibana` (same!)
3. `git check-ignore -q context/` → **already excluded** (from step 4 above)
4. Read `~/Projects/kibana/context/foundation/shape-notes.md` (same file `feature-a` wrote!)
5. Write `~/Projects/kibana/context/foundation/prd.md`
6. Print: `git-exclude: already-excluded`

The user does not see `/shape-init` again. The pipeline state carries from worktree to worktree.

## What this protocol explicitly does NOT do

- It does not migrate an existing per-worktree `context/` into the shared location. If a user had per-worktree `context/` directories from before installing this plugin, they must consolidate those manually. New runs always use the shared location.
- It does not run `git rm --cached` for previously committed `context/` files. If a user committed `context/` artifacts before installing this plugin, they must clean those up themselves.
- It does not write to multiple repos. The resolution is per-repo: each independent repo on disk gets its own `CONTEXT_ROOT` and its own exclude line if the user runs the pipeline inside it.
- It does not silently rewrite an existing `.gitignore`. The `mode=gitignore` branch only ever appends one new line, with a commented header.
- It does not move or relocate the resolved `CONTEXT_ROOT`. If the user wants `context/` outside the repo entirely (e.g. in `~/.shape-context/<project>/`), that is a future enhancement.
