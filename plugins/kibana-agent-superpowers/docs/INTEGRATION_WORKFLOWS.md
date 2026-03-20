# Agent Integration Workflows

**Visual guide to how agents work together**

---

## Workflow Diagrams

### Workflow 1: Feature Development (End-to-End)

```mermaid
graph TD
    A[User: Implement new feature] --> B[@openspec-advisor]
    B -->|Complex: 3+ files| C[OpenSpec Workflow]
    B -->|Simple: 1-2 files| D[Direct Implementation]

    C --> E[/openspec-new-change]
    E --> F[/openspec-apply-change]
    F --> G[@api-test-generator]
    F --> H[@type-healer]
    F --> I[@security-reviewer]

    D --> G
    D --> H
    D --> I

    G --> J[@doc-generator]
    H --> J
    I --> J

    J --> K[@ci-guardian GUARD]
    K -->|Pre-push validation| L{All pass?}
    L -->|Yes| M[git push]
    L -->|No| N[Auto-fix & retry]
    N --> K

    M --> O[@ci-guardian Monitor]
    O -->|CI fails| P[@flake-hunter / @type-healer]
    P --> Q[Auto-fix & re-trigger]

    O -->|CI passes| R[@promotion-evidence-tracker]
    R --> S[Evidence logged ✅]
```

---

### Workflow 2: Test Migration (Strategic Optimization)

```mermaid
graph TD
    A[User: Migrate Cypress to Scout] --> B[@cypress-to-scout-migrator]

    B --> C[Phase 1: Coverage Analysis]
    C --> D{User approval?}
    D -->|No| E[Adjust scope]
    E --> C
    D -->|Yes| F[Phase 2: Implementation]

    F --> G[@api-test-generator]
    G --> H[Generate API tests for wrong-layer scenarios]

    F --> I[@flake-hunter]
    I --> J[Run new tests 50x, fix flakes]

    F --> K[@perf-optimizer]
    K --> L[Suggest parallelism improvements]

    J --> M[Phase 3: Validation]
    L --> M
    H --> M

    M --> N[@pr-optimizer]
    N --> O[Batch into reviewable PRs]

    O --> P[@ci-guardian]
    P --> Q[Monitor CI]

    Q --> R[@promotion-evidence-tracker]
    R --> S[Log migration evidence with metrics]
```

---

### Workflow 3: CI/CD Stability (Auto-Recovery)

```mermaid
graph TD
    A[git push] --> B[@ci-guardian GUARD]

    B --> C{Pre-flight pass?}
    C -->|No| D{Error type?}
    D -->|Type errors| E[@type-healer]
    D -->|Lint errors| F[ESLint --fix]
    D -->|Test failures| G[Run affected tests]

    E --> H[Auto-fix & retry]
    F --> H
    G --> H
    H --> C

    C -->|Yes| I[Push proceeds]
    I --> J{Draft PR?}
    J -->|Yes| K[Auto-comment /ci]

    K --> L[Monitor Buildkite]
    L --> M{CI status?}

    M -->|Failed| N{Failure type?}
    N -->|Type errors| E
    N -->|Flaky test| O[@flake-hunter]
    N -->|Performance| P[@perf-optimizer]
    N -->|Security| Q[@security-reviewer]

    O --> R[Apply fix]
    P --> R
    Q --> R
    R --> S[Re-push, re-trigger /ci]
    S --> L

    M -->|Passed| T[@promotion-evidence-tracker]
    T --> U[Check if significant work]
    U -->|Yes| V[Generate evidence with CI metrics]
```

---

### Workflow 4: Eval Framework Development

```mermaid
graph TD
    A[Create eval.spec.ts] --> B[Run eval locally]
    B --> C{Pass rate?}

    C -->|<100%| D[@kbn-evals-debugger]
    D --> E[Query Kibana evals API]
    E --> F[Pull OTEL traces from ES]
    F --> G[Analyze root causes]

    G --> H{Root cause?}
    H -->|Tool schema| I[Simplify schema]
    H -->|Evaluator| J[Recalibrate threshold]
    H -->|Coverage| K[Add test scenarios]

    I --> L[Auto-apply fix]
    J --> L
    K --> L

    L --> M[Re-run eval]
    M --> N{Pass rate?}
    N -->|100%| O[Re-run for confirmation]
    O --> P{2nd 100%?}
    P -->|Yes| Q[CONVERGED ✅]
    P -->|No| G
    N -->|<100%| G

    Q --> R[@doc-generator]
    R --> S[Document eval patterns]

    S --> T[@promotion-evidence-tracker]
    T --> U[Log as Technical Leadership + Problem Solving]
```

