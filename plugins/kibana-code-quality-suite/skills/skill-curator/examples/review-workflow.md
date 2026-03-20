# Skill Review Workflow Examples

Real-world examples of skill curation workflows.

---

## Example 1: Post-Creation Review

**Scenario:** User just created a new skill `@flake-hunter` for analyzing flaky tests.

### User Input
```
User: I just created the flake-hunter skill. Can you review it?
```

### Agent Workflow

#### Step 1: Security Review
```
Agent: Running security review via @skill-security-review...

Reading: ~/.agents/skills/flake-hunter/SKILL.md
Reading: ~/.agents/skills/flake-hunter/scripts/analyze_flakes.sh

Security Review Results:
- [HIGH] Shell command injection risk (line 87)
  - Pattern: grep "${user_input}" buildkite.log
  - Risk: Unvalidated user input in shell command
  - Remediation: Validate/sanitize input or use parameterized queries

- [MEDIUM] No rate limiting on Buildkite API calls
  - Risk: Could hit API rate limits under heavy usage
  - Remediation: Add exponential backoff, respect rate limit headers

Quality Gate: ⚠️ WARN (1 HIGH finding)
```

#### Step 2: Convention Compliance
```
Agent: Checking convention compliance...

✅ Frontmatter valid (name, description, trigger, examples)
✅ SKILL.md under 500 lines (287 lines)
⚠️ Missing concrete examples (line 15: uses "[test-name]" placeholder)
❌ Windows-style path (line 92: "C:\Users\...")

Quality Gate: ⚠️ WARN (2 violations)
```

#### Step 3: MCP Tool Suggestions
```
Agent: Analyzing domain keywords: "test", "CI", "flaky", "Buildkite"...

Suggested MCP tools:
1. langsmith (available)
   - fetch_runs: Fetch LangSmith runs for trace analysis
   - analyze_traces: Analyze test execution patterns
   Use case: Correlate flake patterns with trace data

2. playwright (available)
   - browser_snapshot: Capture UI state during flake reproduction
   Use case: Visual debugging of UI-related flakes

Integration snippets available in report.
```

#### Step 4: Similarity Detection
```
Agent: Checking similarity with existing skills via agent-builder-skill-dev...

Overlapping skills found:
- buildkite-ci-debugger (78% similarity)
  Risk: MEDIUM
  Overlap: CI debugging, Buildkite logs, failure analysis
  Distinction: buildkite-ci-debugger = build-level failures; flake-hunter = test-level flakiness
  Recommendation: Clarify distinction in descriptions

Quality Gate: ⚠️ WARN (78% overlap)
```

#### Step 5: Generate Quality Report
```
Agent: Generating quality report...

Health Score: 66/100 (Fair)
- Security: 0.8 (1 HIGH)
- Convention: 0.67 (2 violations)
- Similarity: 0.7 (78% overlap)
- MCP Integration: 0.5 (tools suggested but not documented)
- Length: 1.0 (287 lines)
- Usage: 0.0 (new skill, no usage yet)

Report saved: ~/.agents/skills/flake-hunter/QUALITY_REPORT.md
```

### Agent Output
```
Agent: Quality review complete for @flake-hunter.

**Overall Grade:** C (Fair - improvements needed)

**Critical Issues:** None
**High Priority:**
1. Fix shell injection risk (line 87) - validate user input before shell interpolation
2. Clarify distinction from @buildkite-ci-debugger (78% overlap)

**Recommended Actions:**
1. Security: Sanitize user input in analyze_flakes.sh
2. Conventions: Replace "[test-name]" with concrete example (e.g., "alerts.cy.ts")
3. Conventions: Convert "C:\Users\..." to "~/.agents/skills/..."
4. Similarity: Update descriptions to clarify:
   - buildkite-ci-debugger: "Debug CI **build** failures (infra, OOM, timeouts)"
   - flake-hunter: "Debug **flaky test** failures (non-deterministic behavior)"
5. MCP Integration: Document langsmith and playwright usage in SKILL.md

Full report: ~/.agents/skills/flake-hunter/QUALITY_REPORT.md

Would you like me to apply these fixes?
```

---

## Example 2: Similarity Detection

**Scenario:** User wants to create a skill for optimizing Scout tests, but a similar skill might already exist.

### User Input
```
User: Is there a skill that optimizes Scout test suites?
```

### Agent Workflow

#### Step 1: Semantic Search in Catalog
```
Agent: Searching skill catalog for "optimize Scout test"...

Found: @cypress-to-scout-migrator (95% match)
Path: ~/.agents/skills/cypress-to-scout-migrator/
Description: Strategic test suite optimizer for Cypress→Scout migration. Analyzes coverage, identifies blind spots, refactors for DRY principles.

This skill includes Scout test optimization via:
- Test consolidation (reduce redundancy)
- Setup optimization (global hooks)
- Coverage gap detection
- Performance analysis
```

