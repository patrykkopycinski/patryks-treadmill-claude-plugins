---
name: ci-babysitter
description: Pre-push validation guard + continuous PR CI monitoring. Two modes - (1) GUARD mode runs pre-flight checks before push to prevent failures, auto-comments /ci on draft PRs. (2) BABYSIT mode continuously monitors CI, debugs failures, fixes issues, handles PR comments until green. Use for "guard my push", "babysit my PR", "watch CI", "fix CI automatically", "validate before push", or continuous PR maintenance. Requires buildkite-ci-debugger skill and Buildkite MCP server.
---

# CI Babysitter (Enhanced with Guardian Mode)

**Mission:** Prevent CI failures before push (GUARD mode) and fix them after push (BABYSIT mode). Two-phase approach ensures quality gates before commit and automated recovery when failures occur.

## Modes Overview

### 🛡️ GUARD Mode (Pre-Push Prevention)
**Purpose:** Run pre-flight checks before pushing to prevent CI failures

**Triggers:**
- "guard my push"
- "validate before push"
- "check before pushing"
- "pre-push validation"
- Before any `git push` to feature branch (optional hook)

**What it does:**
1. Runs pre-flight checks (scoped type check, eslint, unit tests)
2. Reports issues found
3. Offers to fix automatically or abort push
4. After successful push to draft PR: auto-comments `/ci`

### 🔄 BABYSIT Mode (Post-Push Recovery)
**Purpose:** Continuously monitor and fix CI failures after push

**Triggers:**
- "babysit my PR"
- "watch CI for me"
- "keep fixing CI until green"
- "monitor the build automatically"

**What it does:**
1. Monitors PR CI status every 5 minutes
2. Debugs failures using buildkite-ci-debugger
3. Auto-fixes issues (ESLint, types, tests, conflicts)
4. Handles bot/human PR comments
5. Stops when CI goes green

## When to Use This Skill

### GUARD Mode Triggers
- "guard my push"
- "validate before push"
- "check before pushing"
- "pre-push checks"
- "is this safe to push"

### BABYSIT Mode Triggers
- "babysit my PR"
- "watch CI for me"
- "keep fixing CI until green"
- "monitor the build automatically"
- "handle PR comments and CI"
- "keep the PR maintained"

**Don't use for:**
- One-time CI debugging (use `buildkite-ci-debugger` instead)
- Manual investigation (user wants to see logs themselves)
- PRs that are blocked on design decisions

**Announce:**
- GUARD: "I'm using ci-babysitter GUARD mode to validate your changes before push."
- BABYSIT: "I'm using ci-babysitter BABYSIT mode to monitor PR #XXXX until CI goes green."

## Prerequisites

### For GUARD Mode
- ✅ Git branch with uncommitted or unpushed changes
- ✅ Access to validation commands (type check, eslint, jest)

### For BABYSIT Mode
- ✅ `buildkite-ci-debugger` skill available
- ✅ Buildkite MCP server: `user-buildkite-read-only-toolsets`
- ✅ Current git worktree pointing to the PR branch
- ✅ PR already created and pushed

---

## 🛡️ GUARD Mode: Pre-Push Validation

### Purpose
Catch issues **before** they hit CI, preventing wasted cycles and faster time-to-green.

### Guard Workflow

```
┌──────────────────────────────────────────┐
│  1. Identify Changed Files               │
│  2. Run Pre-Flight Checks                │
│     ├─ Scoped Type Check (changed pkgs)  │
│     ├─ ESLint (changed files only)       │
│     └─ Unit Tests (affected tests)       │
│  3. Issues Found?                        │
│     ├─ YES → Auto-Fix All Issues         │
│     │         └─ Verify Fixes            │
│     │             ├─ Success → Commit    │
│     │             └─ Failed → Abort      │
│     └─ NO → Safe to Push ✓               │
│  4. Push Changes                         │
│  5. After Push (if draft PR)             │
│     └─ Auto-comment /ci                  │
│  6. Offer BABYSIT Mode Transition        │
└──────────────────────────────────────────┘
```

