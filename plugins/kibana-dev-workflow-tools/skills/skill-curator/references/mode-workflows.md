# Detailed Mode Workflows

Full workflow details for each skill-curator mode. See SKILL.md for overview.

---

## Mode 1: Post-Creation Review (Auto-Triggered)

**Goal:** Validate a newly created/modified skill meets all quality gates.

**Trigger:** After running `create-skill` or modifying any SKILL.md.

### Step 1.1: Security Review (2-3 min)

Delegate to `skill-security-review` skill:

```
/skill-security-review <path-to-skill>
```

**Quality gate:** MUST pass with no CRITICAL findings, max 2 HIGH findings.

**Common issues:**
- Shell command injection via unvalidated inputs
- API keys in example snippets
- Bulk operations without confirm gates
- Missing error handling in scripts

### Step 1.2: Convention Compliance (1 min)

**Validate frontmatter (YAML header):**
- `name` field exists, lowercase-with-hyphens, max 64 chars
- `description` field exists, max 1024 chars, includes WHAT and WHEN
- `trigger` field exists (optional but recommended) with concrete examples
- `examples` field exists (optional) with input/output pairs

**Validate SKILL.md structure:**
- SKILL.md under 500 lines (use progressive disclosure if larger)
- Has clear "When to Use" or "Core Workflow" section
- Examples are concrete (not placeholders like `[plugin-name]`)
- No time-sensitive information (dates, versions)
- Consistent terminology (not mixing "user" and "developer")
- Unix-style paths (not Windows backslashes)

**Validate directory structure:**
```
skill-name/
├── SKILL.md              # Required
├── references/           # Optional
├── examples/             # Optional
└── scripts/              # Optional
```

**Report:**
```markdown
## Convention Compliance Report

✅ Frontmatter valid (name, description, trigger, examples)
✅ SKILL.md under 500 lines (342 lines)
⚠️ Missing concrete examples (has placeholder "[plugin-name]")
❌ Uses Windows-style paths (found: "C:\Users\...")

**Remediation:**
1. Replace placeholder "[plugin-name]" with concrete example
2. Convert all paths to Unix-style: "~/.agents/skills/..."
```

### Step 1.3: MCP Tool Integration Suggestions (1-2 min)

**Goal:** Suggest relevant MCP tools based on skill domain.

See `references/mcp-tool-mappings.md` for full heuristic mapping.

**Output:**
```markdown
## MCP Tool Integration Suggestions

**Skill:** kbn-evals-debugger

**Detected domain:** Agent Builder, eval, trace analysis

**Suggested tools:**
1. **agent-builder-skill-dev** (available)
   - `analyze_traces` — Analyze LangGraph traces for skill activation efficiency
   - `get_improvement_suggestions` — Categorize eval failures and suggest fixes
   - Use case: Auto-analyze traces when debugging eval failures

2. **langsmith** (available)
   - `fetch_runs` — Fetch LangSmith runs with filters
   - `get_thread_history` — Retrieve conversation traces
   - Use case: Pull trace data for root cause analysis
```

### Step 1.4: Similarity Detection (1 min)

**Goal:** Check if this skill overlaps with existing skills.

**Use `agent-builder-skill-dev` MCP tool:**

```typescript
agent-builder-skill-dev.analyze_skill_similarity({
  name: "flake-hunter",
  description: "Analyze flaky tests in CI, identify root causes, suggest fixes",
  tool_ids: [] // Extract from skill if MCP tools referenced
})
```

**Similarity threshold:**
- **>85%** — HIGH risk (likely duplicate, recommend merge)
- **70-85%** — MEDIUM risk (overlapping, clarify distinction)
- **<70%** — LOW risk (distinct enough)

### Step 1.5: Generate Quality Report

**Output:** `~/.agents/skills/<skill-name>/QUALITY_REPORT.md`

See `examples/review-workflow.md` for full example report format.

---

## Mode 2: Catalog Generation (5-10 min)

**Goal:** Generate searchable index of all skills by category.

**Trigger:** User says "generate skill catalog" or runs `/skill-curator catalog`.

### Step 2.1: Scan All Skills

```bash
find ~/.agents/skills -name "SKILL.md" -type f
```

For each skill:
1. Parse frontmatter (name, description, trigger, examples)
2. Extract domain keywords from description
3. Categorize by domain (see `references/catalog-template.md` for heuristics)

### Step 2.2: Generate Catalog

**Output:** `~/.agents/SKILL_CATALOG.md`

See `references/catalog-template.md` for full template structure.

**Category heuristics:**

