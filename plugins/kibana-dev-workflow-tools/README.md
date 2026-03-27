# Kibana Dev Workflow Tools

**6 skills for streamlined development workflow automation**

Git operations, PR optimization, OpenSpec guidance, code archaeology, and pre-commit validation.

---

## Skills

### @openspec-advisor
**Spec-driven development gateway**

Automatically evaluates whether a task requires OpenSpec and orchestrates the full workflow. OpenSpec is mandatory for all specs, planning, and design work. Includes installation guidance, worktree setup, and guardrails.

**Trigger:** Complex feature work | "Should I use OpenSpec?" | "Plan this" | "Implement X"

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

### Via Marketplace

```
/plugin marketplace add patrykkopycinski/patryks-treadmill-claude-plugins
/plugin install kibana-dev-workflow-tools@patryks-treadmill
```

### Manual

```bash
cd ~/.claude/plugins
git clone https://github.com/patrykkopycinski/patryks-treadmill-claude-plugins treadmill
```

Restart Claude Code or run `/reload-plugins`.

---

**Part of [Patryk's Treadmill](https://github.com/patrykkopycinski/patryks-treadmill-claude-plugins)**
