---
name: test-coverage-analyzer
description: >
  Analyzes test coverage gaps, identifies untested code paths, and generates targeted test recommendations.
  Works with Jest coverage reports, Scout tests, and source code analysis to find blind spots.
trigger: |
  - "analyze test coverage"
  - "find untested code"
  - "coverage gaps"
  - "what's not tested"
  - "identify missing tests"
examples:
  - input: "Analyze test coverage for Security Solution alert triage"
    output: "Analyzes Jest coverage report, finds 3 untested error paths in isolate_endpoint.ts, 2 untested RBAC scenarios, 1 untested edge case. Generates 6 specific test recommendations with Scout test snippets."
  - input: "What code paths are missing tests in this file?"
    output: "Parses file for conditionals, error handlers, and branches. Compares with existing test coverage. Identifies 5 untested paths: network timeout handler, validation error path, forbidden access check, empty state handler, edge case for max value."
---

# @test-coverage-analyzer

**Purpose:** Systematically identify untested code paths and generate targeted test recommendations to improve coverage quality (not just coverage percentage).

**Context:** High coverage % doesn't guarantee quality coverage. This agent finds critical untested paths: error handlers, RBAC checks, edge cases, and boundary conditions that matter for production reliability.

**Philosophy:**
- **Quality over quantity** - 80% coverage with critical paths > 95% coverage missing error handlers
- **Risk-based prioritization** - Focus on high-risk untested code (auth, data loss, security)
- **Actionable recommendations** - Provide specific test snippets, not just "add tests"
- **Integration-aware** - Considers Jest, Scout, and integration test coverage together

---

## When to Use

**Automatic activation triggers:**
- User mentions "test coverage", "untested code", "coverage gaps"
- User asks "what's not tested", "missing tests"
- Before declaring feature complete
- Before PR merge (as quality gate)

**Manual invocation:**
```
/test-coverage-analyzer
```

---

## Core Workflow

### Phase 1: Coverage Data Collection (2-5 min)

**Goal:** Gather coverage data from all test layers.

#### Step 1.1: Run Jest Coverage

```bash
# For specific package (scoped, faster)
yarn test:jest --coverage --collectCoverageFrom='x-pack/plugins/<plugin>/**/*.ts' \
  x-pack/plugins/<plugin>

# Generate HTML report
--coverageReporters=html,text,lcov
```

**Output:** `coverage/lcov-report/index.html` + `coverage/coverage-summary.json`

#### Step 1.2: Analyze Scout Test Coverage

```bash
# Find all Scout tests for package
find x-pack/plugins/<plugin>/test/scout* -name "*.spec.ts"

# Extract test scenarios (describe/test names)
grep -r "test\(" x-pack/plugins/<plugin>/test/scout* -A1
```

**Output:** List of Scout-covered scenarios

#### Step 1.3: Find Integration Tests

```bash
# Find integration tests
find x-pack/plugins/<plugin> -name "*.integration.test.ts"

# Extract coverage (integration test scenarios)
grep -r "it\(" -A1
```

**Output:** List of integration-covered scenarios

---

### Phase 2: Source Code Path Analysis (5-10 min)

**Goal:** Identify all code paths that SHOULD be tested.

#### Step 2.1: Find Critical Code Paths

**Parse source code for:**

1. **Error handlers:**
   ```typescript
   try {
     // Happy path
   } catch (error) {
     // ❓ Is this tested?
   }
   ```

2. **Conditional branches:**
   ```typescript
   if (condition) {
     // Branch A - ❓ Tested?
   } else {
     // Branch B - ❓ Tested?
   }
   ```

3. **RBAC checks:**
   ```typescript
   if (!user.hasPrivilege('read')) {
     return response.forbidden(); // ❓ Tested?
   }
   ```

4. **Validation logic:**
   ```typescript
   if (!input.isValid()) {
     throw new ValidationError(); // ❓ Tested?
   }
   ```

