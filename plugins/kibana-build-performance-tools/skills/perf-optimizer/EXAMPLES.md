# Performance Optimizer - Real-World Examples

This document shows how the skill works with actual Kibana scenarios.

## Example 1: Security Solution Bundle Too Large

### User Request
"The Security Solution bundle is 8MB. Can we reduce it?"

### Agent Workflow

#### Step 1: Detect (Phase 1)
```bash
# Generate webpack stats
cd x-pack/solutions/security
STATS_JSON=true node scripts/build_kibana_platform_plugins.js --focus securitySolution

# Analyze bundle
npx webpack-bundle-analyzer webpack-stats.json
```

#### Step 2: Analyze (Phase 2)
```json
Top 10 Assets:
  450KB - node_modules/lodash/lodash.js
  160KB - node_modules/moment/locale/*.js
  120KB - node_modules/react-beautiful-dnd (duplicated v12, v13)
  85KB  - node_modules/classnames/index.js
  75KB  - node_modules/uuid/dist/esm-browser/*.js
```

Root causes:
1. **Lodash**: Imported entire library 47 times instead of tree-shakeable imports
2. **Moment**: All locale files included (only need 'en')
3. **React-Beautiful-DnD**: Duplicate versions (v12 and v13)

#### Step 3: Optimize (Phase 3)

**Fix 1: Replace lodash with lodash-es**
```typescript
// Before (x-pack/solutions/security/public/utils/helpers.ts)
import _ from 'lodash';
export const debouncedSearch = _.debounce(search, 300);

// After
import { debounce } from 'lodash-es';
export const debouncedSearch = debounce(search, 300);
```

**Fix 2: Remove unused moment locales**
```javascript
// webpack.config.js
const MomentLocalesPlugin = require('moment-locales-webpack-plugin');

module.exports = {
  plugins: [
    new MomentLocalesPlugin({
      localesToKeep: ['en'], // Keep only English
    }),
  ],
};
```

**Fix 3: Deduplicate dependencies**
```bash
yarn dedupe
```

#### Step 4: Measure (Phase 4)

```markdown
## Results

### Before
- Bundle size: 8.2MB
- Compilation time: 4m 20s
- First load time: 3.2s

### After
- Bundle size: 5.8MB (-29%)
- Compilation time: 3m 10s (-27%)
- First load time: 2.1s (-34%)

### Cost-Benefit
- Implementation time: 2 hours
- Time saved per build: 1m 10s
- Builds per day: 50
- Total saved: ~1 hour/day
- ROI breakeven: 2 days
```

---

## Example 2: Detection Engine Tests Take 12 Minutes

### User Request
"Why do detection engine Scout tests take so long? It's blocking CI."

### Agent Workflow

#### Step 1: Detect
```bash
# Run tests with HTML reporter
node scripts/scout run-tests \
  --arch stateful \
  --domain security \
  --config x-pack/test/security_solution_scout/detection_engine.scout.config.ts \
  --reporter html

# Analyze timeline in HTML report
open scout-report-*.html
```

#### Step 2: Analyze

Timeline shows:
- **45 tests**, 12m 30s total
- **Each test loads ES archive** (5s per test = 225s wasted)
- **Serial execution** (workers: 1)
- **Browser launched 45 times** (20s overhead each)

Breakdown:
```
Test 1: Load archive (5s) + Test (3s) = 8s
Test 2: Load archive (5s) + Test (4s) = 9s
...
Test 45: Load archive (5s) + Test (2s) = 7s
```

#### Step 3: Optimize

**Fix 1: Move ES archive to beforeAll**
```typescript
// detection_engine.test.ts
import { test } from '@kbn/scout';

// BEFORE: Each test loads independently
test('generates alert for eql rule', async ({ esClient }) => {
  await esArchiver.load('security_solution/detection_engine');
  // Test logic...
});

// AFTER: Load once for all tests
test.beforeAll(async ({ esClient, kbnClient }) => {
  await esArchiver.load('security_solution/detection_engine');
});

test.afterAll(async ({ esClient }) => {
  await esArchiver.unload('security_solution/detection_engine');
});

test('generates alert for eql rule', async () => {
  // Test logic (archive already loaded)
});
```

**Fix 2: Increase parallelism**
```typescript
// detection_engine.scout.config.ts
import os from 'os';

export default {
  // BEFORE
  workers: 1,

  // AFTER: Use 75% of CPU cores
  workers: Math.max(1, Math.floor(os.cpus().length * 0.75)),

  // Reuse browser contexts (faster)
  fullyParallel: false,
};
```