#### Step 2: Compare with Proposed Skill
```
Agent: Let me check similarity with the skill you're proposing...

Proposed: "Optimize Scout test suites"
Existing: @cypress-to-scout-migrator

Similarity: 82% (HIGH overlap)

Overlap areas:
- Scout test optimization
- Performance improvement
- DRY principles
- Coverage analysis

Distinction:
- cypress-to-scout-migrator: Focused on migration + optimization
- Your proposed skill: Focused on optimization only (no migration)

Recommendation: Extend @cypress-to-scout-migrator instead of creating new skill.
```

### Agent Output
```
Agent: Found existing skill @cypress-to-scout-migrator with 82% overlap.

**Recommendation:** Extend the existing skill rather than create a new one.

**Option 1 (Recommended): Extend cypress-to-scout-migrator**
Add a new mode: "optimize-only" for Scout suites without Cypress migration.

Changes needed:
1. Add to SKILL.md frontmatter:
   trigger: "optimize scout tests" (in addition to "migrate cypress")
2. Add new workflow section:
   "Mode 2: Scout-Only Optimization (No Migration)"

**Option 2: Create separate skill**
If your use case is significantly different, clarify:
- What makes Scout-only optimization distinct from migration+optimization?
- What features are missing from cypress-to-scout-migrator?

Which approach would you prefer?
```

---

## Example 3: Ecosystem Audit

**Scenario:** User wants to audit all skills for quality and overlap risks.

### User Input
```
User: /skill-curator ecosystem-audit
```

### Agent Workflow

#### Step 1: Run Pairwise Similarity Analysis
```
Agent: Running full ecosystem audit via agent-builder-skill-dev...

Scanning 34 skills...
Running pairwise similarity (561 comparisons)...
```

#### Step 2: Identify High-Risk Overlaps
```
Agent: High-risk overlaps found:

1. buildkite-ci-debugger ↔ flake-hunter (78%)
   Issue: Both analyze CI failures, unclear distinction
   Recommendation: Clarify in descriptions

2. cypress-to-scout-migrator ↔ code-refactor (72%)
   Issue: Both perform code transformation
   Recommendation: Narrow code-refactor scope or merge

3. capture-learnings ↔ promotion-evidence-tracker (71%)
   Issue: Both capture/log development insights
   Recommendation: Merge or clarify distinction
```

#### Step 3: Check Security Across All Skills
```
Agent: Security audit summary:

CRITICAL issues: 0 (✅ PASS)
HIGH issues: 3 (⚠️ WARN)
- flake-hunter: Shell injection (line 87)
- code-refactor: Unvalidated file path (line 142)
- git-advanced-workflows: Force-push without confirmation (line 203)

MEDIUM issues: 8 (ℹ️ INFO)
```

#### Step 4: Analyze Usage
```
Agent: Usage analytics (last 90 days):

Most used:
1. @kbn-evals-debugger (47 invocations)
2. @cypress-to-scout-migrator (23 invocations)
3. @ci-babysitter (19 invocations)

Unused (0 invocations):
1. @git-hooks-setup
2. @code-refactor
3. @frontend-design-review

Deprecation candidates (0 invocations in 180 days):
- @git-hooks-setup (never used)
- @code-refactor (overlaps with cypress-to-scout-migrator)
```

#### Step 5: Calculate Ecosystem Health
```
Agent: Ecosystem Health Score: 82/100 (Very Good)

Breakdown:
- Security: 90/100 (0 CRITICAL, 3 HIGH)
- Conventions: 88/100 (4 skills with violations)
- Similarity: 76/100 (3 pairs with HIGH overlap)
- Usage: 82/100 (3 skills unused)

Top issues:
1. Fix 3 HIGH security findings
2. Clarify distinction for 3 overlapping skill pairs
3. Review 3 unused skills (deprecate or promote)
```

### Agent Output
```
Agent: Ecosystem audit complete.

**Health Score:** 82/100 (Very Good)

**Immediate Actions:**
1. Fix HIGH security issue in flake-hunter (shell injection)
2. Fix HIGH security issue in code-refactor (unvalidated path)
3. Fix HIGH security issue in git-advanced-workflows (force-push gate)

**Short-term Actions:**
4. Clarify buildkite-ci-debugger vs flake-hunter (78% overlap)
5. Review code-refactor (72% overlap with cypress-to-scout-migrator, 0 usage)
6. Review capture-learnings vs promotion-evidence-tracker (71% overlap)

**Long-term Actions:**
7. Deprecate git-hooks-setup (0 usage, unclear use case)
8. Promote or deprecate frontend-design-review (0 usage)

**Report saved:** ~/.agents/ECOSYSTEM_HEALTH_REPORT.md

Would you like me to:
1. Fix security issues
2. Update overlapping skill descriptions
3. Generate deprecation plan for unused skills
```

