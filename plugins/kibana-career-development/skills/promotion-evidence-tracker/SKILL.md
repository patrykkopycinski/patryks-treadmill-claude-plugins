---
name: promotion-evidence-tracker
description: >
  Automatically tracks and logs promotion-worthy achievements after completing tasks.
  Analyzes work context, categorizes by competency framework, generates evidence entries with metrics.
trigger: |
  - After completing any non-trivial task (feature, bug fix, optimization, framework work)
  - User says "log this for promotion"
  - User says "track promotion evidence"
  - After eval pass rate improvements
  - After CI/CD optimization work
  - After cross-team collaboration
examples:
  - input: "I just improved eval pass rate from 70% to 100%"
    output: "Logs to Problem Solving & Impact: '100% eval pass rate via root cause analysis: fixed tool schema complexity (3 discriminated unions → 1), recalibrated evaluator thresholds (+0.05), added missing test coverage (14 scenarios). Metrics: +30% pass rate, -4 iterations to convergence.'"
  - input: "Migrated 47 Cypress tests to Scout with 66% execution time reduction"
    output: "Logs to Technical Leadership & Strategic Delivery: 'Led strategic test migration: 47 Cypress → 28 optimized Scout tests. Innovation: consolidated redundant tests via test.step(), applied global setup hooks (83% setup reduction). Metrics: -66% execution time, +14 blind spot scenarios, 0 anti-patterns.'"
---

# @promotion-evidence-tracker

**Purpose:** Automatically capture and structure promotion-worthy achievements aligned with your competency framework. Proactively logs evidence after completing tasks with quantifiable impact metrics.

**Context:** Every non-trivial task is an opportunity to demonstrate competency. This agent ensures no achievement goes undocumented.

**Competency Framework:** (from `~/.agents/rules/promotion-alignment.md`)
1. Technical Leadership
2. Problem Solving & Impact
3. Influence & Communication
4. People Development
5. Strategic Delivery

---

## When to Use

**Automatic activation (proactive):**
- After completing any non-trivial task (agent detects: >1 file changed, >30 min work, cross-package impact)
- After eval pass rate improvements (detects keywords: "pass rate", "eval", "100%")
- After CI/CD optimizations (detects: "CI", "Buildkite", "flake", "performance")
- After test migrations (detects: "Cypress", "Scout", "migration")
- After framework/architecture work (detects: "framework", "architecture", "RFC", "proposal")
- After cross-team collaboration (detects: "spike", "cross-team", "handoff")

**Manual invocation:**
```
/promotion-evidence-tracker
```

Or simply:
```
"log this for promotion"
"track promotion evidence"
```

---

## Core Workflow

### Step 1: Context Analysis (2 min)

**Goal:** Understand what was accomplished and its impact.

#### Extract Context From:

1. **Git history:**
   ```bash
   # Recent commits on current branch
   git log --oneline -10
   git diff main...HEAD --stat
   ```

2. **User description:**
   - What was the goal?
   - What was the challenge/problem?
   - What was the solution/approach?
   - What was the measurable impact?

3. **Artifacts produced:**
   - Code changes (LOC, files affected)
   - Tests added/optimized (pass rate, execution time)
   - Documentation created (README, RFC, guide)
   - PRs created (size, reviews)
   - Metrics improved (performance, reliability, coverage)

4. **CI impact analysis:**
   ```bash
   # Check if PR exists and has CI runs
   gh pr view --json url,number,checks

   # For merged PRs, analyze Buildkite builds
   # Look for:
   # - Build time improvements (before/after comparison)
   # - Test execution time changes
   # - Flake rate improvements (if flaky tests were fixed)
   # - Agent hour savings (parallelism changes)
   # - Memory/resource usage improvements
   ```

   **When to check CI:**
   - After CI/CD optimization work
   - After test migration (Cypress → Scout timing comparison)
   - After performance improvements (build time, test time)
   - After flake fixes (compare flake rate before/after)

   **What to extract:**
   - Build time: "27min → 18min (33% reduction)"
   - Agent hours saved: "153 agents × 9.8s/agent = 1,530s saved per build"
   - Flake rate: "12% → 0% (eliminated)"
   - Test coverage time: "9.5min → 3.2min (66% reduction)"

---

### Step 2: Competency Categorization (1 min)

**Goal:** Map the work to your competency framework.

#### Decision Tree:

**Q1: Did you build/improve a framework, system, or architecture?**
- Yes → **Technical Leadership**
- Examples: evals framework, CI/CD system, test harness, migration tooling

