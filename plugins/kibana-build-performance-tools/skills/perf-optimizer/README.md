# Performance Optimizer Agent Skill

Identifies and fixes performance bottlenecks in Kibana build, test, and CI workflows.

## Quick Start

### Activate the Skill

The skill automatically activates when you use performance-related keywords:
- "optimize build time"
- "why is this test slow"
- "reduce CI time"
- "analyze performance"

### Example Usage

```
User: "Why is the Security Solution build so slow?"

Agent:
1. Generates webpack stats for Security Solution plugin
2. Analyzes bundle with webpack-bundle-analyzer
3. Identifies large dependencies (lodash 450KB, moment 160KB)
4. Suggests tree-shaking and locale reduction
5. Estimates 29% bundle size reduction
```

## What This Skill Does

### 1. Detect Slow Operations
- **Build**: Webpack bundle size, compilation time, plugin loading
- **Test**: Jest/Scout execution time, setup/teardown duration
- **CI**: Buildkite agent hours, step duration, parallelism
- **Bootstrap**: Dependency resolution, linking, building

### 2. Analyze Bottlenecks
- **Bundle bloat**: Large packages, duplicate dependencies, dead code
- **Test inefficiency**: Expensive setup, redundant ES archives, serial execution
- **CI waste**: Redundant steps, under-utilized parallelism, cache misses
- **Startup overhead**: Non-lazy loadable code, synchronous imports

### 3. Suggest Optimizations
- **Code splitting**: Dynamic imports, lazy components
- **Caching**: Webpack, Jest, Scout ES snapshots
- **Parallelization**: Increase workers, Buildkite agents
- **Tree-shaking**: lodash-es, eliminate side effects
- **Global setup**: Shared fixtures, reusable ES instances

### 4. Measure Impact
- Before/after metrics (timing, size, cost)
- ROI calculation (implementation time vs savings)
- Cost analysis (agent-hour savings)

## Helper Tools

The skill includes a shell script with common analysis commands:

```bash
# Analyze webpack bundle
~/.agents/skills/perf-optimizer/perf_tools.sh analyze_bundle securitySolution

# Profile Jest tests
~/.agents/skills/perf-optimizer/perf_tools.sh profile_jest path/to/jest.config.js

# Profile Scout tests
~/.agents/skills/perf-optimizer/perf_tools.sh profile_scout path/to/scout.config.ts

# Analyze CI timing
~/.agents/skills/perf-optimizer/perf_tools.sh analyze_ci main

# Check for duplicate dependencies
~/.agents/skills/perf-optimizer/perf_tools.sh check_duplicates

# Analyze bootstrap performance
~/.agents/skills/perf-optimizer/perf_tools.sh analyze_bootstrap
```

## Test Scenarios

See [test_scenarios.md](test_scenarios.md) for 6 realistic test cases:
1. Bundle bloat detection (Security Solution)
2. Slow test suite optimization (Detection Engine)
3. CI pipeline optimization (Platform builds)
4. Bootstrap performance tuning
5. Scout parallelism optimization
6. Plugin lazy loading

## Kibana-Specific Patterns

### Bootstrap Optimization
```bash
# Cache node_modules in CI
plugins:
  - cache#v1:
      key: "v1-yarn-{{ checksum 'yarn.lock' }}"
      paths: ["node_modules", ".yarn/cache"]
```

### Scout Parallelism
```typescript
// scout.config.ts
export default {
  workers: Math.max(1, os.cpus().length - 2),
};
```

### ES Archive Caching
```typescript
// Use beforeAll instead of beforeEach
test.beforeAll(async ({ esClient }) => {
  await esArchiver.load('security_solution/alerts');
});
```

### Plugin Lazy Loading
```typescript
// kibana.jsonc
{
  "plugin": {
    "requiredPlugins": ["data"],
    "optionalPlugins": ["maps", "lens", "ml"] // Lazy loaded
  }
}
```

## Expected Output Format

The skill follows a structured 5-phase workflow:

### Phase 1: Detection & Diagnosis
- Identify scope (build/test/CI)
- Gather baseline metrics
- Run automated analysis

### Phase 2: Root Cause Analysis
- Identify specific bottlenecks
- Categorize by pattern (bloat/inefficiency/waste)
- Quantify impact

### Phase 3: Optimization Strategies
- Suggest targeted fixes
- Provide code examples
- Estimate impact

### Phase 4: Impact Measurement
- Before/after metrics
- Cost-benefit analysis
- ROI calculation

### Phase 5: Implementation & Validation
- Create optimization branch
- Apply changes incrementally
- Validate no regressions

## Validation Checklist

Before declaring optimization complete:
- [ ] Metrics collected (before/after)
- [ ] All tests pass
- [ ] Type check passes
- [ ] Linting passes
- [ ] Build succeeds
- [ ] CI builds pass
- [ ] Cost-benefit analysis documented
- [ ] Monitoring configured

## Success Criteria

Optimization is successful when:
1. Metrics improve by ≥20%
2. No regressions in functionality
3. ROI breakeven within 2 weeks
4. Monitoring in place
5. Documentation updated

## References

- [SKILL.md](SKILL.md) - Full skill instructions
- [test_scenarios.md](test_scenarios.md) - Test cases
- [perf_tools.sh](perf_tools.sh) - Helper scripts
- [Webpack Bundle Analyzer](https://github.com/webpack-contrib/webpack-bundle-analyzer)
- [Jest Performance](https://jestjs.io/docs/troubleshooting)
- [Scout Docs](https://github.com/elastic/kibana/blob/main/packages/kbn-scout/README.md)
- [Kibana PERFORMANCE.md](https://github.com/elastic/kibana/blob/main/PERFORMANCE.md)
