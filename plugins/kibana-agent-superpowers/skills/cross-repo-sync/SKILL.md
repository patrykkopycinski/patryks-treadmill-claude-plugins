---
name: cross-repo-sync
description: >-
  Auto-propagate version and configuration changes across sibling repos
  (elastic-cursor-plugin, cursor-plugin-evals, agent-skills-sandbox). Detects
  Docker versions, npm dependencies, YAML conventions, and config file changes,
  then creates sync PRs with CI validation. Use when syncing versions across
  repos, propagating Renovate updates, or when asked to "sync this change",
  "update [package] across repos", or "propagate this version".
---

# Cross-Repo Sync Agent

**Mission:** Automatically propagate version and configuration changes across sibling repositories with PR creation and CI validation.

## Sibling Repositories

These repositories share patterns and must be kept in sync:

| Repository | Path | Purpose |
|------------|------|---------|
| `elastic-cursor-plugin` | `~/Projects/elastic-cursor-plugin` | Plugin source, Docker infra, examples, CI |
| `cursor-plugin-evals` | `~/Projects/cursor-plugin-evals` | Eval framework, Docker infra, showcase examples |
| `agent-skills-sandbox` | `~/Projects/agent-skills-sandbox` | Skill testing and development |

## When to Use This Skill

### Triggers
- "sync this change to sibling repos"
- "update [package] across repos"
- "propagate this version change"
- "apply Docker update to all repos"
- "sync Renovate updates"
- After committing version changes to one repo
- After Renovate creates version bump PRs

### Don't Use For
- Syncing code logic (only versions/configs)
- Changes unique to one repository
- Experimental changes not yet validated

### Announce
"I'm using cross-repo-sync to propagate [change] from [source-repo] to [target-repos]. I'll create sync branches, apply changes, create PRs, and validate with CI."

## What to Sync

### 1. Docker Image Versions

**Locations to check:**
- `Dockerfile` (FROM directives)
- `docker-compose.yml` / `docker-compose.yaml`
- `.github/workflows/*.yml` (service containers)
- CI configuration files

**Common images:**
- `node:*`
- `docker.elastic.co/elasticsearch/elasticsearch:*`
- `docker.elastic.co/kibana/kibana:*`
- `postgres:*`
- `redis:*`

**Example:**
```dockerfile
# FROM node:20.11.0 → FROM node:20.12.0
FROM node:20.12.0-alpine
```

### 2. NPM Dependencies

**Locations to check:**
- `package.json` (dependencies, devDependencies)
- `examples/*/package.json`
- `showcase/*/package.json`

**Critical packages:**
- `@elastic/elasticsearch`
- `typescript`
- `jest`, `playwright`, `vitest`
- `@swc/core`, `esbuild`, `vite`
- `eslint`, `prettier`

**Example:**
```json
{
  "dependencies": {
    "@elastic/elasticsearch": "^8.13.0"
  }
}
```

### 3. GitHub Actions Versions

**Locations to check:**
- `.github/workflows/*.yml`

**Common actions:**
- `actions/checkout@v*`
- `actions/setup-node@v*`
- `docker/setup-buildx-action@v*`

**Example:**
```yaml
- uses: actions/checkout@v4
- uses: actions/setup-node@v4
  with:
    node-version: '20'
```

### 4. Configuration Files

**Locations to check:**
- `.nvmrc` / `.node-version`
- `tsconfig.json` (compiler options)
- `.eslintrc*` / `eslint.config.js`
- `.prettierrc*`

**Example:**
```
# .nvmrc
20.12.0
```

## Sync Workflow

### Step 1: Detect Version Change

**From current git status:**
```bash
# Get changed files in current commit/branch
CHANGED_FILES=$(git diff --name-only HEAD~1)

# Categorize by type
echo "$CHANGED_FILES" | grep -E "Dockerfile|docker-compose" && echo "Docker changes detected"
echo "$CHANGED_FILES" | grep "package.json" && echo "NPM changes detected"
echo "$CHANGED_FILES" | grep ".github/workflows" && echo "CI config changes detected"
echo "$CHANGED_FILES" | grep -E "tsconfig.json|.eslintrc|.prettierrc" && echo "Config file changes detected"
```