### Step 1: Detect Changed Files

```bash
# Get all changed files vs main
CHANGED_FILES=$(git diff --name-only origin/main)

# Categorize by type
TS_FILES=$(echo "$CHANGED_FILES" | grep -E '\.(ts|tsx)$')
TEST_FILES=$(echo "$CHANGED_FILES" | grep -E '\.(test|spec)\.(ts|tsx)$')
```

### Step 2: Run Pre-Flight Checks

#### 2a. Scoped Type Check

```bash
# Find affected tsconfig.json files
for file in $TS_FILES; do
  # Walk up directory tree to find tsconfig
  TSCONFIG=$(find $(dirname $file) -name "tsconfig.json" | head -1)

  # Run scoped type check
  echo "Type checking: $TSCONFIG"
  yarn test:type_check --project "$TSCONFIG"
done
```

#### 2b. ESLint (Changed Files Only)

```bash
# Lint only changed files
node scripts/eslint $(git diff --name-only origin/main)

# Capture exit code
ESLINT_STATUS=$?
```

#### 2c. Unit Tests (Affected Tests)

```bash
# Run tests for changed test files
if [ -n "$TEST_FILES" ]; then
  for test in $TEST_FILES; do
    echo "Running: $test"
    yarn test:jest "$test"
  done
fi
```

### Step 3: Auto-Fix All Issues

**If all checks pass:**
```
✅ GUARD MODE: All pre-flight checks passed!

Checks run:
- Type check: ✓ (3 packages)
- ESLint: ✓ (12 files)
- Unit tests: ✓ (8 tests)

Pushing to remote...
```

**If issues found:**
```
⚠️  GUARD MODE: Issues detected - auto-fixing...

Type errors: 2
  - src/plugins/foo/index.ts:42 - Type 'string' is not assignable to type 'number'
  - src/plugins/bar/utils.ts:18 - Property 'baz' does not exist

ESLint errors: 5
  - Running eslint --fix...

Unit test failures: 1
  - src/plugins/foo/foo.test.ts - Expected true, got false

Fixing all issues automatically...
```

### Step 4: Execute Fixes

```bash
# Priority 1: Auto-fix ESLint (always succeeds)
echo "Fixing ESLint errors..."
node scripts/eslint --fix $(git diff --name-only origin/main)
git add .

# Priority 2: Fix type errors
echo "Fixing type errors..."
# Read error context from type check output
# Fix issues: add types, fix mismatches, update interfaces
# Verify fix
yarn test:type_check --project <tsconfig>

# Priority 3: Fix test failures
echo "Fixing test failures..."
# Read failing test and code under test
# Fix test OR fix code (prefer fixing code if test is valid)
# Verify fix
yarn test:jest <test-file>

# Commit all fixes in single commit
git commit -m "fix(ci): pre-push validation auto-fixes

- ESLint: auto-fixed in <N> files
- Type errors: resolved in <files>
- Test failures: fixed <issue>

Applied by ci-babysitter GUARD mode

Co-Authored-By: Claude Sonnet 4.5 (1M context) <noreply@anthropic.com>"

# Re-run validation to confirm all fixed
echo "Verifying fixes..."
yarn test:type_check --project <tsconfig>
node scripts/eslint $(git diff --name-only origin/main)
yarn test:jest <test-files>

# If verification passes, push
echo "✓ All fixes verified. Pushing..."
git push origin $(git branch --show-current)

# If verification fails, abort and escalate
if [ $? -ne 0 ]; then
  echo "❌ GUARD MODE: Could not fix all issues automatically"
  echo "Manual intervention required. Aborting push."
  exit 1
fi
```

**Escalation (if auto-fix fails):**
```
❌ GUARD MODE: Auto-fix failed

Could not automatically resolve:
- <issue type>: <description>

Manual investigation required. Push aborted.

Recommendation: Review the issue manually or run in debug mode.
```

### Step 5: Auto-Trigger CI on Draft PRs

