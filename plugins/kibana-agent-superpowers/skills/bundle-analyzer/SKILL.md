# Bundle Analyzer Agent

## Description
Analyze Kibana bundle size and performance: run webpack-bundle-analyzer, identify large dependencies, suggest alternatives, recommend code splitting and tree-shaking optimizations, and measure bundle size reduction impact.

## Trigger Patterns
- "analyze bundle size for [plugin]"
- "find large dependencies in [package]"
- "suggest code splitting for [feature]"
- "optimize bundle for [plugin]"
- "measure bundle size impact of [change]"
- "compare bundle sizes between [branch1] and [branch2]"

## Capabilities

### 1. Bundle Analysis
- Run webpack-bundle-analyzer
- Generate visual bundle reports
- Identify largest modules and chunks
- Calculate gzipped sizes

### 2. Dependency Analysis
- List all dependencies by size
- Identify duplicate dependencies
- Find unused dependencies
- Suggest lighter alternatives

### 3. Optimization Recommendations
- Code splitting opportunities
- Tree-shaking improvements
- Dynamic imports for large modules
- Lazy loading strategies

### 4. Size Tracking
- Track bundle size over time
- Compare before/after changes
- Set size budgets and alerts
- Generate size impact reports

### 5. Performance Metrics
- Initial load time impact
- Chunk loading performance
- Cache effectiveness
- Network transfer size

## Bundle Analysis Workflow

### Step 1: Build with Analyzer
```bash
# Build Kibana with bundle analyzer enabled
NODE_OPTIONS="--max-old-space-size=8192" \
  node scripts/build_kibana_platform_plugins.js \
    --focus @kbn/security-solution-plugin \
    --dist \
    --profile \
    --no-cache

# Or build specific plugin
yarn workspace @kbn/security-solution-plugin build

# Analyzer generates report in build/plugins/<plugin>/stats.html
```

### Step 2: Open Report
```bash
# Open in browser
open build/plugins/security_solution/stats.html

# Or serve with HTTP server
npx http-server build/plugins/security_solution -o /stats.html
```

### Step 3: Analyze Report

**Report Sections:**
- **Stat Size**: Raw source code size
- **Parsed Size**: Minified size
- **Gzipped Size**: Compressed size (network transfer)

**What to Look For:**
1. **Large modules** (>500KB parsed)
   - Often: lodash, moment, monaco-editor
   - Action: Replace or split

2. **Duplicate dependencies** (same package, different versions)
   - Often: react, @elastic/eui
   - Action: Deduplicate via yarn resolutions

3. **Unused code** (large library, small usage)
   - Often: Importing entire library for one function
   - Action: Import specific functions

4. **Large chunks** (>1MB gzipped)
   - Often: Security Solution, Canvas
   - Action: Code split by route

### Step 4: Generate Size Report
```bash
# Extract bundle sizes
cat > bundle-report.md <<EOF
# Bundle Analysis: Security Solution Plugin

## Summary
- **Total Size (parsed):** 15.2 MB
- **Total Size (gzipped):** 4.8 MB
- **Largest Module:** monaco-editor (2.3 MB)
- **Chunk Count:** 25

## Top 10 Largest Modules
| Module | Parsed Size | Gzipped Size |
|--------|-------------|--------------|
| monaco-editor | 2.3 MB | 720 KB |
| lodash | 1.8 MB | 580 KB |
| @elastic/eui | 1.5 MB | 480 KB |
| react | 800 KB | 250 KB |
| d3 | 650 KB | 200 KB |

## Optimization Opportunities
1. **Monaco Editor:** Lazy load (route-based split)
2. **Lodash:** Replace with lodash-es (tree-shakeable)
3. **D3:** Import specific modules, not entire library
EOF
```

## Dependency Analysis

### List Dependencies by Size
```bash
# Use webpack-bundle-analyzer JSON output
node scripts/build_kibana_platform_plugins.js \
  --focus @kbn/security-solution-plugin \
  --dist \
  --profile \
  --json > bundle-stats.json

# Parse JSON for dependency sizes
jq '.modules[] | {name: .name, size: .size}' bundle-stats.json \
  | jq -s 'sort_by(.size) | reverse | .[:10]'

# Output:
# [
#   { "name": "monaco-editor", "size": 2400000 },
#   { "name": "lodash", "size": 1800000 },
#   { "name": "@elastic/eui", "size": 1500000 }
# ]
```

