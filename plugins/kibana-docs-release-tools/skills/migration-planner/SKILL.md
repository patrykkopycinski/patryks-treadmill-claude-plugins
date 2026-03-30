---
name: migration-planner
description: Plan and execute large-scale migrations in Kibana by analyzing scope, estimating effort, generating phased rollout plans, tracking progress, and producing stakeholder reports.
---

# Migration Planner Agent

## Description
Plan and execute large-scale migrations in Kibana: Cypress→Scout, FTR→Scout, API versioning, package migrations. Analyze scope, estimate effort, generate phased rollout plans, track progress, and generate stakeholder reports.

## Trigger Patterns
- "plan migration from [X] to [Y]"
- "analyze scope of [migration type]"
- "create migration phases for [feature]"
- "track migration progress"
- "generate migration status report"
- "estimate migration effort"

## Capabilities

### 1. Scope Analysis
- Scan codebase for migration candidates
- Identify dependencies and blockers
- Categorize by complexity (trivial, moderate, complex)
- Generate file manifest with risk assessment

### 2. Effort Estimation
- Calculate story points based on complexity
- Estimate timeline with confidence intervals
- Identify required expertise/reviewers
- Account for testing overhead

### 3. Phase Planning
- Break migration into logical phases
- Identify parallel work streams
- Define milestones and success criteria
- Generate rollout order (low-risk first)

### 4. Progress Tracking
- Track completed vs remaining work
- Identify blockers and risks
- Calculate velocity and ETA
- Generate burndown charts (markdown)

### 5. Stakeholder Reporting
- Generate executive summaries
- Provide detailed technical reports
- Create RFC documents
- Track business impact

## Migration Types

### Cypress → Scout
```typescript
interface CypressToScoutMigration {
  // Analysis
  findCypressTests: () => CypressTestFile[];
  assessComplexity: (file: CypressTestFile) => ComplexityScore;
  identifyCustomCommands: () => CustomCommand[];

  // Planning
  generatePhases: () => MigrationPhase[];
  estimateEffort: () => EffortEstimate;
  createConversionGuide: () => ConversionPattern[];

  // Execution
  convertTest: (file: CypressTestFile) => ScoutTest;
  validateConversion: (scoutTest: ScoutTest) => ValidationResult;
  trackProgress: () => ProgressReport;
}
```

**Scope Analysis Steps:**
1. Find all Cypress specs: `find . -name "*.cy.ts" -o -name "*.cy.js"`
2. Analyze custom commands in `cypress/support/`
3. Check for Cypress-specific patterns (`.should()`, `.invoke()`)
4. Identify shared fixtures and utilities
5. Map to equivalent Scout patterns

**Conversion Patterns:**
| Cypress | Scout | Complexity |
|---------|-------|------------|
| `cy.visit()` | `page.goto()` | Low |
| `cy.get().click()` | `page.click()` | Low |
| `cy.intercept()` | `page.route()` | Medium |
| Custom commands | Helper functions | High |

### FTR → Scout
```typescript
interface FTRToScoutMigration {
  // Analysis
  findFTRTests: () => FTRTestFile[];
  analyzeServices: (file: FTRTestFile) => ServiceDependency[];
  identifyPageObjects: () => PageObject[];

  // Planning
  mapServicesToScout: () => ServiceMapping[];
  generateFixtureStrategy: () => FixtureStrategy;
  planDataSetupMigration: () => DataSetupPlan;

  // Execution
  convertTest: (file: FTRTestFile) => ScoutTest;
  migratePageObjects: (po: PageObject) => ScoutHelper;
  trackProgress: () => ProgressReport;
}
```

**Scope Analysis Steps:**
1. Find FTR configs: `find . -name "ftr_configs.js" -o -name "config.ts"`
2. Analyze FTR services usage (esArchiver, kibanaServer, etc.)
3. Identify page objects in `page_objects/`
4. Map test types (UI, API, integration)
5. Assess data setup complexity