**Extract version changes:**
```bash
# For Docker
git diff HEAD~1 Dockerfile | grep "^+FROM" | sed 's/^+FROM //'
# Output: node:20.12.0-alpine

# For npm
git diff HEAD~1 package.json | grep "^+.*\"@elastic/elasticsearch\"" | sed 's/.*: "//' | sed 's/".*//'
# Output: ^8.13.0

# For GitHub Actions
git diff HEAD~1 .github/workflows/*.yml | grep "^+.*uses:" | sed 's/.*uses: //'
# Output: actions/checkout@v4
```

### Step 2: Identify Sibling Repos

**Find repos:**
```bash
# Known sibling locations
REPO_ELASTIC_PLUGIN="$HOME/Projects/elastic-cursor-plugin"
REPO_CURSOR_EVALS="$HOME/Projects/cursor-plugin-evals"
REPO_SKILLS_SANDBOX="$HOME/Projects/agent-skills-sandbox"

# Verify existence
SIBLING_REPOS=()
[ -d "$REPO_ELASTIC_PLUGIN" ] && SIBLING_REPOS+=("$REPO_ELASTIC_PLUGIN")
[ -d "$REPO_CURSOR_EVALS" ] && SIBLING_REPOS+=("$REPO_CURSOR_EVALS")
[ -d "$REPO_SKILLS_SANDBOX" ] && SIBLING_REPOS+=("$REPO_SKILLS_SANDBOX")

# Get current repo
CURRENT_REPO=$(git rev-parse --show-toplevel)

# Filter out current repo
TARGETS=()
for repo in "${SIBLING_REPOS[@]}"; do
  [ "$repo" != "$CURRENT_REPO" ] && TARGETS+=("$repo")
done

echo "Syncing from: $(basename "$CURRENT_REPO")"
echo "Syncing to: ${TARGETS[@]}"
```

### Step 3: Check for Old Version in Siblings

**For each target repo:**
```bash
for TARGET_REPO in "${TARGETS[@]}"; do
  echo "Checking $TARGET_REPO for old version..."

  # Search for old version
  cd "$TARGET_REPO"

  # Docker example: search for old node version
  OLD_VERSION="node:20.11.0"
  NEW_VERSION="node:20.12.0"

  FOUND=$(rg "$OLD_VERSION" \
    --glob 'Dockerfile*' \
    --glob '*.yml' \
    --glob '*.yaml' \
    --glob '*.sh' \
    --type-not lock)

  if [ -n "$FOUND" ]; then
    echo "✓ Found old version in $TARGET_REPO"
    echo "$FOUND"
  else
    echo "✗ Old version not found - skipping $TARGET_REPO"
  fi
done
```

### Step 4: Create Sync Branch in Each Sibling

**Branch naming convention:**
```
sync/<package>-<version>
```

**Examples:**
- `sync/node-20.12.0`
- `sync/elasticsearch-8.13.0`
- `sync/actions-checkout-v4`
- `sync/typescript-5.4.5`

**Create branch:**
```bash
cd "$TARGET_REPO"

# Ensure clean state
git fetch origin
git checkout main
git pull origin main

# Create sync branch
PACKAGE="node"
VERSION="20.12.0"
BRANCH="sync/$PACKAGE-$VERSION"

git checkout -b "$BRANCH"
```

### Step 5: Apply Changes

**Pattern matching and replacement:**

#### Docker Images
```bash
# Find and replace in all relevant files
FILES=$(rg -l "$OLD_VERSION" \
  --glob 'Dockerfile*' \
  --glob '*.yml' \
  --glob '*.yaml' \
  --glob '*.sh' \
  --type-not lock)

for FILE in $FILES; do
  echo "Updating $FILE"
  sed -i '' "s|$OLD_VERSION|$NEW_VERSION|g" "$FILE"
done
```

#### NPM Dependencies
```bash
# Update package.json
PACKAGE="@elastic/elasticsearch"
OLD_VERSION="^8.12.0"
NEW_VERSION="^8.13.0"

# Use jq to update version
jq ".dependencies[\"$PACKAGE\"] = \"$NEW_VERSION\"" package.json > package.json.tmp
mv package.json.tmp package.json

# If in devDependencies
jq ".devDependencies[\"$PACKAGE\"] = \"$NEW_VERSION\"" package.json > package.json.tmp
mv package.json.tmp package.json

# Update lockfile
npm install  # or yarn install
```

#### GitHub Actions
```bash
# Find workflow files
FILES=$(rg -l "actions/checkout@v3" .github/workflows/)

for FILE in $FILES; do
  echo "Updating $FILE"
  sed -i '' "s|actions/checkout@v3|actions/checkout@v4|g" "$FILE"
done
```