### Find Duplicate Dependencies
```bash
# Check for duplicate versions
yarn why <package-name>

# Example: yarn why react
# ├─ @elastic/eui@v92.0.0
# │  └─ react@^18.2.0
# └─ @kbn/security-solution-plugin@1.0.0
#    └─ react@^18.3.0  <-- DUPLICATE VERSION

# Fix with yarn resolutions
cat > package.json <<EOF
{
  "resolutions": {
    "react": "^18.3.0"
  }
}
EOF

yarn kbn bootstrap
```

### Find Unused Dependencies
```bash
# Install depcheck
yarn add --dev depcheck

# Run depcheck
npx depcheck x-pack/solutions/security/plugins/security_solution

# Output:
# Unused dependencies:
# * unused-package-1
# * unused-package-2

# Remove unused deps
yarn workspace @kbn/security-solution-plugin remove unused-package-1
```

### Suggest Lighter Alternatives

| Heavy Dependency | Lighter Alternative | Size Savings |
|------------------|---------------------|--------------|
| `lodash` (1.8 MB) | `lodash-es` (tree-shakeable) | ~80% |
| `moment` (800 KB) | `date-fns` (modular) | ~70% |
| `axios` (500 KB) | `fetch` (native) | 100% |
| `d3` (650 KB) | `d3-*` (specific modules) | ~60% |
| `monaco-editor` (2.3 MB) | Lazy load + split | 0% initial |

## Optimization Strategies

### 1. Code Splitting (Route-Based)
```typescript
// Before: Large Monaco editor loaded on initial load
import { MonacoEditor } from 'monaco-editor';

export function RuleEditor() {
  return <MonacoEditor />;
}

// After: Lazy load Monaco only when rule editor route is visited
import { lazy, Suspense } from 'react';

const MonacoEditor = lazy(() => import('monaco-editor').then(m => ({ default: m.MonacoEditor })));

export function RuleEditor() {
  return (
    <Suspense fallback={<div>Loading editor...</div>}>
      <MonacoEditor />
    </Suspense>
  );
}

// Size impact: -2.3 MB from initial bundle
// Monaco loads only when needed (route change)
```

### 2. Tree-Shaking (Import Specific Modules)
```typescript
// Before: Import entire library (no tree-shaking)
import _ from 'lodash';
const result = _.debounce(fn, 300);

// After: Import specific function (tree-shakeable)
import debounce from 'lodash-es/debounce';
const result = debounce(fn, 300);

// Size impact: -1.7 MB (only debounce function included)
```

### 3. Dynamic Imports (Conditional Loading)
```typescript
// Before: Large charting library loaded always
import { Chart } from 'large-charting-lib';

export function Dashboard({ showChart }) {
  return showChart ? <Chart /> : null;
}

// After: Load charting library only when needed
export function Dashboard({ showChart }) {
  const [Chart, setChart] = useState(null);

  useEffect(() => {
    if (showChart && !Chart) {
      import('large-charting-lib').then(({ Chart }) => setChart(() => Chart));
    }
  }, [showChart, Chart]);

  return showChart && Chart ? <Chart /> : null;
}

// Size impact: -650 KB from initial bundle (loaded on demand)
```

### 4. Externalize Dependencies (CDN)
```typescript
// webpack.config.js
module.exports = {
  externals: {
    react: 'React',
    'react-dom': 'ReactDOM',
  },
};

// index.html
// <script src="https://cdn.jsdelivr.net/npm/react@18/umd/react.production.min.js"></script>

// Size impact: -800 KB from bundle (served from CDN)
// Note: Only for public-facing apps, not Kibana (offline support required)
```

### 5. Remove Unused Code (Dead Code Elimination)
```typescript
// Before: Importing entire utility file
import { utilityA, utilityB, utilityC, utilityD } from './utils';
// Only utilityA used

// After: Inline utility or split utilities
import { utilityA } from './utils/utility_a';

// Size impact: Varies (removes unused utilityB, utilityC, utilityD)
```

## Size Tracking & Budgets

### Track Bundle Size Over Time
```bash
# Record baseline
node scripts/build_kibana_platform_plugins.js \
  --focus @kbn/security-solution-plugin \
  --dist \
  --profile

BASELINE_SIZE=$(stat -f%z build/plugins/security_solution/target/public/security_solution.chunk.1.js)
echo "Baseline size: $BASELINE_SIZE bytes" > bundle-size-baseline.txt

# After changes, compare
node scripts/build_kibana_platform_plugins.js \
  --focus @kbn/security-solution-plugin \
  --dist \
  --profile

NEW_SIZE=$(stat -f%z build/plugins/security_solution/target/public/security_solution.chunk.1.js)
DIFF=$((NEW_SIZE - BASELINE_SIZE))
PERCENT=$(awk "BEGIN {printf \"%.2f\", ($DIFF / $BASELINE_SIZE) * 100}")

echo "New size: $NEW_SIZE bytes"
echo "Diff: $DIFF bytes ($PERCENT%)"
```

