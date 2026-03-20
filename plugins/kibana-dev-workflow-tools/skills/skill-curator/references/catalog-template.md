# Skill Catalog Template

Template for generating `~/.agents/SKILL_CATALOG.md`.

## Structure

```markdown
# Skill Catalog

**Last updated:** {timestamp}
**Total skills:** {count}

**Quick search:** Use Cmd+F / Ctrl+F to search by keyword, domain, or use case.

---

## Categories

- [Kibana-specific](#kibana-specific) ({count} skills)
- [Development workflow](#development-workflow) ({count} skills)
- [Quality assurance](#quality-assurance) ({count} skills)
- [Documentation](#documentation) ({count} skills)
- [Refactoring](#refactoring) ({count} skills)
- [Observability](#observability) ({count} skills)
- [Security](#security) ({count} skills)

---

## {Category Name}

### @{skill-name}
**Path:** `{absolute-path}`
**Description:** {description from frontmatter}
**Triggers:** {trigger examples from frontmatter or extracted from content}
**MCP Tools:** {list of MCP tools used, if any}
**Usage (90d):** {invocation count from analytics}
**Health Score:** {score}/100

{Repeat for each skill in category}

---

## Usage Guide

**Find a skill by use case:**
1. Use Cmd+F / Ctrl+F to search for keywords
2. Check category sections
3. Read skill descriptions and triggers

**Invoke a skill:**
```
/skill-name
```

**Review skill quality:**
```
/skill-curator review ~/.agents/skills/skill-name
```

**Check for duplicates:**
```
/skill-curator similarity ~/.agents/skills/skill-name
```

**Update catalog:**
```
/skill-curator catalog
```

---

## Ecosystem Health

**Overall Health Score:** {average health score}/100

**Metrics:**
- Skills with CRITICAL security issues: {count}
- Skills with HIGH security issues: {count}
- Skills with HIGH overlap risk (>70%): {count}
- Skills with 0 usage (90d): {count}

**Recent Updates:**
- {skill-name}: Updated {date} (health: {before} → {after})
- {skill-name}: Deprecated {date} (reason: {reason})

---

## Deprecated Skills

Skills marked for deprecation due to low usage or high overlap:

- **{skill-name}** (deprecated {date})
  - Reason: {reason}
  - Replacement: {replacement-skill or "none"}
  - Archive path: `~/.agents/skills/_archived/{skill-name}/`
```

---

## Category Heuristics

**Kibana-specific:**
- Keywords: "Kibana", "eval", "Scout", "OpenSpec", "Agent Builder", "@kbn", "Elastic", "Elasticsearch"

**Development workflow:**
- Keywords: "CI", "git", "GitHub", "PR", "commit", "branch", "worktree", "workflow", "automation"

**Quality assurance:**
- Keywords: "test", "lint", "type check", "security", "review", "validation", "audit"

**Documentation:**
- Keywords: "docs", "evidence", "learning", "guide", "documentation", "capture", "log"

**Refactoring:**
- Keywords: "refactor", "migrate", "optimize", "consolidate", "transform", "convert"

**Observability:**
- Keywords: "trace", "logs", "APM", "monitoring", "analytics", "observability", "telemetry"

**Security:**
- Keywords: "security", "vulnerability", "credential", "injection", "audit", "exploit"

---

## Skill Entry Template

```markdown
### @{skill-name}
**Path:** `~/.agents/skills/{skill-name}/`
**Description:** {one-line description with WHAT and WHEN}
**Triggers:**
- "{trigger phrase 1}"
- "{trigger phrase 2}"
- Auto: {auto-trigger condition}

**MCP Tools:** {list or "None"}
**Usage (90d):** {count} invocations
**Health Score:** {score}/100 ({grade})

**Use cases:**
- {use case 1}
- {use case 2}

**Example:**
```
User: "{example input}"
Agent: "{example output summary}"
```
```

---

## Example Catalog Entry

