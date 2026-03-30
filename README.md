# Patryk's Treadmill

**13 Claude Code plugins for Kibana development, AI conversation intelligence, developer craft, and team coordination**

[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Claude Code](https://img.shields.io/badge/Claude-Code%20Plugins-8A63D2)](https://github.com/anthropics/claude-code)

50 skills · 6 agents · 15 hooks

---

## Install

### Via Marketplace (recommended)

```
/plugin marketplace add patrykkopycinski/patryks-treadmill-claude-plugins
```

Browse and install interactively:

```
/plugin install ai-conversation-intelligence@patryks-treadmill
/plugin install kibana-testing-tools@patryks-treadmill
/plugin install developer-craft-toolkit@patryks-treadmill
```

Or open the **Discover** tab in `/plugin` to browse all 13 plugins.

### Manual

```bash
cd ~/.claude/plugins
git clone https://github.com/patrykkopycinski/patryks-treadmill-claude-plugins treadmill
```

Restart Claude Code. All plugins auto-discovered.

---

## Featured: Agent Team Toolkit

**The complete system for orchestrating Claude Code agent teams.**

6 specialized agents, 4 quality-gate hooks, and a battle-tested coordination methodology — everything you need to parallelize work across multiple AI teammates with file reservations, task dependency graphs, and automatic enforcement.

```
/plugin install agent-team-toolkit@patryks-treadmill
```

Includes generic agents (`archaeologist`, `yak-shave-detector`) plus Kibana-specific agents as reference patterns you can adapt to your own stack. See the [full documentation](plugins/agent-team-toolkit/).

---

## Plugins

### Generic — Works with any project

| Plugin | Components | Focus |
|--------|-----------|-------|
| [Agent Team Toolkit](plugins/agent-team-toolkit/) | 6 agents, 4 hooks, 1 skill | Team coordination, quality gate hooks, specialized agents |
| [Developer Craft Toolkit](plugins/developer-craft-toolkit/) | 5 skills | Systematic refactoring (Martin Fowler), TDD, technical writing, deep-dive research, frontend design review |
| [Session Safety Hooks](plugins/session-safety-hooks/) | 11 hooks | Command guard, secret detection, auto-backup, audit logging, usage tracking, settings backup, session lifecycle |
| [Skill Ecosystem Tools](plugins/skill-ecosystem-tools/) | 3 skills | Discover community skills, import from SkillsMP, validate plugins |

### Kibana & AI

| Plugin | Components | Focus |
|--------|-----------|-------|
| [AI Conversation Intelligence](plugins/ai-conversation-intelligence/) | 4 skills | Pattern mining, learnings capture, automation management, marketplace advice |
| [CI Babysitter](plugins/ci-babysitter/) | 2 skills | CI monitoring, Buildkite debugging |
| [Kibana Testing Tools](plugins/kibana-testing-tools/) | 9 skills | Test coverage, flakes, migration, selectors, QA, evals |
| [Kibana Code Quality](plugins/kibana-code-quality-suite/) | 7 skills | TypeScript, security, a11y, design, refactoring |
| [Kibana Dev Workflow](plugins/kibana-dev-workflow-tools/) | 7 skills | Git, PR, OpenSpec, lint, code archaeology |
| [Kibana Build Performance](plugins/kibana-build-performance-tools/) | 3 skills | Build optimization, bundle analysis, dependency updates |
| [Kibana Docs & Release](plugins/kibana-docs-release-tools/) | 3 skills | Docs generation, release notes, migration planning |
| [Kibana Infrastructure](plugins/kibana-infrastructure-ops-tools/) | 5 skills | Cross-repo consistency, monitoring, i18n, spikes |
| [Kibana Career Dev](plugins/kibana-career-development/) | 1 skill | Promotion evidence tracking |

---

## Full Skill Catalog

<details>
<summary>All 50 skills across 13 plugins</summary>

### Developer Craft Toolkit

| Skill | Trigger |
|-------|---------|
| `code-refactor` | "refactor this", "clean up code", "code smells", "reduce technical debt" |
| `tdd-workflow` | "write tests first", "TDD", "test-driven", writing new features or fixing bugs |
| `technical-writer` | "write documentation", "document this API", "create a README", "technical writing" |
| `deep-dive` | "deep dive into X", "research this repo", "generate an HTML report" |
| `frontend-design-review` | "review the UI", "design feedback", "UX review", "accessibility check" |

### Session Safety Hooks

| Hook | Purpose |
|------|---------|
| `guard-bash.sh` | Blocks dangerous shell commands before execution |
| `secret-guard.sh` | Detects secrets and credentials in files being written |
| `backup-before-write.sh` | Auto-backs up files before overwrite |
| `log-changes.sh` | Audit log of all file modifications |
| `log-failures.sh` | Captures tool failures for post-session review |
| `log-stop-verdict.sh` | Records session stop verdicts |
| `pre-compact-handoff.sh` | Saves context before conversation compaction |
| `post-compact-resume.sh` | Restores context after compaction |
| `session-reset.sh` | Resets stale state on new session |
| `track-usage.sh` | Session usage stats (duration, tool count, files changed) |
| `backup-settings.sh` | Auto-backup settings.json and agents on session end |

### Skill Ecosystem Tools

| Skill | Trigger |
|-------|---------|
| `find-skills` | "find a skill for X", "discover skills", "search SkillsMP" |
| `skillsmp-importer` | "import skill from SkillsMP", "install community skill" |
| `validate-claude-marketplace` | "validate plugin", "check marketplace listing", "plugin health check" |

### Agent Team Toolkit

| Skill / Agent | Trigger |
|-------|---------|
| `team-coordination` (skill) | "create a team", "dispatch agents", "coordinate parallel work" |
| `archaeologist` (agent) | Investigates git history, traces decision rationale |
| `yak-shave-detector` (agent) | Monitors scope creep during implementation |
| `kibana-frontend-dev` (agent) | Owns frontend implementation subtasks in team tasks |
| `kibana-backend-dev` (agent) | Owns server-side implementation subtasks in team tasks |
| `kibana-code-reviewer` (agent) | Reviews PRs and implementation quality |
| `kibana-test-specialist` (agent) | Owns test writing subtasks in team tasks |

### AI Conversation Intelligence

| Skill | Trigger |
|-------|---------|
| `mine-patterns` | "/mine-patterns", "find patterns in conversations", "what have I been repeating?" |
| `capture-learnings` | "/capture-learnings", end of a task, "save what we learned" |
| `manage-automations` | "/manage-automations", "review my skills", "deduplicate automations" |
| `marketplace-advisor` | "should I publish this skill?", "is this ready for the marketplace?" |

### CI Babysitter

| Skill | Trigger |
|-------|---------|
| `ci-babysitter` | "monitor CI", "watch this PR", "keep CI green", pre-push guard |
| `buildkite-ci-debugger` | "fix CI", "CI is failing", "debug build", Buildkite failures |

### Kibana Testing Tools

| Skill | Trigger |
|-------|---------|
| `test-coverage-analyzer` | "analyze test coverage", "what's untested?", "coverage gaps" |
| `flake-hunter` | "fix flaky test", "this test is intermittent", >5% flake rate in Buildkite |
| `cypress-to-scout-migrator` | "migrate Cypress tests", "convert to Scout", "Scout migration" |
| `test-selector-healer` | "no selector", "strict mode violation", "element not found", "add data-test-subj" |
| `qa-browser-verification` | "verify this works", "test it in browser", "QA this feature" |
| `api-test-generator` | "generate API tests", "write HTTP tests", "test this endpoint" |
| `test-data-builder` | "create test data", "generate fixtures", "build mock data" |
| `kbn-evals-debugger` | "debug evals", "eval suite failing", "@kbn/evals issues" |
| `kbn-evals-vision-reviewer` | "review evals alignment", "evals vision review", PRs touching @kbn/evals |

### Kibana Code Quality

| Skill | Trigger |
|-------|---------|
| `type-healer` | "fix TypeScript errors", "TS is failing", "type errors" |
| `security-reviewer` | "security review", adding API routes, auth changes |
| `accessibility-auditor` | "accessibility audit", "a11y check", "ARIA issues" |
| `refactor-assistant` | "refactor this code", function >100 LOC (auto-trigger) |
| `design-super-agent` | "design review", "review this dashboard", complex UI critique |
| `dashboard-workflow` | "build a dashboard", "create Kibana dashboard", full lifecycle orchestration |
| `skill-curator` | "audit skill ecosystem", "find duplicate skills", "skill health check" |

### Kibana Dev Workflow

| Skill | Trigger |
|-------|---------|
| `openspec-advisor` | "implement X", "plan this feature", "should I use OpenSpec?" |
| `kibana-precommit-checks` | Pre-commit: runs scoped eslint + type_check before committing |
| `kibana-eslint-prepush` | Pre-push: runs eslint --fix on changed files |
| `pr-optimizer` | "optimize this PR", "PR is too large", "split this PR" |
| `git-workflow-helper` | "git workflow", "how should I branch?", "commit strategy" |
| `code-archaeology` | "why was this written?", "git blame deep dive", "trace this decision" |
| `cursor-chat-browser` | "search past conversations", "what did I decide about X?", recall past context |

### Kibana Build Performance

| Skill | Trigger |
|-------|---------|
| `perf-optimizer` | "optimize build time", "build is slow", "improve performance" |
| `bundle-analyzer` | "analyze bundle size", "bundle is too large", "what's bloating the build?" |
| `dependency-updater` | "update dependencies", "upgrade packages", "check for outdated deps" |

### Kibana Docs & Release

| Skill | Trigger |
|-------|---------|
| `doc-generator` | "generate documentation", "document this feature", "write API docs" |
| `release-notes-generator` | "generate release notes", "what changed in this release?" |
| `migration-planner` | "plan the migration", "breaking change strategy", "upgrade path" |

### Kibana Infrastructure

| Skill | Trigger |
|-------|---------|
| `check-cross-repo-consistency` | "check cross-repo", "are the repos in sync?", Docker/npm version drift |
| `cross-repo-sync` | "sync this change to sibling repos", "propagate version bump" |
| `i18n-helper` | "add i18n", "internationalize this", "missing translations" |
| `monitoring-setup` | "add monitoring", "set up alerts", "instrument this feature" |
| `spike-manager` | "manage spikes", "Docker spike environment", "run isolated spike" |

### Kibana Career Dev

| Skill | Trigger |
|-------|---------|
| `promotion-evidence-tracker` | "log promotion evidence", "track this achievement", end of non-trivial tasks |

</details>

---

## Companion Plugins

| Plugin | Author | Focus |
|--------|--------|-------|
| [core-ai-pm-workflow](https://github.com/davethegut/core-ai-pm-workflow) | @davethegut | PM workflows: deep-dive research, doc writing, presentations, security review |

---

## Docs

- [Philosophy](docs/PHILOSOPHY.md) — why this exists
- [Selective Install](docs/SELECTIVE-INSTALL.md) — choose only what you need
- [Creating Plugins](docs/CREATING-PLUGINS.md) — contribute your own

---

## Contributing

Contributions welcome. [Issues](https://github.com/patrykkopycinski/patryks-treadmill-claude-plugins/issues) · [Discussions](https://github.com/patrykkopycinski/patryks-treadmill-claude-plugins/discussions) · [PRs](https://github.com/patrykkopycinski/patryks-treadmill-claude-plugins/pulls)

## License

MIT — free to use, modify, and distribute.

---

**Built by [@patrykkopycinski](https://github.com/patrykkopycinski) for engineers who want to level up faster**