### Set Size Budgets
```typescript
// webpack.config.js
module.exports = {
  performance: {
    maxAssetSize: 500000, // 500 KB warning
    maxEntrypointSize: 1000000, // 1 MB warning
    hints: 'warning', // or 'error' to fail build
  },
};

// CI check for bundle size
// .buildkite/pipeline.yml
steps:
  - label: "Check bundle size"
    command: |
      node scripts/build_kibana_platform_plugins.js --focus @kbn/security-solution-plugin --dist
      SIZE=$(stat -f%z build/plugins/security_solution/target/public/security_solution.chunk.1.js)
      MAX_SIZE=5000000  # 5 MB limit
      if [ $SIZE -gt $MAX_SIZE ]; then
        echo "❌ Bundle size exceeds limit: $SIZE > $MAX_SIZE"
        exit 1
      fi
      echo "✅ Bundle size within limit: $SIZE <= $MAX_SIZE"
```

### Compare Branches
```bash
# Build main branch
git checkout main
yarn kbn bootstrap
node scripts/build_kibana_platform_plugins.js --focus @kbn/security-solution-plugin --dist
MAIN_SIZE=$(stat -f%z build/plugins/security_solution/target/public/security_solution.chunk.1.js)

# Build feature branch
git checkout feature/my-changes
yarn kbn bootstrap
node scripts/build_kibana_platform_plugins.js --focus @kbn/security-solution-plugin --dist
FEATURE_SIZE=$(stat -f%z build/plugins/security_solution/target/public/security_solution.chunk.1.js)

# Compare
DIFF=$((FEATURE_SIZE - MAIN_SIZE))
PERCENT=$(awk "BEGIN {printf \"%.2f\", ($DIFF / $MAIN_SIZE) * 100}")

cat > bundle-comparison.md <<EOF
# Bundle Size Comparison

| Branch | Size | Diff | % Change |
|--------|------|------|----------|
| main | $(numfmt --to=iec $MAIN_SIZE) | - | - |
| feature/my-changes | $(numfmt --to=iec $FEATURE_SIZE) | $(numfmt --to=iec $DIFF) | $PERCENT% |

## Impact
$(if [ $DIFF -gt 0 ]; then echo "⚠️ Bundle size increased"; else echo "✅ Bundle size decreased"; fi)
EOF
```

## Performance Metrics

### Initial Load Time
```typescript
// Measure time to interactive (TTI)
// Use Lighthouse CI or Performance Observer

// performance.mark() in code
performance.mark('plugin-load-start');
// ... plugin initialization
performance.mark('plugin-load-end');
performance.measure('plugin-load', 'plugin-load-start', 'plugin-load-end');

const measure = performance.getEntriesByName('plugin-load')[0];
console.log('Plugin load time:', measure.duration, 'ms');
```

### Chunk Loading Performance
```bash
# Analyze chunk loading with Chrome DevTools
# 1. Open Chrome DevTools (Network tab)
# 2. Navigate to Kibana plugin
# 3. Filter by JS files
# 4. Check:
#    - Chunk sizes (smaller = faster)
#    - Load order (critical chunks first)
#    - Caching (304 responses for unchanged chunks)

# Export HAR file for analysis
# DevTools > Network > Export HAR

# Analyze HAR with webpagetest.org or har-analyzer
```

### Cache Effectiveness
```bash
# Check cache headers
curl -I https://localhost:5601/plugins/securitySolution/securitySolution.chunk.1.js

# Should see:
# Cache-Control: public, max-age=31536000, immutable

# Kibana uses content-hash filenames for cache busting
# securitySolution.chunk.1.[hash].js
```

## Integration with Other Skills

### With `@buildkite-ci-debugger`
```bash
# Debug CI bundle size failure
@buildkite-ci-debugger --build <url>

# If bundle size check fails:
@bundle-analyzer analyze bundle size for security-solution
@bundle-analyzer compare bundle sizes between main and my-branch
```

### With `@migration-planner`
```bash
# Plan migration to reduce bundle size
@migration-planner create migration for lodash to lodash-es
@bundle-analyzer measure bundle size impact of lodash-es migration
```

### With `@dependency-updater`
```bash
# Analyze bundle impact of dependency update
@dependency-updater review renovate PR #12345
@bundle-analyzer analyze bundle size for updated dependency
```

## Examples

### Example 1: Analyze Security Solution Bundle
**User:** "analyze bundle size for security-solution plugin"

