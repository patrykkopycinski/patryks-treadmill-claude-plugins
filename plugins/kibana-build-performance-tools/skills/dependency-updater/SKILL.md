---
name: dependency-updater
description: Review and manage dependency updates in Kibana by analyzing Renovate PRs, checking changelogs for breaking changes, batching merges, and monitoring security advisories.
---

# Dependency Updater Agent

## Description
Review and manage dependency updates in Kibana: analyze Renovate PRs, check changelogs for breaking changes, run tests locally, batch merge related updates, track update history, and monitor security advisories.

## Trigger Patterns
- "review renovate PR [number]"
- "check dependency update [package]"
- "batch merge renovate PRs"
- "analyze breaking changes in [package]"
- "track dependency updates"
- "check security advisories"
- "update [package] to [version]"

## Capabilities

### 1. Renovate PR Review
- Fetch PR details (package, version, changelog)
- Analyze breaking changes from changelog
- Check for known issues (GitHub, npm)
- Run tests locally
- Approve or request changes

### 2. Breaking Change Analysis
- Parse CHANGELOG.md / HISTORY.md
- Identify breaking changes in semver range
- Check migration guides
- Assess impact on Kibana code

### 3. Batch Updates
- Group related updates (ESLint plugins, Playwright, etc.)
- Merge non-breaking updates together
- Prioritize security updates
- Schedule breaking updates

### 4. Testing & Validation
- Run affected tests locally
- Check build output (bundle size)
- Validate types (TS version updates)
- Run Scout tests (Playwright updates)

### 5. Update Tracking
- Track update history (version timeline)
- Monitor update frequency
- Identify stuck dependencies
- Generate update reports

## Renovate PR Review Workflow

### Step 1: Fetch PR Details
```bash
# Get PR info
gh pr view <PR-number> --json title,body,labels,author

# Example output:
# {
#   "title": "Update dependency @playwright/test to v1.48.0",
#   "body": "This PR contains the following updates:\n\n| Package | Change |\n|---|---|\n| @playwright/test | 1.47.0 -> 1.48.0 |\n\n[Release notes](https://github.com/microsoft/playwright/releases/tag/v1.48.0)",
#   "labels": ["renovate", "dependencies"],
#   "author": "renovate[bot]"
# }

# Extract package and version
PACKAGE=$(gh pr view <PR-number> --json body --jq '.body' | grep -o '@[^|]*' | head -1 | xargs)
VERSION=$(gh pr view <PR-number> --json body --jq '.body' | grep -o '[0-9]\+\.[0-9]\+\.[0-9]\+' | tail -1)

echo "Package: $PACKAGE"
echo "Version: $VERSION"
```

### Step 2: Analyze Changelog
```bash
# Fetch changelog from release notes
REPO=$(echo $PACKAGE | sed 's/@//' | sed 's/\// /g' | awk '{print $1"/"$2}')
gh release view v$VERSION --repo $REPO --json body

# Or fetch from GitHub
curl -s "https://raw.githubusercontent.com/$REPO/v$VERSION/CHANGELOG.md"

# Look for breaking changes
grep -i "breaking\|migration\|deprecated" CHANGELOG.md
```

**Breaking Change Indicators:**
- `BREAKING CHANGE:` prefix
- Major version bump (1.x.x → 2.x.x)
- `deprecated` or `removed` sections
- Migration guides in release notes
- API changes in upgrade notes

### Step 3: Check Known Issues
```bash
# Search GitHub issues for version
gh issue list --repo $REPO --search "v$VERSION is:open" --limit 20

# Check npm advisories
npm audit --package=$PACKAGE@$VERSION

# Check Snyk database
# https://security.snyk.io/package/npm/$PACKAGE
```

### Step 4: Run Tests Locally
```bash
# Checkout Renovate PR
gh pr checkout <PR-number>

# Install dependencies
yarn kbn bootstrap

# Run affected tests
# Example: Playwright update
yarn test:jest --config x-pack/test/scout/config/playwright.config.ts
node scripts/scout run-tests --config x-pack/test/scout_functional/apps/discover/config.ts

# Example: TypeScript update
yarn test:type_check

# Example: ESLint update
node scripts/eslint --fix $(git diff --name-only origin/main)

# Check bundle size (webpack updates)
node scripts/build_packages.js --package @kbn/optimizer
```

