---
name: git-workflow-helper
description: Guide complex Git operations including interactive rebase, cherry-pick, conflict resolution, reflog recovery, and history rewriting with safety warnings and step-by-step guidance.
---

# Git Workflow Helper Agent

## Description
Guide complex Git operations: interactive rebase, cherry-pick, conflict resolution, reflog recovery, history rewriting. Provide safety warnings, undo instructions, and step-by-step guidance for Kibana's Git workflow.

## Trigger Patterns
- "rebase [branch] onto [base]"
- "cherry-pick [commit]"
- "resolve conflicts in [file]"
- "undo [git operation]"
- "fix commit history"
- "squash commits"
- "backport PR to [branch]"
- "recover lost commit"

## Capabilities

### 1. Interactive Rebase
- Plan rebase strategy (squash, reword, reorder)
- Execute step-by-step with safety checks
- Handle conflicts during rebase
- Abort and recover if needed

### 2. Cherry-Pick Operations
- Select commits for cherry-pick
- Handle merge commits
- Resolve cherry-pick conflicts
- Batch cherry-pick with automation

### 3. Conflict Resolution
- Analyze conflict markers
- Suggest resolution strategy
- Validate resolution completeness
- Test after resolution

### 4. History Recovery
- Use reflog to find lost commits
- Recover from reset/rebase mistakes
- Restore deleted branches
- Undo force push (local)

### 5. Backporting
- Create backport branch
- Cherry-pick relevant commits
- Update backport labels
- Open backport PR

## Interactive Rebase Guide

### Planning Rebase
```bash
# Show commits to be rebased
git log --oneline origin/main..HEAD

# Count commits
git rev-list --count origin/main..HEAD

# Check for merge commits (can't rebase)
git log --oneline --merges origin/main..HEAD
```

**Decision Tree:**
- **1-3 commits**: Squash into 1 (clean history)
- **4-10 commits**: Keep logical grouping (feature, fix, test)
- **10+ commits**: Consider splitting into multiple PRs
- **Has merges**: Rebase will fail, use `git rebase -p` or re-create branch

### Executing Rebase
```bash
# Start interactive rebase
git rebase -i origin/main

# Editor opens with commit list:
# pick abc123 feat: add feature X
# pick def456 fix: typo in test
# pick ghi789 chore: update deps

# Edit to squash:
# pick abc123 feat: add feature X
# squash def456 fix: typo in test
# squash ghi789 chore: update deps

# Save and exit
# New editor opens for combined commit message
# Edit message, save, and exit

# If conflicts occur:
# Fix conflicts in files
git add <resolved-files>
git rebase --continue

# If rebase goes wrong:
git rebase --abort
```

**Safety Checks:**
1. ✅ Working directory clean: `git status`
2. ✅ Remote up to date: `git fetch origin`
3. ✅ No merge commits: `git log --merges`
4. ✅ Branch backed up: `git branch backup-branch-name`

### Common Rebase Scenarios

#### Squash All Commits
```bash
# Squash last N commits
git rebase -i HEAD~5

# In editor: change 'pick' to 'squash' for all but first
pick abc123 feat: initial work
squash def456 fix: review feedback
squash ghi789 fix: lint errors
squash jkl012 fix: type errors
squash mno345 chore: update tests

# Result: 1 clean commit
```

#### Reword Commit Messages
```bash
# Fix commit messages
git rebase -i HEAD~3

# In editor: change 'pick' to 'reword'
reword abc123 fix: typo in commit message
pick def456 feat: feature X
pick ghi789 test: add tests

# New editor opens for each 'reword'
# Update message, save, exit
```

#### Reorder Commits
```bash
# Reorder commits (move fix before feature)
git rebase -i HEAD~3

# Before:
# pick abc123 feat: feature X
# pick def456 fix: bug Y
# pick ghi789 feat: feature Z

# After (drag lines):
# pick def456 fix: bug Y
# pick abc123 feat: feature X
# pick ghi789 feat: feature Z

# Save and exit
```

#### Drop Commits
```bash
# Remove commits from history
git rebase -i HEAD~3

# In editor: change 'pick' to 'drop' or delete line
pick abc123 feat: feature X
drop def456 wip: debugging code
pick ghi789 test: add tests

# Save and exit
```