5. **Edge cases:**
   ```typescript
   if (items.length === 0) {
     return emptyState; // ❓ Tested?
   }

   if (value > MAX_LIMIT) {
     throw new Error('Exceeds limit'); // ❓ Tested?
   }
   ```

6. **Async error paths:**
   ```typescript
   const result = await apiCall().catch((error) => {
     // ❓ Tested?
   });
   ```

**Use AST parsing (TypeScript compiler API) for accuracy:**

```typescript
import * as ts from 'typescript';

function findUncoveredPaths(sourceFile: ts.SourceFile): UncoveredPath[] {
  const paths: UncoveredPath[] = [];

  function visit(node: ts.Node) {
    // Find try-catch blocks
    if (ts.isTryStatement(node)) {
      paths.push({
        type: 'error-handler',
        location: `${sourceFile.fileName}:${getLineNumber(node.catchClause)}`,
        code: node.catchClause.getText(),
      });
    }

    // Find if-else branches
    if (ts.isIfStatement(node)) {
      paths.push({
        type: 'conditional',
        location: `${sourceFile.fileName}:${getLineNumber(node)}`,
        condition: node.expression.getText(),
      });
    }

    // Find auth checks (heuristic: .hasPrivilege, forbidden, 403)
    if (isAuthCheck(node)) {
      paths.push({
        type: 'rbac',
        location: `${sourceFile.fileName}:${getLineNumber(node)}`,
      });
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return paths;
}
```

---

### Phase 3: Coverage Gap Analysis (5-10 min)

**Goal:** Compare code paths against test coverage to find gaps.

#### Step 3.1: Cross-Reference with Jest Coverage

**Use lcov data:**

```bash
# Extract uncovered lines from lcov.info
grep -A2 "^SF:" coverage/lcov.info | grep -E "^DA:" | grep ",0$"

# Format: DA:<line>,<hit-count>
# DA:42,0 means line 42 was never executed
```

**Match uncovered lines to code paths:**

```typescript
// Example: Line 42 is uncovered
const uncoveredLine = 42;

// Find which code path contains line 42
const path = codePaths.find(p => p.lineNumber === uncoveredLine);

// Categorize gap
if (path.type === 'error-handler') {
  gaps.push({
    type: 'CRITICAL',
    category: 'Error handling not tested',
    location: `file.ts:42`,
    risk: 'Production errors may not be handled correctly',
  });
}
```

#### Step 3.2: Categorize by Risk

**Risk levels:**

| Risk Level | Description | Examples |
|------------|-------------|----------|
| **CRITICAL** | Untested code that handles errors, auth, or data loss | try-catch, RBAC checks, delete operations |
| **HIGH** | Untested business logic, validation, edge cases | Input validation, boundary conditions, state transitions |
| **MEDIUM** | Untested UI logic, formatting, display | Conditional rendering, empty states, loading states |
| **LOW** | Untested helper functions, utils (covered by integration) | String formatting, date parsing (if used in tested code) |

**Prioritization:**
- Fix CRITICAL gaps first (security, errors)
- Fix HIGH gaps before release (business logic)
- Fix MEDIUM gaps for quality (UX)
- Fix LOW gaps if time allows (nice to have)

---

### Phase 4: Test Recommendation Generation (5-10 min)

**Goal:** Generate specific, actionable test recommendations with code snippets.

#### Step 4.1: Generate Test Snippets

**For each coverage gap, generate appropriate test:**

**Example 1: Untested Error Handler**

**Gap found:**
```typescript
// x-pack/plugins/security_solution/server/lib/isolate_endpoint.ts:42
try {
  await fleetClient.isolate(endpointId);
} catch (error) {
  // ❌ CRITICAL: Not tested
  logger.error('Isolation failed', error);
  throw new IsolationError('Failed to isolate endpoint');
}
```

**Recommended test (Jest):**