**Q2: Did you solve a hard problem or significantly improve a metric?**
- Yes → **Problem Solving & Impact**
- Examples: 70% → 100% pass rate, 9min → 3min test execution, eliminated flakiness

**Q3: Did you influence others through proposals, docs, or mentorship?**
- Yes → **Influence & Communication**
- Examples: framework-first proposal, vision alignment doc, best practices guide

**Q4: Did you mentor, unblock, or develop others?**
- Yes → **People Development**
- Examples: pair programming, code review with teaching, onboarding

**Q5: Did you deliver a strategic project with cross-team coordination?**
- Yes → **Strategic Delivery**
- Examples: Cypress → Scout migration (118 commits), multi-team spike

**Can apply multiple categories!** Most work spans 2-3 categories.

---

### Step 3: Evidence Entry Generation (2 min)

**Goal:** Write a concise, metric-rich entry that demonstrates impact.

#### Template:

```markdown
### [Date] — [Task Title]

**Category:** [Competency 1, Competency 2]

**Challenge:**
[1-2 sentences: What problem were you solving? Why was it hard?]

**Approach:**
[2-3 sentences: What did you do? What technical decisions did you make?]

**Impact:**
[Bullet list of measurable outcomes]
- Metric 1: [Before → After, % improvement]
- Metric 2: [Scope of change, # files/tests/users affected]
- Metric 3: [Time saved, risk mitigated, quality improved]

**Artifacts:**
- [PR #12345](link) — [Description]
- [Docs](link) — [Description]
- [RFC/Proposal](link) — [Description]

**Competency Alignment:**
- **[Category 1]:** [1 sentence explaining how this demonstrates the competency]
- **[Category 2]:** [1 sentence explaining how this demonstrates the competency]
```

---

### Step 4: Metric Extraction (auto)

**Goal:** Quantify impact wherever possible.

#### Metric Types:

**Performance Metrics:**
- Execution time: "9.5min → 3.2min (66% reduction)"
- Setup overhead: "360s → 60s (83% reduction)"
- CI run time: "45min → 12min (73% reduction)"

**Quality Metrics:**
- Pass rate: "70% → 100% (+30%)"
- Flake rate: "12% → 0% (eliminated)"
- Coverage: "+14 blind spot scenarios"
- Anti-patterns: "2 → 0 (fixed)"

**Scope Metrics:**
- Files changed: "47 files"
- Tests migrated: "189 test cases → 61 optimized cases"
- LOC: "-1,247 LOC (removed redundancy)"
- PRs created: "5 PRs merged"

**Impact Metrics:**
- Users affected: "All Security Solution engineers (30+ devs)"
- Time saved: "6hr/week team time saved"
- Risk mitigated: "Eliminated flaky CI blocker"

---

### Step 5: Write to Promotion Log (1 min)

**Goal:** Append to `~/.cursor/promotion-evidence.md` with structured entry.

**File structure:**

```markdown
# Promotion Evidence Log

Last updated: [Today's date]

**Target Role:** [Your target role]
**Current Progress:** [Category scorecards - auto-updated]

---

## Recent Achievements (Last 30 Days)

### 2026-03-20 — Strategic Test Suite Optimization via @cypress-to-scout-migrator

**Category:** Technical Leadership, Strategic Delivery

**Challenge:**
Security Solution had 47 Cypress tests with 28% duplication rate, expensive setup (360s overhead), and 14 blind spot scenarios. Tests took 9.5min to run sequentially, blocking CI pipeline.

**Approach:**
Built intelligent migration agent that analyzes entire test coverage holistically (not 1:1 conversion). Identified redundancy patterns, consolidated via `test.step()`, applied global setup hooks, and filled coverage gaps with RBAC + error path tests. Leveraged Scout/Playwright best practices (parallelism, DRY page objects, component-specific readiness signals).

**Impact:**
- Performance: 9.5min → 3.2min execution (66% reduction)
- Setup optimization: 360s → 60s (83% reduction)
- Test count: 47 → 28 (-40% via consolidation)
- Coverage: +14 blind spot scenarios (RBAC, error paths)
- Quality: 0 anti-patterns (fixed `globalLoadingIndicator`, manual waits)
- Team impact: All Security engineers benefit from faster, more reliable tests

**Artifacts:**
- Agent: `~/.agents/skills/cypress-to-scout-migrator/SKILL.md`
- Demo: `~/.agents/skills/cypress-to-scout-migrator/DEMO_OUTPUT.md`
- [Documentation](link-when-PR-created)

**Competency Alignment:**
- **Technical Leadership:** Designed reusable migration framework with optimization patterns (global setup, test.step consolidation, DRY enforcement)
- **Strategic Delivery:** Led quality improvement initiative affecting entire Security Solution test suite, unblocking CI pipeline

---

[... more entries]
```

