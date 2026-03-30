---
name: perf-optimizer
description: Identify and fix performance bottlenecks in Kibana build, test, and CI workflows by analyzing slow operations, diagnosing root causes, and measuring optimization impact.
---

# Performance Optimizer

## Description
Identifies and fixes performance bottlenecks in Kibana build, test, and CI workflows. Analyzes slow operations, diagnoses root causes, suggests targeted optimizations, and measures impact.

## Triggers
- "optimize build time"
- "why is this test slow"
- "reduce CI time"
- "analyze performance"
- "speed up [build|test|CI]"
- "profile [webpack|jest|scout]"

## Core Capabilities

### 1. Detect Slow Operations
- **Build analysis**: Webpack bundle size, compilation time, plugin loading
- **Test profiling**: Jest/Scout execution time, setup/teardown duration
- **CI timing**: Buildkite agent hours, step duration, parallelism efficiency
- **Bootstrap analysis**: `yarn kbn bootstrap` dependency resolution

### 2. Analyze Bottlenecks
- **Bundle bloat**: Large packages (>5MB), duplicate dependencies, dead code
- **Test inefficiency**: Expensive setup (>30s), redundant ES archive loads, serial execution
- **CI waste**: Redundant steps, under-utilized parallelism, cache misses
- **Startup overhead**: Lazy loadable code, synchronous imports, unused plugins

### 3. Suggest Optimizations
- **Code splitting**: Dynamic imports, route-based chunks, lazy components
- **Caching**: Webpack cache, Jest cache, Scout ES archive snapshots
- **Parallelization**: Increase Jest/Scout workers, Buildkite agent count
- **Tree-shaking**: Replace lodash with lodash-es, eliminate side effects
- **Global setup**: Shared test fixtures, reusable ES instances

### 4. Measure Impact
- **Before/after metrics**: Timing, bundle size, agent-hours
- **Cost analysis**: Agent-hour cost, developer time saved
- **ROI calculation**: One-time effort vs ongoing savings

## Instructions

### Phase 1: Detection & Diagnosis

When user requests performance analysis:

1. **Identify scope**
   - Build performance → webpack analysis
   - Test performance → Jest/Scout profiling
   - CI performance → Buildkite analytics
   - Bootstrap performance → dependency graph analysis

2. **Gather baseline metrics**
   ```bash
   # Build: Generate webpack stats
   STATS_JSON=true node scripts/build_kibana_platform_plugins.js --focus <plugin>

   # Test: Profile Jest with --verbose --detectOpenHandles
   yarn test:jest --config <config> --verbose --detectOpenHandles

   # Scout: Check test timings in Scout HTML report
   # Look for tests with >30s duration in timeline

   # CI: Query Buildkite GraphQL API for recent builds
   # Group by step, calculate p50/p95/p99 timing
   ```

3. **Run automated analysis**
   - Use `webpack-bundle-analyzer` for bundle visualization
   - Parse Jest `--json` output for slow tests
   - Check CI logs for repeated expensive operations
   - Profile Node.js with `--cpu-prof` if needed

### Phase 2: Root Cause Analysis

#### Bundle Bloat Patterns
- **Symptom**: Plugin bundle >5MB
- **Causes**:
  - Lodash imported entire library (450KB)
  - Moment.js with all locales (160KB)
  - Multiple versions of same dependency
  - Unminified source maps in production
- **Detection**:
  ```bash
  # Find large dependencies
  cat webpack-stats.json | jq '.assets | sort_by(.size) | reverse | .[0:10]'

  # Check for duplicate packages
  yarn dedupe --check

  # Analyze specific plugin
  npx webpack-bundle-analyzer webpack-stats.json
  ```

#### Test Inefficiency Patterns
- **Symptom**: Test suite takes >5min
- **Causes**:
  - Each test loads ES archive independently
  - Expensive setup in `beforeEach` (should be in `beforeAll`)
  - Serial execution (single worker)
  - Unused Playwright browser context