---

### Workflow 5: Spike Development (Production-Ready)

```mermaid
graph TD
    A[User: Build spike for X] --> B[@spike-builder]

    B --> C[Phase 1: Planning]
    C --> D[Phase 2: Feature Flag]
    D --> E[Phase 3: E2E Implementation]

    E --> F[@api-test-generator]
    F --> G[Generate API tests]

    E --> H[@type-healer]
    H --> I[Fix type errors during dev]

    E --> J[@monitoring-setup]
    J --> K[Add APM tracing]

    G --> L[Phase 4: Testing]
    I --> L
    K --> L

    L --> M[Phase 5: Comprehensive QA]
    M --> N[Step 5.1: E2E Test Coverage]
    M --> O[Step 5.2: Manual UI Testing]

    O --> P{Bugs found?}
    P -->|Yes| Q[Step 5.3: Bug Fixing]
    Q --> R[@type-healer / @accessibility-auditor]
    R --> O

    P -->|No| S[Step 5.4: Final Sign-Off]

    S --> T[@accessibility-auditor]
    T --> U[WCAG 2.1 validation]

    S --> V[@doc-generator]
    V --> W[Generate spike docs + diagrams]

    W --> X[@promotion-evidence-tracker]
    X --> Y[Log as Technical Leadership]

    Y --> Z[Phase 8: PR Creation]
    Z --> AA[@pr-optimizer]
    AA --> AB[Validate PR structure]
```

---

## Real-World Integration Examples

### Example 1: New API Endpoint (Complete Coverage)

**User:** "Add GET /api/alerts/{id}/enrich endpoint"

**Automatic workflow:**

```typescript
// 1. Implementation (manual)
// You write route definition in alerts.ts

// 2. @api-test-generator (auto-invoked)
→ Parses route definition
→ Generates test suite:
   ✅ Valid request (admin) → 200
   ✅ Valid request (viewer) → 200
   ✅ No auth → 401
   ✅ Non-existent alert → 404
   ✅ Invalid ID format → 400
   ✅ Viewer with correct privilege → 200
   ✅ Viewer without privilege → 403

// 3. @security-reviewer (auto on new route)
→ Scans for:
   ✅ authz configuration present
   ✅ Input validation (Zod schema)
   ✅ No XSS vectors
→ Report: "✅ No security issues"

// 4. @doc-generator (manual invocation)
→ "Generate docs for alerts API"
→ Generates:
   ✅ OpenAPI spec (alerts.openapi.yaml)
   ✅ Markdown reference (alerts_api.md)
   ✅ curl examples

// 5. @type-healer (auto on type errors)
→ Fixes any TS errors introduced

// 6. @ci-guardian (auto on git push)
→ Pre-flight: type check + lint + tests
→ Push succeeds
→ Monitors CI
→ "/ci" auto-commented (draft PR)

// 7. @promotion-evidence-tracker (auto after merge)
→ Analyzes PR:
   - New endpoint with RBAC coverage
   - 15+ test scenarios generated
   - Security validated
   - Documented
→ Logs as Technical Leadership
```

**Hands-on time:** 2-3 hours
**Agent-automated:** 60% of work
**Quality:** Production-ready with complete coverage

---

### Example 2: Eval Suite Optimization (Adaptive)

**User:** "The kb eval suite is at 75% - need to hit 100%"

**Automatic workflow:**

```typescript
// 1. @kbn-evals-debugger (auto-activated)
→ Queries: http://localhost:5601/api/evals/runs?suite=kb
→ Pulls OTEL traces from ES

// Iteration 1
→ Root causes found:
   - TOOL_SCHEMA_COMPLEXITY (3 discriminated unions)
   - EVALUATOR_THRESHOLD_TOO_STRICT (0.95 too high)
   - MISSING_TEST_COVERAGE (5 RBAC scenarios)

→ Auto-applies fixes:
   - Simplifies tool schema (3 unions → 1)
   - Recalibrates evaluator (0.95 → 0.90)
   - Adds 5 test scenarios

→ Re-runs eval: 75% → 92% ✅

// Iteration 2
→ Root causes:
   - EVALUATOR_REASONING_MISMATCH (wrong evaluator type)

→ Auto-swaps evaluator:
   - factual_accuracy → tool_call_correctness

→ Re-runs eval: 92% → 100% ✅

// Iteration 3 (verification)
→ Re-runs eval: 100% ✅ (2nd consecutive clean pass)
→ CONVERGED!

→ Logs thresholds:
   ~/.agents/threshold-calibrations.log

// 2. @doc-generator (optional)
→ "Document the eval patterns we used"
→ Creates: docs/kb_eval_debugging.md

// 3. @promotion-evidence-tracker (auto)
→ Logs evidence:
   Category: Technical Leadership, Problem Solving & Impact
   Impact: 75% → 100% (+25%), 2 iterations
   Innovation: Adaptive convergence, conservative calibration
```