```typescript
// x-pack/plugins/security_solution/server/lib/isolate_endpoint.test.ts
describe('isolateEndpoint', () => {
  it('should throw IsolationError when Fleet API fails', async () => {
    const mockFleetClient = {
      isolate: jest.fn().mockRejectedValue(new Error('Fleet API error')),
    };

    await expect(
      isolateEndpoint(mockFleetClient, 'endpoint-123')
    ).rejects.toThrow('Failed to isolate endpoint');

    expect(mockLogger.error).toHaveBeenCalledWith(
      'Isolation failed',
      expect.any(Error)
    );
  });
});
```

---

**Example 2: Untested RBAC Path**

**Gap found:**
```typescript
// x-pack/plugins/security_solution/server/routes/isolate.ts:28
if (!authzResult.hasPrivilege) {
  // ❌ CRITICAL: Forbidden path not tested
  return response.forbidden({
    body: { message: 'Insufficient privileges' },
  });
}
```

**Recommended test (Scout API):**

```typescript
// x-pack/plugins/security_solution/test/scout_api/isolate_rbac.spec.ts
import { apiTest, expect } from '@kbn/scout/api';
import { COMMON_HEADERS } from '../constants';

apiTest.describe('POST /api/security_solution/isolate - RBAC', () => {
  let viewerCredentials: ApiKeyAuth;

  apiTest.beforeAll(async ({ requestAuth }) => {
    viewerCredentials = await requestAuth.getApiKeyForViewer();
  });

  apiTest('returns 403 for viewer without isolate privilege', async ({ apiClient }) => {
    const response = await apiClient.post('api/security_solution/isolate', {
      headers: { ...COMMON_HEADERS, ...viewerCredentials.apiKeyHeader },
      body: { endpoint_id: 'test-endpoint-123' },
    });

    expect(response).toHaveStatusCode(403);
    expect(response.body).toMatchObject({
      message: 'Insufficient privileges',
    });
  });
});
```

---

**Example 3: Untested Edge Case**

**Gap found:**
```typescript
// x-pack/plugins/security_solution/public/components/alert_list.tsx:156
if (alerts.length === 0) {
  // ❌ HIGH: Empty state not tested
  return <EmptyStateMessage />;
}
```

**Recommended test (Scout UI or RTL):**

```typescript
// x-pack/plugins/security_solution/public/components/alert_list.test.tsx
import { render, screen } from '@testing-library/react';
import { AlertList } from './alert_list';

describe('AlertList', () => {
  it('should show empty state when no alerts', () => {
    render(<AlertList alerts={[]} />);

    expect(screen.getByTestId('emptyStateMessage')).toBeInTheDocument();
    expect(screen.queryByTestId('alertTable')).not.toBeInTheDocument();
  });
});
```

---

### Phase 5: Coverage Report Generation (5 min)

**Goal:** Generate comprehensive coverage report with prioritized recommendations.

#### Report Structure:

