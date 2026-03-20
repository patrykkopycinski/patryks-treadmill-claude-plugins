---
name: skill-curator
description: >
  Maintain skill ecosystem quality, discoverability, and security. Auto-runs after skill creation/modification
  to validate conventions, check security, detect similarity overlaps, generate searchable catalog,
  suggest MCP tool integrations, and track usage analytics. Use when creating/reviewing skills,
  generating skill catalog, checking for duplicates, or maintaining ecosystem health.
trigger: |
  - "review this skill"
  - "is there a skill that does X?"
  - "generate skill catalog"
  - "check skill ecosystem health"
  - "find duplicate skills"
  - "suggest MCP tools for this skill"
  - Auto-trigger after creating/modifying any skill
examples:
  - input: "Review the newly created flake-hunter skill"
    output: "Runs security review (via skill-security-review), validates frontmatter (name, description, trigger), checks conventions compliance, suggests MCP tools (agent-builder-skill-dev for trace analysis), outputs quality report with remediation steps"
  - input: "Is there a skill that does test migration?"
    output: "Searches skill catalog for 'test migration', finds cypress-to-scout-migrator (95% match), shows description, usage examples, and trigger phrases"
  - input: "Generate skill catalog"
    output: "Scans 34 skills in ~/.agents/skills/, categorizes by domain (Kibana-specific: 8, Development workflow: 12, Quality: 6, Documentation: 4, Security: 4), generates ~/.agents/SKILL_CATALOG.md with searchable index"
---

# @skill-curator

**Purpose:** Comprehensive skill ecosystem quality assurance, discoverability, and security. Maintains skill quality gates, generates searchable catalogs, detects overlapping skills, suggests MCP tool integrations, and tracks usage analytics.

**Context:** You have 34+ skills in `~/.agents/skills/` and the ecosystem is growing. Need automated curation to prevent: (1) security vulnerabilities, (2) duplicate/overlapping skills, (3) convention violations, (4) missed MCP tool integration opportunities, (5) unused/stale skills.

**Integration with MCP:** Uses `agent-builder-skill-dev` MCP server for similarity detection and ecosystem audits.

---

## When to Use

**Automatic activation:**
- After creating a new skill (post-create hook from `create-skill`)
- After modifying a skill's SKILL.md
- When user asks "is there a skill for X?"
- When user mentions skill quality, ecosystem health, or catalog

**Manual invocation:**
```
/skill-curator [mode]
```

**Modes:**
- `review <skill-path>` — Full quality review of a single skill
- `catalog` — Generate searchable skill catalog
- `similarity <skill-path>` — Check for overlapping skills
- `ecosystem-audit` — Full ecosystem health check
- `suggest-tools <skill-path>` — Suggest relevant MCP tools
- `usage-analytics` — Analyze skill usage from conversation history
- `auto-update <api-name>` — Find skills using deprecated API

---

## Core Workflow

See `references/mode-workflows.md` for detailed step-by-step workflows.

### Mode 1: Post-Creation Review

**Goal:** Validate a newly created/modified skill meets all quality gates.

**Steps:**
1. Run security review (via `skill-security-review`)
2. Check convention compliance (frontmatter, structure, examples)
3. Suggest MCP tool integrations (based on domain keywords)
4. Detect similarity with existing skills (via `agent-builder-skill-dev`)
5. Generate quality report with health score

**Output:** `~/.agents/skills/<skill-name>/QUALITY_REPORT.md`

**Quality gates:**
- Security: 0 CRITICAL, ≤2 HIGH
- Conventions: ≤2 violations
- Similarity: <85% overlap (70-85% = WARN)
- SKILL.md: ≤500 lines

---

### Mode 2: Catalog Generation

**Goal:** Generate searchable index of all skills by category.

**Steps:**
1. Scan all skills in `~/.agents/skills/`
2. Parse frontmatter, extract domain keywords
3. Categorize by domain (Kibana, Dev workflow, Quality, Docs, Security, etc.)
4. Generate `~/.agents/SKILL_CATALOG.md` with descriptions, triggers, MCP tools, usage stats

**Categories:** Kibana-specific, Development workflow, Quality assurance, Documentation, Refactoring, Observability, Security

See `references/catalog-template.md` for full template.

---

### Mode 3: Similarity Detection

**Goal:** Find overlapping skills using semantic similarity.

