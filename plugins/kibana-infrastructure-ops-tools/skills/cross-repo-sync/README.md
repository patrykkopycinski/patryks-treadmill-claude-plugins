# Cross-Repo Sync Agent

Auto-propagate version and configuration changes across sibling repositories with PR creation and CI validation.

## Quick Start

```bash
# After updating a version in current repo
/cross-repo-sync

# Explicit version sync
/cross-repo-sync docker node:20.12.0
/cross-repo-sync npm @elastic/elasticsearch@^8.13.0
/cross-repo-sync actions/checkout@v4
```

## What It Does

1. **Detects** version changes in current repo (Docker, npm, GitHub Actions, configs)
2. **Searches** sibling repos for old versions
3. **Creates** sync branches in each repo that needs updates
4. **Applies** same changes automatically
5. **Creates** PRs with detailed descriptions
6. **Triggers** CI and monitors status
7. **Reports** results (✅ passed / ❌ failed)

## Sibling Repos

- `elastic-cursor-plugin` - Plugin source, Docker infra, examples
- `cursor-plugin-evals` - Eval framework, showcase examples
- `agent-skills-sandbox` - Skill testing and development

## What Gets Synced

| Type | Files | Example |
|------|-------|---------|
| Docker | `Dockerfile`, `docker-compose.yml`, CI workflows | `node:20.12.0` |
| NPM | `package.json`, `package-lock.json` | `typescript@5.4.5` |
| GitHub Actions | `.github/workflows/*.yml` | `actions/checkout@v4` |
| Config | `.nvmrc`, `tsconfig.json`, `.eslintrc` | Node 20.12.0 |

## Documentation

- **[SKILL.md](SKILL.md)** - Complete skill instructions (913 lines)
- **[QUICK_REFERENCE.md](QUICK_REFERENCE.md)** - Common commands and patterns
- **[TEST_SCENARIOS.md](TEST_SCENARIOS.md)** - Test cases and examples
- **[INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md)** - Integration with other skills

## Examples

### Example 1: Docker Version Update
```bash
# Update Node in elastic-cursor-plugin
echo "FROM node:20.12.0-alpine" > Dockerfile
git commit -am "chore: update Node to 20.12.0"

# Sync to other repos
/cross-repo-sync

# Output:
# ✅ cursor-plugin-evals: PR #123 (CI passed)
# ✅ agent-skills-sandbox: PR #45 (CI passed)
```

### Example 2: NPM Package Update
```bash
# Update TypeScript
npm install typescript@5.4.5
git commit -am "chore: update TypeScript"

# Sync to other repos
/cross-repo-sync

# Output:
# ✅ cursor-plugin-evals: PR #124 (CI passed)
# ✅ agent-skills-sandbox: PR #46 (CI passed)
```

### Example 3: GitHub Actions Update
```bash
# Update checkout action
sed -i '' 's/actions\/checkout@v3/actions\/checkout@v4/' .github/workflows/*.yml
git commit -am "chore: update actions/checkout to v4"

# Sync to other repos
/cross-repo-sync

# Output:
# ✅ cursor-plugin-evals: PR #125 (CI passed)
# ✅ agent-skills-sandbox: PR #47 (CI passed)
```

## Integration

### With @check-cross-repo-consistency
Check for drift before syncing:
```bash
/check-cross-repo-consistency  # See current drift
/cross-repo-sync                # Sync the drift
```

### With @ci-babysitter
Auto-fix CI failures in sync PRs:
```bash
/cross-repo-sync                      # Creates PRs
# If CI fails:
/ci-babysitter --pr <pr-number>       # Auto-fix failures
```

### With Renovate
Auto-sync after Renovate updates:
```json
{
  "postUpgradeTasks": {
    "commands": ["claude /cross-repo-sync"]
  }
}
```

## Workflow

```
┌─────────────────────────────────────────┐
│ 1. Detect version change in current    │
│ 2. Find old version in sibling repos   │
│ 3. Create sync branch: sync/<pkg>-<ver>│
│ 4. Apply same change                    │
│ 5. Create PR with description           │
│ 6. Trigger CI                           │
│ 7. Monitor status (max 10 min)         │
│ 8. Report results                       │
└─────────────────────────────────────────┘
```

## Features

- ✅ **Automatic detection** - Finds version changes in commits
- ✅ **Multi-repo sync** - Updates all sibling repos in parallel
- ✅ **PR creation** - Creates descriptive PRs with changelog
- ✅ **CI validation** - Triggers and monitors CI status
- ✅ **Safety** - Never force-pushes, always creates PRs
- ✅ **Smart skipping** - Skips repos already at target version
- ✅ **Batch updates** - Handles multiple version changes at once
- ✅ **Dry-run mode** - Preview changes before executing
- ✅ **Failure handling** - Reports issues with actionable next steps

## Safety Features

- Always creates PRs (never force-pushes to main)
- Waits for CI validation before marking as complete
- Skips repos that don't have old version
- Uses `--force-with-lease` when pushing to prevent data loss
- Reports partial failures (some repos succeed, others fail)
- Links back to source repo/commit in PR description

## Requirements

- **git** - Branch and commit operations
- **gh CLI** - PR creation and CI monitoring
- **jq** - JSON parsing (for package.json)
- **ripgrep (rg)** - Fast version searching
- **sed** - File content replacement
- **npm/yarn** - NPM package updates

## Troubleshooting

### "No changes detected"
```bash
# Verify you committed the version change
git log -1 --name-only

# Check if files contain version
rg "<version>" --glob "Dockerfile*" --glob "*.yml"
```

### "Branch already exists"
```bash
# Clean up old sync branch
cd ~/Projects/<target-repo>
git branch -D sync/<package>-<version>
git push origin --delete sync/<package>-<version>
```

### "CI failed in sync PR"
```bash
# Use ci-babysitter to auto-fix
/ci-babysitter --pr <pr-number>

# Or investigate manually
gh pr checks <pr-number>
gh pr view <pr-number>
```

### "Target repo already has version"
```bash
# This is expected - repo is already in sync
# Verify with:
/check-cross-repo-consistency
```

## Tips

- Commit version changes before syncing
- Use `/check-cross-repo-consistency` to see current drift
- Let CI validate before merging
- Sync immediately after Renovate updates
- Use dry-run mode for major version changes
- Integrate with ci-babysitter for auto-fixes
- Set up post-commit hooks for automatic syncing

## Contributing

To improve this skill:

1. Test with scenarios in `TEST_SCENARIOS.md`
2. Document new patterns in `INTEGRATION_GUIDE.md`
3. Update `SKILL.md` with new features
4. Add examples to `QUICK_REFERENCE.md`

## Related Skills

- **@check-cross-repo-consistency** - Check for version drift
- **@ci-babysitter** - Auto-fix CI failures
- **@buildkite-ci-debugger** - Debug CI failures
- **@git-advanced-workflows** - Advanced git operations

## Version

**Current:** 1.0.0
**Created:** 2026-03-20
**Author:** Claude Code with cross-repo-consistency rule

## License

Part of personal agent skills collection. Internal use only.