---

## Auto-Tracking After Common Tasks

### After Eval Work

**Trigger:** User says "eval pass rate", "100% pass rate", "eval results"

**Auto-generate entry:**
```markdown
### [Date] — Eval Pass Rate Improvement: [Suite Name]

**Category:** Problem Solving & Impact, Technical Leadership

**Challenge:**
[Suite name] eval suite failing at [X]% pass rate. Root causes: [identified issues].

**Approach:**
- Root cause analysis via OTEL traces
- Fixes applied: [list]
- Adaptive loop converged after [N] iterations

**Impact:**
- Pass rate: [X]% → 100% (+[Y]%)
- Convergence time: [N] iterations
- Root causes fixed: [count]

**Competency Alignment:**
- **Problem Solving & Impact:** Systematic debugging with quantified improvement
- **Technical Leadership:** Applied framework-level debugging tools
```

### After Test Migration

**Trigger:** User says "migrated", "Cypress to Scout", "test migration"

**Auto-generate entry:**
```markdown
### [Date] — Test Migration: [Plugin/Feature]

**Category:** Strategic Delivery, Technical Leadership

**Challenge:**
[N] Cypress tests with [issues: flakiness, duplication, slow setup].

**Approach:**
- Analyzed coverage, identified [X] redundant tests
- Consolidated via `test.step()`, applied Scout best practices
- Filled [Y] blind spot scenarios

**Impact:**
- Execution time: [Before] → [After] ([%] reduction)
- Test count: [Before] → [After] ([%] reduction)
- Coverage: +[Y] scenarios
- Quality: [anti-patterns] → 0

**Competency Alignment:**
- **Strategic Delivery:** Led migration with measurable efficiency gains
- **Technical Leadership:** Established patterns for future migrations
```

### After CI/CD Optimization

**Trigger:** User says "CI fixed", "Buildkite", "flake eliminated"

**Auto-generate entry with CI impact analysis:**
```markdown
### [Date] — CI/CD Stability Improvement

**Category:** Problem Solving & Impact, Strategic Delivery

**Challenge:**
CI pipeline failing at [X]% rate. Root causes: [flaky tests, memory issues, etc.].

**Approach:**
- Identified [N] flaky tests via Buildkite logs
- Applied fixes: [list]
- Added pre-flight checks to prevent future failures

**Impact (with CI metrics):**
- CI pass rate: [X]% → [Y]% (+[Z]%)
- Build time: [Before] → [After] ([%] reduction)
- Agent hours saved: [calc from parallelism changes]
- Flake rate: [X]% → [Y]% (from Buildkite Analytics)
- Team unblocked: [N] engineers
- Cost savings: [agent-hours/week × cost/hour]

**CI Evidence:**
- PR: [link with Buildkite checks]
- Before build: [link to slow/flaky build]
- After build: [link to fast/stable build]
- Buildkite Analytics: [flake rate trend if available]

**Competency Alignment:**
- **Problem Solving & Impact:** Eliminated CI blocker affecting entire team, quantified via Buildkite metrics
- **Strategic Delivery:** Improved developer velocity with measurable cost savings
```

**How to extract CI metrics:**
1. Get PR number: `gh pr view --json number`
2. Get Buildkite build URLs: `gh pr checks --json name,detailsUrl`
3. Compare timing: Open "before" and "after" Buildkite builds, compare duration
4. Calculate agent savings: (agents × time saved per agent × builds per week)
5. Check Analytics tab in Buildkite for flake rate trends

### After Framework Work

**Trigger:** User says "framework", "architecture", "RFC", "proposal"

**Auto-generate entry:**
```markdown
### [Date] — [Framework/System Name]

**Category:** Technical Leadership, Influence & Communication

**Challenge:**
[Problem the framework solves].

**Approach:**
- Designed architecture: [key decisions]
- Built initial implementation: [scope]
- Documented patterns: [guides created]

**Impact:**
- Adoption: [N] teams/engineers using
- Time saved: [metric]
- Quality improved: [metric]

**Competency Alignment:**
- **Technical Leadership:** Designed and built reusable system
- **Influence & Communication:** Documented patterns, influenced team adoption
```