#### Step 4: Measure

```markdown
## Results

### Before
- Duration: 12m 30s
- ES archive loads: 45 (225s total)
- Workers: 1 (serial)
- CI agent hours: 12.5

### After
- Duration: 3m 45s (-70%)
- ES archive loads: 1 (5s total)
- Workers: 6 (parallel)
- CI agent hours: 3.75

### Cost-Benefit
- Time saved per run: 8m 45s
- Agent cost saved: $4.38 per run
- Runs per day: 20
- Monthly savings: $2,628
- Implementation time: 1 hour
```

---

## Example 3: CI Takes 58 Minutes (Too Slow)

### User Request
"Platform builds take an hour. Can we speed up CI?"

### Agent Workflow

#### Step 1: Detect

Query Buildkite for recent builds:
```bash
# Check slowest steps
# https://buildkite.com/elastic/kibana/builds?branch=main

# Typical build breakdown:
# 1. Bootstrap: 8m 30s
# 2. Type Check: 12m
# 3. Tests: 45m (serial)
# 4. Upload artifacts: 2m
```

#### Step 2: Analyze

Bottlenecks:
1. **Bootstrap runs on every agent** (8m 30s × 10 agents = 85 agent-minutes wasted)
2. **Type check all packages** (even if only 1 changed)
3. **Tests run serially** (could parallelize across 10 agents)
4. **Artifacts uploaded unnecessarily** (non-release builds)

#### Step 3: Optimize

**Fix 1: Cache bootstrap**
```yaml
# .buildkite/pipeline.yml
steps:
  - label: "Bootstrap"
    command: "yarn kbn bootstrap"
    plugins:
      - cache#v1:
          key: "v1-yarn-{{ checksum 'yarn.lock' }}"
          paths:
            - "node_modules"
            - ".yarn/cache"
```

**Fix 2: Incremental type check**
```yaml
# .buildkite/pipeline.yml
steps:
  - label: "Type Check (Incremental)"
    command: |
      # Only check changed packages
      CHANGED_FILES=$(git diff --name-only origin/main...HEAD | grep '\.tsx\?$')

      for file in $CHANGED_FILES; do
        # Find nearest tsconfig.json
        TSCONFIG=$(find $(dirname $file) -name tsconfig.json -type f | head -n1)
        if [ -n "$TSCONFIG" ]; then
          echo "Checking $TSCONFIG"
          yarn test:type_check --project $TSCONFIG
        fi
      done
```

**Fix 3: Parallelize tests**
```yaml
# .buildkite/pipeline.yml
steps:
  - label: "Test Suite"
    command: "yarn test:jest"
    parallelism: 10  # Split across 10 agents
```

**Fix 4: Conditional artifacts**
```yaml
# .buildkite/pipeline.yml
steps:
  - label: "Upload Artifacts"
    if: build.tag != null  # Only for release tags
    command: "yarn build && buildkite-agent artifact upload 'target/**/*'"
```

#### Step 4: Measure

```markdown
## Results

### Before
- Total duration: 58m
- Agent hours: 58
- Cost per build: $29
- Builds per day: 100
- Monthly cost: $87,000

### After
- Total duration: 22m (-62%)
- Agent hours: 30 (-48%)
- Cost per build: $15 (-48%)
- Builds per day: 100
- Monthly cost: $45,000

### Cost-Benefit
- Implementation time: 4 hours
- Monthly savings: $42,000
- Annual savings: $504,000
- ROI breakeven: <1 day
```

---

## Example 4: Bootstrap Takes 10 Minutes Every Time

### User Request
"yarn kbn bootstrap takes 10+ minutes. Is this normal?"

### Agent Workflow

#### Step 1: Detect
```bash
# Time bootstrap
time yarn kbn bootstrap

# Check cache config
yarn config get enableGlobalCache

# Check node_modules size
du -sh node_modules
```

Output:
```
real    10m 45s
enableGlobalCache: false
node_modules: 1.2GB
```

#### Step 2: Analyze

Bootstrap phases:
1. **Dependency resolution**: 6m 20s (re-runs every time)
2. **Linking**: 2m 10s
3. **Building packages**: 2m 15s

Problem: No caching, full dependency resolution on every run.

#### Step 3: Optimize

**Fix 1: Enable Yarn cache**
```bash
yarn config set enableGlobalCache true
```