```bash
# Check if PR exists and is draft
PR=$(gh pr list --head "$(git branch --show-current)" --json number,isDraft --jq '.[0]')
PR_NUMBER=$(echo "$PR" | jq -r '.number')
IS_DRAFT=$(echo "$PR" | jq -r '.isDraft')

# If draft PR, trigger CI automatically
if [ "$IS_DRAFT" = "true" ]; then
  echo "Draft PR detected. Auto-commenting /ci..."
  gh pr comment "$PR_NUMBER" --repo elastic/kibana --body "/ci"
  echo "✓ CI triggered for draft PR #$PR_NUMBER"
fi
```

### Step 6: Transition to BABYSIT Mode (Optional)

```
GUARD mode complete. CI triggered.

Would you like me to switch to BABYSIT mode and monitor this PR until green?
Options:
1. Yes - Start monitoring (recommended)
2. No - I'll handle it manually
```

---

---

## 📊 Quick Reference: GUARD vs BABYSIT

| Aspect | 🛡️ GUARD Mode | 🔄 BABYSIT Mode |
|--------|---------------|-----------------|
| **When** | Before push | After push |
| **Purpose** | Prevent CI failures | Fix CI failures |
| **Checks** | Type check, ESLint, unit tests | Full Buildkite pipeline |
| **Scope** | Changed files only (fast) | Entire build (comprehensive) |
| **Fix Strategy** | Fix before push | Fix and re-push in loop |
| **Duration** | 2-5 minutes (one-shot) | 5-60 minutes (until green) |
| **Auto `/ci`** | Yes (draft PRs) | Yes (after fixes) |

---

## 🔄 BABYSIT Mode: Core Loop

```
┌─────────────────────────────────────┐
│  1. Check PR/Build Status (5min)    │
│  2. CI Green? → STOP (Success!)     │
│  3. CI Failed? → Debug All Failures │
│  4. Has PR Comments? → Handle Them  │
│  5. Fix All Issues (Dry-run first)  │
│  6. Commit + Push + Trigger CI      │
│  7. Wait 5min → Repeat              │
└─────────────────────────────────────┘
```

## Initialization

### Step 1: Identify the PR

```bash
# Get current branch
BRANCH=$(git branch --show-current)

# Find PR number
PR=$(gh pr list --repo elastic/kibana --head "$BRANCH" --json number --jq '.[0].number')

# Get PR details
gh pr view $PR --repo elastic/kibana --json title,url,isDraft,mergeable
```

### Step 2: Initial dry-run

Before starting the loop, announce:
```
Starting CI babysitter for PR #$PR
Branch: $BRANCH
Mode: DRY-RUN first, then auto-fix
Polling interval: 5 minutes
Will stop when: CI goes green

Checking initial status...
```

### Step 3: Set iteration limit

```bash
MAX_ITERATIONS=20  # Stop after 20 failed fix attempts
ITERATION=0
```

## Main Loop: Every 5 Minutes

### Phase 1: Check CI Status

```bash
# Check PR checks
gh pr checks $PR --repo elastic/kibana --json name,status,conclusion

# Parse status
# - If all passing → STOP (success!)
# - If any failing → proceed to Phase 2
# - If pending → wait and check again
```

### Phase 2: Check for PR Comments/Warnings

```bash
# Get PR reviews and comments
gh pr view $PR --repo elastic/kibana --json comments,reviews

# Categorize:
# - Bot/check comments (auto-address)
# - Human comments (ask for confirmation)
# - Warnings from GitHub checks
```

**Handling bot comments:**
- Parse comment body for actionable items
- Common patterns: "eslint errors found", "type check failed", "missing tests"
- Extract specific files/issues mentioned
- Add to fix list

**Handling human comments:**
- Parse for requests (e.g., "please update docs", "add test for X")
- Ask user: "I found N review comments from humans. Should I address them now or focus on CI first?"
- If approved, add to fix list
- If major change requested, ask for specific approval

### Phase 3: Debug Buildkite Failures

If CI is failing, use the `buildkite-ci-debugger` workflow:

#### 3a. Get build details

