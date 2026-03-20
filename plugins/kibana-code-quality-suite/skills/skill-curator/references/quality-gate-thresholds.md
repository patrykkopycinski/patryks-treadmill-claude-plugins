# Quality Gate Thresholds

Automated quality gates enforced during skill review.

## Gate Definitions

### 1. Security (from skill-security-review)

| Severity | Threshold | Action | Rationale |
|----------|-----------|--------|-----------|
| CRITICAL | 0 | ❌ BLOCK | Exploitable vulnerabilities must be fixed |
| HIGH | ≤2 | ⚠️ WARN | Significant risks should be addressed |
| MEDIUM | ≤5 | ℹ️ INFO | Notable concerns, fix when possible |
| LOW | Allowed | — | Minor improvements, optional |

**CRITICAL examples:**
- Command injection via unvalidated user input
- API keys in logs or examples
- Bulk operations with no rate limit

**HIGH examples:**
- Missing confirmation gates for destructive operations
- Partial failure states (no rollback)
- Query injection via string interpolation

---

### 2. Convention Compliance

| Violation | Threshold | Action | Rationale |
|-----------|-----------|--------|-----------|
| Missing frontmatter field (name, description) | 0 | ❌ BLOCK | Required for skill discovery |
| SKILL.md >500 lines | 0 | ⚠️ WARN | Use progressive disclosure |
| Placeholder examples (`[plugin-name]`) | ≤1 | ⚠️ WARN | Use concrete examples |
| Windows-style paths | 0 | ⚠️ WARN | Use Unix-style: `~/.agents/` |
| Inconsistent terminology | ≤2 | ℹ️ INFO | Fix when feasible |
| Time-sensitive info (dates, versions) | 0 | ⚠️ WARN | Skills should be timeless |

**Convention checklist:**
- [ ] Frontmatter valid (name, description)
- [ ] SKILL.md under 500 lines
- [ ] Concrete examples (no placeholders)
- [ ] Unix-style paths
- [ ] Consistent terminology
- [ ] No time-sensitive info

---

### 3. Similarity (from agent-builder-skill-dev)

| Similarity | Threshold | Action | Rationale |
|------------|-----------|--------|-----------|
| >85% (CRITICAL overlap) | 0 | ❌ BLOCK | Duplicate skill, merge or delete |
| 70-85% (HIGH overlap) | Allowed | ⚠️ WARN | Clarify distinction in descriptions |
| 50-70% (MEDIUM overlap) | Allowed | ℹ️ INFO | Monitor for future convergence |
| <50% (LOW overlap) | Allowed | — | Distinct enough |

**When HIGH overlap detected (70-85%):**
1. Identify overlap areas (shared keywords, triggers)
2. Clarify distinction in descriptions:
   - Skill A: Focus on [specific domain]
   - Skill B: Focus on [different domain]
3. Update both SKILL.md descriptions
4. Re-run similarity check to confirm <70%

**When CRITICAL overlap detected (>85%):**
1. Determine if duplicate or intentional variants
2. If duplicate: delete one, redirect users to canonical skill
3. If intentional: split by domain (e.g., "dev" vs "prod" variants)

---

### 4. MCP Tool Integration

| Metric | Threshold | Action | Rationale |
|--------|-----------|--------|-----------|
| Suggested tools (when applicable) | ≥1 | ℹ️ INFO | Review suggestions |
| Tools referenced but not available | 0 | ⚠️ WARN | Remove or document as optional |

**When applicable:**
- Skill mentions domain keywords (see `mcp-tool-mappings.md`)
- Skill performs tasks that MCP tools can assist with

**Not applicable:**
- Pure bash/git skills with no external API dependencies
- Skills that only manipulate local files

---

### 5. SKILL.md Length

| Length | Threshold | Action | Rationale |
|--------|-----------|--------|-----------|
| Lines | ≤500 | ⚠️ WARN if >500 | Agent context efficiency |
| Tokens | ≤2000 | ⚠️ WARN if >2000 | Avoid overwhelming LLM context |

**If exceeding threshold:**
1. Move detailed guides to `references/`
2. Move examples to `examples/`
3. Move scripts to `scripts/`
4. Use progressive disclosure: "See references/X.md for details"

**Progressive disclosure pattern:**
```markdown
## Core Workflow

Step 1: Do X (see references/step-1-details.md for advanced options)
Step 2: Do Y (see references/step-2-details.md for edge cases)
```

---

### 6. Usage Analytics (from cursor-chat-browser)