**Fix 2: CI caching**
```yaml
# .buildkite/pipeline.yml
plugins:
  - cache#v1:
      key: "v1-bootstrap-{{ checksum 'yarn.lock' }}"
      paths:
        - "node_modules"
        - ".yarn/cache"
```

**Fix 3: Local sparse checkout**
```bash
# Only check out needed packages
git sparse-checkout set \
  x-pack/platform/packages/shared/kbn-evals-extensions \
  scripts \
  .github

# Faster bootstrap (fewer packages to link)
yarn kbn bootstrap
```

#### Step 4: Measure

```markdown
## Results

### Before
- First run: 10m 45s
- Subsequent runs: 10m 45s (no cache)
- CI: 8m 30s per agent

### After
- First run: 10m 45s (unchanged)
- Subsequent runs: 1m 30s (-86%)
- CI: 45s per agent (-91%)

### Cost-Benefit
- Developer time saved: 9m 15s per bootstrap
- Bootstraps per day: 10
- Time saved per dev: 1h 32m/day
- Value: $77/day per developer
```

---

## Example 5: One Slow Test Blocks Entire Suite

### User Request
"Our Jest suite has one test that takes 3 minutes. How can we isolate it?"

### Agent Workflow

#### Step 1: Detect
```bash
# Profile tests
yarn test:jest --config jest.config.js --verbose 2>&1 | \
  grep -E "PASS|FAIL" | \
  awk '{print $2, $NF}' | \
  sort -t' ' -k2 -rn | \
  head -10
```

Output:
```
test/integration/large_dataset.test.ts 189s
test/unit/parser.test.ts 2s
test/unit/validator.test.ts 1s
...
```

#### Step 2: Analyze

The slow test:
- Loads 100k ES documents
- Runs complex aggregations
- Used only for regression testing

Other tests:
- Fast unit tests (<2s each)
- Run on every commit

Problem: One slow integration test blocks fast unit tests.

#### Step 3: Optimize

**Fix 1: Separate integration tests**
```javascript
// jest.integration.config.js
module.exports = {
  ...require('./jest.config.js'),
  testMatch: ['**/*.integration.test.ts'],
};

// jest.config.js (unit tests only)
module.exports = {
  testMatch: ['**/*.test.ts'],
  testPathIgnorePatterns: ['/integration/'],
};
```

**Fix 2: Conditional CI execution**
```yaml
# .buildkite/pipeline.yml
steps:
  - label: "Unit Tests"
    command: "yarn test:jest"
    # Run on every commit

  - label: "Integration Tests"
    command: "yarn test:jest:integration"
    # Only on main branch or release
    if: build.branch == "main" || build.tag != null
```

**Fix 3: Optimize slow test**
```typescript
// large_dataset.test.ts
beforeAll(async () => {
  // Load data once (not in beforeEach)
  await esClient.bulk({ body: generateLargeDataset() });
});

test('aggregates large dataset', async () => {
  // Use smaller sample for faster testing
  const result = await esClient.search({
    size: 1000, // Down from 100k
    query: { sample: { rate: 0.01 } }, // 1% sample
  });
  expect(result).toBeDefined();
});
```

#### Step 4: Measure

```markdown
## Results

### Before
- Total suite: 195s
- Unit tests: 6s (3% of time)
- Integration test: 189s (97% of time)
- CI runs: 100/day
- Total CI time: 325 hours/day

### After
- Unit tests: 6s (every commit)
- Integration tests: 30s (optimized, main only)
- CI runs (unit): 100/day
- CI runs (integration): 10/day
- Total CI time: 15 hours/day

### Cost-Benefit
- CI time saved: 310 hours/day
- Cost savings: $155/day = $4,650/month
- Implementation time: 2 hours
```

---

## Key Takeaways

### Common Patterns
1. **Load once, use many**: ES archives, test fixtures
2. **Parallelize when possible**: Workers, CI agents
3. **Cache aggressively**: node_modules, build artifacts
4. **Split fast/slow**: Unit vs integration tests
5. **Tree-shake dependencies**: lodash-es, moment locales

### ROI Sweet Spots
- High-frequency operations (CI, local dev)
- Compound savings (every build, every test)
- Low implementation cost (config changes)

### Red Flags
- Operations >5 minutes
- Repeated work (loading, building)
- Serial execution (workers=1)
- Full scans (all files, all packages)

### Success Metrics
- 20%+ improvement
- ROI breakeven <2 weeks
- No regressions
- Monitoring in place