**Service Mapping:**
| FTR Service | Scout Equivalent | Notes |
|-------------|------------------|-------|
| `esArchiver` | `scoutPowerBar.loadEsArchive()` | Direct mapping |
| `kibanaServer.uiSettings` | `page.request.put()` | API calls |
| `browser.clickByCssSelector()` | `page.click()` | Playwright API |
| `retry.try()` | `expect().toPass()` | Playwright auto-retry |

### API Versioning Migration
```typescript
interface APIVersioningMigration {
  // Analysis
  findUnversionedAPIs: () => APIRoute[];
  identifyBreakingChanges: (route: APIRoute) => BreakingChange[];
  analyzeClientUsage: (route: APIRoute) => ClientUsage[];

  // Planning
  generateVersioningStrategy: () => VersioningStrategy;
  planBackwardCompatibility: () => CompatibilityPlan;
  createDeprecationTimeline: () => DeprecationPlan;

  // Execution
  versionAPI: (route: APIRoute) => VersionedAPI;
  updateClients: (clients: ClientUsage[]) => ClientUpdate[];
  trackAdoption: () => AdoptionReport;
}
```

**Scope Analysis Steps:**
1. Find route registrations: `grep -r "router.get\|router.post" x-pack/`
2. Identify unversioned routes (no `version: "2023-10-31"`)
3. Check for breaking changes in route schemas
4. Find client usage (React Query hooks, service calls)
5. Assess deprecation risk

### Package Migration
```typescript
interface PackageMigration {
  // Analysis
  findTargetCode: () => CodeFile[];
  analyzeImports: (file: CodeFile) => ImportDependency[];
  checkCircularDeps: () => CircularDependency[];

  // Planning
  designPackageStructure: () => PackageStructure;
  planImportUpdates: () => ImportUpdate[];
  generateBuildConfig: () => BuildConfig;

  // Execution
  createPackage: (structure: PackageStructure) => Package;
  moveFiles: (files: CodeFile[]) => MoveResult;
  updateImports: (updates: ImportUpdate[]) => UpdateResult;
  validateBuild: () => BuildResult;
}
```

## Workflow

### Phase 1: Discovery & Analysis
```bash
# Run analysis tools
# Cypress example:
echo "Analyzing Cypress tests..."
find x-pack -name "*.cy.ts" | wc -l
grep -r "cy.intercept" x-pack | wc -l
find x-pack -path "*/cypress/support/*" -name "*.ts"

# Generate scope report
cat > migration-scope.md <<EOF
# Cypress → Scout Migration Scope

## Summary
- Total Cypress tests: X files
- Custom commands: Y files
- Network intercepts: Z usages
- Estimated complexity: High/Medium/Low

## Files by Complexity
### High (custom commands, complex assertions)
- path/to/test1.cy.ts
- path/to/test2.cy.ts

### Medium (network mocking, async)
- path/to/test3.cy.ts

### Low (simple click/type)
- path/to/test4.cy.ts
EOF
```

### Phase 2: Planning
```markdown
# Migration Plan: Cypress → Scout

## Objectives
- Migrate X Cypress tests to Scout
- Improve test reliability (reduce flakiness by Y%)
- Reduce test execution time by Z%

## Phases

### Phase 1: Low-Risk Tests (Week 1-2)
**Target:** 10 simple tests
**Criteria:** No custom commands, no network mocking
**Files:**
- x-pack/test_serverless/functional/test_suites/common/discover/context_awareness/_root_profile.cy.ts
- ...

**Success Metrics:**
- All tests pass in CI
- No increase in execution time
- Team trained on Scout patterns

### Phase 2: Medium-Risk Tests (Week 3-4)
**Target:** 15 tests with network mocking
**Criteria:** Uses cy.intercept(), moderate assertions
**Prerequisites:** Phase 1 complete, Scout helpers created

### Phase 3: High-Risk Tests (Week 5-6)
**Target:** 5 complex tests
**Criteria:** Custom commands, complex page interactions
**Prerequisites:** Custom command migration complete

## Risk Mitigation
- Run both Cypress and Scout tests in parallel initially
- Create conversion guide for team
- Pair programming for complex conversions
- Weekly sync on blockers

## Rollback Plan
- Keep Cypress tests until Scout tests stable (2 weeks)
- Revert Scout test if CI red > 24 hours
- Document known issues
```