### Step 5: Approve or Request Changes
```bash
# If tests pass and no breaking changes
gh pr review <PR-number> --approve --body "LGTM. Tests pass locally."

# If tests fail or breaking changes found
gh pr review <PR-number> --request-changes --body "Breaking change detected: <details>"

# If needs more investigation
gh pr comment <PR-number> --body "Investigating impact on Scout tests. Will update."
```

## Breaking Change Analysis

### Semver Rules
| Change | Version | Breaking? | Example |
|--------|---------|-----------|---------|
| Major | X.0.0 | ✅ Yes | API removed, behavior changed |
| Minor | 0.X.0 | ❌ No | New features, backward compatible |
| Patch | 0.0.X | ❌ No | Bug fixes |

**Exception:** Pre-1.0 versions (0.x.x) can break on minor bump.

### Changelog Parsing
```typescript
interface BreakingChange {
  version: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  migrationGuide?: string;
}

function parseChangelog(changelog: string): BreakingChange[] {
  const changes: BreakingChange[] = [];

  // Look for breaking change sections
  const breakingRegex = /## ?\[?(\d+\.\d+\.\d+)\]?.*\n([\s\S]*?)(?=\n## ?\[?|$)/g;

  let match;
  while ((match = breakingRegex.exec(changelog)) !== null) {
    const [, version, content] = match;

    // Check for breaking indicators
    if (
      content.includes('BREAKING CHANGE') ||
      content.includes('Breaking change') ||
      content.includes('Migration guide')
    ) {
      changes.push({
        version,
        description: content.slice(0, 500),
        impact: assessImpact(content),
      });
    }
  }

  return changes;
}

function assessImpact(content: string): 'high' | 'medium' | 'low' {
  // High: API removed, types changed, behavior changed
  if (content.match(/removed|deleted|incompatible/i)) return 'high';

  // Medium: deprecated (still works), new required param
  if (content.match(/deprecated|required/i)) return 'medium';

  // Low: opt-in new behavior, new recommended approach
  return 'low';
}
```

### Example: Playwright Breaking Changes
```markdown
# @playwright/test 1.47.0 → 1.48.0

## Breaking Changes
### `test.use()` scope changed
**Impact:** High
**Description:** `test.use()` now applies to entire file, not just describe block.
**Migration:**
```ts
// Before (1.47)
test.describe('suite', () => {
  test.use({ viewport: { width: 1280, height: 720 } });
  test('test', async ({ page }) => { /* ... */ });
});

// After (1.48)
test.use({ viewport: { width: 1280, height: 720 } });
test.describe('suite', () => {
  test('test', async ({ page }) => { /* ... */ });
});
```

**Kibana Impact:**
- 15 Scout test files use `test.use()` in describe blocks
- Requires moving `test.use()` to file level
- Low risk: Tests still pass, just different scope
```

## Batch Updates Strategy

### Grouping Rules
```typescript
interface UpdateGroup {
  category: string;
  packages: string[];
  strategy: 'merge' | 'separate' | 'delay';
}

const updateGroups: UpdateGroup[] = [
  // Safe to batch merge (no breaking changes expected)
  {
    category: 'ESLint plugins',
    packages: ['eslint-plugin-*', '@typescript-eslint/*'],
    strategy: 'merge',
  },
  {
    category: 'Testing libraries',
    packages: ['@testing-library/*', 'jest-*'],
    strategy: 'merge',
  },
  {
    category: 'Type definitions',
    packages: ['@types/*'],
    strategy: 'merge',
  },

  // Merge separately (potential breaking changes)
  {
    category: 'Playwright',
    packages: ['@playwright/test', 'playwright'],
    strategy: 'separate',
  },
  {
    category: 'TypeScript',
    packages: ['typescript'],
    strategy: 'separate',
  },

  // Delay (high risk)
  {
    category: 'React',
    packages: ['react', 'react-dom', '@types/react'],
    strategy: 'delay',
  },
];
```

