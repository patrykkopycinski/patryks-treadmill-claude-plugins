---
name: cypress-to-scout-migrator
description: >
  Strategic test suite optimizer for Cypress→Scout migration. Analyzes entire test coverage, identifies blind spots,
  refactors for performance and DRY principles, then generates optimized Scout suites. Not a 1:1 converter.
trigger: |
  - "migrate cypress tests to scout"
  - "optimize and migrate cypress to scout"
  - "scout migration for [plugin/solution]"
  - "analyze cypress test coverage for migration"
  - "refactor cypress tests before migration"
examples:
  - input: "Migrate all Cypress tests in x-pack/solutions/security to Scout with optimization"
    output: "Maps 47 .cy.ts files to feature coverage matrix, identifies 3 duplicate scenarios and 12 blind spots, proposes optimized 28-test suite (consolidates 19 redundant tests into 6 multi-step flows), generates implementation plan"
  - input: "Optimize and convert the authentication tests to Scout"
    output: "Analyzes 8 auth Cypress tests, discovers they all test login form with single assertions, proposes 1 comprehensive multi-step test + 2 error path tests, shows 75% reduction in test execution time"
---

# @cypress-to-scout-migrator

**Purpose:** Strategic test suite optimizer that analyzes Cypress test coverage holistically, identifies optimization opportunities and blind spots, then generates performant, DRY Scout test suites. This is NOT a 1:1 migrator—it's a quality upgrade.

**Context:** Kibana is migrating from Cypress to Scout. This is an opportunity to not just convert tests, but to optimize them for performance, maintainability, and coverage. You want to leverage Scout/Playwright best practices (test.step, parallelism, DRY) while catching blind spots in existing coverage.

**Philosophy:**
- **Quality over quantity**: Consolidate redundant tests into multi-step flows
- **Coverage-first**: Map functionality, not files—identify gaps before migrating
- **Performance-aware**: Minimize setup overhead, maximize parallel execution
- **DRY enforcement**: Reuse fixtures/page objects, don't duplicate selectors

---

## When to Use

**Automatic activation triggers:**
- User mentions "migrate cypress", "optimize cypress migration"
- User asks about test coverage analysis or blind spot detection
- User wants to refactor tests before Scout migration
- User asks to generate a migration plan for a plugin/solution

**Manual invocation:**
```
/cypress-to-scout-migrator
```

---

## Core Workflow

### Phase 1: Coverage Discovery & Optimization Analysis (15-20 min)

**Goal:** Build a complete feature coverage map, identify redundancy and blind spots, then design an optimized test suite.

#### Step 1.1: Discover All Cypress Tests

```bash
find x-pack/{plugins,solutions}/<target-path> -name "*.cy.ts" -type f
```

#### Step 1.2: Extract Feature Coverage Matrix

**For each .cy.ts file, extract:**
1. **Features tested**: What UI/API functionality is covered?
2. **User flows**: What multi-step scenarios are exercised?
3. **Assertions**: What behaviors are validated?
4. **Test setup**: What data/state is required? (archives, API calls, UI navigation)
5. **Test scope**: Single-feature or multi-feature?
6. **Auth/RBAC**: What roles are tested?
7. **Error paths**: Are failure scenarios covered?

**Build a coverage matrix:**

| Feature | User Flow | Assertions | Current Tests | Setup Cost | Redundancy? | Missing Coverage |
|---------|-----------|------------|---------------|------------|-------------|------------------|
| Alert triage | View alert details | Alert renders with correct fields | `alerts.cy.ts` (test 1), `alert_details.cy.ts` (test 2) | Medium (2 API calls) | ✅ YES (2 tests, same assertions) | Missing: 403 forbidden test |
| Alert triage | Assign alert to analyst | Assignment succeeds, assignee visible | `alerts.cy.ts` (test 3) | Medium (2 API calls) | ❌ NO | Missing: bulk assignment |
| Alert triage | Close alert with comment | Status=closed, comment visible | `alerts.cy.ts` (test 4) | Medium (2 API calls) | ❌ NO | — |
| Detection rules | Create custom rule | Rule saved, appears in list | `rules.cy.ts` (test 1), `rule_creation.cy.ts` (test 1) | High (3 API calls + archive load) | ✅ YES (2 tests, same flow) | Missing: duplicate name error, validation |
| Detection rules | Edit rule schedule | Schedule updated | `rules.cy.ts` (test 5) | High (3 API calls + archive load) | ❌ NO | — |
| Detection rules | Delete rule | Rule removed from list | MISSING | — | ❌ BLIND SPOT | — |