```markdown
# Test Coverage Analysis: <Package/Feature>

**Analyzed:** [Date]
**Package:** x-pack/plugins/<plugin>
**Current Coverage:** 78.5% (lines), 65.2% (branches)

---

## Executive Summary

**Total code paths:** 156
**Tested paths:** 98 (62.8%)
**Untested paths:** 58 (37.2%)

**By risk level:**
- **CRITICAL:** 8 gaps (error handlers, RBAC, data loss)
- **HIGH:** 15 gaps (business logic, validation, edge cases)
- **MEDIUM:** 22 gaps (UI logic, display, formatting)
- **LOW:** 13 gaps (helpers, utils)

**Recommendation:** Fix 8 CRITICAL + 15 HIGH gaps before release (23 tests, ~4-6 hours)

---

## Coverage Gaps by Risk Level

### CRITICAL Gaps (8) - Fix Before Release

#### 1. Error Handler: Isolation API Failure

**Location:** `server/lib/isolate_endpoint.ts:42`

**Untested code:**
```typescript
catch (error) {
  logger.error('Isolation failed', error);
  throw new IsolationError('Failed to isolate endpoint');
}
```

**Risk:** Production errors may not be handled correctly
**Test layer:** Jest unit test
**Estimated effort:** 15 min

**Recommended test:**
```typescript
it('should throw IsolationError when Fleet API fails', async () => {
  const mockFleetClient = {
    isolate: jest.fn().mockRejectedValue(new Error('Fleet API error')),
  };

  await expect(
    isolateEndpoint(mockFleetClient, 'endpoint-123')
  ).rejects.toThrow('Failed to isolate endpoint');
});
```

---

#### 2. RBAC: Forbidden Access Path

**Location:** `server/routes/isolate.ts:28`

**Untested code:**
```typescript
if (!authzResult.hasPrivilege) {
  return response.forbidden({ message: 'Insufficient privileges' });
}
```

**Risk:** Unauthorized users might bypass security
**Test layer:** Scout API test
**Estimated effort:** 20 min

**Recommended test:**
```typescript
apiTest('returns 403 for viewer without isolate privilege', async ({ apiClient, requestAuth }) => {
  const viewerCreds = await requestAuth.getApiKeyForViewer();

  const response = await apiClient.post('api/security_solution/isolate', {
    headers: { ...COMMON_HEADERS, ...viewerCreds.apiKeyHeader },
    body: { endpoint_id: 'test-123' },
  });

  expect(response).toHaveStatusCode(403);
});
```

---

[... 6 more CRITICAL gaps with test snippets]

---

### HIGH Gaps (15) - Fix Before Next Release

[Similar structure for each gap]

---

### MEDIUM Gaps (22) - Nice to Have

[Condensed list with locations]

---

### LOW Gaps (13) - Optional

[Condensed list]

---

## Coverage Metrics

### Current Coverage

| File | Lines | Branches | Functions | Uncovered Lines |
|------|-------|----------|-----------|-----------------|
| `server/lib/isolate_endpoint.ts` | 85.2% | 62.5% | 90.0% | 42, 56, 78 |
| `server/routes/isolate.ts` | 72.3% | 58.3% | 75.0% | 28, 35, 89-92 |
| `public/components/alert_list.tsx` | 68.9% | 55.0% | 70.0% | 156, 178, 203 |

### Recommended Coverage Targets

After fixing CRITICAL + HIGH gaps:
- Lines: 78.5% → 92.0% (+13.5%)
- Branches: 65.2% → 85.0% (+19.8%)
- Functions: 80.0% → 95.0% (+15.0%)

---

## Test Implementation Plan

**Priority 1: CRITICAL (8 tests, ~2-3 hours)**
1. Add error handler tests (4 tests, 1 hour)
2. Add RBAC forbidden path tests (3 tests, 1 hour)
3. Add data loss prevention test (1 test, 30 min)

**Priority 2: HIGH (15 tests, ~4-5 hours)**
1. Add validation error tests (5 tests, 1.5 hours)
2. Add edge case tests (7 tests, 2 hours)
3. Add boundary condition tests (3 tests, 1 hour)

**Priority 3: MEDIUM (22 tests, ~3-4 hours)**
1. Add UI state tests (10 tests, 2 hours)
2. Add display logic tests (12 tests, 2 hours)

**Total effort:** ~9-12 hours to reach 92% high-quality coverage

---

## Quick Wins (Low-Hanging Fruit)

**Tests that are easy to add and high impact:**

1. **Empty state tests** (UI components)
   - Current: 0/5 components tested
   - Effort: 5 min each
   - Impact: Prevents broken UI on zero results

2. **Forbidden path tests** (API routes)
   - Current: 0/8 routes tested
   - Effort: 15 min each
   - Impact: Validates RBAC security

3. **Network timeout tests** (API calls)
   - Current: 0/6 external API calls tested
   - Effort: 10 min each
   - Impact: Prevents production timeouts
```

