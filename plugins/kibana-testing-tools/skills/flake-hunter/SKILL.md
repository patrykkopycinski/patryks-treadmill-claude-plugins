# flake-hunter

Identify, debug, and fix flaky tests systematically.

## Purpose

Eliminate flaky tests by detecting root causes, applying targeted fixes, and verifying stability. Addresses the major CI blocker of intermittently failing tests.

## Triggers

- "fix flaky test"
- "debug test flakiness"
- "why does this test fail intermittently"
- "investigate test instability"
- Auto-trigger when Buildkite Analytics shows >5% flake rate

## Context

Flaky tests are tests that pass and fail intermittently without code changes. They:
- Block CI pipelines and slow down development
- Erode confidence in test suite
- Waste engineering time investigating false failures
- Often stem from predictable root causes (race conditions, non-deterministic data, shared state)

This skill provides a systematic approach to hunt down and eliminate flakes.

## Prerequisites

- Buildkite Analytics access (for flake rate detection)
- Test runner (Scout, Jest, or FTR)
- Test file path or test name

## Workflow

### Phase 1: Detection & Reproduction

1. **Detect flaky test from:**
   - Buildkite Analytics (flake rate >5%)
   - Local runs (fails intermittently)
   - CI logs (passed on retry)
   - User report

2. **Reproduce the flake:**
   ```bash
   # For Scout tests
   for i in {1..100}; do
     echo "Run $i"
     node scripts/scout run-tests --config <config> --testFiles <file> || echo "FAIL: $i"
   done

   # For Jest tests
   for i in {1..50}; do
     echo "Run $i"
     yarn test:jest <file> || echo "FAIL: $i"
   done
   ```

3. **Calculate baseline flake rate:**
   - Record: X failures out of Y runs = Z% flake rate
   - Target: 0% flake rate after fix

### Phase 2: Root Cause Analysis

Analyze test code and failure logs to identify category:

#### Category 1: Race Conditions

**Symptoms:**
- `Error: Element not found` (intermittent)
- `Timeout waiting for selector`
- `Element is not visible`
- Action happens before element is ready

**Detection patterns:**
```typescript
// Red flags in test code
await page.click('#button'); // No wait before action
await page.locator('#element').textContent(); // No visibility check
expect(page.locator('#result')).toBeTruthy(); // No wait for element
```

**Root causes:**
- Clicking before element is visible
- Reading content before it's rendered
- Asserting before state updates complete
- Missing wait for network requests
- Animation/transition not complete

**Fixes:**

```typescript
// ❌ Before: Click without waiting
await page.click('#submit');

// ✅ After: Wait for visibility first
await expect(page.locator('#submit')).toBeVisible();
await page.click('#submit');

// ❌ Before: Read content immediately
const text = await page.locator('#result').textContent();

// ✅ After: Wait for element and content
await page.waitForSelector('#result', { state: 'visible' });
const text = await page.locator('#result').textContent();

// ❌ Before: Assert on data without waiting
expect(await page.locator('.count').textContent()).toBe('5');

// ✅ After: Use Playwright's auto-waiting assertion
await expect(page.locator('.count')).toHaveText('5');

// ❌ Before: Navigate and click immediately
await page.goto('/page');
await page.click('#element');

// ✅ After: Wait for load state
await page.goto('/page');
await page.waitForLoadState('networkidle');
await page.click('#element');
```

**Scout-specific patterns:**

```typescript
// ✅ Wait for Scout page context
await pageObjects.common.waitUntilUrlIncludes('/app/');

// ✅ Wait for Scout data grid to load
await pageObjects.dataGrid.waitForDataGridToLoad();

// ✅ Use Scout's built-in waiters
await testSubjects.existOrFail('elementName', { timeout: 10000 });
```

#### Category 2: Non-Deterministic Data

**Symptoms:**
- Assertions on timestamps fail randomly
- UUID/ID comparisons fail
- Random order causes failures
- Snapshot tests fail on dynamic values

**Detection patterns:**
```typescript
// Red flags in test code
expect(result.timestamp).toBe(Date.now()); // Current time
expect(data.id).toMatch(/^[a-f0-9-]+$/); // Random UUID
expect(items).toEqual([...expectedOrder]); // Unsorted data
```

**Root causes:**
- Using `Date.now()` or `new Date()` in assertions
- Generating random UUIDs/IDs
- Relying on unsorted array order
- Using `Math.random()` in test data
- Timestamps from server responses

**Fixes:**