#### Config Files
```bash
# .nvmrc
echo "20.12.0" > .nvmrc

# Node version in other files
sed -i '' "s|node-version: '20.11'|node-version: '20.12'|g" .github/workflows/*.yml
```

### Step 6: Commit Changes

**Commit message format:**
```bash
SOURCE_REPO=$(basename "$CURRENT_REPO")
TARGET_REPO=$(basename "$TARGET_REPO")

git add .
git commit -m "chore: sync $PACKAGE from $SOURCE_REPO

Syncs $PACKAGE version to $NEW_VERSION from $SOURCE_REPO.

Changes:
$(git diff --name-only HEAD~1 | sed 's/^/- /')

Source: $SOURCE_REPO
Sync branch: $BRANCH

Co-Authored-By: Claude Sonnet 4.5 (1M context) <noreply@anthropic.com>"
```

### Step 7: Push and Create PR

**Push branch:**
```bash
git push origin "$BRANCH"
```

**Create PR:**
```bash
# Get repo owner/name for gh CLI
OWNER_REPO=$(gh repo view --json nameWithOwner --jq '.nameWithOwner')

# Generate PR body
PR_BODY="## Sync: $PACKAGE $NEW_VERSION from $SOURCE_REPO

This PR syncs \`$PACKAGE\` version updates from \`$SOURCE_REPO\`.

### Changes
$(git diff origin/main --stat)

### Files Updated
$(git diff origin/main --name-only | sed 's/^/- `/' | sed 's/$/`/')

### Source
- **Source repo:** $SOURCE_REPO
- **Source branch:** $(cd "$CURRENT_REPO" && git branch --show-current)
- **Change type:** Version update

### Validation
- [ ] Docker builds successfully
- [ ] npm install completes
- [ ] CI passes
- [ ] No unexpected changes

### Related
Auto-generated by \`@cross-repo-sync\` skill.

---
🤖 Generated with [Claude Code](https://claude.com/claude-code)"

# Create PR
gh pr create \
  --title "chore: sync $PACKAGE $NEW_VERSION from $SOURCE_REPO" \
  --body "$PR_BODY" \
  --base main \
  --head "$BRANCH" \
  --repo "$OWNER_REPO"

# Capture PR number
PR_URL=$(gh pr view "$BRANCH" --json url --jq '.url')
echo "PR created: $PR_URL"
```

### Step 8: Validate with CI

**Trigger CI:**
```bash
# If draft PR (for repos that need /ci comment)
gh pr comment "$PR_URL" --body "/ci"

# Or mark ready for review to auto-trigger
gh pr ready "$PR_URL"
```

**Monitor CI status:**
```bash
# Poll for CI status
MAX_WAIT=600  # 10 minutes
WAIT_INTERVAL=30  # 30 seconds
ELAPSED=0

while [ $ELAPSED -lt $MAX_WAIT ]; do
  echo "Checking CI status... ($ELAPSED/$MAX_WAIT seconds)"

  # Get PR checks
  STATUS=$(gh pr checks "$BRANCH" --json state,conclusion --jq '.[].state')

  # Check if all completed
  if echo "$STATUS" | grep -q "COMPLETED"; then
    # Check if all passed
    CONCLUSION=$(gh pr checks "$BRANCH" --json conclusion --jq '.[].conclusion')

    if echo "$CONCLUSION" | grep -qv "SUCCESS"; then
      echo "❌ CI failed for $TARGET_REPO"
      gh pr checks "$BRANCH"
      break
    else
      echo "✅ CI passed for $TARGET_REPO"
      break
    fi
  fi

  sleep $WAIT_INTERVAL
  ELAPSED=$((ELAPSED + WAIT_INTERVAL))
done

if [ $ELAPSED -ge $MAX_WAIT ]; then
  echo "⚠️  CI timeout for $TARGET_REPO (still running after $MAX_WAIT seconds)"
fi
```

### Step 9: Report Status

**Summary format:**
```
Cross-Repo Sync Complete

Source: elastic-cursor-plugin
Change: node 20.11.0 → 20.12.0

Synced to:
✅ cursor-plugin-evals
   PR: https://github.com/org/cursor-plugin-evals/pull/123
   CI: Passed
   Files: 5 (Dockerfile, docker-compose.yml, 3 workflows)

✅ agent-skills-sandbox
   PR: https://github.com/org/agent-skills-sandbox/pull/45
   CI: Passed
   Files: 2 (Dockerfile, .nvmrc)

Next steps:
1. Review PRs for accuracy
2. Merge when CI is green
3. Monitor for any runtime issues
```