- **Detection**:
  ```bash
  # Profile Jest test timing
  yarn test:jest --config <config> --verbose 2>&1 | grep "PASS\|FAIL" | awk '{print $2, $NF}'

  # Check Scout parallelism
  grep "workers:" <scout_config>

  # Identify expensive setup
  # Look for "beforeEach" with >1s operations
  grep -r "beforeEach" --include="*.test.ts" | xargs grep -l "es.indices.create\|kibanaServer.importExport"
  ```

#### CI Waste Patterns
- **Symptom**: Build takes >60min
- **Causes**:
  - Bootstrap runs on every agent (not cached)
  - Tests run serially (should parallelize)
  - Artifacts uploaded/downloaded unnecessarily
  - Redundant type checks across steps
- **Detection**:
  ```bash
  # Check Buildkite step timing
  buildkite-agent step get <step-key> --format json | jq '.duration'

  # Find steps running bootstrap
  grep -r "yarn kbn bootstrap" .buildkite/

  # Check parallelism
  grep "parallelism:" .buildkite/pipeline.yml
  ```

### Phase 3: Optimization Strategies

#### Build Optimizations

**1. Code Splitting**
```typescript
// Before: Synchronous import (bloats main bundle)
import { HeavyComponent } from './heavy_component';

// After: Dynamic import (separate chunk)
const HeavyComponent = lazy(() => import('./heavy_component'));
```

**2. Tree-Shaking**
```typescript
// Before: Imports entire lodash (450KB)
import _ from 'lodash';

// After: Tree-shakeable imports (20KB)
import { debounce, throttle } from 'lodash-es';
```

**3. Webpack Cache**
```javascript
// webpack.config.js
module.exports = {
  cache: {
    type: 'filesystem',
    buildDependencies: {
      config: [__filename],
    },
  },
};
```

**4. Plugin Lazy Loading**
```typescript
// kibana.jsonc
{
  "type": "plugin",
  "plugin": {
    "id": "myPlugin",
    "requiredPlugins": ["data"],
    // Only load when route accessed
    "optionalPlugins": ["maps", "lens"]
  }
}
```

#### Test Optimizations

**1. Shared ES Archives**
```typescript
// Before: Each test loads archive (5s per test)
beforeEach(async () => {
  await esArchiver.load('security_solution/alerts');
});

// After: Load once, reuse across tests (5s total)
beforeAll(async () => {
  await esArchiver.load('security_solution/alerts');
});
afterAll(async () => {
  await esArchiver.unload('security_solution/alerts');
});
```

**2. Increase Parallelism**
```javascript
// jest.config.js
module.exports = {
  // Before: 1 worker (serial)
  maxWorkers: 1,

  // After: 50% of CPU cores
  maxWorkers: '50%',
};
```

```typescript
// scout.config.ts
export default {
  // Before: 1 worker
  workers: 1,

  // After: Match available CPU cores
  workers: Math.max(1, Math.floor(os.cpus().length * 0.75)),
};
```

**3. Global Setup Hook**
```typescript
// jest.config.js
module.exports = {
  globalSetup: '<rootDir>/global_setup.ts',
  globalTeardown: '<rootDir>/global_teardown.ts',
};

// global_setup.ts
export default async () => {
  // Start ES once for all tests
  const es = await startElasticsearch();
  process.env.ES_URL = es.url;
};
```

**4. Scout ES Snapshot Caching**
```typescript
// Use Scout's built-in snapshot system
test.beforeAll(async ({ kbnClient }) => {
  // Load data once, snapshot the ES state
  await kbnClient.importExport.load(...);
  await kbnClient.savedObjects.create(...);
});

// Subsequent tests restore from snapshot (faster)
```

#### CI Optimizations