### Rebase Conflicts

#### Understanding Conflict Markers
```typescript
// File: src/core/server/http_server.ts

<<<<<<< HEAD (current - your base branch)
export class HttpServer {
  private port = 5601;
=======
export class HttpServer {
  private port = 9200;
>>>>>>> abc123 (incoming - your commit)
}
```

**Resolution Strategy:**
1. **Keep HEAD**: Your base branch is correct
2. **Keep incoming**: Your commit is correct
3. **Keep both**: Merge manually (rare)
4. **Rewrite**: Neither is correct, write new code

#### Resolving Conflicts
```bash
# See conflicted files
git status

# Open file in editor
# Look for <<<<<<< ======= >>>>>>> markers
# Edit to resolve (remove markers)

# Mark as resolved
git add src/core/server/http_server.ts

# Continue rebase
git rebase --continue

# If more conflicts, repeat
# If stuck, abort
git rebase --abort
```

#### Auto-Resolution Strategies
```bash
# Keep all from base branch (theirs during rebase)
git checkout --theirs src/core/server/http_server.ts
git add src/core/server/http_server.ts

# Keep all from your commit (ours during rebase)
git checkout --ours src/core/server/http_server.ts
git add src/core/server/http_server.ts

# Use merge tool
git mergetool
```

## Cherry-Pick Guide

### Single Commit Cherry-Pick
```bash
# Find commit to cherry-pick
git log --oneline --grep="fix: bug Y"

# Cherry-pick to current branch
git cherry-pick abc123

# If conflicts:
# Resolve conflicts
git add <resolved-files>
git cherry-pick --continue

# If cherry-pick goes wrong:
git cherry-pick --abort
```

### Batch Cherry-Pick
```bash
# Cherry-pick range (exclusive start)
git cherry-pick abc123..ghi789

# Cherry-pick multiple specific commits
git cherry-pick abc123 def456 ghi789

# Cherry-pick with new commit message
git cherry-pick abc123 --edit
```

### Cherry-Pick Merge Commit
```bash
# Merge commits have multiple parents
# Must specify which parent to use

# Show merge commit parents
git show --pretty=format:"%h %p" abc123

# Cherry-pick merge (use parent 1)
git cherry-pick -m 1 abc123

# If unsure which parent:
# Parent 1 = main branch
# Parent 2 = feature branch
```

### Cherry-Pick with Modification
```bash
# Cherry-pick without committing (stage only)
git cherry-pick -n abc123

# Modify staged changes
# Edit files as needed

# Commit with custom message
git commit -m "fix: adapted cherry-pick from main"
```

## Conflict Resolution Strategies

### Analysis Checklist
1. **Conflict type:**
   - Content conflict (both modified same lines)
   - Delete/modify conflict (one deleted, one modified)
   - Rename conflict (both renamed differently)

2. **Conflict scope:**
   - Small (few lines) → Manual resolution
   - Large (entire file) → Consider rebasing approach
   - Semantic (logic clash) → Requires deep understanding

3. **Resolution strategy:**
   - Keep yours (your commit is correct)
   - Keep theirs (base branch is correct)
   - Merge both (combine changes)
   - Rewrite (neither is correct)

### Step-by-Step Resolution

#### Step 1: Identify Conflicts
```bash
# List conflicted files
git status | grep "both modified"

# See conflict markers in file
git diff --name-only --diff-filter=U

# Show detailed conflict diff
git diff src/core/server/http_server.ts
```

#### Step 2: Analyze Context
```bash
# See commits that touched this file (yours)
git log --oneline HEAD..origin/main -- src/core/server/http_server.ts

# See commits that touched this file (theirs)
git log --oneline origin/main..HEAD -- src/core/server/http_server.ts

# Show file before conflict
git show HEAD:src/core/server/http_server.ts
git show origin/main:src/core/server/http_server.ts
```

#### Step 3: Resolve
```bash
# Option 1: Manual edit
# Open file, remove markers, keep correct code

# Option 2: Keep one side entirely
git checkout --ours src/core/server/http_server.ts
# or
git checkout --theirs src/core/server/http_server.ts

# Option 3: Use merge tool
git mergetool
```