## Multi-Repo Sync Strategy

### Parallel vs Sequential

**Parallel (default):**
```bash
# Fork all syncs at once
for TARGET_REPO in "${TARGETS[@]}"; do
  (
    echo "Syncing to $TARGET_REPO..."
    # Steps 4-8 here
  ) &
done

# Wait for all to complete
wait

# Collect results
echo "All syncs complete"
```

**Sequential (if one depends on another):**
```bash
for TARGET_REPO in "${TARGETS[@]}"; do
  echo "Syncing to $TARGET_REPO..."
  # Steps 4-8 here

  # Wait for CI before next
  if [ "$WAIT_FOR_CI" = "true" ]; then
    # Poll CI status
  fi
done
```

### Handling Failures

**If PR creation fails:**
```bash
if [ $? -ne 0 ]; then
  echo "❌ Failed to create PR in $TARGET_REPO"
  echo "Possible reasons:"
  echo "  - Branch already exists"
  echo "  - No changes to commit"
  echo "  - Authentication issue"

  # Clean up branch
  git checkout main
  git branch -D "$BRANCH"

  continue  # Skip to next repo
fi
```

**If CI fails:**
```bash
if echo "$CONCLUSION" | grep -qv "SUCCESS"; then
  echo "❌ CI failed in $TARGET_REPO"
  echo "Investigating failures..."

  # Get failure details
  gh pr checks "$BRANCH" --json name,conclusion,detailsUrl

  echo ""
  echo "Action required:"
  echo "1. Review PR: $PR_URL"
  echo "2. Check CI logs: $(gh pr checks "$BRANCH" --json detailsUrl --jq '.[0].detailsUrl')"
  echo "3. Fix issues manually or use @ci-babysitter"

  # Don't block other repos
  continue
fi
```

## Version Detection Patterns

### Docker Images

**Pattern 1: FROM directive**
```bash
git diff HEAD~1 Dockerfile | grep "^+FROM" | awk '{print $2}'
# Output: node:20.12.0-alpine
```

**Pattern 2: Image in docker-compose**
```bash
git diff HEAD~1 docker-compose.yml | grep "^+.*image:" | sed 's/.*image: //'
# Output: docker.elastic.co/elasticsearch/elasticsearch:8.13.0
```

**Pattern 3: Service containers in CI**
```bash
git diff HEAD~1 .github/workflows/*.yml | grep -A 2 "^+.*image:" | grep "image:"
# Output: image: elasticsearch:8.13.0
```

### NPM Packages

**Pattern 1: Direct dependency change**
```bash
git diff HEAD~1 package.json | grep "^+.*\"@elastic" | sed 's/.*: "//' | sed 's/".*//'
# Output: ^8.13.0
```

**Pattern 2: Extract package name and version**
```bash
PACKAGE=$(git diff HEAD~1 package.json | grep "^+.*\"@elastic" | sed 's/.*"\(@[^"]*\)".*/\1/')
VERSION=$(git diff HEAD~1 package.json | grep "^+.*\"@elastic" | sed 's/.*: "\([^"]*\)".*/\1/')
echo "$PACKAGE@$VERSION"
# Output: @elastic/elasticsearch@^8.13.0
```

### GitHub Actions

**Pattern 1: Action version change**
```bash
git diff HEAD~1 .github/workflows/*.yml | grep "^+.*uses:" | sed 's/.*uses: //'
# Output: actions/checkout@v4
```

### Config Files

**Pattern 1: .nvmrc**
```bash
OLD_NODE=$(git show HEAD~1:.nvmrc)
NEW_NODE=$(cat .nvmrc)
echo "$OLD_NODE → $NEW_NODE"
# Output: 20.11.0 → 20.12.0
```

**Pattern 2: TypeScript config**
```bash
git diff HEAD~1 tsconfig.json | grep "^+.*\"target\""
# Output: +    "target": "ES2022",
```

## Handling Special Cases

### Renovate Updates

