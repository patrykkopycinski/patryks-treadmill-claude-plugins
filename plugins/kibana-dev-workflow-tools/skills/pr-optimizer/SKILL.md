---
name: pr-optimizer
description: Optimize PR size, structure, and reviewability to accelerate code review cycles.
---

# PR Optimizer

## Purpose
Optimize PR size, structure, and reviewability to accelerate code review cycles.

## Capabilities
- Detect large PRs (>500 LOC, >10 files) and suggest splitting strategies
- Analyze commit organization and suggest improvements
- Check PR description quality (summary, test plan, screenshots, breaking changes)
- Auto-suggest labels based on changes (skip-ci, backport, breaking, documentation)
- Generate commit split plan (by feature, by layer, by package)
- Validate reviewability (clear logical flow, atomic commits)

## Triggers
- "optimize this PR"
- "is this PR too large"
- "improve PR description"
- "should I split this PR"
- "review PR structure"

## Implementation

### 1. PR Size Analysis
```bash
# Get changed files and line counts
git diff --stat main...HEAD

# Detailed changes per file
git diff --shortstat main...HEAD

# Count files changed
git diff --name-only main...HEAD | wc -l

# Total LOC changed
git diff --stat main...HEAD | tail -1
```

**Thresholds:**
- Small: <200 LOC, <5 files
- Medium: 200-500 LOC, 5-10 files
- Large: 500-1000 LOC, 10-20 files
- XL: >1000 LOC, >20 files

**Action:**
- Small/Medium: Proceed
- Large: Suggest splitting if logical boundaries exist
- XL: Strong recommendation to split

### 2. Splitting Strategy Analysis
```bash
# Group files by directory/package
git diff --name-only main...HEAD | cut -d/ -f1-3 | sort | uniq -c

# Identify feature boundaries (look for isolated file groups)
git diff --name-only main...HEAD | grep -E "(test|spec)" # Test files
git diff --name-only main...HEAD | grep -v -E "(test|spec)" # Implementation files

# Check dependencies between changed files (import analysis)
# For each changed .ts/.tsx file, extract imports
for file in $(git diff --name-only main...HEAD | grep -E "\.(ts|tsx)$"); do
  echo "=== $file ==="
  grep -E "^import .* from" "$file" | grep -v "node_modules"
done
```

**Splitting strategies:**
1. By package: Split changes to different `@kbn/*` packages
2. By layer: Split backend (server) from frontend (public) changes
3. By feature: Split unrelated features touched in same PR
4. By type: Split refactoring from feature work

### 3. Commit Organization Analysis
```bash
# List commits in PR
git log --oneline main...HEAD

# Show commit sizes
git log --oneline --stat main...HEAD

# Check for fixup/WIP commits
git log --oneline main...HEAD | grep -i -E "(fixup|wip|tmp|temp)"
```

**Good commit practices:**
- Atomic commits (one logical change per commit)
- Descriptive messages following convention
- No fixup/WIP commits before merge
- Logical progression (tests can pass at each commit)

**Suggestions:**
- Squash fixup commits: `git rebase -i main --autosquash`
- Split large commits: `git reset HEAD~1` then stage incrementally
- Reorder commits: `git rebase -i main`

### 4. PR Description Quality Check
```bash
# Get PR body from gh CLI
gh pr view --json body,title,labels

# Check for required sections
gh pr view --json body -q .body | grep -i "## Summary"
gh pr view --json body -q .body | grep -i "## Test Plan"
gh pr view --json body -q .body | grep -i "## Screenshots"
```

**Quality checklist:**
- [ ] Clear summary explaining the "why"
- [ ] Test plan with verification steps
- [ ] Screenshots/videos for UI changes
- [ ] Breaking changes section (if applicable)
- [ ] Related issues/PRs linked
- [ ] Migration guide (for breaking changes)

**Template for good description:**
```markdown
## Summary
[Why this change? What problem does it solve?]

## Changes
- [Key change 1]
- [Key change 2]

## Test Plan
1. [Step-by-step verification]
2. [Expected outcomes]

## Screenshots
[For UI changes]

## Breaking Changes
[If any, with migration guide]

## Checklist
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] Types checked locally
- [ ] Lint passed locally
```