#### Step 1.3: Identify Optimization Opportunities

**1. Redundant Tests → Consolidate with test.step()**

**Pattern:** Multiple tests with same setup, single assertion each

**Example:**
```typescript
// ❌ Current: 5 separate tests, 5x setup overhead
test('can view alert details', async () => {
  await setup(); // 10s
  await expect(alertPanel).toBeVisible();
});

test('can assign alert', async () => {
  await setup(); // 10s (repeated!)
  await expect(assignButton).toBeEnabled();
});

// ✅ Optimized: 1 multi-step test, 1x setup
test('alert triage workflow', async ({ pageObjects }) => {
  await test.step('view alert details', async () => {
    await expect(alertPanel).toBeVisible();
  });

  await test.step('assign alert to analyst', async () => {
    await assignButton.click();
    await expect(assignee).toHaveText('Alice');
  });

  await test.step('close alert with comment', async () => {
    await closeButton.click();
    await expect(status).toHaveText('Closed');
  });
});
```

**Savings:** 80% reduction in execution time (1x setup vs 5x)

---

**2. Overlapping Coverage → Merge into Single Test**

**Pattern:** Different files testing same feature from slightly different angles

**Example:**
- `alerts.cy.ts` tests alert rendering
- `alert_details.cy.ts` tests same rendering with different data
- **Solution:** Merge into 1 test with multiple `test.step()` for data variations

---

**3. Missing Coverage (Blind Spots) → Add to Plan**

**Pattern:** Feature has create/edit but no delete/error path tests

**Common blind spots:**
- ❌ No "forbidden path" tests (viewer tries to edit → expects 403)
- ❌ No bulk operations (delete all, assign all)
- ❌ No validation error tests (duplicate name, invalid input)
- ❌ No edge cases (empty state, pagination, long lists)

**Action:** Add these scenarios to optimized suite

---

**4. Expensive Setup → Global Setup Hook**

**Pattern:** Tests load large archives or create complex data via UI

**Example:**
```typescript
// ❌ Current: 10 tests all load same 500MB archive in beforeEach
test.beforeEach(async ({ esArchiver }) => {
  await esArchiver.load('x-pack.es_archives.security'); // 50s per test!
});

// ✅ Optimized: Load once in global setup, shared across tests
// In scout.config.ts
globalSetupHook('Load security archive', async ({ esArchiver }) => {
  await esArchiver.loadIfNeeded('x-pack.es_archives.security'); // 50s once!
});
```

**Savings:** 90% setup time reduction (50s once vs 50s x 10 = 500s)

---

**5. Wrong Test Layer → Move to API Tests**

**Pattern:** UI test validating API response shape (should be API test)

**Example:**
```typescript
// ❌ Current: Slow UI test (5s)
test('alert enrichment shows correct data', async ({ page }) => {
  await page.goto('/alerts/123');
  const response = await page.evaluate(() => fetch('/api/alerts/123/enrich'));
  expect(response.body).toMatchObject({ /* exact schema */ });
});

// ✅ Optimized: Fast Scout API test (0.5s)
apiTest('returns enrichment data', async ({ apiClient }) => {
  const response = await apiClient.get('api/alerts/123/enrich');
  expect(response).toHaveStatusCode(200);
  expect(response.body).toMatchObject({ /* exact schema */ });
});
```

**Savings:** 10x faster, more reliable, correct test layer

---

**6. UI Setup → API Fixtures**

**Pattern:** Tests create data by clicking through forms (slow, brittle)

**Example:**
```typescript
// ❌ Current: Setup via UI (20s)
test.beforeEach(async ({ page }) => {
  await page.goto('/rules/create');
  await page.fill('[data-test-subj="ruleNameInput"]', 'Test Rule');
  await page.click('[data-test-subj="saveButton"]');
  // ... 10 more clicks
});

// ✅ Optimized: Setup via API (2s)
test.beforeEach(async ({ apiServices }) => {
  testRule = await apiServices.securitySolution.createRule({
    name: 'Test Rule',
    type: 'query',
    query: 'event.action: "process_start"',
  });
});
```