```bash
# Extract Buildkite build URL from PR checks
BUILD_URL=$(gh pr checks $PR --json detailsUrl --jq '.[] | select(.name | contains("kibana")) | .detailsUrl' | head -1)

# Parse org/pipeline/build from URL
# https://buildkite.com/<ORG>/<PIPELINE>/builds/<BUILD>
```

#### 3b. Pull ALL failure logs

Use Buildkite MCP tools (same as buildkite-ci-debugger):

```json
CallMcpTool: user-buildkite-read-only-toolsets / get_build
{ "org_slug": "elastic", "pipeline_slug": "kibana-pull-request", "build_number": "<BUILD>" }
```

Then for each failed job, use `search_logs` + `tail_logs` to get full context.

**Critical:** Pull logs from ALL failed jobs before attempting any fixes.

#### 3c. Categorize failures

Group by root cause:

| Category | Detection Pattern | Fix Strategy |
|----------|-------------------|--------------|
| ESLint | `eslint.*error` | `node scripts/eslint --fix` |
| Type errors | `error TS\d+` | Fix type issues in code |
| Test failures | `Error:.*failed\|Timeout` | Fix test or code logic |
| Flaky tests | Same test fails intermittently | Refactor test or fix race condition |
| Merge conflicts | `CONFLICT\|merge conflict` | Auto-resolve or rebase |
| Infrastructure | `-1\|agent lost\|OOM` | Wait for retry or skip |

### Phase 4: Dry-Run Fixes

On **first iteration only**, perform dry-run:

```bash
echo "=== DRY-RUN MODE ==="
echo "Issues found:"
for issue in "${ISSUES[@]}"; do
  echo "  - $issue"
done
echo ""
echo "Proposed fixes:"
for fix in "${FIXES[@]}"; do
  echo "  - $fix"
done
echo ""
echo "Proceeding with actual fixes..."
```

### Phase 5: Execute Fixes

#### Priority 1: Quick wins (lint/formatting)

```bash
# Auto-fix ESLint
node scripts/eslint --fix $(git diff --name-only)

# If changes made:
git add .
git commit -m "fix(ci): auto-fix eslint errors

Co-Authored-By: Claude Sonnet 4.5 (1M context) <noreply@anthropic.com>"
```

#### Priority 2: Type errors

- Read failing files
- Fix type issues
- Verify with local type-check
- Commit with clear message

#### Priority 3: Test failures

- Read failing test
- Understand root cause
- Fix test OR fix code (prefer fixing code if test is valid)
- For flaky tests: Refactor to eliminate race conditions
- Verify locally when possible
- Commit with explanation

#### Priority 4: Merge conflicts

```bash
# Fetch latest main
git fetch origin main

# Attempt auto-rebase
git rebase origin/main

# If conflicts: resolve automatically using ours/theirs strategy when safe
# If complex: report to user
```

#### Priority 5: Infrastructure

