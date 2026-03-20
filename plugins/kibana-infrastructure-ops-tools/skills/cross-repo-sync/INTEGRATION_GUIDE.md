# Cross-Repo Sync - Integration Guide

## Integration with Other Skills

### 1. With @check-cross-repo-consistency

**Purpose:** Check for drift before syncing

**Workflow:**
```bash
# Step 1: Check current state
/check-cross-repo-consistency

# Output shows drift:
# 🔴 Critical Drift
# - node: 20.11.0 (elastic-cursor-plugin) vs 20.10.0 (cursor-plugin-evals)
# - elasticsearch: 8.13.0 vs 8.12.0

# Step 2: Sync the drift
/cross-repo-sync docker node:20.12.0
/cross-repo-sync docker elasticsearch:8.13.0

# Step 3: Verify sync
/check-cross-repo-consistency
# ✅ All in sync
```

**When to use:**
- Weekly drift checks
- Before major releases
- After batch Renovate updates
- After manual version changes

---

### 2. With @ci-babysitter

**Purpose:** Auto-fix CI failures in sync PRs

**Workflow:**
```bash
# Step 1: Create sync PR
/cross-repo-sync docker node:20.12.0

# Output:
# ✅ cursor-plugin-evals: PR #123
# ❌ agent-skills-sandbox: PR #45 (CI failed)

# Step 2: Auto-fix CI failure
cd ~/Projects/agent-skills-sandbox
git checkout sync/node-20.12.0
/ci-babysitter

# CI babysitter will:
# - Debug failures
# - Apply fixes
# - Re-push and trigger CI
# - Monitor until green
```

**When to use:**
- Sync PR fails CI
- Complex test failures after version update
- Multiple CI failures across repos
- Want hands-free PR maintenance

---

### 3. With Renovate (GitHub App)

**Purpose:** Auto-sync Renovate version updates

**Setup:** Add to `.github/renovate.json`:
```json
{
  "extends": ["config:base"],
  "postUpgradeTasks": {
    "commands": [
      "echo 'Renovate updated versions - triggering cross-repo sync'",
      "claude /cross-repo-sync"
    ],
    "fileFilters": ["**/package.json", "**/Dockerfile", "**/*.yml"]
  },
  "prCreation": "immediate",
  "automerge": true,
  "automergeType": "pr",
  "requiredStatusChecks": null
}
```

**Workflow:**
```
Renovate creates PR
  ↓
PR is merged to main
  ↓
postUpgradeTasks runs
  ↓
/cross-repo-sync detects change
  ↓
Creates sync PRs in sibling repos
  ↓
CI validates
  ↓
Auto-merge (optional)
```

**When to use:**
- Automated dependency updates
- Keep all repos in sync automatically
- Reduce manual sync overhead

---

### 4. With @buildkite-ci-debugger

**Purpose:** Debug CI failures in sync PRs

**Workflow:**
```bash
# Step 1: Sync creates PR
/cross-repo-sync npm typescript@5.4.5

# Step 2: CI fails in target repo
# ❌ cursor-plugin-evals: PR #123 (CI failed)

# Step 3: Debug failure
/buildkite-ci-debugger --pr 123

# Output:
# Build: https://buildkite.com/elastic/cursor-plugin-evals/builds/456
# Failed jobs:
# - Type Check (exit 1)
# - Unit Tests (exit 1)
#
# Root cause: TypeScript breaking changes in 5.4.5
# Affected files: src/index.ts, src/utils.ts

# Step 4: Fix manually or with ci-babysitter
/ci-babysitter --pr 123
```

**When to use:**
- Understand why sync PR failed
- Breaking changes in dependency
- Need detailed CI logs
- Before attempting fixes

---

### 5. With Git Hooks

**Purpose:** Auto-trigger sync on version commits

**Setup:** Add to `.git/hooks/post-commit`:
```bash
#!/bin/bash

# Get changed files in last commit
CHANGED=$(git diff --name-only HEAD~1)

# Check if version files changed
if echo "$CHANGED" | grep -qE "Dockerfile|docker-compose|package.json|.nvmrc"; then
  echo "Version file changed - triggering cross-repo sync"

  # Prompt for sync
  read -p "Sync this change to sibling repos? [y/N] " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    claude /cross-repo-sync
  fi
fi
```

Make executable:
```bash
chmod +x .git/hooks/post-commit
```

**Workflow:**
```
User commits version change
  ↓
post-commit hook detects version file
  ↓
Prompts user to sync
  ↓
If yes → /cross-repo-sync runs
  ↓
Creates sync PRs
```