**Hands-on time:** 30 min (review + approve)
**Agent-automated:** 90% of debugging
**Result:** 100% pass rate with evidence

---

### Example 3: Cross-Repo Version Update (Automated)

**User:** "Update Node to 20.12.0 in elastic-cursor-plugin"

**Automatic workflow:**

```bash
# 1. Manual change
cd ~/Projects/elastic-cursor-plugin
# Edit Dockerfile: FROM node:20.11.0 → node:20.12.0
git commit -m "chore: update Node to 20.12.0"

# 2. @cross-repo-sync (auto-triggered)
→ Detects Docker version change
→ Identifies sibling repos:
   - cursor-plugin-evals
   - agent-skills-sandbox

→ For each repo:
   ✅ Clones (if not local)
   ✅ Creates branch: sync/node-20.12.0
   ✅ Updates Dockerfile
   ✅ Commits: "chore: sync Node 20.12.0 from elastic-cursor-plugin"
   ✅ Pushes to origin
   ✅ Creates PR via gh CLI

→ Monitors CI for all PRs (parallel)
→ Reports status:
   ✅ cursor-plugin-evals: CI passed
   ✅ agent-skills-sandbox: CI passed

→ Notifies: "All sync PRs ready for merge"

# 3. @ci-guardian (if CI fails)
→ Auto-fixes failures
→ Re-triggers CI

# 4. @promotion-evidence-tracker
→ Logs as Strategic Delivery (cross-repo consistency)
```

**Hands-on time:** 5 min (initial change + review PRs)
**Agent-automated:** 95% of sync work
**Result:** Consistent versions across 3 repos

---

## Agent Orchestration Patterns

### Pattern 1: Hub-and-Spoke (Central Orchestrator)

**Orchestrator:** @spike-builder

**Spokes:**
- @api-test-generator (Phase 4: Testing)
- @accessibility-auditor (Phase 5: QA)
- @doc-generator (Phase 6: Documentation)
- @promotion-evidence-tracker (Phase 7: Evidence)

**When to use:** Complex workflows with defined phases

---

### Pattern 2: Pipeline (Linear Chain)

**Example:** Code quality improvement

```
@refactor-assistant
  → Refactors code
  → @type-healer (fix type errors)
    → @security-reviewer (validate no regressions)
      → @doc-generator (update docs)
        → @pr-optimizer (structure PR)
          → @ci-guardian (validate & monitor)
            → @promotion-evidence-tracker (log evidence)
```

**When to use:** Sequential dependencies (each step needs previous output)

---

### Pattern 3: Fan-Out (Parallel Execution)

**Example:** Comprehensive PR review

```
User: "Review this PR comprehensively"

Parallel execution:
├─ @type-healer (type errors)
├─ @security-reviewer (vulnerabilities)
├─ @accessibility-auditor (a11y issues)
├─ @refactor-assistant (code quality)
└─ @doc-generator (documentation gaps)

Aggregate results → Comprehensive review report
```

**When to use:** Independent checks, fast feedback

---

### Pattern 4: Conditional Router (Based on Context)

**Router:** @ci-guardian

**Routes to:**
```
CI failure detected
  ├─ Type errors? → @type-healer
  ├─ Flaky test? → @flake-hunter
  ├─ Performance? → @perf-optimizer
  ├─ Security? → @security-reviewer
  └─ Unknown? → Escalate with logs
```

**When to use:** Dynamic routing based on failure type

---

### Pattern 5: Feedback Loop (Adaptive Convergence)

**Example:** Eval optimization

```
@kbn-evals-debugger
  → Run eval (70% pass rate)
  → Analyze failures
  → Apply fixes
  → Re-run eval (85% pass rate)
  → Analyze remaining failures
  → Apply fixes
  → Re-run eval (100% pass rate)
  → Re-run eval (100% pass rate)
  → CONVERGED (2 consecutive clean passes)
```

**When to use:** Problems requiring iterative refinement

---

## Agent Trigger Matrix

**Use this to understand which agent handles what:**

