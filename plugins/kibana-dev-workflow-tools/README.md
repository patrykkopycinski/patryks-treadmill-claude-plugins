# Kibana Dev Workflow Tools

**7 skills for streamlined development workflow automation**

Git operations, PR optimization, OpenSpec guidance, code archaeology, conversation recall, and pre-commit validation.

---

## Skills

### @openspec-advisor
**Smart complexity router**

Automatically evaluates whether a task requires OpenSpec and orchestrates the workflow. Routes simple tasks to direct implementation, complex tasks through the full OpenSpec process.

**Trigger:** Complex feature work | "Should I use OpenSpec?" | Multi-file changes

---

### @pr-optimizer
**PR size and quality analyzer**

Analyzes PRs for review quality, size, and description clarity. Suggests split strategies and provides reviewability scoring.

**Trigger:** "Optimize my PR" | Before creating PRs | Large changesets

---

### @git-workflow-helper
**Git workflow guide**

Complete guide for interactive rebase, cherry-pick, conflict resolution, squash, branch management, and Kibana backporting.

**Trigger:** "Rebase my branch" | "Squash commits" | Git operations

---

### @code-archaeology
**Git history analysis**

Traces git history to understand code evolution and decision context. Uses blame tracking, PR/issue linking, and API evolution analysis.

**Trigger:** "Why was this written this way?" | "Who changed this?" | Code history investigation

---

### @cursor-chat-browser
**Search past Cursor AI conversations**

Search and retrieve past Cursor AI conversations across all workspaces. Find previous discussions, recall past decisions, look up prior implementations.

**Trigger:** "We discussed this before" | "Find that conversation" | "What did we decide about X?"

**Requires:** `cursor-chat-browser` MCP server

---

### @kibana-precommit-checks
**Scoped eslint + type_check before commit**

Runs eslint and type_check scoped to only changed files before committing/pushing. Catches lint and type errors locally in seconds instead of waiting 45+ minutes for CI.

**Trigger:** Before `git commit` | "Lint my changes" | "Type check" | "Validate before push"

---

### @kibana-eslint-prepush
**ESLint pre-push guard**

Runs eslint on changed files before pushing to avoid CI auto-fix commits that require re-triggering the pipeline.

**Trigger:** Before `git push` | "Lint before push" | "Format code"

---

## Installation

```bash
cd ~/.claude/plugins/treadmill && git pull origin main
```

Restart Claude Code.

---

**Part of [Patryk's Treadmill](https://github.com/patrykkopycinski/patryks-treadmill-claude-plugins)**
