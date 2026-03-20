# CI Babysitter Plugin

Automated CI monitoring and fixing for Kibana (and other) PRs. Combines pre-push validation with continuous CI monitoring to keep your PRs green.

## Features

### 🛡️ GUARD Mode: Pre-Push Validation
- Runs pre-flight checks before you push (type check, eslint, unit tests)
- Scopes checks to changed files only (fast!)
- Auto-fixes issues or aborts push
- Auto-comments `/ci` on draft PRs after successful push

**Trigger:** "guard my push", "validate before push", "check before pushing"

### 🔄 BABYSIT Mode: Continuous CI Monitoring
- Monitors Buildkite CI status every 5 minutes
- Debugs failures by pulling ALL logs
- Auto-fixes common issues (ESLint, types, tests, conflicts)
- Handles bot PR comments automatically
- Asks for approval on human review comments requiring major changes
- Stops when CI goes green (or after 20 iterations)

**Trigger:** "babysit my PR", "watch CI", "keep fixing until green"

## What It Fixes Automatically

- ✅ **ESLint errors** - Runs `eslint --fix`
- ✅ **Type errors** - Analyzes and fixes type mismatches
- ✅ **Test failures** - Fixes tests or code logic
- ✅ **Flaky tests** - Refactors to eliminate race conditions (doesn't just increase timeouts!)
- ✅ **Merge conflicts** - Auto-resolves when safe
- ✅ **Bot PR comments** - Addresses automated check warnings
- ⏸️ **Human review comments** - Asks for approval on major changes

## What It Won't Fix

- ❌ Infrastructure failures (OOM, agent lost) - Escalates to user
- ❌ Major refactors requested by reviewers - Asks first
- ❌ Design decisions - Needs human judgment

## Prerequisites

### Required Skills
- `buildkite-ci-debugger` - For failure log analysis

### Required MCP Servers
- `user-buildkite-read-only-toolsets` - For Buildkite API access

### Required Tools
- `gh` CLI - For GitHub PR operations
- Git worktree - Must be in PR branch

## Installation

```bash
# Install from patryks-treadmill marketplace
/plugin install ci-babysitter@patryks-treadmill

# Or install dependencies manually
/skill install buildkite-ci-debugger
# Set up Buildkite MCP server (see docs)
```

## Usage

### GUARD Mode (Pre-Push)

```bash
# Before pushing changes
/ci-babysitter guard

# Or just say:
"guard my push"
"validate before I push this"
```

**What happens:**
1. Runs scoped type check on changed packages
2. Runs eslint on changed files
3. Runs affected unit tests
4. Shows issues found (if any)
5. Auto-fixes or asks whether to abort
6. Pushes if all clear
7. Auto-comments `/ci` if draft PR

### BABYSIT Mode (Continuous Monitoring)

```bash
# Start monitoring a PR
/ci-babysitter

# Or just say:
"babysit my PR"
"watch CI and fix issues"
"keep this PR green for me"
```

**What happens:**
1. Identifies current PR from branch
2. Checks CI status
3. If failing: Debugs ALL failures via Buildkite
4. Fixes issues automatically
5. Commits and pushes
6. Re-triggers CI
7. Waits 5 minutes
8. Repeats until green (max 20 iterations)

### Full Pipeline (GUARD → BABYSIT)

```bash
"guard my push then babysit it"
```

Validates before push, then monitors after push until CI green.

## Examples

### Example 1: Quick Pre-Push Check

```
You: "I'm about to push - guard it first"

Claude: "Using ci-babysitter GUARD mode...
✅ Type check passed (2 packages)
✅ ESLint passed (8 files)
✅ Unit tests passed (12 tests)

Pushing to origin/my-feature...
✓ Pushed
✓ /ci triggered on draft PR #12345

Would you like me to monitor until green?"

You: "yes"

Claude: "Switching to BABYSIT mode. Checking every 5 minutes..."
```

### Example 2: Fixing Failures Automatically

```
You: "babysit PR #258775"

Claude: "Monitoring PR #258775...

Iteration 1/20 - CI FAILED
Issues:
- ESLint errors (3 files)
- Type error in index.ts
- Flaky playwright test

DRY-RUN:
- Will fix ESLint via eslint --fix
- Will add missing type annotation
- Will refactor test to use proper waitFor (NOT just increase timeout)

Proceeding...

[Fixes applied, pushed, CI triggered]

Iteration 2/20 - CI PASSING ✓

SUCCESS! PR is green.
Fixes applied: 3
Time: 15 minutes"
```

### Example 3: Handling Review Comments

```
You: "babysit my PR but ask before addressing review comments"

Claude: "Monitoring PR #258775...

Found:
- CI failing (ESLint + types) → Will fix automatically
- Review comment from @reviewer: 'Refactor to use hooks instead of classes' → Major change detected

Fixing CI automatically...

⚠️  Before I implement the refactor:
The reviewer requested changing class components to hooks.
This is a major change. Proceed? (y/n/later)

You: "later"

Claude: "Understood. Fixing only CI issues.

[Fixes applied]

Iteration 2/20 - CI GREEN ✓
PR is ready for review. Refactor comment still pending your decision."
```

## Configuration

### Polling Interval

Default: 5 minutes

To adjust (edit skill if needed):
```markdown
# In SKILL.md, search for "sleep 300" and change to desired seconds
```

### Max Iterations

Default: 20 attempts

To adjust (edit skill if needed):
```markdown
# In SKILL.md, search for "MAX_ITERATIONS=20" and change value
```

## Troubleshooting

**Skill doesn't trigger:**
- Make sure you use trigger phrases ("babysit", "guard", "watch CI")
- Check that prerequisites are met (buildkite-ci-debugger installed)

**Fixes don't work:**
- Check git permissions (can you commit and push?)
- Verify Buildkite MCP server is configured
- Check GitHub CLI is authenticated (`gh auth status`)

**Stuck in loop:**
- Will auto-stop after 20 iterations
- May escalate complex issues needing human judgment
- Check escalation message for root cause

## Architecture

```
ci-babysitter
├── GUARD Mode (pre-push)
│   ├── Scoped validation
│   ├── Auto-fix or abort
│   └── Auto /ci trigger
│
└── BABYSIT Mode (post-push)
    ├── Poll CI status (5min)
    ├── Debug via buildkite-ci-debugger
    ├── Categorize failures
    ├── Auto-fix (ESLint, types, tests)
    ├── Handle PR comments
    ├── Commit + push + /ci
    └── Loop until green (max 20)
```

## Development

To improve this skill:
1. Clone the patryks-treadmill repository
2. Edit `plugins/ci-babysitter/skills/ci-babysitter/SKILL.md`
3. Test changes
4. Submit PR

## License

MIT License - See LICENSE file

## Credits

Built on top of:
- `buildkite-ci-debugger` skill (for log analysis)
- Buildkite MCP server (for CI access)
- GitHub CLI (for PR operations)

Created for the Elastic Kibana team's CI workflow.
