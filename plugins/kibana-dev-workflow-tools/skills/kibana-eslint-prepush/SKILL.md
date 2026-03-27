---
name: kibana-eslint-prepush
description: Runs eslint --fix on changed files before committing or pushing to prevent CI auto-fix commits. Use before git commit, git push, or when the user asks to lint, format, or align code with eslint.
---

# Kibana ESLint Pre-Push

Run eslint on changed files before committing/pushing to avoid CI auto-fix commits that require re-triggering the pipeline.

## When to Use

- Before every `git commit` or `git push`
- After completing code changes and before creating a PR
- When the user asks to "lint", "format", "eslint", or "align code"

## Workflow

1. Identify changed files (staged + unstaged):

```bash
node scripts/eslint --fix $(git diff --name-only HEAD) $(git diff --cached --name-only)
```

2. If there are uncommitted changes after the fix, stage and amend/commit them before pushing.

## Notes

- Kibana CI runs `node scripts/eslint_all_files --no-cache --fix` and auto-pushes a commit if it finds issues. This commit does NOT re-trigger CI on draft PRs, requiring a manual `/ci` comment.
- Running eslint locally first avoids this extra round-trip.
- Only lint files you changed — running on the full repo is very slow.