**1. Cache Bootstrap**
```yaml
# .buildkite/pipeline.yml
steps:
  - label: "Bootstrap"
    command: "yarn kbn bootstrap"
    # Cache node_modules across builds
    plugins:
      - cache#v1:
          key: "v1-yarn-{{ checksum 'yarn.lock' }}"
          paths:
            - "node_modules"
            - ".yarn/cache"
```

**2. Parallelize Tests**
```yaml
# Before: Serial execution
steps:
  - label: "Test Suite"
    command: "yarn test:jest"

# After: Parallel execution
steps:
  - label: "Test Suite"
    command: "yarn test:jest"
    parallelism: 10
    # Split tests across 10 agents
```

**3. Incremental Type Checking**
```yaml
# Only check changed files
steps:
  - label: "Type Check"
    command: |
      CHANGED_FILES=$(git diff --name-only origin/main...HEAD | grep '\.tsx\?$')
      for file in $CHANGED_FILES; do
        # Find nearest tsconfig
        TSCONFIG=$(find $(dirname $file) -name tsconfig.json -type f | head -n1)
        yarn test:type_check --project $TSCONFIG
      done
```

**4. Conditional Steps**
```yaml
# Skip tests if no code changed
steps:
  - label: "API Tests"
    if: |
      git diff --name-only origin/main...HEAD | grep -E "src/.*\.ts$"
    command: "yarn test:jest --config jest.integration.config.js"
```

### Phase 4: Impact Measurement

#### Metrics to Track

1. **Build Performance**
   - Bundle size (MB): Before vs After
   - Compilation time (seconds): Before vs After
   - First load time (seconds): Before vs After

2. **Test Performance**
   - Suite duration (minutes): Before vs After
   - Test count: No change expected
   - Failure rate: No change expected

3. **CI Performance**
   - Pipeline duration (minutes): Before vs After
   - Agent hours consumed: Before vs After
   - Cost ($): Before vs After (agent-hour rate)

4. **Developer Experience**
   - Local build time: Before vs After
   - Test feedback loop: Before vs After
   - Merge queue time: Before vs After

#### Measurement Template

```markdown
## Performance Optimization Results

### Scope
- **Target**: [Build/Test/CI]
- **Package**: [Plugin/Package name]
- **Date**: [YYYY-MM-DD]

### Baseline (Before)
- Metric 1: [value + unit]
- Metric 2: [value + unit]
- Metric 3: [value + unit]

### Optimizations Applied
1. [Optimization name]: [Brief description]
2. [Optimization name]: [Brief description]

### Results (After)
- Metric 1: [value + unit] (**-XX%**)
- Metric 2: [value + unit] (**-XX%**)
- Metric 3: [value + unit] (**-XX%**)

### Cost-Benefit Analysis
- **Implementation time**: X hours
- **Time saved per build/test/CI run**: Y minutes
- **Runs per day**: Z
- **Total time saved per day**: Y * Z minutes
- **ROI breakeven**: X hours / (Y * Z hours/day) = N days

### Recommendations
- [Next optimization opportunity]
- [Monitoring to prevent regression]
```

### Phase 5: Implementation & Validation

1. **Create optimization branch**
   ```bash
   git checkout -b perf/optimize-<target>-<date>
   ```

2. **Apply optimizations incrementally**
   - One optimization per commit
   - Measure impact after each change
   - Document reasoning in commit message

3. **Validate no regressions**
   ```bash
   # Build: Verify bundle size
   STATS_JSON=true node scripts/build_kibana_platform_plugins.js

   # Test: Verify all tests pass
   yarn test:jest --config <config>

   # Type check
   yarn test:type_check --project <tsconfig>

   # Lint
   node scripts/eslint --fix $(git diff --name-only)
   ```

4. **Create PR with metrics**
   - Include before/after comparison
   - Link to Buildkite builds showing improvement
   - Document any trade-offs (e.g., lazy loading = slight delay on first use)

## Kibana-Specific Patterns