**Agent Actions:**
```bash
# 1. Build with analyzer
node scripts/build_kibana_platform_plugins.js \
  --focus @kbn/security-solution-plugin \
  --dist \
  --profile

# 2. Open report
open build/plugins/security_solution/stats.html

# 3. Identify top 5 largest modules
# - monaco-editor: 2.3 MB
# - lodash: 1.8 MB
# - @elastic/eui: 1.5 MB
# - react: 800 KB
# - d3: 650 KB

# 4. Generate report
cat > security-solution-bundle-report.md <<EOF
# Security Solution Bundle Analysis

## Summary
- **Total Size (parsed):** 15.2 MB
- **Total Size (gzipped):** 4.8 MB
- **Chunk Count:** 25

## Optimization Opportunities
1. **Monaco Editor (2.3 MB):** Lazy load in rule editor
2. **Lodash (1.8 MB):** Replace with lodash-es
3. **D3 (650 KB):** Import specific modules only

## Estimated Savings
- Monaco lazy load: -2.3 MB initial load
- Lodash-es: -1.4 MB (tree-shaking)
- D3 modules: -390 KB
- **Total:** -4.09 MB (~27% reduction)
EOF
```

**Output:** Detailed bundle report with optimization plan.

### Example 2: Suggest Code Splitting
**User:** "suggest code splitting for security-solution rule editor"

**Agent Actions:**
```typescript
// 1. Identify large module loaded on initial load
// monaco-editor (2.3 MB) loaded in rule editor

// 2. Check usage
// Only used in /rules/create and /rules/edit routes

// 3. Suggest lazy loading
// Before: Direct import
import { MonacoEditor } from 'monaco-editor';

export function RuleEditor() {
  return <MonacoEditor />;
}

// After: Lazy load
import { lazy, Suspense } from 'react';

const MonacoEditor = lazy(() =>
  import('monaco-editor').then(m => ({ default: m.MonacoEditor }))
);

export function RuleEditor() {
  return (
    <Suspense fallback={<EuiLoadingSpinner />}>
      <MonacoEditor />
    </Suspense>
  );
}

// 4. Generate implementation plan
cat > code-splitting-plan.md <<EOF
# Code Splitting: Monaco Editor

## Change
Lazy load Monaco Editor in rule editor routes.

## Impact
- **Initial bundle:** -2.3 MB
- **Rule editor load:** +2.3 MB (on-demand)
- **Net benefit:** Faster initial page load

## Implementation
1. Replace direct import with lazy()
2. Add Suspense with loading spinner
3. Test rule editor loads Monaco correctly
4. Verify bundle size reduction

## Testing
- Navigate to /rules (Monaco should NOT load)
- Navigate to /rules/create (Monaco should load)
- Check Network tab (monaco chunk loaded on-demand)
EOF
```

**Output:** Code splitting implementation with size impact.

### Example 3: Compare Bundle Sizes
**User:** "compare bundle sizes between main and my-branch"

**Agent Actions:**
```bash
# 1. Build main branch
git checkout main
yarn kbn bootstrap
node scripts/build_kibana_platform_plugins.js --focus @kbn/security-solution-plugin --dist
MAIN_SIZE=$(stat -f%z build/plugins/security_solution/target/public/security_solution.chunk.1.js)

# 2. Build feature branch
git checkout my-branch
yarn kbn bootstrap
node scripts/build_kibana_platform_plugins.js --focus @kbn/security-solution-plugin --dist
FEATURE_SIZE=$(stat -f%z build/plugins/security_solution/target/public/security_solution.chunk.1.js)

# 3. Calculate diff
DIFF=$((FEATURE_SIZE - MAIN_SIZE))
PERCENT=$(awk "BEGIN {printf \"%.2f\", ($DIFF / $MAIN_SIZE) * 100}")

# 4. Generate report
cat > bundle-comparison.md <<EOF
# Bundle Size Comparison

| Branch | Size | Diff | % Change |
|--------|------|------|----------|
| main | 4.8 MB | - | - |
| my-branch | 4.5 MB | -300 KB | -6.25% |

## Impact
✅ Bundle size decreased by 300 KB (6.25%)

## Changes
- Replaced lodash with lodash-es
- Removed unused d3 modules
- Lazy loaded Monaco editor

## Recommendation
Proceed with merge. Significant bundle size improvement.
EOF
```

**Output:** Side-by-side bundle comparison.

### Example 4: Identify Duplicate Dependencies
**User:** "find large dependencies in security-solution"