### Batch Merge Process
```bash
# Find all open Renovate PRs
gh pr list --author renovate[bot] --state open --json number,title,labels

# Filter by category (example: ESLint plugins)
gh pr list --author renovate[bot] --state open --json number,title \
  | jq '.[] | select(.title | contains("eslint-plugin"))'

# Output:
# [
#   { "number": 12345, "title": "Update dependency eslint-plugin-react to v7.35.0" },
#   { "number": 12346, "title": "Update dependency eslint-plugin-import to v2.29.0" },
#   { "number": 12347, "title": "Update dependency @typescript-eslint/parser to v6.10.0" }
# ]

# Review each PR (automated)
for pr in 12345 12346 12347; do
  echo "Reviewing PR #$pr..."

  # Checkout PR
  gh pr checkout $pr

  # Run lint
  node scripts/eslint --fix $(git diff --name-only origin/main)

  # If lint passes, approve
  if [ $? -eq 0 ]; then
    gh pr review $pr --approve --body "Automated review: Lint passes"
    gh pr merge $pr --auto --squash
  else
    gh pr comment $pr --body "Lint errors detected. Manual review required."
  fi

  # Return to main
  git checkout main
done
```

## Security Advisory Monitoring

### Check for Advisories
```bash
# Run npm audit
npm audit --json > audit.json

# Parse vulnerabilities
jq '.vulnerabilities | to_entries[] | {
  package: .key,
  severity: .value.severity,
  via: .value.via,
  fixAvailable: .value.fixAvailable
}' audit.json

# Example output:
# {
#   "package": "axios",
#   "severity": "high",
#   "via": ["CVE-2023-45857"],
#   "fixAvailable": { "name": "axios", "version": "1.6.0" }
# }

# Check Snyk
# https://security.snyk.io/package/npm/axios

# Check GitHub Security Advisories
gh api /repos/axios/axios/security-advisories
```

### Priority Security Updates
```bash
# Find all security-related Renovate PRs
gh pr list --author renovate[bot] --state open --json number,title,labels \
  | jq '.[] | select(.labels[].name == "security")'

# Review immediately (high priority)
for pr in $(gh pr list --author renovate[bot] --label security --json number --jq '.[].number'); do
  echo "🚨 Security update: PR #$pr"
  gh pr view $pr --json title,body

  # Auto-merge if patch version (low risk)
  VERSION=$(gh pr view $pr --json title --jq '.title' | grep -o '[0-9]\+\.[0-9]\+\.[0-9]\+' | tail -1)
  if [[ $VERSION =~ ^[0-9]+\.[0-9]+\.[1-9][0-9]*$ ]]; then
    echo "Patch version detected. Auto-merging."
    gh pr review $pr --approve --body "Security patch. Auto-approved."
    gh pr merge $pr --auto --squash
  fi
done
```

## Update Tracking

### Version History
```bash
# Track version history for package
git log --oneline --grep="@playwright/test" --all

# Example output:
# abc123 Update dependency @playwright/test to v1.48.0
# def456 Update dependency @playwright/test to v1.47.0
# ghi789 Update dependency @playwright/test to v1.46.0

# Generate version timeline
cat > playwright-update-history.md <<EOF
# Playwright Update History

| Date | Version | PR | Breaking Changes |
|------|---------|----|--------------------|
| 2024-01-15 | 1.48.0 | #12345 | test.use() scope change |
| 2023-12-20 | 1.47.0 | #12000 | None |
| 2023-11-30 | 1.46.0 | #11800 | None |
EOF
```

### Update Frequency Analysis
```bash
# Count updates per package (last 6 months)
git log --since="6 months ago" --oneline --grep="Update dependency" --all \
  | sed 's/.*Update dependency \([^ ]*\).*/\1/' \
  | sort | uniq -c | sort -rn

# Example output:
# 12 @playwright/test
# 8 typescript
# 6 eslint
# 5 @elastic/eui

# Identify high-churn dependencies (update fatigue)
```

### Stuck Dependencies
```bash
# Find packages not updated in 6+ months
npm outdated --json | jq 'to_entries[] | select(.value.current != .value.latest) | {
  package: .key,
  current: .value.current,
  latest: .value.latest,
  age: .value.time
}'

# Check why stuck
# - Renovate config excluded package
# - Breaking changes in latest
# - Kibana code incompatible with latest
```

## Testing Strategies

### Test Selection by Package Type

| Package Type | Tests to Run |
|--------------|--------------|
| TypeScript | `yarn test:type_check` |
| ESLint plugins | `node scripts/eslint --fix` |
| Playwright | Scout tests, Playwright config validation |
| Jest | Jest unit tests, integration tests |
| Webpack | Build packages, check bundle size |
| React | Jest tests, type checks |

