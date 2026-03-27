---
name: kibana-precommit-checks
description: Runs scoped eslint --fix and type_check on changed files before committing to prevent CI failures. Use before git commit, git push, or when the user asks to lint, type-check, or validate changes.
---

# Kibana Pre-Commit Checks

Run eslint and type_check scoped to only the changed files before committing/pushing. Catches lint and type errors locally instead of waiting 45+ minutes for CI to report them.

## When to Use

- Before every `git commit` or `git push`
- After completing code changes and before creating a PR
- When the user says "lint", "type check", "validate", "pre-commit", or "check before push"
- Proactively after making substantial code changes to multiple files

## Workflow

### Step 1: Identify changed files and their owning tsconfig projects

```bash
# Get all changed .ts/.tsx files (staged + unstaged + untracked)
CHANGED_TS=$(comm -23 \
  <(sort -u <(git diff --name-only HEAD; git diff --cached --name-only; git ls-files --others --exclude-standard) | grep -E '\.(tsx?|jsx?)$') \
  <(echo ""))

# Find unique tsconfig.json projects that own the changed files.
# Walk up from each file to the nearest directory containing a tsconfig.json.
PROJECTS=$(echo "$CHANGED_TS" | while read -r f; do
  dir=$(dirname "$f")
  while [ "$dir" != "." ] && [ "$dir" != "/" ]; do
    if [ -f "$dir/tsconfig.json" ]; then
      echo "$dir/tsconfig.json"
      break
    fi
    dir=$(dirname "$dir")
  done
done | sort -u)
```

### Step 2: Run eslint --fix on changed files

```bash
CHANGED_FILES=$(git diff --name-only HEAD; git diff --cached --name-only)
if [ -n "$CHANGED_FILES" ]; then
  node scripts/eslint --fix $CHANGED_FILES
fi
```

If eslint fails with `Cannot find module '@kbn/setup-node-env'`, you need to run `yarn kbn bootstrap` first. If bootstrap is not practical (e.g., worktree without full setup), skip eslint and rely on CI — but still run the type check.

### Step 3: Run type_check scoped to affected projects

For each unique tsconfig project found in Step 1, run a separate type check:

```bash
for project in $PROJECTS; do
  echo "=== Type checking: $project ==="
  node scripts/type_check --project "$project" --cleanup
  # Exit early on first failure to save time
  if [ $? -ne 0 ]; then
    echo "FAILED: $project"
    break
  fi
done
```

**Critical flags:**
- `--project <path>` — scopes the check to one tsconfig project (fast: seconds instead of 30+ minutes)
- `--cleanup` — removes the temporary `tsconfig.type_check.json` files after the run so they don't pollute the working tree or show up in `git status`

**What `--cleanup` prevents:**
Without `--cleanup`, the type checker leaves behind `tsconfig.type_check.json` and `tsconfig.refs.json` files in every project directory. These are gitignored (`*.type_check.json` in `.gitignore`) so they won't be committed, but they clutter the workspace. The `--cleanup` flag deletes them after the run.

**About `target/types/` directories:**
The type checker emits `.d.ts` files into `target/types/` under each project. These are gitignored (under `target/`) and are used as a build cache for subsequent runs. They are harmless and make future type checks faster. Do NOT delete them manually unless you want a clean-cache run (`--clean-cache`).

### Step 4: Stage any eslint auto-fixes

```bash
# If eslint made changes, stage them
git diff --name-only | xargs -r git add
```

Then proceed with the commit.

## Quick Reference

| Scenario | Command |
|---|---|
| Type check one project | `node scripts/type_check --project x-pack/platform/plugins/shared/fleet/tsconfig.json --cleanup` |
| Type check all (slow) | `node scripts/type_check` |
| ESLint changed files | `node scripts/eslint --fix $(git diff --name-only HEAD)` |
| Clean type cache | `node scripts/type_check --clean-cache` |

## Finding the Right tsconfig.json

Each Kibana module has a `tsconfig.json` at its root. Test files are typically included by the parent plugin's tsconfig via `include` globs (e.g., `"test/scout/**/*"`). To find which tsconfig owns a file:

1. Walk up from the file path to find the nearest `tsconfig.json`
2. Check its `include` array covers the file
3. If unsure, run `node scripts/lint_ts_projects` to see ownership errors

Common examples:
- `x-pack/platform/plugins/shared/fleet/test/scout/**` → `x-pack/platform/plugins/shared/fleet/tsconfig.json`
- `x-pack/platform/plugins/shared/osquery/test/scout_osquery/**` → `x-pack/platform/plugins/shared/osquery/tsconfig.json`
- `src/platform/plugins/shared/dashboard/test/scout/**` → `src/platform/plugins/shared/dashboard/tsconfig.json`

## Notes

- `--project` accepts only ONE tsconfig per run. For changes spanning multiple plugins, run separate commands.
- The type checker needs `@kbn/setup-node-env` — if you get module errors, run `yarn kbn bootstrap`.
- CI runs the full type check on every PR. Scoped local checks catch most errors in seconds.
- Prefer running both eslint and type_check before every commit to avoid CI round-trips.
