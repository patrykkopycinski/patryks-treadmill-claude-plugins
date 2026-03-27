# Kibana Testing Tools

**9 specialized skills for testing and QA automation**

Debug evals, migrate Cypress to Scout, hunt flakes, analyze coverage, generate API tests, build mock data, heal selectors, verify in-browser, and review eval vision alignment.

---

## Skills

### @kbn-evals-debugger
**End-to-end debugging for @kbn/evals framework**

Analyzes eval failures from Elasticsearch (OTEL traces) or LangSmith, identifies root causes (tool schema, prompt misalignment, evaluator logic), auto-applies fixes, and runs adaptive convergence loops until 100% pass rate.

**Use when:** Eval suite failing | "Debug evals" | "Improve pass rate to 100%"

**Impact:** 70% to 100% pass rate in 3-5 iterations

---

### @cypress-to-scout-migrator
**Strategic test suite optimizer (not 1:1 converter)**

Analyzes entire Cypress test coverage to identify blind spots, refactors for DRY principles and performance (combines setup phases, removes duplication), then generates optimized Scout suites.

**Use when:** "Migrate Cypress to Scout" | Large Cypress suite migration

**Impact:** 66% faster execution | Reduced duplication

---

### @flake-hunter
**Systematic flaky test debugger**

Reproduces flakes (50-100 runs), identifies root causes (race conditions, non-deterministic data, test pollution, external dependencies, timing issues), applies targeted fixes, verifies with another 50-100 runs.

**Use when:** "Debug flaky test" | CI test intermittently failing | Flake rate >5%

**Impact:** -75-85% flake rate

---

### @test-coverage-analyzer
**Find untested code paths with AST analysis**

Analyzes Jest coverage reports, maps Scout tests to source files, traverses AST to identify untested paths, and generates targeted test recommendations.

**Use when:** "Analyze coverage" | Finding blind spots | Coverage <80%

**Impact:** Identify 20-40% more edge cases

---

### @api-test-generator
**Generate Scout API tests from Kibana routes**

Parses versioned route definitions, extracts request/response schemas (Zod, @kbn/config-schema), generates 15+ test cases per route including RBAC coverage and edge cases.

**Use when:** "Generate API tests for create_rule.ts" | New API route | Missing test coverage

**Impact:** Complete API test coverage in minutes vs hours

---

### @test-data-builder
**Mock data generation with faker.js**

Generates mocks from TypeScript interfaces, creates ES archives for Scout tests, builds reusable factory patterns, applies schema-driven constraints, uses deterministic seeded RNG.

**Use when:** "Generate test data for Alert interface" | "Create ES archive" | Need realistic mocks

---

### @test-selector-healer
**Fix tests by adding missing data-test-subj attributes**

When tests fail due to brittle selectors, strict mode violations, or missing elements, this skill fixes the root cause by adding `data-test-subj` attributes to UI source components instead of piling up fragile workarounds in test code.

**Use when:** "Strict mode violation" | "Element not found" | Brittle CSS selectors in tests

---

### @qa-browser-verification
**Verify features work by interacting with live UI**

Systematically verifies implemented functionality by navigating the app in a browser, interacting with elements, and checking expected behaviors. Produces structured QA reports with pass/fail evidence.

**Use when:** After implementing features | "Verify it works" | "QA this" | Before claiming work is complete

---

### @kbn-evals-vision-reviewer
**Review @kbn/evals changes against strategic vision**

Checks that changes follow the trace-first, Elastic-native direction, use correct ownership boundaries, respect the data model and evaluation entry points, and avoid deepening Phoenix coupling.

**Use when:** Reviewing PRs touching @kbn/evals | "Check evals alignment" | Eval framework changes

---

## Installation

### Via Marketplace

```
/plugin marketplace add patrykkopycinski/patryks-treadmill-claude-plugins
/plugin install kibana-testing-tools@patryks-treadmill
```

### Manual

```bash
cd ~/.claude/plugins
git clone https://github.com/patrykkopycinski/patryks-treadmill-claude-plugins treadmill
```

Restart Claude Code or run `/reload-plugins`.

---

## Integration

**Works with:**
- `@type-healer` - Fix test type errors
- `@security-reviewer` - Security test validation
- `@ci-babysitter` - Auto-fix failing tests in CI
- `@perf-optimizer` - Optimize test execution speed

---

## Expected Impact

| Metric | Improvement |
|--------|-------------|
| Test flake rate | -75-85% |
| CI pass rate | +15-20% |
| Test execution time | -40-66% (optimized suites) |
| Coverage blind spots | +20-40% identified |
| Time saved/week | 10-15 hours |

---

**Part of [Patryk's Treadmill](https://github.com/patrykkopycinski/patryks-treadmill-claude-plugins)**