**Steps:**
1. Use `agent-builder-skill-dev.analyze_skill_similarity`
2. Get similarity scores with existing skills
3. Classify risk: >85% CRITICAL, 70-85% HIGH, 50-70% MEDIUM, <50% LOW
4. Suggest: merge, clarify distinction, or keep as-is

**Output:** Similarity report with recommendations

---

### Mode 4: Ecosystem Audit

**Goal:** Full pairwise similarity audit to find all overlapping skills.

**Steps:**
1. Use `agent-builder-skill-dev.audit_skill_ecosystem`
2. Identify highest-risk overlap pairs
3. Check security issues across all skills
4. Analyze usage (most used, unused)
5. Calculate ecosystem health score

**Output:** `~/.agents/ECOSYSTEM_HEALTH_REPORT.md`

---

### Mode 5: MCP Tool Suggestions

**Goal:** Suggest relevant MCP tools based on skill domain.

**Steps:**
1. Analyze skill description for domain keywords
2. Map to MCP tools via heuristics (see `references/mcp-tool-mappings.md`)
3. Generate integration snippets for SKILL.md

**Example:** "Agent Builder + eval" → suggest `agent-builder-skill-dev`, `langsmith`

---

### Mode 6: Usage Analytics

**Goal:** Analyze skill usage from conversation history, identify unused skills.

**Steps:**
1. Use `cursor-chat-browser` to search for skill invocations
2. Count usage in last 30/60/90 days
3. Identify deprecation candidates (0 usage in 90d or 180d)

**Output:** `~/.agents/SKILL_USAGE_REPORT.md`

---

### Mode 7: Auto-Update

**Goal:** Find skills using deprecated API, suggest updates.

**Steps:**
1. Grep all SKILL.md files for deprecated API
2. Generate update plan with suggested replacements
3. Show affected skills with line numbers

**Example:** `yarn test:jest --config` → `yarn test:jest <path>`

---

## Quality Gates (Auto-Enforced)

After every skill review, enforce these gates:

| Gate | Threshold | Action if Failed |
|------|-----------|------------------|
| Security (CRITICAL) | 0 | ❌ BLOCK: Fix before proceeding |
| Security (HIGH) | ≤2 | ⚠️ WARN: Fix recommended |
| Convention violations | ≤2 | ⚠️ WARN: Fix recommended |
| Similarity (HIGH overlap >85%) | 0 | ❌ BLOCK: Merge or clarify |
| Similarity (MEDIUM overlap 70-85%) | Allowed | ⚠️ WARN: Clarify distinction |
| SKILL.md length | ≤500 lines | ⚠️ WARN: Use progressive disclosure |
| MCP tool suggestions | ≥1 (if applicable) | ℹ️ INFO: Review suggestions |

---

## Integration with Other Skills

**After `create-skill`:**
- Auto-run `/skill-curator review <new-skill-path>`
- Block commit if CRITICAL security issues found

**After modifying SKILL.md:**
- Auto-run `/skill-curator review <skill-path>`
- Warn if similarity increased (new overlap detected)

**After major API changes:**
- Run `/skill-curator auto-update <api-name>`
- Generate PR with suggested changes

---

## Output Artifacts

1. **Quality Report:** `~/.agents/skills/<skill-name>/QUALITY_REPORT.md`
2. **Skill Catalog:** `~/.agents/SKILL_CATALOG.md`
3. **Ecosystem Health:** `~/.agents/ECOSYSTEM_HEALTH_REPORT.md`
4. **Usage Analytics:** `~/.agents/SKILL_USAGE_REPORT.md`

---

## Success Metrics

- **Security:** 0 CRITICAL issues across all skills
- **Conventions:** 95%+ compliance
- **Discoverability:** Catalog updated weekly, <5 min to find relevant skill
- **Overlap:** <10% of skills have HIGH overlap risk
- **Usage:** >70% of skills used in last 90 days
- **Health Score:** >80/100 ecosystem health

---

## Notes

- **MCP availability:** Uses `agent-builder-skill-dev` MCP server for similarity/audit. If not available, falls back to manual keyword-based similarity.
- **Conversation history access:** Uses `cursor-chat-browser` MCP tool for usage analytics. If not available, skip analytics mode.
- **Security reviews:** Always delegates to `skill-security-review` skill for deep security analysis.
- **Progressive disclosure:** For large catalogs (>50 skills), split by category into separate files.