**When Renovate creates a PR:**
```bash
# Detect Renovate PR
PR_AUTHOR=$(gh pr view --json author --jq '.author.login')

if [ "$PR_AUTHOR" = "renovate[bot]" ]; then
  echo "Renovate PR detected"

  # Extract package and version from PR title
  # Example: "chore(deps): update dependency node to v20.12.0"
  PACKAGE=$(gh pr view --json title --jq '.title' | grep -oP 'update dependency \K[^ ]+')
  VERSION=$(gh pr view --json title --jq '.title' | grep -oP 'to v\K[^ ]+')

  echo "Auto-syncing $PACKAGE@$VERSION to sibling repos..."
fi
```

### Version Range Changes

**Handling semver ranges:**
```bash
# From: ^8.12.0
# To:   ^8.13.0

# Don't just string replace - respect semver
OLD_RANGE="^8.12.0"
NEW_RANGE="^8.13.0"

# Update with npm/yarn
npm install "@elastic/elasticsearch@$NEW_RANGE"
```

### Multi-File Changes

**Track all affected files:**
```bash
# Collect all files that need updates
AFFECTED_FILES=()

# Docker
AFFECTED_FILES+=($(rg -l "$OLD_VERSION" --glob 'Dockerfile*'))

# Docker Compose
AFFECTED_FILES+=($(rg -l "$OLD_VERSION" --glob '*docker-compose*.yml'))

# CI Workflows
AFFECTED_FILES+=($(rg -l "$OLD_VERSION" .github/workflows/))

# Scripts
AFFECTED_FILES+=($(rg -l "$OLD_VERSION" --glob '*.sh' scripts/))

echo "Files to update: ${#AFFECTED_FILES[@]}"
for FILE in "${AFFECTED_FILES[@]}"; do
  echo "  - $FILE"
done
```

## Validation Checklist

Before creating PR, verify:

**Docker Changes:**
- [ ] All `FROM` directives updated
- [ ] docker-compose service images updated
- [ ] CI workflow service containers updated
- [ ] Docker build scripts updated
- [ ] README/docs mention updated

**NPM Changes:**
- [ ] package.json updated
- [ ] package-lock.json regenerated
- [ ] No semver conflicts
- [ ] Peer dependencies compatible
- [ ] Example packages updated

**GitHub Actions:**
- [ ] All workflow files updated
- [ ] Action versions compatible
- [ ] No deprecated action warnings
- [ ] Permissions still correct

**Config Files:**
- [ ] .nvmrc / .node-version updated
- [ ] tsconfig.json compatible
- [ ] eslintrc compatible
- [ ] prettierrc compatible

**Verification Commands:**
```bash
# Docker
docker build -t test .

# NPM
npm install && npm test

# Type check
npx tsc --noEmit

# Lint
npm run lint

# CI workflows
actionlint .github/workflows/*.yml
```

## Example Sessions

### Example 1: Docker Node Version Update

```bash
User: "I just updated Node to 20.12.0 in elastic-cursor-plugin. Sync it to the other repos."

Claude: "I'm using cross-repo-sync to propagate node:20.12.0 from elastic-cursor-plugin.

Detected change: node:20.11.0 → node:20.12.0

Checking sibling repos...
✓ cursor-plugin-evals: Found 3 files with old version
✓ agent-skills-sandbox: Found 2 files with old version

Creating sync branches...
✓ cursor-plugin-evals: sync/node-20.12.0
✓ agent-skills-sandbox: sync/node-20.12.0

Applying changes...
✓ cursor-plugin-evals: Updated 3 files
✓ agent-skills-sandbox: Updated 2 files

Creating PRs...
✓ cursor-plugin-evals: https://github.com/org/cursor-plugin-evals/pull/123
✓ agent-skills-sandbox: https://github.com/org/agent-skills-sandbox/pull/45

Validating with CI...
⏳ cursor-plugin-evals: CI running...
⏳ agent-skills-sandbox: CI running...

[2 minutes later]

✅ cursor-plugin-evals: CI passed
✅ agent-skills-sandbox: CI passed

Sync complete. All PRs ready for review."
```

### Example 2: Elasticsearch Version Update

```bash
User: "sync elasticsearch 8.13.0 to cursor-plugin-evals"

Claude: "I'm using cross-repo-sync to propagate elasticsearch:8.13.0.

Current repo: elastic-cursor-plugin
Target repo: cursor-plugin-evals

Checking for old version...
✓ Found elasticsearch:8.12.0 in 5 files:
  - docker-compose.yml
  - docker-compose.lite.yml
  - .github/workflows/eval.yml
  - showcase/elastic-cursor-plugin/docker-compose.yml
  - README.md

Creating sync branch...
✓ Branch: sync/elasticsearch-8.13.0

Applying changes...
✓ Updated 5 files

Committing...
✓ Commit: chore: sync elasticsearch from elastic-cursor-plugin

Pushing and creating PR...
✓ PR: https://github.com/org/cursor-plugin-evals/pull/124

Triggering CI...
✓ CI started

⏳ Waiting for CI (max 10 minutes)...

[5 minutes later]

✅ CI passed

Sync complete. PR ready for review."
```