### 5. Label Suggestions
```bash
# Analyze changes to suggest labels
changed_files=$(git diff --name-only main...HEAD)

# skip-ci: Only docs/comments changed
if echo "$changed_files" | grep -v -E "\.(md|txt)$" | grep -q .; then
  echo "No skip-ci (code changes present)"
else
  echo "Suggest: skip-ci"
fi

# documentation: Docs changed
echo "$changed_files" | grep -q "\.md$" && echo "Suggest: documentation"

# breaking: Check for breaking changes in commit messages
git log --oneline main...HEAD | grep -i "break" && echo "Suggest: breaking"

# backport: Check branch or commit messages
git log --oneline main...HEAD | grep -i "backport" && echo "Suggest: backport"

# By area (detect package changes)
echo "$changed_files" | grep -q "x-pack/platform" && echo "Suggest: Team:Platform"
echo "$changed_files" | grep -q "x-pack/solutions/security" && echo "Suggest: Team:SecuritySolution"
```

### 6. Reviewability Score
Calculate reviewability based on:
- Size (smaller = better)
- Commit organization (atomic = better)
- Description quality (complete = better)
- Test coverage (tests updated = better)
- Logical coherence (related changes = better)

**Score factors:**
- -20 points: >1000 LOC
- -10 points: >500 LOC
- -10 points: Mixed concerns (backend + frontend + docs)
- -5 points: Missing test plan
- -5 points: Missing summary
- +10 points: Atomic commits
- +10 points: Tests included
- +5 points: Screenshots for UI

**Output:**
```
Reviewability Score: 75/100 (Good)

Strengths:
✓ Clear description with test plan
✓ Tests included
✓ Atomic commits

Improvements:
⚠ Large PR (847 LOC) - consider splitting
⚠ Mixed backend and frontend changes
```

## Example Workflow

### User: "optimize this PR"

**Step 1: Analyze size**
```bash
git diff --stat main...HEAD
# Output: 42 files changed, 847 insertions(+), 213 deletions(-)
```
Result: Large PR (>500 LOC, >10 files)

**Step 2: Check commit organization**
```bash
git log --oneline main...HEAD
# Output:
# abc123 Add new feature
# def456 Fix lint
# ghi789 WIP tests
```
Result: Needs cleanup (fixup commits present)

**Step 3: Analyze splitting opportunities**
```bash
git diff --name-only main...HEAD | cut -d/ -f1-5 | sort | uniq -c
# Output:
#   15 x-pack/platform/packages/shared/kbn-agent-builder
#   12 x-pack/platform/plugins/security_solution
#   10 docs/
#    5 x-pack/test/
```
Result: Can split into 3 PRs:
1. Core `kbn-agent-builder` changes (15 files)
2. Security Solution integration (12 files)
3. Documentation updates (10 files)

**Step 4: Check description**
```bash
gh pr view --json body -q .body
# Output: [Short description only, missing test plan]
```
Result: Needs improvement

**Step 5: Generate recommendations**
```
PR Optimization Report
======================

Current State:
- Size: 847 LOC, 42 files (LARGE)
- Commits: 3 (needs cleanup)
- Description: Incomplete
- Reviewability: 55/100 (Needs Improvement)

Recommendations:

1. SPLIT PR (High Priority)
   Split into 3 logical PRs:

   PR 1: Core agent-builder package changes
   - 15 files in x-pack/platform/packages/shared/kbn-agent-builder
   - ~400 LOC
   - Review time: ~30 min

   PR 2: Security Solution integration
   - 12 files in x-pack/platform/plugins/security_solution
   - ~300 LOC
   - Depends on PR 1
   - Review time: ~20 min

   PR 3: Documentation updates
   - 10 docs files
   - ~150 LOC
   - Can be merged independently
   - Review time: ~10 min

2. CLEANUP COMMITS
   Run: git rebase -i main
   - Squash "Fix lint" into "Add new feature"
   - Rename "WIP tests" to descriptive message

3. IMPROVE DESCRIPTION
   Add missing sections:
   - Test plan with verification steps
   - Screenshots (for UI changes)
   - Breaking changes section

4. ADD LABELS
   Suggested labels:
   - Team:Platform
   - Team:SecuritySolution
   - documentation

Actions:
Would you like me to:
a) Generate the split plan with git commands
b) Improve the PR description
c) Clean up commits
d) All of the above
```

## Integration with Other Skills
- **spike-builder**: Check PR optimization before creating PR
- **buildkite-ci-debugger**: Suggest adding skip-ci label if appropriate
- **frontend-design-review**: Ensure screenshots included for UI PRs

## Quality Principles
- Optimize for reviewer experience, not just code correctness
- Smaller PRs merge faster and have fewer bugs
- Clear descriptions prevent back-and-forth questions
- Atomic commits enable better git bisect and rollbacks

## References
- Kibana PR guidelines: https://www.elastic.co/guide/en/kibana/current/development-pull-request.html
- Google's "Small CLs" guide: https://google.github.io/eng-practices/review/developer/small-cls.html