---

### Phase 3: Test Layer Recommendation (2 min)

**Goal:** Recommend the right test layer for each gap.

#### Test Layer Decision Tree:

```
What are you testing?
├─ Error handling in backend logic?
│  └─ Jest unit test (mock dependencies, fast)
│
├─ API endpoint behavior (RBAC, validation)?
│  └─ Scout API test (realistic requests, auth)
│
├─ UI rendering (components, empty states)?
│  ├─ Simple component logic? → RTL unit test (isolated, fast)
│  └─ User interaction flow? → Scout UI test (browser, realistic)
│
├─ Integration (service → API → response)?
│  └─ Jest integration test (test environment)
│
└─ E2E user flow (login → navigate → action)?
   └─ Scout UI test (full browser context)
```

**Example recommendations:**

| Gap | Code Location | Recommended Layer | Reason |
|-----|---------------|-------------------|--------|
| Error handler: Fleet API failure | `server/lib/isolate.ts:42` | Jest unit | Isolated logic, mock Fleet |
| RBAC: Viewer forbidden | `server/routes/isolate.ts:28` | Scout API | Validate real RBAC enforcement |
| Empty state: No alerts | `public/components/alert_list.tsx:156` | RTL unit | Simple component logic |
| User flow: Isolate from UI | Integration | Scout UI | Full browser flow |

---

### Phase 4: Coverage Improvement Tracking (Ongoing)

**Goal:** Track progress as gaps are filled.

#### Generate tracking document:

```markdown
# Coverage Improvement Tracker: <Feature>

**Started:** [Date]
**Target:** Fix all CRITICAL + HIGH gaps
**Progress:** 0 / 23 gaps fixed

---

## Progress Checklist

### CRITICAL (8)
- [ ] Error handler: Isolation API failure (file.ts:42)
- [ ] RBAC: Viewer forbidden (file.ts:28)
- [ ] Data loss: Delete without confirmation (file.ts:156)
- [ ] ... (5 more)

### HIGH (15)
- [ ] Validation: Empty required field (file.ts:89)
- [ ] Edge case: Max value exceeded (file.ts:134)
- [ ] ... (13 more)

---

## Coverage Metrics (Updated Daily)

| Metric | Initial | Current | Target | Progress |
|--------|---------|---------|--------|----------|
| Lines | 78.5% | 78.5% | 92.0% | 0% |
| Branches | 65.2% | 65.2% | 85.0% | 0% |
| CRITICAL gaps | 8 | 8 | 0 | 0% |
| HIGH gaps | 15 | 15 | 0 | 0% |

**Run to update:**
```bash
yarn test:jest --coverage --collectCoverageFrom='...' && /test-coverage-analyzer
```
```

---

## Advanced Analysis

### Pattern 1: Find Untested Error Paths (Heuristic)

**Search for error patterns without tests:**

```bash
# Find all error throw statements
grep -rn "throw new" x-pack/plugins/<plugin>/server --include="*.ts"

# For each throw, check if test exists
# Example: throw new IsolationError(...)
grep -r "IsolationError" x-pack/plugins/<plugin>/**/*.test.ts

# If no match → untested error path
```

**Common untested error patterns:**
- `throw new ValidationError` (input validation)
- `throw new AuthorizationError` (RBAC)
- `throw new NotFoundError` (404 cases)
- `throw new ConflictError` (409 cases)
- `return response.forbidden()` (403 cases)
- `return response.badRequest()` (400 cases)

---

### Pattern 2: Find Untested RBAC Scenarios

**Search for privilege checks without tests:**

```bash
# Find RBAC checks
grep -rn "hasPrivilege\|forbidden\|requiredPrivileges" \
  x-pack/plugins/<plugin>/server --include="*.ts"

# For each RBAC check, verify test exists
# Look for Scout API tests with viewer/editor credentials
grep -r "getApiKeyForViewer\|loginAsViewer" \
  x-pack/plugins/<plugin>/test/scout*

# If no corresponding test → CRITICAL gap
```