**Savings:** 90% setup time reduction, more reliable

---

#### Step 1.4: Generate Optimization Report

**Output format:**

````markdown
📊 Coverage Analysis: x-pack/solutions/security/plugins/security_solution

## Current State
- **Total Cypress tests:** 47 files, 189 test cases
- **Estimated execution time:** 12.5 minutes (sequential)
- **Test duplication rate:** 28% (53 redundant assertions)
- **Blind spots identified:** 14 missing scenarios

## Optimization Opportunities

### 1. Consolidate Redundant Tests (High Impact)
**Impact:** -19 tests, -6min execution time

| Feature | Current Tests | Optimized Tests | Savings |
|---------|---------------|-----------------|---------|
| Alert triage - view details | 3 tests (same setup) | 1 multi-step test | -2 tests, -40s |
| Rule creation | 5 tests (same setup) | 1 multi-step test | -4 tests, -2min |
| Timeline operations | 8 tests (same setup) | 2 multi-step tests | -6 tests, -3min |
| Case management | 11 tests (overlapping) | 4 multi-step tests | -7 tests, -1.5min |

### 2. Fix Expensive Setup (High Impact)
**Impact:** -4min setup overhead

| Issue | Current Cost | Optimized Approach | Savings |
|-------|-------------|-------------------|---------|
| 10 tests load `x-pack.es_archives.security` in beforeEach | 50s x 10 = 500s | Load once in global setup | -450s |
| 5 tests create users via UI | 20s x 5 = 100s | Use API in beforeEach | -75s |

### 3. Coverage Blind Spots (Critical)
**Action Required:** Add 14 missing test scenarios

| Feature | Missing Scenarios |
|---------|-------------------|
| Detection rules | Delete rule, duplicate name error, invalid config validation |
| Alerts | Bulk operations (assign all, close all), filter persistence |
| Timeline | Export timeline, import timeline, share timeline |
| Cases | Case attachments (add/remove), case status transitions, case tags |
| Endpoints | Endpoint isolation (success + error), endpoint policy change |

### 4. Wrong Test Layer (Medium Impact)
**Impact:** -2min execution time, +reliability

| Test | Current Layer | Correct Layer | Reason |
|------|---------------|---------------|--------|
| `alert_enrichment.cy.ts` | UI (validates API response shape) | Scout API test | No UI behavior, just data validation |
| `rule_execution_stats.cy.ts` | UI (checks exact aggregation values) | Scout API test | Testing API correctness, not UI |

### 5. Scout Best Practices Violations
**Fix during migration:**

- ❌ **Manual waits:** 23 tests use `cy.wait(5000)` → Replace with explicit readiness signals
- ❌ **Duplicate selectors:** Same `data-test-subj` hardcoded in 15 tests → Extract to page objects
- ❌ **No error path coverage:** 80% of tests only test happy path
- ❌ **Admin-only auth:** 35 tests use `loginAsAdmin()` → Use minimal RBAC roles
- ❌ **Setup via UI:** 18 tests create data by clicking through forms → Use API fixtures

## Proposed Optimized Suite

### Metrics
- **New test count:** 28 Scout spec files (61 test cases)
- **Execution time:** 4.2 minutes (parallel, 4 workers)
- **Coverage improvement:** +14 scenarios (blind spots), -53 redundant assertions
- **Test reduction:** -67% test count, -66% execution time
- **Quality improvements:**
  - ✅ All tests use `test.step()` for multi-step flows
  - ✅ All setup via API fixtures (fast, reliable)
  - ✅ Parallel-safe (isolated spaces via `spaceTest`)
  - ✅ DRY: shared page objects + fixtures
  - ✅ RBAC-aware: minimal permissions, forbidden path coverage

### Test Suite Breakdown

#### UI Tests (18 spec files, 42 test cases)
1. **Alert Triage Workflows** (3 files)
   - `alert_details_viewer.spec.ts` — view alert (happy + error), assignment, comments (multi-step)
   - `alert_triage_analyst.spec.ts` — bulk operations, filtering, status transitions
   - `alert_enrichment_ui.spec.ts` — UI rendering of enrichment data (NOT data correctness)