### Phase 3: Execution
```bash
# Convert one test at a time
# Example: Cypress → Scout conversion

# Before (Cypress):
# describe('Discover', () => {
#   it('should display data', () => {
#     cy.visit('/app/discover');
#     cy.get('[data-test-subj="hits-counter"]').should('contain', '14,005');
#   });
# });

# After (Scout):
# import { expect, test } from '@playwright/test';
# import { createScoutInstance } from '@kbn/scout';
#
# test.describe('Discover', () => {
#   test('should display data', async ({ page }) => {
#     const scout = await createScoutInstance(page);
#     await scout.common.navigateTo('discover');
#     await expect(page.getByTestId('hits-counter')).toContainText('14,005');
#   });
# });

# Validate conversion
node scripts/scout run-tests --config x-pack/test/scout_functional/apps/discover/config.ts
```

### Phase 4: Tracking
```bash
# Generate progress report
cat > migration-progress.md <<EOF
# Migration Progress Report
**Date:** $(date +%Y-%m-%d)
**Sprint:** Sprint 23

## Summary
- **Completed:** 15/30 tests (50%)
- **In Progress:** 5 tests
- **Blocked:** 2 tests (custom command issue #12345)
- **Remaining:** 8 tests

## Velocity
- **Current sprint:** 10 tests
- **Previous sprint:** 8 tests
- **Trend:** ↑ 25%
- **ETA:** 2 sprints (April 15)

## Blockers
1. **Custom command `cy.loginAs()`**: No Scout equivalent
   - **Owner:** @username
   - **Status:** PR #67890 in review
   - **Impact:** Blocks 5 tests

## Next Sprint Plan
- Complete Phase 2 (medium-risk tests)
- Resolve blocker #1
- Start Phase 3 (high-risk tests)
EOF
```

### Phase 5: Reporting
```markdown
# Executive Summary: Cypress → Scout Migration

## Status: On Track ✅

### Key Metrics
- **Progress:** 50% complete (15/30 tests)
- **Timeline:** On track for Q2 completion
- **Risk Level:** Low (1 blocker, mitigation in place)

### Business Impact
- **Test Reliability:** +15% pass rate (Scout auto-retry)
- **CI Time:** -20% (parallel execution)
- **Developer Experience:** Improved debugging (Playwright Inspector)

### Next Milestones
- **April 1:** Phase 2 complete (25/30 tests)
- **April 15:** Phase 3 complete (30/30 tests)
- **April 22:** Cypress suite removal

### Risks & Mitigation
- **Risk:** Custom command migration complexity
- **Mitigation:** Dedicated pair programming sessions, helper library created

### Recommendations
- Continue current pace
- Add 1 more engineer for Phase 3 (complex tests)
- Plan retrospective for knowledge sharing
```

## Integration with Other Skills

### With `@kibana-precommit-checks`
```bash
# Before committing converted Scout tests
@kibana-precommit-checks --scope=scout
```

### With `@buildkite-ci-debugger`
```bash
# Debug Scout test failures during migration
@buildkite-ci-debugger --build <url> --focus scout
```

### With `@qa-browser-verification`
```bash
# Verify converted tests in real browsers
@qa-browser-verification --suite migration-phase-2
```

### With `@deep-dive`
```bash
# Research best practices for complex conversions
@deep-dive "Playwright advanced patterns for Scout tests"
```

## Examples

### Example 1: Analyze Cypress Migration Scope
**User:** "plan migration from Cypress to Scout for Security Solution"

**Agent Actions:**
1. Find all Cypress tests in `x-pack/solutions/security/`
2. Analyze complexity (custom commands, network mocking)
3. Estimate effort (story points per test)
4. Generate phased plan with risk assessment
5. Create markdown report with file manifest

**Output:** `security-cypress-to-scout-plan.md` with:
- 45 tests identified
- 12 high-complexity (custom commands)
- Estimated 8 sprints
- 3-phase rollout plan

### Example 2: Track API Versioning Migration Progress
**User:** "track migration progress for API versioning"

**Agent Actions:**
1. Count versioned vs unversioned routes
2. Check client adoption (version header usage)
3. Identify deprecated routes still in use
4. Generate burndown chart (markdown table)
5. Create stakeholder report

