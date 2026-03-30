# Kibana Docs & Release Tools

**3 skills for documentation generation, release notes, and migration planning**

Generate technical docs from code and tests, produce structured release notes from git history, and plan large-scale migrations with phased rollout plans and progress tracking.

---

## Skills

| Skill | What it does | Trigger phrases |
|-------|-------------|-----------------|
| `@doc-generator` | Generate API docs, architecture diagrams, user guides, READMEs, and changelogs from code | "generate API docs" \| "create architecture diagram" \| "update README" \| "generate user guide" \| "document this" |
| `@release-notes-generator` | Parse commits between releases and produce categorized release notes | "generate release notes" \| "changelog for this release" \| "what changed between versions" \| "create upgrade guide" |
| `@migration-planner` | Scope, phase, and track large-scale migrations with stakeholder reports | "plan migration from [X] to [Y]" \| "analyze scope of [migration]" \| "track migration progress" \| "estimate migration effort" |

---

### @doc-generator
**Generate comprehensive technical documentation from code, tests, and git history**

Deeply integrated with Kibana conventions: versioned routes, io-ts/Zod schemas, Scout tests, and conventional commits.

- **API documentation**: Extracts metadata from `router.versioned.*` route definitions, generates OpenAPI 3.0 YAML spec and Markdown API reference with curl examples
- **Architecture diagrams**: Analyzes imports and plugin lifecycle to produce Mermaid component, sequence, and data-flow diagrams
- **User guides from Scout tests**: Converts `test.step()` flows into step-by-step user documentation with screenshot references

---

### @release-notes-generator
**Categorized release notes from git commits and PRs**

Parses the commit range between two tags, fetches PR descriptions via `gh`, and generates formatted markdown with upgrade guides for breaking changes.

- **Commit categorization**: Maps conventional commits (`feat`, `fix`, `perf`, `BREAKING`) to structured sections; surfaces breaking changes prominently
- **PR enrichment**: Fetches PR titles, labels, and body text to fill in context beyond commit messages
- **Upgrade guides**: Generates migration checklists for major version bumps with action items grouped by Kibana area (Security Solution, Observability, Fleet, Platform)

---

### @migration-planner
**Plan and track large-scale migrations: Cypress→Scout, FTR→Scout, API versioning, package extraction**

Full lifecycle: scope analysis → effort estimation → phased rollout plan → progress tracking → stakeholder reporting.

- **Scope analysis**: Scans codebase for migration candidates, categorizes by complexity (trivial / moderate / complex), and produces a file manifest with risk assessment
- **Phase planning**: Breaks migration into logical phases with milestones, success criteria, and parallel work streams; low-risk tests first
- **Progress tracking**: Calculates velocity and ETA, surfaces blockers, generates burndown tables and executive summaries

---

## Installation

### Via Marketplace

```
/plugin marketplace add patrykkopycinski/patryks-treadmill-claude-plugins
/plugin install kibana-docs-release-tools@patryks-treadmill
```

### Manual

```bash
cd ~/.claude/plugins
git clone https://github.com/patrykkopycinski/patryks-treadmill-claude-plugins treadmill
```

Restart Claude Code or run `/reload-plugins`.

---

**Part of [Patryk's Treadmill](https://github.com/patrykkopycinski/patryks-treadmill-claude-plugins)**
