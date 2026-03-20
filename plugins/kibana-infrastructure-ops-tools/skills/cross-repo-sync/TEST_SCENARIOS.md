# Cross-Repo Sync - Test Scenarios

## Test Scenario 1: Docker Node Version Sync

**Setup:**
```bash
cd ~/Projects/elastic-cursor-plugin
git checkout -b test/node-update
```

**Change:**
```dockerfile
# Dockerfile
-FROM node:20.11.0-alpine
+FROM node:20.12.0-alpine
```

**Test:**
```bash
git add Dockerfile
git commit -m "chore: update Node to 20.12.0"

# Trigger sync
/cross-repo-sync
```

**Expected:**
- ✅ Detects `node:20.11.0 → node:20.12.0`
- ✅ Finds old version in cursor-plugin-evals (3 files)
- ✅ Finds old version in agent-skills-sandbox (2 files)
- ✅ Creates `sync/node-20.12.0` branch in each
- ✅ Updates all files
- ✅ Creates PRs
- ✅ CI passes

**Verification:**
```bash
# Check PRs created
gh pr list --repo elastic/cursor-plugin-evals | grep "sync/node"
gh pr list --repo elastic/agent-skills-sandbox | grep "sync/node"

# Check CI status
gh pr checks sync/node-20.12.0
```

---

## Test Scenario 2: Elasticsearch Version Sync

**Setup:**
```bash
cd ~/Projects/elastic-cursor-plugin
git checkout -b test/es-update
```

**Change:**
```yaml
# docker-compose.yml
services:
  elasticsearch:
-   image: docker.elastic.co/elasticsearch/elasticsearch:8.12.0
+   image: docker.elastic.co/elasticsearch/elasticsearch:8.13.0
```

**Test:**
```bash
git add docker-compose.yml
git commit -m "chore: update Elasticsearch to 8.13.0"

/cross-repo-sync
```

**Expected:**
- ✅ Detects `elasticsearch:8.12.0 → 8.13.0`
- ✅ Finds in cursor-plugin-evals:
  - `docker-compose.yml`
  - `docker-compose.lite.yml`
  - `.github/workflows/eval.yml`
  - `showcase/elastic-cursor-plugin/docker-compose.yml`
- ✅ Creates PR with 4 files updated
- ✅ CI passes

**Verification:**
```bash
# Check all files updated in PR
gh pr view sync/elasticsearch-8.13.0 --json files --jq '.files[].path'
```

---

## Test Scenario 3: NPM Package Sync

**Setup:**
```bash
cd ~/Projects/elastic-cursor-plugin
git checkout -b test/typescript-update
```

**Change:**
```bash
npm install typescript@5.4.5
```

**Test:**
```bash
git add package.json package-lock.json
git commit -m "chore: update TypeScript to 5.4.5"

/cross-repo-sync
```

**Expected:**
- ✅ Detects `typescript: 5.4.2 → 5.4.5`
- ✅ Updates package.json in target repos
- ✅ Regenerates package-lock.json
- ✅ CI passes (npm install + test)

**Verification:**
```bash
# Check package.json in PR
gh pr view sync/typescript-5.4.5 --json files --jq '.files[] | select(.path == "package.json")'
```

---

## Test Scenario 4: GitHub Actions Sync

**Setup:**
```bash
cd ~/Projects/cursor-plugin-evals
git checkout -b test/actions-update
```

**Change:**
```yaml
# .github/workflows/eval.yml
steps:
- - uses: actions/checkout@v3
+ - uses: actions/checkout@v4
```

**Test:**
```bash
git add .github/workflows/eval.yml
git commit -m "chore: update actions/checkout to v4"

/cross-repo-sync
```

**Expected:**
- ✅ Detects `actions/checkout@v3 → v4`
- ✅ Finds in elastic-cursor-plugin workflows
- ✅ Finds in agent-skills-sandbox workflows
- ✅ Updates all workflow files
- ✅ CI passes (workflow validation)

**Verification:**
```bash
# Check workflow files updated
gh pr view sync/actions-checkout-v4 --json files --jq '.files[] | select(.path | contains("workflows"))'
```

---

## Test Scenario 5: Multi-Package Sync

**Setup:**
```bash
cd ~/Projects/elastic-cursor-plugin
git checkout -b test/multi-update
```

**Change:**
```bash
npm install typescript@5.4.5 @swc/core@1.5.0
```

**Test:**
```bash
git add package.json package-lock.json
git commit -m "chore: update TypeScript and SWC"

/cross-repo-sync
```

**Expected:**
- ✅ Detects both version changes
- ✅ Creates single PR with both updates
- ✅ Branch named `sync/typescript-5.4.5-swc-1.5.0`
- ✅ CI passes

---

## Test Scenario 6: Config File Sync (.nvmrc)

**Setup:**
```bash
cd ~/Projects/elastic-cursor-plugin
git checkout -b test/nvmrc-update
```

**Change:**
```bash
echo "20.12.0" > .nvmrc
```

**Test:**
```bash
git add .nvmrc
git commit -m "chore: update Node version to 20.12.0"

/cross-repo-sync
```

**Expected:**
- ✅ Detects .nvmrc change
- ✅ Updates .nvmrc in target repos
- ✅ Updates node-version in CI workflows
- ✅ CI passes

---

## Test Scenario 7: Partial Sync (One Repo Already Updated)

**Setup:**
```bash
# Manually update cursor-plugin-evals first
cd ~/Projects/cursor-plugin-evals
echo "20.12.0" > .nvmrc
git commit -am "chore: update Node to 20.12.0"
git push

# Then update elastic-cursor-plugin
cd ~/Projects/elastic-cursor-plugin
echo "20.12.0" > .nvmrc
git commit -am "chore: update Node to 20.12.0"
```