- For `-1` (agent lost): Wait for Buildkite auto-retry (don't fix)
- For full run failure: Retry once by commenting `/ci`
- For OOM: Report to user (may need build config changes)

### Phase 6: Push and Re-trigger

```bash
# Push all fixes
git push origin $BRANCH --force-with-lease

# If draft PR, trigger CI
if [ "$IS_DRAFT" = "true" ]; then
  gh pr comment $PR --repo elastic/kibana --body "/ci"
fi

# Increment iteration counter
ITERATION=$((ITERATION + 1))

# Check iteration limit
if [ $ITERATION -ge $MAX_ITERATIONS ]; then
  echo "⚠️  Reached max iterations ($MAX_ITERATIONS). Manual intervention needed."
  exit 1
fi
```

### Phase 7: Wait and Repeat

```bash
echo "Waiting 5 minutes before next check..."
echo "Iteration $ITERATION/$MAX_ITERATIONS"
echo "Next check at: $(date -d '+5 minutes')"

sleep 300  # 5 minutes

# Loop back to Phase 1
```

## Safety Guards

### Iteration Limit

```bash
MAX_ITERATIONS=20  # Stop after 20 failed fix attempts
```

If reached, report:
```
⚠️  CI Babysitter stopped after 20 iterations.

Issues still present:
- [list remaining failures]

Manual intervention required. Possible reasons:
- Failures are environmental (not fixable in code)
- Complex logic error requiring design decisions
- Test infrastructure issues

Please investigate manually or request assistance.
```

### Dry-Run Mode

**First iteration:** Show proposed fixes, wait for user confirmation.

**Subsequent iterations:** Execute automatically (no approval needed).

### Major Change Detection

Detect major changes:
- Adding new files (>100 lines)
- Deleting files
- Changing API signatures
- Modifying database schemas
- Changing security policies

If detected, ask:
```
⚠️  Detected major change needed: [description]

This requires your approval. Proceed? (y/n)
```

### No Notification Policy

Per user request, babysitter works silently:
- ❌ No pre-fix notifications
- ❌ No approval required for pushing
- ✅ Only reports final status or when escalation needed

## Handling Specific Failure Types

### ESLint Failures

```bash
# Auto-fix
node scripts/eslint --fix $(git diff --name-only origin/main)

# Verify
node scripts/eslint $(git diff --name-only origin/main)

# Commit
git add .
git commit -m "fix(ci): resolve eslint errors

Auto-fixed by ci-babysitter

Co-Authored-By: Claude Sonnet 4.5 (1M context) <noreply@anthropic.com>"
```

### Type Errors

1. Read error messages from CI logs
2. Identify affected files
3. Read files and understand context
4. Fix type issues (add types, fix mismatches, update interfaces)
5. Verify locally: `yarn test:type_check --project <path>`
6. Commit with explanation

### Test Failures

**For unit tests:**
```bash
# Run locally to reproduce
yarn test:jest <test-file>

# If it passes locally → flaky test
#   → Refactor to eliminate race condition
#   → Add retries only as last resort
# If it fails locally → logic error
#   → Fix test or fix code (prefer fixing code)
```

**For Scout/Playwright tests:**
- Check for Locator errors (element not found)
- Check for timeouts (page load, action wait)
- Fix selectors if elements changed
- Increase timeouts if operations are legitimately slow
- Refactor tests to be more resilient

### Flaky Tests

**Root cause analysis:**
1. Check for timing dependencies (sleep, setTimeout)
2. Check for race conditions (async operations not awaited)
3. Check for test pollution (shared state)
4. Check for environmental dependencies (network, disk)

**Fix strategies (in order of preference):**
1. Fix the code to be deterministic
2. Fix the test to wait properly (use Scout waitFor patterns)
3. Add proper test isolation
4. As last resort: Add retry logic

**Never:** Just increase timeouts without understanding why

### Infrastructure Failures

**Agent lost (exit code -1):**
```bash
# Don't fix - wait for Buildkite auto-retry
echo "Agent lost detected. Waiting for Buildkite auto-retry..."
# Continue polling
```

**Whole run failed:**
```bash
# Retry once
gh pr comment $PR --repo elastic/kibana --body "/ci"
echo "Retriggered CI due to full run failure"
```

**OOM (out of memory):**
```bash
# Report to user
echo "⚠️  Out of memory failure detected. This may require build config changes."
echo "Consider:"
echo "  - Reducing test concurrency"
echo "  - Increasing node memory limits"
echo "  - Splitting large test files"
# Stop babysitting - needs manual intervention
exit 1
```

## Handling PR Comments

### From Automated Checks/Bots

**Common patterns:**
- "ESLint errors found" → Auto-fix with eslint
- "Type check failed" → Read and fix type errors
- "Missing tests" → Ask user for confirmation
- "Outdated snapshot" → Run snapshot update
- "Documentation outdated" → Update docs

**Action:** Address immediately without asking.

### From Human Reviewers

**Parse comment for:**
- Request type (change code, update docs, add test, clarify logic)
- Severity (blocking, suggestion, question)
- Complexity (simple, major change)

**Action:**
- Simple requests (fix typo, add comment) → Auto-fix
- Major changes (refactor logic, change approach) → Ask user:
  ```
  Review comment from @username:
  "[comment text]"

  This requires [description of change].
  Should I implement this? (y/n)
  ```

## Status Reporting

### Every Iteration

```
Iteration N/20
Status: [Checking | Fixing | Waiting for CI | Green ✓]
Last check: [timestamp]
Issues found: N
Fixes applied: N
Next check: [timestamp]
```

### On Success

```
✅ CI Babysitter: SUCCESS!

PR #$PR is now GREEN
- Iterations: N
- Fixes applied: N
- Time elapsed: Xh Ym

Build: [Buildkite URL]

The PR is ready for review/merge.
```

### On Escalation

```
⚠️  CI Babysitter: Manual intervention needed

After N iterations, these issues remain:
1. [Issue type]: [description]
   - Error: [error message]
   - Files: [affected files]
   - Attempted fixes: [what was tried]

2. [Next issue...]

Recommendation: [suggested next steps]
```

## Implementation Pattern

### Use existing buildkite-ci-debugger

Delegate to the existing skill for all Buildkite operations:

```
When CI fails:
1. Invoke buildkite-ci-debugger skill
2. Let it pull ALL logs and categorize failures
3. Extract root causes from its analysis
4. Implement fixes based on categories
```

### Polling loop structure

```typescript
async function babysitPR(prNumber: number) {
  let iteration = 0;
  const MAX_ITERATIONS = 20;
  let dryRunComplete = false;

  while (iteration < MAX_ITERATIONS) {
    iteration++;

    // Phase 1: Check status
    const { ciStatus, comments } = await checkPRStatus(prNumber);

    // Phase 2: Check for green
    if (ciStatus === 'passing') {
      reportSuccess(iteration);
      break;
    }

    // Phase 3: Collect all issues
    const issues = [];

    if (ciStatus === 'failing') {
      // Use buildkite-ci-debugger to get failures
      const ciIssues = await debugBuildkiteFailures();
      issues.push(...ciIssues);
    }

    if (comments.bot.length > 0) {
      issues.push(...comments.bot);
    }

    if (comments.human.length > 0) {
      // Ask for approval on human comments if major
      const approved = await checkWithUser(comments.human);
      if (approved) issues.push(...comments.human);
    }

    // Phase 4: Dry-run (first iteration only)
    if (!dryRunComplete) {
      showDryRun(issues);
      dryRunComplete = true;
    }

    // Phase 5: Execute all fixes
    const results = await executeAllFixes(issues);

    // Phase 6: Commit and push
    if (results.hasChanges) {
      await commitAndPush(results);
      await triggerCI(prNumber);
    }

    // Phase 7: Wait
    await sleep(5 * 60 * 1000);  // 5 minutes
  }

  if (iteration >= MAX_ITERATIONS) {
    reportEscalation();
  }
}
```

## Fix Execution Strategies

### ESLint Errors

```bash
# Detect
grep -i "eslint" <logs> && echo "ESLint errors detected"

# Fix
node scripts/eslint --fix $(git diff --name-only origin/main)

# Verify
node scripts/eslint $(git diff --name-only origin/main)

# Commit
git add .
git commit -m "fix(ci): auto-fix eslint errors

Detected by ci-babysitter during iteration $ITERATION

Co-Authored-By: Claude Sonnet 4.5 (1M context) <noreply@anthropic.com>"
```

### Type Errors

```bash
# Detect
grep "error TS" <logs>

# Extract file paths and error messages
# Read affected files
# Fix issues (add types, fix mismatches, update interfaces)

# Verify
yarn test:type_check --project <affected-tsconfig>

# Commit
git add .
git commit -m "fix(ci): resolve type errors in <files>

Fixed errors:
- <error 1>
- <error 2>

Detected by ci-babysitter

Co-Authored-By: Claude Sonnet 4.5 (1M context) <noreply@anthropic.com>"
```

### Test Failures (Non-Flaky)

```bash
# Detect
grep -E "FAILED|Error:.*test" <logs>

# For each failing test:
# 1. Read test file
# 2. Read code under test
# 3. Understand what broke
# 4. Fix test OR fix code (prefer fixing code if test is correct)

# Verify locally
yarn test:jest <test-file>

# Commit
git add .
git commit -m "fix(ci): resolve test failure in <test-name>

Root cause: <explanation>
Fix: <what was changed>

Detected by ci-babysitter

Co-Authored-By: Claude Sonnet 4.5 (1M context) <noreply@anthropic.com>"
```

### Flaky Tests

**Detection:**
- Same test fails on some CI runs, passes on others
- Test passes locally, fails in CI
- Test fails with timing-related errors

**Fix approach:**
1. Read test code
2. Identify timing dependencies:
   - `waitFor` with insufficient timeout
   - Missing `await` on async operations
   - Shared state between tests
   - Network/disk dependencies

3. Refactor test:
   ```typescript
   // Before (flaky):
   await page.click(selector);
   expect(await page.locator(result).isVisible()).toBe(true);

   // After (resilient):
   await page.click(selector);
   await page.waitFor(result, { state: 'visible', timeout: 30000 });
   expect(await page.locator(result).isVisible()).toBe(true);
   ```

4. If test is correct but code has race condition:
   - Fix the code to be deterministic
   - Add proper synchronization
   - Fix timing dependencies

5. Verify fix by running test multiple times:
   ```bash
   for i in {1..5}; do
     yarn test:jest <test-file> || echo "Failed on run $i"
   done
   ```

6. Commit with detailed explanation

**Never:** Add retries without understanding why test is flaky

### Merge Conflicts

```bash
# Detect
git status | grep -q "unmerged" && echo "Merge conflicts detected"

# Attempt auto-resolution
git fetch origin main
git rebase origin/main

# If conflicts are in generated files (package.json, yarn.lock):
git checkout --ours package.json yarn.lock
yarn kbn bootstrap

# If conflicts are in code:
# Use git conflict markers to understand both sides
# Resolve by taking ours/theirs based on context
# If complex: ask user

# Verify
node scripts/check_changes.ts

# Commit
git add .
git rebase --continue
```

## Commit Strategy

**Multiple fixes in one commit:**
When possible, combine related fixes into a single commit to reduce CI cycles.

```bash
# Fix ESLint, types, and a test failure

git add .
git commit -m "fix(ci): resolve multiple CI failures

- ESLint: auto-fixed via eslint --fix
- Types: fixed interface mismatch in <file>
- Tests: fixed assertion in <test>

Detected and fixed by ci-babysitter iteration $ITERATION

Co-Authored-By: Claude Sonnet 4.5 (1M context) <noreply@anthropic.com>"
```

**Separate commits when:**
- Fixes are unrelated
- One fix depends on seeing intermediate CI results
- Fixes span different domains (infrastructure vs code)

## Termination Conditions

### Success: CI Green

```
✅ SUCCESS! PR #$PR is now GREEN

Monitoring stopped: CI passing
Iterations: $ITERATION
Total fixes: $TOTAL_FIXES
Time elapsed: <duration>

Buildkite: <build-url>
PR: <pr-url>

The PR is ready for final review and merge.
```

Stop babysitting. Job done.

### Escalation: Max Iterations Reached

After 20 iterations without success:

```
⚠️  ESCALATION NEEDED

CI babysitter reached maximum iterations (20) without achieving green build.

Remaining issues:
[categorized list of unfixed failures]

Likely causes:
- Environmental issues (infrastructure problems)
- Complex logic errors requiring design decisions
- Test infrastructure problems

Next steps:
1. Review remaining failures above
2. Decide which require manual investigation
3. Consider requesting help from relevant team
```

### Escalation: Unfixable Infrastructure

```
⚠️  ESCALATION NEEDED

Infrastructure failure detected: <type>

This is not fixable via code changes. Options:
- Wait for platform team to resolve
- Adjust build configuration
- Skip affected tests (not recommended)

Pausing babysitter until issue resolved.
```

## Anti-Patterns (Don't Do This)

❌ **Fix one issue, push, wait for full CI, repeat** → Wastes time. Fix ALL issues in one iteration.

❌ **Ignore bot comments** → They often contain structured failure info.

❌ **Reply to all human comments immediately** → Ask user first for non-trivial changes.

❌ **Increase timeouts blindly** → Understand why tests are slow first.

❌ **Force-push without --force-with-lease** → Can lose others' work.

❌ **Skip dry-run** → First iteration MUST show user what will happen.

❌ **Keep going after 20 iterations** → If not green by then, something's fundamentally wrong.

## Example Session

```
User: "babysit my PR"

Claude: "I'm using the ci-babysitter skill to monitor PR #258775 until CI goes green."

[5 minutes later, CI check runs]

Claude: "Iteration 1/20 - CI FAILED

DRY-RUN MODE:
Issues found:
  - ESLint errors in 3 files
  - Type error in kbn-evals-extensions/index.ts
  - Test failure in package.test.ts (flaky - timing issue)

Proposed fixes:
  - Run eslint --fix
  - Add missing type import
  - Refactor test to use proper waitFor

Proceeding with fixes..."

[Fixes applied, pushed, CI triggered]

Claude: "Iteration 1 complete. Fixes pushed. Waiting 5 minutes for CI..."

[5 minutes later]

Claude: "Iteration 2/20 - CI PASSING ✓

SUCCESS! All checks green.
PR #258775 ready for review.

Fixes applied:
- Auto-fixed ESLint (3 files)
- Resolved type error
- Refactored flaky test

Buildkite: <url>
```

## Usage Examples

### Example 1: GUARD Mode (Pre-Push)

```
User: "I'm ready to push - guard my push first"

Claude: "Using ci-babysitter GUARD mode to validate before push..."

[Runs checks]

Claude: "✅ GUARD MODE: All checks passed!
- Type check: ✓ (2 packages)
- ESLint: ✓ (8 files)
- Unit tests: ✓ (3 tests)

Pushing to origin/feature/my-feature..."

[After push]

Claude: "Push complete. Draft PR #258775 detected.
Auto-commenting /ci to trigger Buildkite...
✓ CI triggered

Would you like me to switch to BABYSIT mode and monitor until green?"
```

### Example 2: GUARD Mode with Auto-Fix

```
User: "guard my push"

Claude: "⚠️  GUARD MODE: Issues detected - auto-fixing...

Type errors: 1
  - src/index.ts:42 - Missing return type

ESLint errors: 3 (auto-fixable)

Fixing issues automatically...
- Fixed ESLint via eslint --fix ✓
- Added return type annotation ✓
- Verified all fixes ✓

Committing fixes and pushing...
✓ Fixes committed
✓ Push complete
✓ Draft PR #258775 auto-triggered with /ci

GUARD mode complete. CI triggered.
```

### Example 3: Full GUARD → BABYSIT Pipeline

```
User: "guard my push then babysit it"

Claude: "Starting GUARD mode..."
[Pre-flight checks pass]
✓ Push complete
✓ /ci triggered on draft PR #258775

"Switching to BABYSIT mode..."

Iteration 1/20 - Checking CI status...
CI FAILED
- ESLint errors in 2 files (missed by guard - new files added by merge)
- Test failure in integration test

Fixing and re-pushing...

Iteration 2/20 - CI PASSING ✓
SUCCESS! PR ready for review.
```

### Example 4: BABYSIT Only (Existing PR)

```bash
/ci-babysitter
# Starts monitoring current PR immediately
```

### Example 5: GUARD Only (No Monitoring)

```
User: "just guard my push, don't babysit"

Claude: "GUARD mode only..."
[Checks pass]
✓ Pushed and /ci triggered
Done. Not monitoring further.
```

## Dependencies

- **buildkite-ci-debugger skill** - Used for failure analysis
- **Buildkite MCP server** - user-buildkite-read-only-toolsets
- **GitHub CLI** (`gh`) - For PR operations
- **Git worktree** - Must be in the PR branch

## Future Enhancements

- Slack/Teams notifications (when opted in)
- Parallel fix attempts (try multiple strategies)
- Learning from past fixes (remember successful patterns)
- PR description auto-updates with changelog
- Auto-request review when ready