**When to use:**
- Always remember to sync changes
- Immediate sync after version bumps
- Reduce manual sync overhead

---

### 6. With GitHub Actions (Automated Workflow)

**Purpose:** Fully automated cross-repo sync

**Setup:** Add to `.github/workflows/cross-repo-sync.yml`:
```yaml
name: Cross-Repo Sync

on:
  push:
    branches:
      - main
    paths:
      - 'Dockerfile*'
      - '**/docker-compose*.yml'
      - 'package.json'
      - '.nvmrc'
      - '.github/workflows/**'

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          fetch-depth: 2  # Need previous commit for diff

      - name: Detect version changes
        id: detect
        run: |
          # Compare last two commits
          CHANGED=$(git diff HEAD~1 --name-only)
          echo "changed=$CHANGED" >> $GITHUB_OUTPUT

          # Extract version changes
          if echo "$CHANGED" | grep -q "Dockerfile"; then
            DOCKER_NEW=$(git diff HEAD~1 Dockerfile | grep "^+FROM" | sed 's/^+FROM //')
            echo "docker_new=$DOCKER_NEW" >> $GITHUB_OUTPUT
          fi

      - name: Trigger Claude Code
        if: steps.detect.outputs.docker_new != ''
        run: |
          # Call Claude Code API to trigger sync
          claude /cross-repo-sync docker ${{ steps.detect.outputs.docker_new }}
        env:
          CLAUDE_API_KEY: ${{ secrets.CLAUDE_API_KEY }}
```

**Workflow:**
```
Push to main
  ↓
GitHub Action detects version change
  ↓
Triggers Claude Code via API
  ↓
/cross-repo-sync runs
  ↓
Creates sync PRs in sibling repos
  ↓
CI validates
  ↓
Notify on Slack (optional)
```

**When to use:**
- Fully automated sync pipeline
- No manual intervention needed
- High-confidence automated updates

---

## Common Integration Patterns

### Pattern 1: Weekly Drift Audit + Batch Sync

**Goal:** Keep repos in sync with minimal manual work

**Schedule:** Every Monday morning

**Workflow:**
```bash
# 1. Check for drift
/check-cross-repo-consistency > drift-report.txt

# 2. Review drift report
cat drift-report.txt

# 3. Batch sync all drifts
/cross-repo-sync --batch

# 4. Monitor all PRs
gh pr list --repo elastic/cursor-plugin-evals --label "cross-repo-sync"
gh pr list --repo elastic/agent-skills-sandbox --label "cross-repo-sync"

# 5. Auto-merge when green
gh pr merge --auto --squash
```

---

### Pattern 2: Renovate → Sync → CI → Merge

**Goal:** Fully automated dependency updates

**Trigger:** Renovate merges PR to main

**Workflow:**
```
Renovate PR merged
  ↓
postUpgradeTasks runs /cross-repo-sync
  ↓
Sync PRs created in sibling repos
  ↓
CI runs on all PRs
  ↓
  ├─ ✅ All pass → Auto-merge
  └─ ❌ Any fail → /ci-babysitter fixes
       ↓
     Re-trigger CI
       ↓
     CI pass → Auto-merge
```

**Benefits:**
- Zero manual intervention
- Always in sync
- Fast turnaround

---

### Pattern 3: Manual Change → Sync → Review → Merge

**Goal:** Sync manual version updates with review

**Trigger:** Developer commits version change

**Workflow:**
```bash
# 1. Make version change
echo "20.12.0" > .nvmrc
git commit -am "chore: update Node to 20.12.0"
git push

# 2. Post-commit hook prompts for sync
# "Sync this change to sibling repos? [y/N]"
# User types: y

# 3. Sync runs
/cross-repo-sync

# 4. PRs created
# elastic-cursor-plugin → cursor-plugin-evals (PR #123)
# elastic-cursor-plugin → agent-skills-sandbox (PR #45)

# 5. Request reviews
gh pr ready --pr 123
gh pr ready --pr 45

# 6. Wait for approval + CI green

# 7. Merge
gh pr merge --squash --pr 123
gh pr merge --squash --pr 45
```

---

### Pattern 4: Dry-Run → Review → Execute

**Goal:** Preview changes before syncing

**Trigger:** Before major version updates

**Workflow:**
```bash
# 1. Make breaking change (e.g., Node 20 → 22)
sed -i '' 's/node:20.11.0/node:22.0.0/' Dockerfile

# 2. Dry-run to preview impact
/cross-repo-sync --dry-run

# Output:
# Dry-run: node:20.11.0 → node:22.0.0
#
# Would sync to:
# - cursor-plugin-evals (5 files)
# - agent-skills-sandbox (2 files)
#
# No changes made (dry-run mode)

# 3. Review affected files
cat /tmp/cross-repo-sync-dry-run.log

# 4. If looks good, execute
/cross-repo-sync

# 5. Monitor CI closely (breaking change)
watch "gh pr checks sync/node-22.0.0"
```

