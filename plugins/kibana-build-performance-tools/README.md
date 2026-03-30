# Kibana Build Performance Tools

**3 skills for build optimization, bundle analysis, and dependency management**

Diagnose and fix performance bottlenecks in Kibana build, test, and CI workflows. Identify bundle bloat, analyze Renovate PRs for breaking changes, and measure real impact with before/after metrics.

---

## Skills

| Skill | What it does | Trigger phrases |
|-------|-------------|-----------------|
| `@perf-optimizer` | Profile and fix build/test/CI bottlenecks | "optimize build time" \| "why is this test slow" \| "reduce CI time" \| "speed up build" |
| `@bundle-analyzer` | Analyze webpack bundles and recommend code splitting | "analyze bundle size for [plugin]" \| "find large dependencies" \| "suggest code splitting" \| "compare bundle sizes" |
| `@dependency-updater` | Review Renovate PRs and manage dependency updates | "review renovate PR [#]" \| "batch merge renovate PRs" \| "check security advisories" \| "analyze breaking changes" |

---

### @perf-optimizer
**Profile and fix build, test, and CI performance bottlenecks**

Four-phase workflow: detect slow operations → analyze root causes → suggest optimizations → measure impact.

- **Build analysis**: Scans webpack bundle size, compilation time, plugin loading, and bootstrap dependency resolution
- **Test profiling**: Identifies expensive Jest/Scout setup, redundant ES archive loads, and serial execution opportunities
- **CI optimization**: Finds redundant Buildkite steps, bootstrap cache misses, and under-utilized parallelism
- **Impact measurement**: Produces before/after metrics with ROI calculation (agent-hours, developer time, cost)

Typical results: 20–40% build time reduction, 50–80% test execution improvement.

---

### @bundle-analyzer
**Webpack bundle analysis with actionable size reduction recommendations**

Runs webpack-bundle-analyzer, identifies the biggest offenders, and produces a written optimization plan.

- **Dependency analysis**: Lists all dependencies by size, detects duplicates (e.g., two React versions), and suggests lighter alternatives (lodash → lodash-es saves ~80%)
- **Code splitting**: Recommends route-based lazy loading for heavy modules (Monaco, D3, charts)
- **Size tracking**: Compares bundle sizes across branches and enforces CI size budgets to prevent regression

---

### @dependency-updater
**Renovate PR reviewer with breaking change analysis and batch merging**

Fetches PR details, parses changelogs, categorizes risk, runs affected tests locally, then approves or requests changes.

- **Breaking change analysis**: Parses `CHANGELOG.md` and release notes; catches semver traps and migration guide requirements
- **Batch merging**: Groups low-risk updates (ESLint plugins, `@types/*`) for bulk review; isolates high-risk ones (TypeScript, Playwright, React)
- **Security prioritization**: Finds and fast-tracks high/critical CVE patches via `npm audit` and GitHub Security Advisories

---

## Installation

### Via Marketplace

```
/plugin marketplace add patrykkopycinski/patryks-treadmill-claude-plugins
/plugin install kibana-build-performance-tools@patryks-treadmill
```

### Manual

```bash
cd ~/.claude/plugins
git clone https://github.com/patrykkopycinski/patryks-treadmill-claude-plugins treadmill
```

Restart Claude Code or run `/reload-plugins`.

---

**Part of [Patryk's Treadmill](https://github.com/patrykkopycinski/patryks-treadmill-claude-plugins)**