### Bootstrap Optimization
```bash
# Problem: Bootstrap takes 10+ minutes
# Cause: Re-resolves dependencies every time

# Solution: Use Yarn PnP (Plug'n'Play)
yarn config set nodeLinker pnp
yarn install

# Or: Cache node_modules in CI (see CI Optimizations above)
```

### Scout Parallelism
```typescript
// scout.config.ts
import os from 'os';

export default {
  // Match CPU cores (leave 2 for system)
  workers: Math.max(1, os.cpus().length - 2),

  // Reuse browser contexts (faster than fresh launch)
  fullyParallel: false,

  // Keep browser alive between tests
  reuseExistingServer: !process.env.CI,
};
```

### ES Archive Caching
```typescript
// Use Scout's snapshot system instead of manual archiving
import { test } from '@kbn/scout';

test.describe('Alerts', () => {
  test.beforeAll(async ({ kbnClient, esClient }) => {
    // Load data once
    await esClient.indices.create({ index: 'alerts' });
    await kbnClient.savedObjects.create(...);

    // Scout automatically snapshots ES state
  });

  test.afterAll(async ({ esClient }) => {
    // Cleanup
    await esClient.indices.delete({ index: 'alerts' });
  });

  // Each test gets fresh ES state from snapshot (fast)
  test('test 1', async () => { ... });
  test('test 2', async () => { ... });
});
```

### Plugin Lazy Loading
```typescript
// Only load expensive plugins when needed
// kibana.jsonc
{
  "type": "plugin",
  "plugin": {
    "id": "myPlugin",
    "requiredPlugins": ["data"],
    // Lazy load (don't block startup)
    "optionalPlugins": ["maps", "lens", "ml"],
    "requiredBundles": ["kibanaReact"]
  }
}

// In plugin code
export class MyPlugin {
  setup(core, plugins) {
    // Register route that lazy loads Maps
    core.http.route({
      path: '/app/my-plugin/map',
      handler: async () => {
        // Only load Maps when this route accessed
        const maps = await core.plugins.getPlugin('maps');
        return maps ? maps.renderMap() : null;
      },
    });
  }
}
```

## Example Workflows

### Example 1: Optimize Security Solution Build

**User Input**: "Why is the Security Solution build so slow?"

**Agent Actions**:

1. **Generate webpack stats**
   ```bash
   cd x-pack/solutions/security
   STATS_JSON=true node scripts/build_kibana_platform_plugins.js --focus securitySolution
   ```

2. **Analyze bundle**
   ```bash
   npx webpack-bundle-analyzer webpack-stats.json
   ```

3. **Findings**:
   - lodash imported 47 times (450KB)
   - moment.js with all locales (160KB)
   - react-beautiful-dnd duplicated (120KB)

4. **Optimizations**:
   - Replace `import _ from 'lodash'` with `import { debounce } from 'lodash-es'`
   - Add webpack plugin: `new MomentLocalesPlugin({ localesToKeep: ['en'] })`
   - Run `yarn dedupe` to remove duplicate react-beautiful-dnd

5. **Results**:
   - Bundle size: 8.2MB → 5.8MB (-29%)
   - Build time: 4m 20s → 3m 10s (-27%)
   - First load time: 3.2s → 2.1s (-34%)

### Example 2: Speed Up Scout Tests

**User Input**: "reduce CI time for detection engine tests"

**Agent Actions**:

1. **Profile test suite**
   ```bash
   node scripts/scout run-tests \
     --arch stateful \
     --domain security \
     --config x-pack/test/security_solution_scout/detection_engine.scout.config.ts \
     --reporter html
   ```

2. **Findings** (from HTML report timeline):
   - 45 tests, 12m 30s total
   - Each test loads ES archive (5s per test = 3m 45s wasted)
   - Running on 1 worker (serial execution)
   - Browser launched 45 times (20s startup overhead)

3. **Optimizations**:
   - Move ES archive load to `beforeAll` (5s once vs 5s * 45)
   - Increase workers from 1 to 4 (4x parallelism)
   - Enable browser context reuse