#### Step 4: Validate
```bash
# Stage resolved file
git add src/core/server/http_server.ts

# Verify no conflict markers remain
grep -r "<<<<<<< \|======= \|>>>>>>>" src/

# Type check
yarn test:type_check --project src/core/tsconfig.json

# Lint
node scripts/eslint src/core/server/http_server.ts

# Test
yarn test:jest src/core/server/http_server.test.ts
```

#### Step 5: Continue Operation
```bash
# Continue rebase
git rebase --continue

# Or continue cherry-pick
git cherry-pick --continue

# Or commit merge
git commit
```

## History Recovery (Reflog)

### Find Lost Commits
```bash
# Show reflog (last 30 entries)
git reflog -30

# Example output:
# abc123 HEAD@{0}: reset: moving to origin/main
# def456 HEAD@{1}: commit: feat: feature X  <-- LOST COMMIT
# ghi789 HEAD@{2}: commit: fix: bug Y

# Recover lost commit
git cherry-pick def456

# Or reset to lost commit
git reset --hard def456
```

### Recover from Reset
```bash
# Oops, did 'git reset --hard' by mistake
# Find commit before reset
git reflog | grep "reset"

# abc123 HEAD@{0}: reset: moving to origin/main
# def456 HEAD@{1}: commit: feat: feature X  <-- WANT THIS

# Recover
git reset --hard def456

# Or create new branch from lost commit
git checkout -b recovery-branch def456
```

### Recover Deleted Branch
```bash
# Oops, deleted branch with 'git branch -D my-feature'
# Find last commit on deleted branch
git reflog | grep "my-feature"

# abc123 HEAD@{5}: checkout: moving from my-feature to main

# Recreate branch
git checkout -b my-feature abc123
```

### Recover from Rebase Gone Wrong
```bash
# Oops, rebase messed up history
# Find commit before rebase
git reflog | grep "rebase"

# def456 HEAD@{0}: rebase finished: returning to refs/heads/my-branch
# abc123 HEAD@{10}: rebase: checkout origin/main  <-- BEFORE REBASE

# Reset to before rebase
git reset --hard abc123

# Or create backup branch
git branch backup-before-rebase abc123
```

## Backporting Guide

### Create Backport PR

#### Automatic Backport (Kibana Specific)
```bash
# Label PR with backport label
# Example: backport:8.x, backport:7.17

# Kibana bot creates backport PR automatically
# Review and merge backport PR
```

#### Manual Backport
```bash
# Step 1: Fetch target branch
git fetch origin 8.x

# Step 2: Create backport branch
git checkout -b backport-12345-to-8.x origin/8.x

# Step 3: Cherry-pick commits from PR
git log --oneline origin/main ^origin/8.x | grep "#12345"

# abc123 fix: bug Y (#12345)
# def456 test: add test for bug Y (#12345)

git cherry-pick abc123 def456

# Step 4: Resolve conflicts (if any)
# Follow conflict resolution steps above

# Step 5: Push backport branch
git push origin backport-12345-to-8.x

# Step 6: Open PR
gh pr create \
  --base 8.x \
  --head backport-12345-to-8.x \
  --title "[8.x] Fix: bug Y (#12345)" \
  --body "Backport of #12345 to 8.x"
```

### Backport Validation
```bash
# Run tests on backport branch
node scripts/check_changes.ts

# Check for backport-specific issues
# - API changes not in target branch
# - Dependencies not available in target version
# - Test data fixtures different

# Validate merge base
git merge-base origin/8.x HEAD

# Should be recent commit from 8.x, not ancient
```

## Undo Operations

### Undo Last Commit (Keep Changes)
```bash
git reset --soft HEAD~1

# Changes still staged, commit still in reflog
# Can re-commit with different message
```

### Undo Last Commit (Discard Changes)
```bash
git reset --hard HEAD~1

# Changes discarded, commit in reflog only
# Can recover with reflog if needed
```