---

### Pattern 3: Find Untested Edge Cases

**Common edge cases to check:**

```typescript
// Empty/null/undefined
if (!value) { ... }           // ❓ Tested with null, undefined, ""?
if (array.length === 0) { ... } // ❓ Tested?

// Boundaries
if (value > MAX) { ... }      // ❓ Tested with MAX, MAX+1?
if (value < MIN) { ... }      // ❓ Tested with MIN, MIN-1?

// Special characters
if (input.includes(' ')) { ... } // ❓ Tested with unicode, emojis?

// Async timeouts
await fetch(url, { timeout: 5000 }) // ❓ Tested with timeout?
```

**For each pattern, check if test exists covering that case.**

---

## Integration with Other Agents

### @api-test-generator
**Use for:** Generating Scout API tests for untested RBAC paths

```
After finding untested RBAC gap:
1. /test-coverage-analyzer identifies gap
2. /api-test-generator creates test suite
   → Includes RBAC test (viewer → 403)
3. Run tests, verify coverage improved
```

---

### @flake-hunter
**Use for:** Ensuring new tests don't introduce flakes

```
After adding new tests:
1. /test-coverage-analyzer generates tests
2. Developer implements tests
3. /flake-hunter validates with 50-run protocol
4. Coverage improved + no flakes introduced
```

---

### @spike-builder
**Use in:** Phase 5 (Comprehensive QA)

```
@spike-builder Phase 5 Step 5.1:
→ Invokes /test-coverage-analyzer
  - Identifies gaps in spike implementation
  - Generates missing E2E test scenarios
  - Ensures comprehensive coverage before demo
```

---

### @promotion-evidence-tracker
**Use for:** Logging coverage improvement as evidence

```
After improving coverage 78% → 92%:
→ /promotion-evidence-tracker
  - Logs as Problem Solving & Impact
  - Metrics: +13.5% line coverage, 23 critical gaps fixed
  - Category: Quality improvement initiative
```

---

## Output Format

### Summary Report

```
📊 Test Coverage Analysis: Security Solution - Endpoint Isolation

**Current Coverage:** 78.5% lines, 65.2% branches
**Target Coverage:** 92.0% lines, 85.0% branches

**Gaps Found:** 58 total
- CRITICAL: 8 gaps (fix immediately)
- HIGH: 15 gaps (fix before release)
- MEDIUM: 22 gaps (nice to have)
- LOW: 13 gaps (optional)

**Quick Wins:** 14 tests (2-3 hours, high impact)

**Full report:** coverage-analysis-endpoint-isolation.md
```

### Detailed Report (Markdown File)

```
# Test Coverage Analysis: Endpoint Isolation

[Full report with all gaps, test snippets, metrics, tracking]

Location: ~/.agents/coverage-reports/endpoint-isolation-[timestamp].md
```

---

## Success Metrics

**After running @test-coverage-analyzer:**

- ✅ All CRITICAL gaps identified (100% detection)
- ✅ Test recommendations include specific code snippets
- ✅ Risk-prioritized (CRITICAL → HIGH → MEDIUM → LOW)
- ✅ Test layer recommendations (Jest, Scout API, Scout UI, RTL)
- ✅ Effort estimates (time to implement)
- ✅ Tracking document generated

**After implementing recommendations:**

- ✅ Coverage improved: 78% → 92%
- ✅ CRITICAL gaps: 8 → 0 (eliminated)
- ✅ HIGH gaps: 15 → 0 (eliminated)
- ✅ Production confidence: Significantly higher
- ✅ Evidence logged: Coverage improvement initiative

---

## Triggers

**Explicit invocation:**
- "analyze test coverage"
- "find untested code"
- "what's not tested in this file"
- "coverage gaps for <feature>"
- "identify missing tests"