```typescript
// ❌ Before: Compare to current time
expect(result.timestamp).toBe(Date.now());

// ✅ After: Mock time
const fixedTimestamp = new Date('2026-01-01T00:00:00Z').getTime();
jest.spyOn(Date, 'now').mockReturnValue(fixedTimestamp);
expect(result.timestamp).toBe(fixedTimestamp);

// ❌ Before: Assert on random UUID
expect(result.id).toBe('some-random-uuid');

// ✅ After: Assert on format, not exact value
expect(result.id).toMatch(/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/);

// ❌ Before: Exact array order
expect(items).toEqual([item1, item2, item3]);

// ✅ After: Check membership, not order
expect(items).toHaveLength(3);
expect(items).toEqual(expect.arrayContaining([item1, item2, item3]));

// ❌ Before: Snapshot with timestamps
expect(response).toMatchSnapshot();

// ✅ After: Strip dynamic fields
const { timestamp, id, ...staticFields } = response;
expect(staticFields).toMatchSnapshot();
expect(timestamp).toBeGreaterThan(0);
expect(id).toBeDefined();
```

**Scout-specific patterns:**

```typescript
// ✅ Use fixed test data
const testData = {
  '@timestamp': '2026-01-01T00:00:00.000Z',
  id: 'test-id-123',
  // ... other fixed values
};

// ✅ Mock Kibana's timefilter
await kibanaServer.uiSettings.update({
  'timepicker:timeDefaults': JSON.stringify({
    from: '2026-01-01T00:00:00.000Z',
    to: '2026-01-02T00:00:00.000Z',
  }),
});
```

#### Category 3: Test Pollution (Shared State)

**Symptoms:**
- Test passes when run alone
- Test fails when run in suite
- Failure depends on test execution order
- "Document already exists" errors
- Stale data from previous tests

**Detection patterns:**
```typescript
// Red flags in test code
const sharedVariable = {}; // Module-level mutable state
describe('suite', () => {
  let context; // Shared across tests without reset

  it('test1', () => {
    context.value = 'foo'; // Mutates shared state
  });

  it('test2', () => {
    expect(context.value).toBeUndefined(); // Assumes clean state
  });
});
```

**Root causes:**
- Missing cleanup in `afterEach`/`afterAll`
- Shared mutable state between tests
- ES indices not deleted after test
- Kibana saved objects leaked
- Browser storage not cleared

**Fixes:**

```typescript
// ❌ Before: Shared state without cleanup
describe('suite', () => {
  let testData = { count: 0 };

  it('test1', () => {
    testData.count++;
    expect(testData.count).toBe(1);
  });

  it('test2', () => {
    expect(testData.count).toBe(0); // Fails! count is 1
  });
});

// ✅ After: Reset in beforeEach
describe('suite', () => {
  let testData: { count: number };

  beforeEach(() => {
    testData = { count: 0 }; // Fresh state each test
  });

  it('test1', () => {
    testData.count++;
    expect(testData.count).toBe(1);
  });

  it('test2', () => {
    expect(testData.count).toBe(0); // Passes!
  });
});

// ❌ Before: Shared ES index
const INDEX_NAME = 'test-index';
it('test1', async () => {
  await esClient.index({ index: INDEX_NAME, document: { ... } });
});

// ✅ After: Unique index per test with cleanup
let testIndexName: string;

beforeEach(() => {
  testIndexName = `test-index-${Date.now()}`; // Unique per test
});

afterEach(async () => {
  await esClient.indices.delete({ index: testIndexName, ignore_unavailable: true });
});

// ❌ Before: Shared saved object
it('creates dashboard', async () => {
  await kibanaServer.savedObjects.create({
    type: 'dashboard',
    id: 'my-dashboard', // Fixed ID
    attributes: { ... }
  });
});

// ✅ After: Unique ID with cleanup
let dashboardId: string;

beforeEach(() => {
  dashboardId = `dashboard-${uuidv4()}`;
});

afterEach(async () => {
  await kibanaServer.savedObjects.delete({
    type: 'dashboard',
    id: dashboardId,
  });
});
```

**Scout-specific patterns:**

```typescript
// ✅ Use Scout's cleanup utilities
import { ScoutServerConfig } from '@kbn/scout';

describe('suite', () => {
  let kbnClient: ReturnType<typeof createKbnClient>;

  before(async () => {
    kbnClient = createKbnClient(scoutConfig.servers.kibana);
  });

  afterEach(async () => {
    // Clean up saved objects
    await kbnClient.savedObjects.bulkDelete([
      { type: 'dashboard', id: dashboardId },
      { type: 'visualization', id: vizId },
    ]);

    // Clean up indices
    await kbnClient.es.indices.delete({
      index: testIndexPattern,
      ignore_unavailable: true,
    });
  });
});

// ✅ Use unique test namespaces
const TEST_NAMESPACE = `test-${Date.now()}`;
await kibanaServer.savedObjects.create({
  type: 'dashboard',
  attributes: { ... },
  namespace: TEST_NAMESPACE,
});
```