### Undo Pushed Commit (Force Push)
```bash
# ⚠️ DANGER: Only for personal branches, never main/8.x

# Reset to before bad commit
git reset --hard HEAD~1

# Force push
git push --force-with-lease origin my-branch

# ⚠️ WARNING: Breaks collaborators' local branches
```

### Undo Merge
```bash
# If merge not pushed yet
git reset --hard HEAD~1

# If merge already pushed (revert instead)
git revert -m 1 abc123
```

### Undo Rebase (Before Push)
```bash
# Find commit before rebase
git reflog | grep "rebase"

# Reset to before rebase
git reset --hard abc123
```

### Undo Cherry-Pick
```bash
# If cherry-pick not committed yet
git cherry-pick --abort

# If already committed
git reset --hard HEAD~1
```

## Safety Protocols

### Pre-Operation Checks
```bash
# 1. Clean working directory
git status
# Should show "nothing to commit, working tree clean"

# 2. Fetch latest
git fetch origin

# 3. Backup branch
git branch backup-$(date +%Y%m%d-%H%M%S)

# 4. Check remote tracking
git branch -vv
# Should show [origin/branch-name]
```

### Force Push Safety
```bash
# ❌ NEVER: git push --force
# ✅ ALWAYS: git push --force-with-lease

# Force-with-lease fails if remote changed
git push --force-with-lease origin my-branch

# If failed, fetch and rebase first
git fetch origin
git rebase origin/my-branch
git push --force-with-lease origin my-branch
```

### Branch Protection Rules
```bash
# Check if branch is protected
gh api repos/elastic/kibana/branches/main/protection

# Protected branches (Kibana):
# - main: no force push, requires PR + review
# - 8.x, 7.17, etc: no force push, requires PR + review

# Safe branches (your personal branches):
# - feature/my-branch: force push OK
# - fix/my-fix: force push OK
```

## Integration with Other Skills

### With `@buildkite-ci-debugger`
```bash
# Debug CI failure after rebase
@buildkite-ci-debugger --build <url>

# If CI red after rebase, may need to:
# - Resolve merge conflicts in CI config
# - Update test snapshots
# - Fix flaky tests exposed by rebase
```

### With `@kibana-precommit-checks`
```bash
# Validate after conflict resolution
@kibana-precommit-checks

# Ensures:
# - No conflict markers remain
# - Type checks pass
# - Linting passes
# - Tests pass
```

### With `@migration-planner`
```bash
# Backport migration changes
@migration-planner track migration progress
@git-workflow-helper backport PR #12345 to 8.x
```

## Examples

### Example 1: Squash Commits Before Merge
**User:** "squash my last 5 commits into 1"

**Agent Actions:**
```bash
# 1. Show commits to squash
git log --oneline HEAD~5..HEAD

# 2. Start interactive rebase
git rebase -i HEAD~5

# 3. Edit rebase plan
# pick abc123 feat: initial work
# squash def456 fix: review feedback
# squash ghi789 fix: lint
# squash jkl012 fix: types
# squash mno345 test: add tests

# 4. Edit commit message
# feat: add feature X
#
# Combines 5 commits:
# - Initial implementation
# - Review feedback
# - Lint and type fixes
# - Test coverage

# 5. Verify
git log --oneline HEAD~1..HEAD
```

**Output:** Single clean commit ready for merge.

### Example 2: Resolve Rebase Conflicts
**User:** "resolve conflicts in http_server.ts during rebase"

**Agent Actions:**
```bash
# 1. Show conflict
git diff src/core/server/http_server.ts

# 2. Analyze context
git log --oneline origin/main..HEAD -- src/core/server/http_server.ts

# 3. Resolution strategy
# Conflict: both changed port number
# Decision: Keep incoming (your commit) - 5601 is correct

# 4. Resolve
# Edit file, remove markers, keep 5601

# 5. Validate
yarn test:type_check --project src/core/tsconfig.json
yarn test:jest src/core/server/http_server.test.ts

# 6. Continue rebase
git add src/core/server/http_server.ts
git rebase --continue
```

**Output:** Conflict resolved, rebase continues.

### Example 3: Recover Lost Commit
**User:** "undo my reset, I lost my commit"