4. **Code changes**:
   ```typescript
   // detection_engine.scout.config.ts
   export default {
     workers: 4, // Was: 1
     fullyParallel: false, // Reuse browser contexts
   };

   // detection_engine.test.ts
   test.beforeAll(async ({ esClient, kbnClient }) => {
     // Load once
     await esArchiver.load('security_solution/detection_engine');
   });

   test.afterAll(async ({ esClient }) => {
     await esArchiver.unload('security_solution/detection_engine');
   });
   ```

5. **Results**:
   - Suite duration: 12m 30s → 3m 45s (-70%)
   - CI agent hours: 12.5 → 3.75 (-70%)
   - Cost savings: $0.50/agent-hour * 8.75 hours = **$4.38 per run**

### Example 3: Optimize CI Pipeline

**User Input**: "analyze performance of platform builds"

**Agent Actions**:

1. **Query Buildkite API** for recent builds
   ```graphql
   query {
     pipeline(slug: "elastic/kibana") {
       builds(first: 20, branch: "main") {
         edges {
           node {
             jobs {
               ... on JobTypeCommand {
                 label
                 runnableAt
                 finishedAt
               }
             }
           }
         }
       }
     }
   }
   ```

2. **Findings**:
   - "Bootstrap" step: 8m 30s (runs on every agent)
   - "Type Check" step: 12m (checks all packages, not just changed)
   - Tests run serially: 45m total (could parallelize)
   - Artifacts uploaded unnecessarily: 2m overhead

3. **Optimizations**:
   - Cache bootstrap (see CI Optimizations above)
   - Incremental type checking (only changed packages)
   - Parallelize tests across 10 agents
   - Skip artifact upload for non-release builds

4. **Results**:
   - Pipeline duration: 58m → 22m (-62%)
   - Agent hours: 58 → 30 (-48%)
   - Cost savings: $0.50/hour * 28 hours = **$14 per build**
   - Estimated monthly savings: $14 * 100 builds = **$1,400/month**

## Validation Checklist

Before declaring optimization complete:

- [ ] Metrics collected (before/after)
- [ ] All tests pass (no regressions)
- [ ] Type check passes
- [ ] Linting passes
- [ ] Build succeeds
- [ ] Local development workflow verified
- [ ] CI builds pass
- [ ] Cost-benefit analysis documented
- [ ] Monitoring alerts configured (prevent regression)

## Edge Cases & Warnings

### Don't Over-Optimize
- Optimizing code that runs once (e.g., one-time migration) has low ROI
- Prefer simple, readable code over premature optimization
- Profile first, optimize second

### Watch for Regressions
- Lazy loading can introduce UI delays (first load slower)
- Aggressive caching can mask bugs (stale data)
- Parallel tests can introduce flakiness (race conditions)
- Code splitting can break source maps (harder debugging)

### Kibana-Specific Gotchas
- Bootstrap cache must be invalidated when dependencies change
- Scout snapshots don't work with ES cross-cluster search
- Webpack cache breaks when plugins change (must clear)
- Plugin lazy loading requires careful dependency management

## Success Criteria

Optimization is successful when:
1. **Metrics improve** by ≥20% (anything less may not be worth effort)
2. **No regressions** in functionality or test coverage
3. **ROI breakeven** within 2 weeks (implementation time recovered)
4. **Monitoring in place** to prevent future regression
5. **Documentation updated** so others can apply same patterns

## References

- Webpack Bundle Analyzer: https://github.com/webpack-contrib/webpack-bundle-analyzer
- Jest Performance: https://jestjs.io/docs/troubleshooting#tests-are-slow-when-run-in-debug-mode
- Scout Config: https://github.com/elastic/kibana/blob/main/packages/kbn-scout/README.md
- Buildkite Analytics: https://buildkite.com/docs/analytics
- Kibana Performance Docs: https://github.com/elastic/kibana/blob/main/PERFORMANCE.md