| Category | Keywords in Description |
|----------|------------------------|
| Kibana-specific | "Kibana", "eval", "Scout", "OpenSpec", "Agent Builder", "@kbn", "Elastic" |
| Development workflow | "CI", "git", "GitHub", "PR", "commit", "branch", "worktree" |
| Quality assurance | "test", "lint", "type check", "security", "review", "validation" |
| Documentation | "docs", "evidence", "learning", "guide", "documentation" |
| Refactoring | "refactor", "migrate", "optimize", "consolidate" |
| Observability | "trace", "logs", "APM", "monitoring", "analytics" |
| Security | "security", "vulnerability", "credential", "injection", "audit" |

---

## Mode 3: Similarity Detection (1-2 min)

**Goal:** Find overlapping skills using semantic similarity.

**Trigger:** User says "is there a skill that does X?" or runs `/skill-curator similarity <skill-path>`.

### Step 3.1: Use Agent Builder MCP Tool

```typescript
agent-builder-skill-dev.analyze_skill_similarity({
  name: "flake-hunter",
  description: "Analyze flaky tests in CI, identify root causes, suggest fixes",
  tool_ids: []
})
```

**Returns:**
```json
{
  "results": [
    {
      "skill_id": "buildkite-ci-debugger",
      "similarity_score": 0.78,
      "risk_level": "medium",
      "recommendation": "Clarify distinction",
      "overlap_areas": ["CI debugging", "Buildkite logs", "failure analysis"]
    }
  ]
}
```

### Step 3.2: Present Findings

See `examples/review-workflow.md` for full example output.

---

## Mode 4: Ecosystem Audit (10-15 min)

**Goal:** Full pairwise similarity audit to find all overlapping skills.

**Trigger:** User says "audit skill ecosystem" or runs `/skill-curator ecosystem-audit`.

### Step 4.1: Use Agent Builder MCP Tool

```typescript
agent-builder-skill-dev.audit_skill_ecosystem()
```

**Returns:** Top N highest-risk overlap pairs with recommendations.

### Step 4.2: Generate Ecosystem Health Report

**Output:** `~/.agents/ECOSYSTEM_HEALTH_REPORT.md`

See `examples/review-workflow.md` for full example report.

---

## Mode 5: MCP Tool Integration Suggestions (1-2 min)

**Goal:** Suggest relevant MCP tools for a skill based on its domain.

**Trigger:** User says "suggest MCP tools for X" or runs `/skill-curator suggest-tools <skill-path>`.

### Step 5.1: Analyze Skill Domain

Read SKILL.md, extract keywords from description and content.

### Step 5.2: Map to MCP Tools

Use heuristic mapping from `references/mcp-tool-mappings.md`.

### Step 5.3: Generate Integration Snippets

See `examples/review-workflow.md` for full example snippets.

---

## Mode 6: Usage Analytics (5-10 min)

**Goal:** Analyze skill usage from conversation history, identify unused skills.

**Trigger:** User says "usage analytics" or runs `/skill-curator usage-analytics`.

### Step 6.1: Scan Conversation History

**Use `cursor-chat-browser` MCP tool:**

```typescript
cursor-chat-browser.search_messages({
  query: "/skill-name OR @skill-name",
  workspace: "kibana",
  limit: 1000
})
```

**For each skill:**
- Count skill invocations in last 30/60/90 days
- Extract use cases from conversation context
- Identify most/least used skills

### Step 6.2: Generate Usage Report

**Output:** `~/.agents/SKILL_USAGE_REPORT.md`

See `examples/review-workflow.md` for full example report.

---

## Mode 7: Auto-Update When APIs Change (5-10 min)

**Goal:** Find skills using a deprecated tool/API, suggest updates.

**Trigger:** User says "update skills using X" or runs `/skill-curator auto-update <api-name>`.

### Step 7.1: Find Skills Using API

```bash
# Search all SKILL.md files for API reference
grep -r "deprecated-api-name" ~/.agents/skills/*/SKILL.md
```

### Step 7.2: Generate Update Plan

See `examples/review-workflow.md` for full example update plan.

---

## Quality Gate Enforcement

All modes enforce quality gates defined in `references/quality-gate-thresholds.md`.

**Gate workflow:**
```text
1. Run security review
   ├─ CRITICAL found? → ❌ BLOCK (do not proceed)
   └─ No CRITICAL → Continue

2. Check convention compliance
   ├─ Missing frontmatter? → ❌ BLOCK
   └─ Other violations? → ⚠️ WARN, continue

3. Check similarity
   ├─ >85% overlap? → ❌ BLOCK (merge or clarify)
   ├─ 70-85% overlap? → ⚠️ WARN, clarify distinction
   └─ <70% overlap? → Continue

4. Suggest MCP tools
   └─ Present suggestions (INFO)

5. Calculate health score
   ├─ <60? → ⚠️ WARN (major rework needed)
   └─ ≥60? → ℹ️ INFO (show score)

6. Generate quality report
   └─ Output to ~/.agents/skills/<skill-name>/QUALITY_REPORT.md
```
