# Cross-Repo Sync - Quick Reference

## Common Usage

### Sync Docker Version
```bash
# After updating Docker image in current repo
/cross-repo-sync

# Explicit version sync
/cross-repo-sync docker node:20.12.0
```

### Sync NPM Package
```bash
# After npm update in current repo
/cross-repo-sync

# Explicit package sync
/cross-repo-sync npm @elastic/elasticsearch@^8.13.0
```

### Sync GitHub Actions
```bash
/cross-repo-sync actions/checkout@v4
```

### Sync Config Files
```bash
# After updating .nvmrc
/cross-repo-sync node-version

# After updating TypeScript config
/cross-repo-sync tsconfig
```

## What Gets Synced

| Type | Files | Example |
|------|-------|---------|
| **Docker** | `Dockerfile`, `docker-compose.yml`, CI workflows | `node:20.12.0` |
| **NPM** | `package.json`, `package-lock.json` | `typescript@5.4.5` |
| **Actions** | `.github/workflows/*.yml` | `actions/checkout@v4` |
| **Config** | `.nvmrc`, `tsconfig.json`, `.eslintrc` | Node 20.12.0 |

## Workflow

```
1. Detect change in current repo
   ↓
2. Find same old version in sibling repos
   ↓
3. Create sync branch: sync/<package>-<version>
   ↓
4. Apply same change
   ↓
5. Create PR with description
   ↓
6. Trigger CI
   ↓
7. Report status (✅ passed / ❌ failed)
```

## Branch Naming

- Docker: `sync/node-20.12.0`
- NPM: `sync/typescript-5.4.5`
- Actions: `sync/actions-checkout-v4`
- Multi: `sync/typescript-5.4.5-swc-1.5.0`

## PR Title Format

```
chore: sync <package> <version> from <source-repo>
```

Examples:
- `chore: sync node 20.12.0 from elastic-cursor-plugin`
- `chore: sync elasticsearch 8.13.0 from cursor-plugin-evals`

## Sibling Repos

| Repo | Path |
|------|------|
| elastic-cursor-plugin | `~/Projects/elastic-cursor-plugin` |
| cursor-plugin-evals | `~/Projects/cursor-plugin-evals` |
| agent-skills-sandbox | `~/Projects/agent-skills-sandbox` |

## Integration

### With @check-cross-repo-consistency
```bash
# First check for drift
/check-cross-repo-consistency

# Then sync specific items
/cross-repo-sync docker node:20.12.0
```

### With @ci-babysitter
```bash
# If sync PR fails CI
/ci-babysitter --pr <sync-pr-number>
```

### With Renovate
Automatically trigger after Renovate PRs merge:
```json
{
  "postUpgradeTasks": {
    "commands": ["claude /cross-repo-sync"]
  }
}
```

## Validation

Before PR creation, checks:
- ✅ All files updated (Docker, compose, CI, scripts)
- ✅ Package lockfiles regenerated
- ✅ No syntax errors
- ✅ Docker builds
- ✅ npm install succeeds

After PR creation:
- ✅ CI triggered
- ✅ Status monitored (max 10 minutes)
- ✅ Report results

## Status Output

```
Cross-Repo Sync Complete

Source: elastic-cursor-plugin
Change: node 20.11.0 → 20.12.0

Synced to:
✅ cursor-plugin-evals
   PR: https://github.com/org/cursor-plugin-evals/pull/123
   CI: Passed
   Files: 5

✅ agent-skills-sandbox
   PR: https://github.com/org/agent-skills-sandbox/pull/45
   CI: Passed
   Files: 2

Next steps:
1. Review PRs for accuracy
2. Merge when CI is green
```

## Troubleshooting

### "Branch already exists"
```bash
# Clean up old sync branch
cd ~/Projects/<target-repo>
git branch -D sync/<package>-<version>
git push origin --delete sync/<package>-<version>
```

### "No changes to commit"
```bash
# Target repo already has the version
# Verify with:
rg "<version>" --glob "Dockerfile*" --glob "*.yml"
```

### "CI failed"
```bash
# Use ci-babysitter to auto-fix
/ci-babysitter --pr <pr-number>

# Or manually investigate
gh pr checks <pr-number>
```

### "Old version not found"
```bash
# Manually specify files
/cross-repo-sync --force --files "Dockerfile,docker-compose.yml"
```

## Tips

- Always commit changes in source repo first
- Let CI validate before manual review
- Sync immediately after Renovate updates
- Use parallel sync for multiple repos (default)
- Use sequential sync if repos depend on each other
- Check @check-cross-repo-consistency weekly

## Safety Features

- ✅ Always creates PRs (never force-pushes)
- ✅ Waits for CI validation
- ✅ Skips repos without old version
- ✅ Handles conflicts gracefully
- ✅ Reports partial failures
- ✅ Uses `--force-with-lease` for safety