### Example: TypeScript Update
```bash
# Checkout Renovate PR
gh pr checkout <PR-number>

# Bootstrap
yarn kbn bootstrap

# Type check (scoped to affected packages)
yarn test:type_check --project x-pack/platform/packages/shared/kbn-scout/tsconfig.json

# If errors, check for breaking changes
# Common TS breaking changes:
# - Stricter null checks
# - Changed type inference
# - Removed utility types

# Fix errors
# Example: TS 5.0 requires explicit null checks
# Before: const x: string = getValue();
# After: const x: string = getValue() ?? '';

# Re-run type check
yarn test:type_check --project x-pack/platform/packages/shared/kbn-scout/tsconfig.json

# If pass, approve PR
gh pr review <PR-number> --approve --body "Type checks pass. No breaking changes."
```

### Example: Playwright Update
```bash
# Checkout Renovate PR
gh pr checkout <PR-number>

# Bootstrap
yarn kbn bootstrap

# Run Scout tests (sample)
node scripts/scout run-tests \
  --config x-pack/test/scout_functional/apps/discover/config.ts \
  --testFiles x-pack/test/scout_functional/apps/discover/context_awareness/_root_profile.ts

# Check Playwright config
cat x-pack/test/scout/config/playwright.config.ts

# If breaking changes in Playwright (e.g., test.use() scope)
# Update affected tests
find x-pack/test/scout_functional -name "*.ts" -exec grep -l "test.use" {} \;

# Fix each file
# Move test.use() to file level

# Re-run tests
node scripts/scout run-tests --config <config>

# If pass, approve PR
gh pr review <PR-number> --approve --body "Scout tests pass. Updated test.use() scope."
```

## Renovate Configuration

### Kibana Renovate Config
```json5
// renovate.json
{
  "extends": ["config:base"],
  "packageRules": [
    {
      // Group ESLint plugins
      "matchPackagePatterns": ["^eslint-plugin-", "^@typescript-eslint/"],
      "groupName": "ESLint plugins"
    },
    {
      // Separate Playwright (breaking changes common)
      "matchPackageNames": ["@playwright/test", "playwright"],
      "groupName": "Playwright"
    },
    {
      // Delay React updates (high risk)
      "matchPackageNames": ["react", "react-dom", "@types/react"],
      "enabled": false
    },
    {
      // Auto-merge security patches
      "matchUpdateTypes": ["patch"],
      "matchDepTypes": ["dependencies"],
      "automerge": true,
      "automergeType": "pr",
      "labels": ["auto-merge"]
    }
  ],
  "schedule": ["before 3am on Monday"],
  "timezone": "America/New_York"
}
```

### Custom Renovate Rules
```bash
# Exclude package from updates
# Add to renovate.json:
{
  "packageRules": [
    {
      "matchPackageNames": ["legacy-package"],
      "enabled": false
    }
  ]
}

# Pin package to version
# Add to package.json:
"dependencies": {
  "pinned-package": "1.2.3"  // No ^ or ~
}
```

## Integration with Other Skills

### With `@buildkite-ci-debugger`
```bash
# Debug CI failure after dependency update
gh pr checkout <renovate-PR>
# CI fails
@buildkite-ci-debugger --build <url>

# If CI red due to dependency update:
# - Check for breaking changes in updated package
# - Revert update temporarily
# - File issue for investigation
```

### With `@migration-planner`
```bash
# Plan migration for major version bump
# Example: React 17 → 18
@migration-planner analyze scope of React 18 migration

# Output: Migration plan with phases, risks, timeline
```

### With `@test-data-builder`
```bash
# Update test data after dependency changes types
# Example: TypeScript 5.0 stricter null checks
@test-data-builder regenerate mocks for updated types
```

## Examples

### Example 1: Review Playwright Renovate PR
**User:** "review renovate PR #12345 for Playwright update"

**Agent Actions:**
```bash
# 1. Fetch PR details
gh pr view 12345 --json title,body

# Title: Update dependency @playwright/test to v1.48.0
# Body: [Release notes](https://github.com/microsoft/playwright/releases/tag/v1.48.0)

# 2. Fetch changelog
gh release view v1.48.0 --repo microsoft/playwright --json body

# Breaking change: test.use() scope change

# 3. Checkout PR
gh pr checkout 12345

# 4. Run Scout tests
node scripts/scout run-tests --config x-pack/test/scout_functional/apps/discover/config.ts

# 5. Tests fail due to test.use() scope
# Fix affected files (move test.use() to file level)

# 6. Re-run tests
# Tests pass

# 7. Approve PR
gh pr review 12345 --approve --body "Scout tests pass. Updated test.use() scope per Playwright 1.48.0 breaking change."
```