---

### Pattern 5: Partial Sync (One Repo at a Time)

**Goal:** Gradual rollout of version updates

**Trigger:** Want to test in one repo before full sync

**Workflow:**
```bash
# 1. Update elastic-cursor-plugin
echo "20.12.0" > .nvmrc
git commit -am "chore: update Node to 20.12.0"
git push

# 2. Sync to cursor-plugin-evals only
/cross-repo-sync --target cursor-plugin-evals

# 3. Wait for CI + test deployment
gh pr checks sync/node-20.12.0

# 4. If all good, sync to remaining repos
/cross-repo-sync --target agent-skills-sandbox

# 5. Merge all when confident
```

---

## Monitoring & Alerting

### Slack Integration

**Setup:** Add to `~/.agents/config/slack-webhooks.json`:
```json
{
  "cross-repo-sync": {
    "webhook_url": "https://hooks.slack.com/services/...",
    "channel": "#eng-infra",
    "notify_on": ["pr_created", "ci_passed", "ci_failed"]
  }
}
```

**Notifications:**
```
🔄 Cross-Repo Sync Started
Source: elastic-cursor-plugin
Change: node 20.11.0 → 20.12.0
Target repos: 2

✅ Sync Complete
cursor-plugin-evals: PR #123 (CI passed)
agent-skills-sandbox: PR #45 (CI passed)

❌ CI Failed
cursor-plugin-evals: PR #123
Reason: TypeScript errors
Action: /ci-babysitter triggered
```

---

### Dashboard

**Create sync status dashboard:**

**File:** `~/Projects/.sync-status/dashboard.html`

**Generate with:**
```bash
/cross-repo-sync --dashboard

# Opens browser with:
# - Last sync timestamp
# - Pending PRs by repo
# - CI status overview
# - Drift report
# - Upcoming Renovate PRs
```

---

## Troubleshooting Integration Issues

### Issue: Sync triggered but no PRs created

**Debug:**
```bash
# Check if old version exists in target repos
cd ~/Projects/cursor-plugin-evals
rg "20.11.0" --glob "Dockerfile*" --glob "*.yml"

# If not found:
# → Target repo already has new version
# → Check drift report to confirm
/check-cross-repo-consistency
```

### Issue: CI always fails after sync

**Debug:**
```bash
# Use buildkite-ci-debugger to investigate
/buildkite-ci-debugger --pr <pr-number>

# Common causes:
# - Breaking changes in dependency
# - Incompatible peer dependencies
# - Test failures due to behavior changes

# Fix:
/ci-babysitter --pr <pr-number>
```

### Issue: Sync creates duplicate PRs

**Debug:**
```bash
# Check for existing sync branches
cd ~/Projects/cursor-plugin-evals
git branch -r | grep "sync/"

# Clean up old branches
git push origin --delete sync/node-20.11.0

# Re-run sync
/cross-repo-sync
```

---

## Best Practices

1. **Always check drift before syncing**
   ```bash
   /check-cross-repo-consistency
   /cross-repo-sync
   ```

2. **Use dry-run for major changes**
   ```bash
   /cross-repo-sync --dry-run
   ```

3. **Monitor CI closely after breaking changes**
   ```bash
   watch "gh pr checks sync/<branch>"
   ```

4. **Use ci-babysitter for auto-fixes**
   ```bash
   /ci-babysitter --pr <pr-number>
   ```

5. **Batch related changes**
   ```bash
   # Instead of 3 separate syncs:
   /cross-repo-sync --batch docker,npm,actions
   ```

6. **Set up post-commit hooks**
   ```bash
   # Auto-prompt for sync after version changes
   ```

7. **Enable Renovate integration**
   ```json
   // .github/renovate.json
   "postUpgradeTasks": {
     "commands": ["claude /cross-repo-sync"]
   }
   ```

8. **Review PRs before auto-merge**
   ```bash
   # Even with CI passing, spot-check for unexpected changes
   gh pr diff <pr-number>
   ```

9. **Keep sync branches short-lived**
   ```bash
   # Merge or close within 24 hours
   # Avoid merge conflicts
   ```

10. **Monitor sync metrics**
    ```bash
    # Track: success rate, avg time, CI pass rate
    /cross-repo-sync --metrics
    ```