#### Category 4: External Dependencies

**Symptoms:**
- `ETIMEDOUT` errors
- `503 Service Unavailable`
- Slow ES query times out randomly
- Network request fails intermittently

**Detection patterns:**
```typescript
// Red flags in test code
await fetch('https://external-api.com/data'); // External network
await esClient.search({ size: 10000 }); // Large query without timeout
```

**Root causes:**
- Network timeouts (default too short)
- Slow Elasticsearch queries
- External API rate limits
- Kibana startup not complete

**Fixes:**

```typescript
// ❌ Before: Default timeout
await page.goto('/app/dashboard');

// ✅ After: Longer timeout for slow pages
await page.goto('/app/dashboard', { timeout: 60000 });

// ❌ Before: Large ES query without timeout
const response = await esClient.search({
  index: 'large-index',
  size: 10000,
});

// ✅ After: Add timeout and pagination
const response = await esClient.search({
  index: 'large-index',
  size: 100, // Smaller batch
  scroll: '1m',
  timeout: '30s',
});

// ❌ Before: Network request without retry
const data = await fetch('/api/endpoint').then(r => r.json());

// ✅ After: Retry with exponential backoff
const data = await retry(
  async () => {
    const response = await fetch('/api/endpoint');
    if (!response.ok) throw new Error('Request failed');
    return response.json();
  },
  { retries: 3, minTimeout: 1000, maxTimeout: 5000 }
);
```

**Scout-specific patterns:**

```typescript
// ✅ Wait for Kibana to be fully ready
await pageObjects.common.waitForKibana();

// ✅ Use Scout's retry utilities
import { retry } from '@kbn/scout';

await retry(
  async () => {
    const response = await esClient.search({ ... });
    expect(response.hits.total.value).toBeGreaterThan(0);
  },
  { retries: 5, retryDelay: 1000 }
);

// ✅ Increase default timeouts for slow operations
test.setTimeout(120000); // 2 minutes for slow test
```

#### Category 5: Timing Issues (Animations/Debounce)

**Symptoms:**
- "Element is still animating" errors
- Click happens during transition
- Debounced function not called yet
- Component not fully mounted

**Detection patterns:**
```typescript
// Red flags in test code
await page.click('#menu'); // Immediately after opening
await page.fill('#search', 'query'); // Debounced input
expect(results).toHaveLength(5); // Before debounce fires
```

**Root causes:**
- CSS animations not complete
- Debounced functions (search, resize handlers)
- React state updates not flushed
- Angular digest cycle not complete

**Fixes:**

```typescript
// ❌ Before: Click during animation
await page.click('#menu-trigger');
await page.click('#menu-item'); // Fails if menu animating

// ✅ After: Wait for animation to complete
await page.click('#menu-trigger');
await page.waitForSelector('#menu-item', { state: 'visible' });
await page.waitForTimeout(300); // Wait for CSS animation (0.3s)
await page.click('#menu-item');

// ❌ Before: Assert before debounce
await page.fill('#search', 'query');
await expect(page.locator('.result')).toHaveCount(5); // Fails!

// ✅ After: Wait for debounce + results
await page.fill('#search', 'query');
await page.waitForTimeout(500); // Wait for debounce (typically 300-500ms)
await expect(page.locator('.result')).toHaveCount(5);

// ❌ Before: Assert before React update
fireEvent.click(button);
expect(screen.getByText('Clicked')).toBeInTheDocument(); // Fails!

// ✅ After: Use waitFor for async updates
fireEvent.click(button);
await waitFor(() => {
  expect(screen.getByText('Clicked')).toBeInTheDocument();
});
```

**Scout-specific patterns:**

```typescript
// ✅ Wait for EUI components to settle
await testSubjects.click('euiPopoverButton');
await testSubjects.existOrFail('euiPopoverPanel'); // Wait for popover
await page.waitForTimeout(100); // EUI animation
await testSubjects.click('popoverOption');

// ✅ Wait for toast notifications to appear
await testSubjects.existOrFail('toastNotification');
await page.waitForTimeout(200); // Toast slide-in animation

// ✅ For debounced search inputs
await testSubjects.setValue('searchInput', 'query');
await page.waitForTimeout(500); // Debounce delay
await testSubjects.existOrFail('searchResults');
```

### Phase 3: Apply Fix

1. **Implement targeted fix** based on root cause category
2. **Add explanatory comment** above fix:
   ```typescript
   // Fix flake: Wait for element visibility before clicking (race condition)
   await expect(page.locator('#submit')).toBeVisible();
   await page.click('#submit');
   ```

