# Skill Curator

**Purpose:** Comprehensive skill ecosystem quality assurance, discoverability, and security.

## What It Does

1. **Post-Creation Review** — Validates new/modified skills for security, conventions, similarity
2. **Catalog Generation** — Generates searchable index of all skills by category
3. **Similarity Detection** — Finds overlapping skills using semantic similarity
4. **Ecosystem Audit** — Full pairwise similarity audit of all skills
5. **MCP Tool Suggestions** — Suggests relevant MCP tools based on skill domain
6. **Usage Analytics** — Analyzes skill usage from conversation history
7. **Auto-Update** — Finds skills using deprecated APIs, suggests updates

## Directory Structure

```
skill-curator/
├── SKILL.md                                    # Main skill instructions
├── README.md                                   # This file
├── references/
│   ├── mcp-tool-mappings.md                    # MCP tool domain mappings
│   ├── quality-gate-thresholds.md              # Quality gate definitions and scoring
│   └── catalog-template.md                     # Template for SKILL_CATALOG.md
└── examples/
    └── review-workflow.md                      # Real-world workflow examples
```

## Usage

### Mode 1: Review a Skill
```
/skill-curator review ~/.agents/skills/flake-hunter
```

**Output:**
- Security review (delegates to @skill-security-review)
- Convention compliance check
- MCP tool integration suggestions
- Similarity detection (checks for overlapping skills)
- Quality report with health score

**Artifacts:**
- `~/.agents/skills/flake-hunter/QUALITY_REPORT.md`

---

### Mode 2: Generate Catalog
```
/skill-curator catalog
```

**Output:**
- Scans all skills in `~/.agents/skills/`
- Categorizes by domain (Kibana-specific, Development workflow, Quality, etc.)
- Generates searchable index with descriptions, triggers, MCP tools, usage stats

**Artifacts:**
- `~/.agents/SKILL_CATALOG.md`

---

### Mode 3: Check Similarity
```
/skill-curator similarity ~/.agents/skills/flake-hunter
```

**Output:**
- Semantic similarity scores with existing skills
- Risk level (LOW/MEDIUM/HIGH/CRITICAL)
- Recommendations (clarify, merge, or distinct enough)

---

### Mode 4: Ecosystem Audit
```
/skill-curator ecosystem-audit
```

**Output:**
- Full pairwise similarity audit
- Security issues across all skills
- Usage analytics (most used, unused)
- Ecosystem health score

**Artifacts:**
- `~/.agents/ECOSYSTEM_HEALTH_REPORT.md`

---

### Mode 5: Suggest MCP Tools
```
/skill-curator suggest-tools ~/.agents/skills/kbn-evals-debugger
```

**Output:**
- Suggested MCP tools based on skill domain
- Integration snippets for SKILL.md
- Use case descriptions

---

### Mode 6: Usage Analytics
```
/skill-curator usage-analytics
```

**Output:**
- Skill invocation counts (30/60/90 days)
- Most/least used skills
- Deprecation candidates

**Artifacts:**
- `~/.agents/SKILL_USAGE_REPORT.md`

---

### Mode 7: Auto-Update
```
/skill-curator auto-update "yarn test:jest --config"
```

**Output:**
- Finds skills using deprecated API
- Suggests replacement code
- Generates update plan

---

## Quality Gates

All skills must pass these gates:

| Gate | Threshold | Action |
|------|-----------|--------|
| Security (CRITICAL) | 0 | ❌ BLOCK |
| Security (HIGH) | ≤2 | ⚠️ WARN |
| Convention violations | ≤2 | ⚠️ WARN |
| Similarity (>85%) | 0 | ❌ BLOCK |
| Similarity (70-85%) | Allowed | ⚠️ WARN |
| SKILL.md length | ≤500 lines | ⚠️ WARN |

**Health Score Formula:**
```
(Security×30%) + (Convention×25%) + (Similarity×20%) + (MCP×10%) + (Length×10%) + (Usage×5%)
```

**Score Interpretation:**
- 90-100: Excellent
- 80-89: Very Good
- 70-79: Good
- 60-69: Fair
- <60: Poor

---

## Integration with Other Skills

**Auto-triggered after:**
- `create-skill` — Runs post-creation review
- Modifying any SKILL.md — Runs convention check + similarity detection

**Delegates to:**
- `skill-security-review` — Security analysis
- `ai-chat-browser` — Usage analytics (if available)

**Uses MCP tools:**
- `agent-builder-skill-dev` — Similarity detection, ecosystem audit
- `ai-chat-browser` — Conversation history search

---

## Reference Files

### mcp-tool-mappings.md
Maps skill domain keywords to relevant MCP tools.

**Example:**
- Domain: "Agent Builder", "eval", "trace"
- Suggested: `agent-builder-skill-dev`, `langsmith`

### quality-gate-thresholds.md
Defines thresholds for security, conventions, similarity, etc.

**Example:**
- CRITICAL security: 0 allowed (BLOCK)
- HIGH overlap (70-85%): Allowed with WARNING

### catalog-template.md
Template for generating `SKILL_CATALOG.md`.

**Includes:**
- Category heuristics
- Skill entry format
- Progressive disclosure for large catalogs

---

## Example Workflows

See `examples/review-workflow.md` for detailed examples:

1. Post-creation review (flake-hunter)
2. Similarity detection (Scout optimization)
3. Ecosystem audit
4. Auto-update after API change
5. Catalog generation

---

## Success Metrics

- **Security:** 0 CRITICAL issues across all skills
- **Conventions:** 95%+ compliance
- **Discoverability:** <5 min to find relevant skill
- **Overlap:** <10% of skills have HIGH overlap risk
- **Usage:** >70% of skills used in last 90 days
- **Health Score:** >80/100 ecosystem health

---

## Known Limitations

- **MCP availability:** Similarity detection requires `agent-builder-skill-dev` MCP server. Falls back to keyword-based similarity if unavailable.
- **Usage analytics:** Requires `ai-chat-browser` MCP tool (from ai-conversation-intelligence plugin). Skips analytics mode if unavailable.
- **Security reviews:** Always delegates to `skill-security-review` skill (must be available).

---

## Future Enhancements

1. **Auto-fix mode:** Apply suggested fixes automatically (currently generates reports only)
2. **Version tracking:** Track skill changes over time, detect regressions
3. **Benchmark suite:** Standard test cases for skill quality
4. **CI integration:** Block commits with CRITICAL security issues
5. **Telemetry:** Track skill effectiveness (success rate, time saved)