---

## Output: Promotion Evidence Entry

**Always output the generated entry for user review before writing to file.**

**Ask user:**
```
📊 Promotion Evidence Entry Generated

[Show entry]

---

**Questions:**
1. Does this accurately reflect your work?
2. Any metrics I missed?
3. Any artifacts to add (PR links, docs)?
4. Append to promotion log? (y/n)
```

**If approved, write to:**
```
~/.cursor/promotion-evidence.md
```

---

## Integration with Other Skills

- **kbn-evals-debugger** - Auto-tracks after eval pass rate improvements
- **cypress-to-scout-migrator** - Auto-tracks after migration completion
- **ci-babysitter** - Auto-tracks after CI stability improvements
- **spike-builder** - Auto-tracks after spike completion
- **openspec-*** - Auto-tracks after complex feature delivery

---

## Success Metrics

- **Evidence captured:** 90%+ of non-trivial tasks logged
- **Metrics included:** 100% of entries have quantifiable impact
- **Competency alignment:** Every entry maps to ≥1 competency
- **Promotion readiness:** Evidence log ready for review at any time

---

## Promotion Progress Dashboard (Auto-Updated)

**Track progress across competencies:**

```markdown
## Competency Scorecard (Auto-Updated)

### Technical Leadership
- **Recent Evidence:** [Count last 30 days]
- **Key Achievements:** [Top 3]
- **Strength Level:** [Growing / Strong / Exceptional]

### Problem Solving & Impact
- **Recent Evidence:** [Count last 30 days]
- **Key Achievements:** [Top 3]
- **Strength Level:** [Growing / Strong / Exceptional]

### Influence & Communication
- **Recent Evidence:** [Count last 30 days]
- **Key Achievements:** [Top 3]
- **Strength Level:** [Growing / Strong / Exceptional]

### People Development
- **Recent Evidence:** [Count last 30 days]
- **Key Achievements:** [Top 3]
- **Strength Level:** [Growing / Strong / Exceptional]

### Strategic Delivery
- **Recent Evidence:** [Count last 30 days]
- **Key Achievements:** [Top 3]
- **Strength Level:** [Growing / Strong / Exceptional]
```

---

## Example Full Entry

```markdown
### 2026-03-20 — Agent Builder Eval Framework: 100% Pass Rate Achievement

**Category:** Technical Leadership, Problem Solving & Impact

**Challenge:**
Agent Builder eval suite failing at 70% pass rate. Root causes: tool schema complexity (3 discriminated unions causing confusion), evaluator threshold too strict, and 14 missing test scenarios (RBAC, error paths). Traditional debugging would take days of manual iteration.

**Approach:**
Built `@kbn-evals-debugger` agent that:
1. Queries Kibana evals API + pulls OTEL traces for failure analysis
2. Categorizes root causes: TOOL_SCHEMA_COMPLEXITY, EVALUATOR_THRESHOLD_TOO_STRICT, MISSING_TEST_COVERAGE
3. Auto-applies fixes: simplified tool schema (3 unions → 1), recalibrated evaluator thresholds (+0.05), added 14 scenarios
4. Adaptive loop: converges after 2 consecutive 100% passes (not fixed iteration count)
5. Logs conservative thresholds for future review when framework stabilizes

**Impact:**
- **Pass rate:** 70% → 100% (+30%, 3 iterations)
- **Root causes fixed:** Tool schema, evaluator, coverage (3 categories)
- **Convergence efficiency:** 2 clean passes = stop (no over-iteration)
- **Framework innovation:** Adaptive loop with conservative calibration
- **Team impact:** Reusable pattern for all Agent Builder evals (30+ eval suites)
- **Time saved:** 3 iterations vs 10+ manual iterations (70% reduction)

**Artifacts:**
- Agent: `~/.agents/skills/kbn-evals-debugger/SKILL.md`
- Testing guide: `~/.agents/skills/kbn-evals-debugger/TESTING.md`
- Trace analysis patterns: Elasticsearch OTEL query examples

**Competency Alignment:**
- **Technical Leadership:** Designed adaptive debugging framework with convergence logic, not fixed-iteration scripts. Introduced conservative threshold calibration pattern (mean - 1σ) to prevent brittle evals during active framework development.
- **Problem Solving & Impact:** Achieved 100% pass rate via systematic root cause analysis across 3 categories (schema, evaluator, coverage). Quantified improvement (+30%) and efficiency gain (-70% iterations).
```