**Agent Actions:**
```bash
# 1. Build with JSON output
node scripts/build_kibana_platform_plugins.js \
  --focus @kbn/security-solution-plugin \
  --dist \
  --json > bundle-stats.json

# 2. Parse top 10 modules by size
jq '.modules[] | {name: .name, size: .size}' bundle-stats.json \
  | jq -s 'sort_by(.size) | reverse | .[:10]'

# 3. Check for duplicates
yarn why react
# Found: react@18.2.0 and react@18.3.0 (duplicate!)

# 4. Generate report
cat > dependency-report.md <<EOF
# Dependency Analysis: Security Solution

## Top 10 Largest Dependencies
1. monaco-editor: 2.3 MB
2. lodash: 1.8 MB
3. @elastic/eui: 1.5 MB
4. react: 800 KB
5. d3: 650 KB

## Duplicate Dependencies
- **react:** v18.2.0 (from @elastic/eui) and v18.3.0 (from plugin)
  - **Fix:** Add yarn resolution for react@^18.3.0
  - **Savings:** ~200 KB

## Optimization Recommendations
1. Deduplicate react versions
2. Replace lodash with lodash-es
3. Lazy load monaco-editor
EOF
```

**Output:** Dependency report with duplicates identified.

## Best Practices

### Bundle Analysis
- ✅ Run analyzer after major dependency updates
- ✅ Check gzipped sizes (network transfer)
- ✅ Focus on largest modules first (biggest impact)
- ✅ Track bundle size over time (CI checks)
- ❌ Don't ignore warnings (they add up)
- ❌ Don't optimize prematurely (measure first)

### Code Splitting
- ✅ Split by route (user may not visit all pages)
- ✅ Lazy load heavy components (Monaco, charts)
- ✅ Use Suspense with loading UI (UX)
- ❌ Don't over-split (too many chunks = slow)
- ❌ Don't split critical path (initial render)

### Tree-Shaking
- ✅ Import specific functions (not default exports)
- ✅ Use ES modules (not CommonJS)
- ✅ Enable sideEffects: false in package.json
- ❌ Don't import entire libraries (import * from)
- ❌ Don't use default imports for utilities

### Size Budgets
- ✅ Set realistic budgets (based on baseline)
- ✅ Fail CI on budget violations (enforce)
- ✅ Track size trends (prevent regressions)
- ❌ Don't ignore budget warnings
- ❌ Don't set arbitrary budgets (measure first)

## Anti-Patterns

### ❌ Don't Do This
```typescript
// Import entire library
import _ from 'lodash';
import * as d3 from 'd3';

// Load heavy component on initial load
import { MonacoEditor } from 'monaco-editor';
export function App() {
  return <MonacoEditor />;
}

// Duplicate dependencies (no resolutions)
// package.json
{
  "dependencies": {
    "react": "^18.2.0",
    "@elastic/eui": "^92.0.0" // depends on react@^18.3.0
  }
}
```

### ✅ Do This Instead
```typescript
// Import specific functions
import debounce from 'lodash-es/debounce';
import { scaleLinear } from 'd3-scale';

// Lazy load heavy component
const MonacoEditor = lazy(() => import('monaco-editor'));
export function App() {
  return <Suspense fallback={<Spinner />}><MonacoEditor /></Suspense>;
}

// Deduplicate dependencies
// package.json
{
  "dependencies": {
    "react": "^18.3.0",
    "@elastic/eui": "^92.0.0"
  },
  "resolutions": {
    "react": "^18.3.0"
  }
}
```

## Tools

### webpack-bundle-analyzer
```bash
# Install
yarn add --dev webpack-bundle-analyzer

# Add to webpack config
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

module.exports = {
  plugins: [
    new BundleAnalyzerPlugin({
      analyzerMode: 'static',
      reportFilename: 'bundle-report.html',
      openAnalyzer: false,
    }),
  ],
};
```

### size-limit
```bash
# Install
yarn add --dev size-limit @size-limit/preset-app

# Add to package.json
{
  "size-limit": [
    {
      "path": "build/plugins/security_solution/target/public/*.js",
      "limit": "5 MB"
    }
  ]
}

# Run
npx size-limit
```

### bundlesize
```bash
# Install
yarn add --dev bundlesize

# Add to package.json
{
  "bundlesize": [
    {
      "path": "./build/plugins/security_solution/target/public/*.js",
      "maxSize": "5 MB"
    }
  ]
}

# Run
npx bundlesize
```

## Notes
- Focus on gzipped sizes (what users download)
- Lazy loading trades initial load for on-demand load
- Tree-shaking requires ES modules (not CommonJS)
- Bundle analyzer runs automatically with --profile flag
- Kibana uses content-hash filenames for cache busting