| Task Type | Primary Agent | Supporting Agents |
|-----------|--------------|-------------------|
| **New Feature** | @openspec-advisor | @spike-builder, @api-test-generator, @doc-generator |
| **Type Errors** | @type-healer | @ci-guardian |
| **Flaky Tests** | @flake-hunter | @cypress-to-scout-migrator, @perf-optimizer |
| **Slow Build** | @perf-optimizer | @bundle-analyzer |
| **Slow Tests** | @perf-optimizer | @cypress-to-scout-migrator |
| **Slow CI** | @perf-optimizer | @ci-guardian, @flake-hunter |
| **Test Migration** | @cypress-to-scout-migrator | @flake-hunter, @perf-optimizer, @api-test-generator |
| **Eval Debugging** | @kbn-evals-debugger | @doc-generator, @promotion-evidence-tracker |
| **Spike/PoC** | @spike-builder | @api-test-generator, @accessibility-auditor, @doc-generator |
| **Code Quality** | @refactor-assistant | @type-healer, @security-reviewer |
| **Security Review** | @security-reviewer | @api-authz (skill) |
| **A11y Review** | @accessibility-auditor | @spike-builder (QA phase) |
| **API Tests** | @api-test-generator | @test-data-builder |
| **Documentation** | @doc-generator | @spike-builder, @release-notes-generator |
| **PR Review** | @pr-optimizer | @type-healer, @security-reviewer, @accessibility-auditor |
| **Version Sync** | @cross-repo-sync | @ci-guardian |
| **Evidence Tracking** | @promotion-evidence-tracker | All agents (provide context) |
| **Skill Management** | @skill-curator | skill-security-review (skill) |
| **Git Operations** | @git-workflow-helper | @code-archaeology |
| **Dependency Updates** | @dependency-updater | @ci-guardian |
| **i18n** | @i18n-helper | @accessibility-auditor |
| **Monitoring** | @monitoring-setup | @spike-builder |

---

## Hands-Free Automation (Zero Manual Intervention)

### Setup 1: Auto-Evidence Collection

**Enable once:**
```
@promotion-evidence-tracker is configured with auto-triggers:
- After eval work (detects "100%", "pass rate")
- After test migrations (detects "Cypress", "Scout", "migrated")
- After CI work (detects "Buildkite", "CI", "flake")
- After spike completion (invoked by spike-builder)
```

**Benefit:** Work normally, evidence collected automatically

**Example timeline:**
```
Monday: Debug eval → @kbn-evals-debugger → @promotion-evidence-tracker logs
Tuesday: Migrate tests → @cypress-to-scout-migrator → @promotion-evidence-tracker logs
Wednesday: Fix CI → @ci-guardian → @promotion-evidence-tracker logs
Friday: Review promotion-evidence.md → 3 entries auto-populated ✅
```

---

### Setup 2: Auto-CI Protection (GUARD Mode)

**Enable once:**
```
@ci-guardian GUARD mode active via ci-babysitter settings

Every git push:
1. Pre-flight validation (auto)
2. CI monitoring (auto)
3. Failure detection (auto)
4. Auto-fix attempts (auto)
5. Re-trigger CI (auto)
6. Notify only if needs manual intervention
```

**Benefit:** CI failures prevented or fixed without manual work

**Example:**
```
Monday: 5 pushes
- 3 prevented (pre-flight caught errors, auto-fixed)
- 2 pushed, both green (no failures)
- 0 manual interventions needed ✅
```

---

### Setup 3: Auto-Documentation (Keep Docs Fresh)

**Enable once:**
```
@doc-generator auto-invoked by:
- @spike-builder (Phase 6)
- Manual: /doc-generator

Keeps docs in sync:
- API changes → OpenAPI spec updated
- Code structure changes → Architecture diagrams updated
- Test changes → User guide updated
```

**Benefit:** Documentation never stale

---

## Customization & Extension

### Add Custom Integration

**Example:** Make @skill-curator auto-run after creating skills

```yaml
# In skill-creator/SKILL.md, add to end:

After skill creation:
1. Save skill to ~/.agents/skills/<name>/SKILL.md
2. Auto-invoke @skill-curator:
   - Security review
   - Similarity analysis
   - Convention compliance check
3. Report findings
4. Fix issues if any
5. Add to skill catalog
```

---

### Create Custom Agent Chain

**Example:** "Security-First Development" workflow

```markdown
# In ~/.agents/workflows/security-first-dev.md

When implementing any feature:

1. @openspec-advisor (planning)
2. Implementation (manual)
3. @security-reviewer (auto on API routes)
4. @type-healer (fix errors)
5. @api-test-generator (RBAC coverage)
6. @accessibility-auditor (a11y)
7. @doc-generator (security docs)
8. @ci-guardian (validation)

Required: Zero security findings before merge
```

