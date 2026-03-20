# Performance Optimizer Test Scenarios

Quick reference for testing the skill with realistic Kibana scenarios.

## Test Scenario 1: Bundle Bloat Detection

**Trigger**: "optimize build time for Security Solution"

**Expected Actions**:
1. Generate webpack stats for `x-pack/solutions/security`
2. Analyze with webpack-bundle-analyzer
3. Identify large dependencies (lodash, moment, duplicates)
4. Suggest tree-shaking, locale reduction, deduplication
5. Estimate bundle size reduction (20-30%)

**Sample Output**:
```
Bundle Analysis for Security Solution Plugin:

Current bundle size: 8.2MB
Top contributors:
  - lodash: 450KB (imported 47 times)
  - moment.js: 160KB (includes all locales)
  - react-beautiful-dnd: 120KB (duplicated, v12 and v13)

Recommended optimizations:
  1. Replace lodash with lodash-es (tree-shakeable)
  2. Add MomentLocalesPlugin (keep only 'en')
  3. Run yarn dedupe to remove duplicate react-beautiful-dnd

Estimated impact:
  - Bundle size: 8.2MB → 5.8MB (-29%)
  - First load time: 3.2s → 2.1s (-34%)
```

## Test Scenario 2: Slow Test Suite

**Trigger**: "why is the detection engine test suite so slow"

**Expected Actions**:
1. Run Scout tests with HTML reporter
2. Analyze timeline for bottlenecks
3. Identify repeated ES archive loads
4. Check worker count (likely 1 = serial)
5. Suggest beforeAll pattern and increased parallelism

**Sample Output**:
```
Test Performance Analysis: Detection Engine Suite

Current metrics:
  - Duration: 12m 30s
  - Tests: 45
  - Workers: 1 (serial execution)
  - ES archive loads: 45 (5s each = 3m 45s overhead)

Bottlenecks:
  1. ES archive loaded in beforeEach (should be beforeAll)
  2. Serial execution (only 1 worker)
  3. Browser launched 45 times (should reuse context)

Recommended optimizations:
  1. Move ES archive to beforeAll (5s once vs 225s total)
  2. Increase workers to 4 (4x parallelism)
  3. Disable fullyParallel (reuse browser contexts)

Estimated impact:
  - Duration: 12m 30s → 3m 45s (-70%)
  - CI cost: $6.25 → $1.88 per run
```

## Test Scenario 3: CI Pipeline Optimization

**Trigger**: "reduce CI time for platform builds"

**Expected Actions**:
1. Query Buildkite API for recent builds
2. Identify slowest steps (bootstrap, type check, tests)
3. Check for unnecessary work (full type check, serial tests)
4. Suggest caching, incremental checks, parallelization

**Sample Output**:
```
CI Pipeline Analysis: elastic/kibana (main branch)

Current metrics (avg of 20 builds):
  - Total duration: 58m
  - Agent hours: 58
  - Cost: $29 per build

Top time consumers:
  1. Bootstrap: 8m 30s (runs on every agent)
  2. Type Check: 12m (checks all packages)
  3. Tests: 45m (serial execution)
  4. Artifact upload: 2m (unnecessary for non-release)

Recommended optimizations:
  1. Cache node_modules (invalidate on yarn.lock change)
  2. Incremental type check (only changed packages)
  3. Parallelize tests across 10 agents
  4. Skip artifact upload for non-release builds

Estimated impact:
  - Duration: 58m → 22m (-62%)
  - Agent hours: 58 → 30 (-48%)
  - Cost savings: $14 per build = $1,400/month
```

## Test Scenario 4: Bootstrap Performance

**Trigger**: "yarn kbn bootstrap takes forever"

**Expected Actions**:
1. Profile bootstrap execution
2. Identify slow phases (dependency resolution, linking, building)
3. Check for cache usage
4. Suggest Yarn PnP or improved caching

**Sample Output**:
```
Bootstrap Performance Analysis

Current metrics:
  - Duration: 10m 45s
  - Phases:
    - Dependency resolution: 6m 20s
    - Linking: 2m 10s
    - Building packages: 2m 15s

Bottlenecks:
  - Dependency resolution re-runs every time (not cached)
  - Large node_modules tree (1.2GB)

Recommended optimizations:
  1. Enable Yarn cache: yarn config set enableGlobalCache true
  2. In CI: Cache node_modules keyed on yarn.lock checksum
  3. Local: Use sparse git checkout (fewer packages = faster bootstrap)

Estimated impact:
  - First run: 10m 45s (no change)
  - Subsequent runs: 10m 45s → 1m 30s (-86%)
  - CI builds: 8m 30s → 45s (-91%)
```

## Test Scenario 5: Scout Parallelism Tuning

**Trigger**: "optimize scout test parallelism"

**Expected Actions**:
1. Check current worker count in scout.config.ts
2. Measure CPU usage during test run
3. Suggest optimal worker count based on CPU cores
4. Warn about diminishing returns (>8 workers)

**Sample Output**:
```
Scout Parallelism Analysis

Current config:
  - Workers: 1
  - CPU cores: 8
  - CPU usage during tests: 15%

Optimization opportunity:
  - Current: 1 worker = 12% CPU (under-utilized)
  - Recommended: 6 workers = 75% CPU (optimal)
  - Max theoretical: 8 workers = 100% CPU (risk of contention)

Code change:
```typescript
// scout.config.ts
import os from 'os';

export default {
  // Leave 2 cores for system
  workers: Math.max(1, os.cpus().length - 2),
};
```

Estimated impact:
  - Duration: 10m → 2m (-80%)
  - Warning: Ensure tests are isolated (no shared state)
```

## Test Scenario 6: Lazy Loading Plugin

**Trigger**: "reduce kibana startup time by lazy loading plugins"

**Expected Actions**:
1. Identify heavy optional plugins (Maps, Lens, ML)
2. Check if plugin is required for core functionality
3. Suggest moving to optionalPlugins if not required
4. Show dynamic import pattern

**Sample Output**:
```
Plugin Lazy Loading Analysis

Current setup:
  - Plugin: securitySolution
  - Required plugins: data, maps, lens, ml
  - Startup time: 4.2s

Optimization opportunity:
  - Maps: Only used in network map (1 route)
  - Lens: Only used in visualizations (2 routes)
  - ML: Only used in anomaly detection (1 route)

Recommended change:
```typescript
// kibana.jsonc
{
  "plugin": {
    "id": "securitySolution",
    "requiredPlugins": ["data"],
    // Move to optional (lazy load)
    "optionalPlugins": ["maps", "lens", "ml"]
  }
}
```

Estimated impact:
  - Startup time: 4.2s → 2.8s (-33%)
  - First map load: +200ms (lazy load overhead)
  - Trade-off: Acceptable for rarely-used features
```

## Running Tests

To test these scenarios manually:

```bash
# Activate the skill
cd ~/.agents/skills/perf-optimizer

# Test with Claude
# User: "optimize build time for Security Solution"
# Expected: Agent follows Phase 1-4 workflow, provides analysis

# Verify skill file syntax
cat SKILL.md | grep -E "^##|^###" | head -20

# Check for Kibana-specific patterns
grep -i "kibana\|scout\|buildkite\|webpack" SKILL.md | wc -l
# Should be >50 mentions
```

## Success Criteria

Skill is ready when:
- [ ] All 6 test scenarios produce actionable analysis
- [ ] Before/after metrics included in output
- [ ] Cost-benefit analysis calculated
- [ ] Kibana-specific patterns suggested (Scout, Buildkite, kbn bootstrap)
- [ ] Validation checklist followed
- [ ] No regressions (tests still pass after optimization)