2. **Detection Rules** (4 files)
   - `rule_creation.spec.ts` — create custom rule (multi-step: config → schedule → save)
   - `rule_editing.spec.ts` — edit rule, duplicate name error, validation
   - `rule_list_operations.spec.ts` — filter, sort, bulk enable/disable
   - `rule_deletion.spec.ts` — delete single, bulk delete, forbidden path

3. **Timeline** (3 files)
   - `timeline_operations.spec.ts` — create, add events, filter, save (multi-step)
   - `timeline_sharing.spec.ts` — export, import, share
   - `timeline_viewer.spec.ts` — read-only view, forbidden edit path

4. **Cases** (5 files)
   - `case_creation.spec.ts` — create case, add description, save (multi-step)
   - `case_attachments.spec.ts` — add/remove attachments, forbidden path
   - `case_status_transitions.spec.ts` — open → in-progress → closed (multi-step)
   - `case_tags.spec.ts` — add/remove tags, tag filtering
   - `case_viewer.spec.ts` — read-only view, forbidden edit path

5. **Endpoints** (3 files)
   - `endpoint_isolation.spec.ts` — isolate endpoint (success + error scenarios)
   - `endpoint_policy.spec.ts` — apply policy, verify applied
   - `endpoint_list.spec.ts` — filter, sort, bulk operations

#### API Tests (10 spec files, 19 test cases)
1. **Alert Enrichment Data** — validate enrichment API responses (not UI)
2. **Rule Execution Stats** — validate aggregation correctness (not UI)
3. **Timeline Export Format** — validate export JSON schema
4. **Case API RBAC** — validate 403 responses for under-privileged roles
5. **Endpoint Isolation API** — validate isolation state transitions
6. ... (5 more API tests moved from UI layer)

---

## Next Step: Review & Approval

**Questions for you:**
1. **Approve consolidation strategy?** (19 redundant tests → 6 multi-step flows)
2. **Approve blind spot additions?** (14 new scenarios)
3. **Approve test layer moves?** (2 UI tests → Scout API tests)
4. **Any features to deprioritize?** (reduce scope if needed)

**Once approved**, I'll proceed to Phase 2: Implementation Plan.
````

---

### Phase 2: Implementation Planning (10 min)

**Goal:** Generate detailed implementation plan with pattern mappings, fixture/page object designs, and batch breakdown.

#### Step 2.1: Design Shared Abstractions

**1. Page Objects** (for DRY, reusable UI interactions)

```typescript
// test/scout_ui/pages/alert_details_page.ts
export class AlertDetailsPage {
  constructor(private readonly page: ScoutPage) {}

  async goto(alertId: string) {
    await this.page.goto(`/app/security/alerts/${alertId}`);
    await this.page.testSubj.waitForSelector('alertDetailsPanel-loaded', { state: 'visible' });
  }

  async assignToUser(username: string) {
    await this.page.testSubj.click('alertAssignButton');
    await this.page.testSubj.fill('assignUserInput', username);
    await this.page.testSubj.click('assignUserConfirm');
    await this.page.testSubj.waitForSelector('assignmentSuccessToast', { state: 'visible' });
  }

  async closeWithComment(comment: string) {
    await this.page.testSubj.click('alertCloseButton');
    await this.page.testSubj.fill('closeCommentInput', comment);
    await this.page.testSubj.click('closeAlertConfirm');
    await expect(this.page.testSubj.locator('alertStatus')).toHaveText('Closed');
  }
}
```

**2. API Services** (for setup/teardown)

```typescript
// test/scout_api/services/security_solution_service.ts
export class SecuritySolutionService {
  async createRule(config: RuleConfig) {
    const response = await this.apiClient.post('api/detection_engine/rules', {
      body: config,
      headers: COMMON_HEADERS,
    });
    return response.body;
  }

  async deleteRule(ruleId: string) {
    await this.apiClient.delete(`api/detection_engine/rules/${ruleId}`, {
      headers: COMMON_HEADERS,
    });
  }
}
```

**3. Fixtures** (for test setup/auth)

