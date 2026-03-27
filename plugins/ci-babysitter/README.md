# CI Babysitter Plugin

**2 skills for automated CI monitoring, debugging, and fixing**

Automated CI monitoring and fixing for Kibana PRs. Combines pre-push validation with continuous CI monitoring to keep your PRs green.

## Skills

### @ci-babysitter
**Pre-push validation + continuous PR CI monitoring**

Two modes:
- **GUARD mode** - Pre-flight checks before push (type check, eslint, unit tests). Auto-comments `/ci` on draft PRs.
- **BABYSIT mode** - Monitors Buildkite CI every 5 minutes, debugs failures, auto-fixes issues, handles PR comments until green (max 20 iterations).

**Trigger:** "guard my push" | "babysit my PR" | "watch CI" | "fix CI automatically"

### @buildkite-ci-debugger
**Systematic Buildkite CI failure debugging**

The cardinal rule: gather ALL failure context before writing a single line of fix code. Pulls logs from all failed jobs, categorizes by root cause, and produces a structured fix plan.

**Trigger:** "fix CI" | "CI keeps failing" | "debug build" | Buildkite failures

**Phases:**
1. Identify the build (from PR, Buildkite URL, or branch)
2. Get build overview + annotations
3. Pull logs from ALL failed jobs (never skip this)
4. Categorize failures by root cause
5. Fix all root causes in a single commit
6. Monitor the new build

## What It Fixes Automatically

- **ESLint errors** - Runs `eslint --fix`
- **Type errors** - Analyzes and fixes type mismatches
- **Test failures** - Fixes tests or code logic
- **Flaky tests** - Refactors to eliminate race conditions
- **Merge conflicts** - Auto-resolves when safe
- **Bot PR comments** - Addresses automated check warnings
- Human review comments - Asks for approval on major changes

## What It Won't Fix

- Infrastructure failures (OOM, agent lost) - Escalates to user
- Major refactors requested by reviewers - Asks first
- Design decisions - Needs human judgment

## Prerequisites

### Required MCP Servers
- `user-buildkite-read-only-toolsets` - For Buildkite API access

### Required Tools
- `gh` CLI - For GitHub PR operations

## Usage

### GUARD Mode (Pre-Push)
```
"guard my push"
"validate before I push this"
```

### BABYSIT Mode (Continuous Monitoring)
```
"babysit my PR"
"watch CI and fix issues"
"keep this PR green for me"
```

### Full Pipeline
```
"guard my push then babysit it"
```

---

**Part of [Patryk's Treadmill](https://github.com/patrykkopycinski/patryks-treadmill-claude-plugins)**