**Output:** `api-versioning-progress.md` with:
- 120/200 routes versioned (60%)
- 15 deprecated routes (removal scheduled Q2)
- Adoption rate by client (Dashboard: 80%, Lens: 60%)

### Example 3: Create Package Migration RFC
**User:** "create RFC for migrating alerting utilities to shared package"

**Agent Actions:**
1. Analyze alerting code for reusable utilities
2. Design package structure (`@kbn/alerting-utils`)
3. Identify circular dependency risks
4. Plan import updates (regex patterns)
5. Generate RFC document

**Output:** `rfc-alerting-utils-package.md` with:
- Package scope and public API
- Migration timeline (3 phases)
- Breaking change analysis
- Rollout strategy

## Tools & Commands

### Scope Analysis
```bash
# Find migration candidates
find x-pack -name "*.cy.ts" -o -name "*.cy.js"
find . -name "ftr_configs.js" -o -name "config.ts"
grep -r "router.versioned" x-pack | grep -v "version:"

# Complexity analysis
grep -r "cy.intercept\|cy.route" x-pack | wc -l
grep -r "getService\|getPageObjects" x-pack | wc -l
grep -r "await retry.try" x-pack | wc -l

# Dependency analysis
node scripts/check_circular_deps.js
```

### Progress Tracking
```bash
# Count conversions
find x-pack -name "*.scout.ts" | wc -l
git log --since="1 month ago" --oneline --grep="cypress.*scout" | wc -l

# Test pass rate
node scripts/scout run-tests --config <config> --reporter json > results.json
jq '.stats.passes, .stats.failures' results.json

# CI analysis
curl -s "https://api.buildkite.com/v2/organizations/elastic/pipelines/kibana/builds" \
  | jq '[.[] | select(.commit_id == "<sha>")] | .[0].state'
```

### Reporting
```bash
# Generate markdown reports
cat > report.md <<EOF
# Migration Progress: $(date +%Y-%m-%d)
$(find x-pack -name "*.scout.ts" | wc -l) tests converted
$(grep -r "TODO.*cypress" x-pack | wc -l) blockers remaining
EOF

# Create burndown data
echo "Sprint,Completed,Remaining" > burndown.csv
echo "1,10,40" >> burndown.csv
echo "2,25,25" >> burndown.csv
```

## Best Practices

### Planning
- Start with low-risk tests (no custom logic)
- Run both old and new tests in parallel (2 weeks minimum)
- Create conversion guide for team consistency
- Set clear success criteria per phase

### Execution
- Convert one test at a time
- Validate each conversion (run locally + CI)
- Keep Cypress tests until Scout stable
- Document conversion patterns (reusable)

### Tracking
- Update progress weekly (sprint review)
- Identify blockers immediately
- Adjust plan based on velocity
- Celebrate milestones (team morale)

### Reporting
- Tailor reports to audience (exec vs technical)
- Focus on business impact (reliability, speed)
- Be transparent about risks
- Provide concrete next steps

## Anti-Patterns

### ❌ Don't Do This
- Convert all tests at once (high risk)
- Remove old tests immediately (no rollback)
- Ignore team training (knowledge gap)
- Skip validation (broken CI)
- Over-promise timeline (pressure)

### ✅ Do This Instead
- Phased rollout (incremental risk)
- Run both in parallel (safety net)
- Pair programming (knowledge share)
- Validate every conversion (quality gate)
- Conservative estimates (buffer)

## Success Criteria

### Migration Complete When:
1. All target tests converted and passing
2. Old test suite removed from codebase
3. CI pipeline updated (no old test jobs)
4. Team trained on new patterns
5. Documentation updated (guides, examples)
6. Post-migration metrics meet goals (reliability, speed)

### Quality Gates:
- No increase in CI flakiness
- Test coverage maintained or improved
- No P1/P2 bugs introduced
- Team feedback positive (retro)

## Notes
- Migration planning is iterative (adjust as you learn)
- Stakeholder communication critical (set expectations)
- Technical debt paydown opportunity (improve patterns)
- Document lessons learned (next migration)