```typescript
// test/scout_ui/fixtures/index.ts
export const test = base.extend<{
  alertDetailsPage: AlertDetailsPage;
  securitySolutionService: SecuritySolutionService;
}>({
  alertDetailsPage: async ({ page }, use) => {
    await use(new AlertDetailsPage(page));
  },
  securitySolutionService: async ({ apiClient }, use) => {
    await use(new SecuritySolutionService(apiClient));
  },
});
```

#### Step 2.2: Cypress → Scout Pattern Mapping

| Cypress Pattern | Scout Equivalent | Notes |
|-----------------|------------------|-------|
| `cy.visit(url)` | `await page.goto(url)` | Add wait for loaded state |
| `cy.get(selector).click()` | `await page.testSubj.click(testSubj)` | Prefer `data-test-subj` |
| `cy.get(selector).type(text)` | `await page.testSubj.fill(testSubj, text)` | `fill()` replaces, `type()` appends |
| `cy.contains(text)` | `await page.getByText(text)` | Scoped within container |
| `cy.wait(ms)` | `await page.waitForSelector()` | **Never use waitForTimeout()** |
| `cy.intercept(route)` | `await page.route(route, handler)` | Or use `apiClient` for API tests |
| `cy.request(url)` | `await apiClient.get(url)` | Use Scout's `apiClient` fixture |
| Custom commands | Scout page objects | Convert to page object methods |
| `beforeEach` setup via UI | `beforeEach` setup via API | Use `apiServices` |
| Archive load in `beforeEach` | Global setup hook | Load once, share across tests |
| `cy.should('be.visible')` | `await expect(locator).toBeVisible()` | Playwright auto-waits |

#### Step 2.3: Batch Breakdown

**Strategy:** 5-7 tests per PR, grouped by feature area

**Batch 1:** Alert Triage (3 UI tests + 1 API test)
- `alert_details_viewer.spec.ts`
- `alert_triage_analyst.spec.ts`
- `alert_enrichment_ui.spec.ts`
- `alert_enrichment_api.spec.ts`

**Batch 2:** Detection Rules (4 UI tests + 2 API tests)
- `rule_creation.spec.ts`
- `rule_editing.spec.ts`
- `rule_list_operations.spec.ts`
- `rule_deletion.spec.ts`
- `rule_execution_stats_api.spec.ts`
- `rule_rbac_api.spec.ts`

**Batch 3-5:** Timeline, Cases, Endpoints (similar structure)

**Output:** Detailed implementation plan for each batch with:
1. Files to create
2. Page objects/fixtures to implement
3. Pattern mappings to apply
4. Validation steps (type check, lint, local run)

---

### Phase 3: Implementation & Validation (per batch)

**Goal:** Implement optimized Scout tests, validate locally, create PR.

#### Step 3.1: Implement Batch

**For each test in batch:**
1. Create Scout spec file with `test.describe` + `test`
2. Use `test.step()` for multi-step flows
3. Apply Cypress → Scout pattern mappings
4. Use page objects for UI interactions
5. Use `apiServices` for setup/teardown
6. Add error path coverage (forbidden, validation)
7. Add RBAC tests (viewer, analyst, admin)

#### Step 3.2: Validate Locally

**Type check:**
```bash
yarn test:type_check --project test/scout_ui/tsconfig.json
```

**Lint:**
```bash
node scripts/eslint --fix test/scout_ui/<new-file>.spec.ts
```

**Run tests (20-50 runs for flake detection):**
```bash
node scripts/scout run-tests --arch stateful --domain classic \
  --config test/scout_ui/scout.config.ts \
  --testFiles test/scout_ui/<new-file>.spec.ts \
  --repeat 50
```

**Auto-fix common issues:**
- Missing `await` → Add to all async calls
- Selector not found → Try `getByRole()` or add `data-test-subj` to source
- Timing issues → Add explicit wait for readiness signal (NOT `waitForTimeout`)

#### Step 3.3: Review with scout-best-practices-reviewer

**Invoke skill:**
```
/scout-best-practices-reviewer
```

**Fix any issues raised**, then proceed to PR.

#### Step 3.4: Create PR

**PR structure:**