---

## Performance Impact (Expected)

### Time Savings (Conservative Estimates)

| Agent | Tasks/Week | Time Saved per Task | Weekly Savings |
|-------|------------|---------------------|----------------|
| @type-healer | 5-10 | 15-30 min | 1.25-5 hr |
| @flake-hunter | 2-3 | 1-2 hr | 2-6 hr |
| @kbn-evals-debugger | 1-2 | 2-4 hr | 2-8 hr |
| @cypress-to-scout-migrator | 0.25 (monthly) | 40 hr | 10 hr/month |
| @ci-guardian (auto-fix) | 3-5 | 30-60 min | 1.5-5 hr |
| @api-test-generator | 2-4 | 30-45 min | 1-3 hr |
| @doc-generator | 1-2 | 1-2 hr | 1-4 hr |
| @perf-optimizer | 1 (monthly) | 4-8 hr | 1-2 hr/month |
| @promotion-evidence-tracker | Auto | 15 min/entry | 1-2 hr |
| Others (combined) | Varies | Varies | 5-10 hr |

**Total estimated savings:** **15-40 hr/week**

### Quality Improvements

| Metric | Before | After (1 month) | Improvement |
|--------|--------|-----------------|-------------|
| CI pass rate | 70-80% | 90-95% | +15-20% |
| Test flake rate | 8-12% | 1-3% | -75-85% |
| Type errors in CI | 15-20/week | 2-5/week | -75-85% |
| Security issues | 3-5/quarter | 0-1/quarter | -80-90% |
| Documentation staleness | 30-40% | 5-10% | -75% |
| Evidence collection | 50-60% | 95-100% | +40-50% |

---

## Troubleshooting Integration Issues

### Issue 1: Agents Conflict (Both Try Same Work)

**Symptom:** Two agents both analyzing same code

**Solution:**
```
1. Use explicit invocation: /specific-agent
2. Disable auto-trigger for one agent (edit SKILL.md)
3. Provide more specific context to route correctly
```

**Example:**
```
❌ "Review this code"
   → @refactor-assistant AND @type-healer both activate

✅ "Fix TypeScript errors in this code"
   → @type-healer activates only
```

---

### Issue 2: Agent Chain Breaks

**Symptom:** spike-builder doesn't invoke doc-generator

**Solution:**
```
1. Check agent output for invocation
2. Manually invoke skipped agent: /doc-generator
3. Report issue (may need skill update)
```

---

### Issue 3: Too Many Auto-Triggers

**Symptom:** Agents activating when not needed

**Solution:**
```
1. Be more specific in requests
2. Disable auto-triggers (edit SKILL.md)
3. Use explicit invocation when you want control
```

---

## Next Steps

### Week 1: Learn Core Agents
Focus on these 5:
1. @type-healer (daily use)
2. @ci-guardian (always active)
3. @kbn-evals-debugger (if doing evals)
4. @cypress-to-scout-migrator (if migrating tests)
5. @promotion-evidence-tracker (weekly reviews)

### Week 2: Explore Testing Agents
6. @flake-hunter
7. @api-test-generator
8. @test-data-builder
9. @accessibility-auditor

### Week 3: Explore Documentation Agents
10. @doc-generator
11. @release-notes-generator
12. @code-archaeology

### Week 4: Explore Quality Agents
13. @security-reviewer
14. @refactor-assistant
15. @perf-optimizer
16. @pr-optimizer

### Ongoing: Use As Needed
17. @spike-builder (monthly spikes)
18. @openspec-advisor (complex features)
19. @cross-repo-sync (version updates)
20. @skill-curator (quarterly review)

---

## Success Indicators

**After 1 week:**
- ✅ Used @type-healer 5+ times
- ✅ @ci-guardian prevented ≥1 CI failure
- ✅ @promotion-evidence-tracker logged ≥1 entry

**After 1 month:**
- ✅ Saved 15-40 hr from agent automation
- ✅ CI pass rate +15-20%
- ✅ Promotion evidence log has 8-12 entries
- ✅ Comfortable with 10+ agents

**After 3 months:**
- ✅ All 20 agents used at least once
- ✅ Custom agent chains established
- ✅ Time savings compound (25-47 hr/week)
- ✅ Workflow fully automated

---

Your complete workflow automation framework is ready! Start with the Top 5 agents and expand from there. 🚀