| Metric | Threshold | Action | Rationale |
|--------|-----------|--------|-----------|
| Invocations (last 90 days) | ≥1 | ⚠️ WARN if 0 | Deprecation candidate |
| Invocations (last 180 days) | ≥1 | ❌ CANDIDATE FOR DELETION | Unused skill |

**When 0 invocations in 90 days:**
1. Review skill description (is it discoverable?)
2. Check if trigger keywords are too vague
3. Consider merging with related skill
4. Update catalog with clearer use case

**When 0 invocations in 180 days:**
1. Mark as deprecated in catalog
2. Archive to `~/.agents/skills/_archived/`
3. Document reason for deprecation

---

## Combined Health Score

**Formula:**
```
Health Score = (
  SecurityScore (30%) +
  ConventionScore (25%) +
  SimilarityScore (20%) +
  MCPIntegrationScore (10%) +
  LengthScore (10%) +
  UsageScore (5%)
) × 100
```

**Score interpretation:**
- **90-100:** Excellent (exemplary skill)
- **80-89:** Very Good (minor improvements)
- **70-79:** Good (notable improvements needed)
- **60-69:** Fair (significant issues)
- **<60:** Poor (requires major rework)

**Individual scores:**

### SecurityScore
```
SecurityScore = 1.0 if no CRITICAL
              = 0.8 if 1-2 HIGH
              = 0.6 if 3-5 HIGH
              = 0.0 if any CRITICAL
```

### ConventionScore
```
ConventionScore = 1.0 - (violations / 6)
  where violations = count of:
  - missing frontmatter
  - >500 lines
  - placeholders
  - windows paths
  - inconsistent terms
  - time-sensitive info
```

### SimilarityScore
```
SimilarityScore = 1.0 if all overlaps <70%
                = 0.7 if any overlap 70-85%
                = 0.0 if any overlap >85%
```

### MCPIntegrationScore
```
MCPIntegrationScore = 1.0 if all suggested tools documented
                    = 0.5 if some suggested tools missing
                    = 0.0 if references unavailable tools
```

### LengthScore
```
LengthScore = 1.0 if ≤500 lines
            = max(0.5, 1.0 - (lines - 500) / 1000)
```

### UsageScore
```
UsageScore = 1.0 if ≥10 invocations (90d)
           = 0.8 if 5-9 invocations
           = 0.5 if 1-4 invocations
           = 0.0 if 0 invocations
```

---

## Example Health Score Calculation

**Skill:** kbn-evals-debugger

**Scores:**
- Security: 1.0 (no CRITICAL, no HIGH)
- Convention: 1.0 (all conventions met)
- Similarity: 1.0 (no overlaps >70%)
- MCP Integration: 1.0 (uses agent-builder-skill-dev, langsmith)
- Length: 1.0 (342 lines)
- Usage: 1.0 (47 invocations in 90d)

**Health Score:**
```
(1.0×0.30) + (1.0×0.25) + (1.0×0.20) + (1.0×0.10) + (1.0×0.10) + (1.0×0.05) = 1.0
→ 100/100 (Excellent)
```

---

**Skill:** flake-hunter

**Scores:**
- Security: 0.8 (1 HIGH finding: shell injection)
- Convention: 0.67 (2 violations: placeholder example, Windows path)
- Similarity: 0.7 (78% overlap with buildkite-ci-debugger)
- MCP Integration: 0.5 (suggested langsmith not documented)
- Length: 1.0 (287 lines)
- Usage: 0.0 (0 invocations)

**Health Score:**
```
(0.8×0.30) + (0.67×0.25) + (0.7×0.20) + (0.5×0.10) + (1.0×0.10) + (0.0×0.05) = 0.658
→ 66/100 (Fair)
```

**Recommendations:**
1. Fix HIGH security issue (shell injection)
2. Replace placeholder example with concrete value
3. Convert Windows path to Unix
4. Clarify distinction from buildkite-ci-debugger
5. Document langsmith integration
6. Promote skill to increase usage (or deprecate if not needed)

---

## Gate Enforcement Workflow

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

---

## Override Mechanism

**When to override gates:**
- Security: Never override CRITICAL
- Convention: Override if existing file conventions differ (e.g., project uses Windows)
- Similarity: Override if intentional variants (e.g., "dev" vs "prod")

**How to override:**
Add to skill frontmatter:
```yaml
overrides:
  security: "Acknowledged HIGH finding: XYZ (mitigated by manual review)"
  similarity: "Intentional variant of buildkite-ci-debugger for test-level debugging"
```

**Override review:**
- Overrides must be reviewed quarterly
- Remove override when issue is fixed
- Document override rationale in QUALITY_REPORT.md