**Test:**
```bash
/cross-repo-sync
```

**Expected:**
- ✅ Checks cursor-plugin-evals → already updated, skipped
- ✅ Checks agent-skills-sandbox → needs update
- ✅ Creates PR only for agent-skills-sandbox
- ✅ Reports 1 repo synced, 1 skipped

---

## Test Scenario 8: CI Failure Handling

**Setup:**
```bash
cd ~/Projects/elastic-cursor-plugin
git checkout -b test/breaking-change
```

**Change:**
```bash
# Introduce breaking change (wrong image name)
sed -i '' 's/node:20.11.0/node:20.99.0-INVALID/' Dockerfile
```

**Test:**
```bash
git add Dockerfile
git commit -m "test: breaking change"

/cross-repo-sync
```

**Expected:**
- ✅ Creates PR successfully
- ✅ CI triggered
- ❌ CI fails (invalid image)
- ✅ Reports failure with CI logs
- ✅ Suggests using @ci-babysitter

**Verification:**
```bash
# Check CI failure
gh pr checks sync/node-20.99.0-INVALID
```

---

## Test Scenario 9: Renovate Integration

**Setup:**
```bash
# Simulate Renovate PR in elastic-cursor-plugin
cd ~/Projects/elastic-cursor-plugin
git checkout -b renovate/elasticsearch-8.x
```

**Change:**
```yaml
# docker-compose.yml (Renovate change)
services:
  elasticsearch:
-   image: docker.elastic.co/elasticsearch/elasticsearch:8.12.0
+   image: docker.elastic.co/elasticsearch/elasticsearch:8.13.0
```

**Test:**
```bash
git add docker-compose.yml
git commit -m "chore(deps): update dependency elasticsearch to v8.13.0"

# Merge Renovate PR
git checkout main
git merge renovate/elasticsearch-8.x

# Auto-trigger sync (via hook)
/cross-repo-sync
```

**Expected:**
- ✅ Detects Renovate merge
- ✅ Extracts version from commit message
- ✅ Auto-syncs to sibling repos
- ✅ Creates PRs
- ✅ Links back to original Renovate PR

---

## Test Scenario 10: Dry-Run Mode

**Setup:**
```bash
cd ~/Projects/elastic-cursor-plugin
git checkout -b test/dry-run
```

**Change:**
```dockerfile
# Dockerfile
-FROM node:20.11.0-alpine
+FROM node:20.12.0-alpine
```

**Test:**
```bash
git add Dockerfile
git commit -m "chore: update Node to 20.12.0"

/cross-repo-sync --dry-run
```

**Expected:**
- ✅ Detects changes
- ✅ Shows what would be synced
- ✅ Lists target repos and files
- ✅ Does NOT create branches
- ✅ Does NOT create PRs
- ✅ Reports "dry-run complete, no changes made"

---

## Integration Test: Full Pipeline

**Scenario:** Update all dependencies after Renovate batch

**Steps:**
1. Renovate updates Node, Elasticsearch, TypeScript in elastic-cursor-plugin
2. Merge Renovate PRs to main
3. Trigger /cross-repo-sync
4. Verify all changes propagated to cursor-plugin-evals and agent-skills-sandbox
5. Monitor CI on all PRs
6. Auto-merge when green (optional)

**Success Criteria:**
- All 3 versions synced correctly
- All PRs created successfully
- All CI checks pass
- No manual intervention required

---

## Regression Tests

### Test: No False Positives
```bash
# No changes in current repo
cd ~/Projects/elastic-cursor-plugin
git status  # clean

/cross-repo-sync
# Expected: "No version changes detected"
```

### Test: Handle Missing Sibling Repo
```bash
# Temporarily rename repo
mv ~/Projects/agent-skills-sandbox ~/Projects/agent-skills-sandbox.bak

/cross-repo-sync
# Expected: Skip missing repo with warning
```

### Test: Handle Git Conflicts
```bash
# Create conflict scenario
cd ~/Projects/cursor-plugin-evals
git checkout -b sync/node-20.12.0
# (branch already exists)

/cross-repo-sync
# Expected: Delete old branch and recreate
```

---

## Performance Tests

### Test: Large Multi-File Sync
```bash
# Update version mentioned in 50+ files
cd ~/Projects/elastic-cursor-plugin
# Change node:20.11.0 to node:20.12.0 in:
# - All Dockerfiles
# - All docker-compose files
# - All CI workflows
# - All documentation
# - All example projects

/cross-repo-sync
# Expected: Complete in < 2 minutes
```

### Test: Parallel Sync Speed
```bash
# Sync to all 3 repos in parallel
time /cross-repo-sync

# Expected: ~3 minutes (parallel)
# vs ~9 minutes (sequential)
```

---

## Edge Cases

### Edge Case 1: Version in Comments
```dockerfile
# Old version: node:20.11.0 (do not change)
FROM node:20.12.0-alpine
```

**Expected:** Only update actual FROM line, not comments

### Edge Case 2: Semver Ranges
```json
{
  "dependencies": {
    "typescript": "~5.4.2"
  }
}
```

**Syncing to:** `^5.4.5`
**Expected:** Respect new range type

### Edge Case 3: Pre-release Versions
```
node:20.12.0-rc.1 → node:20.12.0
```

**Expected:** Handle pre-release tag correctly

### Edge Case 4: Multi-line FROM
```dockerfile
FROM node:20.11.0-alpine \
  AS builder
```

**Expected:** Update version preserving formatting