```markdown
## Summary

Migrates Cypress E2E tests to Scout (Playwright) for <plugin/solution> with strategic optimization.

## Tests Migrated & Optimized (Batch 1/5)

### UI Tests (3 files, 7 test cases)
- ✅ `alert_details_viewer.spec.ts` — Consolidated 3 Cypress tests into 1 multi-step flow
- ✅ `alert_triage_analyst.spec.ts` — Consolidated 5 Cypress tests into 1 multi-step flow
- ✅ `alert_enrichment_ui.spec.ts` — New test (UI rendering only, not data validation)

### API Tests (1 file, 2 test cases)
- ✅ `alert_enrichment_api.spec.ts` — Moved from Cypress UI test (data validation)

### Coverage Improvements
- ✅ Added forbidden path test (viewer tries to assign alert → 403)
- ✅ Added bulk operations test (assign all, close all)

## Optimization Metrics

| Metric | Before (Cypress) | After (Scout) | Δ |
|--------|------------------|---------------|---|
| Test files | 8 | 4 | -50% |
| Test cases | 23 | 9 | -61% |
| Execution time | 3.5min (sequential) | 1.2min (parallel, 4 workers) | -66% |
| Setup overhead | 160s (archive loaded 8x) | 50s (global setup hook) | -69% |
| Coverage gaps | 2 missing scenarios | 0 (added) | +100% |

## Quality Improvements

- ✅ All tests use `test.step()` for multi-step flows (no redundant setup)
- ✅ All setup via API fixtures (fast, reliable)
- ✅ Parallel-safe (isolated spaces via `spaceTest`)
- ✅ DRY: shared page objects in `test/scout_ui/pages/alert_details_page.ts`
- ✅ RBAC-aware: minimal permissions, forbidden path coverage
- ✅ No manual waits (`cy.wait(5000)` → explicit readiness signals)

## Pattern Mapping Applied

| Cypress | Scout |
|---------|-------|
| `cy.get('[data-test-subj="foo"]')` | `page.testSubj.locator('foo')` |
| `cy.request('/api/...')` | `apiClient.get('/api/...')` |
| `cy.wait(5000)` | `page.testSubj.waitForSelector('loaded')` |
| `beforeEach` setup via UI | `beforeEach` setup via API |
| Archive load in `beforeEach` | Global setup hook |

## Validation

- ✅ Type checks pass
- ✅ Linting passes
- ✅ All tests pass locally (50/50 runs, no flakes)
- ✅ Behavior matches Cypress (verified via screenshots)
- ✅ scout-best-practices-reviewer approved

## Next Steps

- **Do NOT delete Cypress files in this PR** (delete in follow-up after Scout tests proven stable in CI)
- CI will run Scout tests automatically
- Monitor Buildkite for any environment-specific failures
- Proceed with Batch 2 after this PR merges

---

**Migration batch:** 1 of 5 (28 total tests, 61 test cases)
**Generated by:** @cypress-to-scout-migrator
```

**Commit message:**
```
test(scout): optimize & migrate Cypress tests to Scout (batch 1/5)

Consolidates 23 Cypress tests into 9 optimized Scout tests with:
- Multi-step flows via test.step (no redundant setup)
- API fixtures for fast setup (not UI clicks)
- Parallel execution via spaceTest (4 workers)
- Coverage improvements (forbidden paths, bulk ops)

Performance: -66% execution time (3.5min → 1.2min)
Quality: +2 missing scenarios, DRY page objects, RBAC-aware

Part of strategic Cypress → Scout migration initiative.
```

---

## Convergence Criteria

**Stop when:**
1. **All batches implemented and merged** (5 PRs)
2. **All tests pass in CI** (3 consecutive clean runs)
3. **User confirms:** "Coverage looks good, ready to delete Cypress files"

**Max iterations:** 10 iterations per batch (if tests fail/flake, fix and re-run)

---

## Integration with Other Skills

- **scout-best-practices-reviewer** - Invoke after each batch implementation
- **scout-ui-testing** / **scout-api-testing** - Use during implementation for guidance
- **ci-babysitter** - Monitor Scout test CI failures post-migration
- **promotion-tracker** - Log migration metrics as evidence (scope, quality, impact)

---

## Success Metrics

- **Test count reduction:** 40-70% (via consolidation)
- **Execution time reduction:** 50-80% (via parallelism + fast setup)
- **Coverage improvement:** +10-20% (blind spots filled)
- **Quality improvement:** All tests DRY, RBAC-aware, flake-free
- **CI pass rate:** 100% after 3 consecutive runs