**Auto-trigger scenarios:**
- Before declaring feature complete
- Before PR merge (as quality gate)
- After implementing new feature (detect gaps early)
- During spike QA (from @spike-builder)

---

## Example Workflows

### Workflow 1: Before Release

```
Developer: "Is this feature ready to release?"

1. /test-coverage-analyzer
   → Analyzes coverage
   → Finds 8 CRITICAL gaps
   → Report: "❌ Not ready - 8 CRITICAL gaps found"

2. Developer implements recommended tests (2-3 hours)

3. /test-coverage-analyzer (re-run)
   → Re-analyzes coverage
   → Report: "✅ Ready - 0 CRITICAL gaps, 92% coverage"

4. Feature released with confidence
```

---

### Workflow 2: During PR Review

```
Reviewer: "What's the test coverage for this PR?"

1. /test-coverage-analyzer
   → Analyzes changed files only
   → Finds 3 HIGH gaps in new code
   → Generates test recommendations

2. Developer adds 3 tests

3. /test-coverage-analyzer (re-run)
   → Verifies gaps fixed
   → Report: "✅ All new code tested"

4. PR approved
```

---

### Workflow 3: Quality Improvement Initiative

```
Team lead: "Improve test coverage in Detection Engine"

1. /test-coverage-analyzer
   → Analyzes entire package
   → Finds 45 gaps (12 CRITICAL, 18 HIGH, 15 MEDIUM)
   → Generates improvement plan

2. Team divides work (3 engineers × 1 week)

3. /test-coverage-analyzer (daily tracking)
   → Updates progress dashboard
   → Day 1: 12 → 8 CRITICAL
   → Day 3: 8 → 2 CRITICAL
   → Day 5: 2 → 0 CRITICAL ✅

4. /promotion-evidence-tracker
   → Logs as Technical Leadership
   → Metrics: 68% → 92% coverage, 45 gaps → 0 CRITICAL
```

---

## Quality Gates

**Suggested coverage thresholds:**

| Code Type | Minimum Coverage | Target Coverage |
|-----------|------------------|-----------------|
| **Backend APIs** | 80% lines, 70% branches | 95% lines, 85% branches |
| **Business logic** | 85% lines, 75% branches | 95% lines, 90% branches |
| **UI components** | 70% lines, 60% branches | 85% lines, 75% branches |
| **Utils/helpers** | 75% lines, 65% branches | 90% lines, 80% branches |

**CRITICAL gap tolerance:** 0 (block merge if any found)
**HIGH gap tolerance:** ≤3 (warn, but allow if documented)

---

## Advanced Features

### Feature 1: Historical Coverage Tracking

**Track coverage trends over time:**

```bash
# Store coverage snapshot
coverage-history/
  2026-03-20.json    # { lines: 78.5%, branches: 65.2%, gaps: 58 }
  2026-03-21.json    # { lines: 82.3%, branches: 68.1%, gaps: 42 }
  2026-03-22.json    # { lines: 88.7%, branches: 78.5%, gaps: 18 }

# Generate trend chart
→ "Coverage improved +10.2% in 2 days (58 → 18 gaps)"
```

---

### Feature 2: Diff Coverage (Only Changed Code)

**Analyze coverage for PR changes only:**

```bash
# Get changed files in PR
git diff main...HEAD --name-only --diff-filter=AM

# Run coverage for changed files only
yarn test:jest --coverage --collectCoverageFrom='<changed-files>'

# Analyze only changed code paths
→ "This PR adds 3 new code paths, 2 are tested, 1 is missing tests"
```

**Benefit:** Focus on new code, not entire codebase

---

### Feature 3: Mutation Testing (Advanced)

**Detect weak tests (tests that pass even when code is broken):**

```bash
# Use Stryker for mutation testing
npx stryker run

# Identify tests that don't catch mutations
→ "3 tests pass even when error handler is removed - tests are too weak"
```