### Example 3: Multi-Package NPM Update

```bash
User: "I updated TypeScript to 5.4.5 and @swc/core to 1.5.0. Sync to all repos."

Claude: "I'm using cross-repo-sync to propagate multiple npm package updates.

Changes detected:
- typescript: 5.4.2 → 5.4.5
- @swc/core: 1.4.17 → 1.5.0

Syncing from: elastic-cursor-plugin
Syncing to: cursor-plugin-evals, agent-skills-sandbox

[cursor-plugin-evals]
✓ Found old versions in package.json
✓ Branch: sync/typescript-5.4.5-swc-1.5.0
✓ Updated package.json
✓ Regenerated package-lock.json
✓ Committed and pushed
✓ PR: https://github.com/org/cursor-plugin-evals/pull/125
⏳ CI running...

[agent-skills-sandbox]
✓ Found old versions in package.json
✓ Branch: sync/typescript-5.4.5-swc-1.5.0
✓ Updated package.json
✓ Regenerated package-lock.json
✓ Committed and pushed
✓ PR: https://github.com/org/agent-skills-sandbox/pull/46
⏳ CI running...

[3 minutes later]

✅ cursor-plugin-evals: CI passed
✅ agent-skills-sandbox: CI passed

All syncs complete. 2 PRs ready for review."
```

### Example 4: GitHub Actions Update

```bash
User: "sync actions/checkout@v4 to all repos"

Claude: "I'm using cross-repo-sync to propagate actions/checkout@v4.

Checking all repos for actions/checkout@v3...

[elastic-cursor-plugin]
✓ Current repo - no changes needed

[cursor-plugin-evals]
✓ Found actions/checkout@v3 in 3 workflows
✓ Branch: sync/actions-checkout-v4
✓ Updated .github/workflows/eval.yml
✓ Updated .github/workflows/test.yml
✓ Updated .github/workflows/release.yml
✓ PR: https://github.com/org/cursor-plugin-evals/pull/126

[agent-skills-sandbox]
✗ Already using actions/checkout@v4 - skipped

CI validation...
✅ cursor-plugin-evals: All workflows validated

Sync complete. 1 PR created."
```

## Anti-Patterns (Don't Do This)

❌ **Sync without checking old version** → May create unnecessary PRs

❌ **Force-push to main** → Always create PRs for review

❌ **Skip CI validation** → Could break sibling repos

❌ **Batch unrelated changes** → Keep syncs focused (one version per PR)

❌ **Manual version edits** → Use tools (npm install, sed, jq)

❌ **Ignore CI failures** → Don't merge until green

❌ **Sync incomplete updates** → Check all file types (Dockerfile, compose, CI, scripts)

❌ **Forget package-lock.json** → Always regenerate after npm changes

## Integration with Other Skills

### Use with @check-cross-repo-consistency

**Before sync:**
```bash
# Check current drift
/check-cross-repo-consistency

# Then sync specific drifts
/cross-repo-sync docker node:20.12.0
```

### Use with @ci-babysitter

**If CI fails after sync:**
```bash
# Auto-fix CI failures
/ci-babysitter --pr <sync-pr-number>
```

### Use with Renovate

**Hook for auto-sync:**
```yaml
# .github/renovate.json
{
  "postUpgradeTasks": {
    "commands": [
      "claude /cross-repo-sync"
    ]
  }
}
```

## Dependencies

- **git** - For branch and commit operations
- **gh CLI** - For PR creation and CI monitoring
- **jq** - For JSON parsing (npm package.json)
- **ripgrep (rg)** - For fast version searching
- **sed** - For file content replacement
- **npm/yarn** - For package.json updates

## Future Enhancements

- Auto-merge PRs when CI passes (opt-in)
- Batch multiple version changes into one PR
- Detect breaking changes and flag for manual review
- Integration with Slack for sync notifications
- Dry-run mode to preview changes
- Rollback capability if sync introduces issues
- Version compatibility checker (semver validation)