**Agent Actions:**
```bash
# 1. Find lost commit
git reflog -30

# def456 HEAD@{1}: commit: feat: feature X  <-- FOUND

# 2. Recover options
# Option A: Cherry-pick
git cherry-pick def456

# Option B: Reset to lost commit
git reset --hard def456

# Option C: Create branch from lost commit
git checkout -b recovery-feature-x def456

# 3. Verify
git log --oneline HEAD~1..HEAD
```

**Output:** Commit recovered, work safe.

### Example 4: Backport Fix to 8.x
**User:** "backport PR #12345 to 8.x"

**Agent Actions:**
```bash
# 1. Fetch target branch
git fetch origin 8.x

# 2. Create backport branch
git checkout -b backport-12345-to-8.x origin/8.x

# 3. Find commits to cherry-pick
gh pr view 12345 --json commits --jq '.commits[].oid'

# abc123
# def456

# 4. Cherry-pick
git cherry-pick abc123 def456

# 5. Resolve conflicts (if any)
# (follow conflict resolution steps)

# 6. Push and create PR
git push origin backport-12345-to-8.x
gh pr create \
  --base 8.x \
  --head backport-12345-to-8.x \
  --title "[8.x] Fix: security issue (#12345)" \
  --body "Backport of #12345 to 8.x"

# 7. Validate CI
# Wait for CI, fix if red
```

**Output:** Backport PR created and validated.

## Troubleshooting

### Rebase Failed: "Cannot rebase merge commits"
```bash
# Problem: Branch has merge commits
git log --oneline --merges origin/main..HEAD

# Solution 1: Recreate branch from main
git checkout main
git pull origin main
git checkout -b my-branch-clean
git cherry-pick <commit1> <commit2> <commit3>

# Solution 2: Use rebase -p (preserve merges)
git rebase -p origin/main
```

### Cherry-Pick Failed: "Empty commit"
```bash
# Problem: Commit already applied (same changes)
git cherry-pick --skip

# Or abort and manually check
git cherry-pick --abort
git diff origin/main..HEAD
```

### Conflicts After Every Commit During Rebase
```bash
# Problem: Base branch diverged significantly
# Solution: Abort and recreate branch

git rebase --abort
git checkout main
git pull origin main
git checkout -b my-branch-fresh
git cherry-pick <commits>  # Select only necessary commits
```

### Force Push Rejected
```bash
# Problem: Remote branch changed
git push --force-with-lease origin my-branch
# To origin/my-branch
#  ! [rejected]  my-branch -> my-branch (stale info)

# Solution: Fetch and rebase
git fetch origin
git rebase origin/my-branch
git push --force-with-lease origin my-branch
```

### Lost Work After Reset
```bash
# Problem: Did 'git reset --hard' by mistake
# Solution: Use reflog to recover

git reflog -30
# Find commit before reset
git reset --hard <commit-before-reset>
```

## Best Practices

### Rebase
- ✅ Rebase personal branches before merging
- ✅ Squash fixup commits (lint, type errors)
- ✅ Keep logical commit grouping
- ✅ Backup branch before rebase
- ❌ Don't rebase shared branches (main, 8.x)
- ❌ Don't rebase if branch has merge commits

### Cherry-Pick
- ✅ Cherry-pick for backports
- ✅ Cherry-pick for selective fixes
- ✅ Use --edit to update commit message
- ❌ Don't cherry-pick large ranges (use merge)
- ❌ Don't cherry-pick merge commits (use -m)

### Conflict Resolution
- ✅ Understand context before resolving
- ✅ Test after resolution (type + lint + test)
- ✅ Ask for help if semantic conflict
- ❌ Don't blindly accept one side
- ❌ Don't leave conflict markers

### Force Push
- ✅ Use --force-with-lease (never --force)
- ✅ Only force push personal branches
- ✅ Warn collaborators before force push
- ❌ Never force push main/8.x
- ❌ Don't force push without backup

## Notes
- Git is forgiving (reflog saves everything for 90 days)
- When in doubt, create backup branch first
- Force push with --force-with-lease, never --force
- Kibana bot handles backports automatically (label PR)
- Complex rebases: consider recreating branch instead