---

## Example 4: Auto-Update After API Change

**Scenario:** Kibana changed Jest config discovery, need to update skills that use old API.

### User Input
```
User: Kibana now auto-discovers Jest configs. Update all skills using --config flag.
```

### Agent Workflow

#### Step 1: Find Affected Skills
```
Agent: Searching for skills using "yarn test:jest --config"...

grep -r "test:jest --config" ~/.agents/skills/*/SKILL.md

Found 2 skills:
1. @kibana-precommit-checks (line 87)
2. @kbn-evals-debugger (line 142)
```

#### Step 2: Generate Update Plan
```
Agent: API Update Plan

**Deprecated API:** yarn test:jest --config <path>
**Replacement:** yarn test:jest <test-file-path>
**Reason:** Jest now auto-discovers config from test path

Affected skills: 2

---

Skill 1: @kibana-precommit-checks

File: ~/.agents/skills/kibana-precommit-checks/SKILL.md
Line: 87

Current:
  yarn test:jest --config x-pack/packages/kbn-evals/jest.config.js

Replacement:
  yarn test:jest x-pack/packages/kbn-evals/src/index.test.ts

---

Skill 2: @kbn-evals-debugger

File: ~/.agents/skills/kbn-evals-debugger/SKILL.md
Line: 142

Current:
  yarn test:jest --config path/to/config

Replacement:
  yarn test:jest path/to/test.ts
```

### Agent Output
```
Agent: Found 2 skills using deprecated API.

**Update Plan:**
1. @kibana-precommit-checks (line 87)
2. @kbn-evals-debugger (line 142)

**Changes:**
- Remove: --config <path>
- Add: <test-file-path> (config auto-discovered)

Would you like me to:
1. Apply changes to both skills
2. Run post-update review to verify
3. Update skill catalog
```

---

## Example 5: Catalog Generation

**Scenario:** User wants to regenerate the skill catalog after adding several new skills.

### User Input
```
User: /skill-curator catalog
```

### Agent Workflow

#### Step 1: Scan All Skills
```
Agent: Scanning ~/.agents/skills/...

Found 34 skills:
- buildkite-ci-debugger
- capture-learnings
- check-cross-repo-consistency
- ci-babysitter
- ci-cd-github
- code-refactor
- create-rule
- create-skill
- cursor-chat-browser
- cypress-to-scout-migrator
- deep-dive
- find-skills
- flake-hunter
- frontend-design-review
- git-advanced-workflows
- git-hooks-setup
- kbn-evals-debugger
- kbn-evals-vision-reviewer
- kibana-eslint-prepush
- kibana-precommit-checks
- perf-optimizer
- phoenix-frontend
- promotion-evidence-tracker
- qa-browser-verification
- skill-curator
- skill-security-review
- skillsmp-importer
- spike-builder
- validate-claude-marketplace
[... 34 total]
```

#### Step 2: Categorize
```
Agent: Categorizing by domain keywords...

Kibana-specific (8):
- kbn-evals-debugger
- kbn-evals-vision-reviewer
- cypress-to-scout-migrator
- kibana-precommit-checks
- kibana-eslint-prepush
- phoenix-frontend
- perf-optimizer
- spike-builder

Development workflow (12):
- ci-babysitter
- buildkite-ci-debugger
- ci-cd-github
- git-advanced-workflows
- git-hooks-setup
- check-cross-repo-consistency
[... more]

Quality assurance (6):
- skill-security-review
- skill-curator
- kibana-precommit-checks
- qa-browser-verification
- validate-claude-marketplace
- flake-hunter

[... more categories]
```

#### Step 3: Extract Metadata
```
Agent: Extracting metadata for each skill...

For each skill:
- Parse frontmatter
- Extract MCP tools (scan for mcp__ calls)
- Get usage (from cursor-chat-browser if available)
- Get health score (from QUALITY_REPORT.md if exists)
```

#### Step 4: Generate Catalog
```
Agent: Generating catalog...

Writing: ~/.agents/SKILL_CATALOG.md
```

### Agent Output
```
Agent: Skill catalog generated.

**Summary:**
- Total skills: 34
- Categories: 7
- Skills with health scores: 18
- Skills with usage data: 28

**Top 5 Most Used (90d):**
1. @kbn-evals-debugger (47 invocations)
2. @cypress-to-scout-migrator (23 invocations)
3. @ci-babysitter (19 invocations)
4. @kibana-precommit-checks (18 invocations)
5. @skill-security-review (14 invocations)

**Health Score Distribution:**
- Excellent (90-100): 12 skills
- Very Good (80-89): 8 skills
- Good (70-79): 6 skills
- Fair (60-69): 4 skills
- Poor (<60): 4 skills

**Catalog saved:** ~/.agents/SKILL_CATALOG.md

You can now search it with Cmd+F / Ctrl+F for keywords, domains, or use cases.
```