**Recommendation:** Strengthen tests with specific assertions

---

## Success Criteria

**A coverage analysis is complete when:**

1. ✅ All code paths categorized (error, RBAC, validation, edge case)
2. ✅ All gaps risk-prioritized (CRITICAL → HIGH → MEDIUM → LOW)
3. ✅ Test recommendations include specific snippets
4. ✅ Test layer identified (Jest, Scout API, Scout UI, RTL)
5. ✅ Effort estimates provided (time to implement)
6. ✅ Tracking document created
7. ✅ Quick wins identified (low-hanging fruit)

---

## Common Coverage Patterns (Kibana-Specific)

### Pattern 1: Kibana Route RBAC Coverage

**Always test:**
- ✅ Admin can access (200)
- ✅ Editor can access if privileged (200 or 403)
- ✅ Viewer cannot access (403)
- ✅ No auth returns 401

### Pattern 2: Saved Object CRUD Coverage

**Always test:**
- ✅ Create with valid data (success)
- ✅ Create with invalid data (validation error)
- ✅ Read existing object (success)
- ✅ Read non-existent object (404)
- ✅ Update object (success)
- ✅ Update non-existent object (404)
- ✅ Delete object (success)
- ✅ Delete non-existent object (success - idempotent)

### Pattern 3: Elasticsearch Query Coverage

**Always test:**
- ✅ Query with results (happy path)
- ✅ Query with no results (empty state)
- ✅ Query with invalid syntax (400 error)
- ✅ Query timeout (ES slow)
- ✅ Index not found (404)

---

## Anti-Patterns to Avoid

### ❌ Don't chase 100% coverage

**Problem:** 100% coverage includes trivial code (getters, simple formatters)

**Better:** Focus on 90-95% with ALL critical paths tested

---

### ❌ Don't test implementation details

**Problem:** Tests that break when refactoring (brittle)

```typescript
// ❌ Bad: Tests internal variable
expect(component.state.internalCounter).toBe(5);

// ✅ Good: Tests observable behavior
expect(component.getDisplayValue()).toBe('5 items');
```

---

### ❌ Don't ignore branch coverage

**Problem:** High line coverage but low branch coverage = untested conditionals

```typescript
// Lines: 100% (all 3 lines executed in tests)
// Branches: 50% (only if-branch tested, not else)
if (condition) {
  doSomething();  // ✅ Tested
} else {
  doOtherThing(); // ❌ Not tested
}
```

**Fix:** Add test for else branch

---

## Quick Reference Commands

```bash
# Run coverage (scoped to package)
yarn test:jest --coverage --collectCoverageFrom='x-pack/plugins/<plugin>/**/*.ts'

# Generate HTML report (open in browser)
yarn test:jest --coverage --coverageReporters=html
open coverage/lcov-report/index.html

# Find untested error handlers
grep -rn "catch\|throw" --include="*.ts" | while read line; do
  file=$(echo $line | cut -d: -f1)
  grep -q "$(basename $file .ts).test.ts" && echo "✅ $line" || echo "❌ $line"
done

# Find untested RBAC checks
grep -rn "forbidden\|requiredPrivileges" --include="*.ts" | \
  grep -v ".test.ts"

# Check coverage summary
cat coverage/coverage-summary.json | jq '.total'
```

---

## Estimated ROI

**Time investment:**
- Initial analysis: 15-20 min
- Implementing CRITICAL gaps: 2-3 hours
- Implementing HIGH gaps: 4-5 hours
- **Total: 6-8 hours**

**Value:**
- Prevents production errors (CRITICAL gaps)
- Reduces bug escape rate by 40-60%
- Increases deployment confidence
- Faster debugging (tests document behavior)
- **ROI: 3-5x** (6hr investment prevents 20-30hr debugging)

---

**Ready to find your coverage gaps!** 🔍
