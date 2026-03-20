# Performance Optimizer - Quick Reference

## Common Commands

### Bundle Analysis
```bash
# Analyze webpack bundle
STATS_JSON=true node scripts/build_kibana_platform_plugins.js --focus <plugin>
npx webpack-bundle-analyzer webpack-stats.json

# Check for duplicates
yarn dedupe --check

# Find large dependencies
cat webpack-stats.json | jq '.assets | sort_by(.size) | reverse | .[0:10]'
```

### Test Profiling
```bash
# Profile Jest with timing
yarn test:jest --config <config> --verbose 2>&1 | grep -E "PASS|FAIL"

# Profile Scout with HTML report
node scripts/scout run-tests --arch stateful --config <config> --reporter html

# Check for expensive setup
grep -r "beforeEach" --include="*.test.ts" | xargs grep -l "es.indices.create"
```

### CI Analysis
```bash
# Buildkite GraphQL query (via API)
# See: https://buildkite.com/docs/apis/graphql-api

# Check parallelism config
grep "parallelism:" .buildkite/pipeline.yml

# Find bootstrap steps
grep -r "yarn kbn bootstrap" .buildkite/
```

### Bootstrap Optimization
```bash
# Time bootstrap
time yarn kbn bootstrap

# Enable cache
yarn config set enableGlobalCache true

# Check node_modules size
du -sh node_modules
```

## Quick Wins

### 1. Replace lodash with lodash-es (Tree-shakeable)
```typescript
// Before (450KB)
import _ from 'lodash';

// After (20KB)
import { debounce, throttle } from 'lodash-es';
```

### 2. Move ES archive to beforeAll
```typescript
// Before (5s per test)
beforeEach(async () => {
  await esArchiver.load('alerts');
});

// After (5s once)
beforeAll(async () => {
  await esArchiver.load('alerts');
});
afterAll(async () => {
  await esArchiver.unload('alerts');
});
```

### 3. Increase Scout workers
```typescript
// scout.config.ts
import os from 'os';

export default {
  workers: Math.max(1, os.cpus().length - 2),
};
```

### 4. Lazy load optional plugins
```typescript
// kibana.jsonc
{
  "plugin": {
    "requiredPlugins": ["data"],
    "optionalPlugins": ["maps", "lens", "ml"] // Lazy loaded
  }
}
```

### 5. Cache Bootstrap in CI
```yaml
# .buildkite/pipeline.yml
plugins:
  - cache#v1:
      key: "v1-yarn-{{ checksum 'yarn.lock' }}"
      paths: ["node_modules", ".yarn/cache"]
```

## Typical Impact

| Optimization | Before | After | Improvement |
|-------------|--------|-------|-------------|
| Bundle size (lodash-es) | 8.2MB | 5.8MB | -29% |
| Test suite (beforeAll) | 12m 30s | 3m 45s | -70% |
| Scout (parallelism) | 10m | 2m | -80% |
| CI (caching) | 58m | 22m | -62% |
| Bootstrap (cache) | 10m 45s | 1m 30s | -86% |

## Cost Calculations

### Agent-Hour Cost
- Buildkite agent: ~$0.50/hour
- Developer time: ~$50/hour

### ROI Formula
```
Time saved per run = Before - After
Runs per day = N
Total saved per day = Time saved * N
Implementation time = X hours
Breakeven = X / (Total saved per day)
```

### Example
- Optimization reduces CI by 30 minutes
- 100 builds per day
- 30 min * 100 = 3000 min/day = 50 hours/day
- At $0.50/hour = $25/day saved
- At $750/month = $9,000/year saved
- If implementation took 8 hours → breakeven in <1 day

## Decision Matrix

| Scope | Tools | Metrics | Impact |
|-------|-------|---------|--------|
| **Build** | webpack-bundle-analyzer, dedupe | Bundle size, compilation time | 20-40% reduction |
| **Test** | Jest --verbose, Scout HTML report | Suite duration, setup time | 50-80% faster |
| **CI** | Buildkite API, parallelism config | Agent hours, step timing | 40-60% faster |
| **Bootstrap** | time, du, yarn cache | Total duration, cache hits | 80-90% faster (cached) |

## Red Flags

### Bundle Bloat
- ⚠️ Bundle >5MB
- ⚠️ lodash imported 10+ times
- ⚠️ moment.js with all locales
- ⚠️ Duplicate dependencies (different versions)

### Test Inefficiency
- ⚠️ Suite >5 minutes with <100 tests
- ⚠️ ES archive in beforeEach
- ⚠️ Workers = 1 (serial execution)
- ⚠️ Setup time >30s per test

### CI Waste
- ⚠️ Bootstrap on every agent
- ⚠️ Full type check on every build
- ⚠️ Tests run serially
- ⚠️ No caching (yarn.lock unchanged)

## Validation Steps

After optimization:
1. ✓ Metrics collected (before/after)
2. ✓ All tests pass
3. ✓ Type check passes
4. ✓ Linting passes
5. ✓ Build succeeds
6. ✓ CI builds pass
7. ✓ Cost-benefit documented
8. ✓ Monitoring configured

## Common Pitfalls

### Don't Over-Optimize
- Avoid optimizing code that runs once
- Profile before optimizing
- Prefer simple code over premature optimization

### Watch for Trade-offs
- Lazy loading → slower first load
- Aggressive caching → stale data risk
- Parallel tests → potential race conditions
- Code splitting → harder debugging

## References

- Full instructions: [SKILL.md](SKILL.md)
- Test scenarios: [test_scenarios.md](test_scenarios.md)
- Helper tools: [perf_tools.sh](perf_tools.sh)
- Webpack docs: https://webpack.js.org/guides/build-performance/
- Jest performance: https://jestjs.io/docs/troubleshooting
- Scout docs: https://github.com/elastic/kibana/blob/main/packages/kbn-scout/README.md
