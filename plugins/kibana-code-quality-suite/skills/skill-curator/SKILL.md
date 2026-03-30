---
name: skill-curator
description: >
  Maintain skill ecosystem quality, discoverability, and security. Auto-runs after skill creation/modification
  to validate conventions, check security, detect similarity overlaps, generate searchable catalog,
  suggest MCP tool integrations, track usage analytics, and optimize skills for token efficiency.
  Use when creating/reviewing skills, generating skill catalog, checking for duplicates, maintaining
  ecosystem health, or reducing token footprint of a skill.
trigger: |
  - "review this skill"
  - "is there a skill that does X?"
  - "generate skill catalog"
  - "check skill ecosystem health"
  - "find duplicate skills"
  - "suggest MCP tools for this skill"
  - "optimize skill tokens"
  - "compress this skill"
  - "reduce skill token count"
  - "how many tokens does this skill use?"
  - Auto-trigger after creating/modifying any skill
examples:
  - input: "Review the newly created flake-hunter skill"
    output: "Runs security review (via skill-security-review), validates frontmatter (name, description, trigger), checks conventions compliance, suggests MCP tools (agent-builder-skill-dev for trace analysis), outputs quality report with remediation steps"
  - input: "Is there a skill that does test migration?"
    output: "Searches skill catalog for 'test migration', finds cypress-to-scout-migrator (95% match), shows description, usage examples, and trigger phrases"
  - input: "Generate skill catalog"
    output: "Scans 34 skills in ~/.agents/skills/, categorizes by domain (Kibana-specific: 8, Development workflow: 12, Quality: 6, Documentation: 4, Security: 4), generates ~/.agents/SKILL_CATALOG.md with searchable index"
  - input: "Optimize skill tokens for the flake-hunter skill"
    output: "Counts ~340 tokens (260 words * 1.3), identifies 4 opportunities (redundant headings, verbose examples, duplicate triggers, filler prose), shows before/after diff with ~38% savings, applies changes after approval"
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
- `token-optimize <skill-path>` — Analyze and reduce token footprint of a skill

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

### Mode 8: Token Optimization

**Goal:** Reduce the token footprint of a SKILL.md by 30-70% without losing meaning or trigger coverage.

**Trigger phrases:** "optimize skill tokens" | "compress this skill" | "reduce skill token count" | "how many tokens does this skill use?"

**Steps:**
1. **Count tokens** — estimate: `word_count * 1.3`. Report as "~N tokens (M words * 1.3)".
2. **Audit for opportunities** — scan the skill body for each technique below and list findings.
3. **Show before/after diff** — present a side-by-side summary of proposed changes with estimated per-change savings.
4. **Get approval** — ask "Apply these optimizations? (yes / yes, all / skip N)" before writing.
5. **Apply** — rewrite the file with approved changes.
6. **Verify triggers** — confirm every trigger phrase still appears (or is covered by a condensed variant) in the updated file.
7. **Report savings** — "Reduced from ~N to ~M tokens (~X% savings)."

**Optimization techniques:**

| Technique | When to apply | Typical savings |
|-----------|--------------|-----------------|
| Remove redundant headings | Section title restates what the content already makes obvious | 5-15 tokens/heading |
| Compress examples | Multi-line code block can be expressed inline | 10-30 tokens/example |
| Deduplicate trigger phrases | Two triggers convey the same intent ("fix tests" + "fix the tests") | 5-10 tokens/duplicate |
| Replace prose with tables | 3+ parallel items described in sentences | 20-40% of that block |
| Remove filler phrases | "This skill will help you to", "In order to", "Please note that" | 3-8 tokens/phrase |
| Consolidate step lists | Steps 2-4 are a single logical action split arbitrarily | 10-20 tokens/merge |
| Move data to frontmatter | Trigger examples duplicated in both frontmatter and body | Dedupe body entries |
| Prune rare examples | Keep the 2-3 highest-frequency triggers; cut niche edge-case examples | 20-50 tokens/example removed |

**Constraints (never violate):**
- Every unique intent covered by the original trigger list must remain triggerable after optimization.
- Do not remove required frontmatter fields (`name`, `description`, `trigger`, `examples`).
- Do not merge steps that have distinct preconditions or failure modes.
- If a quality gate (`≤500 lines`) is already met, still report token count — caller may want the reduction for other reasons.

**Output format:**

```
Token Optimization Report — <skill-name>
=========================================
Current: ~680 tokens (523 words * 1.3)
Target:  ~400 tokens (estimated)

Opportunities found:
  [1] Remove filler preamble in Purpose section      → -18 tokens
  [2] Deduplicate 3 trigger phrases (review/check)   → -12 tokens
  [3] Replace 4-paragraph prose with table (Mode 3)  → -55 tokens
  [4] Compress verbose example #2 to inline          → -28 tokens
  [5] Prune 2 rarely-triggered edge-case examples    → -42 tokens

Projected savings: ~155 tokens (~23%)

Apply? (yes / yes,all / skip 3,5 / no)
```

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
| Token footprint | ≤1500 tokens (~1150 words) | ℹ️ INFO: Run `token-optimize` mode |
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