```markdown
### @kbn-evals-debugger
**Path:** `~/.agents/skills/kbn-evals-debugger/`
**Description:** Debug Agent Builder eval failures via OTEL trace analysis. Auto-categorizes root causes (tool schema, evaluator threshold, missing coverage), applies fixes, converges via adaptive loop. Use when eval suite pass rate <100%.

**Triggers:**
- "debug evals"
- "eval failure"
- "pass rate is X%"
- Auto: when eval results show <100% pass rate

**MCP Tools:**
- `agent-builder-skill-dev` (analyze_traces, get_improvement_suggestions)
- `langsmith` (fetch_runs, get_thread_history)

**Usage (90d):** 47 invocations
**Health Score:** 100/100 (Excellent)

**Use cases:**
- Root cause analysis for eval failures
- Pass rate improvement from 70% → 100%
- Adaptive loop convergence (stops after 2 clean passes)

**Example:**
```
User: "The security-alert-triage eval suite is at 73% pass rate. Debug it."
Agent: "Analyzing traces... Found 3 root cause categories: TOOL_SCHEMA_COMPLEXITY (2 variants), EVALUATOR_THRESHOLD_TOO_STRICT (+0.05 recalibration), MISSING_TEST_COVERAGE (4 scenarios). Applying fixes..."
```
```

---

## Multi-Category Skills

Some skills span multiple categories. List them in all relevant categories:

**Example:** `@skill-security-review`
- Categories: Quality assurance, Security
- Listed in both sections with full details

**Example:** `@cypress-to-scout-migrator`
- Categories: Refactoring, Quality assurance (test optimization)
- Listed in both sections

---

## Catalog Generation Workflow

```text
1. Scan all skills
   └─ find ~/.agents/skills -name "SKILL.md"

2. For each skill:
   ├─ Parse frontmatter (name, description, trigger, examples)
   ├─ Extract domain keywords
   ├─ Categorize (may be multiple categories)
   ├─ Check MCP tool usage (scan for mcp__ function calls or tool references)
   ├─ Get usage analytics (from cursor-chat-browser if available)
   └─ Get health score (from QUALITY_REPORT.md if exists)

3. Group by category
   └─ Sort within category by health score (desc) then usage (desc)

4. Calculate ecosystem metrics
   ├─ Average health score
   ├─ Count security issues
   ├─ Count overlap risks
   └─ Count unused skills

5. Generate catalog
   └─ Write to ~/.agents/SKILL_CATALOG.md

6. Present summary
   ├─ Total skills
   ├─ Category breakdown
   ├─ Top 5 most-used skills
   └─ Health score distribution
```

---

## Catalog Update Frequency

**Automatic updates:**
- After creating a new skill
- After modifying a skill's SKILL.md
- After running ecosystem audit

**Manual updates:**
- Weekly (to refresh usage analytics)
- After major MCP tool additions
- After deprecating skills

**Command:**
```
/skill-curator catalog
```

---

## Progressive Disclosure for Large Catalogs

**If >50 skills:**
- Split by category into separate files:
  - `~/.agents/SKILL_CATALOG_KIBANA.md`
  - `~/.agents/SKILL_CATALOG_DEV_WORKFLOW.md`
  - `~/.agents/SKILL_CATALOG_QUALITY.md`
  - etc.
- Main catalog becomes index with links:

```markdown
# Skill Catalog

**Total skills:** 78

## By Category

- [Kibana-specific](SKILL_CATALOG_KIBANA.md) (18 skills)
- [Development workflow](SKILL_CATALOG_DEV_WORKFLOW.md) (25 skills)
- [Quality assurance](SKILL_CATALOG_QUALITY.md) (12 skills)
- [Documentation](SKILL_CATALOG_DOCUMENTATION.md) (8 skills)
- [Refactoring](SKILL_CATALOG_REFACTORING.md) (6 skills)
- [Observability](SKILL_CATALOG_OBSERVABILITY.md) (5 skills)
- [Security](SKILL_CATALOG_SECURITY.md) (4 skills)
```