**Output:** PR approved with breaking change fix.

### Example 2: Batch Merge ESLint Updates
**User:** "batch merge renovate PRs for ESLint plugins"

**Agent Actions:**
```bash
# 1. Find ESLint-related PRs
gh pr list --author renovate[bot] --state open --json number,title \
  | jq '.[] | select(.title | contains("eslint"))'

# Found: #12345, #12346, #12347

# 2. Review each PR
for pr in 12345 12346 12347; do
  gh pr checkout $pr
  node scripts/eslint --fix $(git diff --name-only origin/main)

  if [ $? -eq 0 ]; then
    gh pr review $pr --approve --body "Automated review: Lint passes"
    gh pr merge $pr --auto --squash
  fi
done
```

**Output:** 3 PRs merged automatically.

### Example 3: Prioritize Security Update
**User:** "check security advisories for Kibana dependencies"

**Agent Actions:**
```bash
# 1. Run npm audit
npm audit --json > audit.json

# 2. Parse high/critical vulnerabilities
jq '.vulnerabilities | to_entries[] | select(.value.severity == "high" or .value.severity == "critical")' audit.json

# Found: axios has CVE-2023-45857 (high)

# 3. Find Renovate PR for axios
gh pr list --author renovate[bot] --search "axios" --json number,title

# Found: PR #12350

# 4. Review immediately
gh pr checkout 12350
yarn kbn bootstrap
yarn test:jest x-pack/platform/packages/shared/kbn-axios

# Tests pass

# 5. Approve and merge
gh pr review 12350 --approve --body "Security patch for CVE-2023-45857. Tests pass."
gh pr merge 12350 --auto --squash
```

**Output:** Security vulnerability patched within 30 minutes.

### Example 4: Track TypeScript Update History
**User:** "track dependency updates for TypeScript"

**Agent Actions:**
```bash
# 1. Find all TypeScript updates
git log --oneline --grep="typescript" --all | head -20

# 2. Parse versions
git log --oneline --grep="typescript" --all \
  | sed 's/.*Update.*typescript.*to.*\([0-9]\+\.[0-9]\+\.[0-9]\+\).*/\1/' \
  | head -10

# 3. Generate report
cat > typescript-update-history.md <<EOF
# TypeScript Update History

| Date | Version | PR | Breaking Changes | Notes |
|------|---------|----|--------------------|-------|
| 2024-01-15 | 5.3.0 | #12345 | Stricter null checks | 15 type errors fixed |
| 2023-12-01 | 5.2.0 | #12000 | None | Clean upgrade |
| 2023-10-20 | 5.1.0 | #11800 | Changed inference | 8 type errors |
| 2023-09-15 | 5.0.0 | #11600 | Major rewrite | 50+ type errors |

## Trends
- Update frequency: ~1.5 months
- Breaking changes: 50% of updates
- Avg fix time: 2-3 days
EOF
```

**Output:** Historical report with trends.

## Best Practices

### Review Process
- ✅ Check changelog for breaking changes
- ✅ Run affected tests locally
- ✅ Approve patch versions quickly (low risk)
- ✅ Investigate major versions carefully (high risk)
- ❌ Don't auto-merge without testing
- ❌ Don't ignore security updates

### Batch Merging
- ✅ Group by category (ESLint, testing, types)
- ✅ Merge low-risk updates together
- ✅ Test each group before merging
- ❌ Don't batch high-risk updates
- ❌ Don't merge if any tests fail

### Security Updates
- ✅ Prioritize high/critical vulnerabilities
- ✅ Review CVE details
- ✅ Test patch before merging
- ✅ Merge ASAP (within 24 hours)
- ❌ Don't delay security patches
- ❌ Don't skip testing (regressions possible)

## Anti-Patterns

### ❌ Don't Do This
- Auto-merge all Renovate PRs (risky)
- Ignore breaking changes in major bumps
- Skip testing (assume tests pass in CI)
- Delay security updates (exploit risk)
- Merge without checking changelog

### ✅ Do This Instead
- Review each PR (or group by category)
- Check changelog for BREAKING sections
- Run affected tests locally
- Merge security patches immediately
- Read release notes before approving

## Notes
- Renovate runs on schedule (see renovate.json)
- Security patches auto-merge if configured
- Major version bumps require manual review
- Test locally before approving (CI can be flaky)
- Track update history for problematic packages