3. **Update related tests** with same pattern if applicable

### Phase 4: Verification

1. **Run test 50-100 times:**
   ```bash
   # Scout
   for i in {1..100}; do
     echo "Run $i"
     node scripts/scout run-tests --config <config> --testFiles <file> || echo "FAIL: $i"
   done | tee flake-verification.log

   # Count failures
   grep -c "FAIL:" flake-verification.log
   ```

2. **Calculate new flake rate:**
   - 0 failures = 0% flake rate = ✅ Fixed
   - 1-2 failures = <2% flake rate = ✅ Acceptable (may need additional hardening)
   - 3+ failures = Still flaky = ❌ Try different fix

3. **If flake persists after 2 fix attempts:**
   - Mark with `.fixme()` or `.skip()`
   - File GitHub issue with:
     * Test path and name
     * Flake rate (X failures / Y runs)
     * Root cause hypothesis
     * Attempted fixes
     * Logs/screenshots from failures
   - Link issue in test comment:
     ```typescript
     // FIXME: Flaky test (5% flake rate) - https://github.com/elastic/kibana/issues/XXXXX
     test.fixme('test name', async ({ page }) => {
       // ...
     });
     ```

### Phase 5: Reporting

Generate report with:

```markdown
# Flake Hunt Report: [Test Name]

## Detection
- **Source:** [Buildkite Analytics | Local Runs | CI Logs | User Report]
- **Baseline Flake Rate:** X failures / Y runs = Z%

## Root Cause Analysis
- **Category:** [Race Condition | Non-Deterministic Data | Test Pollution | External Dependency | Timing Issue]
- **Specific Cause:** [Detailed explanation]
- **Evidence:** [Log excerpts, code patterns]

## Fix Applied
```typescript
// Code diff showing fix
```

**Explanation:** [Why this fix addresses the root cause]

## Verification Results
- **Runs:** 100
- **Failures:** 0
- **New Flake Rate:** 0%
- **Status:** ✅ Fixed

## Related Changes
- [List of other tests updated with same pattern]
```

## Integration Points

### With scout-ui-testing / scout-api-testing
- Use Scout's built-in waiters (`testSubjects`, `pageObjects`)
- Follow Scout-specific patterns for EUI components
- Reference `~/.agents/rules/scout-playwright-best-practices.md`

### With ci-babysitter
- Auto-trigger flake hunt when Buildkite Analytics shows >5% flake rate
- Report fixes back to CI monitoring
- Track flake elimination progress

### With Buildkite Analytics
- Query flake rates: `https://buildkite.com/elastic/kibana/analytics`
- Prioritize tests with highest flake rates
- Verify fix reduced flake rate in Analytics

## Advanced Patterns

### Pattern: Test Isolation with Fixtures

```typescript
// ❌ Before: Shared setup
describe('suite', () => {
  before(async () => {
    await createTestData(); // Shared across all tests
  });
});

// ✅ After: Isolated fixtures
describe('suite', () => {
  beforeEach(async () => {
    await createTestData(); // Fresh data per test
  });

  afterEach(async () => {
    await cleanupTestData(); // Cleanup after each test
  });
});
```

### Pattern: Deterministic Waiting

```typescript
// ❌ Bad: Arbitrary timeout
await page.waitForTimeout(5000); // Guessing

// ✅ Good: Wait for specific condition
await page.waitForSelector('.data-loaded', { state: 'visible' });
await expect(page.locator('.spinner')).toBeHidden();
```

### Pattern: Idempotent Cleanup

```typescript
// ✅ Safe cleanup that doesn't fail if resource missing
afterEach(async () => {
  await esClient.indices.delete({
    index: testIndexName,
    ignore_unavailable: true, // Don't fail if already deleted
  });

  await kibanaServer.savedObjects.delete({
    type: 'dashboard',
    id: dashboardId,
  }).catch(() => {}); // Ignore if already deleted
});
```

## Success Criteria

- Baseline flake rate documented
- Root cause identified and categorized
- Targeted fix applied with explanation
- Verification shows 0% flake rate (50+ runs)
- Report generated with all details
- Related tests updated if applicable
- If unfixable: `.fixme()` marker + GitHub issue

## References

- `~/.agents/rules/scout-playwright-best-practices.md` - Scout testing patterns
- `~/.agents/rules/kibana-fast-validation.md` - Validation workflow
- Buildkite Analytics: https://buildkite.com/elastic/kibana/analytics
- Playwright Best Practices: https://playwright.dev/docs/best-practices

## Output Format

Present findings as structured report (Phase 5 format above), followed by:
- Links to modified test files
- Verification command to re-run
- Next steps (if applicable)
